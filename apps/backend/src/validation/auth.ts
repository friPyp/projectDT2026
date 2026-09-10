import { z } from "zod";

// Matches PROJECT_REFERENCE.md §8: POST /auth/register body.
// Citizens only — role is never accepted from the client (see requireRole
// note in middleware/auth.ts); this endpoint always creates a CITIZEN.
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  phone: z.string().trim().min(6, "Enter a valid phone number."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  district: z.string().trim().min(1, "District is required."),
});

// Matches §8: POST /auth/login body — works for any seeded/registered role.
export const loginSchema = z
  .object({
    phone: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(1, "Password is required."),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: "Provide either phone or email.",
    path: ["phone"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
