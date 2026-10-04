import type { ChallengeStatus } from "@prisma/client";

// Phase 2 Session 15 (PROJECT_REFERENCE.md §8a "Session 15 — decided
// design"): helpers for the per-partner ChallengeAssignment rows.

/**
 * The challenge's overall status, worked out from its assignments:
 * none -> SUBMITTED; all COMPLETED -> COMPLETED; all ASSIGNED -> ASSIGNED;
 * anything else -> IN_PROGRESS.
 */
export function deriveChallengeStatus(statuses: ChallengeStatus[]): ChallengeStatus {
  if (statuses.length === 0) return "SUBMITTED";
  if (statuses.every((s) => s === "COMPLETED")) return "COMPLETED";
  if (statuses.every((s) => s === "ASSIGNED")) return "ASSIGNED";
  return "IN_PROGRESS";
}

// Shape of the assignments include used by every route that returns
// challenges (kept here so the routes can't drift apart).
export const assignmentsInclude = {
  assignments: {
    select: { partnerId: true, status: true, assignedAt: true, partner: { select: { orgName: true } } },
    orderBy: { assignedAt: "asc" as const },
  },
};

type AssignmentRow = {
  partnerId: string;
  status: ChallengeStatus;
  assignedAt: Date;
  partner: { orgName: string };
};

/** Flattens the include above into the response shape { partnerId, orgName, status }. */
export function shapeAssignments(rows: AssignmentRow[]) {
  return rows.map((a) => ({ partnerId: a.partnerId, orgName: a.partner.orgName, status: a.status }));
}

/** Adds `assignments` (flattened) to a challenge loaded with assignmentsInclude. */
export function withAssignments<T extends { assignments: AssignmentRow[] }>(challenge: T) {
  return { ...challenge, assignments: shapeAssignments(challenge.assignments) };
}
