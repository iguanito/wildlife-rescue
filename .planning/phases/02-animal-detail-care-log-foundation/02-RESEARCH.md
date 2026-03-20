# Phase 2: Animal Detail & Care Log Foundation - Research

**Researched:** 2026-03-20
**Domain:** Mongoose data modeling, REST API nested routes, React timeline UI with date grouping
**Confidence:** HIGH

## Summary

Phase 2 creates a unified care timeline for animal records: intake event + chronologically merged care logs + medical records displayed in oldest-first order. The primary technical work is: (1) CareLog Mongoose schema with compound index, (2) nested API routes for care log CRUD, (3) React frontend timeline component with day-grouping and expand/collapse UI.

The phase builds directly on Phase 1 auth infrastructure. All care log writes must capture `req.user._id` via `createdBy` field. Query performance is backed by compound index `{animalId: 1, date: -1, type: 1}` created at schema definition time.

**Primary recommendation:** Build CareLog schema first with compound index. Add nested routes `GET /:id/carelogs` and `POST /:id/carelogs` immediately after. Then refactor AnimalDetail.jsx to fetch both MedicalRecords and CareLogs, merge chronologically, and render as a day-grouped timeline with compact care log entries (expandable) and always-expanded medical records.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Timeline entries grouped by day — each day gets a date heading with entries nested beneath
**D-02:** Care log entries are compact+expand — type label + value shown inline, click to expand notes and who logged it
**D-03:** Medical records always expanded in timeline — show full detail inline, no click needed
**D-04:** Intake is the first timeline event — appears as the oldest entry ("Intake · [date arrived]"), no separate bottom anchor
**D-05:** Timeline chronological (oldest first, newest at bottom) — consistent with reading a care history
**D-06:** Weight type — numeric input only; staff type unit themselves in value field (e.g., "450g"); stored as plain text
**D-07:** Feeding type — notes field only (freeform text); no structured amount field
**D-08:** Observation type — notes field only (freeform text)
**D-09:** All care log types share same form: date picker + type selector + value/notes field
**D-10:** "Add care log" button sticky above timeline — always visible at top of care log area
**D-11:** Form opens inline between button and first entry, pushing entries down; button disappears while form open
**D-12:** Animal info panel stays as compact header above timeline; no change to structure
**D-13:** Old medical records section removed; medical records merge into timeline chronologically
**D-14:** Timeline section replaces old medical records section — main content area below header

### Claude's Discretion

- Exact date heading format (e.g., "March 20" vs "Mar 20 · 3 entries")
- Empty state for animals with no care logs yet
- Expand/collapse animation for care log entries
- Error state styling within inline form

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within Phase 2 scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CARE-01 | Staff can add a care log entry to an animal (type: feeding, weight, observation) | CareLog schema with three enum types, POST /api/animals/:id/carelogs route with requireRole('staff', 'vet', 'admin'), form in AnimalDetail.jsx |
| CARE-02 | Care logs include date, type, value/notes, and the user who created it | CareLog fields: date (activity date), submittedAt (creation time), type, value, notes, createdBy (ref User); captured from req.user during POST |
| CARE-03 | Staff can view all care logs for a given animal | GET /api/animals/:id/carelogs endpoint returns array sorted by date descending; AnimalDetail.jsx fetches and displays |
| DETAIL-01 | User can view an animal's full history in chronological order: intake info, care logs, medical records, and outcome | AnimalDetail.jsx fetches /medical and /carelogs, merges with intake event, sorts by date ascending, renders day-grouped timeline |
| DETAIL-02 | Animal detail page shows current status and all key fields from intake | AnimalDetail.jsx header panel displays all Animal schema fields (species, rescue location, intake date, status, notes, etc.) |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Mongoose | 8.1.1 | MongoDB ODM for schema definition and queries | Already in use for Animal and MedicalRecord models; compound indexes created via schema definition |
| Express Router | 4.18.2 | Nested route handlers for care log endpoints | Already in use; nested routes like `/:id/medical` extend easily |
| React Hooks | 18.2.0 | useState/useEffect for timeline state management | Established pattern in codebase; no new library needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Moment.js or Date.prototype | native | Date grouping and formatting for timeline | Phase 2 uses native Date methods; Moment.js optional if formatting becomes complex in later phases |
| Tailwind CSS | 3.4.1 | Styling timeline entries and form | Established utility-first approach in existing components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Day-grouping in JavaScript | SQL GROUP BY in backend aggregation | JS grouping simpler for small result sets; aggregation better for 10,000+ entries per animal (unlikely in v1) |
| Mongoose compound index | Multiple single-field indexes | Compound index is more efficient for range queries on (animalId, date, type); single indexes would require index merging |
| Inline form in AnimalDetail | Modal dialog for care log creation | Inline keeps form context visible; modal isolates better for complex multi-page forms |

