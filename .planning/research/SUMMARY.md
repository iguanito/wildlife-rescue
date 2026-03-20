# Project Research Summary

**Project:** Wildlife Rescue Manager
**Domain:** Animal shelter management software (internal tool)
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

Wildlife Rescue Manager is a purpose-built internal tool for wildlife rescue centers to track animal intake, daily care, medical treatment, and outcomes. The recommended approach is to extend the existing React + Express + MongoDB stack with authentication, role-based access control, and care logging features. The architecture is straightforward: add four new Mongoose models (User, CareLog, and extensions to Animal), create Express middleware for auth, and build frontend pages for login, dashboard, care logging, and reporting. The primary risk is retrofitting authentication to existing unauthenticated routes—this must be done atomically in Phase 1, not incrementally. Secondary concerns include care log query performance at scale, properly enforced server-side role checks, and avoiding accidental data loss through hard deletes.

The existing codebase is in good shape: Vite frontend, Express 4 API, and MongoDB are all solid choices. No major technology changes needed—focus is on auth patterns, schema extensions, and feature addition. Recommend starting with authentication first (blocks everything else), then animal detail page (central hub), then daily care logs (core workflow), then dashboard (depends on care log data), then outcome recording, user management, and finally reporting.

## Key Findings

### Recommended Stack

The project builds on an existing, locked-in stack: React 18 + Vite (frontend), Express 4 + Mongoose 8 (API), MongoDB (database), and Tailwind CSS 3 (styling). New libraries should be minimal and focused on specific gaps.

**Core technologies to add:**
- `jsonwebtoken ^9.0.0` — JWT signing and verification on the Express API for stateless authentication
- `bcryptjs ^2.4.3` — Password hashing using pure JavaScript (avoids native module deployment headaches)
- `date-fns ^3.3.1` — Date manipulation for care log grouping and age calculations (lightweight, tree-shakeable alternative to moment.js)
- `recharts ^2.10.0` — React-native charting for statistics dashboards (Tailwind-friendly, ~500KB)
- `papaparse ^5.4.1` — Browser-side CSV generation (no server dependency)
- `@react-pdf/renderer ^3.3.0` — React-component-based PDF export (browser-side, no additional backend)

**NOT recommended:** Redux/Zustand (overkill at this scale), TypeScript migration (too much churn), GraphQL (REST already established), Socket.io (no real-time requirements identified).

### Expected Features

**Must have (table stakes):**
- **Daily care log** — Feeding records, weight checks, behavioral observations per day. Entered by staff every morning.
- **Animal status lifecycle** — Clear workflow: Intake → In Care → Ready for Release → Released/Transferred/Deceased
- **Outcome recording** — Where/when released, transferred to which center, or cause of death
- **Login with role-based access** — Multiple users with different permissions (vet write, volunteer read-only)
- **Dashboard "today" view** — What animals need feeding, medication, weight check today? Opens every morning.
- **Animal count by status** — Quick summary of animals in care, critical, ready for release
- **Full animal timeline** — Chronological view of intake → care logs → medical records → outcome

**Should have (differentiators):**
- Statistics/reporting — Animals received by species, survival rates for grant reports
- Advanced search — Filter by species and date range beyond current status filter
- Bulk status updates — For batch releases

**Defer (v2+):**
- Volunteer scheduling / shift management
- Public adoption portal
- Inventory / supply tracking
- Email notifications
- Multi-center data sharing

### Architecture Approach

The architecture adds three layers to existing code: User authentication via JWT (httpOnly cookies, not localStorage), a Care Log tracking system mirroring the existing Medical Record pattern, and a dashboard aggregating care log gaps. Backend adds auth middleware (applied globally to protect existing routes), role checks on write operations, and aggregation pipelines for reporting. Frontend gains Login page, AuthContext for user state, ProtectedRoute wrapper, and new pages for Dashboard, Animal Detail timeline, Care Log entry, and Reporting.

**Major components to build:**
1. **Authentication layer** — Express middleware verifying JWT from httpOnly cookies, attaching `req.user` to all requests. Role checking via custom `requireRole()` middleware on protected routes.
2. **Care Log system** — New Mongoose model with compound index on `{animalId, date, type}` to support dashboard queries at scale. Follows same pattern as existing MedicalRecord.
3. **Dashboard aggregation** — API endpoint querying animals with status "In Care", finding today's care logs by type, returning gaps for staff to fill.
4. **Reporting pipeline** — MongoDB aggregation queries generating statistics by species, status, and date range. Must include `maxTimeMS` timeout and optional caching for performance.

### Critical Pitfalls

1. **Adding auth to existing routes incrementally** — Unauthenticated routes left exposed. Solution: Audit ALL routes when adding auth middleware; apply globally and explicitly exclude public endpoints (none here). Add to Phase 1, must retrofit existing routes, not just protect new ones.

