import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Fail loudly at boot rather than silently signing with `undefined`.
  throw new Error("JWT_SECRET is not set in the environment (.env)");
}

export interface JwtPayload {
  sub: string; // user id
  role: Role;
}

// Demo project — a long-lived token is fine, no refresh-token flow needed
// (nothing in PROJECT_REFERENCE.md asks for one).
const TOKEN_EXPIRY = "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
}
