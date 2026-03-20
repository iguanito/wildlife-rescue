---
phase: 01-authentication-authorization
plan: 01
subsystem: testing
tags: [jest, supertest, bcryptjs, mongodb, test-helpers]

# Dependency graph
requires: []
provides:
  - Jest + Supertest test infrastructure for api/ with Node.js environment
  - Test DB helpers (connectTestDB, clearTestDB, closeTestDB) targeting wildlife_rescue_test database
  - User fixtures factory (createTestUser, TEST_USERS, TEST_PASSWORDS) with lazy User model require
  - 10 failing test stubs covering AUTH-01 through ACCESS-05 requirements
  - npm test script: jest --runInBand --forceExit
affects: [02-user-model-auth-routes, 03-role-middleware-access-control, 04-frontend-auth]

# Tech tracking
tech-stack:
  added: [jest@29, supertest@7, bcryptjs (devDependency)]
  patterns: [beforeAll/afterAll test lifecycle with MongoDB, lazy require for missing models, --runInBand for serial DB tests]

key-files:
  created:
    - api/jest.config.js
    - api/tests/helpers/db.js
    - api/tests/helpers/fixtures.js
    - api/tests/auth.test.js
    - api/tests/user.test.js
    - api/tests/access.test.js
  modified:
    - api/package.json

key-decisions:
  - "bcryptjs installed as devDependency in Plan 01 (not Plan 02) to prevent test runner failure at module load time"
  - "fixtures.js uses lazy require of User model inside createTestUser() function body to avoid crash before Plan 02 creates User.js"
  - "jest --runInBand ensures tests run serially to prevent test DB collisions between parallel suites"

patterns-established:
  - "Test DB pattern: separate wildlife_rescue_test DB derived from MONGODB_URI by regex replacement"
  - "Fixture pattern: lazy model require inside factory function body, not at module top-level"
  - "Stub pattern: throw new Error('not implemented...') — never test.todo() — to enforce red-first TDD"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, ACCESS-01, ACCESS-02, ACCESS-03, ACCESS-04, ACCESS-05]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 1 Plan 01: Test Infrastructure Summary

**Jest + Supertest scaffold with MongoDB test helpers, user fixtures, and 10 failing stubs covering all AUTH/ACCESS requirements**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T18:08:15Z
- **Completed:** 2026-03-20T18:10:27Z
- **Tasks:** 3 completed
- **Files modified:** 7

## Accomplishments
- Installed Jest 29 + Supertest 7 with `npm test --prefix api` running in serial mode with force-exit
- Created MongoDB test helpers isolating tests to `wildlife_rescue_test` database (never touches production)
- Created user fixtures factory with lazy User model require (handles Plan 02 dependency cleanly)
- Created 10 failing test stubs across 3 test files — all throw `Error('not implemented')` to guarantee red-first TDD

## Task Commits

Each task was committed atomically:

1. **Task 1: Install test dependencies and configure Jest** - `8830bcf` (chore)
2. **Task 2: Create test DB helper and user fixtures** - `4dedf5f` (chore)
3. **Task 3: Create failing test stubs for all 10 requirement behaviors** - `e2d70d8` (test)

## Files Created/Modified
- `api/jest.config.js` - Jest config: node environment, tests/**/*.test.js pattern, 15s timeout
- `api/tests/helpers/db.js` - connectTestDB, clearTestDB, closeTestDB using wildlife_rescue_test DB
- `api/tests/helpers/fixtures.js` - createTestUser factory, TEST_USERS map for 4 roles, TEST_PASSWORDS
- `api/tests/auth.test.js` - 4 stubs: AUTH-01 (×2 login valid/invalid), AUTH-02 (cookie persist), AUTH-03 (logout)
- `api/tests/user.test.js` - 1 stub: AUTH-04 (role enum validation)
- `api/tests/access.test.js` - 5 stubs: ACCESS-01 through ACCESS-05 role-based access scenarios
- `api/package.json` - Added test script, jest, supertest, bcryptjs devDependencies

## Decisions Made
- Installed bcryptjs as devDependency in Plan 01 rather than Plan 02: fixtures.js requires bcryptjs at module load time (top-level require), so it must be present before access.test.js can be parsed by Jest — otherwise module load fails and all tests report as broken rather than red.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed bcryptjs to unblock test runner**
- **Found during:** Task 2 (Create test DB helper and user fixtures)
- **Issue:** access.test.js imports fixtures.js which has `const bcryptjs = require('bcryptjs')` at module top-level. Without bcryptjs installed, Jest cannot parse/load the test file, causing all 10 tests to error at discovery rather than fail red.
- **Fix:** Ran `npm install --save-dev bcryptjs --prefix api` and added to devDependencies in package.json
- **Files modified:** api/package.json, api/package-lock.json
- **Verification:** `node -e "require('bcryptjs')"` exits 0; test files can be loaded
- **Committed in:** `4dedf5f` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for test runner to correctly discover all 10 stubs. No scope creep — bcryptjs is required by Plan 02 anyway, just installed one plan earlier.

## Issues Encountered
None beyond the bcryptjs deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test infrastructure complete; `npm test --prefix api` discovers all 10 stubs and they fail red
- Plan 02 can immediately create User model and auth routes, then fill in the stubs
- fixtures.js `createTestUser()` will work as soon as `api/models/User.js` exists (lazy require pattern)
- Test DB isolation is in place — Plan 02/03 tests will not touch the production database

---
*Phase: 01-authentication-authorization*
*Completed: 2026-03-20*
