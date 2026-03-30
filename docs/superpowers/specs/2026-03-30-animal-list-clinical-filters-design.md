# Design: Animal List — In Clinic & Under Vigilance Filters

**Date:** 2026-03-30

## Goal

Add two boolean filters to the animal list view so staff can quickly surface animals with clinical flags set.

## Filters

| Filter | Field | Behaviour |
|---|---|---|
| In clinic | `inClinic` | When checked, show only animals where `inClinic === true` |
| Under vigilance | `underVigilance` | When checked, show only animals where `underVigilance === true` |

Both filters default to unchecked (no filtering). Filters are independent and combinable with each other and with the existing status and search filters.

## Frontend — `frontend/src/pages/AnimalList.jsx`

- Add two boolean state variables: `inClinicFilter` (default `false`) and `underVigilanceFilter` (default `false`).
- When either is `true`, append the corresponding query param (`inClinic=true`, `underVigilance=true`) to the fetch URL inside the existing `useEffect`.
- Both state variables are added to the `useEffect` dependency array so the list refetches on change.
- Two checkboxes are added to the existing filter bar `<div>`, after the status dropdown, each with a `<label>`:
  - `☐ In clinic`
  - `☐ Under vigilance`
- Styling follows the existing filter bar pattern (small text, consistent spacing).

## Backend — `api/routes/animals.js`

- In `GET /api/animals`, destructure two new query params alongside the existing ones: `inClinic`, `underVigilance`.
- If `inClinic === 'true'`, set `filter.inClinic = true`.
- If `underVigilance === 'true'`, set `filter.underVigilance = true`.
- No schema changes needed — both fields already exist on the `Animal` model as booleans.

## Out of scope

- "Not in clinic" / "not under vigilance" filtering — not needed.
- Persisting filter state to URL params — not needed.
