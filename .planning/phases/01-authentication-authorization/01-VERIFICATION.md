---
phase: 01-authentication-authorization
verified: 2026-03-20T00:00:00Z
status: gaps_found
score: 10/12 must-haves verified
gaps:
  - truth: "species.js has requireRole middleware on all write routes"
    status: failed
    reason: "api/routes/species.js has only a GET route with no requireRole call. Plan 03 required write routes for species to be role-gated, but the species router only exposes a read-only GET — no POST/PUT/DELETE exist."
    artifacts:
      - path: "api/routes/species.js"
        issue: "No requireRole call exists; however there are also no write routes. If species is intentionally read-only for all authenticated users, this must_have should be relaxed. If write routes were expected, they are missing."
    missing:
      - "Clarify intent: if species write routes (POST/PUT/DELETE) are not needed in Phase 1, remove this must_have from Plan 03. If they are needed, implement them with requireRole('admin')."
  - truth: "Toast component is wired — imported and used in at least one page or component"
    status: failed
    reason: "frontend/src/components/Toast.jsx exists and exports Toast and useToast, but it is never imported or used anywhere in the frontend codebase. The component is ORPHANED."
    artifacts:
      - path: "frontend/src/components/Toast.jsx"
        issue: "Exists but is imported nowhere — no page or component uses Toast or useToast."
    missing:
      - "Either wire Toast into a page that shows permission-denied errors (e.g., AnimalDetail when a 403 is returned), or document that Toast is intentionally deferred to a later phase."
human_verification:
  - test: "Login flow end-to-end"
    expected: "Navigating to /animals unauthenticated redirects to /login?from=%2Fanimals; successful login returns user to /animals; session persists after tab close/reopen; Log Out clears session."
    why_human: "Browser cookie behavior, redirect flow, and session persistence cannot be verified programmatically without running the full stack."
  - test: "Volunteer role-aware UI"
    expected: "Volunteer user does not see the '+ Add Animal' button on /animals; staff/vet/admin users do see it."
    why_human: "Requires a live browser session with a volunteer-role user to confirm the conditional render behaves correctly."
  - test: "Login page visual appearance"
    expected: "Centered white card on gray background with dark green (bg-green-800) header showing 'Wildlife Rescue Center' title."
    why_human: "Visual layout cannot be verified from source alone."
---

# Phase 1: Authentication & Authorization Verification Report

**Phase Goal:** Users can securely log in with email/password and access features based on their role. All existing routes are protected and enforce role-based access server-side.
**Verified:** 2026-03-20
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/auth/login returns user object and sets httpOnly cookie | VERIFIED | `api/routes/auth.js` lines 8-34: bcrypt compare, jwt.sign, res.cookie with httpOnly flag. Test auth.login.valid passes. |
| 2 | Wrong password returns 401 `{error: 'Invalid credentials'}` | VERIFIED | `api/routes/auth.js` line 16-17: explicit 401 on bad password. Test auth.login.invalid passes. |
| 3 | httpOnly cookie accepted by protected route without re-login | VERIFIED | `api/index.js` lines 32-37: auth wall via `app.use(authenticateToken)` after public routes. Test auth.cookie.persist passes. |
| 4 | DELETE /api/auth/logout clears cookie; subsequent /me returns 401 | VERIFIED | `api/routes/auth.js` lines 37-40: `res.clearCookie`. Test auth.logout passes. |
| 5 | User model has 4-role enum; invalid role rejected | VERIFIED | `api/models/User.js` line 14: `enum: ['admin', 'staff', 'vet', 'volunteer']`. Test user.role.enum passes. |
| 6 | Volunteer can read animals (200) but not create (403) | VERIFIED | `api/routes/animals.js` line 22: `requireRole('staff', 'vet', 'admin')` on POST. Test access.volunteer passes. |
| 7 | Staff can create animals (POST returns 201) | VERIFIED | `requireRole('staff', 'vet', 'admin')` on POST. Test access.staff passes. |
| 8 | Vet can create medical records (201); volunteer gets 403 | VERIFIED | `api/routes/animals.js` line 79: `requireRole('vet', 'admin')` on POST /:id/medical. Test access.vet passes. |
| 9 | Admin has full access to POST/PUT animals | VERIFIED | All write routes include 'admin'. Test access.admin passes. |
| 10 | Unauthenticated POST /api/animals returns 401 | VERIFIED | Auth wall via `app.use(authenticateToken)` before animalsRouter. Test auth.required.all-endpoints passes. |
| 11 | species.js has requireRole on all write routes | FAILED | `api/routes/species.js` has only a read GET — no requireRole call. Plan 03 listed this as a required artifact but species write routes do not exist. |
| 12 | Toast component is wired and used | FAILED | `frontend/src/components/Toast.jsx` exists (39 lines, substantive) but is never imported by any other file. ORPHANED. |

**Score:** 10/12 truths verified

### Test Suite Results

All 10 automated tests pass:

