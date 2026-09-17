# PROJECT_STATUS.md — SIH26043

> **How this file works:** rewritten in full after every single pass by whoever
> just worked, before they stop. Not a periodic changelog. Anyone pulling the
> repo — teammate or a fresh chat session — should be able to read this file
> alone and know exactly what state things are in, who to ask, and what to do
> next. Commit this file in the same commit as the code it describes.
>
> **3-person rule:** always `git pull` before starting a pass and `git push`
> right after updating this file. If two people worked at the same time, the
> git conflict on THIS file is a feature — it's how you notice it happened.

> ⚠️ **HANDOFF NOTE — 2026-09-16, frPyP:** new urgent requirements have
> come in from outside this chat that will need rearchitecting parts of
> this project. The details were **not** given to the chat session that
> wrote this file — get them from frPyP directly before resuming any
> Priority-B work below, and don't assume the current schema/API
> contract/architecture is still the target until that's confirmed.
> Everything in this file reflects state as of Pass 21, working tree
> clean, nothing uncommitted, written *before* this news arrived.

---

## 0. Session log (append one entry per pass — never delete old entries)

### Pass 1 (in progress, checkpoint push) — 2026-09-09 — frPyP — Session 1 scaffold, partially verified
Branch/commit: main (direct push, checkpoint mid-session — more coming same session)
Did:
- Set up pnpm-workspace monorepo (`apps/backend`, `apps/frontend`)
- Wrote full Prisma schema (`apps/backend/prisma/schema.prisma`) covering
  users, partners, challenges, notifications per REFERENCE §6
- Wrote seed script (`apps/backend/prisma/seed.ts`): 1 citizen, 1 admin,
  4 partners (one per domain cluster)
- Wrote minimal backend boot code (`src/index.ts`, `src/prisma.ts`) —
  intentionally just an Express server + `/api/v1/health` DB-ping route,
  no real API routes yet (those are session 2+, staying in scope)
- Scaffolded frontend with Vite React-TS template, then added Tailwind
  (v4, via @tailwindcss/vite), React Router, React Hook Form, Zod, and
  TanStack Query per REFERENCE §4. Wired up a minimal `main.tsx`/`App.tsx`
  that boots Router + QueryClientProvider + Tailwind together — placeholder
  only, no real pages (session 3's job)
Files touched: see commit diff — all new files, nothing pre-existing touched
Decisions made:
- Resolved a conflict in PROJECT_REFERENCE.md itself: §6 schema had no
  `district` field on `users`, but §8's `/auth/register` contract expects
  one. Flagged to frPyP, decided: **add `district` (nullable String) to the
  User model** — nullable because partner/admin seed accounts don't have one.
  This should be reflected in PROJECT_REFERENCE.md §6 by whoever edits it
  next (not done yet — flagging here per the "append a note" rule in
  REFERENCE §9).
- Backend deps beyond what REFERENCE §4 names explicitly: added `cors`,
  `dotenv`, `bcryptjs` (not `bcrypt`, to avoid native-compile issues),
  `jsonwebtoken` — all standard, small supporting libraries required to
  actually implement the already-approved stack (Express + JWT + Prisma),
  not architectural changes. Flagged to frPyP in-chat, not objected to.
- Used pnpm 9 (not the newest pnpm major) because pnpm 10+'s new
  build-script-approval gate couldn't be satisfied non-interactively in the
  dev sandbox used for this session. Pure tooling choice, doesn't affect the
  actual stack.
Deviations from spec: none beyond the district fix above.
Bugs found/fixed: n/a yet — no runtime testing possible for DB-touching code
  (see below).
Left in a broken/incomplete state:
- **Migration confirmed applied against the real Neon database** (frPyP ran
  it via Termux + proot-distro Ubuntu, since Prisma's engine can't run
  directly on Termux's Android environment or in the dev sandbox used
  earlier in this session — both needed a real Linux environment).
  Prisma's own output confirmed: "Your database is now in sync with your
  schema." This is a genuine, verified result — not sandbox-only.
- **Seed script failed on that same run** — not a data/logic bug, a missing
  config: `apps/backend/package.json` didn't have the `"prisma": { "seed":
  ... }` block Prisma's CLI needs to know how to invoke `prisma/seed.ts`.
  **Fixed** in this pass (added `"prisma": { "seed": "tsx prisma/seed.ts" }`
  to `apps/backend/package.json`). Not yet re-run/confirmed after the fix —
  that's the very next thing to do.
- `apps/backend/src/prisma.ts` was earlier type-checked in the dev sandbox
  against a generic Prisma client stub, not real generated types. Now that
  `prisma generate` has actually run successfully against the real schema
  (confirmed by the migration run above), this concern is resolved — real
  types exist now.
- Frontend `pnpm build` and `pnpm dev` (HTTP 200, root page served) were
  both verified working with Tailwind + Router + TanStack Query wired in —
  this part of Session 1 is genuinely done.
Anything the next person picking this up needs to know:
- Migration is done and confirmed against the real Neon database. The only
  remaining step is: `cd apps/backend`, `npx prisma db seed` (now that the
  config fix is in place), then confirm `GET /api/v1/health` returns
  `{ success: true, db: "connected" }`. This needs a real Linux environment
  (a normal machine, or Termux + proot-distro Ubuntu on Android) — plain
  Termux alone fails with an "unknown OS android" error from Prisma, and
  the dev sandbox used earlier in this session can't reach Prisma's engine
  download host at all.

### Pass 2 — 2026-09-09 — Preza — Fixed accidental root package.json overwrite; DB step still blocked in this environment
Branch/commit: main (direct push)
Did:
- Cloned the repo fresh and read PROJECT_REFERENCE.md, PROJECT_STATUS.md,
  and TEAM_WORKFLOW.md, plus full commit history, before touching anything
- Found that the most recent commit at the time (`25c8d1a "Update
  package.json"`) had accidentally overwritten the **root** `package.json`
  with a verbatim copy of `apps/backend/package.json`'s content. This
  deleted the monorepo workspace scripts (`dev:backend`, `dev:frontend`,
  `build:backend`, `build:frontend`) and caused a package-name collision
  (`"name": "backend"` at both root and `apps/backend`), which breaks
  `pnpm --filter backend ...` commands. This wasn't logged as intentional
  work in this file, so it was flagged and confirmed as a mistake before
  fixing.
- Restored the root `package.json` to its correct monorepo-workspace form
  (same content as commit `31d4195`, before the accidental overwrite).
  `apps/backend/package.json` was not touched — it already had the correct
  content, including the `"prisma": { "seed": ... }` fix from Pass 1.
- Verified the fix: `pnpm install` now resolves all 3 workspace projects
  (root, backend, frontend) cleanly with no name collision. Frontend
  typechecks clean (`tsc --noEmit`). Backend typecheck is blocked only by
  `@prisma/client` not having run its generate step in this sandbox — same
  documented limitation as Pass 1 (this sandbox, like the one in Pass 1,
  cannot reach Prisma's engine-download host over the network), not a new
  bug introduced by this fix.
Files touched: `package.json` (root) only.
Decisions made: none requiring a call — the package.json issue was a clear
  accidental overwrite, not a design choice, so it was fixed rather than
  flagged as a decision.
Deviations from spec: none.
Bugs found/fixed:
- Fixed: accidental root `package.json` overwrite (see above).
Left in a broken/incomplete state:
- **The actual Session 1 closing task (re-run seed, confirm health check)
  is still not done.** This working environment cannot reach the Neon
  database or Prisma's engine-download host (both outside its network
  allowlist), so it could not be completed from here. Exact commands to
  run on a real Linux environment (fresh clone through health check) were
  handed off in-chat — see below for the short version.
Anything the next person picking this up needs to know:
- On a real Linux environment (a normal machine, or Termux + proot-distro
  Ubuntu):
  ```
  cd apps/backend
  npx prisma generate
  npx prisma db seed
  pnpm dev   # in one terminal
  curl http://localhost:4000/api/v1/health   # in another
  ```
  Expect `{ success: true, db: "connected" }`. Once that's confirmed,
  Session 1 is fully closed and Session 2 (auth) can start. Nothing else
  from Session 1 needs redoing — migration, schema, and frontend scaffold
  are all still confirmed good from Pass 1.

### Pass 3 — 2026-09-09 — frPyP — Correction: the seed config fix was never actually committed until now
Branch/commit: main (direct push)
Did:
- Investigated why `npx prisma db seed` still failed with the "missing
  prisma.seed config" error even after Pass 1 and Pass 2 both claimed it
  was fixed. Traced it carefully:
  - Pass 1's fix to `apps/backend/package.json` was made locally in that
    session but **never actually committed or pushed** — the session got
    interrupted before `git commit`/`git push` ran.
  - Separately, frPyP tried to add a similar fix directly via GitHub's web
    UI, but pasted the content into the wrong file — the **root**
    `package.json` instead of `apps/backend/package.json` (commit
    `25c8d1a`). This is what Pass 2 (Preza) correctly caught and fixed —
    but Preza reasonably assumed, since the pasted content looked like a
    backend package.json, that the real `apps/backend/package.json`
    already had the fix too. It didn't — that assumption was the one gap.
  - Net effect: no commit in this repo's history had ever actually added
    the `"prisma": { "seed": ... }` block to `apps/backend/package.json`,
    despite two separate session logs claiming it was done.
- Actually added and pushed the fix this time (verified staged content,
  valid JSON, committed, pushed, confirmed on `origin/main` afterward).
Files touched: `apps/backend/package.json` only.
Decisions made: none requiring a call — straightforward bug, fixed directly.
Deviations from spec: none.
Bugs found/fixed:
- Fixed: `apps/backend/package.json` was genuinely missing the
  `"prisma": { "seed": "tsx prisma/seed.ts" }` block this whole time,
  despite being reported as fixed twice before. Confirmed fixed now by
  reading the pushed commit content directly from `origin/main`.
Left in a broken/incomplete state:
- Same as before: seed has still not been successfully run and confirmed.
  This should now actually work — untested as of this entry.
Anything the next person picking this up needs to know:
- **Don't trust "fixed, confirmed" claims in this file at face value if the
  actual symptom recurs** — verify by reading the real file content (e.g.
  `git show origin/main:path/to/file`), not just by reading a previous
  session's description of what they believed they fixed. That's exactly
  what went wrong here twice in a row.
- Next step is still: `cd apps/backend`, `npx prisma db seed`, then the
  health check. Should work now — genuinely untested.

### Pass 4 — 2026-09-10 — frPyP — Config fix confirmed working; hit a real environment blocker with Prisma's query engine under proot; pivoted to raw SQL, unresolved
Branch/commit: main (direct push) — this entry only, no code changes needed
Did:
- Confirmed the Pass 3 fix worked: `npx prisma db seed` on the real Termux +
  proot-distro Ubuntu setup got past the config error cleanly this time.
- Hit a **new, separate, genuine blocker**: every attempt to actually run
  the seed (or even `prisma migrate status`) failed with `P1001: Can't
  reach database server`, despite raw TCP connectivity (`nc -zv`)
  succeeding every single time against the same host. Tried, in order:
  waking the suspended Neon compute via the dashboard; switching from the
  pooled (`-pooler`) connection string to the direct one; forcing IPv4 via
  `/etc/gai.conf`; hardcoding the IPv4 IP in `/etc/hosts`; dropping
  `channel_binding=require`; adding `pgbouncer=true` back on the pooler
  connection. **None of it fixed it** — including re-testing the exact
  pooler connection string that had worked for the original migration,
  which now also failed the same way.
- Working theory (not proven): Prisma's query-engine binary has some
  incompatibility with the `proot` sandboxing layer Termux uses to run
  Ubuntu — note that `prisma migrate` (a different engine binary,
  schema-engine) worked fine earlier in this same environment, so it's
  plausible the two engines behave differently under `proot`, though this
  was never fully confirmed since even schema-engine failed on a later
  retry. Genuinely inconclusive — could also be something environmental
  that changed between attempts (network, Neon-side compute state, etc.).
  Whoever picks this up should treat this as unresolved, not root-caused.
- Pivoted to a workaround: skip Prisma's engine for seeding entirely, and
  insert the demo accounts directly via Neon's own web SQL editor (runs on
  Neon's infrastructure, no phone/proot/network variable involved). Wrote
  the equivalent raw SQL (matching `prisma/seed.ts`'s data and using the
  same bcrypt hash for `Demo@1234`) and had frPyP run it there.
- **That attempt also failed** — Neon's SQL editor reported "Failed
  transaction: ROLLBACK required" with an error under a results tab that
  was not yet read before the session paused to consider next steps.
Files touched: none (all troubleshooting was against `.env`/environment
  config on the Termux device, never committed — `.env` is gitignored).
Decisions made: frPyP asked whether Session 2 could start in parallel (a
  different Claude session) while this is unresolved. Answered honestly:
  per the project's own rule against building ahead of the current phase,
  Session 1 isn't formally closed yet. The practical middle ground offered:
  Session 2's auth *code* (register/login/JWT) can reasonably be written
  and reviewed without live seeded data, but won't be fully testable
  end-to-end (especially partner/admin login) until this is resolved.
  frPyP's call on whether to proceed — not yet confirmed as of this entry.
Deviations from spec: none.
Bugs found/fixed: none fixed this pass — see "Left in a broken/incomplete
  state" below.
Left in a broken/incomplete state:
- **Seed data is still not in the database.** Two independent approaches
  (Prisma's engine directly, and raw SQL via Neon's own editor) have both
  failed so far. This is now the single blocking item for Session 1.
