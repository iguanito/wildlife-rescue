---
phase: 03-daily-care-dashboard
plan: 01
subsystem: testing
tags: [jest, supertest, dashboard, tdd, wave-0]

requires:
  - phase: 02-care-logs-detail
    provides: "CareLog model, MedicalRecord with createdBy, auth middleware, test helpers (db, fixtures)"

provides:
  - "6 failing test stubs covering DASH-01, DASH-02, DASH-03 (RED state for Plan 02 to turn GREEN)"
  - "Test contract for /api/dashboard/today, /api/dashboard/status, and PATCH /api/medical/:id"

affects: [03-02, 03-03]

tech-stack:
  added: []
  patterns:
    - "Wave 0 TDD: test stubs created before implementation — all 6 fail with assertion errors at correct RED state"
    - "createMedicalRecord() helper reuses Animal.findByIdAndUpdate to set status prior to record creation"

key-files:
  created:
    - api/tests/dashboard.test.js
  modified: []

key-decisions:
  - "followUpCompleted field referenced in stubs but not yet in MedicalRecord schema — Plan 02 adds it; stubs intentionally test the future contract"
  - "PATCH /api/medical/:id stubs fail with 404 (not 405) because route doesn't exist yet — correct RED state"

patterns-established:
  - "createMedicalRecord() helper: updates Animal status to in-center before creating record to ensure dashboard queries can match"

requirements-completed:
  - DASH-01
  - DASH-02
  - DASH-03

duration: 2min
completed: 2026-03-24
---

# Phase 3 Plan 01: Daily Care Dashboard Test Stubs Summary

**6 failing Wave 0 test stubs for dashboard endpoints — RED state covering DASH-01 (today's follow-ups), DASH-02 (status counts), DASH-03 (mark as done PATCH)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T00:06:53Z
- **Completed:** 2026-03-24T00:08:10Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `api/tests/dashboard.test.js` with 6 test stubs across 3 describe blocks
- All 6 tests fail RED (assertion errors, not syntax errors) — confirms endpoints don't exist yet
- Test names match VALIDATION.md patterns exactly: `dash.today`, `dash.today.empty`, `dash.status.zero`, `dash.status.accuracy`, `dash.mark-done`, `dash.mark-done.forbidden`
- Boilerplate mirrors `care-log.test.js` exactly: same imports, lifecycle hooks, login/createAnimal helpers

## Task Commits

1. **Task 1: Write failing test stubs for DASH-01, DASH-02, DASH-03** - `9409adc` (test)

**Plan metadata:** (to be added after docs commit)

## Files Created/Modified

- `api/tests/dashboard.test.js` — 145-line test file with 6 stubs across 3 describe blocks

## Decisions Made

- `followUpCompleted` field referenced in stubs even though MedicalRecord schema doesn't have it yet — this tests the future contract that Plan 02 will implement
- `createMedicalRecord()` helper sets animal status to `in-center` via `Animal.findByIdAndUpdate` before creating the record, ensuring `dash.today` test matches what the dashboard aggregation query will filter on

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Self-Check: PASSED

- `api/tests/dashboard.test.js` — FOUND
- commit `9409adc` — FOUND
- `03-01-SUMMARY.md` — FOUND

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 0 test stubs exist; Plan 02 can implement `/api/dashboard/today`, `/api/dashboard/status`, and add `followUpCompleted` to MedicalRecord to turn tests GREEN
- All 6 tests will remain RED until Plan 02 implementation is complete

---
*Phase: 03-daily-care-dashboard*
*Completed: 2026-03-24*
