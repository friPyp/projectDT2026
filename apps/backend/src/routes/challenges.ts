import { Router } from "express";
import { prisma } from "../prisma";
import { sendError } from "../utils/errors";
import {
  createChallengeSchema,
  updateTeamSchema,
  updateStatusSchema,
  updateChallengeSchema,
  createUpdateSchema,
} from "../validation/challenges";
import { requireAuth, requireRole } from "../middleware/auth";
import { categorize, pickDomains } from "../lib/categorize";
import { routeToPartners } from "../lib/routing";
import { assignmentsInclude, withAssignments, deriveChallengeStatus } from "../lib/assignments";
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

// Phase 2 Session 15: "is this partner assigned?" now means "has an
// assignment row" (PROJECT_REFERENCE.md §8a Session 15 design), since
// several partners can work on one challenge.
async function getAssignment(challengeId: string, partnerId: string) {
  return prisma.challengeAssignment.findUnique({
    where: { challengeId_partnerId: { challengeId, partnerId } },
  });
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
  const { title, description, category, district, state, city, locality, address, domains: pickedDomains } = parsed.data;

  // Priority-B: dedup detection, checked *before* creating so the new
  // challenge never matches against itself. Per the call made when
  // this was scoped, this never blocks the submission — it's attached
  // to the response so the frontend can show a soft, dismissible
  // warning, nothing more.
  const possibleDuplicates = await findPossibleDuplicates(district, title, description);

  const finalCategory = categorize(title, description, category);
  // Phase 2 Session 15: route on every relevant domain (primary first, then
  // the citizen's extra picks, then keyword suggestions, max 3). Each domain
  // goes to its own partner; duplicates are merged. `assignedPartnerId`
  // stays as the partner for the primary category, for the existing UI.
  const domains = pickDomains(title, description, finalCategory, pickedDomains ?? []);
  const partnerIds = await routeToPartners(domains);
  const assignedPartnerId = partnerIds[0] ?? null;

  const challenge = await prisma.challenge.create({
    data: {
      title,
      description,
      category: finalCategory,
      domains,
      district,
      state,
      city,
      locality,
      address,
      status: assignedPartnerId ? "ASSIGNED" : "SUBMITTED",
      assignedPartnerId,
      citizenId: req.user!.id,
      assignments: { create: partnerIds.map((partnerId) => ({ partnerId })) },
    },
    include: assignmentsInclude,
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

  res.status(201).json({ ...withAssignments(challenge), possibleDuplicates });
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
      include: assignmentsInclude,
    });
    return res.json(challenges.map(withAssignments));
  }

  if (req.user!.role === "ADMIN") {
    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      include: assignmentsInclude,
    });
    return res.json(challenges.map(withAssignments));
  }

  // PARTNER — Phase 2 Session 15: every challenge this partner holds an
  // assignment on, showing *this partner's own* status as `status` (the
  // challenge's overall status is still returned as `challengeStatus`).
  const partner = await getPartnerForUser(req.user!.id);
  if (!partner) {
    return res.json([]);
  }
  const challenges = await prisma.challenge.findMany({
    where: { assignments: { some: { partnerId: partner.id } } },
    orderBy: { createdAt: "desc" },
    include: assignmentsInclude,
  });
  res.json(
    challenges.map((c) => {
      const own = c.assignments.find((a) => a.partnerId === partner.id);
      return {
        ...withAssignments(c),
        status: own ? own.status : c.status,
        challengeStatus: c.status,
        myPartnerId: partner.id,
      };
    })
  );
});

// PATCH /challenges/:id — CITIZEN only, own challenge, Phase 2 Session 13
// (PROJECT_REFERENCE.md §8a "Session 13 — decided design"). In-place edit
// plus one append-only ChallengeEditLog row, written together in a single
// transaction so an edit can never exist without its log entry. An edit
// deliberately does NOT re-categorize, re-route, change status, notify, or
// re-run dedup. No-op edits (nothing actually differs) write nothing and
// leave updatedAt alone.
const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "state",
  "city",
  "locality",
  "address",
] as const;

router.patch("/:id", requireAuth, requireRole("CITIZEN"), async (req, res) => {
  const parsed = updateChallengeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge) {
    return sendError(res, 404, "CHALLENGE_NOT_FOUND", "No challenge with that id.");
  }
  if (challenge.citizenId !== req.user!.id) {
    return sendError(res, 403, "FORBIDDEN", "This isn't your challenge.");
  }
  if (challenge.status === "COMPLETED") {
    return sendError(res, 409, "CHALLENGE_COMPLETED", "This challenge is completed and can no longer be edited.");
  }

  // Keep only the fields that were sent AND actually differ.
  const data: Record<string, string | null> = {};
  const changedFields: Record<string, { before: string | null; after: string | null }> = {};
  for (const field of EDITABLE_FIELDS) {
    const next = parsed.data[field];
    if (next === undefined) continue;
    const before = challenge[field] ?? null;
    if (next === before) continue;
    data[field] = next;
    changedFields[field] = { before, after: next };
  }

  if (Object.keys(data).length === 0) {
    return res.json(challenge);
  }

  const [updated] = await prisma.$transaction([
    prisma.challenge.update({ where: { id: challenge.id }, data }),
    prisma.challengeEditLog.create({
      data: { challengeId: challenge.id, changedFields },
    }),
  ]);
  res.json(updated);
});

