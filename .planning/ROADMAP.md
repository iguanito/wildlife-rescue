# Roadmap: Wildlife Rescue Manager

**Created:** 2026-03-20
**Granularity:** Standard (5-8 phases)
**Coverage:** 25/25 v1 requirements mapped

---

## Phases

- [ ] **Phase 1: Authentication & Authorization** - Secure login, role-based access, retrofit existing routes
- [ ] **Phase 2: Animal Detail & Care Log Foundation** - Timeline view, care log model, quick-add form
- [ ] **Phase 3: Daily Care Dashboard** - Today's tasks, animal status counts, care gaps
- [ ] **Phase 4: Outcome Recording & Status Workflow** - Release/transfer/death tracking, status validation
- [ ] **Phase 5: User Management** - Admin user CRUD, account activation, role assignment
- [ ] **Phase 6: Reporting & Statistics** - Animals by species, outcomes, date filtering, exports

---

## Phase Details

### Phase 1: Authentication & Authorization

**Goal**: Users can securely log in with email/password and access features based on their role. All existing routes are protected and enforce role-based access server-side.

**Depends on**: None (foundation phase)

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04, ACCESS-05

**Success Criteria** (what must be TRUE when this phase completes):
1. User can create an account with email and password, then log in with those credentials
2. User session persists across browser restarts (httpOnly cookie-based, not localStorage)
3. User can log out from any page and is redirected to login
4. Every user has one of four assigned roles: admin, staff, vet, or volunteer
5. Volunteer can view animal records but all write endpoints (create animal, add medical record, add care log) reject their requests with 403
6. Staff can create animals and add care logs; vet can create/edit medical records; admin has full access
7. All API write routes enforce server-side role checks (frontend gates are UX only; direct API calls respect roles)
8. Login page accepts email/password, validates against User collection, and issues httpOnly JWT cookie

**Architectural Context**:
- Express middleware validates JWT from httpOnly cookies on every request, attaches `req.user` to request
- Retrofit auth middleware to existing `/api/animals` and `/api/medical-records` routes (must happen atomically in this phase)
- Add `createdBy` field to MedicalRecord schema to track audit trail
- User model includes email (unique), password (bcrypt hashed), role enum, and soft-delete support

**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Test infrastructure: Jest + Supertest setup, test DB helpers, 10 failing stubs for AUTH/ACCESS requirements
- [x] 01-02-PLAN.md — API auth core: User model, auth middleware, login/logout/me routes, MedicalRecord retrofit, seed script, index.js wiring
- [x] 01-03-PLAN.md — Route retrofit: requireRole() on all existing animals/medical/species write routes; ACCESS integration tests
- [x] 01-04-PLAN.md — Frontend auth: AuthContext, ProtectedRoute, Login page, role-aware Layout, app wiring + human verification

---

### Phase 2: Animal Detail & Care Log Foundation

**Goal**: Users can view a complete, chronological history of an animal's intake, daily care, medical treatments, and outcomes all on one page. The CareLog data model is created with performance index upfront.

**Depends on**: Phase 1 (requires authenticated `req.user` for care log attribution)

**Requirements**: CARE-01, CARE-02, CARE-03, DETAIL-01, DETAIL-02

**Success Criteria** (what must be TRUE when this phase completes):
1. User can view an animal's detail page showing all intake fields (species, rescue location, date arrived, etc.)
2. User can scroll a chronological timeline on the detail page showing: intake date, all care logs grouped by date, all medical records, and (later) outcome
3. Staff can add a care log entry to an animal with: date, type (feeding/weight/observation), value/notes, user automatically captured
4. Care logs appear in the animal timeline immediately after creation
5. Clicking "add care log" opens a form that includes date picker and type selector (no free-text type entry)
6. Query for "get all care logs for animal X" completes in < 100ms even after 6 months of accumulated data (backed by compound index on `{animalId, date, type}`)

**Architectural Context**:
- CareLog Mongoose model created with fields: animalId (ref), date, type enum, value, notes, createdBy (ref User), compound index on `{animalId, date, type}`
- Activity date (when care happened) is distinct from submission date (when user logged it) — CareLog stores both
- Animal detail page queries MedicalRecords and CareLog and merges chronologically
- Timeline is read-only in Phase 2; edits added in later phases if needed

**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — CareLog model + nested API routes: schema with compound index, GET/POST /carelogs endpoints in animals router
- [x] 02-02-PLAN.md — Wave 0 test stubs: care-log.test.js (CARE-01/02/03) and animal-detail.test.js (DETAIL-01/02)
- [ ] 02-03-PLAN.md — AnimalDetail frontend refactor: unified timeline merge, day grouping, compact/expand care logs, inline add-care-log form + human verification
- [x] 02-04-PLAN.md — Integration tests: fill in stub implementations for all 5 Phase 2 requirement tests

