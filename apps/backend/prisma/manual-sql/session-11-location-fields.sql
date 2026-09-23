-- Phase 2 Session 11 (PROJECT_REFERENCE.md §5a/§6a): optional plain-text
-- location fields on challenges.
--
-- Run this ONCE in Neon's SQL editor BEFORE deploying the code from this
-- session. Purely additive: four new nullable columns, no existing row or
-- column is touched, nothing is dropped, safe to run on live data.
-- IF NOT EXISTS makes re-running harmless.
--
-- Why not `prisma migrate dev`: the original migration folder
-- (20260909050527_init) was never committed to the repo, so on a fresh
-- clone `migrate dev` would see the database's migration history as
-- drifted and offer to RESET the database. Do not accept a reset.
-- See PROJECT_STATUS.md, Pass 27.

ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "state"    TEXT;
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "city"     TEXT;
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "locality" TEXT;
ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "address"  TEXT;
