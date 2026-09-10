import { Router } from "express";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";
import { sendError } from "../utils/errors";
import { registerSchema, loginSchema } from "../validation/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

const BCRYPT_COST = 10; // matches prisma/seed.ts's demo-account hashes

// Never send passwordHash back to the client.
function toSafeUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// POST /auth/register — citizens only. Role is hardcoded to CITIZEN;
// partner/admin accounts are seeded, never created through this endpoint
// (PROJECT_REFERENCE.md §2/§7).
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { name, phone, password, district } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return sendError(res, 400, "VALIDATION_ERROR", "An account with this phone number already exists.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const user = await prisma.user.create({
    data: { name, phone, passwordHash, role: "CITIZEN", district },
  });

  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({ user: toSafeUser(user), token });
});

// POST /auth/login — any role (citizen, partner, admin). Partner/admin
// accounts already exist from the seed script; this endpoint doesn't care
// which role it's logging in, it just verifies the password.
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input.");
  }
  const { phone, email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: phone ? { phone } : { email },
  });
  if (!user) {
    return sendError(res, 401, "UNAUTHORIZED", "Incorrect phone/email or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return sendError(res, 401, "UNAUTHORIZED", "Incorrect phone/email or password.");
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ user: toSafeUser(user), token });
});

// POST /auth/logout — JWT auth is stateless here (no refresh-token or
// server-side session table anywhere in the schema), so there's nothing to
// invalidate server-side. This just confirms the caller was holding a valid
// token; the actual "logout" is the frontend discarding it. Logged as a
// decision in PROJECT_STATUS.md since the contract doesn't spell out logout
// semantics.
router.post("/logout", requireAuth, (_req, res) => {
  res.json({ success: true });
});

export default router;
