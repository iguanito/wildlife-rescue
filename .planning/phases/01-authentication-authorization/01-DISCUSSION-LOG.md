# Phase 1: Authentication & Authorization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-20
**Phase:** 01-authentication-authorization
**Areas discussed:** Login flow & redirects, Role-based navigation, First admin bootstrap, Forbidden action UX

---

## Login Flow & Redirects

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to /login (return to origin) | Auto-redirect; after login, return to where they were trying to go | ✓ |
| Redirect to /login, always land on /animals | Always go to /animals after login regardless of origin | |
| Login prompt overlay | Page visible but locked behind a modal | |

**User's choice:** Redirect to /login, return to original destination after login

| Option | Description | Selected |
|--------|-------------|----------|
| Return to original destination | If they tried /animals/123, take them there after login | ✓ |
| Always go to /animals | Simple: login always leads to animal list | |
| Always go to dashboard | Dashboard is home — but Phase 3 | |

**Login form style:**
| Option | Description | Selected |
|--------|-------------|----------|
| Minimal form, match existing style | Same green-800, simple email + password | |
| Centered card with logo area | Center-screen card with space for org name/logo | ✓ |
| You decide | Claude picks whatever fits | |

---

## Role-Based Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Hide items the role can't access | Volunteers only see Animals; Admin sees everything | ✓ |
| Same nav for everyone | Everyone sees all items; errors on forbidden pages | |
| You decide | Claude picks based on Layout patterns | |

**Nav items in Phase 1:**
| Option | Selected |
|--------|----------|
| Animals (everyone) | ✓ |
| Dashboard (staff+) | |
| Users (admin only) | |
| Reports (admin/staff) | |

**Notes:** Other nav items added in their respective phases (3, 5, 6)

---

## First Admin Bootstrap

| Option | Description | Selected |
|--------|-------------|----------|
| Seed script | `npm run seed:admin` creates first admin | ✓ |
| Hardcoded env var credentials | Auto-created on first startup if no users exist | |
| Manual MongoDB entry | Direct DB manipulation, no code | |

**Seed script credentials:**
| Option | Selected |
|--------|----------|
| Configurable via .env (ADMIN_EMAIL, ADMIN_PASSWORD) | ✓ |
| Hardcoded defaults (admin@rescue.local / changeme123) | |

---

## Forbidden Action UX

| Option | Description | Selected |
|--------|-------------|----------|
| Hide write actions entirely | Volunteer never sees New Animal, Edit, Add Medical Record | ✓ |
| Show but disable them | Grayed out with tooltip | |
| Show and let them click, then error | 403 returned from API | |

**403 handling:**
| Option | Selected |
|--------|----------|
| Toast notification "Permission denied" | ✓ |
| Redirect to /animals with error message | |
| Dedicated 403 error page | |

---

## Claude's Discretion

- JWT expiry duration
- Exact cookie flags beyond httpOnly + SameSite=Strict
- Error message wording for invalid credentials
- Toast component implementation

## Deferred Ideas

None — discussion stayed within Phase 1 scope
