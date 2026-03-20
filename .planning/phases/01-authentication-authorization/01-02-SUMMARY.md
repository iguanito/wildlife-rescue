---
phase: 01-authentication-authorization
plan: 02
subsystem: auth
tags: [jwt, bcryptjs, cookie-parser, mongoose, express, middleware]

# Dependency graph
requires:
  - phase: 01-01
    provides: Jest + Supertest test infrastructure, failing test stubs for AUTH-01 through AUTH-04
provides:
  - User Mongoose model with email/passwordHash/role enum/deletedAt/timestamps
  - authenticateToken middleware reading JWT from httpOnly cookie (req.cookies.token)
  - requireRole() factory middleware for role-based access control
  - POST /api/auth/login, DELETE /api/auth/logout, GET /api/auth/me endpoints
  - MedicalRecord schema retrofitted with createdBy field (ref User, default null)
  - Idempotent seed-admin.js script reading ADMIN_EMAIL/ADMIN_PASSWORD from env
  - Express app wired with cookieParser + auth routes public + authenticateToken wall before all other routes
affects: [03-role-middleware-access-control, 04-frontend-auth, 05-user-management]

# Tech tracking
tech-stack:
  added: [jsonwebtoken@9.0.3, bcryptjs@3.0.3 (promoted to production dependency), cookie-parser@1.4.7]
  patterns: [httpOnly SameSite=Strict JWT cookie, public-routes-before-auth-wall Express pattern, deletedAt: null login guard]

key-files:
  created:
    - api/models/User.js
    - api/middleware/authenticate.js
    - api/middleware/authorize.js
    - api/routes/auth.js
    - api/scripts/seed-admin.js
    - api/tests/helpers/env.js
  modified:
    - api/models/MedicalRecord.js
    - api/index.js
    - api/package.json
    - api/tests/auth.test.js
    - api/tests/user.test.js
    - .env.example

key-decisions:
  - "bcryptjs promoted from devDependency to production dependency — auth routes require it at runtime for password comparison and seed script"
  - "Test env.js sets MONGODB_URI to wildlife_rescue_test — prevents connectDB() in Express middleware from using undefined MONGODB_URI during tests"
  - "SameSite=Strict + httpOnly cookie; secure flag only in production — allows local dev over HTTP without breaking test suite"
  - "CORS configured with credentials: true and configurable CORS_ORIGIN — required for cookie-based auth from Vite dev server (port 5173)"

patterns-established:
  - "Express route order: cookieParser → connectDB → /api/auth (public) → authenticateToken → all protected routes"
  - "Login uses User.findOne({ email, deletedAt: null }) to prevent deactivated user logins"
  - "JWT payload contains { _id, email, role } — exactly what req.user exposes to route handlers"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, ACCESS-05]

# Metrics
duration: 5min
completed: 2026-03-20
---

# Phase 1 Plan 02: User Model & Auth Routes Summary

**JWT login/logout/me endpoints with httpOnly cookie, bcryptjs User model, and auth middleware wall protecting all /api/animals /api/medical /api/species routes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T18:13:14Z
- **Completed:** 2026-03-20T18:18:40Z
- **Tasks:** 2 completed
- **Files modified:** 12

## Accomplishments
- User model with email/passwordHash/role enum (['admin','staff','vet','volunteer'])/deletedAt/timestamps
- JWT auth endpoints: POST /login (sets httpOnly SameSite=Strict cookie), DELETE /logout (clears cookie), GET /me (returns user from token)
- authenticateToken middleware verifies JWT from req.cookies.token; attached req.user = {_id, email, role}
- requireRole() factory for future role-based access control in Plan 03
- All /api/animals, /api/medical, /api/species routes now require valid JWT — unauthenticated requests return 401
- Idempotent seed-admin.js: creates admin on first run, prints "Admin already exists" on subsequent runs
- MedicalRecord retrofitted with createdBy (ObjectId ref User, default null) — existing records remain valid

## Task Commits

Each task was committed atomically:

