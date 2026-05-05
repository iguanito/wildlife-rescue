# Animal List — Configurable Column Picker

**Date:** 2026-05-05
**Status:** Approved

## Overview

Add a column visibility selector to the animal list so staff can choose which fields to display in the table. Users open a grouped modal, toggle columns on/off, and their preference is saved in localStorage. The feature also adds `currentWeight` (latest weight from care logs) and `daysInCenter` (computed from intake date) as displayable columns.

## Scope

- Column visibility toggle only — no column reordering
- Existing Animal model fields only, plus two derived columns (`currentWeight`, `daysInCenter`)
- Preferences stored in browser localStorage (per device, not per user account)
- Fields excluded from this feature (future work): Sub-group, Code, Release date/location, Pre-released, Success after release

## Default Columns

Eight columns shown on first visit (before any customization):

| Column | Source |
|--------|--------|
| Given name | `animal.givenName` |
| Common name | `animal.commonName` |
| Intake date | `animal.intakeDate` |
| Status | `animal.status` |
| Where found | `animal.whereFound` |
| Under vigilance | `animal.underVigilance` |
| Days in center | computed: `today - intakeDate` |
| Current weight | latest non-empty weight from care logs |

## All Available Columns

### Animal characteristics
Given name, Common name, Scientific name, Group (`animalGroup`), Sex, Date of birth (`estimatedDateOfBirth`), Age at admission, Microchip number, Placement, Other details

### Rescue details
Income reason(s), Rescue date, Where found, Km from center, Latitude, Longitude, Capture needed, Who brought, Who called, Call details, Other rescue details

### Clinical
Arrival weight, Current weight (derived), Had treatment, Under vigilance, In clinic, First examination, Clinical evolution, Necropsy details

### Status & Time
Status, Intake date, Days in center (derived)

## Architecture

### Backend — `GET /api/animals`

Switch from `Animal.find()` to `Animal.aggregate()`. Pipeline:

1. **`$match`** — apply existing filters: `status`, `inClinic`, `underVigilance`, `search` (by `givenName`)
2. **`$lookup`** — join `carelogs` collection, filter to entries with a non-empty `weight` field, sort by `date` descending, take the first result per animal
3. **`$addFields`** — set `currentWeight` from the lookup result (string, e.g. `"342"`)
4. **`$sort`** — `createdAt: -1`

Response shape is unchanged — existing fields plus the new `currentWeight` field. If no care log has a weight, `currentWeight` is `null`.

### Frontend — New files

**`frontend/src/config/animalColumns.js`**
Exports:
- `COLUMNS` — array of column definitions: `{ id, label, group, render(animal) }`
- `DEFAULT_COLUMN_IDS` — array of the 8 default column IDs
- `COLUMN_GROUPS` — ordered list of group names for modal rendering

The two derived columns:
- `daysInCenter`: `Math.floor((Date.now() - new Date(animal.intakeDate)) / 86400000)`
- `currentWeight`: `animal.currentWeight ?? '—'` (formatted as-is, weight unit is free-text in care logs)

**`frontend/src/hooks/useColumnConfig.js`**
```
const [visibleIds, setVisibleIds] = useColumnConfig()
```
- Reads `animalListColumns` from localStorage on mount; falls back to `DEFAULT_COLUMN_IDS`
- Writes to localStorage on every change
- Exports `visibleIds` (string[]) and `setVisibleIds`

**`frontend/src/components/ColumnPickerModal.jsx`**
Props: `visibleIds`, `onChange(ids)`, `onClose`
- Renders columns grouped by `COLUMN_GROUPS`
- Each column is a checkbox — checked if its id is in `visibleIds`
- "Reset to default" calls `onChange(DEFAULT_COLUMN_IDS)`
- "Apply" calls `onClose` (changes apply immediately via `onChange` on each toggle)
- Badge on the "Columns" button shows count of visible columns

### Frontend — Modified files

**`frontend/src/pages/AnimalList.jsx`**
- Add `useColumnConfig` hook
- Add "Columns ⊞ N" button to the toolbar (right-aligned, beside the filters)
- Replace the hardcoded `<thead>/<tbody>` with a map over `visibleIds → COLUMNS`
- Always append a non-configurable "View" action column at the end
- Pass `currentWeight` from the API response through to column render functions (already present on the animal object after backend change)

## Data Flow

```
User opens /animals
  → AnimalList mounts
  → useColumnConfig reads localStorage → visibleIds
  → fetch /api/animals (with active filters)
      → aggregation pipeline → animals[] with currentWeight
  → table renders only visible columns
  → user clicks "Columns" → ColumnPickerModal opens
  → user toggles checkbox → onChange → visibleIds updates → localStorage writes → table re-renders
  → user clicks "Apply" / outside → modal closes
```

## Error Handling

- Aggregation failure: existing `try/catch` returns HTTP 500 — no change
- `currentWeight` absent: render function displays `—`
- localStorage unavailable (private browsing): `useColumnConfig` falls back to defaults silently; writes are no-ops

## Testing

- **Backend:** one test asserting `currentWeight` on the list response equals the most recent non-empty care log weight for that animal; and that animals with no weight logs return `currentWeight: null`
- **Frontend:** manual verification — toggle columns on/off, reload page, confirm persistence; "Reset to default" restores the 8 defaults
