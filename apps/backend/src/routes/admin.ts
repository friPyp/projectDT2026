import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireRole } from "../middleware/auth";

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

export default router;