1. **Task 1: User model, auth middleware, and install dependencies** - `655d813` (feat)
2. **Task 2: Auth routes, seed script, and wire api/index.js** - `b03f1f3` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `api/models/User.js` - Mongoose User schema with role enum and soft delete field
- `api/middleware/authenticate.js` - JWT verification via req.cookies.token, attaches req.user
- `api/middleware/authorize.js` - requireRole() factory middleware
- `api/routes/auth.js` - POST /login, DELETE /logout, GET /me endpoints
- `api/scripts/seed-admin.js` - Idempotent admin seed reading ADMIN_EMAIL/ADMIN_PASSWORD from env
- `api/models/MedicalRecord.js` - Added createdBy: { type: ObjectId, ref: 'User', default: null }
- `api/index.js` - Wired cookieParser, authRouter (public), authenticateToken wall, CORS with credentials
- `api/package.json` - Added seed:admin script; bcryptjs moved to production dependencies
- `api/tests/auth.test.js` - Implemented AUTH-01 through AUTH-03 stubs (now green)
- `api/tests/user.test.js` - Implemented AUTH-04 role enum stub (now green)
- `api/tests/helpers/env.js` - Sets JWT_SECRET and MONGODB_URI (test DB) for Jest runs
- `.env.example` - Added JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD documentation

## Decisions Made
- bcryptjs promoted from devDependency to production dependency because `api/routes/auth.js` requires it at runtime for `bcryptjs.compare()` in the login handler and the seed script.
- Test env.js sets MONGODB_URI to point at `wildlife_rescue_test` — without this, the Express connectDB() middleware fails with undefined MONGODB_URI, causing 500 errors on all auth route tests.
- CORS updated with `credentials: true` — mandatory for browser to send cookies on cross-origin requests (Vite dev server port 5173 to API port 3001).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Set MONGODB_URI in test env for Express middleware**
- **Found during:** Task 2 (auth route testing)
- **Issue:** The Express app middleware calls `connectDB()` which reads `process.env.MONGODB_URI`. In tests, MONGODB_URI was unset (only JWT_SECRET was in env.js), causing a 500 error on every auth route call.
- **Fix:** Added `process.env.MONGODB_URI` to `api/tests/helpers/env.js`, pointing at `wildlife_rescue_test` (same logic as db.js test helper). This ensures connectDB() and the test helper both target the same test database.
- **Files modified:** api/tests/helpers/env.js
- **Verification:** All 4 auth tests pass after fix
- **Committed in:** `b03f1f3` (Task 2 commit)

**2. [Rule 2 - Missing Critical] Promoted bcryptjs to production dependency**
- **Found during:** Task 2 (auth routes implementation)
- **Issue:** Plan specified bcryptjs as devDependency (Plan 01 installed it that way). But api/routes/auth.js requires bcryptjs at runtime for password comparison, and seed-admin.js also requires it. Production deployments would fail without bcryptjs in dependencies.
- **Fix:** Updated api/package.json to move bcryptjs from devDependencies to dependencies.
- **Files modified:** api/package.json
- **Verification:** `node -e "require('./routes/auth')"` exits 0; routes load cleanly
- **Committed in:** `b03f1f3` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both fixes necessary for correctness. No scope creep — both issues directly caused by this plan's work (new auth routes needing bcryptjs, new Express middleware needing MONGODB_URI).

## Issues Encountered
- Stale test data in `wildlife_rescue_test` DB from development runs caused first `auth.login.valid` test to fail with a duplicate key error. Resolved by dropping the test DB (`db.dropDatabase()`) before the final run. The `afterEach: clearTestDB` pattern is sufficient for clean test runs but not for resuming after interrupted development sessions.

## User Setup Required
Add the following to your `.env` file (see `.env.example`):
```
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
ADMIN_EMAIL=admin@yourorg.com
ADMIN_PASSWORD=<strong-password>
```

Then run once: `npm run seed:admin --prefix api`

## Next Phase Readiness
- All AUTH routes working and tested (AUTH-01 through AUTH-04 green)
- ACCESS stubs (ACCESS-01 through ACCESS-05) remain red — Plan 03 will implement role middleware on write routes
- requireRole() middleware exists and ready for Plan 03 to apply to specific routes
- MedicalRecord has createdBy field — Plan 03/04 can populate it on record creation

---
*Phase: 01-authentication-authorization*
*Completed: 2026-03-20*