2. **JWT stored in localStorage** — XSS vulnerability exposes all tokens. Solution: Use `httpOnly`, `SameSite=Strict` cookies exclusively; never return token string to JavaScript.

3. **Role checks only on frontend** — Volunteers can curl directly to protected endpoints. Solution: Every write route needs server-side `requireRole()` middleware; frontend gates are UX only.

4. **Care log query performance at scale** — Dashboard takes >1s after 6 months of accumulated data. Solution: Create compound index `{animalId: 1, date: -1, type: 1}` from day one; dashboard filters by today's date range.

5. **Animal status as free-text** — Inconsistent values ("in care", "In Care", "incare") break filtering. Solution: Enforce Mongoose enum on status field; validate status transitions (can't go Released → Intake).

6. **No soft delete** — Accidentally deleted animal records are gone forever. Solution: Add `deletedAt` field; filter with `{deletedAt: null}`; admin-only delete with confirmation.

7. **Reporting queries block event loop** — Long aggregation pipelines hang the entire API. Solution: Add `maxTimeMS` to queries; consider 5-minute TTL caching for report results.

8. **No audit trail for medical records** — Can't trace which vet performed which treatment. Solution: Add `createdBy: ObjectId ref User` to CareLog from the start; retrofit MedicalRecord in auth phase.

## Implications for Roadmap

Based on research, the following phase structure is recommended. Phases are ordered by dependency: authentication must come first (blocks everything), animal detail page is the central hub for care logs and outcomes, care logs are the core data entry workflow, dashboard depends on care log data, outcome recording extends the status workflow, user management is admin tooling, and reporting depends on data existing.

### Phase 1: Authentication & Authorization
**Rationale:** Blocks all other features; every route needs `req.user` and role checks. Must be built first and comprehensively applied to existing routes—no incremental patching.

**Delivers:**
- Express middleware for JWT validation from httpOnly cookies
- Role-based middleware (`admin`, `staff`, `vet`, `volunteer` roles)
- Login page and user session management
- ProtectedRoute wrapper for frontend

**Addresses from FEATURES.md:**
- "Login with email/password"
- "Role-based access (vet write, volunteer read-only)"

**Avoids from PITFALLS.md:**
- Retroactively adding auth to existing routes (audit all routes at once)
- JWT in localStorage (spec httpOnly cookies from start)
- Frontend-only role checks (enforce server-side middleware)
- Missing `createdBy` on medical records (retrofit while adding auth)

**Stack elements:**
- `jsonwebtoken ^9.0.0` — JWT signing/verification
- `bcryptjs ^2.4.3` — Password hashing

### Phase 2: Animal Detail Page & Care Log Foundation
**Rationale:** Animal detail is the central hub for all animal information (intake, care, medical, outcome). Building this first establishes the timeline view that later features (care logs, outcome recording) integrate into. Care log model also needs to be created so dashboard can query it.

**Delivers:**
- Enhanced Animal Detail page showing chronological timeline of events
- CareLog Mongoose model with compound index `{animalId, date, type}`
- Quick-add care log form embedded in Animal Detail
- Frontend CareLog component for rendering daily observations

**Implements from ARCHITECTURE.md:**
- CareLog model with `animalId` reference, `date`, `type` (feeding|weight|observation), `value`, `notes`, `createdBy`
- Compound index for performance at scale

**Avoids from PITFALLS.md:**
- Care log performance issues (index created upfront)
- Missing audit trail (createdBy included in schema)

**Stack elements:**
- `date-fns ^3.3.1` — Date grouping and formatting in timeline

### Phase 3: Daily Care Dashboard
**Rationale:** Dashboard depends on care log data existing and queries being optimized. Staff's primary workflow: "What does each animal need today?"

**Delivers:**
- Dashboard "today" view showing animals needing feeding, weight check, observation
- Animal count by status widget (in care, critical, ready for release)
- Care log gap detection and quick-add forms
- Dashboard API endpoint with today's date filtering

**Addresses from FEATURES.md:**
- "Dashboard 'today' view"
- "Animal count by status"

**Avoids from PITFALLS.md:**
- Query performance (uses indexed compound lookup created in Phase 2)
- Status enum mismatches (enforced by Animal model validation)

### Phase 4: Outcome Recording & Animal Status Workflow
**Rationale:** Extends existing animal status lifecycle with outcome tracking. Depends on auth (who recorded it) and animal detail page (where outcome is displayed).

**Delivers:**
- Outcome form (release location, transfer center, or death details)
- Status transition validation (can't go Released → Intake without override)
- Outcome display in animal timeline
- Soft delete support with `deletedAt` field

**Addresses from FEATURES.md:**
- "Animal status lifecycle"
- "Outcome recording"

**Avoids from PITFALLS.md:**
- Hard deletes of animal records (soft delete with deletedAt)
- Invalid status transitions (validate in schema)
- Missing audit trail (createdBy on outcome updates)

### Phase 5: User Management (Admin Panel)
**Rationale:** Depends on auth being in place. Admin functionality for creating/deactivating user accounts. Lower urgency than operational features.

**Delivers:**
- Admin Users page (CRUD on User model)
- User activation/deactivation (soft delete support)
- Role assignment interface

**Addresses from FEATURES.md:**
- "User admin panel"

**Avoids from PITFALLS.md:**
- Hard deletes (use soft delete with deletedAt)
- Unreviewed auth audits (role enforcement already in Phase 1)

### Phase 6: Reporting & Statistics
**Rationale:** Last phase; depends on meaningful data accumulation (care logs, outcomes, medical records). Read-only queries, can be cached.

**Delivers:**
- Statistics page with animals received by species, status, date range
- Charts showing survival rates, care patterns
- PDF and CSV export functionality

**Addresses from FEATURES.md:**
- "Statistics/reporting for grant reports"
- "Bulk search by species/date range"

**Avoids from PITFALLS.md:**
- Query performance (aggregation pipelines with maxTimeMS timeout)
- Frontend-based charting (use recharts, MongoDB aggregation on backend)

**Stack elements:**
- `recharts ^2.10.0` — React charting for statistics dashboard
- `papaparse ^5.4.1` — CSV generation
- `@react-pdf/renderer ^3.3.0` — PDF export

### Phase Ordering Rationale

- **Auth first:** Blocks everything. Must be comprehensive from day one to avoid security gaps and incremental patching later.
- **Animal Detail + Care Log schema second:** Central hub; establishes data model and timeline that all other features reference. Performance index created upfront.
- **Dashboard third:** Depends on care log data existing and being queryable with good performance.
- **Outcome + status workflow fourth:** Extends existing animal model; depends on auth for `createdBy` tracking.
- **User management fifth:** Admin tooling; no operational impact on core rescue workflow.
- **Reporting last:** Read-only analysis; useful only after meaningful data exists.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (Dashboard):** Aggregation query design for "today" view at scale. Needs validation of compound index effectiveness and query timeout strategy. Consider prototyping the MongoDB aggregation pipeline.
- **Phase 6 (Reporting):** Large dataset performance characteristics unclear. May need investigation into caching strategies, secondary replica use, or query optimization techniques not yet explored.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Auth):** JWT + httpOnly cookie pattern is well-documented and standard in Express; no domain-specific research needed.
- **Phase 2 (Animal Detail + Care Log):** Follows existing MedicalRecord pattern; schema design is straightforward.
- **Phase 4 (Outcome Recording):** Status lifecycle validation is standard workflow logic; no specialized research needed.
- **Phase 5 (User Management):** Basic CRUD with soft delete; no novel patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is locked and proven. New libraries (JWT, bcryptjs, date-fns, recharts) have clear use cases and are well-documented. |
| Features | HIGH | All feature requirements came from domain interviews and existing product context. Must-haves vs. differentiators are clearly understood. |
| Architecture | HIGH | Architecture mirrors existing patterns (Animal/MedicalRecord mirrored for CareLog); auth pattern is standard Express middleware; no novel integration points. |
| Pitfalls | HIGH | Pitfalls identified from common real-world issues (auth retrofitting, performance, soft deletes, audit trails) confirmed against domain experience. |

**Overall confidence:** HIGH

### Gaps to Address

- **Dashboard query performance validation:** Aggregation pipeline design should be prototyped in Phase 3 planning to confirm compound index effectiveness at expected scale (thousands of animals/year).
- **Role permission matrix:** No explicit definition of which roles can perform which actions on which resources. Should be created during Phase 1 planning to ensure comprehensive role checks.
- **Care log type taxonomy:** Research identifies "feeding|weight|observation" as initial types but doesn't validate these are sufficient for vet workflows. May need refinement during Phase 2.
- **Reporting metric definitions:** Grant report requirements not fully specified. May need clarification during Phase 6 planning on which statistics matter most.
- **User onboarding flow:** How does first admin get created if no users exist? Seed data or special bootstrap endpoint needed during Phase 1 planning.

## Sources

### Primary (HIGH confidence)
- **STACK.md (2026-03-20)** — Technology recommendations with version pinning; rationale for choices (bcryptjs over bcrypt, date-fns over moment, recharts over D3)
- **FEATURES.md (2026-03-20)** — Feature prioritization with complexity assessments; dependency tree showing feature relationships
- **ARCHITECTURE.md (2026-03-20)** — Component breakdown with data flow diagrams; suggested build order with integration points documented
- **PITFALLS.md (2026-03-20)** — Critical, moderate, and minor pitfalls with concrete prevention strategies; phase-specific warnings

---

*Research completed: 2026-03-20*
*Ready for roadmap: yes*
