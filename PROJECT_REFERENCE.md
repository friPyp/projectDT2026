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

## 6. Database schema (source of truth = `prisma/schema.prisma` once written)

Tables: `users`, `partners`, `challenges`, `notifications`

**users:** id, name, phone/email, passwordHash, role, createdAt
Role: `CITIZEN | PARTNER | ADMIN`

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
POST /challenges                body: { title, description, category, district } -> Challenge (auto-routed on creation)
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
GET /admin/dashboard   -> { totalChallenges, byDomain: {...}, byStatus: {...}, partnersEngaged, completedCount }
```

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

## 9. Change log for this file (append, never silently edit sections above without a note here)

_(no changes yet — initial version, replaces the SIH26032 reference doc)_
