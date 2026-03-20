# Phase 1: Authentication & Authorization - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely log in with email/password and access features based on their role. All existing routes are protected and enforce role-based access server-side. This phase does NOT build the dashboard, user management UI, or any non-auth features — those are phases 3 and 5.

</domain>

<decisions>
## Implementation Decisions

### Login Flow & Redirects

- **D-01:** Unauthenticated users hitting any protected route (e.g. `/animals`) are auto-redirected to `/login`
- **D-02:** After successful login, user is returned to their original destination (the URL they were trying to reach before being redirected to login)
- **D-03:** Login page uses a centered card layout with space for org name/logo — not a full-width form. Match existing green-800 color palette from Layout.
- **D-04:** JWT stored in httpOnly, SameSite=Strict cookie — never in localStorage or returned as a JS-accessible value

### Role-Based Navigation

- **D-05:** Sidebar hides nav items the user's role cannot access — no showing disabled/grayed items
- **D-06:** Phase 1 nav: only "Animals" for all roles. Other nav items (Dashboard, Users, Reports) are added to the sidebar in their respective phases (3, 5, 6)
- **D-07:** Layout component receives current user from AuthContext and conditionally renders nav items

### First Admin Bootstrap

- **D-08:** First admin created via a one-time seed script (`npm run seed:admin` in `api/`)
- **D-09:** Seed script reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` — configurable, not hardcoded
- **D-10:** Seed script is idempotent — skips if an admin already exists

### Forbidden Action UX

- **D-11:** Write actions (New Animal button, Edit, Add Medical Record) are hidden entirely for roles that cannot perform them — not shown disabled
- **D-12:** If a forbidden API call is made (direct URL, bug), the app shows a toast notification "Permission denied" — stays on current page, no redirect
- **D-13:** Frontend role gates are UX convenience only; all write routes enforce role checks server-side (API is authoritative)

### Technical Decisions (Locked from Research)

- **D-14:** 4 roles: `admin`, `staff`, `vet`, `volunteer` — stored as enum on User model
- **D-15:** bcryptjs for password hashing (pure JS, no native deps)
- **D-16:** jsonwebtoken for JWT signing/verification
- **D-17:** Retrofit auth middleware to ALL existing routes atomically in this phase — `/api/animals`, `/api/medical`, `/api/species` all get auth in one go
- **D-18:** Add `createdBy` field to existing MedicalRecord schema as part of this phase's retrofit

### Claude's Discretion

- Exact JWT expiry duration (7 days is a reasonable default for "remember me")
- Specific cookie configuration flags beyond httpOnly + SameSite=Strict
- Error message wording for invalid credentials
- Toast component implementation (can use a simple custom component)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing codebase
- `api/index.js` — Current Express app structure; all 3 routes need auth middleware added here
- `api/routes/animals.js` — Existing write routes to protect
- `api/routes/medical.js` — Existing write routes to protect
- `frontend/src/App.jsx` — Current route structure; needs ProtectedRoute wrapper
- `frontend/src/main.jsx` — BrowserRouter setup; AuthContext provider wraps here
- `frontend/src/components/Layout.jsx` — Sidebar nav; needs role-aware nav rendering

### Project specs
- `.planning/REQUIREMENTS.md` — AUTH-01 through ACCESS-05 are Phase 1 requirements
- `.planning/ROADMAP.md` — Phase 1 success criteria (8 criteria to verify against)
- `.planning/research/STACK.md` — Library recommendations: jsonwebtoken, bcryptjs
- `.planning/research/PITFALLS.md` — Auth-specific pitfalls: JWT storage, role-only-on-frontend, atomic retrofit

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `Layout.jsx` — Sidebar nav component; will be extended with role-aware conditional rendering. Already uses Tailwind green-800 palette.
- `BrowserRouter` in `main.jsx` — Wrap `AuthContext.Provider` here as sibling or parent to BrowserRouter
- React Router `<Navigate>` — Already imported in App.jsx; use for redirect-to-login logic in ProtectedRoute

### Established Patterns

- Express routes use CommonJS (`require`/`module.exports`) — keep consistent in new auth files
- MongoDB connection is lazy (per-request middleware in `index.js`) — no change needed for auth
- Frontend components are functional React with hooks — AuthContext follows same pattern
- Tailwind utility classes only — no custom CSS; login form should use same approach

### Integration Points

- `api/index.js`: Auth middleware added between `app.use(express.json())` and route mounting
- `frontend/src/main.jsx`: AuthContext.Provider wraps the app here
- `frontend/src/App.jsx`: ProtectedRoute wraps all existing routes; `/login` added as public route
- `frontend/src/components/Layout.jsx`: `useAuth()` hook consumed here for nav rendering and logout button

</code_context>

<specifics>
## Specific Ideas

- Login card should be centered on the page, use the same green-800 as the sidebar for the card header/branding area, with "Wildlife Rescue Center" as the title
- The seed script should be a simple standalone Node.js script at `api/scripts/seed-admin.js`

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 1 scope

</deferred>

---

*Phase: 01-authentication-authorization*
*Context gathered: 2026-03-20*
