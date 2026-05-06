# Animal List — Combined Name & Species Search

**Date:** 2026-05-05
**Status:** Approved

## Overview

Extend the animal list search to match either `givenName` or `commonName` (species). Currently the search only matches `givenName`. After this change, typing "fox" returns animals named "Fox" as well as all animals whose species contains "fox" (e.g. "Red Fox").

## Scope

- One backend change: `$match` uses `$or` instead of a single field filter
- One frontend change: input placeholder text updated
- No new UI elements, no new API parameters, no schema changes

## Design

### Backend — `api/routes/animals.js`

Replace:
```js
if (search) match.givenName = new RegExp(search, 'i');
```

With:
```js
if (search) match.$or = [
  { givenName: new RegExp(search, 'i') },
  { commonName: new RegExp(search, 'i') },
];
```

The search runs server-side via the aggregation `$match` stage — no client-side filtering involved.

### Frontend — `frontend/src/pages/AnimalList.jsx`

Update the search input placeholder:
- Before: `"Search by name..."`
- After: `"Search by name or species..."`

No other frontend changes.

## Testing

- **New test:** searching for a term that matches `commonName` but not `givenName` returns the correct animal
- **Existing tests:** all current search/filter tests continue to pass
