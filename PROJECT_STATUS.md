# PROJECT_STATUS.md — SIH26043

> **How this file works:** rewritten in full after every single pass by whoever
> just worked, before they stop. Not a periodic changelog. Anyone pulling the
> repo — teammate or a fresh Claude chat — should be able to read this file
> alone and know exactly what state things are in, who to ask, and what to do
> next. Commit this file in the same commit as the code it describes.
>
> **3-person rule:** always `git pull` before starting a pass and `git push`
> right after updating this file. If two people worked at the same time, the
> git conflict on THIS file is a feature — it's how you notice it happened.

---

## 0. Session log (append one entry per pass — never delete old entries)

_(empty — no passes yet, this is the reset point for SIH26043)_

Format for each entry going forward:
```
### Pass N — <date> — <owner name> — <one-line summary>
Branch/commit: <branch name and/or commit hash>
Did:
Files touched:
Decisions made:
Deviations from spec (if any):
Bugs found/fixed:
Left in a broken/incomplete state (if any):
Anything the next person needs to know before touching this area:
```

---

## 1. Current phase

**Not started.** Next action is Session 1 from `PROJECT_REFERENCE.md` §5:
monorepo scaffold, Prisma schema, migration, seed script, verify everything
boots.

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

- Repo initialized: **No**
- Remote: _n/a_
- Package manager: _not yet decided (default pnpm unless told otherwise)_
- Branch strategy: `main` = always working/demoable. Feature branches per
  person per task, e.g. `feat/citizen-submission`. PR into `main` when a pass
  is done and this file is updated. (Team is 2 non-technical + 1 technical —
  direct push to `main` with pull-first discipline is fine if PRs prove to be
  too much overhead.)

---

## 3. What's built (exhaustive, not summarized)

### Backend
- Endpoints implemented: _none_
- Middleware implemented: _none_
- Modules scaffolded: _none_

### Database
- Prisma schema written: **No**
- Tables migrated: _none_
- Seed data present: **No**

### Frontend
- Pages implemented: _none_
- Shared components: _none_
- API client / TanStack Query hooks set up: **No**

### Auth
- JWT issuing/verifying: **No**
- Roles enforced: **No**
- Demo accounts seeded: **No**

### Categorization + routing
- Keyword-match categorization function: **No**
- Auto-routing to seeded partners: **No**

### Notifications
- Implemented: **No**

---

## 4. In progress right now

_(nothing — not started)_
List who is actively mid-pass on what, so a teammate doesn't start the same
module in parallel.

---

## 5. Known bugs

_(none yet)_

---

## 6. Next task (specific enough that anyone — teammate or fresh chat — can pick it up cold)

Start Session 1 from `PROJECT_REFERENCE.md`: monorepo scaffold, Prisma schema
covering `users`, `partners`, `challenges`, `notifications` (see §6 of that
file), initial migration, seed script (1 demo citizen, ~4 seeded partner orgs
each with a few domains, 1 admin account), verify frontend/backend/DB all
boot.

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

---

## 8. Environment variables needed so far

```
DATABASE_URL=
JWT_SECRET=
PORT=
```

---

## 9. API surface implemented so far

See `PROJECT_REFERENCE.md` §8 for the frozen contract. This section tracks
what's **actually implemented** vs. contracted (may lag behind the contract
early on).

_(none implemented yet)_

---

## 10. Demo accounts

```
CITIZEN: citizen@demo.local / <password>
ADMIN:   admin@demo.local / <password>
PARTNER (x4, seeded, one per domain cluster): partner1@demo.local ... partner4@demo.local / <password>
```
