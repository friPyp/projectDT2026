import { Router } from "express";
import { prisma } from "../prisma";
import { sendError } from "../utils/errors";
import {
  createChallengeSchema,
  updateTeamSchema,
  updateStatusSchema,
} from "../validation/challenges";
import { requireAuth, requireRole } from "../middleware/auth";
import { categorize } from "../lib/categorize";
import { routeToPartner } from "../lib/routing";
import { notify } from "../lib/notify";
import { findPossibleDuplicates } from "../lib/dedup";

// Session 5 helper: PARTNER role's `req.user.id` is the *user* id, but
// challenges are linked via `assignedPartnerId` (the Partner row's id,
// not the user id) — see prisma/schema.prisma. Every partner-only route
// below needs the Partner row first. Returns null if somehow a PARTNER
// user has no partner row (shouldn't happen with seeded data, but don't
// assume).
async function getPartnerForUser(userId: string) {
  return prisma.partner.findUnique({ where: { userId } });
}

// Session 5: only forward, one-step-at-a-time transitions are valid.
// ASSIGNED -> COMPLETED directly, or anything backward, is rejected with
// INVALID_STATUS_TRANSITION per PROJECT_REFERENCE.md §8.
const VALID_TRANSITIONS: Record<string, string[]> = {
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
};

const router = Router();

// POST /challenges — citizens only (PROJECT_REFERENCE.md §5 Session 3:
// "Citizen challenge submission form"). As of Session 4, this now matches
// §8's "auto-routed on creation" annotation exactly: the keyword-match
// categorizer confirms/refines the citizen's chosen category, then the
// challenge is auto-routed to a matching seeded partner and created
// straight into ASSIGNED status. (Sessions 1-3 deliberately left this out
// of scope — see PROJECT_STATUS.md Pass 8 — this is where it belongs.)
// Priority-B addition: also runs a soft dedup check (lib/dedup.ts) and
// attaches `possibleDuplicates` to the response — never blocks creation.
router.post("/", requireAuth, requireRole("CITIZEN"), async (req, res) => {
  const parsed = createChallengeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { title, description, category, district, state, city, locality, address } = parsed.data;

  // Priority-B: dedup detection, checked *before* creating so the new
  // challenge never matches against itself. Per the call made when
  // this was scoped, this never blocks the submission — it's attached
  // to the response so the frontend can show a soft, dismissible
  // warning, nothing more.
  const possibleDuplicates = await findPossibleDuplicates(district, title, description);

  const finalCategory = categorize(title, description, category);
  const assignedPartnerId = await routeToPartner(finalCategory);

  const challenge = await prisma.challenge.create({
    data: {
      title,
      description,
      category: finalCategory,
      district,
      state,
      city,
      locality,
      address,
      status: assignedPartnerId ? "ASSIGNED" : "SUBMITTED",
      assignedPartnerId,
      citizenId: req.user!.id,
    },
  });

  // Session 6: CHALLENGE_ASSIGNED fires only when auto-routing actually
  // assigned a partner (i.e. status came out ASSIGNED, not the
  // near-impossible SUBMITTED fallback from routeToPartner returning
  // null — see lib/routing.ts). Goes to the citizen, per PROJECT_STATUS.md
  // §6 ("Citizen sees their own notifications").
  if (challenge.assignedPartnerId) {
    await notify(
      req.user!.id,
      "CHALLENGE_ASSIGNED",
      "Challenge assigned",
      `Your challenge "${challenge.title}" has been assigned to a partner.`
    );
  }

  res.status(201).json({ ...challenge, possibleDuplicates });
});

// GET /challenges — §8 says this returns "own for CITIZEN, assigned for
// PARTNER, all for ADMIN". CITIZEN branch is Session 3 (unchanged below).
// PARTNER branch added Session 5: only challenges assigned to *this*
// logged-in partner (per §7 checklist item 13 — never another partner's).
// ADMIN's "all" branch: completed as part of Priority-B admin manual
// reassignment — the admin needs to see every challenge to pick one to
// reassign, and §8 already documented this exact shape, it just hadn't
// been written yet (Session 7's dashboard used its own aggregate query
// instead, which still stands unchanged for GET /admin/dashboard).
router.get("/", requireAuth, requireRole("CITIZEN", "PARTNER", "ADMIN"), async (req, res) => {
  if (req.user!.role === "CITIZEN") {
    const challenges = await prisma.challenge.findMany({
      where: { citizenId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json(challenges);
  }

  if (req.user!.role === "ADMIN") {
    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(challenges);
  }

  // PARTNER
  const partner = await getPartnerForUser(req.user!.id);
  if (!partner) {
    return res.json([]);
  }
  const challenges = await prisma.challenge.findMany({
    where: { assignedPartnerId: partner.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(challenges);
});

// PATCH /challenges/:id/team — PARTNER only (§8). Sets the plain-text
// team field. A partner may only set the team on their own assigned
// challenges (§7 checklist item 13) — never one assigned to someone else.
router.patch("/:id/team", requireAuth, requireRole("PARTNER"), async (req, res) => {
  const parsed = updateTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const partner = await getPartnerForUser(req.user!.id);
  if (!partner) {
    return sendError(res, 403, "FORBIDDEN", "No partner profile linked to this account.");
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge) {
    return sendError(res, 404, "CHALLENGE_NOT_FOUND", "No challenge with that id.");
  }
  if (challenge.assignedPartnerId !== partner.id) {
    return sendError(res, 403, "FORBIDDEN", "This challenge isn't assigned to you.");
  }

  const updated = await prisma.challenge.update({
    where: { id: challenge.id },
    data: { team: parsed.data.team },
  });
  res.json(updated);
});

// PATCH /challenges/:id/status — PARTNER only (§8). Validated forward
// transitions only: ASSIGNED -> IN_PROGRESS -> COMPLETED. Skipping a step
// (or moving backward) is rejected with INVALID_STATUS_TRANSITION.
router.patch("/:id/status", requireAuth, requireRole("PARTNER"), async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const partner = await getPartnerForUser(req.user!.id);
  if (!partner) {
    return sendError(res, 403, "FORBIDDEN", "No partner profile linked to this account.");
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge) {
    return sendError(res, 404, "CHALLENGE_NOT_FOUND", "No challenge with that id.");
  }
  if (challenge.assignedPartnerId !== partner.id) {
    return sendError(res, 403, "FORBIDDEN", "This challenge isn't assigned to you.");
  }

  const allowedNext = VALID_TRANSITIONS[challenge.status] ?? [];
  if (!allowedNext.includes(parsed.data.status)) {
    return sendError(
      res,
      409,
      "INVALID_STATUS_TRANSITION",
      `Cannot move from ${challenge.status} to ${parsed.data.status} directly.`
    );
  }

  const updated = await prisma.challenge.update({
    where: { id: challenge.id },
    data: { status: parsed.data.status },
  });

  // Session 6: STATUS_UPDATED fires on every valid transition, to the
  // citizen who owns the challenge (not the partner making the change) —
  // per PROJECT_STATUS.md §6.
  await notify(
    updated.citizenId,
    "STATUS_UPDATED",
    "Status updated",
    `Your challenge "${updated.title}" is now ${updated.status}.`
  );

  res.json(updated);
});

export default router;
