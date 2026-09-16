import { Router } from "express";
import { prisma } from "../prisma";
import { sendError } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { reassignChallengeSchema } from "../validation/challenges";
import { notify } from "../lib/notify";

const router = Router();

// GET /admin/dashboard — ADMIN only (§8). Read-only counts, no workflow
// actions (§2: "admin is a dashboard viewer for MVP, not a workflow
// participant"). Deliberately a dedicated query here rather than reusing
// GET /challenges's "all" branch — that branch doesn't exist yet (see
// routes/challenges.ts, which is Session 3/5's working code and isn't
// touched by this pass), and a dedicated query is simpler for a read-only
// aggregate than adding an ADMIN branch to an existing role-aware route.
router.get("/dashboard", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const [totalChallenges, byDomainRaw, byStatusRaw, completedCount, engagedPartnerIds] =
    await Promise.all([
      prisma.challenge.count(),
      prisma.challenge.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.challenge.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.challenge.count({ where: { status: "COMPLETED" } }),
      prisma.challenge.findMany({
        where: { assignedPartnerId: { not: null } },
        select: { assignedPartnerId: true },
        distinct: ["assignedPartnerId"],
      }),
    ]);

  const byDomain: Record<string, number> = {};
  for (const row of byDomainRaw) {
    byDomain[row.category] = row._count._all;
  }

  const byStatus: Record<string, number> = {};
  for (const row of byStatusRaw) {
    byStatus[row.status] = row._count._all;
  }

  res.json({
    totalChallenges,
    byDomain,
    byStatus,
    partnersEngaged: engagedPartnerIds.length,
    completedCount,
  });
});

// GET /admin/partners — ADMIN only. Priority-B addition (not in the
// original §8 contract, documented there now under a clearly marked
// Priority-B section — see PROJECT_REFERENCE.md §9). Needed so the
// admin UI has something to pick from when reassigning a challenge.
router.get("/partners", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const partners = await prisma.partner.findMany({
    orderBy: { orgName: "asc" },
    select: { id: true, orgName: true, type: true, domains: true },
  });
  res.json(partners);
});

// PATCH /admin/challenges/:id/reassign — ADMIN only. Priority-B: admin
// manual reassignment. Overrides whatever auto-routing (or a prior
// reassignment) had set. Per the call made when this was scoped:
// reassigning resets status to ASSIGNED and clears any team name, since
// the new partner is starting fresh from the top of the workflow — and
// the new partner gets a CHALLENGE_ASSIGNED notification, same as the
// automatic routing path (see lib/notify.ts's updated comment). The
// previous partner is not notified — only asked about the new one when
// this was scoped, not left as a silent decision.
router.patch(
  "/challenges/:id/reassign",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const parsed = reassignChallengeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
    }
    const { partnerId } = parsed.data;

    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!challenge) {
      return sendError(res, 404, "CHALLENGE_NOT_FOUND", "No challenge with that id.");
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) {
      return sendError(res, 400, "VALIDATION_ERROR", "That partner doesn't exist.");
    }

    const updated = await prisma.challenge.update({
      where: { id: challenge.id },
      data: { assignedPartnerId: partnerId, status: "ASSIGNED", team: null },
    });

    await notify(
      partner.userId,
      "CHALLENGE_ASSIGNED",
      "Challenge assigned",
      `A challenge ("${updated.title}") has been assigned to your organization.`
    );

    res.json(updated);
  }
);

export default router;