// GET /challenges/:id/edits — added beyond §8a (see §8a Session 13 block,
// logged in §9): PROJECT_REFERENCE.md §5a promises partners/admin can see
// what changed, and nothing else exposes the log. CITIZEN (own), PARTNER
// (only if assigned), ADMIN (any). Newest first.
router.get("/:id/edits", requireAuth, requireRole("CITIZEN", "PARTNER", "ADMIN"), async (req, res) => {
  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge) {
    return sendError(res, 404, "CHALLENGE_NOT_FOUND", "No challenge with that id.");
  }

  if (req.user!.role === "CITIZEN") {
    if (challenge.citizenId !== req.user!.id) {
      return sendError(res, 403, "FORBIDDEN", "This isn't your challenge.");
    }
  } else if (req.user!.role === "PARTNER") {
    const partner = await getPartnerForUser(req.user!.id);
    if (!partner) {
      return sendError(res, 403, "FORBIDDEN", "No partner profile linked to this account.");
    }
    if (!(await getAssignment(challenge.id, partner.id))) {
      return sendError(res, 403, "FORBIDDEN", "This challenge isn't assigned to you.");
    }
  }

  const edits = await prisma.challengeEditLog.findMany({
    where: { challengeId: challenge.id },
    orderBy: { editedAt: "desc" },
    select: { id: true, challengeId: true, editedAt: true, changedFields: true },
  });
  res.json(edits);
});

// Phase 2 Session 14 — partner status-note log (PROJECT_REFERENCE.md §5a,
// §6a, §8a). Append-only: there is deliberately no edit or delete route.
// Notes are separate from the status enum and never change it. Posting a
// note does not notify, re-route or touch the challenge row.

// GET /challenges/:id/updates — the owning CITIZEN, the assigned PARTNER,
// or any ADMIN. Newest first.
router.get("/:id/updates", requireAuth, requireRole("CITIZEN", "PARTNER", "ADMIN"), async (req, res) => {
  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
  if (!challenge) {
    return sendError(res, 404, "CHALLENGE_NOT_FOUND", "No challenge with that id.");
  }

  if (req.user!.role === "CITIZEN") {
    if (challenge.citizenId !== req.user!.id) {
      return sendError(res, 403, "FORBIDDEN", "This isn't your challenge.");
    }
  } else if (req.user!.role === "PARTNER") {
    const partner = await getPartnerForUser(req.user!.id);
    if (!partner) {
      return sendError(res, 403, "FORBIDDEN", "No partner profile linked to this account.");
    }
    if (!(await getAssignment(challenge.id, partner.id))) {
      return sendError(res, 403, "FORBIDDEN", "This challenge isn't assigned to you.");
    }
  }

  // Session 15: the notes are the shared thread for every assigned
  // partner, so each note carries the posting partner's org name.
  const updates = await prisma.challengeUpdate.findMany({
    where: { challengeId: challenge.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      challengeId: true,
      partnerId: true,
      note: true,
      createdAt: true,
      partner: { select: { orgName: true } },
    },
  });
  res.json(updates.map(({ partner, ...rest }) => ({ ...rest, partnerName: partner.orgName })));
});

// POST /challenges/:id/updates — PARTNER only, and only on a challenge
// currently assigned to them.
router.post("/:id/updates", requireAuth, requireRole("PARTNER"), async (req, res) => {
  const parsed = createUpdateSchema.safeParse(req.body);
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
  if (!(await getAssignment(challenge.id, partner.id))) {
    return sendError(res, 403, "FORBIDDEN", "This challenge isn't assigned to you.");
  }

  const created = await prisma.challengeUpdate.create({
    data: { challengeId: challenge.id, partnerId: partner.id, note: parsed.data.note },
    select: { id: true, challengeId: true, partnerId: true, note: true, createdAt: true },
  });
  res.status(201).json({ ...created, partnerName: partner.orgName });
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
  if (!(await getAssignment(challenge.id, partner.id))) {
    return sendError(res, 403, "FORBIDDEN", "This challenge isn't assigned to you.");
  }

  // Rejects re-saving the name the challenge already has (ignoring case
  // and surrounding spaces). Added on frPyP's request, 2026-09-29.
  if (challenge.team && challenge.team.trim().toLowerCase() === parsed.data.team.toLowerCase()) {
    return sendError(res, 400, "VALIDATION_ERROR", "That is already the current team name.");
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
  // Phase 2 Session 15: the calling partner moves only their own
  // assignment; the challenge's status is recomputed from all assignments
  // in the same transaction.
  const assignment = await getAssignment(challenge.id, partner.id);
  if (!assignment) {
    return sendError(res, 403, "FORBIDDEN", "This challenge isn't assigned to you.");
  }

  const allowedNext = VALID_TRANSITIONS[assignment.status] ?? [];
  if (!allowedNext.includes(parsed.data.status)) {
    return sendError(
      res,
      409,
      "INVALID_STATUS_TRANSITION",
      `Cannot move from ${assignment.status} to ${parsed.data.status} directly.`
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.challengeAssignment.update({
      where: { id: assignment.id },
      data: { status: parsed.data.status },
    });
    const all = await tx.challengeAssignment.findMany({
      where: { challengeId: challenge.id },
      select: { status: true },
    });
    return tx.challenge.update({
      where: { id: challenge.id },
      data: { status: deriveChallengeStatus(all.map((a) => a.status)) },
      include: assignmentsInclude,
    });
  });

  // Session 6: STATUS_UPDATED fires on every valid transition, to the
  // citizen who owns the challenge (not the partner making the change) —
  // per PROJECT_STATUS.md §6. Session 15: fires whenever any partner moves
  // their assignment, and says which partner did.
  await notify(
    updated.citizenId,
    "STATUS_UPDATED",
    "Status updated",
    `${partner.orgName} moved your challenge "${updated.title}" to ${parsed.data.status}. Overall status: ${updated.status}.`
  );

  res.json(withAssignments(updated));
});

export default router;
