---
phase: 02-animal-detail-care-log-foundation
plan: 01
subsystem: api
tags: [mongoose, mongodb, express, care-logs, compound-index]

# Dependency graph
requires:
  - phase: 01-auth-authorization
    provides: requireRole middleware, req.user attachment from JWT, User model with email/role
provides:
  - CareLog Mongoose model with compound index on {animal, date, type}
  - GET /api/animals/:id/carelogs — returns array sorted by date desc with createdBy populated
  - POST /api/animals/:id/carelogs — requires staff/vet/admin role, captures createdBy from req.user._id
affects:
  - 02-02 (animal detail page — frontend fetches /carelogs endpoint)
  - 02-03 (care log form — frontend POSTs to /carelogs endpoint)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Activity date (date) vs submission date (submittedAt) as distinct fields in CareLog"
    - "POST route sets createdBy from req.user._id overriding any req.body value"
    - "POST route uses CareLog.findById().populate() for response (not log.populate()) — avoids Mongoose v8 chaining issues"

key-files:
  created:
    - api/models/CareLog.js
  modified:
    - api/routes/animals.js

key-decisions:
  - "date field has NO default — staff must explicitly provide activity date (not submission time)"
  - "submittedAt has default Date.now — captures when the log entry was recorded in the system"
  - "createdBy is required: true (not default: null like MedicalRecord) — attribution mandatory from day one"
  - "GET /carelogs populates createdBy.email and createdBy.role for display without additional queries"

patterns-established:
  - "Nested carelogs routes follow same structure as /medical routes with added populate() calls"
  - "requireRole('staff', 'vet', 'admin') for care log writes — volunteers read-only"

requirements-completed: [CARE-01, CARE-02, CARE-03]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 02 Plan 01: CareLog Backend Summary

**CareLog Mongoose model with compound index {animal,date,type} and nested REST routes GET/POST /api/animals/:id/carelogs with role-based access and createdBy attribution**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T00:19:35Z
- **Completed:** 2026-03-23T00:25:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- CareLog model with 7 fields: animal ref, date (activity, no default), submittedAt (submission, default now), type enum, value, notes, createdBy (required User ref), plus Mongoose timestamps
- Compound index `{ animal: 1, date: -1, type: 1 }` for performant dashboard queries at scale
- GET /api/animals/:id/carelogs returns logs sorted by date desc with createdBy.email and createdBy.role populated
- POST /api/animals/:id/carelogs enforces staff/vet/admin role, always sets createdBy from req.user._id
- All 17 tests pass: CARE-01, CARE-02, CARE-03 plus all Phase 1 tests (no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CareLog Mongoose model with compound index** - `41cd2a3` (feat)
2. **Task 2: Add GET and POST /api/animals/:id/carelogs nested routes** - `38bded6` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `api/models/CareLog.js` - CareLog Mongoose schema with 7 fields, compound index, CommonJS export
- `api/routes/animals.js` - Added CareLog require and two nested routes before module.exports

## Decisions Made

- `createdBy` is `required: true` (not `default: null` like MedicalRecord) — care logs must always have attribution, so this stricter requirement is intentional from day one
- `date` has no default because the activity date must be staff-provided — defaulting to submission time would lose the care timeline
- `submittedAt` captures when the system received the entry, which may differ from when care actually happened

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

MongoDB was not running locally — started a Docker container (`mongo:6.0`) to run the test suite. All 17 tests passed once the connection was available.

## User Setup Required

None - no external service configuration required. (MongoDB must be running for the API to function; existing `.env` setup unchanged.)

## Next Phase Readiness

- CareLog API endpoints fully operational and tested
- Frontend (Plan 02-02 and 02-03) can now fetch and POST to `/api/animals/:id/carelogs`
- Compound index ensures care log queries will scale to thousands of animals

---
*Phase: 02-animal-detail-care-log-foundation*
*Completed: 2026-03-23*
