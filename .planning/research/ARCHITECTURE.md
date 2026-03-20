# Architecture Research: Wildlife Rescue Manager

**Research date:** 2026-03-20
**Context:** Adding auth, care logs, outcome tracking, dashboard, and reporting to existing React + Express + MongoDB app

## Existing Architecture

```
frontend/src/          React SPA (Vite)
  pages/               AnimalList, AnimalCreate, AnimalDetail
  components/          Form steps, MapPicker, species autocomplete

api/
  routes/              animals.js, species.js
  models/              Animal.js, MedicalRecord.js, Species.js
  index.js             Express app
  db.js                MongoDB connection
```

## New Components to Add

### Backend (api/)

**New models:**
- `User` — email, passwordHash, role (admin|staff|vet|volunteer), active
- `CareLog` — animalId, date, type (feeding|weight|observation), value, notes, createdBy
- `Animal` — extend with `outcomeType`, `outcomeDate`, `outcomeNotes`, `releasedTo`

**New routes:**
- `auth.js` — POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- `users.js` — CRUD on User (admin only)
- `care-logs.js` — POST/GET /api/animals/:id/care-logs
- `dashboard.js` — GET /api/dashboard (today's stats + alerts)
- `reports.js` — GET /api/reports/summary (aggregations)

**New middleware:**
- `authenticate.js` — Verify JWT from httpOnly cookie, attach `req.user`
- `requireRole.js` — Check role before protected routes

### Frontend (frontend/src/)

**New pages:**
- `Login.jsx` — Email/password form
- `Dashboard.jsx` — Today view, animal counts, alerts
- `AnimalDetail.jsx` — Full timeline (intake + care logs + medical records + outcome)
- `CareLogAdd.jsx` — Quick-add form (embedded in AnimalDetail)
- `OutcomeRecord.jsx` — Record release/transfer/death
- `AdminUsers.jsx` — User management (admin only)
- `Reports.jsx` — Charts and statistics

**New shared components:**
- `AuthContext.jsx` — React context for current user + role
- `ProtectedRoute.jsx` — Redirect to login if unauthenticated
- `RoleGate.jsx` — Conditionally render based on role

## Data Flow: Authentication

```
Login form → POST /api/auth/login
  → bcrypt.compare(password, hash)
  → jwt.sign({userId, role})
  → Set httpOnly cookie
  → Return user object (no token in body)

Subsequent requests:
  → Cookie sent automatically
  → authenticate middleware: jwt.verify → req.user
  → Route handler runs with req.user.role available
```

## Data Flow: Daily Care Dashboard

```
GET /api/dashboard
  → Find all animals with status "In Care"
  → For each: find latest CareLog of each type today
  → Return: animals needing feeding, weight check, observation
  → Frontend renders "Today's Tasks" list

Staff marks task done:
  → POST /api/animals/:id/care-logs { type, value, notes }
  → Dashboard refreshes
```

## Suggested Build Order

1. **Auth first** — Everything else needs `req.user`. Blocks all other features.
2. **Animal Detail page** — Central hub; dashboard and care logs both reference it.
3. **Daily Care Logs** — Core data entry; feeds the dashboard.
4. **Dashboard** — Depends on care log data existing.
5. **Outcome Recording** — Extend animal status workflow.
6. **User Management** — Admin tooling, lower urgency.
7. **Reporting** — Aggregation queries; needs data to be meaningful.

## Integration Points

| New feature | Connects to existing |
|-------------|---------------------|
| Auth middleware | All existing `api/routes/*.js` need `authenticate` added |
| CareLog model | References `Animal._id` (same pattern as MedicalRecord) |
| Animal Detail timeline | Queries Animal + MedicalRecord + CareLog + outcome fields |
| Dashboard | Queries Animal (status filter) + CareLog (today filter) |
| Reports | MongoDB aggregations on Animal collection |

---
*Research: 2026-03-20*
