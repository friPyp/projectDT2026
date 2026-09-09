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

---

## 1. Current phase

**Session 1 nearly done — one step left, blocked on environment access, not
on unresolved work.** Scaffold, schema, and frontend are all done and
verified. The migration has been confirmed applied against the real Neon
database. The root package.json regression from between passes has been
fixed and verified. The only remaining step is running the seed script
(config fix is in place, confirmed clean by Pass 2, just needs to actually
be run somewhere with real DB network access) and one final health-check
confirmation.

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
- Endpoints implemented: `GET /api/v1/health` only (DB-ping check, not a
  real feature endpoint)
- Middleware implemented: `cors`, `express.json()` only
- Modules scaffolded: `src/index.ts`, `src/prisma.ts`, `prisma/schema.prisma`,
  `prisma/seed.ts`

### Database
- Prisma schema written: **Yes** (`apps/backend/prisma/schema.prisma`)
- Tables migrated: **Yes — confirmed applied to the real Neon database**
  (migration `20260909050527_init`, run via Termux + proot-distro Ubuntu)
- Seed data present: **Not yet confirmed** — failed once on a missing
  `package.json` config (fixed in Pass 1), then a separate accidental
  overwrite of the root `package.json` was found and fixed in Pass 2.
  Re-run still pending — needs real DB network access.

### Frontend
- Pages implemented: _none_ — single placeholder page proving boot only
- Shared components: _none_
- Tailwind / React Router / React Hook Form / Zod / TanStack Query:
  **Yes, all installed and wired up** (Tailwind v4 via @tailwindcss/vite,
  Router + QueryClientProvider active in main.tsx). `pnpm build` and
  `pnpm dev` both verified working.
- API client / TanStack Query hooks set up: **No** (provider wired, no
  actual queries/hooks yet — that's session 3+)

### Auth
- JWT issuing/verifying: **No** (session 2)
- Roles enforced: **No** (session 2)
- Demo accounts seeded: **No** (script written, not run — see above)

### Categorization + routing
- Keyword-match categorization function: **No** (session 4, not started —
  correctly not built ahead of phase)
- Auto-routing to seeded partners: **No** (session 4)

### Notifications
- Implemented: **No** (session 6)

---

## 4. In progress right now

Nothing actively in progress. Waiting on someone with real DB network access
to run the seed + health-check commands in §6 below to close out Session 1.

---

## 5. Known bugs

- Fixed (Pass 1): seed script couldn't run because `apps/backend/package.json`
  was missing the `"prisma": { "seed": ... }` config block.
- Fixed (Pass 2): the root `package.json` had been accidentally overwritten
  with a copy of `apps/backend/package.json`'s content (commit `25c8d1a`),
  deleting the monorepo workspace scripts and causing a package-name
  collision. Restored to correct workspace-root form.
- No longer an issue: earlier concern about Prisma's engine binary being
  unreachable only applied to the dev sandbox used for the initial scaffold
  — running on Termux (via proot-distro Ubuntu, since plain Termux itself
  isn't a real enough Linux environment for Prisma either) worked fine and
  the migration is confirmed applied.
- Ongoing environment note: the working environment used for Pass 2 also
  cannot reach the Neon database host or Prisma's engine-download host
  (both outside its network allowlist) — same category of limitation as
  the original dev sandbox in Pass 1, just a different sandbox. Not a
  project bug, just means the seed/health-check step needs to run somewhere
  with real network access (a normal machine, or Termux + proot-distro
  Ubuntu).

---

## 6. Next task (specific enough that anyone — teammate or fresh chat — can pick it up cold)

Finish Session 1 (last step) — run this on a real Linux environment (normal
machine, or Termux + proot-distro Ubuntu), NOT a restricted sandbox:

```
cd apps/backend
npx prisma generate
npx prisma db seed
pnpm dev                                    # leave running in one terminal
curl http://localhost:4000/api/v1/health    # run in a second terminal
```

Expect the seed to create/upsert the citizen, admin, and 4 partner demo
accounts with no errors, and the health check to return
`{ success: true, db: "connected" }`.

Once that's confirmed, Session 1 is fully done and Session 2 (auth) can
start. Migration is already confirmed working — nothing left to do there.
Frontend scaffold is already done and boot-verified — nothing left to do
there either. Root `package.json` regression is fixed — nothing left to do
there either.

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
  log. PROJECT_REFERENCE.md §6 itself still needs a corresponding update by
  whoever's next in that file (per REFERENCE §9's change-log rule).

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
```

---

## 10. Demo accounts

```
CITIZEN: citizen@demo.local / Demo@1234
ADMIN:   admin@demo.local / Demo@1234
PARTNER (x4, seeded, one per domain cluster): partner1@demo.local ... partner4@demo.local / Demo@1234
```

Note: these accounts exist in the seed script but have **not yet been
created in the real database** — see §3 and §6 above.