---

### Phase 3: Daily Care Dashboard

**Goal**: Staff see a dashboard every morning showing which animals need care entries today, grouped by care type, and a quick summary of all animals by status.

**Depends on**: Phase 2 (requires CareLog data and compound index to exist), Phase 1 (requires authenticated user)

**Requirements**: DASH-01, DASH-02, DASH-03

**Success Criteria** (what must be TRUE when this phase completes):
1. Staff can navigate to a dashboard page showing "today's tasks" — animals that are "In Care" but have no care log entry yet for today
2. Dashboard displays each animal needing care, grouped by care type needed (feeding, weight, observation)
3. Dashboard shows a widget with counts of all animals by status: "In Care", "Ready for Release", "Released", "Transferred", "Deceased"
4. Clicking an animal in the dashboard (either in today's tasks or in the status summary) navigates to its detail page
5. Dashboard API endpoint returns results in < 500ms even after 6 months of accumulated data (queries use the Phase 2 compound index)
6. Care type selection on dashboard quick-add forms matches the CareLog type enum (no free-text entry)

**Architectural Context**:
- Dashboard API endpoint: GET `/api/dashboard/today` queries animals with status "In Care", finds which ones lack today's care logs by type, returns gaps
- Aggregation pipeline uses compound index and today's date range filtering
- Dashboard includes quick-add form for each missing care type (UX convenience)
- Status counts widget fetches from separate aggregation (all animals grouped by status, excludes soft-deleted)

**Plans**: TBD

---

### Phase 4: Outcome Recording & Status Workflow

**Goal**: Staff can record the final outcome for an animal (released, transferred, or deceased) with location/destination details, and the animal status transitions to a terminal state.

**Depends on**: Phase 1 (for createdBy audit trail), Phase 2 (outcomes appear in timeline)

**Requirements**: OUTCOME-01, OUTCOME-02, OUTCOME-03

**Success Criteria** (what must be TRUE when this phase completes):
1. Staff can open an animal detail page and see an "Record Outcome" button (only visible if status is "Ready for Release")
2. Clicking "Record Outcome" opens a form asking for: outcome type (Released/Transferred/Deceased), outcome date, and type-specific details (release location, transfer center, or cause of death)
3. Submitting the form updates the animal's status to a terminal state (Released, Transferred, or Deceased) and creates an Outcome record
4. The outcome appears in the animal's timeline on the detail page, after all care logs
5. Once status is terminal, the animal no longer appears in dashboard tasks or status counts
6. Outcome includes createdBy field to track which user recorded it
7. Invalid status transitions are rejected (e.g., cannot go Released → Intake without special admin override)
8. Soft-delete support: animals are never hard-deleted; "deleted" status is tracked via `deletedAt` field for archival

**Architectural Context**:
- Outcome sub-document or separate collection (consistent with existing MedicalRecord pattern)
- Animal status field is enum-validated with transitions: Intake → In Care → Ready for Release → {Released, Transferred, Deceased} (terminal)
- Soft deletes implemented via `deletedAt` field on Animal; all queries filter with `{deletedAt: null}` by default
- Outcome is immutable once created (edit not needed in v1; admin delete with confirmation only)

**Plans**: TBD

---

### Phase 5: User Management

**Goal**: Admin can create new user accounts, assign roles, and deactivate users. User lifecycle is fully managed in the app.

**Depends on**: Phase 1 (auth system must exist), Phase 4 (soft-delete pattern established)

**Requirements**: USER-01, USER-02, USER-03

**Success Criteria** (what must be TRUE when this phase completes):
1. Admin can navigate to a "Users" page in the app (not accessible to other roles)
2. Admin can see a list of all users: email, role, active/inactive status
3. Admin can click "Create User" and enter: email, initial password, role (admin/staff/vet/volunteer)
4. Admin can click "Deactivate" on a user (soft delete via `deletedAt`); the user's login immediately fails
5. Admin can click "Reactivate" on a deactivated user to restore access
6. Admin can click a user's role and change it (staff → vet, etc.); the change takes effect on next login
7. User creation triggers no email (v2 feature); initial password is displayed once and admin must communicate it separately

**Architectural Context**:
- User model includes: email, passwordHash (bcryptjs), role enum, createdAt, deletedAt (for soft delete), updatedAt
- Admin-only `/api/users` endpoints: GET (list), POST (create), PATCH (update role, reactivate), DELETE (soft delete with confirmation)
- Deactivated users are filtered from login (check `deletedAt` during JWT issuance)
- Password reset not in v1 scope

**Plans**: TBD

---

### Phase 6: Reporting & Statistics

**Goal**: Admin and staff can generate summary statistics (total animals by species, outcomes, recovery rates) filtered by date range for grant reports and operational insights.

**Depends on**: Phase 2 (care logs), Phase 4 (outcomes), all prior phases (data must exist)

**Requirements**: REPORT-01, REPORT-02

**Success Criteria** (what must be TRUE when this phase completes):
1. Admin can navigate to a "Reports" page (may be accessible to staff, TBD)
2. Reports page displays: "Total animals received" count, breakdown by species (chart), count of each outcome type (chart)
3. User can filter statistics by date range: "This month", "This year", or custom date range picker
4. Charts update instantly when date filter changes
5. User can export report as CSV (animal list with species, status, outcome) or PDF (summary with charts)
6. Queries complete in < 2 seconds even after 1+ years of accumulated data (uses MongoDB aggregation with maxTimeMS limit)

**Architectural Context**:
- Reporting uses MongoDB aggregation pipelines grouped by species, status, outcome type, with `$match` on date ranges
- Frontend charts built with recharts library (Tailwind-friendly, ~500KB)
- CSV export uses PapaParse (browser-side, no server dependency)
- PDF export uses @react-pdf/renderer (React components render as PDF)
- Optional caching layer (Redis or in-memory) for report results if needed during Phase 6 planning

**Plans**: TBD

---

## Progress Tracking

| Phase | Goal | Requirements | Success Criteria | Status |
|-------|------|--------------|------------------|--------|
| 1 | Auth & Authorization | 3/4 | In Progress|  |
| 2 | Detail & Care Foundation | 3/4 | In Progress|  |
| 3 | Daily Dashboard | 3 | 6 | Not started |
| 4 | Outcome & Status | 3 | 8 | Not started |
| 5 | User Management | 3 | 7 | Not started |
| 6 | Reporting & Statistics | 2 | 6 | Not started |

---

## Dependency Graph

```
Phase 1 (Auth)
├── Phase 2 (Detail & Care)
│   ├── Phase 3 (Dashboard)
│   └── Phase 4 (Outcome)
│       └── Phase 5 (User Management)
│           └── Phase 6 (Reporting)
```

All phases depend on Phase 1 because every user action needs `req.user` context and role validation.

---

## Coverage Validation

✓ **All 25 v1 requirements mapped to exactly one phase:**

| Category | Requirements | Phase |
|----------|--------------|-------|
| Authentication | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | Phase 1 |
| Access Control | ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04, ACCESS-05 | Phase 1 |
| User Management | USER-01, USER-02, USER-03 | Phase 5 |
| Care Logs | CARE-01, CARE-02, CARE-03 | Phase 2 |
| Detail & Timeline | DETAIL-01, DETAIL-02 | Phase 2 |
| Outcome | OUTCOME-01, OUTCOME-02, OUTCOME-03 | Phase 4 |
| Dashboard | DASH-01, DASH-02, DASH-03 | Phase 3 |
| Reporting | REPORT-01, REPORT-02 | Phase 6 |

**Total mapped: 25/25 ✓ No orphaned requirements**

---

## Notes for Planning

### Phase 1 Specific Alerts

- **Auth retrofitting is atomic:** All existing routes (`/api/animals`, `/api/medical-records`) get auth middleware in one go during Phase 1, not incrementally. Audit the full route table when implementing.
- **JWT storage:** Must use httpOnly, SameSite=Strict cookies, never return token to JavaScript or store in localStorage.
- **MedicalRecord retrofit:** Add `createdBy` field to existing MedicalRecord schema in Phase 1 for audit trail.

### Phase 2 Specific Alerts

- **Compound index:** CareLog model must create index `{animalId: 1, date: -1, type: 1}` from day one. Do not add retroactively.
- **Date distinction:** Activity date (when care happened) ≠ submission date (when logged). Store both.

### Phase 3 Specific Alerts

- **Query performance validation:** Dashboard query should be prototyped during planning phase to confirm compound index effectiveness.

### Phase 4 Specific Alerts

- **Soft deletes:** Add `deletedAt` field to Animal, not hard delete. Prevents accidental data loss.
- **Status enum validation:** Enforce Animal.status as enum; validate transitions to prevent invalid state changes.

### Phase 6 Specific Alerts

- **Aggregation performance:** Add `maxTimeMS` timeout to reporting queries to prevent event loop blocking.
- **Caching consideration:** May want to cache report results (5-minute TTL) if queries approach timeout limits.

---

*Roadmap created: 2026-03-20*
*Granularity: Standard (6 phases, all natural delivery boundaries)*
*Status: Phase 1 planning complete (2026-03-20); Phase 2 planning complete (2026-03-20)*
