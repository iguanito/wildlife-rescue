---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 03
status: unknown
last_updated: "2026-03-24T00:12:53.802Z"
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 11
  completed_plans: 10
---

# Project State: Wildlife Rescue Manager

**Milestone:** v1 Feature Implementation
**Current Phase:** 03
**Session:** Plan 03-02 executed 2026-03-24 — Dashboard backend: followUpCompleted schema field, PATCH /api/medical/:id, GET /api/dashboard/today and /status; all 6 DASH tests GREEN (23/23 total)

---

## Project Reference

**Core Value:** Every animal's complete journey — intake, daily care, medical treatment, and outcome — is tracked in one place so nothing falls through the cracks.

**Tech Stack:** React 18 + Vite (frontend) | Express 4 + Mongoose 8 (API) | MongoDB (database) | Tailwind CSS 3 (styling)

**Scale:** Thousands of animals per year; data volume is real. Search, filtering, and quick data entry matter more than visual polish.

**Brownfield Context:** Animal intake form and listing already built. New features build on existing codebase, models, and architecture.

---

## Current Position

Phase: 03 (daily-care-dashboard) — EXECUTING
Plan: 3 of 3

## Requirements Coverage

**Total v1 requirements:** 25
**Mapped to phases:** 25
**Unmapped (orphans):** 0

**By phase:**

- Phase 1: 9 requirements (AUTH × 4, ACCESS × 5)
- Phase 2: 5 requirements (CARE × 3, DETAIL × 2)
- Phase 3: 3 requirements (DASH × 3)
- Phase 4: 3 requirements (OUTCOME × 3)
- Phase 5: 3 requirements (USER × 3)
- Phase 6: 2 requirements (REPORT × 2)

---

## Accumulated Context

### Key Decisions Logged

1. **Test runner bcryptjs timing:** bcryptjs installed as devDependency in Plan 01 (not Plan 02) because fixtures.js has a top-level require that blocks Jest from parsing test files — causes discovery failure rather than red stubs.

2. **Auth-first strategy:** Phase 1 is foundational. Every route needs `req.user` and role validation. No incremental patching; all existing routes retrofitted atomically in Phase 1.

3. **bcryptjs promoted to production dependency:** Plan 02 routes/auth.js and scripts/seed-admin.js require bcryptjs at runtime, not just in tests. Moved from devDependencies to dependencies in package.json.

4. **CORS credentials: true required:** Cookie-based auth needs CORS `credentials: true` and explicit origin. Without it, browsers silently drop cookies on cross-origin requests from Vite dev server.

5. **Test env MONGODB_URI:** api/tests/helpers/env.js must set MONGODB_URI to the test DB or Express middleware's connectDB() fails with undefined URI, causing 500 errors on all auth route tests.

6. **Role matrix enforcement:** requireRole() placed as inline middleware argument per route verb — minimal non-destructive retrofit. GET routes unchanged (all authenticated users can read); POST/PUT require staff/vet/admin; DELETE requires admin; medical writes require vet/admin.

7. **CareLog compound index:** Created in Phase 2, not retroactively. Index on `{animalId: 1, date: -1, type: 1}` ensures dashboard queries scale.

3. **Soft deletes, not hard deletes:** Animal, User, and Outcome records use `deletedAt` field for archival safety. Prevents accidental data loss.

4. **JWT in httpOnly cookies:** Not localStorage. Eliminates XSS token exposure. SameSite=Strict for CSRF protection.

5. **Role checks server-side:** Frontend gates are UX; every write endpoint validates role on the API.

6. **Date distinction in CareLog:** Activity date (when care happened) ≠ submission date (when user logged it). CareLog stores both.

7. **Audit trail via createdBy:** MedicalRecord retrofitted in Phase 1 to add `createdBy`. CareLog includes `createdBy` from day one.

### Architecture Highlights

- **User model:** email (unique), passwordHash (bcryptjs), role enum {admin, staff, vet, volunteer}, createdAt, deletedAt, updatedAt
- **CareLog model:** animalId (ref), date (activity), submittedAt (submission), type enum {feeding, weight, observation}, value, notes, createdBy (ref User)
- **Outcome model:** animalId (ref), date, type enum {released, transferred, deceased}, details (location/destination/cause), createdBy (ref User)
- **Animal model:** Retrofit status to enum {Intake, In Care, Ready for Release, Released, Transferred, Deceased}; add deletedAt for soft delete
- **Express middleware:** JWT verification from httpOnly cookie on every request; `req.user` attached; role checks via `requireRole()` middleware

### Testing Strategy (Placeholder for Planning)

- Phase 1: JWT flow, role checks, login/logout, session persistence
- Phase 2: Timeline merge (intake, care logs, medical), care log creation and indexing
- Phase 3: Dashboard aggregation queries, status count accuracy, today's date filtering
- Phase 4: Status transition validation, outcome recording, soft delete queries
- Phase 5: User CRUD, role assignment, deactivation/reactivation
- Phase 6: Aggregation pipelines, export formats, date range filtering

---

## Performance Targets

| Operation | Target | Driver |
|-----------|--------|--------|
| Care log query (single animal) | < 100ms | Compound index (animalId, date, type) |
| Dashboard today's tasks | < 500ms | Aggregation pipeline with index |
| Status count aggregation | < 500ms | Grouped aggregation, filtered by status |
| Report statistics | < 2s | Aggregation with date range match; consider caching |
| Login | < 1s | JWT validation + bcryptjs check (intentionally slow) |

---

## Session Continuity

**When resuming work:**

1. Next command: `/gsd:execute-phase` for Plan 04 (01-04-PLAN.md) — Frontend auth (AuthContext, ProtectedRoute, Login page)
2. All 10 backend tests pass green (AUTH-01 through AUTH-04, ACCESS-01 through ACCESS-05)
3. All write routes now have requireRole() middleware enforcing the role matrix
4. Before running dev server: add JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD to .env; run `npm run seed:admin --prefix api`

**Blockers / Open Questions:**

- (None)

**Dependencies to confirm during planning:**

- Phase 1 must audit all existing routes in codebase and retrofit auth atomically (research summary flags this as high-priority)
- Phase 2 compound index needs to be verified for performance; if not sufficient during Phase 3 planning, may need additional indexes

---

## Performance Metrics

(To be updated after each phase transition)

- **Auth middleware response time:** TBD (Phase 1)
- **Dashboard query time:** TBD (Phase 3)
- **Reporting query time:** TBD (Phase 6)

---

*State initialized: 2026-03-20*
*Milestone: v1*
*Next: Phase 1 planning*

---

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260330-lgr | Replace care log type selector with feeding/weight/observation text areas | 2026-03-30 | 639a3d1 | [260330-lgr-replace-care-log-type-selector-with-feed](.planning/quick/260330-lgr-replace-care-log-type-selector-with-feed/) |