- The raw SQL attempt's actual error was never read — that's the most
  promising immediate next step, since Neon's own SQL editor removes the
  proot/network variables entirely and a SQL-level error (constraint
  violation, type mismatch, etc.) would be a much simpler, more concrete
  problem than the "can't reach server" one.
Anything the next person picking this up needs to know:
- **Read the actual error under the "2: ERROR" tab in Neon's SQL editor
  result first** — likely something like an enum type name mismatch, a
  quoting issue, or a constraint violation in the hand-written SQL (in
  this repo's `seed.sql`-equivalent, generated in-chat, not committed to
  the repo). Fix and re-run from Neon's editor directly — no phone, no
  proot, no Prisma engine involved, so this path should be far more
  reliable once the SQL itself is correct.
- If that raw-SQL path is fixed and confirmed (verify with
  `SELECT email, role FROM users;` returning 6 rows), Session 1 is done —
  the migration was already the requirement that needed Prisma's engine;
  getting the actual row data in doesn't have to go through Prisma at all.
- If someone wants to keep debugging the Prisma-engine-under-proot issue
  instead (not necessary, but useful to know for the team's future Termux
  workflows): the next diagnostic step would be running the exact same
  `prisma migrate status` command back-to-back several times in a row to
  see if it's intermittent (flaky network/compute-wake timing) vs. a hard
  failure every time (real incompatibility).

### Pass 5 — 2026-09-10 — frPyP — Session 1 CLOSED: seed data confirmed in via raw SQL; Prisma-engine-under-proot confirmed as a real, isolated environment issue
Branch/commit: main (direct push, this entry only)
Did:
- Fixed the raw-SQL seed script from Pass 4: the actual error was a type
  mismatch (`type` column needed `::"PartnerType"` cast, only `domains` had
  been cast to its enum). One-line-per-value fix, re-ran in Neon's SQL
  editor. **Succeeded** — `SELECT email, role FROM users` confirmed all 6
  demo accounts present (1 citizen, 1 admin, 4 partners).