```
PASS tests/access.test.js
PASS tests/auth.test.js
PASS tests/user.test.js
Tests: 10 passed, 10 total
```

The tests have evolved from their original "not implemented" stubs in Plan 01 to full integration tests.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `api/models/User.js` | User schema with roles | VERIFIED | 4-role enum, email, passwordHash, deletedAt, timestamps |
| `api/middleware/authenticate.js` | JWT cookie verification | VERIFIED | Reads `req.cookies.token`, attaches `req.user` |
| `api/middleware/authorize.js` | requireRole factory | VERIFIED | Checks `allowedRoles.includes(req.user.role)` |
| `api/routes/auth.js` | login/logout/me endpoints | VERIFIED | All three routes implemented and wired |
| `api/routes/animals.js` | Role-gated animal routes | VERIFIED | POST/PUT: staff+vet+admin; DELETE: admin only |
| `api/routes/medical.js` | Role-gated medical routes | VERIFIED | PUT/DELETE with requireRole; vet+admin for PUT, admin only for DELETE |
| `api/routes/species.js` | Role-gated species routes | PARTIAL | Only GET route exists — no write routes, no requireRole. Functionally adequate if species is read-only. |
| `api/scripts/seed-admin.js` | Admin seed script | VERIFIED | Reads ADMIN_EMAIL/ADMIN_PASSWORD from env; idempotent |
| `api/index.js` | Auth wall wiring | VERIFIED | cookieParser, authRouter (public), authenticateToken wall, then protected routers |
| `api/models/MedicalRecord.js` | createdBy field added | VERIFIED | `createdBy: { type: ObjectId, ref: 'User', default: null }` |
| `frontend/src/context/AuthContext.jsx` | AuthProvider + useAuth | VERIFIED | createContext, /api/auth/me on mount, login/logout functions |
| `frontend/src/components/ProtectedRoute.jsx` | Route guard with redirect | VERIFIED | Redirects to `/login?from=...` when user is null |
| `frontend/src/components/Toast.jsx` | Toast notification | ORPHANED | Exists and is substantive but used nowhere |
| `frontend/src/components/Layout.jsx` | Sidebar with useAuth + logout | VERIFIED | useAuth(), user email/role display, Log Out button |
| `frontend/src/pages/Login.jsx` | Login form with green-800 card | VERIFIED | "Wildlife Rescue Center" header, handles ?from= redirect, inline error |
| `frontend/src/App.jsx` | Routes with ProtectedRoute | VERIFIED | /login public; all other routes inside ProtectedRoute |
| `frontend/src/main.jsx` | AuthProvider wraps app | VERIFIED | AuthProvider outside BrowserRouter |
| `api/jest.config.js` | Jest configuration | VERIFIED | testEnvironment: node, testMatch, testTimeout: 15000 |
| `api/tests/helpers/db.js` | Test DB helpers | VERIFIED | connectTestDB, clearTestDB, closeTestDB |
| `api/tests/helpers/fixtures.js` | User fixture factory | VERIFIED | createTestUser, TEST_USERS, TEST_PASSWORDS |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `api/index.js` | `api/middleware/authenticate.js` | `app.use(authenticateToken)` after authRouter | WIRED | Line 32: `app.use(authenticateToken)` placed after public auth routes, before protected routes |
| `api/routes/auth.js` | `api/models/User.js` | `User.findOne` in login handler | WIRED | Line 11: `User.findOne({ email, deletedAt: null })` |
| `api/middleware/authenticate.js` | `process.env.JWT_SECRET` | `jwt.verify(token, process.env.JWT_SECRET, ...)` | WIRED | Line 8: JWT_SECRET used for verification |
| `frontend/src/main.jsx` | `frontend/src/context/AuthContext.jsx` | AuthProvider wraps app tree | WIRED | Line 5: import AuthProvider; line 11: wraps BrowserRouter |
| `frontend/src/components/ProtectedRoute.jsx` | `frontend/src/context/AuthContext.jsx` | useAuth() | WIRED | Line 2: import useAuth; line 5: `const { user, loading } = useAuth()` |
| `frontend/src/components/Layout.jsx` | `frontend/src/context/AuthContext.jsx` | useAuth() for user/logout | WIRED | Line 2: import useAuth; line 5: `const { user, logout } = useAuth()` |
| `frontend/src/pages/Login.jsx` | `frontend/src/context/AuthContext.jsx` | login() from useAuth() | WIRED | Line 3: import useAuth; line 10: `const { login } = useAuth()` |
| `frontend/src/pages/AnimalList.jsx` | `frontend/src/context/AuthContext.jsx` | useAuth() for role-gating New Animal button | WIRED | Line 3: import useAuth; line 42: role check on button render |
| `api/routes/animals.js` | `api/middleware/authorize.js` | requireRole() on POST/PUT/DELETE | WIRED | Lines 22, 43, 57, 79: requireRole calls present |
| `api/routes/medical.js` | `api/middleware/authorize.js` | requireRole() on PUT/DELETE | WIRED | Lines 6, 20: requireRole calls present |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | Plans 01, 02, 03, 04 | User can log in with email and password | SATISFIED | Login endpoint implemented; test passes; frontend Login page calls `login()` |
| AUTH-02 | Plans 01, 02, 03, 04 | Session persists across browser restarts | SATISFIED | httpOnly JWT cookie with 7-day expiry; AuthContext fetches /api/auth/me on mount; test passes |
| AUTH-03 | Plans 01, 02, 03, 04 | User can log out from any page | SATISFIED | DELETE /api/auth/logout clears cookie; Layout has Log Out button; test passes |
| AUTH-04 | Plans 01, 02, 03, 04 | Each user has one of four roles | SATISFIED | User model enum enforced; test passes for all 4 roles + rejection of invalid |
| ACCESS-01 | Plans 01, 03, 04 | Volunteer read-only | SATISFIED | requireRole excludes volunteer from POST; AnimalList hides Add Animal for volunteer; test passes |
| ACCESS-02 | Plans 01, 03, 04 | Staff can create animals | SATISFIED | requireRole('staff', 'vet', 'admin') on POST /api/animals; test passes |
| ACCESS-03 | Plans 01, 03, 04 | Vet can create/edit medical records | SATISFIED | requireRole('vet', 'admin') on POST /:id/medical and PUT /medical/:id; test passes |
| ACCESS-04 | Plans 01, 03, 04 | Admin full access | SATISFIED | Admin included in all requireRole calls; test passes |
| ACCESS-05 | Plans 01, 02, 03, 04 | All API write routes enforce server-side role checks | SATISFIED (with note) | Auth wall + requireRole on all write routes in animals.js and medical.js. Species has no write routes — this is either correct (read-only master data) or an omission. |

