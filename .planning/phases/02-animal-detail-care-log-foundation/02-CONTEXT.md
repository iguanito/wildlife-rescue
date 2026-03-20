# Phase 2: Animal Detail & Care Log Foundation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the existing animal detail page into a chronological timeline showing the animal's full history: intake event → care logs (grouped by day) → medical records (merged chronologically). Create the CareLog data model with compound index. Add a quick-add care log form for staff. No outcome recording, no dashboard — those are Phases 4 and 3.

</domain>

<decisions>
## Implementation Decisions

### Timeline Structure

- **D-01:** Entries are grouped by day — each day gets a date heading with its entries nested beneath
- **D-02:** Care log entries are compact+expand — type label + value shown inline, click to expand notes and who logged it
- **D-03:** Medical records are always expanded in the timeline — show full detail (description, treatment, vet, follow-up date) inline, no click needed
- **D-04:** Intake is the first timeline event — appears as the oldest entry ("Intake · [date arrived]"), marking when the animal arrived. No separate "anchor" at bottom.
- **D-05:** Timeline is chronological (oldest first, newest at bottom) — consistent with reading a care history

### Care Log Type Fields

- **D-06:** `weight` type — numeric input only; staff type the unit themselves in the value field (e.g., "450g"); stored as plain text string
- **D-07:** `feeding` type — notes field only (freeform text, e.g., "5ml formula, fed well"); no structured amount field
- **D-08:** `observation` type — notes field only (freeform text); same treatment as feeding
- **D-09:** All three types share the same form structure: date picker + type selector + value/notes field. Type selector controls the label ("Value" for weight, "Notes" for feeding/observation)

### Quick-Add Form Placement

- **D-10:** "Add care log" button is sticky above the timeline section — always visible at the top of the care log area
- **D-11:** When form opens, it expands inline between the button and the first timeline entry, pushing entries down. Button disappears while form is open; Cancel restores it.

### Detail Page Layout

- **D-12:** Existing animal info panel (name, species, status, intake date, notes) stays as a compact header section above the timeline, with the Edit button. No change to its structure.
- **D-13:** The existing medical records section (currently a separate section below animal info) is removed. Medical records merge into the timeline chronologically alongside care logs.
- **D-14:** Timeline section replaces the old medical records section — it's the main content area below the header panel.

### Claude's Discretion

- Exact date heading format (e.g., "March 20" vs "Mar 20 · 3 entries")
- Empty state for animals with no care logs yet
- Expand/collapse animation for care log entries
- Error state styling within the inline form

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing codebase
- `frontend/src/pages/AnimalDetail.jsx` — Current detail page to be restructured; has animal info panel, medical records section, inline edit form
- `frontend/src/components/Layout.jsx` — Sidebar nav; role-aware from Phase 1
- `frontend/src/context/AuthContext.jsx` — `useAuth()` hook for `req.user`; `createdBy` attribution uses this
- `api/routes/animals.js` — Existing animal routes; care log route (`GET /api/animals/:id/carelogs`, `POST /api/animals/:id/carelogs`) added here
- `api/models/MedicalRecord.js` — Existing schema to reference for CareLog schema pattern
- `api/index.js` — Auth wall already in place from Phase 1; new care log routes mount here

### Project specs
- `.planning/REQUIREMENTS.md` — CARE-01, CARE-02, CARE-03, DETAIL-01, DETAIL-02 are Phase 2 requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria (6 criteria) and architectural context (compound index, date distinction)

### Phase 1 decisions (carry-forward)
- `.planning/phases/01-authentication-authorization/01-CONTEXT.md` — D-11: write actions hidden for volunteer; D-13: frontend gates are UX only, API is authoritative; `req.user` attached to all requests

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `Toast.jsx` + `useToast()` — already imported in AnimalDetail; available for care log form error feedback
- `useAuth()` hook — provides `user.role` for showing/hiding "Add care log" button (staff/vet/admin only)
- `inputCls` constant in AnimalDetail — Tailwind class string for form inputs; reuse in care log form
- Existing `fetch` + `useState` pattern — established data fetching pattern, no new library needed

### Established Patterns

- CommonJS `require/module.exports` in API — CareLog model follows same pattern as MedicalRecord
- Mongoose schemas with `ref: 'Animal'` — CareLog uses same relationship pattern as MedicalRecord
- Functional React components with `useState` / `useEffect` — no class components
- Tailwind utility classes only — no custom CSS; timeline entries use same approach
- Error handling: `catch (err) { res.status(500).json({ error: err.message }) }` — established backend pattern
- Frontend errors via `setError(err.message)` — established pattern

### Integration Points

- `AnimalDetail.jsx`: Restructured to add timeline section; existing `records` state (medical records) merged with new `careLogs` state into unified `timelineEntries` array sorted by date
- `api/routes/animals.js`: New nested routes `GET /:id/carelogs` and `POST /:id/carelogs`
- `api/index.js`: No changes needed — auth wall already covers all `/api/animals` routes
- `api/models/`: New `CareLog.js` model file, following Animal.js and MedicalRecord.js patterns

</code_context>

<specifics>
## Specific Ideas

- The compound index `{animalId: 1, date: -1, type: 1}` must be created in the CareLog schema from day one (not added retroactively) — noted in ROADMAP.md Phase 2 alerts
- Activity date (when care happened) ≠ submission date (when logged) — CareLog stores both fields; the date picker lets staff back-date entries
- Timeline oldest-first means intake at top, today's entries at bottom — consistent with reading a medical chart

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 2 scope

</deferred>

---

*Phase: 02-animal-detail-care-log-foundation*
*Context gathered: 2026-03-20*
