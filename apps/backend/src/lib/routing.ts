import type { Category } from "@prisma/client";
import { prisma } from "../prisma";

// Session 4 (PROJECT_REFERENCE.md §5, §2): "match the challenge's domain
// against seeded partner orgs' declared domains, assign automatically to
// one". §8's NO_MATCHING_PARTNER code says the fallback is "assign to a
// default/general partner if no domain match found" (not an error response
// to the citizen) — so this never throws, it always returns a partner id
// as long as at least one partner exists.
//
// Note: as seeded today (prisma/seed.ts), the 4 demo partners' `domains`
// between them cover all 8 categories with no gaps, so the fallback branch
// below shouldn't actually trigger against the current seed data — it's
// here to satisfy the frozen contract, not because it's expected to fire.
export async function routeToPartner(category: Category): Promise<string | null> {
  const match = await prisma.partner.findFirst({
    where: { domains: { has: category } },
    orderBy: { createdAt: "asc" },
  });
  if (match) {
    return match.id;
  }

  // Fallback: no partner declares this domain — assign to the
  // earliest-seeded partner as the "default/general" partner per §8.
  const fallback = await prisma.partner.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return fallback ? fallback.id : null;
}
