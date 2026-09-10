import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { verifyToken } from "../utils/jwt";
import { sendError } from "../utils/errors";

// Role is resolved ONLY from the verified JWT, never from anything the
// client sends in the request body — per PROJECT_REFERENCE.md §4's auth note.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return sendError(res, 401, "UNAUTHORIZED", "Missing or malformed Authorization header.");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return sendError(res, 401, "UNAUTHORIZED", "Invalid or expired token.");
  }
}

// Usage: requireAuth, then requireRole("PARTNER") on a route.
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Should never happen if requireAuth ran first, but don't assume.
      return sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    }
    if (!allowed.includes(req.user.role)) {
      return sendError(res, 403, "FORBIDDEN", "You don't have access to this action.");
    }
    next();
  };
}
