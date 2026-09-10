import type { Response } from "express";

// Matches PROJECT_REFERENCE.md §8's frozen error shape exactly.
// Only the codes needed by Session 2 (auth) are used here —
// CHALLENGE_NOT_FOUND / INVALID_STATUS_TRANSITION / NO_MATCHING_PARTNER
// belong to later sessions and aren't referenced from this file.
export type ErrorCode = "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR";

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
