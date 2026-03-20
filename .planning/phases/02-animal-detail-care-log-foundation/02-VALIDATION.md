---
phase: 2
slug: animal-detail-care-log-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^29.7.0 + Supertest ^7.2.2 (from Phase 1) |
| **Config file** | `api/jest.config.js` (already exists) |
| **Quick run command** | `npm test --prefix api -- --testPathPattern=care-log` |
| **Full suite command** | `npm test --prefix api` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test --prefix api -- --testPathPattern=care-log`
- **After every plan wave:** Run `npm test --prefix api` (full suite including Phase 1 auth tests)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Req | Test Type | Automated Command | File Exists | Status |
|---------|-----|-----------|-------------------|-------------|--------|
| care.create | CARE-01 | integration | `npm test --prefix api -- -t "CARE-01"` | ❌ W0 | ⬜ pending |
| care.attribution | CARE-02 | integration | `npm test --prefix api -- -t "CARE-02"` | ❌ W0 | ⬜ pending |
| care.query | CARE-03 | integration | `npm test --prefix api -- -t "CARE-03"` | ❌ W0 | ⬜ pending |
| detail.timeline | DETAIL-01 | integration | `npm test --prefix api -- -t "DETAIL-01"` | ❌ W0 | ⬜ pending |
| detail.fields | DETAIL-02 | integration | `npm test --prefix api -- -t "DETAIL-02"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `api/tests/care-log.test.js` — stubs for CARE-01, CARE-02, CARE-03 (POST + GET /carelogs)
- [ ] `api/tests/animal-detail.test.js` — stubs for DETAIL-01 (timeline merge), DETAIL-02 (all fields returned)

*Existing test infrastructure (Jest + Supertest + helpers/db.js) covers all phase requirements — no new framework setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Timeline renders intake as first event | DETAIL-01 | Visual/rendering | Open animal detail page, confirm intake date appears as first timeline item above all care logs |
| Care log compact/expand toggle | DETAIL-01 | Visual interaction | Click a care log day group, confirm it expands to show notes and createdBy |
| Inline add form opens above timeline | CARE-01 | Visual layout | Click "Add Care Log", confirm form slides in above timeline entries |
| Type selector is a dropdown (not free text) | CARE-01 | Input type verification | Open add care log form, confirm Type field is a `<select>` with Feeding/Weight/Observation options |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