- Ran one more test to isolate the Prisma/proot issue definitively: with
  the database now confirmed awake (just queried directly seconds before),
  retried the backend's own `/api/v1/health` endpoint (which uses
  `PrismaClient`/`$queryRaw`, same engine `db seed` uses) via
  `npx tsx src/index.ts` + `curl` in the same Termux/proot session.
  **Still failed** — `{"success":false,"db":"unreachable"}` — while the
  exact same database was simultaneously reachable and queryable through
  Neon's own web SQL editor. This confirms the issue is real and isolated:
  Prisma's query-engine binary specifically cannot make outbound DB
  connections from inside this `proot`-based Ubuntu-on-Termux setup,
  regardless of whether the database itself is awake and reachable by
  every other measure (raw TCP, Neon's own tools). Not a database problem,
  not a schema problem, not a credentials problem — a `proot` + Prisma
  native-engine incompatibility, isolated to this specific phone-based dev
  setup.
- Given that: schema is correct, migration is applied and confirmed, seed
  data is confirmed present in the real database — the three things
  Session 1 actually required — closing Session 1 as done. The health-check
  step's *purpose* (proving the app can connect to the DB) is not actually
  in doubt; only *this specific phone's ability to run Prisma's engine* is.
Files touched: none (all verification was against the live database and a
  Termux-local test server; nothing committed to the repo needed changing
  once the SQL fix above was applied directly in Neon's editor, not this
  repo).
Decisions made: frPyP + Claude agreed Session 1 is done despite the
  health-check never passing *on this phone specifically* — the underlying
  thing it was meant to verify (schema/migration/data are real and
  reachable) has been proven true via other means (Neon's own SQL editor).
  Whoever next runs the backend on a normal machine should expect the
  health check to just work there — this was never a code or data problem.
Deviations from spec: none.
Bugs found/fixed:
- Fixed: the Pass 4 raw-SQL seed script's `type` column value wasn't cast
  to the `PartnerType` enum (SQLSTATE 42804). One-line fix per partner row.
Left in a broken/incomplete state:
- **Open, low-priority, environment-specific:** Prisma's query-engine
  binary does not work under Termux + proot-distro Ubuntu on this phone,
  even though the schema-engine binary (used by `migrate`) worked at least
  once. If the team keeps using phones for dev work, this will resurface
  for anyone trying to run the backend itself (not just seed scripts) from
  a phone. Not blocking any current work — just worth knowing. No further
  investigation planned unless someone specifically needs to run the full
  backend from a phone.
Anything the next person picking this up needs to know:
- **Session 1 is done.** Schema, migration, and seed data are all confirmed
  real and correct against the actual Neon database (verified via Neon's
  own SQL editor, not just assumed). Session 2 (auth) can start for real.
- If running the backend itself from a phone (Termux + proot), expect the
  Prisma-based DB connection to fail even when everything else works —
  this is a known, isolated environment quirk (see above), not a signal
  that something is broken. Run the backend from a normal computer instead
  when that matters (e.g. actually testing auth end-to-end).
- The demo account passwords are the same as documented in §10 below
  (`Demo@1234`), and the hash was generated fresh in Pass 4/5 with
  `bcryptjs` at cost 10, matching exactly what `prisma/seed.ts` would have
  produced — logging in with these should work identically to if the
  seed script itself had run successfully.

### Pass 6 — 2026-09-10 — devansh4281 — Session 2 (auth) code written; correctness typechecked, live DB flow not verified in this environment
Branch/commit: main (direct push)
Did:
- Pulled latest first (fast-forward, no conflicts) and read full commit
  history, PROJECT_REFERENCE.md, and this file before touching anything.
- Wrote Session 2 exactly to scope (§5): citizen register, login for any
  seeded/registered role, JWT issuing, verification middleware, role
  enforcement. Nothing from Session 3 (submission) touched.
- New files: `src/utils/jwt.ts` (sign/verify), `src/utils/errors.ts`
  (shared error-response helper matching §8's frozen error shape exactly),
  `src/middleware/auth.ts` (`requireAuth`, `requireRole(...roles)` — role
  is read only from the verified JWT, never from the request body, per
  §4's auth note), `src/validation/auth.ts` (zod schemas for register/login
  bodies), `src/routes/auth.ts` (`POST /auth/register`, `/auth/login`,
  `/auth/logout`, matching §8's shapes exactly).
- Modified: `src/index.ts` — mounted the new auth router at
  `/api/v1/auth`. Did not touch the existing `/api/v1/health` route or
  anything else already working.
- Also closed an outstanding doc gap from Pass 1: added the `district`
  field to PROJECT_REFERENCE.md §6 (it was in the real schema/DB since
  Session 1 but never reflected in that doc) and logged it in that file's
  own §9 change log. No behavior change, doc-only.
Files touched: `apps/backend/src/index.ts`,
  `apps/backend/src/{utils/jwt.ts, utils/errors.ts, middleware/auth.ts,
  validation/auth.ts, routes/auth.ts}` (all new), `PROJECT_REFERENCE.md`
  (§6, §9). Nothing already-marked-done was rewritten.
Decisions made:
- No new libraries needed — bcryptjs, jsonwebtoken, zod, cors, express
  were all already approved/installed dependencies from Session 1, so
  nothing required flagging here.
- `POST /auth/logout` semantics aren't specified in §8 beyond the route
  existing. There's no session table or refresh-token anywhere in the
  schema, so JWT auth here is fully stateless — decided logout just means
  "confirm the caller held a valid token" (200 if so); the actual logout
  is the frontend discarding the token client-side. Flagging this here in
  case a teammate expected server-side token invalidation — that would be
  new infrastructure (a token blacklist / session table) not asked for
  anywhere in PROJECT_REFERENCE.md, so it wasn't built.
- `/auth/register` hardcodes `role: "CITIZEN"` server-side and ignores any
  role field even if one were sent — matches §4's "never trust a role from
  the frontend" rule directly, not really a discretionary call.
Deviations from spec: none.
Bugs found/fixed: none (no pre-existing auth code to have bugs in).
Left in a broken/incomplete state:
- **Not actually verified against the real Neon database or a running
  server.** This working environment's network allowlist blocks both
  Prisma's engine-download host (`binaries.prisma.sh`) and Neon's host
  directly — confirmed by actually running `pnpm install` (succeeds) then
  `npx prisma generate` (fails: `403 Forbidden` fetching the query-engine
  binary, same with `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` set). This
  is a different root cause than Session 1's Termux/proot issue, but the
  same category of problem: this specific dev environment cannot run
  Prisma's engine, full stop.
- Ran `npx tsc --noEmit` anyway to catch any real bugs independent of that:
  **zero errors in the new auth code itself.** The only 3 errors reported
  are `@prisma/client` not exporting `Role`/`User` — those are types that
  `prisma generate` produces from the schema, and generate never completed
  here for the network reason above. Not a logic bug; will resolve on its
  own the moment `prisma generate` runs somewhere with real network access.
- Per PROJECT_REFERENCE.md §4 ("Testing: Manual checklist, no test
  framework"), the fix for the above isn't to build a mock-DB test harness
  in this sandbox — that would itself be scope creep (a testing tool the
  spec explicitly says not to use). The fix is: run the real manual
  checklist steps below on a machine that can actually reach Neon.
Anything the next person picking this up needs to know:
- **Before trusting this is done, actually run it** — this file has twice
  before (Pass 1, Pass 2) reported a fix as done when it wasn't; don't
  repeat that here. Verify like this, on a normal machine or any
  environment with real internet access (not this sandbox):
  ```
  git pull
  cd apps/backend
  pnpm install
  npx prisma generate          # should succeed with real network access
  pnpm dev                     # starts on :4000
  ```
  Then, in another terminal:
  ```
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"phone":"9990000001","password":"Demo@1234"}'
  ```
  (swap in whichever seeded citizen phone/email is actually in the DB —
  see §10). Expect `{ "user": {...}, "token": "..." }`. Also try:
  registering a brand-new citizen via `POST /auth/register`, logging in
  as a seeded partner/admin by email, and hitting a route with
  `requireRole` after removing the `Authorization` header to confirm it
  returns the `UNAUTHORIZED` shape from §8.
- If `prisma generate` fails on a real machine too, that's a genuinely new
  problem (not the one described above) and worth its own log entry.
- Session 3 (citizen submission form + dashboard) is next once the above
  is actually confirmed working — see §6.

### Pass 7 — 2026-09-10 — frPyP — Session 2 (auth) CLOSED: verified for real against the live server + Neon database
Branch/commit: main (direct push, this entry only, no code changes needed)
Did:
- Pulled latest first — already up to date, no conflicts.
- Ran the exact verification steps left at the end of Pass 6, this time on
  a normal machine with real internet access (not a sandboxed environment):
  - `pnpm install` initially hit `ERR_PNPM_IGNORED_BUILDS` (a newer local
    pnpm version has a build-script-approval gate PROJECT_STATUS.md §2 had
    flagged as a pnpm-10+ issue). Fixed by running `pnpm approve-builds`
    and re-running install — not a code problem, a one-time local machine
    setup step.
  - `npx prisma generate` succeeded cleanly against the real engine-download
    host (no `403`/checksum errors — confirms Pass 6's blocker really was
    just that sandbox's network allowlist, not a real problem).
  - `pnpm dev` booted the server on :4000.
  - `GET /api/v1/health` → `{"success":true,"db":"connected"}`.
  - Logged in as the seeded citizen (by phone), seeded admin (by email),
    and seeded partner1 (by email) — all three returned the correct
    `{ user, token }` shape from §8, correct roles, correct data.
  - Registered a brand-new citizen via `POST /auth/register` — succeeded,
    hardcoded `role: "CITIZEN"` as expected, `email: null` since none was
    given (schema allows this — phone was provided instead).
  - `POST /auth/logout` with a valid citizen token → `{"success":true}`.
  - `POST /auth/logout` with no token → the exact `UNAUTHORIZED` error
    shape from §8 (`{"success":false,"error":{"code":"UNAUTHORIZED",...}}`),
    not a crash or an unrelated 404 page.
Files touched: none (verification only, no code changed).
Decisions made: none requiring a call.
Deviations from spec: none.
Bugs found/fixed: none — Session 2's auth code, written in Pass 6, worked
  correctly on the first real attempt against the live database.
Left in a broken/incomplete state: nothing from Session 1 or 2.
Anything the next person picking this up needs to know:
- **Session 2 is done and genuinely confirmed** — every endpoint in §8's
  Auth section works against the real Neon database, matches the frozen
  contract exactly, and role enforcement / unauthorized handling both
  behave correctly.
- If a fresh machine hits `ERR_PNPM_IGNORED_BUILDS` on `pnpm install`, that's
  expected on newer pnpm — run `pnpm approve-builds`, approve the 4 flagged
  packages (`@prisma/client`, `@prisma/engines`, `esbuild`, `prisma`), then
  re-run `pnpm install`. Not a bug.
- Session 3 (citizen submission form + dashboard) starts next — see §6.

---

### Pass 8 — 2026-09-12 — frPyP — Session 3 (citizen submission + dashboard) built and confirmed working end-to-end
Branch/commit: main, two commits (`45c11ab` backend, `d8f36da` frontend)
Did:
- Flagged and resolved a conflict before writing any code: §8's frozen
  contract marks `POST /challenges` as "auto-routed on creation", but this
  file's own Session 3/4 split says auto-routing is Session 4's job.
  Confirmed with frPyP: **stay in-phase** — `POST /challenges` creates with
  `status: SUBMITTED` and no `assignedPartnerId` for now; real auto-routing
  arrives properly in Session 4, not folded in here.
- Backend: `POST /api/v1/challenges` (CITIZEN only, via `requireRole`) and
  `GET /api/v1/challenges` (CITIZEN only for now — returns the caller's own
  challenges). PARTNER/ADMIN branches of `GET /challenges` deliberately not
  built (those are Sessions 5/7's dashboards, not Session 3's).
  `src/validation/challenges.ts` added, matching the frozen category enum.
- Frontend (none existed before this pass — Session 2 was backend-only):
  `/login`, `/register` pages; `/submit` (citizen challenge submission
  form); `/dashboard` (own challenges + status badges). Added
  `src/lib/api.ts` (fetch wrapper + typed helpers), `src/lib/auth.tsx`
  (React context wrapping token/user in localStorage — nothing
  security-sensitive lives here, every real permission check happens
  server-side per §4's auth note), `src/lib/challengeLabels.ts`
  (category/status → display label maps), `AppLayout` + `ProtectedRoute`
  components.
- No new libraries: `react-hook-form`, `zod`, `@tanstack/react-query`,
  `react-router-dom` were already installed from Session 1 and cover
  everything needed here — form validation is done by hand-parsing with
  each schema rather than adding `@hookform/resolvers`.
- Typechecked clean on both apps (`tsc -b --noEmit` on frontend, `tsc
  --noEmit` on backend — backend shows only the same pre-existing
  Prisma-generated-types gap as every previous pass in this sandbox, no
  new errors from this pass's code). `oxlint` clean (one stylistic
  fast-refresh warning on `lib/auth.tsx`, not a bug). `pnpm build` on the
  frontend succeeds and produces a working production bundle.
- Backend could not be booted or exercised in this sandbox — same
  networking blocker as every earlier pass (`binaries.prisma.sh` /
  Neon both outside this sandbox's allowlist). Handed off exact
  verification steps to frPyP to run on a real machine.
- **frPyP confirmed working, live, end-to-end:** registered a new citizen
  → landed on empty dashboard → submitted a challenge (title, description,
  category, district) → redirected to dashboard → challenge appears with a
  "Submitted" badge → refresh keeps the session (token persisted) →
  logout returns to `/login` → logging back in shows the same challenge
  again.
Files touched:
- Backend: `src/routes/challenges.ts` (new), `src/validation/challenges.ts`
  (new), `src/index.ts` (mounted the new router)
- Frontend: `src/App.tsx`, `src/main.tsx` (both rewritten for real
  routing + AuthProvider), `src/lib/api.ts` (new), `src/lib/auth.tsx`
  (new), `src/lib/challengeLabels.ts` (new), `src/components/AppLayout.tsx`
  (new), `src/components/ProtectedRoute.tsx` (new), `src/pages/LoginPage.tsx`,
  `RegisterPage.tsx`, `SubmitChallengePage.tsx`, `DashboardPage.tsx` (all new)
Decisions made:
- POST /challenges stays SUBMITTED-only for now (see conflict note above) —
  confirmed with frPyP before writing code.
- GET /challenges only implements the CITIZEN branch for now, rather than
  stubbing PARTNER/ADMIN branches ahead of Sessions 5/7 — a judgment call,
  not explicitly asked, flagging here in case anyone disagrees with it.
- Session needed frontend login/register pages to reach anything at all,
  even though §5's session table lists "Auth" only under Session 2 (which
  Pass 6 built backend-only). Confirmed with frPyP to fold minimal
  login/register UI into Session 3 rather than leave a gap between
  sessions.
Deviations from spec: none beyond the confirmed in-phase decision above.
Bugs found/fixed: none.
Left in a broken/incomplete state: nothing.
Anything the next person picking this up needs to know:
- **Session 3 is done and genuinely confirmed** — citizen registration,
  login, challenge submission, and the dashboard all work end-to-end
  against the real Neon database.
- Every challenge lands as `SUBMITTED` with no partner assigned — that's
  correct and intentional for this phase, not a bug to "fix" in Session 4.
- **Session 4 (keyword-match categorization + auto-routing) is next** —
  see §6.

### Pass 9 (in progress, checkpoint push) — 2026-09-12 — frPyP — Session 4 backend (categorization + auto-routing) written, not yet verified against the live DB
Branch/commit: main (direct push), commit `fad9693`
Did:
- Checked PROJECT_REFERENCE.md §8 against this file's Session 3/4 split
  before writing anything: §8 already marks `POST /challenges` as
  "auto-routed on creation" — no actual conflict, Session 4 is exactly
  what finishes that annotation. Nothing needed flagging.
- `src/lib/categorize.ts` (new): keyword-match function per category
  (§2's "AI-enabled categorization" = plain keyword match, no ML/API
  call). Confirms the citizen's chosen category if it has any keyword
  hit; otherwise refines to whichever category scored highest; if
  nothing matches anything, keeps the citizen's original pick.
- `src/lib/routing.ts` (new): matches the final category against seeded
  partners' `domains` (Prisma `has` filter), assigns the earliest-seeded
  matching partner. Falls back to the earliest-seeded partner overall if
  no domain match is found, per §8's `NO_MATCHING_PARTNER` fallback
  wording ("assign to a default/general partner", not an error response).
  Checked the current seed data (`prisma/seed.ts`): the 4 seeded
  partners' domains together cover all 8 categories with no gaps, so
  this fallback branch isn't expected to actually trigger right now —
  it's there to satisfy the frozen contract, not because it's needed
  against today's seed data.
- `src/routes/challenges.ts`: `POST /challenges` now calls `categorize()`
  then `routeToPartner()`, and creates the challenge with the resulting
  `category`, `assignedPartnerId`, and `status: "ASSIGNED"` (falls back to
  `SUBMITTED` only if there are somehow zero partners in the DB at all).
- `src/index.ts`: updated the comment above the challenges route mount to
  stop saying "no auto-routing" — comment-only, no logic change.
- No new libraries — this is plain string matching against `.includes()`,
  nothing needed beyond what's already installed.
- Did **not** touch the partner dashboard (Session 5) or notifications
  (Session 6) — `GET /challenges` is untouched, still CITIZEN-only.
- Could not run `pnpm install`'s postinstall or `npx prisma generate`
  fully in this sandbox — same `binaries.prisma.sh` network-allowlist
  block as every earlier pass (Pass 6, Pass 8). `npx tsc --noEmit` shows
  only the same pre-existing `@prisma/client` type-export gap as always
  (`Category`/`Role`/`User` not exported until `generate` runs somewhere
  with real network access) — no new type errors from this pass's code.
- Verified the categorization logic itself in isolation (copied the pure
  function, no DB/Prisma involved, into a throwaway script — not
  committed): 4 cases including a keyword-override case (chosen category
  had no keyword hits, description matched a different category more
  strongly) all produced the expected category. Deleted the scratch file
  afterward.
- Could not exercise `routeToPartner()` or the full `POST /challenges`
  flow against the real Neon database — this sandbox has no network path
  to Neon at all (confirmed: a raw TCP connection attempt to the Neon
  host timed out), same category of blocker as Session 2/3's passes.
Files touched: `apps/backend/src/lib/categorize.ts` (new),
  `apps/backend/src/lib/routing.ts` (new),
  `apps/backend/src/routes/challenges.ts`, `apps/backend/src/index.ts`
  (comment only). Nothing already-marked-done was rewritten.
Decisions made:
- Fallback-partner choice (earliest-seeded partner, when no domain
  matches) was a judgment call, not explicitly specified beyond "a
  default/general partner" in §8 — flagging here in case frPyP wants a
  specific partner designated as the fallback instead once this is
  reviewed.
Deviations from spec: none.
Bugs found/fixed: none.
Left in a broken/incomplete state:
- **Not yet verified against the live server/database.** Same pattern as
  Pass 6/8 — needs confirming on a machine with real network access
  before this pass can be marked closed.
Anything the next person picking this up needs to know:
- Verify on a real machine:
  ```
  git pull
  cd apps/backend
  pnpm install
  npx prisma generate
  pnpm dev
  ```
  Then log in as the seeded citizen and `POST /api/v1/challenges` with a
  body like `{"title":"Village well broken","description":"No drinking
  water access for weeks","category":"PUBLIC_ADMIN","district":"Ranchi"}`
  — expect the response to come back with `category: "WATER"` (keyword
  override) and `status: "ASSIGNED"` with an `assignedPartnerId` set to
  partner3's id (Ranchi Institute of Health Sciences, seeded with
  `WATER` in its domains). Also try a submission whose category and
  keywords agree (e.g. an EDUCATION-worded challenge submitted as
  EDUCATION) to confirm the "confirm" path, not just the "refine" path.
  Then re-run checklist items 4 and 5 from PROJECT_REFERENCE.md §7.
- Once that's confirmed, update this entry (or add a short closing note)
  and this pass can be considered closed. Session 5 (partner dashboard:
  assigned challenges list, set team, status transitions) is next — see
  §6 — do not start it before Session 4 is confirmed working live.

---

### Pass 10 (in progress, checkpoint push) — 2026-09-12 — devansh4281 — Session 5 (partner dashboard) written as a one-off exception ahead of Session 4's live verification, authorized by project director; neither is verified live yet

Branch/commit: main (direct push, several small commits same pass —
`8bd5e98`, `8f11275`, `34bf288`, `fd876e5`)

**Flagged exception (read this first):** this pass explicitly breaks the
"don't start Session 5 before Session 4 is confirmed live" rule stated in
Pass 9 and in §6 below. This was raised before proceeding, not decided
silently: the project is timebound, and devansh4281 (project director)
explicitly authorized writing Session 5 now, on the condition that both
Session 4 and Session 5 get one combined live-verification pass rather
than two separate ones. This is a one-off, director-approved exception to
the phase-order rule — not a new standing policy. Future passes should
still default to the original one-session-at-a-time discipline unless
told otherwise again.

Did:
- Re-tested the live-DB blocker from a fresh sandbox before writing
  anything, rather than assuming Pass 9's finding still held: raw TCP to
  the Neon host on port 5432 times out (confirmed via a direct `/dev/tcp`
  connection attempt) even though HTTPS/443 to the same host completes a
  full TLS handshake — so this sandbox's egress is blocking the Postgres
  wire protocol specifically, not blocking Neon outright. Same net effect
  as every earlier pass's blocker, different specific symptom. Also
  reconfirmed `binaries.prisma.sh` is unreachable (403 from the egress
  proxy on every URL under it), so `prisma generate` can't run here
  either — no generated `@prisma/client` types available in this sandbox,
  same as Pass 6/8/9.
- `apps/backend/src/utils/errors.ts`: added `CHALLENGE_NOT_FOUND` and
  `INVALID_STATUS_TRANSITION` to `ErrorCode` (both already named in
  PROJECT_REFERENCE.md §8, just not wired up yet). `NO_MATCHING_PARTNER`
  still unused — routing.ts's fallback never throws it, per Pass 9.
- `apps/backend/src/validation/challenges.ts`: added `updateTeamSchema`
  and `updateStatusSchema` (status schema only accepts `IN_PROGRESS` /
  `COMPLETED` as *targets* — the actual step-skipping check happens in
  the route against the challenge's current status, not here).
- `apps/backend/src/routes/challenges.ts`:
  - `GET /challenges` now branches on role: CITIZEN behavior untouched,
    new PARTNER branch looks up the caller's `Partner` row (via
    `Partner.userId`) and returns only challenges where
    `assignedPartnerId` matches that partner's id. ADMIN's "all" branch
    still isn't built (Session 7) — `requireRole` only allows
    CITIZEN/PARTNER here for now.
  - New `PATCH /:id/team` (PARTNER only): validates body, confirms the
    challenge exists (`CHALLENGE_NOT_FOUND` if not) and is assigned to
    the calling partner (`FORBIDDEN` if not — never leaks whether the
    challenge exists to a partner it doesn't belong to beyond the 403),
    then sets `team`.
  - New `PATCH /:id/status` (PARTNER only): same existence/ownership
    checks, then checks the requested status against a
    `VALID_TRANSITIONS` map (`ASSIGNED -> IN_PROGRESS`,
    `IN_PROGRESS -> COMPLETED` only — anything else, including
    `ASSIGNED -> COMPLETED` or any backward move, returns
    `INVALID_STATUS_TRANSITION`).
- `apps/backend/src/index.ts`: comment above the challenges mount updated
  to describe the new PATCH routes — comment-only, no logic change.
- Frontend: `src/lib/api.ts` (new `getAssignedChallenges` /
  `updateChallengeTeam` / `updateChallengeStatus` — same `GET /challenges`
  endpoint as citizens, since the backend is already role-aware),
  `src/lib/auth.tsx` (`login()` now returns the logged-in `User` so a
  caller can redirect by role immediately, instead of waiting on a state
  re-render — existing callers weren't using the return value before, so
  this doesn't change their behavior), `src/components/ProtectedRoute.tsx`
  (added an optional `role` prop defaulting to `"CITIZEN"`, so every
  existing usage keeps its exact prior behavior), new
  `src/pages/PartnerDashboardPage.tsx` (assigned-challenges list, inline
  team-name save, a single "move to next status" button driven by the
  same forward-only sequence as the backend), `src/App.tsx` (new
  `/partner` route guarded by `role="PARTNER"`; the catch-all route is
  now role-aware instead of always assuming CITIZEN), `src/pages/
  LoginPage.tsx` (redirects to `/partner` or `/dashboard` based on the
  logged-in user's role instead of hardcoding `/dashboard`).
- No new libraries anywhere in this pass.
- Did **not** touch notifications (Session 6) or the admin dashboard
  (Session 7). Did not touch anything in Sessions 1-3's already-verified
  code paths (citizen submission/dashboard, auth) beyond the two additive,
  default-preserving changes noted above (`ProtectedRoute`'s new prop,
  `login()`'s return type).
- Verified without a live DB (same constraint as Pass 9):
  - Backend `npx tsc --noEmit`: only the same pre-existing
    `@prisma/client` type-export gap Pass 9 documented (`Category`/
    `Role`/`User` not exported until `generate` runs somewhere with real
    network access) — no new type errors from this pass's code.
  - Frontend `npx tsc --noEmit`: clean, no errors.
  - Frontend `pnpm build`: succeeds.
  - Isolated logic test of the status-transition map (copied to a
    throwaway script, no DB/Prisma involved, deleted after running —
    same approach Pass 9 used for the categorizer): all 7 cases checked
    (both valid forward steps, the ASSIGNED->COMPLETED skip, both
    backward moves off COMPLETED, and both moves attempted from
    SUBMITTED) matched expected allow/reject.
Files touched: `apps/backend/src/utils/errors.ts`,
  `apps/backend/src/validation/challenges.ts`,
  `apps/backend/src/routes/challenges.ts`, `apps/backend/src/index.ts`
  (comment only), `apps/frontend/src/lib/api.ts`,
  `apps/frontend/src/lib/auth.tsx`,
  `apps/frontend/src/components/ProtectedRoute.tsx`,
  `apps/frontend/src/pages/PartnerDashboardPage.tsx` (new),
  `apps/frontend/src/App.tsx`, `apps/frontend/src/pages/LoginPage.tsx`.
  Nothing already-marked-done was rewritten.
Decisions made:
- The phase-order exception itself (see flag above) — director-approved,
  logged here so it isn't mistaken for silent scope creep by whoever
  reads this next.
- Fallback-partner choice from Pass 9 (earliest-seeded partner when no
  domain matches) still hasn't been explicitly reviewed by frPyP — not
  touched this pass, just carrying the open item forward.
Deviations from spec: none beyond the flagged phase-order exception above
  (which is a process deviation, not a scope/contract deviation — §8's
  endpoint shapes were built exactly as frozen).
Bugs found/fixed: none.
Left in a broken/incomplete state:
- **Neither Session 4 nor Session 5 has been run against the live
  database.** Combined verification steps for both, in one pass, are in
  §6 below — do that before starting Session 6.
Anything the next person picking this up needs to know:
- Everything in §6's combined checklist needs a machine with real network
  access to Neon (this sandbox, like every sandbox before it this
  project, cannot reach Neon's Postgres port). Once devansh4281 runs it
  and reports back, update this entry (or add a short closing note) and
  both passes can be considered closed together.

---

### Pass 11 — 2026-09-12 — frPyP — Session 4 + Session 5 CLOSED: both verified live against the real Neon database

Branch/commit: main (direct push)
Environment: verified on a real Fedora machine with genuine internet
  access (not a sandbox) — this is the first pass in the project able to
  actually reach Neon's Postgres port. Confirms the root cause tracked in
  §5 since Pass 4 was environment-only, not a code or data problem.
Ran the full §6 combined checklist against the live server + live
  database, in order:
1. `GET /api/v1/health` → `{"success":true,"db":"connected"}`.
2. Logged in as `citizen@demo.local` — token issued correctly.
3. Session 4 "refine" path: submitted a WATER-worded challenge tagged
   `PUBLIC_ADMIN` → came back `category: "WATER"`, `status: "ASSIGNED"`,
   `assignedPartnerId` set to partner3 (Ranchi Institute of Health
   Sciences). Matches spec.
4. Session 4 "confirm" path: submitted an EDUCATION-worded challenge
   tagged `EDUCATION` → came back unchanged, auto-assigned to partner1
   (Jharkhand State University). Matches spec.
5. Session 5 partner isolation: partner3 (`GET /challenges`) saw only
   the WATER challenge; partner1 saw only the EDUCATION challenge.
   Matches spec.
6. Session 5 set-team + valid transition: `PATCH .../team` on the WATER
   challenge set `team: "Team Alpha"`; `PATCH .../status` moved it
   `ASSIGNED -> IN_PROGRESS` correctly.
7. Session 5 invalid transition: partner1 tried `ASSIGNED -> COMPLETED`
   directly on the EDUCATION challenge (skipping `IN_PROGRESS`) → 409
   `INVALID_STATUS_TRANSITION`, exactly as spec'd.
8. Session 5 valid finish + ownership: the WATER challenge moved
   `IN_PROGRESS -> COMPLETED` cleanly; partner3 then tried to edit the
   EDUCATION challenge (not theirs) → 403 `FORBIDDEN`.
All 8 steps matched expected behavior exactly. No bugs found.
Not covered by this pass: the `/partner` frontend page itself was not
  opened in a browser — only the backend endpoints it calls were
  exercised directly (via curl). Those endpoints are now confirmed
  live, so the page is very likely fine since it's a thin consumer of
  them, but nobody has actually clicked through it yet. Worth a quick
  manual pass before calling Session 5 fully done at the UI level —
  not a blocker for starting Session 6.
Gotcha worth flagging for whoever tests next: `POST /auth/login`'s
  `phone` field does an exact-match lookup by phone number — sending an
  email address under the `phone` key (instead of using the separate
  `email` key) returns `UNAUTHORIZED`, not a helpful validation error.
  Not a bug (the endpoint is documented as accepting phone OR email as
  separate fields, see §9) — just easy to trip over when testing by
  hand.
Files touched: none — this pass was verification only, no code changed.
Decisions made: none new.
Deviations from spec: none.
Bugs found/fixed: none.
Left in a broken/incomplete state: nothing. Both sessions fully closed
  at the API level.
Anything the next person needs to know: Session 6 (notifications) is
  next — see §6 for the updated task. Stick to notifications only; do
  not start Session 7 (admin dashboard) alongside it.

---

### Pass 12 (in progress, checkpoint push) — 2026-09-13 — frPyP — Session 6 (notifications) written, not yet verified against the live DB
Branch/commit: main (direct push), commits `cd6ffe2` (backend) and
  `3089747` (frontend)
Did:
- Pulled latest first (fast-forward, no conflicts), read full commit
  history and this file before touching anything.
- Checked PROJECT_REFERENCE.md against the Session 6 ask: the
  `Notification` model was already in `prisma/schema.prisma` since
  Session 1 (covers `userId`, `title`, `message`, `type`, `read`,
  `createdAt` exactly per §6) — no schema change needed, no conflict to
  flag.
- `src/lib/notify.ts` (new): small helper wrapping
  `prisma.notification.create`, used by both trigger points below.
- `src/routes/notifications.ts` (new): `GET /notifications` (own list,
  any authenticated role — scoped to `req.user!.id`, though only
  citizens get anything today since only citizens are ever notified);
  `PATCH /notifications/:id/read` (ownership-checked, same pattern as
  Session 5's challenge PATCH routes).
- `src/utils/errors.ts`: added `NOTIFICATION_NOT_FOUND` to the error
  code union, for the same reason Session 5 added
  `CHALLENGE_NOT_FOUND`/`INVALID_STATUS_TRANSITION` — §8 lists codes for
  the resources it names explicitly, this extends that set for the new
  resource rather than reusing `CHALLENGE_NOT_FOUND`.
- `src/routes/challenges.ts`: `POST /challenges` now fires
  `CHALLENGE_ASSIGNED` to the citizen when auto-routing actually assigns
  a partner; `PATCH /:id/status` now fires `STATUS_UPDATED` to the
  citizen on every valid transition (not the partner making the
  change).
- `src/index.ts`: mounted the new router at `/api/v1/notifications`.
  Did not touch the existing health/auth/challenges mounts.
- Frontend: `getNotifications`/`markNotificationRead` + `Notification`
  type added to `lib/api.ts`. `DashboardPage.tsx` (citizen dashboard)
  now shows a notifications list above the challenges list — unread
  dot, click-to-mark-read, no polling — per §2's "no real-time
  anything" and Session 6's "citizen sees their own notifications (e.g.
  a bell/list on their dashboard)" wording. Did not touch
  `PartnerDashboardPage.tsx` or any other already-working page.
- Did **not** start Session 7 (admin dashboard) — stayed inside Session
  6's scope per PROJECT_REFERENCE.md §5 and this file's own "one session
  at a time" rule (back in effect since Pass 11 closed the Session
  4/5 exception).
- No new libraries — everything here uses already-approved dependencies
  (Express, Prisma, Zod pattern reused from existing routes; TanStack
  Query on the frontend, already installed).
- Could not run `npx prisma generate` in this sandbox: same
  `binaries.prisma.sh` 403 Forbidden block as every prior sandboxed pass
  (Pass 4/6/8/9/10), confirmed again including with
  `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1` set. Also confirmed this
  sandbox has no raw TCP path to Neon's Postgres port (same as Pass 4's
  and Pass 9's finding).
- `npx tsc --noEmit` on the backend: only the same pre-existing
  `@prisma/client` type-export gaps as always (`Role`, `Category`,
  `User`, and now `NotificationType`) — all trace back to `generate`
  never completing here, not to a logic bug in this pass's code.
- Frontend has no such dependency on the Prisma client: `npx tsc
  --noEmit` came back clean, and `npm run build` (full production
  build, `tsc -b && vite build`) succeeded with zero errors.
Files touched: `apps/backend/src/lib/notify.ts` (new),
  `apps/backend/src/routes/notifications.ts` (new),
  `apps/backend/src/index.ts`, `apps/backend/src/utils/errors.ts`,
  `apps/backend/src/routes/challenges.ts`, `apps/frontend/src/lib/api.ts`,
  `apps/frontend/src/pages/DashboardPage.tsx`. Nothing already-marked-done
  was rewritten.
Decisions made:
- `GET /notifications` isn't role-restricted (any authenticated user
  gets their own list) since the query is already scoped to the
  caller's `userId` — same "already ownership-safe, no need to
  over-restrict" reasoning as elsewhere in this codebase. In practice
  only citizens will ever see anything in it, since both trigger points
  only ever notify the citizen who owns the challenge.
- `NOTIFICATION_NOT_FOUND` error code addition (see above) — flagging
  here too in case frPyP wants it named differently.
Deviations from spec: none.
Bugs found/fixed: none.
Left in a broken/incomplete state:
- **Not yet verified against the live server/database.** Same pattern
  as Pass 6/8/9 — needs confirming on a machine with real network
  access before this pass can be marked closed.
Anything the next person picking this up needs to know:
- Verify on a real machine:
  ```
  git pull
  cd apps/backend
  pnpm install
  npx prisma generate
  pnpm dev
  ```
  Then, logged in as the seeded citizen: submit a challenge (as in Pass
  9/11's steps) and confirm `GET /api/v1/notifications` now returns a
  `CHALLENGE_ASSIGNED` entry with `read: false`. Log in as the partner
  it got routed to and move its status forward
  (`PATCH /:id/status`), then re-check the citizen's
  `GET /api/v1/notifications` for a new `STATUS_UPDATED` entry. Then
  `PATCH /api/v1/notifications/:id/read` on one of them and confirm it
  comes back with `read: true` and stays that way on a re-fetch. Also
  open `/dashboard` in a browser as the citizen and confirm the
  notifications list renders and clicking an unread one marks it read
  in the UI.
- Once that's confirmed, update this entry (or add a short closing
  note) and this pass can be considered closed. Session 7 (admin
  dashboard) is next — see §6 — do not start it before Session 6 is
  confirmed working live.
- Same optional, non-blocking item carried over from Pass 11: the
  `/partner` page still hasn't been manually clicked through in a
  browser.

---

### Pass 13 — 2026-09-13 — frPyP — Session 6 (notifications) CLOSED: verified live, both API and UI, against the real Neon database
Branch/commit: main (direct push)
Did:
- Pulled latest first — already up to date, no conflicts.
- This session's sandbox hit the identical Neon/Prisma-engine network
  block as every prior sandboxed pass (403 from the egress layer on
  both `binaries.prisma.sh` and the Neon host, no raw TCP path on
  port 5432 either) — confirmed again, not a new finding, just ruled
  out doing the verification itself from here.
- Verification was done by frPyP on a real machine (Fedora) instead,
  guided command-by-command:
  - Backend booted clean (`pnpm install`, `npx prisma generate`,
    `pnpm dev`), `GET /api/v1/health` returned `db: "connected"`.
  - Logged in as the seeded citizen, submitted a new WATER-category
    challenge — came back `status: "ASSIGNED"` with
    `assignedPartnerId` set (routed to partner3, per the seed data's
    WATER/HEALTHCARE domain pairing), and a `CHALLENGE_ASSIGNED`
    notification appeared immediately via `GET /api/v1/notifications`
    with `read: false`.
  - Logged in as partner3, `PATCH /challenges/:id/status` to
    `IN_PROGRESS` — the citizen's notification list picked up a new
    `STATUS_UPDATED` entry, also `read: false`.
  - `PATCH /notifications/:id/read` on the `CHALLENGE_ASSIGNED` entry
    flipped it to `read: true` and it stayed that way on re-fetch.
  - Frontend: started `pnpm dev`, opened `/dashboard` as the citizen
    in a real browser. Notifications list rendered correctly above
    the challenges list, matching the API data exactly (screenshot
    confirmed). First click-to-mark-read attempt looked like a no-op,
    traced to a stale dev server from an earlier restart — after a
    clean restart of both backend and frontend, a fresh
    `STATUS_UPDATED` notification (triggered by moving the same
    challenge to `COMPLETED`) was confirmed visually unread on load,
    then visually changed to the read/greyed style on click, and
    stayed that way after a page refresh.
- All 14 items in this pass's scope (API: create/list/patch-team n/a
  this pass since team wasn't touched, patch-status x2, notifications
  list + mark-read; UI: dashboard render + click-to-read) came back
  as expected. No bugs found.
- Did **not** start Session 7 — stayed inside "verify Session 6,
  nothing else" per Pass 12's own instructions and this file's
  one-session-at-a-time rule.
Files touched: none (verification-only pass, no code changed).
Decisions made: none.
Deviations from spec: none.
Bugs found/fixed: none — the one hiccup (click appearing to do
  nothing) was a stale dev server, not an application bug; resolved
  by restarting both dev servers, not by changing any code.
Left in a broken/incomplete state: nothing. Session 6 is fully closed.
Anything the next person picking this up needs to know:
- **Session 6 is done.** Session 7 (admin dashboard) is next — see §6.
- Test data note: the live Neon database now has a `WATER` challenge
  titled "Broken handpump in ward 4" sitting in `COMPLETED` status
  (assigned to partner3), created during this verification pass. Not
  a bug, just be aware it'll show up in any admin dashboard counts
  built in Session 7.
- Same non-blocking carryover as Pass 11/12: the `/partner` page
  still hasn't been manually clicked through in a browser (its
  endpoints are verified live, just not the UI itself).

---

### Pass 14 — 2026-09-14 — frPyP — Session 7 (admin dashboard) written, not yet verified live
Branch/commit: main (two direct pushes: backend, then frontend — see below)
Did:
- Pulled latest first — already up to date, no conflicts. Pulled again
  right before committing — still up to date.
- Backend: added `GET /api/v1/admin/dashboard` (`src/routes/admin.ts`,
  mounted in `src/index.ts`) — `requireAuth` + `requireRole("ADMIN")`,
  returns `{ totalChallenges, byDomain, byStatus, partnersEngaged,
  completedCount }` exactly per §8. Implemented as a dedicated query
  (`prisma.challenge.count()` / `.groupBy()` on `category` and `status`,
  plus a distinct count of `assignedPartnerId` for partners engaged) —
  did **not** touch `GET /challenges`'s existing CITIZEN/PARTNER branches
  in `routes/challenges.ts`, which stayed untouched per this project's
  don't-rewrite-working-code rule.
- Frontend: added `AdminDashboardPage.tsx` (stat cards for total/
  partners-engaged/completed, a by-status breakdown, a by-domain
  breakdown), `getAdminDashboard()` in `lib/api.ts`, `/admin` route in
  `App.tsx` (guarded by the existing `ProtectedRoute` component's `role`
  prop — no changes needed to that component), and an ADMIN case in
  `HomeRedirect`.
- This sandbox hit the identical Neon/Prisma-engine network block as
  every prior sandboxed pass (403 from the egress layer on
  `binaries.prisma.sh`, and this time also explicitly confirmed a raw
  TCP connection attempt to the Neon host on port 5432 times out) — same
  underlying constraint as Pass 4/6/8/9/10/12, not a new issue.
- What **was** verified from this sandbox: `apps/backend` — `tsc
  --noEmit` produces only the pre-existing, documented Prisma-generate-
  blocked errors (missing `Category`/`Role`/etc. exports from
  `@prisma/client`) in files untouched by this pass; the new
  `routes/admin.ts` itself introduces no new type errors. `apps/frontend`
  — `tsc --noEmit` clean, `vite build` succeeds.
- What was **not** verified from this sandbox (same limitation as every
  prior pass): the route was never actually run against the live Neon
  database, so the real query results (counts, grouping shape) have not
  been confirmed end-to-end, and the frontend page has never been opened
  in a browser against a running backend.
Files touched: `apps/backend/src/routes/admin.ts` (new),
  `apps/backend/src/index.ts`, `apps/frontend/src/pages/
  AdminDashboardPage.tsx` (new), `apps/frontend/src/App.tsx`,
  `apps/frontend/src/lib/api.ts`.
Decisions made:
- Chose a **dedicated `GET /admin/dashboard` route/query** over adding an
  ADMIN branch to `GET /challenges`'s existing role-aware handler — §6's
  next-task note left this as an open judgment call for whoever picked it
  up. Reasoning: simpler for a read-only aggregate, and keeps
  `routes/challenges.ts` (already working, already verified live)
  completely untouched.
Deviations from spec: none — no new libraries, no scope beyond the
  §8 shape for `/admin/dashboard`, no Priority-B items touched.
Bugs found/fixed: n/a — no live testing was possible from this sandbox.
Left in a broken/incomplete state:
- **Session 7 needs live verification on a real machine**, same pattern
  as every DB-touching session before it (Session 1 Pass 5, Sessions
  2/3 Pass 7/8, Sessions 4/5 Pass 11, Session 6 Pass 13):
  ```
  cd apps/backend && npx prisma generate && pnpm dev
  # log in as admin@demo.local / Demo@1234, then:
  curl -H "Authorization: Bearer <admin token>" http://localhost:4000/api/v1/admin/dashboard
  ```
  Expect the JSON shape from §8, with counts reflecting whatever's
  currently in the real database — including the `COMPLETED` `WATER`
  challenge created during Pass 13's verification (see that pass's
  notes), so `completedCount` should be at least 1 and `byStatus`
  should include a non-zero `COMPLETED`.
  Then open `/admin` in a browser (log in as the admin demo account) and
  confirm the page renders those same numbers and doesn't error.
Anything the next person picking this up needs to know:
- **Do not start Session 8 (polish) until Session 7 is confirmed live**
  — this file's phase-order rule applies here same as every prior
  session boundary.
- Only frPyP's name appears in this log per standing instruction — no
  other names added.

### Pass 15 — 2026-09-15 — frPyP — Session 7 verified live; found and fixed one bug in the process; Session 7 now fully closed
Branch/commit: main (direct pushes: `3af0c64` bug fix, this status rewrite next)
Did:
- Ran Session 7's live verification on a real machine (frPyP's), per the
  exact steps left in Pass 14: `prisma generate`, started the backend,
  logged in as `admin@demo.local`, called `GET /admin/dashboard` with the
  token. Response matched the §8 shape exactly: `{ totalChallenges: 6,
  byDomain: { PUBLIC_ADMIN: 2, WATER: 3, EDUCATION: 1 }, byStatus: {
  COMPLETED: 2, ASSIGNED: 2, SUBMITTED: 2 }, partnersEngaged: 2,
  completedCount: 2 }`. Numbers are internally consistent (byDomain and
  byStatus both sum to 6; completedCount matches byStatus.COMPLETED).
- Opened `/admin` in a browser (real machine, real backend) — page
  rendered the same six numbers with no console errors. Session 7's
  frontend is now confirmed live, not just typechecked/built.
- **Found a real bug during this check**: after logging in as admin, the
  app didn't redirect anywhere — stayed on `/login`. Traced it to
  `apps/frontend/src/pages/LoginPage.tsx`'s `dashboardPathFor()` helper,
  which only ever returns `/partner` or `/dashboard` — it was written in
  Session 3, before the ADMIN role's own route existed, and Session 7
  (Pass 14) updated the *separate* `HomeRedirect` role logic in
  `App.tsx` but missed this parallel helper. Net effect: admin login
  succeeded, but the app tried to send the admin to `/dashboard`
  (CITIZEN-only), got bounced by `ProtectedRoute`, and landed back on
  `/login` — looked like login was doing nothing.
- **Fixed**: `dashboardPathFor()` now also returns `/admin` for the
  ADMIN role, mirroring `HomeRedirect`. No other role's redirect
  behavior touched. Re-tested live on the real machine after the fix:
  admin login now lands on `/admin` correctly. Citizen and partner login
  redirects were not affected (not retested individually since the
  change is an added branch, not a modified one, but worth a quick
  sanity check next time either of those logs in).
Files touched: `apps/frontend/src/pages/LoginPage.tsx` only.
Decisions made: none requiring a call — this was a straightforward bug
  fix completing a case Session 7 should already have covered, not a
  design choice or scope change.
Deviations from spec: none — no new libraries, no scope beyond fixing
  the one redirect gap.
Bugs found/fixed:
- Fixed: admin post-login redirect (`dashboardPathFor` missing the
  ADMIN case) — see above. Verified fixed live.
Left in a broken/incomplete state: nothing from Session 7. Sessions 1-7
  are all now closed and confirmed live.
Anything the next person picking this up needs to know:
- **Session 7 is fully done.** Session 8 (polish) is next — see §6.
- Only frPyP's name appears in this log per standing instruction.

---

### Pass 16 — 2026-09-15 — frPyP — Session 8 (polish) started: accessibility + mobile-layout fixes, no live DB reachable this pass
Branch/commit: main (4 checkpoint pushes this pass — see commits
716d512, 4472ac8, b10e04a, b328151)
Did:
- Confirmed this session's sandbox has the same environment constraint as
  every prior pass (Pass 4/6/8/9/10/11/12/14): direct TCP to Neon's
  Postgres port (5432) times out while HTTPS (443) to the same host
  completes a full TLS handshake; `binaries.prisma.sh` also 403s. Checked
  explicitly this time with a raw TCP test before starting, rather than
  discovering it mid-task. No DB-touching work or live-browser
  verification was possible here as a result — see §6 for what that
  leaves outstanding.
- Worked the parts of Session 8 (PROJECT_REFERENCE.md §5 row 8) that
  don't need a live database: accessibility and mobile-layout polish
  across all five app pages plus the shared header, verified with
  `tsc --noEmit` and `npm run build` (both clean) after every change,
  no code execution against real data needed for either check.
- Login/Register/Submit-challenge pages: every form field now has a
  proper `<label htmlFor>`/`id` pair (previously label and input were
  visually stacked but not programmatically associated — a screen
  reader wouldn't announce which label went with which field), plus
  `aria-invalid`/`aria-describedby` wired to the existing validation
  messages, and `focus-visible` rings added to submit buttons.
- Citizen dashboard notifications list: was a `<li onClick>` — not
  reachable by keyboard at all. Converted the unread items to real
  `<button>` elements (read items stay static, non-interactive `<div>`s,
  matching their non-clickable state). Also found and fixed a real gap:
  the section silently rendered nothing (`return null`) on a fetch
  error, indistinguishable from "no notifications" — it now shows a
  `role="alert"` error message instead.
- Partner dashboard: labeled the team-name input (visually-hidden label,
  since the placeholder text isn't a substitute for a real label),
  added `focus-visible` rings to its two buttons, `role="alert"` on its
  inline error text.
- Admin dashboard: `aria-live="polite"` on the loading state, `role="alert"`
  on the error state (it had no empty state to begin with — correctly,
  since the totals response is never an empty list).
- Shared header (`AppLayout.tsx`): the title + username + logout row
  could have overflowed on very narrow phone screens with a long name —
  added `truncate` to the title, hid the username below the `sm:`
  breakpoint instead of letting it get clipped, added a focus ring to
  logout.
- Citizen dashboard top row (title + "New challenge" button): switched
  from a single `flex justify-between` row to `flex-col` on narrow
  screens / `flex-row` from `sm:` up, so the button doesn't get
  squeezed next to the title text on the smallest phone widths.
- `index.html`'s `<title>` was still the Vite scaffold default
  ("frontend") — changed it to "Civic Challenge Platform". Minor, but
  it's a real-content gap a polish pass should catch (browser tab
  title, screen-reader "page title" announcement).
- Read through `apps/backend/src/routes/{auth,challenges}.ts` end to
  end against PROJECT_REFERENCE.md §7's checklist and §8's contract as
  a logic sanity-check (ownership checks, forward-only status
  transitions, role gating, notification trigger points). Found no
  discrepancies — this matches what Pass 11/13/15 already verified
  live. Read-only — nothing here was modified, per the "don't rewrite
  working/done code" rule.
Files touched: `apps/frontend/src/pages/LoginPage.tsx`,
`RegisterPage.tsx`, `SubmitChallengePage.tsx`, `DashboardPage.tsx`,
`PartnerDashboardPage.tsx`, `AdminDashboardPage.tsx`,
`apps/frontend/src/components/AppLayout.tsx`, `apps/frontend/index.html`.
No backend files touched. No new dependencies added.
Decisions made: none requiring a call — every change above is additive
polish within Session 8's own scope (PROJECT_REFERENCE.md §2/§5), no
new features, no Priority-B items, no Session 9 work.
Deviations from spec: none.
Bugs found/fixed: the notifications-error-swallowing gap described
above (not a previously-logged bug, just discovered during this pass's
error-state review).
Left in a broken/incomplete state — Session 8 is NOT closed yet:
- **Mobile responsiveness**: spot-checked and fixed two real narrow-
  screen issues (dashboard header row, `AppLayout` header row) by
  reading the JSX/Tailwind classes for overflow risk at small widths —
  not the same as actually opening each page in a resized real browser
  or on a device. That visual confirmation still needs to happen on a
  real machine.
- **Loading/empty/error states**: reviewed every page; fixed the one
  real gap found (notifications silently hiding errors). Everything
  else already had a loading/empty/error state from earlier sessions.
- **Full manual test checklist (PROJECT_REFERENCE.md §7, all 14
  items)**: NOT run as a live sequential pass this session — this
  sandbox cannot reach the database (see above), so nothing that
  touches real data (registration, login, submission, routing, status
  transitions, notifications firing, admin totals, the three ownership-
  isolation checks) could actually be exercised here. Reading the
  backend route code against each item didn't turn up discrepancies,
  but that is not the same thing as running the checklist for real —
  Session 8 isn't closed until someone does that on a real machine.
- The `/partner` page still hasn't been manually clicked through in an
  actual browser (carried over from Pass 11/15) — same blocker.
Anything the next person picking this up needs to know: the code-level
half of Session 8 (accessibility, mobile-layout fixes, error-state
gap) is done and pushed. What's left to close Session 8 out is entirely
the live-verification half — the full §7 checklist run, the mobile
resize check, and the `/partner` click-through — all of which need a
real machine with real internet access to Neon, same as every DB-
touching step in every prior session. See §6.

### Pass 17 — 2026-09-15 — frPyP — Session 8 (polish) CLOSED: live verification done on a real machine
Branch/commit: main (direct push)
Did:
- frPyP ran the live-verification half of Session 8 that Pass 16 could
  not do from its sandbox, on a real machine with real internet access
  to Neon:
  - The full manual test checklist in PROJECT_REFERENCE.md §7, all 14
    items, run as one continuous sequential pass (not item-by-item
    across separate earlier sessions) — confirmed passing.
  - Resized a real browser window (and checked on a real phone) across
    `/login`, `/register`, `/submit`, `/dashboard`, `/partner`,
    `/admin` — the Pass 16 mobile-layout fixes (header stacking, title
    truncation, username hidden below `sm:`) hold up in practice, not
    just in the Tailwind class names.
  - Clicked through the `/partner` page in an actual browser for the
    first time (carried over from Pass 11/15) — confirmed working
    against the live, assigned-challenge data.
- This closes out every item §6/§4 had listed as blocking Session 8.
Files touched: none — this pass is verification only, no code changed.
Decisions made: none.
Deviations from spec: none.
Bugs found/fixed: none found during this live pass — Pass 16's
  code-level fixes held up as written.
Left in a broken/incomplete state: nothing — **Session 8 is now fully
  closed.**
Anything the next person picking this up needs to know: all 8 sessions
  of Priority-A scope (PROJECT_REFERENCE.md §2/§5) are now written and
  verified live. The only session left is Session 9 (deploy) — see §6.

### Pass 18 — 2026-09-16 — frPyP — Session 9 (deploy) CLOSED: deployed, seeded, demo rehearsed live, docs added
Branch/commit: main (direct push)
Did:
- Frontend deployed to Vercel (`project-dt-2026-frontend.vercel.app`) and
  backend deployed to Render (`projectdt2026.onrender.com`), both wired
  to the existing Neon instance — no new database stood up. Account/
  project setup on Vercel and Render was done in an earlier chat session
  that reached the deploy step but hit its length limit before logging
  anything here; this pass confirmed both are live and working (backend
  health check returns `{success:true, db:"connected"}`; frontend serves
  and renders correctly).
- Confirmed the production database is already seeded with the standard
  demo accounts (citizen, admin, 4 partners) — frPyP logged into the
  live frontend as `citizen@demo.local` and it worked.
- Root `README.md` added: live links, demo accounts table, tech stack,
  local dev setup instructions, and a Mermaid architecture diagram
  (renders natively on GitHub — no new dependency added).
- Full demo story (PROJECT_REFERENCE.md §1) rehearsed live end-to-end
  against the deployed URLs by frPyP: citizen submitted a challenge, it
  was correctly auto-categorized and auto-routed to the matching
  partner, the partner set a team and moved status
  `ASSIGNED → IN_PROGRESS → COMPLETED`, the citizen's dashboard reflected
  the change with notifications for both `CHALLENGE_ASSIGNED` and
  `STATUS_UPDATED`, and the admin dashboard totals matched. Covers §7
  checklist items 1–10 and 14. Items 11–13 (cross-account isolation)
  weren't separately re-tested this pass but remain covered by Pass 11's
  live ownership-check verification and the unchanged backend
  authorization logic.
Files touched: `README.md` (new). No application code touched — Session
9 is deploy/docs work only.
Decisions made: none requiring a call.
Deviations from spec: none.
Bugs found/fixed: none.
Left in a broken/incomplete state: nothing. **Session 9 is now closed —
all 9 sessions of PROJECT_REFERENCE.md §5 are done, deployed, and
verified live end to end.**
Anything the next person picking this up needs to know: the project is
feature-complete per PROJECT_REFERENCE.md §2's Priority-A scope.
Anything further is a Priority-B item (§2) or a new ask — start a fresh
pass entry here rather than assuming scope.

### Pass 19 — 2026-09-16 — frPyP — Priority-B: richer error states + admin manual reassignment
Branch/commit: main (direct push, two commits)
Did:
- **Richer error states** (frontend only): `api.ts`'s fetch wrapper now
  distinguishes a network-level failure (offline, DNS, CORS, host
  unreachable) from an HTTP error response, with its own message
  instead of a raw/ugly `fetch()` exception. Added a "Try again" retry
  button to every failed-query error state (citizen dashboard +
  notifications, partner dashboard, admin dashboard). An
  expired/invalid token now auto-clears the session and redirects to
  `/login` with a "your session expired" message, via a small
  pub/sub (`lib/authEvents.ts`) so the fetch layer can tell
  `AuthProvider` to clear state without importing React context into
  it. Verified with `tsc -b` and `vite build`, both clean.
- **Admin manual reassignment**: new `GET /admin/partners` and `PATCH
  /admin/challenges/:id/reassign` endpoints (ADMIN only) — see §7 for
  the two calls made explicitly on reassignment's behavior (status
  reset to ASSIGNED + team cleared, new partner notified). Also
  completed `GET /challenges`'s ADMIN branch, which §8 already
  documented but Session 7 never built. Admin dashboard UI now has an
  "All challenges" section listing every challenge with a
  partner-picker and Reassign button per row.
Files touched: `apps/frontend/src/lib/{api.ts,auth.tsx,authEvents.ts
(new)}`, `apps/frontend/src/pages/{LoginPage,DashboardPage,
PartnerDashboardPage,AdminDashboardPage}.tsx`,
`apps/backend/src/{routes/admin.ts,routes/challenges.ts,
validation/challenges.ts,lib/notify.ts}`, `PROJECT_REFERENCE.md` (§8,
§9).
Decisions made: see §7 (two, both admin-reassignment).
Deviations from spec: none beyond what §7 already logs.
Bugs found/fixed: none.
Left in a broken/incomplete state: the backend changes are written
following the exact patterns of the already-verified-live code around
them (same middleware, same error-response shape, same Prisma query
style — the Partner model fields used were checked directly against
`prisma/schema.prisma`), but **could not be run or type-checked against
a generated Prisma Client in this sandbox** — `prisma generate` fails
here the same way DB access always has (this time on
`binaries.prisma.sh`, 403). Frontend half (richer error states, and the
admin UI calling these new endpoints) is fully verified — `tsc -b` and
`vite build` both clean. **Needs a real-machine pass before treating
the two new admin endpoints as live-verified** — same workaround as
every DB-touching pass before this one (Pass 11, Pass 18).
Anything the next person picking this up needs to know: run `pnpm
--filter backend prisma:generate` (or equivalent) and `tsc -b` on a
real machine for `apps/backend`, then exercise `GET /admin/partners`
and the reassign flow from the admin UI end-to-end before calling this
done. The other two selected Priority-B items (dedup detection, richer
partner profiles) haven't been started yet.

### Pass 20 — 2026-09-16 — frPyP — admin manual reassignment: live-verified
Branch/commit: main (no code change, verification only)
Did: Render and Vercel auto-deployed Pass 19's commits. frPyP submitted
a test challenge, reassigned it to a different partner from the admin
UI's new "All challenges" section, and confirmed: the challenge's
partner and status (`ASSIGNED`, reset correctly) updated, and a
`CHALLENGE_ASSIGNED` notification row for the new partner's `userId`
showed up via a direct Neon SQL query. **Admin manual reassignment is
now closed — written and verified live, same as everything else in
this project.**
Files touched: none.
Decisions made: none.
Deviations from spec: none.
Bugs found/fixed: none.
Left in a broken/incomplete state: nothing.
Anything the next person picking this up needs to know: test data was
cleared from the database again after this check (same `DELETE FROM
notifications; DELETE FROM challenges;` as Pass 18). Remaining
Priority-B items: dedup detection, richer partner profiles.

### Pass 21 — 2026-09-16 — frPyP — Priority-B: dedup detection
Branch/commit: main (direct push)
Did: `POST /challenges` now runs a soft duplicate check
(`lib/dedup.ts`, new file) before creating — plain word-overlap
against other challenges in the same district — and always returns
`possibleDuplicates` (empty array if none) alongside the created
Challenge; never blocks creation, per §7. Frontend: submit page shows
a dismissible "this looks similar to..." notice with the matched
titles and a link to the dashboard instead of auto-navigating, only
when the array is non-empty; unchanged (auto-navigate) otherwise.
Files touched: `apps/backend/src/lib/dedup.ts` (new),
`apps/backend/src/routes/challenges.ts`,
`apps/frontend/src/lib/api.ts`,
`apps/frontend/src/pages/SubmitChallengePage.tsx`,
`PROJECT_REFERENCE.md` (§8, §9).
Decisions made: see §7.
Deviations from spec: none beyond what §7 logs.
Bugs found/fixed: none.
Left in a broken/incomplete state: same sandbox limitation as every
backend change this project has made — `tsc -b` for `apps/backend`
shows only the pre-existing "Prisma client not generated" errors
(same 7 as before this pass, none new), and `dedup.ts` itself needed
explicit types added precisely because of that missing client, so
worth double-checking on a real machine with the client generated.
Frontend half is fully verified — `tsc -b` and `vite build` both
clean. **Not yet live-verified** — needs a real machine, same as
admin manual reassignment before it (Pass 19 → Pass 20).
Anything the next person picking this up needs to know: to test,
submit two similar challenges in the same district (e.g. same
pothole reported twice with different wording) and confirm the second
one's submit page shows the heads-up with the first one's title.
Richer partner profiles is the last selected Priority-B item, not
started yet.

### Pass 22 — 2026-09-16 — frPyP — HANDOFF: pausing for incoming new/urgent requirements
Branch/commit: main (no code change — repo confirmed clean and pushed
as of Pass 21 before this pass)
Did: frPyP flagged that new urgent requirements are coming in from
outside this chat, expected to need rearchitecting parts of this
project, and asked for the repo to be left in a clean, fully-documented
state for a fresh chat session to pick up. Confirmed `git status` was
already clean with nothing uncommitted, and added the HANDOFF NOTE at
the top of this file. No requirement details were given to this
session — deliberately not guessed at or built against.
Files touched: `PROJECT_STATUS.md` only (this entry + the top-of-file
note + a pointer in §4).
Decisions made: none.
Deviations from spec: none.
Bugs found/fixed: none.
Left in a broken/incomplete state: nothing code-wise. Priority-B is
paused, not abandoned — dedup detection (Pass 21) still needs its
real-machine verification pass, and richer partner profiles is still
unstarted, exactly as Pass 21 left them. See §1/§4/§6 for the current
snapshot of that, and the top-of-file HANDOFF NOTE before doing
anything with it.
Anything the next person picking this up needs to know: **get the new
requirements from frPyP before resuming §6 below or assuming the
existing schema/contract/architecture holds** — that's the entire
point of this pass.

---

## 1. Current phase

**Session 1 is done** (confirmed against the real database — see Pass 5).
**Session 2 (auth) is done and confirmed** against the live server and real
Neon database — see Pass 7. **Session 3 (citizen submission form +
dashboard) is done and confirmed** end-to-end, live — see Pass 8.
**Session 4 (keyword-match categorization + auto-routing) is done and
confirmed** against the live server and real Neon database — see Pass
11. **Session 5 (partner dashboard: assigned list, set team, status
transitions) is done and confirmed** at the API level against the same
live database — see Pass 11 (the `/partner` frontend page itself hasn't
been manually clicked through yet, though the endpoints it relies on are
now verified). Session 5 was originally written ahead of Session 4's
live verification as a one-off, director-approved exception to the
normal phase-order rule (Pass 10) — that exception is now closed out,
both were verified together as required, and phase-order discipline is
back to normal (one session at a time) going forward.
**Session 6 (notifications) is done and confirmed** live — both the
API (create-triggers, list, mark-read) and the frontend UI (dashboard
render, click-to-mark-read) — verified against the real Neon database
on a real machine — see Pass 13. **Session 7 (admin dashboard) is done
and confirmed live** — `GET /admin/dashboard` and the `/admin` frontend
page were both verified against the real Neon database on a real
machine (Pass 15), including a bug found and fixed during that check
(admin post-login redirect was going to `/dashboard` instead of
`/admin` — see §5). **Session 8 (polish) is done and confirmed live**
— the accessibility and mobile-layout fixes were written Pass 16, and
the live-verification half (full §7 checklist as one continuous pass,
real-browser mobile-resize check, `/partner` click-through) was run
and confirmed by frPyP on a real machine — see Pass 17. **All 8 sessions of Priority-A scope were
written and verified live, and Session 9 (deploy) is now also closed
(Pass 18)** — deployed to Vercel/Render/Neon, production data
confirmed seeded, full demo story rehearsed live end to end, README +
architecture diagram added. **All 9 sessions of PROJECT_REFERENCE.md
§5 are complete — the project is now in Priority-B territory (§2),
started by explicit request, not assumed.** Of the four Priority-B
items picked: **richer error states and admin manual reassignment are
both done and verified live (Pass 19, verification Pass 20). Dedup
detection is written (Pass 21) but not yet live-verified** — needs a
real machine, same as reassignment before it. Richer partner profiles
hasn't been started.

## 1a. Who owns what (fill in once assigned)

| Area | Owner | Status |
|---|---|---|
| Citizen (auth + submission + dashboard) | _unassigned_ | not started |
| Partner + Routing (categorization, routing, partner dashboard, notifications) | _unassigned_ | not started |
| Dashboard + Admin | _unassigned_ | not started |

Stick to your lane unless you've pulled latest and checked this file — two
people editing the same module in the same day is how things get lost.

---

## 1b. Team roles

| Name | Role |
|---|---|
| frPyP | Project Director |
| Preza | QA & Build Tooling |
| devansh4281 | Lead Backend Developer |

---

## 2. Repo state

- Repo initialized: **Yes**
- Remote: `github.com/friPyp/projectDT2026`
- Package manager: **pnpm** (v9.x — v10+ has a build-approval gate that
  didn't play well with the dev sandbox used for this session; either
  version is fine on a normal machine, this is not a hard requirement)
- Branch strategy: `main` = always working/demoable. Feature branches per
  person per task, e.g. `feat/citizen-submission`. PR into `main` when a pass
  is done and this file is updated. (Team is 2 non-technical + 1 technical —
  direct push to `main` with pull-first discipline is fine if PRs prove to be
  too much overhead.)

---

## 3. What's built (exhaustive, not summarized)

### Backend
- Endpoints implemented: `GET /api/v1/health` (DB-ping, not a real feature
  endpoint); `POST /api/v1/auth/register`, `POST /api/v1/auth/login`,
  `POST /api/v1/auth/logout` (written Pass 6, **verified working against
  the real Neon database Pass 7**); `POST /api/v1/challenges` (written
  Pass 8, **auto-categorization + auto-routing added Pass 9, verified
  live Pass 11**), `GET /api/v1/challenges` (CITIZEN branch
  written Pass 8, **verified working against the real Neon database
  Pass 8**; PARTNER branch added Pass 10, **verified live Pass 11**),
  `PATCH /api/v1/challenges/:id/team`, `PATCH /api/v1/challenges/:id/status`
  (both PARTNER only, both new Pass 10, **verified live Pass 11**);
  `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`
  (both new Pass 12, **verified live Pass 13**)
- Middleware implemented: `cors`, `express.json()`, `requireAuth`,
  `requireRole(...roles)` (Pass 6)
- Modules scaffolded: `src/index.ts`, `src/prisma.ts`, `prisma/schema.prisma`,
  `prisma/seed.ts`, `src/routes/auth.ts`, `src/routes/challenges.ts`,
  `src/middleware/auth.ts`, `src/utils/jwt.ts`, `src/utils/errors.ts`,
  `src/validation/auth.ts`, `src/validation/challenges.ts`,
  `src/lib/categorize.ts`, `src/lib/routing.ts` (both Pass 9),
  `src/routes/notifications.ts`, `src/lib/notify.ts` (both Pass 12)

### Database
- Prisma schema written: **Yes** (`apps/backend/prisma/schema.prisma`)
- Tables migrated: **Yes — confirmed applied to the real Neon database**
  (migration `20260909050527_init`, run via Termux + proot-distro Ubuntu)
- Seed data present: **Yes — confirmed in the real database** (inserted via
  raw SQL directly in Neon's SQL editor, not through Prisma's seed script,
  due to an isolated Prisma-engine-under-proot issue on the dev phone used
  — see Pass 5. Verified with `SELECT email, role FROM users` returning
  all 6 expected rows.)

### Frontend
- Pages implemented: `/login`, `/register`, `/submit` (citizen challenge
  submission form), `/dashboard` (own challenges + status) — all written
  Pass 8, **verified working end-to-end against the real Neon database**;
  `/partner` (assigned challenges, set team, move status forward) — new
  Pass 10; the endpoints it calls are **verified live Pass 11**, but the
  page itself hasn't been manually clicked through in a browser yet
- Shared components: `AppLayout` (nav bar + logout) — Pass 8;
  `ProtectedRoute` — Pass 8, generalized Pass 10 with an optional `role`
  prop (defaults to `CITIZEN`, so its original behavior for existing pages
  is unchanged) so `/partner` can reuse it
- Tailwind / React Router / React Hook Form / Zod / TanStack Query:
  **Yes, all installed and wired up** (Tailwind v4 via @tailwindcss/vite,
  Router + QueryClientProvider + AuthProvider active in main.tsx). `pnpm
  build` and `pnpm dev` both verified working (re-confirmed `pnpm build`
  Pass 10 after the partner dashboard page was added).
- API client / TanStack Query hooks set up: **Yes** (`src/lib/api.ts`
  fetch wrapper + typed helpers, `src/lib/auth.tsx` context wrapping
  token/user, used by `useQuery`/`useMutation` in the dashboard and
  submission form) — Pass 8; partner-dashboard helpers
  (`getAssignedChallenges`/`updateChallengeTeam`/`updateChallengeStatus`)
  and role-aware post-login redirect added Pass 10;
  `getNotifications`/`markNotificationRead` added Pass 12
- Citizen `/dashboard` page: **notifications list added Pass 12** —
  shown above the challenges list, unread indicator, click-to-mark-read,
  no polling. **Verified live in a real browser against the live
  backend — Pass 13** (render matched API data exactly; click-to-read
  confirmed to update visually and persist across refresh).

### Auth
- JWT issuing/verifying: **Written Pass 6, verified working against the
  real database Pass 7** — register, login (by phone or email, all three
  roles), and logout all confirmed correct
- Roles enforced: **Written Pass 6, confirmed Pass 7** —
  `requireRole(...roles)` middleware, role read only from the verified JWT
  (never from request body); unauthorized requests confirmed to return the
  correct `UNAUTHORIZED` error shape from §8
- Demo accounts seeded: **Yes — confirmed present in the real database**
  (see Database section above)

### Citizen submission + dashboard
- Challenge submission (`POST /challenges`): **Written and confirmed
  working Pass 8** — creates with `status: SUBMITTED`, no partner assigned
- Citizen dashboard (`GET /challenges`, own only): **Written and confirmed
  working Pass 8**
- Frontend login/register/submit/dashboard pages: **Written and confirmed
  working end-to-end Pass 8**

### Categorization + routing
- Keyword-match categorization function: **Written Pass 9** (`src/lib/
  categorize.ts`) — confirms citizen's chosen category or refines to a
  better keyword match. **Verified live against the real database —
  Pass 11** (both the refine and confirm paths).
- Auto-routing to seeded partners: **Written Pass 9** (`src/lib/
  routing.ts`) — `POST /challenges` now sets `assignedPartnerId` and
  `status: "ASSIGNED"` directly. **Verified live against the real
  database — Pass 11.**

### Partner dashboard
- `GET /challenges` PARTNER branch: **Written Pass 10** — returns only
  challenges where `assignedPartnerId` matches the logged-in partner
  (looked up via `Partner.userId`). **Verified live — Pass 11**
  (confirmed partner3 and partner1 each see only their own).
- `PATCH /challenges/:id/team`: **Written Pass 10** — PARTNER only,
  ownership-checked, sets the plain-text `team` field. **Verified live —
  Pass 11.**
- `PATCH /challenges/:id/status`: **Written Pass 10** — PARTNER only,
  ownership-checked, forward-only transitions
  (`ASSIGNED -> IN_PROGRESS -> COMPLETED`), rejects any skip or backward
  move with `INVALID_STATUS_TRANSITION`. **Verified live — Pass 11**
  (valid forward transition, invalid skip, and final completion all
  confirmed against the real database; ownership check also confirmed —
  a partner attempting to modify another partner's challenge gets 403).
- Frontend `/partner` page: **Written Pass 10** — lists assigned
  challenges, inline team-name save, single "move to next status" button.
  The endpoints it calls are verified live (Pass 11), but the page
  itself hasn't been manually opened/clicked through in a browser yet.

### Notifications
- `GET /notifications` and `PATCH /notifications/:id/read`: **Written
  Pass 12** (`src/routes/notifications.ts`) — own-list read, ownership-
  checked mark-as-read. **Verified live — Pass 13.**
- Trigger points: **Written Pass 12** (`src/lib/notify.ts`) —
  `CHALLENGE_ASSIGNED` fires from `POST /challenges` when auto-routing
  assigns a partner; `STATUS_UPDATED` fires from
  `PATCH /challenges/:id/status` on every valid transition. Both go to
  the citizen who owns the challenge. **Verified live — Pass 13**
  (both trigger points confirmed to fire correctly).
- Frontend: **Written Pass 12** — notifications list on the citizen
  `/dashboard` page (unread indicator, click-to-mark-read, no polling).
  `tsc --noEmit` and `npm run build` both clean. **Verified live in a
  real browser — Pass 13**: list renders correctly, click-to-read
  updates visually and persists across refresh.

### Admin dashboard
- `GET /admin/dashboard`: **Written Pass 14** (`src/routes/admin.ts`) —
  ADMIN only, dedicated query (not reusing `GET /challenges`), returns
  `{ totalChallenges, byDomain, byStatus, partnersEngaged,
  completedCount }` per §8. **Verified live against the real Neon
  database — Pass 15** (counts internally consistent: 6 total
  challenges, byDomain and byStatus both summing to 6, completedCount
  matching byStatus.COMPLETED).
- Frontend `/admin` page: **Written Pass 14** — stat cards + by-status
  and by-domain breakdowns, read-only, no workflow actions. **Verified
  live in a real browser against the live backend — Pass 15** — page
  rendered the same numbers as the API, no console errors.
- Admin post-login redirect: was broken (sent admins to `/dashboard`
  instead of `/admin`, bouncing them back to `/login`) — **found and
  fixed Pass 15**, see §5.

### Session 8 (polish) — DONE, verified live (Pass 17), see §6 for Session 9
- Form accessibility (Login, Register, Submit-challenge pages): every
  field now has a real `<label htmlFor>`/`id` pair,
  `aria-invalid`/`aria-describedby` on validation errors,
  `focus-visible` rings on submit buttons. **Written Pass 16.** Not
  independently re-verified with a screen reader — that's a real-
  browser check, not something `tsc`/`vite build` can confirm.
- Citizen dashboard notifications: unread items converted from a
  click-only `<div>` to real `<button>`s (keyboard-operable); a fetch
  error now shows a message instead of silently rendering nothing.
  **Written Pass 16.**
- Partner dashboard: team-name input now has a (visually-hidden) label;
  `focus-visible` rings added to both buttons. **Written Pass 16.**
- Admin dashboard: `aria-live` on loading, `role="alert"` on error.
  **Written Pass 16.**
- Shared header + citizen dashboard top row: narrow-screen overflow
  risks fixed (title truncation, username hidden below `sm:`, header
  row now stacks instead of squeezing the "New challenge" button).
  **Written Pass 16.** Confirmed by reading the Tailwind breakpoints,
  not by resizing a real browser window yet.
- `tsc --noEmit` and `npm run build` both clean after every change
  this pass.
- **Live-verified — Pass 17:** the full §7 manual checklist (all 14
  items, one continuous sequential pass), the `/partner` page click-
  through, and a real resized-browser/device check of the mobile-
  layout fixes above were all run by frPyP on a real machine with real
  Neon access. No discrepancies found. **Session 8 is closed.**

### Deployment (Session 9)
- Frontend deployed to Vercel: `project-dt-2026-frontend.vercel.app`
- Backend deployed to Render: `projectdt2026.onrender.com` (health
  check confirms DB connectivity)
- Both wired to the existing Neon instance — no new database stood up.
- Production database confirmed seeded with the standard demo accounts
  (§10) — confirmed via a real login against the live URL.
- **Verified live end to end — Pass 18:** full demo story
  (PROJECT_REFERENCE.md §1) run against the deployed URLs by frPyP —
  submission, auto-categorization, auto-routing, partner status
  transitions, citizen-side notifications, and admin dashboard totals
  all confirmed correct.

### Docs
- Root `README.md`: **written Pass 18** — live links, demo accounts,
  tech stack, local dev setup, and a Mermaid architecture diagram.

---

## 4. In progress right now

**See the HANDOFF NOTE at the top of this file first** — new
requirements are coming that may supersede the Priority-B work below.

**In progress: dedup detection needs a real-machine verification pass**
(same reason as every backend change — this sandbox can't generate a
real Prisma Client or hit the live Neon/Render/Vercel stack; see §0
Pass 21 and §6). Richer error states and admin manual reassignment are
both done and verified live. Richer partner profiles — the last
selected Priority-B item — hasn't been started, and per the handoff
note above, shouldn't be assumed to still be the plan.

---

## 5. Known bugs

- **Corrected (Pass 3):** the `"prisma": { "seed": ... }` block was reported
  fixed in both Pass 1 and Pass 2, but had genuinely never been committed to
  `apps/backend/package.json` in either case (Pass 1's fix was made locally
  but never pushed; Pass 2 fixed a related-but-different file and assumed
  this one was already correct). Actually fixed and pushed in Pass 3.
- Fixed (Pass 2): the root `package.json` had been accidentally overwritten
  with a copy of `apps/backend/package.json`'s content (commit `25c8d1a`,
  made via GitHub web UI), deleting the monorepo workspace scripts and
  causing a package-name collision. Restored to correct workspace-root form.
- No longer an issue: earlier concern about Prisma's engine binary being
  unreachable only applied to the dev sandbox used for the initial scaffold
  — running on Termux (via proot-distro Ubuntu, since plain Termux itself
  isn't a real enough Linux environment for Prisma either) worked fine and
  the migration is confirmed applied.
- **New, unresolved (Pass 4):** `npx prisma db seed` (and even `npx prisma
  migrate status`) fail with `P1001: Can't reach database server` when run
  from Termux + proot-distro Ubuntu, despite raw TCP connectivity (`nc -zv`)
  succeeding every time. Tried and ruled out: suspended compute, pooled vs.
  direct connection string, IPv4-vs-IPv6 (both via `/etc/gai.conf` and a
  hardcoded `/etc/hosts` entry), `channel_binding`/`pgbouncer` connection
  flags. Root cause still unknown — possibly a `proot`-specific
  incompatibility with Prisma's query-engine binary specifically (the
  schema-engine binary used by `migrate` worked once, then also failed on
  a later retry, so this isn't fully confirmed either). See Pass 4 for the
  full list of things tried. **Currently working around this by writing
  the seed data via raw SQL directly in Neon's own web SQL editor instead
  of through Prisma at all** — that attempt also hit an error, not yet
  read/diagnosed.
- **Reconfirmed, different sandbox (Pass 10):** this session's sandbox
  couldn't reach Neon either, but with a more specific symptom than
  before — raw TCP to the Neon host times out on port 5432 specifically,
  while HTTPS (443) to the same host completes a full TLS handshake fine.
  Consistent with an egress policy that only allows port 443, not with
  Neon being down or misconfigured. Same for `binaries.prisma.sh`: 403
  from the egress layer on every URL under it, so `prisma generate`
  couldn't run either. Not a new bug — same underlying constraint as
  Pass 4/6/8/9, just diagnosed a bit more precisely this time.
- **Resolved for good, Pass 11:** confirmed once more that a fresh
  sandbox still can't reach Neon's Postgres port (same symptom as Pass
  10), but running the exact same steps on a real machine with genuine
  internet access worked with zero issues — `pnpm install`, `prisma
  generate`, `pnpm dev`, and every DB-backed request all worked on the
  first try. This closes the loop: it was always environment-only, never
  a code or data problem. No further action needed — just keep doing DB
  work on real hardware, not a sandbox.
- **Not a bug, just a testing gotcha (Pass 11):** `POST /auth/login`
  takes `phone` and `email` as two separate optional fields (see §9,
  §validation/auth.ts) — putting an email address under the `phone` key
  looks up by phone number literally and returns `UNAUTHORIZED` rather
  than a clearer validation error. Worth remembering when testing by
  hand; not something to "fix" since the contract itself is correct.
- **Reconfirmed once more, different sandbox (Pass 12):** same
  `binaries.prisma.sh` 403 Forbidden and no-TCP-path-to-Neon symptoms as
  every prior sandboxed pass. Not a new bug — just re-confirms Pass 11's
  conclusion that this is environment-only and the fix is doing DB-
  touching verification on a real machine, not this sandbox.
- **Reconfirmed again, Pass 14 (Session 7 build):** same
  `binaries.prisma.sh` 403 as every prior pass; this time also directly
  confirmed (via a raw TCP connection attempt) that the Neon host times
  out on port 5432 from this sandbox specifically, not just inferred
  from Prisma's error. Not a new bug, no new symptom — just another
  environment (this is a fresh sandbox each pass) hitting the same
  documented wall. Code written this pass was typechecked/built as far
  as this limitation allows; live DB verification still needs a real
  machine, same as every session before it.
- **Found and fixed, Pass 15:** admin post-login redirect went to
  `/dashboard` (CITIZEN-only) instead of `/admin`, bouncing the admin
  straight back to `/login` — looked like login wasn't working at all.
  Root cause: `LoginPage.tsx`'s `dashboardPathFor()` helper (Session 3)
  never got an ADMIN case added when Session 7 introduced the ADMIN
  role's own route — Session 7 updated `App.tsx`'s `HomeRedirect` but
  missed this separate helper. Fixed by adding the ADMIN branch to
  `dashboardPathFor()`. Verified fixed live on a real machine.
- **Reconfirmed once more, Pass 16 (Session 8 start):** same symptom
  as every prior sandboxed pass — direct TCP to Neon's Postgres port
  times out while HTTPS to the same host completes a full TLS
  handshake; `binaries.prisma.sh` also 403s. Checked explicitly with a
  raw TCP test before starting work this time, rather than discovering
  it partway through. Not a new bug, no new symptom — just the same
  documented environment wall (Pass 4/6/8/9/10/11/12/14) hitting a fresh
  sandbox again. Confirms Session 8's live-verification steps (§7
  checklist, mobile resize check, `/partner` click-through) still need
  a real machine, same as every DB-touching step before it.
- **Found and fixed, Pass 16:** the citizen-dashboard notifications
  section silently rendered nothing on a failed fetch — indistinguishable
  from "no notifications yet," so a real fetch failure would look like
  an empty inbox rather than an error. Fixed by giving the error case
  its own `role="alert"` message instead of falling through the same
  `return null` branch as the empty case.

---

## 6. Next task (specific enough that anyone — teammate or fresh chat — can pick it up cold)

**All 9 Priority-A sessions are closed (Pass 18). The project is now
working through Priority-B (§2), by explicit request (frPyP picked all
four non-mobile-polish items) — not started on Claude's own
initiative.**

Status of the four picked items:
- **Richer error states — done, verified live (Pass 19).**
- **Admin manual reassignment — done, verified live (Pass 19,
  verification Pass 20).**
- **Dedup detection — written (Pass 21), needs a real-machine pass:**
  run `prisma generate` + `tsc -b` for `apps/backend`, then submit two
  similar test challenges in the same district and confirm the second
  one's submit page shows a heads-up naming the first. Do this before
  starting the last item.
- **Richer partner profiles — last one.** Proposed field set
  (`description`, `website`, `contactEmail`, all nullable on `Partner`)
  hasn't been confirmed or built; needs a Prisma migration, so also
  needs a real machine to apply.

Either way, same rules as always: flag anything against
PROJECT_REFERENCE.md before proceeding if it conflicts, get a yes
before adding any new library/tool, and log each item as its own pass
in §0 rather than assuming scope.

Environment note carried over for whoever picks up DB- or
deploy-touching work next: sandboxed dev environments (this one
included) have no network access to Neon's Postgres port, Prisma's
engine-download host, or Vercel's/Render's deploy APIs. Pass 11
confirmed the fix is doing that work on a real machine with real
internet access; Pass 18 confirmed the same for a live deploy; Pass 19
hit the same wall again trying to `prisma generate` for the admin
reassignment work.

---

## 7. Key decisions / deviations from original spec (cumulative — never delete)

- Auto-routing on submission instead of a manual admin review/validation
  step — admin is a dashboard viewer for MVP, not a workflow participant.
- No "claim" step for partners — if routed to them, it's immediately theirs.
- No milestones table — single status field on the challenge only.
- Team is a plain text field, not a real team/member entity.
- Partners are seeded demo orgs, not self-registering. Only citizens register
  through the UI.
- No real-time/polling anywhere in this project — plain fetch-on-load is
  sufficient, nothing here needs a "watch it update live" moment.
- Categorization is a keyword-match function, not a real ML model or external
  API call — still satisfies "AI-enabled classification" for demo purposes.
- **API contract is frozen once written — changing an endpoint shape after
  another teammate has built against it requires posting in the group chat
  first, not just editing the file silently.**
- **Added `district` (nullable) to the User model** to resolve a conflict
  between PROJECT_REFERENCE.md §6 (schema) and §8 (API contract) — see Pass 1
  log. PROJECT_REFERENCE.md §6 has now been updated to document this
  (Pass 6) — no longer an open doc gap.
- **`POST /auth/logout` is a no-op confirmation, not a real invalidation.**
  JWT auth is fully stateless (no session/refresh-token table anywhere in
  the schema), so logout just confirms the token was valid; the frontend
  is what actually discards it. See Pass 6 for the reasoning — flagging
  here in case anyone assumed server-side token blacklisting exists.
- **One-off exception to the phase-order rule (Pass 10):** Session 5
  (partner dashboard) was written before Session 4 (categorization +
  routing) was confirmed working against the live database, which the
  project's own rule (stated in Pass 9 and §6) says not to do. This was
  raised explicitly before proceeding — not decided silently — and
  devansh4281 (project director) authorized it given the project's time
  constraints, on the condition both sessions get verified live together
  in one combined pass (see §6). **That condition has now been met (Pass
  11) — the exception is closed.** This was a one-off call for this
  situation, not a change to the standing rule — back to
  one-session-at-a-time starting with Session 6.
- **Correction (added later, not editing the original Pass 10 text
  above):** Pass 10 and the earlier version of §6 referred to
  devansh4281 as "project director." That was inaccurate — **frPyP is
  the actual project director** (see §1b). Flagging this here for
  clarity rather than rewriting the historical log entry.
- **Priority-B, richer error states (Pass 19):** an expired/invalid
  token now force-clears the session and redirects to `/login` with a
  message, instead of showing a confusing error indefinitely. Frontend
  only — no backend or contract change.
- **Priority-B, admin manual reassignment (Pass 19) — two calls made
  explicitly, not decided silently:** (1) reassigning a challenge to a
  different partner resets its status to `ASSIGNED` and clears `team`
  (new partner starts fresh); (2) the new partner now gets a
  `CHALLENGE_ASSIGNED` notification — the first time `notify()` has
  ever been called for a partner userId, which is a deliberate,
  agreed-on exception to the citizen-only note `lib/notify.ts` used to
  have (see that file's updated comment). The previous partner is not
  notified — only the new one was ever asked about. Also: `GET
  /challenges`'s ADMIN branch ("all for ADMIN") was completed as part
  of this — §8 already documented it, Session 7 just never built it.
- **Priority-B, dedup detection (Pass 21):** duplicate check is plain
  word-overlap (Jaccard similarity on significant words) against other
  challenges in the same district — same no-ML philosophy as
  `lib/categorize.ts`, not a real similarity model or external API.
  Per the call made when this was scoped, it never blocks a
  submission: `POST /challenges` always creates the challenge and just
  attaches `possibleDuplicates` (empty if none) to that one response.
  The field isn't stored on the `Challenge` model — computed fresh each
  time, not persisted.

---

## 8. Environment variables needed so far

```
DATABASE_URL=      # Neon Postgres connection string (see repo owner for it; kept out of git)
JWT_SECRET=        # any random string for local dev
PORT=4000          # backend port (Render sets this itself in production)
VITE_API_URL=      # frontend build-time var, base URL + /api/v1 of the backend
                    # (e.g. https://projectdt2026.onrender.com/api/v1 in production;
                    # defaults to http://localhost:4000/api/v1 if unset — see
                    # apps/frontend/src/lib/api.ts). Set on Vercel, not committed.
```

---

## 9. API surface implemented so far

See `PROJECT_REFERENCE.md` §8 for the frozen contract. This section tracks
what's **actually implemented** vs. contracted (may lag behind the contract
early on).

```
GET /api/v1/health   -> { success: true, db: "connected" }   (not part of the
                          frozen contract — internal boot-check only)

POST /api/v1/auth/register   body: { name, phone, password, district } -> { user, token }
POST /api/v1/auth/login      body: { phone | email, password }         -> { user, token }
POST /api/v1/auth/logout     (requires Authorization header)           -> { success: true }

POST /api/v1/challenges   body: { title, description, category, district } -> Challenge
                            (CITIZEN only; category is confirmed/refined by
                            keyword match, status: ASSIGNED with
                            assignedPartnerId set via auto-routing — Pass 9,
                            verified live Pass 11)
GET  /api/v1/challenges   -> Challenge[]  (CITIZEN: own challenges — Pass 8,
                            verified live. PARTNER: assigned challenges only
                            — Pass 10, verified live Pass 11. ADMIN "all" was
                            deliberately not added here — Session 7 built a
                            dedicated admin route/query instead, see below.)
PATCH /api/v1/challenges/:id/team    body: { team } -> Challenge
                            (PARTNER only, ownership-checked — Pass 10,
                            verified live Pass 11)
PATCH /api/v1/challenges/:id/status  body: { status } -> Challenge
                            (PARTNER only, ownership-checked, forward-only
                            transitions ASSIGNED -> IN_PROGRESS -> COMPLETED,
                            409 INVALID_STATUS_TRANSITION otherwise — Pass 10,
                            verified live Pass 11, including the ownership
                            check)

GET   /api/v1/notifications          -> Notification[]  (own list; written
                            Pass 12, verified live Pass 13)
PATCH /api/v1/notifications/:id/read -> Notification    (ownership-checked;
                            written Pass 12, verified live Pass 13)

GET   /api/v1/admin/dashboard -> { totalChallenges, byDomain, byStatus,
                            partnersEngaged, completedCount }
                            (ADMIN only, dedicated query — written Pass 14,
                            verified live Pass 15)
```
Auth: written Pass 6, **verified working against the real database Pass 7**.
Challenges POST/GET base behavior: written Pass 8, **verified working
against the real database Pass 8**. Categorization + auto-routing on POST,
GET's PARTNER branch, and both PATCH endpoints: written Pass 9/10,
**verified live against the real database — Pass 11**. Matches
PROJECT_REFERENCE.md §8 exactly. Notifications endpoints: written Pass
12, **verified live (API + UI) — Pass 13**. Matches PROJECT_REFERENCE.md
§8 exactly. Admin dashboard endpoint: written Pass 14, **verified live
(API + UI) — Pass 15**. Matches PROJECT_REFERENCE.md §8 exactly. All
API endpoints in the frozen §8 contract are now written and verified
live. Session 8 (polish) is also done and verified live (Pass 17), and
Session 9 (deploy) closed out the project (Pass 18) — all 9 sessions
per PROJECT_REFERENCE.md §5 are complete.

---

## 10. Demo accounts

```
CITIZEN: citizen@demo.local / Demo@1234
ADMIN:   admin@demo.local / Demo@1234
PARTNER (x4, seeded, one per domain cluster): partner1@demo.local ... partner4@demo.local / Demo@1234
```

Confirmed present in the real database (verified Pass 5, via direct SQL
query) — safe to log in with these right now.
