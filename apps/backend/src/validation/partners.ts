import { z } from "zod";

// Phase 2 Session 12 (PROJECT_REFERENCE.md §5a/§8a): partner-declared
// contact channel. `label` is the partner's own free text (e.g. "Phone",
// "Email", "Office") — not a fixed enum, per §6a. `value` is the actual
// number/address/email itself.
export const createPartnerContactSchema = z.object({
  label: z.string().trim().min(1, "Label is required.").max(50, "Label is too long."),
  value: z.string().trim().min(1, "Value is required.").max(300, "Value is too long."),
});

export type CreatePartnerContactInput = z.infer<typeof createPartnerContactSchema>;
