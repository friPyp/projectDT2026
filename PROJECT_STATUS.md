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

## 1. Current phase

**Session 1 is done** (confirmed against the real database — see Pass 5).
**Session 2 (auth) is done and confirmed** against the live server and real
Neon database — see Pass 7. **Session 3 (citizen submission form +
dashboard) is done and confirmed** end-to-end, live — see Pass 8.
**Session 4 (keyword-match categorization + auto-routing) is written but
not yet verified against the live database** — see Pass 9. Verify it
first, then Session 5 (partner dashboard) is next — see §6. Do not start
Session 5 or anything beyond Session 4's scope until Session 4 is
confirmed working.

## 1a. Who owns what (fill in once assigned)

| Area | Owner | Status |
|---|---|---|
| Citizen (auth + submission + dashboard) | _unassigned_ | not started |
| Partner + Routing (categorization, routing, partner dashboard, notifications) | _unassigned_ | not started |
| Dashboard + Admin | _unassigned_ | not started |

Stick to your lane unless you've pulled latest and checked this file — two
people editing the same module in the same day is how things get lost.

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
  Pass 8, **auto-categorization + auto-routing added Pass 9, not yet
  verified live — see Pass 9**), `GET /api/v1/challenges` (CITIZEN only —
  written Pass 8, **verified working against the real Neon database
  Pass 8**, unchanged by Pass 9)
- Middleware implemented: `cors`, `express.json()`, `requireAuth`,
  `requireRole(...roles)` (Pass 6)
- Modules scaffolded: `src/index.ts`, `src/prisma.ts`, `prisma/schema.prisma`,
  `prisma/seed.ts`, `src/routes/auth.ts`, `src/routes/challenges.ts`,
  `src/middleware/auth.ts`, `src/utils/jwt.ts`, `src/utils/errors.ts`,
  `src/validation/auth.ts`, `src/validation/challenges.ts`,
  `src/lib/categorize.ts`, `src/lib/routing.ts` (both new, Pass 9)

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
  Pass 8, **verified working end-to-end against the real Neon database**
- Shared components: `AppLayout` (nav bar + logout), `ProtectedRoute`
  (redirects to `/login` if not a logged-in citizen) — Pass 8
- Tailwind / React Router / React Hook Form / Zod / TanStack Query:
  **Yes, all installed and wired up** (Tailwind v4 via @tailwindcss/vite,
  Router + QueryClientProvider + AuthProvider active in main.tsx). `pnpm
  build` and `pnpm dev` both verified working.
- API client / TanStack Query hooks set up: **Yes** (`src/lib/api.ts`
  fetch wrapper + typed helpers, `src/lib/auth.tsx` context wrapping
  token/user, used by `useQuery`/`useMutation` in the dashboard and
  submission form) — Pass 8

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
  better keyword match. Verified in isolation (pure-logic test, no DB);
  **not yet verified live against the real database**.
- Auto-routing to seeded partners: **Written Pass 9** (`src/lib/
  routing.ts`) — `POST /challenges` now sets `assignedPartnerId` and
  `status: "ASSIGNED"` directly. **Not yet verified live** — see Pass 9
  for exact steps to confirm on a real machine.

### Notifications
- Implemented: **No** (session 6)

---

## 4. In progress right now

Session 4 (keyword-match categorization + auto-routing) is **written but
not yet verified against the live database** — see Pass 9 for exact
verification steps. Once confirmed, Session 5 (partner dashboard) is
next — see §6.

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

---

## 6. Next task (specific enough that anyone — teammate or fresh chat — can pick it up cold)

**Immediate: verify Session 4 (Pass 9) against the live database** — the
code is written (`src/lib/categorize.ts`, `src/lib/routing.ts`, updated
`POST /challenges`), but has not been run against the real Neon database
yet. See Pass 9's "Anything the next person picking this up needs to
know" for the exact commands and a concrete test case. Do this before
starting Session 5.

**After that's confirmed: Session 5 — Partner dashboard**
(per PROJECT_REFERENCE.md §5, Partner+Routing lane):
- Partner login (already works, from Session 2) leads to a dashboard
  listing challenges where `assignedPartnerId` matches the logged-in
  partner (extend `GET /api/v1/challenges`'s PARTNER branch — currently
  only the CITIZEN branch is built, see `src/routes/challenges.ts`).
- `PATCH /challenges/:id/team` (PARTNER only, per §8) — set the plain-text
  `team` field.
- `PATCH /challenges/:id/status` (PARTNER only, per §8) — validated
  transitions only: `ASSIGNED → IN_PROGRESS → COMPLETED`. Reject
  skipping a step (e.g. `ASSIGNED → COMPLETED` directly) with the
  `INVALID_STATUS_TRANSITION` error code from §8.
- A partner must only see/act on their own assigned challenges — not
  challenges assigned to a different partner (§7 checklist items 7, 8, 13).
- Do **not** build notifications yet (Session 6) or the admin dashboard
  (Session 7) — just the partner's own view and actions on their
  assigned challenges.

One environment note carried over: if testing from a phone via
Termux+proot, expect Prisma's query engine to fail to connect even when
the database is fine (Session 1, Pass 5). Sandboxed dev environments used
for earlier passes have a different but equally blocking issue: no
network access to Neon or Prisma's engine-download host at all (Session 2,
Pass 6; reconfirmed Session 3 Pass 8; reconfirmed Session 4 Pass 9).
Either way — verify on a normal machine with real internet access.

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

---

## 8. Environment variables needed so far

```
DATABASE_URL=      # Neon Postgres connection string (see repo owner for it; kept out of git)
JWT_SECRET=        # any random string for local dev
PORT=4000
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
                            not yet verified live, see §0 Pass 9 / §4)
GET  /api/v1/challenges   -> Challenge[]  (CITIZEN only for now — returns the
                            caller's own challenges; PARTNER "assigned" and
                            ADMIN "all" branches are Sessions 5/7, not built yet)
```
Auth: written Pass 6, **verified working against the real database Pass 7**.
Challenges POST/GET base behavior: written Pass 8, **verified working
against the real database Pass 8**. Categorization + auto-routing on POST:
written Pass 9, **not yet verified against the real database** — see
Pass 9. Matches PROJECT_REFERENCE.md §8 exactly once verified.

---

## 10. Demo accounts

```
CITIZEN: citizen@demo.local / Demo@1234
ADMIN:   admin@demo.local / Demo@1234
PARTNER (x4, seeded, one per domain cluster): partner1@demo.local ... partner4@demo.local / Demo@1234
```

Confirmed present in the real database (verified Pass 5, via direct SQL
query) — safe to log in with these right now.
