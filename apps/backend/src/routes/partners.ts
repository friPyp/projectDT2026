import { Router } from "express";
import { prisma } from "../prisma";
import { sendError } from "../utils/errors";
import { requireAuth, requireRole } from "../middleware/auth";
import { createPartnerContactSchema } from "../validation/partners";

const router = Router();

// Same lookup pattern as routes/challenges.ts's getPartnerForUser: a
// PARTNER user's `req.user.id` is the *user* id, but PartnerContact rows
// are linked via `partnerId` (the Partner row's id) — see
// prisma/schema.prisma.
async function getPartnerForUser(userId: string) {
  return prisma.partner.findUnique({ where: { userId } });
}

// ORDER MATTERS: this must stay above GET /:id/contacts below, or Express
// matches "/me/contacts" as id="me" and returns PARTNER_NOT_FOUND (bug
// found and fixed in Pass 33).
// GET /partners/me/contacts — not in REFERENCE §8a's original list, added
// so the partner dashboard has a way to see its own channels to manage
// them (a partner user only knows their own userId, not their partnerId,
// until they've looked it up — same asymmetry routes/challenges.ts's
// getPartnerForUser already handles for other partner-only routes).
// Read-only, additive, mirrors the existing GET /partners/:id/contacts
// shape exactly. Logged in PROJECT_STATUS.md §7 and
// PROJECT_REFERENCE.md §9 as an addition beyond the original contract, same convention as
// GET /admin/partners before it.
router.get("/me/contacts", requireAuth, requireRole("PARTNER"), async (req, res) => {
  const partner = await getPartnerForUser(req.user!.id);
  if (!partner) {
    return sendError(res, 403, "FORBIDDEN", "No partner profile linked to this account.");
  }

  const contacts = await prisma.partnerContact.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(contacts);
});

// GET /partners/:id/contacts — PROJECT_REFERENCE.md §8a: "public to any
// authenticated user who can see that challenge." This route doesn't
// re-check which specific challenge the caller is looking at (no
// challengeId is passed) — any authenticated CITIZEN/PARTNER/ADMIN can
// look up any partner's declared contact channels by partner id, same
// as GET /admin/partners already exposes partner org info. Partner
// contact info isn't sensitive in the way a challenge's own content is,
// so this doesn't need the same ownership check as e.g.
// PATCH /challenges/:id/team.
router.get("/:id/contacts", requireAuth, async (req, res) => {
  const partner = await prisma.partner.findUnique({ where: { id: req.params.id } });
  if (!partner) {
    return sendError(res, 404, "PARTNER_NOT_FOUND", "No partner with that id.");
  }

  const contacts = await prisma.partnerContact.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "asc" },
  });
  res.json(contacts);
});

// POST /partners/me/contacts — PARTNER only, own record (§8a). Adds a
// new contact channel for the logged-in partner.
router.post("/me/contacts", requireAuth, requireRole("PARTNER"), async (req, res) => {
  const parsed = createPartnerContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const partner = await getPartnerForUser(req.user!.id);
  if (!partner) {
    return sendError(res, 403, "FORBIDDEN", "No partner profile linked to this account.");
  }

  const contact = await prisma.partnerContact.create({
    data: {
      partnerId: partner.id,
      label: parsed.data.label,
      value: parsed.data.value,
    },
  });
  res.status(201).json(contact);
});

export default router;