All 9 requirement IDs from phase plans are accounted for in REQUIREMENTS.md as Phase 1 / Complete. No orphaned requirements found.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `frontend/src/components/Toast.jsx` | Component defined but never imported or used | Warning | Toast was built as a permission-denied feedback mechanism but is not wired into any component. Graceful permission errors (403 responses) are silently swallowed or cause unhandled UI states. |
| `api/routes/species.js` | No requireRole calls | Info | Species route has only a GET. All authenticated users can read species (sensible for master data). But Plan 03 artifact definition claimed `contains: "requireRole"` — this is a documentation mismatch, not a runtime problem since read-only is intentional. |

### Human Verification Required

#### 1. Login flow end-to-end

**Test:** Start dev server (`npm run dev` from root). Open an incognito browser tab to `http://localhost:5173/animals`.
**Expected:** Redirected to `/login?from=%2Fanimals`. Log in with admin credentials. Redirected to `/animals`. Sidebar shows email and role. Close tab. Reopen URL — user still logged in. Click Log Out — redirected to `/login`. Navigating to `/animals` redirects to `/login` again.
**Why human:** Cookie persistence across tab close, redirect loop prevention, and browser session behavior cannot be verified without a live browser.

#### 2. Volunteer role-aware UI

**Test:** Log in as a volunteer-role user. Navigate to `/animals`.
**Expected:** The `+ Add Animal` button is not visible. Log in as staff — the button appears.
**Why human:** Requires a live browser session with the correct role; the conditional render logic is in place in source but must be confirmed visually.

#### 3. Login page visual appearance

**Test:** Navigate to `/login` while logged out.
**Expected:** Centered white card on gray background with dark green header (`bg-green-800`) containing "Wildlife Rescue Center" in bold, with "Sign in to continue" subtitle in light green.
**Why human:** CSS class rendering cannot be verified from source code alone.

### Gaps Summary

Two gaps were found:

**Gap 1 — species.js write routes (Info-level, not a blocker):** Plan 03 declared `api/routes/species.js` should `contain: "requireRole"`, but species only has a read-only GET route. Since species is master data that all authenticated users can read, this is likely intentional design rather than an omission. The phase goal of "All existing routes are protected" is not violated because the auth wall (`app.use(authenticateToken)`) already protects `/api/species` from unauthenticated access. However, the plan artifact definition is inaccurate and should be corrected.

**Gap 2 — Toast component is orphaned (Warning):** `Toast.jsx` was built as part of Plan 04 to provide permission-denied feedback, but it is never imported or used by any other component. Unauthenticated or unauthorized API responses in AnimalDetail or other pages will not show user-friendly toast notifications. This is an incomplete feature — the component was created but not wired. This gap should be closed either by wiring Toast into pages that handle 403 responses, or by formally deferring it to a later phase.

The core auth goal is substantively achieved: login/logout work, sessions persist via httpOnly cookie, all write routes enforce role-based access server-side, the frontend guards routes and hides write actions from volunteers, and all 10 automated tests pass. The two gaps are a documentation mismatch (species) and an unconnected utility component (Toast).

---

_Verified: 2026-03-20_
_Verifier: Claude (gsd-verifier)_
