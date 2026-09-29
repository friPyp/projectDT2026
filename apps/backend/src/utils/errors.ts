import type { Response } from "express";

// Matches PROJECT_REFERENCE.md §8's frozen error shape exactly.
// CHALLENGE_NOT_FOUND and INVALID_STATUS_TRANSITION added in Session 5
// (partner dashboard: team/status updates) — NO_MATCHING_PARTNER still
// isn't used anywhere (per lib/routing.ts it's a silent fallback, not an
// error response, so it may never need to be thrown from here).
// NOTIFICATION_NOT_FOUND added Session 6 (notifications: PATCH .../read),
// same pattern as Session 5's additions — §8 lists error codes for the
// resources it names explicitly, this extends that set for the new
// resource rather than reusing CHALLENGE_NOT_FOUND, which would be
// misleading here.
// PARTNER_NOT_FOUND added Phase 2 Session 12 (routes/partners.ts),
// same pattern — GET /partners/:id/contacts with a bad id shouldn't
// come back as CHALLENGE_NOT_FOUND or a generic 404.
// CHALLENGE_COMPLETED added Phase 2 Session 13 (PATCH /challenges/:id on
// a COMPLETED challenge — 409), per PROJECT_REFERENCE.md §8a.
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CHALLENGE_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "NOTIFICATION_NOT_FOUND"
  | "PARTNER_NOT_FOUND"
  | "CHALLENGE_COMPLETED";

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string
) {
  res.status(status).json({
    success: false,
    error: { code, message },
  });
}
