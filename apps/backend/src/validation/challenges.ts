import { z } from "zod";

// Matches PROJECT_REFERENCE.md §6's fixed category list exactly.
const CATEGORIES = [
  "EDUCATION",
  "AGRICULTURE",
  "HEALTHCARE",
  "WATER",
  "ENVIRONMENT",
  "ENERGY",
  "URBAN_DEVELOPMENT",
  "PUBLIC_ADMIN",
] as const;

// Matches §8: POST /challenges body. Session 3 scope only — no
// assignedPartnerId/status here, that's Session 4's auto-routing job
// (see PROJECT_STATUS.md's Pass log for why POST /challenges doesn't
// auto-route yet even though §8 marks it as eventually doing so).
export const createChallengeSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long."),
  description: z.string().trim().min(1, "Description is required."),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Choose a valid category." }),
  }),
  district: z.string().trim().min(1, "District is required."),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

// Session 5 (PROJECT_REFERENCE.md §5, §8): PATCH /challenges/:id/team —
// PARTNER only, sets the plain-text team field.
export const updateTeamSchema = z.object({
  team: z.string().trim().min(1, "Team is required."),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

// Session 5: PATCH /challenges/:id/status — PARTNER only. Only
// IN_PROGRESS and COMPLETED are ever valid *targets* here (a partner
// moves a challenge forward from ASSIGNED or IN_PROGRESS; they never set
// it back to SUBMITTED/ASSIGNED, and never skip a step — that's enforced
// separately in the route against the challenge's *current* status, not
// just against this list of allowed values).
const STATUS_TARGETS = ["IN_PROGRESS", "COMPLETED"] as const;

export const updateStatusSchema = z.object({
  status: z.enum(STATUS_TARGETS, {
    errorMap: () => ({ message: "Status must be IN_PROGRESS or COMPLETED." }),
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
