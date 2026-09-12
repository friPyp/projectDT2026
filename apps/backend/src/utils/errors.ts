import type { Response } from "express";

// Matches PROJECT_REFERENCE.md §8's frozen error shape exactly.
// CHALLENGE_NOT_FOUND and INVALID_STATUS_TRANSITION added in Session 5
// (partner dashboard: team/status updates) — NO_MATCHING_PARTNER still
// isn't used anywhere (per lib/routing.ts it's a silent fallback, not an
// error response, so it may never need to be thrown from here).
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CHALLENGE_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION";

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