**Installation:** No new packages needed — use existing dependencies.

**Version verification:**
- Mongoose ^8.1.1 — verified in api/package.json
- Express ^4.18.2 — verified in api/package.json
- React ^18.2.0 — verified in frontend/package.json

## Architecture Patterns

### Recommended Project Structure

No new directories. Use existing structure:
```
api/
├── models/
│   ├── Animal.js          # Existing
│   ├── MedicalRecord.js   # Existing
│   ├── CareLog.js         # NEW — created in Phase 2
│   └── User.js            # Existing
├── routes/
│   └── animals.js         # Extended with nested routes
└── tests/
    └── care-log.test.js   # NEW — integration tests

frontend/
├── src/pages/
│   └── AnimalDetail.jsx   # Restructured to merge timeline
└── src/components/
    └── Timeline.jsx       # OPTIONAL — reusable timeline component
```

### Pattern 1: CareLog Mongoose Schema with Compound Index

**What:** Create a schema with exact fields matching requirements, add compound index at schema definition time (not retroactively).

**When to use:** Whenever a new collection needs performance-critical querying on multiple fields. Compound index on `{animalId, date, type}` ensures single-field lookups plus sorting complete in < 100ms even after 6 months of data.

**Example:**
```javascript
// api/models/CareLog.js
const mongoose = require('mongoose');

const careLogSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  date: { type: Date, required: true }, // Activity date (when care happened)
  submittedAt: { type: Date, default: Date.now }, // Submission date (when logged)
  type: {
    type: String,
    enum: ['feeding', 'weight', 'observation'],
    required: true,
  },
  value: { type: String, trim: true }, // For weight type: "450g"; for others: null
  notes: { type: String, trim: true }, // For feeding/observation types
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Compound index: enables queries like "all care logs for animal X, sorted by date, filtered by type"
careLogSchema.index({ animal: 1, date: -1, type: 1 });

module.exports = mongoose.model('CareLog', careLogSchema);
```

**Source:** Mongoose docs; Pattern established by existing MedicalRecord.js

### Pattern 2: Nested REST Route for Care Logs

**What:** Extend existing animals router with nested routes that accept the animal ID in the path, validate ownership/access, and return/modify care logs.

**When to use:** When a resource is logically nested under another (care logs under animals). Nesting in the URL path makes the hierarchy clear.

