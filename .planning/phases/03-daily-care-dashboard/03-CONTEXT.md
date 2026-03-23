# Phase 3: Daily Care Dashboard - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff see a dashboard showing which animals have follow-up appointments due today, and a sidebar widget with animal counts by status. "Today's tasks" is follow-up driven (not care log gap driven). No scheduling, no bulk care entry — those are future phases.

</domain>

<decisions>
## Implementation Decisions

### Today's Tasks Definition

- **D-A1:** Today's tasks = animals with status `in-center` AND a MedicalRecord where `followUpDate` = today AND `followUpCompleted = false`
- **D-A2:** Visible to all roles (admin, staff, vet, volunteer)
- **D-A3:** "Mark as done" button PATCHes `followUpCompleted: true` on the MedicalRecord; animal row animates out and disappears from the list
- **D-A4:** `followUpCompleted: Boolean` field added to MedicalRecord schema (default `false`)

### Page Layout

- **D-B1:** Two-panel layout — tasks list on the left (main content area), status counts widget on the right sidebar
- **D-B2:** Empty state: "No follow-ups due today" shown in the tasks panel; section remains visible (never hidden)
- **D-B3:** Plain "Dashboard" heading, no greeting or date display

### Task Row & Interactions

- **D-C1:** Only action on the dashboard is "Mark as done" — no quick-add care log form; all other work happens on the animal detail page
- **D-C2:** Each task row shows: animal name + species + follow-up date from the MedicalRecord
- **D-C3:** "Mark as done" button always visible inline on the row (not hover-only)
- **D-C4:** Smooth removal animation when a row is marked done

### Status Widget

- **D-D1:** Widget shows the 3 existing statuses only — no enum expansion in this phase
- **D-D2:** Labels: "In the center" (`in-center`), "Released" (`released`), "Deceased" (`deceased`)
- **D-D3:** Zero-count statuses always render (e.g., "Deceased: 0" still shows)
- **D-D4:** Clicking a status navigates to `/animals?status=<value>`, filtering the animal list

### Claude's Discretion

- Exact animation duration and easing for row removal
- Styling of the status count items in the sidebar widget (cards, list, etc.)
- Loading and error states for both panels
- "Mark as done" button variant (outline, filled, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing codebase
- `api/models/MedicalRecord.js` — Schema to extend with `followUpCompleted` field; existing `followUpDate` field already present
- `api/routes/animals.js` — Existing route patterns; dashboard endpoint is a new route file
- `api/index.js` — Route mounting point; new `/api/dashboard` router mounts here
- `frontend/src/App.jsx` — Route list; `/dashboard` route added here
- `frontend/src/components/Layout.jsx` — `navItems` array gets "Dashboard" entry in this phase (per Phase 1 D-06)
- `frontend/src/pages/AnimalList.jsx` — Receives `?status=` query param already; status filter is already wired

### Project specs
- `.planning/REQUIREMENTS.md` — DASH-01, DASH-02, DASH-03 are Phase 3 requirements
- `.planning/ROADMAP.md` — Phase 3 success criteria and architectural context

### Phase carry-forwards
- `.planning/phases/01-authentication-authorization/01-CONTEXT.md` — D-06: Dashboard nav added in Phase 3; D-11: write actions hidden for volunteers (Mark as done is a write action — hide for volunteers)
- `.planning/phases/02-animal-detail-care-log-foundation/02-CONTEXT.md` — Phase 2 compound index `{animal, date, type}` on CareLog; MedicalRecord pattern for schema changes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnimalList.jsx` status filter — already accepts `?status=in-center` etc. via URL params; D-D4 clicking status widget links directly to this
- `Toast.jsx` + `useToast()` — available for "Mark as done" error feedback
- `useAuth()` hook — provides `user.role` for hiding "Mark as done" from volunteers
- `STATUS_COLORS` / `STATUS_LABELS` — defined in AnimalList.jsx; extract or duplicate for status widget in dashboard

### Established Patterns
- Express routes: `GET /api/animals/today` style — new dashboard router at `api/routes/dashboard.js`
- Mongoose queries with date range: `{ followUpDate: { $gte: startOfDay, $lte: endOfDay } }` pattern
- Frontend: `useState` + `useEffect` + `fetch` data fetching — no new library needed
- Tailwind two-column layout: `grid grid-cols-[1fr_auto]` or flex with fixed sidebar width

### Integration Points
- `api/models/MedicalRecord.js`: Add `followUpCompleted: { type: Boolean, default: false }`
- `api/routes/dashboard.js`: New file — `GET /today` (follow-up tasks) + status counts can be combined or separate endpoints
- `PATCH /api/medical/:id` or `PATCH /api/medical/:id/complete`: New endpoint to set `followUpCompleted: true`
- `frontend/src/pages/Dashboard.jsx`: New page component
- `frontend/src/App.jsx`: Add `<Route path="/dashboard" element={<Dashboard />} />`
- `frontend/src/components/Layout.jsx`: Add `{ to: '/dashboard', label: 'Dashboard' }` to `navItems`

</code_context>

<specifics>
## Specific Ideas

- "Mark as done" should be role-gated: volunteers can see the dashboard but not mark follow-ups done (consistent with Phase 1 D-11: write actions hidden for volunteers)
- Status widget click navigates to `/animals?status=in-center` etc. — the AnimalList page already reads this query param from the URL, so no AnimalList changes needed

</specifics>

<deferred>
## Deferred Ideas

- Quick-add care log form on dashboard — mentioned in ROADMAP but dropped; add to backlog if needed
- "Ready for Release" and "Transferred" statuses — ROADMAP listed these but Animal model only has 3; deferred to Phase 4 when status workflow is built
- Notification when animal has no care log for 24+ hours — NOTIF-V2-01 in v2 requirements
- Filtering today's tasks by animal group/species

</deferred>

---

*Phase: 03-daily-care-dashboard*
*Context gathered: 2026-03-23*
