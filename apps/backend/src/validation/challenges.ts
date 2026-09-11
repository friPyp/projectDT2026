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
