---
phase: 1
slug: authentication-authorization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — Wave 0 installs Jest + Supertest |
| **Config file** | `api/jest.config.js` (Wave 0 creates) |
| **Quick run command** | `npm test --prefix api` |
| **Full suite command** | `npm test --prefix api -- --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test --prefix api` (quick suite)
- **After every plan wave:** Run full suite with coverage
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Req | Test Type | Automated Command | File Exists | Status |
|---------|-----|-----------|-------------------|-------------|--------|
| auth.login.valid | AUTH-01 | integration | `npm test --prefix api -- auth.login.valid` | ❌ W0 | ⬜ pending |
| auth.login.invalid | AUTH-01 | integration | `npm test --prefix api -- auth.login.invalid` | ❌ W0 | ⬜ pending |
| auth.cookie.persist | AUTH-02 | integration | `npm test --prefix api -- auth.cookie.persist` | ❌ W0 | ⬜ pending |
| auth.logout | AUTH-03 | integration | `npm test --prefix api -- auth.logout` | ❌ W0 | ⬜ pending |
| user.role.enum | AUTH-04 | unit | `npm test --prefix api -- user.role.enum` | ❌ W0 | ⬜ pending |
| access.volunteer | ACCESS-01 | integration | `npm test --prefix api -- access.volunteer` | ❌ W0 | ⬜ pending |
| access.staff | ACCESS-02 | integration | `npm test --prefix api -- access.staff` | ❌ W0 | ⬜ pending |
| access.vet | ACCESS-03 | integration | `npm test --prefix api -- access.vet` | ❌ W0 | ⬜ pending |
| access.admin | ACCESS-04 | integration | `npm test --prefix api -- access.admin` | ❌ W0 | ⬜ pending |
| auth.required.all | ACCESS-05 | integration | `npm test --prefix api -- auth.required.all-endpoints` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `api/tests/` directory structure
- [ ] `api/jest.config.js` — Jest configuration for Node.js
- [ ] `api/tests/helpers/` — test DB setup (test MongoDB connection), test user fixtures
- [ ] `api/tests/auth.test.js` — stubs for AUTH-01 through AUTH-03
- [ ] `api/tests/user.test.js` — stub for AUTH-04 (role enum)
- [ ] `api/tests/access.test.js` — stubs for ACCESS-01 through ACCESS-05
- [ ] Install: `npm install --save-dev jest supertest --prefix api`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login page centered card UI | AUTH-01 | Visual/layout verification | Open /login in browser, confirm centered card with green-800 header |
| Redirect to original destination after login | AUTH-01 | Browser navigation flow | Navigate to /animals/123, confirm redirect to /login, login, confirm return to /animals/123 |
| Sidebar hides write actions for volunteer | ACCESS-01 | Frontend UI rendering | Log in as volunteer, confirm "New Animal" button absent from /animals |
| Session persists across browser restart | AUTH-02 | Requires actual browser restart | Log in, close browser, reopen, confirm still logged in |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
