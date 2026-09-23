# PROJECT_REFERENCE.md — SIH26043

> This is the single file to paste into a fresh chat (or hand to a teammate)
> to get them fully oriented with zero other context, alongside
> `PROJECT_STATUS.md` (which says what's actually built so far). This file
> answers "what are we building and how," `PROJECT_STATUS.md` answers "where
> are we right now."
>
> Once endpoint shapes here have been built against by more than one person's
> code, don't silently change them — say so in the group chat first, then
> update this file.

> **This is not an SIH competition submission.** SIH26043 is referenced
> below only as the origin problem statement used to scope this project —
> it's where the domain (citizens/partners/challenges) and the pruned
> feature list in §2 came from. §2, not §1's official component list, is
> the actual build target. Added 2026-09-14 to make explicit what §1/§2's
> "for reference" / "what we're actually building" split already implied
> but didn't say outright — see §9.

---

## 1. What this actually is

**Official SIH problem statement (SIH26043):** Government of Jharkhand — a
platform where citizens submit local societal challenges (education,
agriculture, healthcare, water, environment, etc.), the system routes each one
to a relevant university or industry partner, the partner works the problem,
and government can see aggregate progress on a dashboard.

**The official "expected solution" components** (for reference — see §2 for
what we're actually building of this):
1. Citizen engagement module (submission with evidence/location)
2. AI-enabled categorization + dedup + routing to universities
3. University collaboration module (review, team formation, proposals)
4. Industry partnership module (mentoring, funding, prototyping)
5. Project lifecycle management (milestones, IP, testing, approvals)
6. Visual analytics dashboard
7. Notification/communication system

**The demo story (this is what you're building toward):**
Citizen registers → submits a challenge (title, description, category,
district) → system auto-categorizes and auto-routes it to a seeded
university/industry partner based on domain match → partner logs in, sees it
assigned, types in a team, moves it through
`ASSIGNED → IN_PROGRESS → COMPLETED` → citizen gets notified at each change →
admin dashboard shows totals: challenges by domain, by status, partner
engagement, completion count. If this loop works end to end, the project is
done — everything else is optional polish.

---

## 2. What we're actually building (pruned scope)

> **2026-09-23 — Phase 2 scope, requested by frPyP after the Pass 22
> handoff pause.** All 9 Priority-A sessions + the picked Priority-B
> items below are done (see PROJECT_STATUS.md §0/§1). New requirements
> came in that **do rearchitect part of the core design** — frPyP
> explicitly confirmed: where these conflict with the "non-negotiable"
> items below, the new version wins. See §5a for the new session
> breakdown and §6a/§8a for the schema/contract deltas. This note and
> §5a/§6a/§8a are the source of truth going forward; the original text
> below is kept for history, not overridden silently.

**Build (non-negotiable, Priority A):**
- Citizen registration/login. Partner and admin accounts are **seeded**, not
  self-registered.
- Citizen submits a challenge: title, description, category (picked from a
  fixed list of ~8 domains), district (plain text)
- Backend "AI-enabled categorization": a simple keyword-match function that
  suggests/confirms the domain — no real ML model or external API call
- Auto-routing: on submission, match the challenge's domain against seeded
  partner orgs' declared domains, assign automatically to one
- Partner dashboard: see assigned challenges, set a team (plain text field),
  move status forward (`ASSIGNED → IN_PROGRESS → COMPLETED`)
- Citizen dashboard: see own challenges and their current status
- Notifications: 2 events — `CHALLENGE_ASSIGNED`, `STATUS_UPDATED`
- Admin dashboard: counts by domain, by status, partner engagement,
  completion count — read-only, no workflow actions required for MVP

**Add only if there's time left after the above works (Priority B):**
Admin manual reassignment, dedup detection, richer partner profiles, mobile
polish pass, richer error states.

**Not building at all, don't suggest it, don't let it creep in:**
Real AI/ML model calls, file/photo/video upload, maps/GPS/geolocation,
milestone tracking as a separate entity, IP/patent tracking, real funding or
payment flow, partner self-registration, real-time/live updates (nothing here
needs polling — plain fetch-on-load is enough), microservices, Kubernetes,
chatbots/voice. If a pass starts adding any of this, stop and flag it in
`PROJECT_STATUS.md` rather than building it.

---

## 3. Why some things differ from the "textbook" version of this app

- **Auto-routing instead of manual admin review.** The official ask implies an
  evaluation step; for MVP the system just matches domain-to-partner directly
  on submission. Admin becomes a dashboard viewer, not a workflow participant
  — removes a whole screen and status stage.
- **No "claim" step for partners.** If it's routed to them, it's theirs
  immediately — one less action to build.
- **No milestones table.** Just a single status field on the challenge.
- **Team is a text field**, not a real team/member entity.
- **Partners are seeded demo orgs**, not self-registering — same pattern as
  demo accounts in our other project.
- **No real-time anything.** Nothing here has a "watch it update live" moment
  — plain fetch-on-load/refresh is enough.

---

## 4. Tech stack (fixed — don't introduce anything new without flagging it in the group chat)

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, React Hook
Form, Zod, TanStack Query (for data fetching/caching — no polling needed here)

**Backend:** Node.js, Express, TypeScript

**Database:** PostgreSQL (Neon) + Prisma

**Auth:** JWT, roles CITIZEN / PARTNER / ADMIN, resolved server-side only —
never trust a role sent from the frontend

**Deploy:** Vercel (frontend) / Render (backend) / Neon (Postgres)

**Testing:** Manual checklist (§7), no test framework

---

## 5. Build order — 9 sessions, one lane per teammate where possible

| # | Session | Suggested owner lane |
|---|---|---|
| 1 | Monorepo scaffold, Prisma schema (all tables §6), migration, seed script (demo citizen, ~4 seeded partner orgs with domains, admin account), verify everything boots | whoever starts first |
| 2 | Auth: citizen register/login, partner/admin login (seeded), JWT, roles | Citizen owner |
| 3 | Citizen challenge submission form + citizen dashboard (own challenges + status) | Citizen owner |
| 4 | Backend: keyword-match categorization + auto-routing to a partner on submission | Partner+Routing owner |
| 5 | Partner dashboard: assigned challenges list, set team, status transitions | Partner+Routing owner |
| 6 | Notifications: `CHALLENGE_ASSIGNED` + `STATUS_UPDATED`, citizen sees them | Partner+Routing owner |
| 7 | Admin dashboard: counts by domain/status, partner engagement, completion count | Dashboard+Admin owner |
| 8 | Polish: mobile responsiveness, loading/empty/error states, accessibility, run full manual test pass (§7) | whoever's free |
| 9 | Deploy (Vercel/Render/Neon), seed prod demo data, rehearse the demo story from §1, README + architecture diagram | whoever's free |

Sessions 4–6 depend on 1–3 (routing needs challenges to exist). Session 7
depends on 1–6 (dashboard needs real data to count). Plan around that
dependency, not just "pick any open session."

---

## 5a. Phase 2 — new sessions (requested 2026-09-23, post Pass-22 handoff)

Picked up after all Priority-A/B work above. One session at a time,
same discipline as §5 — don't start the next until the current one's
logged done in PROJECT_STATUS.md.

| # | Session | What | Decision made |
|---|---|---|---|
| 10 | SPA routing fix | Hard refresh / direct URL hit on any frontend route was returning "page not found" — Vercel was serving the static build with no fallback to `index.html`, so React Router never got a chance to handle the route client-side. Fixed with `apps/frontend/vercel.json` rewrite. | No schema/contract impact. |
| 11 | Extra location fields | `state`, `city`, `locality` (all nullable text) + optional plain-text `address` added to `challenges`, citizen-fillable at submission (and on edit, see Session 13). | Plain text only — §2's "no maps/GPS/geolocation" ban still holds, this is not a map picker. |
| 12 | Partner contact channels | Partners declare one or more contact channels (e.g. phone, email, office address — free text per channel, partner's choice which ones); citizens can always see and use these to reach the partner assigned to their challenge directly. Answers frPyP's "direct connection to concerned authorities" ask. | New `PartnerContact` table (see §6a) rather than fixed columns on `partners`, since a partner may have 1+ channels of mixed types. |
| 13 | Citizen challenge editing | Citizen can edit their own challenge's title/description/category/location fields after submission, to add updates (e.g. new developments since filing). Implemented as in-place edit + an append-only `ChallengeEditLog` (see §6a) so partners/admin can see what changed and when, rather than silently overwriting history. Editing is blocked once a challenge is `COMPLETED`. Re-running categorization/routing on edit is explicitly **not** done — an edit does not reassign or re-route; that would undermine the partner's existing work on it. | Claude's call, per frPyP ("do what you feel would be best"). |
| 14 | Transparency / status updates log | New `ChallengeUpdate` entity (see §6a): partners can post short status notes against a challenge (visible to the citizen and admin), separate from the coarse `status` enum. Citizen dashboard shows these as a timeline under each challenge. | New table + new endpoints, additive — doesn't change existing `status` transition logic. |
| 15 | Multi-partner / multi-domain assignment | The core rearchitect: a challenge can be routed to **more than one** partner when it spans multiple domains, instead of the single `assignedPartnerId` model. Citizens get a corresponding option at submission (pick more than one relevant domain, or let auto-categorization suggest multiple). Partners assigned to the same multi-domain challenge get a shared coordination view (see §6a `ChallengeAssignment`). This replaces §6's single `assignedPartnerId` field — confirmed by frPyP as an explicit, intentional break from the original "auto-routing to one partner" design. | frPyP: "wherever it conflicts with the core design, this must be adopted as the new version." |
| 16 | UI/accessibility pass | Visual redesign — less plain, fuller layout, more accessible. No functional/data changes. Claude's call on direction (frPyP: "purely your call"), logged with reasoning when done rather than guessed at silently. | Claude's call. |
| 17 | Public accountability dashboard | New, unauthenticated public page: aggregate stats per district/domain — issues resolved this period, average resolution time, partner performance — no individual citizen data. Turns Session 14's transparency data into something the public/officials can see, not just the filer. Added at frPyP's request after Claude proposed it as a way to actually deliver on "distinguish from MyGate," rather than leaving that as an unimplemented note (see the paragraph below). | Claude's proposal, frPyP confirmed adding it (2026-09-23). |
| 18 | Co-signing ("me too") on existing issues | Instead of dedup detection only warning/blocking a near-duplicate submission, let a citizen co-sign an existing open issue near them instead of filing a new one. Issues with more co-signers surface higher for the assigned partner(s) — a real prioritization signal, not just a duplicate filter. Depends on dedup detection (old Priority-B, Pass 21) already being live-verified, since this builds directly on that matching logic. | Claude's proposal, frPyP confirmed adding it (2026-09-23). |

Sessions 11–15 all touch schema — every one of them needs a real
`prisma migrate` + live-DB verification pass on a real machine, same
constraint documented throughout PROJECT_STATUS.md §5/§6/§0 since
Pass 1. Session 15 (multi-partner) is the biggest and should be done
last, once 11–14 are verified live and stable, since it touches
routing, partner dashboard, and notifications that are otherwise
untouched Priority-A code. Sessions 17 and 18 also touch schema (new
tables, see §6a) — 17 depends on Session 14's data existing, 18
depends on dedup detection (old Priority-B) being live-verified.

**Distinguishing the project itself (frPyP's ask, "vs Jio MyGate/apartment
apps"):** originally left as pure context/rationale rather than a coded
feature — the structural difference already exists: this routes citizen-
reported issues to university/industry partners at a district/state
government scale, not building/society management. Sessions 14
(transparency) and 15 (multi-domain routing) are the two Phase 2 items
that most reinforce that distinction in practice. **Update, 2026-09-23:**
frPyP pushed back on leaving this as just a structural side-effect, so
Claude proposed three concrete features and frPyP picked two to actually
build — Sessions 17 (public accountability dashboard) and 18
(co-signing/"me too" on existing issues) above. A third idea (SLA-based
auto-escalation on unactioned issues) was proposed but not picked; not
added to the roadmap.

---

## 6. Database schema (source of truth = `prisma/schema.prisma` once written)

Tables: `users`, `partners`, `challenges`, `notifications`

**users:** id, name, phone/email, passwordHash, role, district (nullable),
createdAt
Role: `CITIZEN | PARTNER | ADMIN`
District is nullable because seeded partner/admin accounts don't have one —
only citizens provide it (see `/auth/register` in §8). Added in Session 1 to
resolve a conflict between this section and §8; see PROJECT_STATUS.md §0
Pass 1 and §7 for the full history.

**partners:** id, userId (login), orgName, type (`UNIVERSITY | INDUSTRY`),
domains (list of domain values this partner covers), createdAt

**challenges:** id, citizenId, title, description, category, district, status,
assignedPartnerId, team (text, nullable), createdAt, updatedAt
Status: `SUBMITTED | ASSIGNED | IN_PROGRESS | COMPLETED`
Category (fixed list of 8): `EDUCATION | AGRICULTURE | HEALTHCARE | WATER |
ENVIRONMENT | ENERGY | URBAN_DEVELOPMENT | PUBLIC_ADMIN`

**notifications:** id, userId, title, message, type, read, createdAt
Type: `CHALLENGE_ASSIGNED | STATUS_UPDATED`

---

## 6a. Phase 2 schema deltas (source of truth = `prisma/schema.prisma` once each session lands)

**challenges** — add: `state` (nullable String), `city` (nullable
String), `locality` (nullable String), `address` (nullable String, free
text). `assignedPartnerId` (single FK) is **replaced** by the
`ChallengeAssignment` join table below once Session 15 lands — kept
until then so Sessions 11–14 don't have to wait on the big rearchitect.

**ChallengeAssignment** (new, Session 15): id, challengeId, partnerId,
assignedAt. One row per partner assigned to a challenge — a
single-domain challenge just gets one row, replicating today's
behavior exactly.

**PartnerContact** (new, Session 12): id, partnerId, label (e.g.
"Phone", "Email", "Office"; partner's own free text, not a fixed enum),
value (free text — the actual number/address/email), createdAt.

**ChallengeEditLog** (new, Session 13): id, challengeId, editedAt,
changedFields (JSON — before/after per field touched). Append-only,
never edited or deleted.

**ChallengeUpdate** (new, Session 14): id, challengeId, partnerId,
note (text), createdAt. Partner-authored, citizen/admin-visible,
append-only.

**ChallengeCosign** (new, Session 18): id, challengeId, citizenId,
createdAt. Unique on (challengeId, citizenId) — one co-sign per
citizen per issue. Cosign count surfaces to the assigned partner(s)
as a prioritization signal.

Session 17 (public accountability dashboard) needs no new table —
it's read-only aggregate queries over existing `challenges` +
`ChallengeUpdate` data (resolution counts/times per district/domain,
partner performance), exposed via a new public endpoint (see §8a).
No individual citizen data exposed.

---

## 7. Manual test checklist (run before every demo, not just once)

1. Citizen registration works
2. Citizen login works
3. Citizen can submit a challenge with a category and district
4. Submitted challenge gets auto-categorized/confirmed correctly
5. Submitted challenge gets auto-routed to a partner whose domains match
6. Partner sees the assigned challenge on login
7. Partner can set a team and move status ASSIGNED → IN_PROGRESS
8. Partner can move status IN_PROGRESS → COMPLETED
9. Citizen sees the status update on their dashboard
10. Notification appears for `CHALLENGE_ASSIGNED` and `STATUS_UPDATED`
11. Citizen cannot see another citizen's challenges
12. Citizen cannot modify a challenge's status
13. Partner cannot see challenges assigned to a different partner
14. Admin dashboard totals match actual data (spot-check counts)

---

## 8. API contract (frozen shapes — build against these, don't improvise)

Base URL: `/api/v1`. Auth via `Authorization: Bearer <token>`.

### Auth
```
POST /auth/register   body: { name, phone, password, district } -> { user, token }   (citizens only)
POST /auth/login      body: { phone | email, password } -> { user, token }
POST /auth/logout
```

### Challenges
```
POST /challenges                body: { title, description, category, district } -> Challenge & { possibleDuplicates: {id,title}[] } (auto-routed on creation; possibleDuplicates is a Priority-B addition — see below, always present, empty array if none found, never blocks creation)
GET  /challenges                -> Challenge[]  (own for CITIZEN, assigned for PARTNER, all for ADMIN)
GET  /challenges/:id            -> Challenge
PATCH /challenges/:id/team      body: { team }                (PARTNER only)
PATCH /challenges/:id/status    body: { status }               (PARTNER only, validated transitions)
```

### Notifications
```
GET   /notifications             -> Notification[]
PATCH /notifications/:id/read
```

### Admin
```
GET   /admin/dashboard                    -> { totalChallenges, byDomain: {...}, byStatus: {...}, partnersEngaged, completedCount }
GET   /admin/partners                     -> Partner[]                                  (Priority-B addition)
PATCH /admin/challenges/:id/reassign       body: { partnerId } -> Challenge              (Priority-B addition)
```
`/admin/partners` and the reassign endpoint were added for Priority-B's
admin manual reassignment (§2) — not in the original session-by-session
build. Reassigning sets `assignedPartnerId` to the given partner,
resets `status` to `ASSIGNED`, and clears `team` (the new partner
starts fresh); it also sends the new partner a `CHALLENGE_ASSIGNED`
notification (see §9's changelog entry and PROJECT_STATUS.md §7 for the
call that was made on both of those).

### Error shape (all endpoints)
```json
{
  "success": false,
  "error": { "code": "INVALID_STATUS_TRANSITION", "message": "Cannot move from SUBMITTED to COMPLETED directly." }
}
```
Codes: `UNAUTHORIZED`, `FORBIDDEN`, `INVALID_STATUS_TRANSITION`,
`CHALLENGE_NOT_FOUND`, `VALIDATION_ERROR`, `NO_MATCHING_PARTNER` (fallback:
assign to a default/general partner if no domain match found)

---

## 8a. Phase 2 API contract deltas (append as each session lands)

```
POST /challenges   body now also accepts optional { state, city, locality, address }
                    and optional { domains: string[] } (Session 15 — plural,
                    replaces single implicit category-routing once live;
                    until Session 15 lands, single-category behavior is
                    unchanged)
PATCH /challenges/:id           body: any of { title, description, category,
                    domains, state, city, locality, address } -> Challenge
                    (CITIZEN only, own challenge, blocked once COMPLETED —
                    Session 13)

GET  /partners/:id/contacts     -> PartnerContact[]   (Session 12, public
                    to any authenticated user who can see that challenge)
POST /partners/me/contacts      body: { label, value } -> PartnerContact
                    (PARTNER only, own record — Session 12)

GET  /challenges/:id/updates    -> ChallengeUpdate[]   (Session 14)
POST /challenges/:id/updates    body: { note } -> ChallengeUpdate
                    (PARTNER only, must be assigned to that challenge)

GET  /public/stats              -> aggregate resolution counts/times +
                    partner performance, by district/domain (Session 17,
                    no auth required, no individual citizen data)

POST /challenges/:id/cosign     -> ChallengeCosign   (Session 18,
                    CITIZEN only, one per citizen per challenge;
                    surfaces alongside dedup-detection's existing
                    near-duplicate warning as an alternative to filing
                    a new report)
```
Session 15's exact reassignment/multi-assign endpoint shapes to be
appended here once that session starts — not fully speced yet, since
11–14 land first.

---

## 9. Change log for this file (append, never silently edit sections above without a note here)

- 2026-09-10 — §6 updated to document the nullable `district` field on
  `users`, which was added to the actual schema back in Session 1 but never
  reflected here until now (flagged as outstanding in PROJECT_STATUS.md §7
  since Pass 1). No behavior changed — this just corrects the doc to match
  the schema that's already been running in prod.
- 2026-09-14 — frPyP — added a top-of-file note making explicit that this
  isn't an SIH competition submission; SIH26043 is background/scoping
  reference only, and §2 (not §1's official component list) is the real
  build target. No scope, schema, or contract changed — this only makes
  explicit a distinction the file's own §1/§2 wording already implied.
- 2026-09-16 — frPyP — Priority-B admin manual reassignment: added
  `GET /admin/partners` and `PATCH /admin/challenges/:id/reassign` to
  §8 (new endpoints, nothing existing changed shape). Also completed
  `GET /challenges`'s ADMIN branch, which §8 already documented
  ("all for ADMIN") but Session 7 never actually built — see
  PROJECT_STATUS.md §7 for the two calls made on reassignment's exact
  behavior (status reset, new-partner notification).
- 2026-09-16 — frPyP — Priority-B dedup detection: `POST /challenges`
  now always returns a `possibleDuplicates` array alongside the created
  Challenge (empty if none found) — plain word-overlap against other
  challenges in the same district, see `lib/dedup.ts`. Additive only;
  the existing `Challenge` fields in the response are unchanged, and
  nothing about creation itself changed — duplicates are never blocked,
  per the call made when this was scoped (PROJECT_STATUS.md §7).
- 2026-09-23 — frPyP (via chat) — Phase 2 kickoff, resolving the Pass
  22 handoff note. Added §5a (six new sessions), §6a (schema deltas),
  §8a (API contract deltas), and a note at the top of §2 confirming
  that where new requirements conflict with the original "non-
  negotiable" design (specifically: single-partner auto-routing),
  the new version wins — explicit call, not silently decided. Two
  items (citizen editing's exact mechanics, and UI direction) were
  explicitly left to Claude's judgment by frPyP; reasoning for both
  logged in §5a.
- 2026-09-23 — frPyP (via chat) — Added Sessions 17 (public
  accountability dashboard) and 18 (co-signing/"me too" on existing
  issues) to §5a, plus their schema notes in §6a (`ChallengeCosign`
  table) and endpoints in §8a (`GET /public/stats`, `POST
  /challenges/:id/cosign`). These came from Claude proposing three
  concrete "what makes this different from MyGate" features after
  frPyP pushed back on that being left as unimplemented context;
  frPyP picked two of the three. A third (SLA-based auto-escalation)
  was proposed but not picked, not added to the roadmap.
