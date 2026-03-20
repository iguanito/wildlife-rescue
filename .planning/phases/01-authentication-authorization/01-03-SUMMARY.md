---
phase: 01-authentication-authorization
plan: 03
subsystem: auth
tags: [rbac, role-middleware, access-control, integration-tests]

# Dependency graph
requires:
  - phase: 01-02
    provides: requireRole() middleware factory, authenticateToken wall, User model, auth endpoints
provides:
  - Role-gated animal routes (POST/PUT/DELETE with requireRole)
  - Role-gated medical record routes (PUT/DELETE with requireRole)
  - ACCESS-01 through ACCESS-05 integration tests all passing
affects: [04-frontend-auth, 05-user-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [requireRole() as route middleware argument, loginAs() test helper with real login flow]

key-files:
  created:
    - api/tests/access.test.js (replaced stubs with real implementations)
  modified:
    - api/routes/animals.js
    - api/routes/medical.js

key-decisions:
  - "VALID_ANIMAL in tests uses actual Animal schema fields (commonName, animalGroup, intakeDate) not the plan template's name/species/status which don't exist in the schema"
  - "loginAs() helper creates User directly in DB then performs real login via POST /api/auth/login to get a real cookie — no manual JWT signing"
  - "species.js has only GET routes so no requireRole needed; authenticateToken wall is sufficient"

patterns-established:
  - "requireRole() inserted as second argument between path string and async handler — minimal, non-destructive retrofit"
  - "Access tests use loginAs(role) pattern: create real User → real login → extract cookie → use cookie in requests"

requirements-completed: [ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04, ACCESS-05]

# Metrics
duration: 8min
completed: 2026-03-20
---

# Phase 1 Plan 03: Role-Based Access Control Middleware Summary

**requireRole() middleware retrofitted onto all write routes; all 5 ACCESS integration tests pass (volunteer read-only, staff create, vet medical, admin full access, unauthenticated 401)**

## Performance

- **Duration:** ~8 min
- **Completed:** 2026-03-20
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments

- animals.js retrofitted: POST `/api/animals` requires staff/vet/admin; PUT `/:id` requires staff/vet/admin; DELETE `/:id` requires admin; POST `/:id/medical` requires vet/admin
- medical.js retrofitted: PUT `/:id` requires vet/admin; DELETE `/:id` requires admin
- species.js unchanged — only GET routes, authenticateToken wall is sufficient protection
- ACCESS-01 through ACCESS-05 integration tests: all 5 pass with real login cookies and real DB operations
- Full test suite: 10/10 tests green (4 AUTH + 1 USER + 5 ACCESS)

## Task Commits

1. **Task 1: Retrofit requireRole() onto all existing route handlers** - `1112e60` (feat)
2. **Task 2: Implement ACCESS test stubs with real integration tests** - `43c6b69` (feat)

## Files Created/Modified

- `api/routes/animals.js` - Added requireRole import; 4 write/delete routes now have role middleware
- `api/routes/medical.js` - Added requireRole import; 2 write/delete routes now have role middleware
- `api/tests/access.test.js` - Replaced 5 `throw new Error('not implemented')` stubs with real integration tests

## Decisions Made

- `VALID_ANIMAL` in tests uses `commonName`, `animalGroup`, `intakeDate` (actual Animal schema fields). The plan template showed `name`, `species`, `status: 'Intake'` which don't exist — these were corrected before writing tests.
- `loginAs()` helper pattern: creates a real User in the test DB then calls `POST /api/auth/login` to get a real httpOnly cookie. This exercises the full auth stack rather than manually signing JWTs.
- `species.js` has only GET endpoints — no write routes to protect. Confirmed by reading the file before implementation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] VALID_ANIMAL body uses correct schema fields**
- **Found during:** Task 2 (reading Animal model before writing tests)
- **Issue:** The plan template's `VALID_ANIMAL` used `name`, `species`, `status: 'Intake'` — none of which are fields in the actual Animal Mongoose schema. Using these would cause validation failures or silently ignored fields, making POST tests return 400 instead of 201.
- **Fix:** Used actual schema fields: `commonName`, `animalGroup`, `intakeDate`. The Animal schema has `intakeDate` as the only truly required field (with a default), so a minimal body still creates a valid animal.
- **Files modified:** api/tests/access.test.js
- **Committed in:** `43c6b69`

**2. [Rule 1 - Bug] access.test.js imports bcryptjs directly instead of relying on createTestUser**
- **Found during:** Task 2 (analyzing fixtures.js)
- **Issue:** The plan template imports `createTestUser` from fixtures.js, but a simpler and more explicit pattern is to import `bcryptjs` directly and `User` model directly in the test file — same as what fixtures.js does internally. This avoids an extra layer of indirection and makes the test's setup logic clear.
- **Fix:** Used `bcryptjs.hash()` directly in `loginAs()` helper within the test file, matching the pattern already established in fixtures.js.
- **Files modified:** api/tests/access.test.js
- **Committed in:** `43c6b69`

## Known Stubs

None — all ACCESS tests are fully implemented with real integration test logic.

## Self-Check: PASSED

- api/routes/animals.js: FOUND — 4 requireRole calls (POST /, PUT /:id, DELETE /:id, POST /:id/medical)
- api/routes/medical.js: FOUND — 2 requireRole calls (PUT /:id, DELETE /:id)
- api/tests/access.test.js: FOUND — 5 passing tests, no throw stubs
- Commit 1112e60 (Task 1): FOUND
- Commit 43c6b69 (Task 2): FOUND
- All 10 tests pass: CONFIRMED

---
*Phase: 01-authentication-authorization*
*Completed: 2026-03-20*
