---
phase: 3
slug: daily-care-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + Supertest |
| **Config file** | `api/package.json` (jest config) |
| **Quick run command** | `cd api && npm test -- --testPathPattern=dashboard` |
| **Full suite command** | `cd api && npm test` |
| **Estimated runtime** | ~35 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd api && npm test -- --testPathPattern=dashboard`
- **After every plan wave:** Run `cd api && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 35 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | DASH-01 | integration stub | `cd api && npm test -- --testPathPattern=dashboard` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | DASH-02 | integration stub | `cd api && npm test -- --testPathPattern=dashboard` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | DASH-03 | integration stub | `cd api && npm test -- --testPathPattern=dashboard` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | DASH-01 | integration | `cd api && npm test -- --testPathPattern=dashboard` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | DASH-02 | integration | `cd api && npm test -- --testPathPattern=dashboard` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | DASH-03 | e2e manual | N/A | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `api/tests/dashboard.test.js` — stubs for DASH-01 (today's follow-up tasks), DASH-02 (status counts), DASH-03 (mark as done)

*Existing Jest + Supertest infrastructure covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Smooth row removal animation | DASH-01 | CSS animation not detectable via API test | Mark a follow-up done in the browser; row should fade/slide out over ~300ms |
| Status count click navigates to filtered animal list | DASH-03 | Navigation behavior requires browser | Click "In the center (N)" widget item; verify URL becomes `/animals?status=in-center` |
| "Mark as done" hidden for volunteers | DASH-01 | Role-based UI requires browser + login | Log in as volunteer; confirm no "Mark as done" button appears on dashboard rows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 35s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
