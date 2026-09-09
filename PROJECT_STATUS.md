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
- Scaffolded frontend with Vite React-TS template — Tailwind, Router, React
  Hook Form, Zod, TanStack Query **not yet added** (next step, see §6)
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
- **Prisma engine binary cannot be downloaded from this dev sandbox.**
  `prisma generate`, `prisma migrate dev`, and the seed script all require
  downloading a native engine from `binaries.prisma.sh`, which is not
  reachable from this sandbox's network (confirmed across two Prisma
  versions — not a version-specific bug, a network allowlist issue).
  **This means: schema.prisma has been written and reviewed by eye against
  REFERENCE §6, but has NOT been run against the real Neon database yet.**
  A real Neon project was created (frPyP) and its connection string is in
  `apps/backend/.env` (gitignored, not pushed) — the DB itself is empty,
  no migration has been applied to it yet.
- Frontend scaffold exists (Vite/React/TS boots) but Tailwind, React Router,
  React Hook Form, Zod, and TanStack Query — all named in REFERENCE §4 — are
  NOT installed yet. This was interrupted mid-pass by a checkpoint push
  request; work continues same session.
- `apps/backend/src/prisma.ts` type-checked against a generic Prisma client
  stub, not real generated types (since `generate` never completed) — so
  even the TypeScript check on that one file isn't a full guarantee.
Anything the next person picking this up needs to know:
- **First real task on any machine without the sandbox's network
  restriction:** `cd apps/backend`, put the real `DATABASE_URL` in `.env`
  (ask frPyP for the Neon string, or check your own Neon dashboard), run
  `pnpm install`, `npx prisma migrate dev --name init`, then
  `npx prisma db seed` (or `pnpm seed`). This should work fine outside this
  sandbox — the block is sandbox-specific, not a code problem.
- Do not treat "Session 1" as done until that migration + seed has actually
  been run and confirmed once, and frontend deps (Tailwind/Router/RHF/Zod/
  TanStack Query) are installed and the frontend still boots after.

---

## 1. Current phase

**Session 1 in progress (not complete).** Scaffold and schema are written;
migration/seed unverified (sandbox network limitation, see Pass 1 log above);
frontend needs its remaining dependencies installed. This is a mid-session
checkpoint push, not an end-of-session state — work is continuing.

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
- Prisma schema written: **Yes** (`apps/backend/prisma/schema.prisma`) —
  written and reviewed, **not yet run against a real database**
- Tables migrated: **No** (blocked, see Pass 1 log)
- Seed data present: **No** (seed script written, not yet executed)

### Frontend
- Pages implemented: _none_ — default Vite starter page only
- Shared components: _none_
- Tailwind / React Router / React Hook Form / Zod / TanStack Query:
  **not yet installed** (in progress)
- API client / TanStack Query hooks set up: **No**

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

frPyP, same session: finishing frontend dependency install
(Tailwind, React Router, React Hook Form, Zod, TanStack Query), then
attempting migration/seed on a non-sandboxed machine, then a full boot check
of both apps together.

---

## 5. Known bugs

- None in application logic. One environment limitation: Prisma's native
  engine binary cannot be fetched from this dev sandbox's network
  (`binaries.prisma.sh` unreachable) — not a bug in the code, but blocks
  in-sandbox verification of anything touching the database. Documented in
  Pass 1 log above.

---

## 6. Next task (specific enough that anyone — teammate or fresh chat — can pick it up cold)

Finish Session 1:
1. Install remaining frontend deps: `pnpm --filter frontend add tailwindcss
   @tailwindcss/vite react-router-dom react-hook-form zod
   @tanstack/react-query` (or current recommended Tailwind v4 Vite setup —
   check Tailwind's own install docs at build time since versions move fast)
2. Confirm frontend still boots (`pnpm dev:frontend`) after adding these
3. Run `npx prisma migrate dev --name init` and `pnpm seed` against the real
   Neon database **on a machine with normal internet access** (not the
   dev sandbox used for Pass 1 — see that log entry for why)
4. Confirm backend boots and `GET /api/v1/health` returns
   `{ success: true, db: "connected" }`
5. Once all four of the above are confirmed, Session 1 is actually done and
   Session 2 (auth) can start

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
DATABASE_URL=      # Neon Postgres connection string (see frPyP for it; kept out of git)
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

<!-- push test: connectivity check by devansh4281, 2026-09-02T06:24Z -->
<!-- push test: connectivity check by Preza, 2026-09-07T06:54:54Z -->
