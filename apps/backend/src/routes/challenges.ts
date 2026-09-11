import { Router } from "express";
import { prisma } from "../prisma";
import { sendError } from "../utils/errors";
import { createChallengeSchema } from "../validation/challenges";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

// POST /challenges — citizens only (PROJECT_REFERENCE.md §5 Session 3:
// "Citizen challenge submission form"). Always created with status
// SUBMITTED and no assignedPartnerId. §8 marks this route as eventually
// "auto-routed on creation", but that's Session 4's keyword-match
// categorization/routing job — deliberately not built yet, confirmed with
// frPyP before writing this (see PROJECT_STATUS.md Pass 8).
router.post("/", requireAuth, requireRole("CITIZEN"), async (req, res) => {
  const parsed = createChallengeSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { title, description, category, district } = parsed.data;

  const challenge = await prisma.challenge.create({
    data: {
      title,
      description,
      category,
      district,
      status: "SUBMITTED",
      citizenId: req.user!.id,
    },
  });

  res.status(201).json(challenge);
});

// GET /challenges — §8 says this returns "own for CITIZEN, assigned for
// PARTNER, all for ADMIN". Only the CITIZEN branch is built here: partner
// assignment doesn't exist until Session 4/5, and admin's "all" view is
// Session 7's dashboard job. Restricting to CITIZEN for now (rather than
// stubbing PARTNER/ADMIN branches that would always return an empty/full
// list with no real logic behind them) so this doesn't quietly become a
// partner or admin feature ahead of its session. Extend this when those
// sessions land.
router.get("/", requireAuth, requireRole("CITIZEN"), async (req, res) => {
  const challenges = await prisma.challenge.findMany({
    where: { citizenId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(challenges);
});

export default router;