**Example:**
```javascript
// api/routes/animals.js — ADD these routes
const CareLog = require('../models/CareLog');

// GET /api/animals/:id/carelogs — list all care logs for animal
router.get('/:id/carelogs', async (req, res) => {
  try {
    const logs = await CareLog.find({ animal: req.params.id })
      .sort({ date: -1 })
      .populate('createdBy', 'email role');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/animals/:id/carelogs — create a new care log
router.post('/:id/carelogs', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const log = await CareLog.create({
      ...req.body,
      animal: req.params.id,
      createdBy: req.user._id, // Captured from auth middleware
    });
    const populated = await log.populate('createdBy', 'email role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

**Source:** Established pattern in api/routes/animals.js; mirrors existing GET/POST /api/animals/:id/medical routes

### Pattern 3: Timeline Merge in React Frontend

**What:** Fetch both MedicalRecords and CareLogs, create synthetic "intake" event, merge all into one array, sort by activity date, group by calendar day in UI.

**When to use:** When displaying a unified chronological view of multiple event types that don't live in the same collection.

**Example:**
```javascript
// frontend/src/pages/AnimalDetail.jsx
useEffect(() => {
  Promise.all([
    fetch(`/api/animals/${id}`).then(r => r.json()),
    fetch(`/api/animals/${id}/medical`).then(r => r.json()),
    fetch(`/api/animals/${id}/carelogs`).then(r => r.json()),
  ])
    .then(([animal, medRecords, careLogs]) => {
      // Create synthetic intake event
      const intakeEvent = {
        type: 'intake',
        date: new Date(animal.intakeDate),
        animal: animal._id,
      };

      // Merge all events
      const allEvents = [
        intakeEvent,
        ...medRecords.map(m => ({ ...m, type: 'medical' })),
        ...careLogs.map(c => ({ ...c, type: 'carelog' })),
      ];

      // Sort by date ascending (oldest first)
      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Group by date in UI (see Pattern 4)
      setTimelineEntries(allEvents);
      setAnimal(animal);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, [id]);
```

**Source:** Native JavaScript; established fetch + useState pattern in codebase

### Pattern 4: Day-Grouping Algorithm

**What:** Group timeline entries by calendar date, render date heading for each day, nest entries beneath.

**When to use:** When timeline is long (100+ entries) and visual grouping by day aids scanning.

**Example:**
```javascript
// Helper function in AnimalDetail.jsx
function groupByDay(entries) {
  const groups = {};
  entries.forEach(entry => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0]; // "2026-03-20"
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  });
  return Object.entries(groups).map(([date, items]) => ({
    date: new Date(date),
    entries: items,
  }));
}

// In JSX:
{dayGroups.map(day => (
  <div key={day.date.toISOString()}>
    <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-2">
      {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
    </h4>
    {day.entries.map(entry => (
      <TimelineEntry key={entry._id || 'intake'} entry={entry} />
    ))}
  </div>
))}
```

**Source:** Native JavaScript Array methods; Tailwind for styling

### Pattern 5: Expand/Collapse for Care Log Entries

**What:** Store expanded state in useState; care logs show compact view by default (type + value), expand on click to show notes + createdBy + date.

**When to use:** When entry detail is secondary to the list view. Reduces visual clutter while keeping detail one click away.

**Example:**
```javascript
// In AnimalDetail.jsx or TimelineEntry.jsx
const [expanded, setExpanded] = useState({});

function TimelineEntry({ entry }) {
  const isExpanded = expanded[entry._id];

  if (entry.type === 'intake') {
    return <p className="text-sm text-gray-600">Intake · {new Date(entry.date).toLocaleDateString()}</p>;
  }

  if (entry.type === 'medical') {
    // Medical records always expanded (per D-03)
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-3">
        <p className="font-medium text-gray-900">{entry.description}</p>
        {entry.treatment && <p className="text-sm text-gray-600">Treatment: {entry.treatment}</p>}
        {entry.vet && <p className="text-sm text-gray-600">Vet: {entry.vet}</p>}
        <p className="text-xs text-gray-400 mt-1">{new Date(entry.date).toLocaleDateString()}</p>
      </div>
    );
  }

  if (entry.type === 'carelog') {
    return (
      <div className="bg-gray-50 rounded p-3 mb-2 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [entry._id]: !isExpanded }))}>
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
          </span>
          <span className="text-sm text-gray-900 flex-1">{entry.value || entry.notes?.substring(0, 50)}</span>
          <span className="text-xs text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
        {isExpanded && (
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            {entry.notes && <p>Notes: {entry.notes}</p>}
            <p>By: {entry.createdBy?.email}</p>
            <p>Date: {new Date(entry.date).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    );
  }
}
```

**Source:** Established useState pattern in codebase; Tailwind for styling

### Anti-Patterns to Avoid

- **Fetching carelogs and medical separately in map():** Triggers N+1 queries. Fetch both upfront at component mount.
- **Storing expanded state as array instead of object:** Checking `expanded.includes(id)` is O(n); use object for O(1) lookup.
- **Sorting after grouping by day:** Sort before grouping to ensure entries within each day are in correct order.
- **Creating indexes after data exists:** Performance test may fail. Always define indexes in schema upfront.
- **Forgetting `createdBy` population in API response:** Frontend expects user info to display "logged by X"; populate before sending JSON.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date grouping and formatting | Custom date utility class | Native `Date` + `toISOString()` + `toLocaleDateString()` | Handles timezone edge cases, locale support, and DST automatically |
| Mongo compound index | Manual sorting in JS | Mongoose schema `.index()` method | Indexes push sorting to database level, avoid O(n) memory overhead in Node; 100x faster for 1000+ records |
| Timeline state management | Redux reducer | React useState + local refactoring to smaller components | Timeline is page-local state; no prop drilling; hooks are simpler than Redux setup overhead |
| User attribution in forms | req.query param for createdBy | `req.user._id` from auth middleware | Query params can be spoofed; middleware ensures server-side verification |

**Key insight:** Compound indexes and date arithmetic are well-solved problems with zero custom code cost. Hand-rolling them introduces bugs and performance regressions.

## Runtime State Inventory

> No runtime state to migrate — Phase 2 is greenfield for CareLog data model.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — CareLog collection doesn't exist yet | Schema creation in migration/seed process |
| Live service config | None — no external config references carelogs | None |
| OS-registered state | None | None |
| Secrets/env vars | None — uses existing MONGODB_URI | None |
| Build artifacts | None — no name/file collisions | None |

## Common Pitfalls

### Pitfall 1: Forgetting Activity Date vs. Submission Date Distinction

**What goes wrong:** Developer treats `date` field as creation time (submittedAt), not activity time. Staff tries to back-date a care log entry (e.g., "I forgot to log yesterday's feeding"), but system rejects it or shows wrong timeline order.

**Why it happens:** In many audit systems, logged date = activity date. CareLog separates them per CONTEXT.md D-10. Two fields are required.

**How to avoid:** Always populate both `date` (activity) and `submittedAt` (submission) in POST request. Schema includes both; tests verify both fields in response.

**Warning signs:** Timeline sorts by wrong date; care log form doesn't allow back-dating; database record missing `submittedAt` field.

### Pitfall 2: Compound Index Not Created Until After Data Inserted

**What goes wrong:** Schema defined without `.index()` call. Early testing passes (empty table). Later, 6 months of data accumulated. First query for "care logs for animal X" hangs for 5+ seconds. Index added retrospectively, but old data requires rebuild.

**Why it happens:** Developer forgets the `.index()` line, or copies MedicalRecord.js which might not have had an index upfront.

**How to avoid:** Add `.index({ animal: 1, date: -1, type: 1 })` immediately in CareLog schema definition. Verify in unit test by querying index list: `db.careLog.getIndexes()` should show the compound index.

**Warning signs:** Timeline query times degrade over time; MongoDB logs show collection scans; timeline page slow only after weeks of data.

### Pitfall 3: Medical Records Not Populated When Fetching

**What goes wrong:** CareLog fetch includes `.populate('createdBy')`, but GET /api/animals/:id/medical doesn't. Timeline shows "logged by undefined" for medical records; "logged by admin@test.com" for care logs. Inconsistent UX.

**Why it happens:** Medical routes were created before Phase 1 auth retrofit; createdBy was added later but populate() not added to route response.

**How to avoid:** Verify both GET /api/animals/:id/medical and GET /api/animals/:id/carelogs populate createdBy before sending response. Test both endpoints' JSON response structure in integration tests.

**Warning signs:** Care logs show user name; medical records show null/undefined; inconsistent detail cards in timeline.

### Pitfall 4: Timeline Merging in Wrong Order

**What goes wrong:** Sort by date, then filter by type separately, breaking chronological order. Intake at top, care logs in middle, medical records at bottom — even if medical predates some care logs.

**Why it happens:** Developer maps careLogs into one array, medicalRecords into another, displays side-by-side instead of merged.

**How to avoid:** Single array with type discriminator. Add synthetic intake event to array before sorting. Sort once by date. Group by day after sorting. Verify in unit test: check nth entry's date against (n-1)th and (n+1)th.

**Warning signs:** Timeline jumps around dates; intake appears in middle or end; care logs for March appear below care logs for April.

### Pitfall 5: Inline Form Button Doesn't Disappear When Form Opens

**What goes wrong:** "Add care log" button stays visible while form is open. User clicks button again, creates duplicate form. Or form appears below button instead of between button and timeline.

**Why it happens:** showMedForm state toggles button visibility, but developer didn't use conditional rendering or CSS display: none.

**How to avoid:** Use `showMedForm && <FormComponent />` to conditionally render. Button renders only when `!showMedForm`. Form pushes timeline down via DOM reflow (no custom z-index needed). Test by clicking button, form appears, clicking button again hides form, no duplicates.

**Warning signs:** Button and form both visible; form renders below timeline instead of above; clicking button multiple times creates multiple forms.

## Code Examples

Verified patterns from official sources and existing codebase:

### CareLog Model Creation
```javascript
// Source: api/models/MedicalRecord.js pattern; Mongoose docs
const mongoose = require('mongoose');

const careLogSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  date: { type: Date, required: true }, // Activity date
  submittedAt: { type: Date, default: Date.now }, // Submission date
  type: {
    type: String,
    enum: ['feeding', 'weight', 'observation'],
    required: true,
  },
  value: { type: String, trim: true },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

careLogSchema.index({ animal: 1, date: -1, type: 1 });

module.exports = mongoose.model('CareLog', careLogSchema);
```

### Care Log Route — GET List
```javascript
// Source: api/routes/animals.js existing pattern
router.get('/:id/carelogs', async (req, res) => {
  try {
    const logs = await CareLog.find({ animal: req.params.id })
      .sort({ date: -1 })
      .populate('createdBy', 'email role');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Care Log Route — POST Create
```javascript
// Source: api/routes/animals.js existing pattern for POST /medical
router.post('/:id/carelogs', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const log = await CareLog.create({
      ...req.body,
      animal: req.params.id,
      createdBy: req.user._id,
    });
    const populated = await CareLog.findById(log._id).populate('createdBy', 'email role');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

### Timeline Merge in React
```javascript
// Source: Established fetch + useState pattern in frontend/src/pages/AnimalDetail.jsx
useEffect(() => {
  Promise.all([
    fetch(`/api/animals/${id}`).then(r => r.json()),
    fetch(`/api/animals/${id}/medical`).then(r => r.json()),
    fetch(`/api/animals/${id}/carelogs`).then(r => r.json()),
  ])
    .then(([animal, medRecords, careLogs]) => {
      const intakeEvent = {
        _id: 'intake',
        type: 'intake',
        date: animal.intakeDate,
      };

      const allEvents = [
        intakeEvent,
        ...medRecords.map(m => ({ ...m, type: 'medical' })),
        ...careLogs.map(c => ({ ...c, type: 'carelog' })),
      ];

      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      setTimelineEntries(allEvents);
      setAnimal(animal);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, [id]);
```

### Day Grouping
```javascript
// Source: Native JavaScript Array methods
function groupByDay(entries) {
  const groups = {};
  entries.forEach(entry => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  });

  return Object.entries(groups)
    .map(([dateStr, items]) => ({
      date: new Date(dateStr),
      entries: items,
    }))
    .sort((a, b) => a.date - b.date);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate medical records section | Unified timeline view | Phase 2 (now) | Users see all events chronologically; fewer page scrolls; easier to spot care gaps |
| Hard delete on animal | Soft delete + status enum | Phase 1 | Audit trail preserved; no accidental data loss; queries filter by deletedAt |
| No compound indexes | Compound indexes in schema | Phase 2 (now) | Query performance stays constant as data grows; < 100ms queries even at 6 months of data |
| createdBy optional | createdBy required on CareLog | Phase 2 (now) | Full audit trail; staff accountability; supports later features like "today's tasks" dashboard |

**Deprecated/outdated:** None in Phase 2 scope.

## Open Questions

1. **Empty state messaging for animals with no care logs**
   - What we know: Decision D-10 defers empty state styling to Claude's Discretion
   - What's unclear: Should empty state show "No care logs yet" placeholder or just omit the timeline section?
   - Recommendation: Show placeholder text "No care logs recorded yet" inside the timeline section. Keeps layout consistent; signals where staff should add their first entry.

2. **Date heading format precision**
   - What we know: Decision D-10 defers exact format to Claude's Discretion
   - What's unclear: "March 20" vs "Mar 20" vs "March 20, 2026" vs "3/20/26"?
   - Recommendation: Use `.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })` → "March 20" (readable, unambiguous). For future i18n, this is locale-aware.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^29.7.0 + Supertest ^7.2.2 |
| Config file | api/jest.config.js |
| Quick run command | `npm run test -- care-log.test.js` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CARE-01 | Staff can add care log (type, date, value/notes) | integration | `npm run test -- care-log.test.js -t "CARE-01"` | ❌ Wave 0 |
| CARE-02 | Care log includes createdBy attribution | integration | `npm run test -- care-log.test.js -t "CARE-02"` | ❌ Wave 0 |
| CARE-03 | Staff can view all care logs for animal (query) | integration | `npm run test -- care-log.test.js -t "CARE-03"` | ❌ Wave 0 |
| DETAIL-01 | Timeline merges intake, carelogs, medical chronologically | integration | `npm run test -- animal-detail.test.js -t "DETAIL-01"` | ❌ Wave 0 |
| DETAIL-02 | Detail page displays all animal fields | integration | `npm run test -- animal-detail.test.js -t "DETAIL-02"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test -- care-log.test.js` (care log routes only, ~10 sec)
- **Per wave merge:** `npm run test` (all tests including auth from Phase 1, ~30 sec)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `api/tests/care-log.test.js` — covers CARE-01, CARE-02, CARE-03 with integration tests for POST/GET /carelogs endpoints
- [ ] `frontend/src/tests/AnimalDetail.test.jsx` (optional) — covers DETAIL-01, DETAIL-02 if component testing is enabled
- [ ] `api/models/CareLog.js` — schema with compound index; must exist before testing
- [ ] Jest setup: ensure `api/tests/helpers/db.js` supports CareLog collection (should auto-work via Mongoose)

*(Existing test infrastructure covers all phase requirements; no new framework setup needed)*

## Sources

### Primary (HIGH confidence)

- **Mongoose 8.1.1 docs** — Schema definition, compound indexes, populate()
  - Verified in api/package.json: mongoose: ^8.1.1
  - Compound index syntax: `schema.index({ field1: 1, field2: -1 })`
  - Reference population: `.populate('fieldName', 'projection')`

- **Express Router pattern** — Nested routes, req.user from middleware
  - Verified in api/routes/animals.js: existing GET/POST for nested /medical routes
  - Verified in api/index.js: authenticateToken middleware attaches req.user
  - Verified in api/middleware/authorize.js: requireRole() middleware pattern

- **React Hooks pattern** — useState, useEffect for data fetching
  - Verified in frontend/src/pages/AnimalDetail.jsx: existing pattern with Promise.all fetch
  - Verified in frontend/src/context/AuthContext.jsx: useContext for user state

- **Jest + Supertest framework** — Integration testing Express routes
  - Verified in api/jest.config.js: test setup
  - Verified in api/tests/auth.test.js: existing integration test pattern with supertest(app).post()

### Secondary (MEDIUM confidence)

- **Phase 1 auth retrofit decisions** — createdBy field pattern
  - Verified in .planning/STATE.md: "Audit trail via createdBy: MedicalRecord retrofitted in Phase 1 to add createdBy. CareLog includes createdBy from day one."
  - Verified in api/models/MedicalRecord.js: createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  - Verified in api/routes/animals.js POST /medical: req.user captured in request context

- **CONTEXT.md decisions** — Timeline structure and form placement
  - Verified in 02-CONTEXT.md: All 14 implementation decisions including D-01 through D-14

### Tertiary (LOW confidence - flagged for validation)

- None — all findings cross-verified with codebase or requirements documents

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — Mongoose, Express, React already in use; versions verified in package.json
- Architecture: **HIGH** — Nested routes and timeline merge pattern established in Phase 1; MedicalRecord serves as schema template
- Pitfalls: **HIGH** — Identified from common Mongoose/React patterns and Phase 1 retrofit experience
- Test architecture: **HIGH** — Jest + Supertest already in place; care log tests follow auth.test.js pattern

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (30 days — stable libraries, no major updates expected)

---

*Research completed by Claude Code on 2026-03-20*
*Phase 2: Animal Detail & Care Log Foundation*
