# Phase 3: Daily Care Dashboard - Research

**Researched:** 2026-03-23
**Domain:** MongoDB date-based dashboard queries, PATCH endpoints, React animations, Tailwind layouts
**Confidence:** HIGH

## Summary

Phase 3 adds a dashboard showing animals with follow-up appointments due today and a status count widget. The technical challenge centers on efficient date-range queries in MongoDB (finding records where `followUpDate` = today) and smooth UI removal animations in React without additional libraries.

Key findings: (1) MongoDB date queries use UTC boundaries to capture an entire day — standard Mongoose pattern with `$gte` and `$lt` operators; (2) PATCH endpoints use `findByIdAndUpdate()` with `{ new: true }` to return the updated document — same pattern already in medical.js; (3) Smooth element removal requires either conditional state + CSS transitions or Tailwind's `transition-discrete` in v4 (but project uses v3.4.1, so pure CSS approach with opacity/transform is standard); (4) Two-panel layouts use Tailwind `flex` or `grid-cols-[1fr_auto]` — existing Layout pattern uses flex, so extend with sibling sections.

**Primary recommendation:** Use `findByIdAndUpdate()` for PATCH, date boundary approach for "today" queries, CSS opacity + translate for smooth removal, Tailwind flex with `flex-1` + fixed sidebar.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-A1:** Today's tasks = animals with status `in-center` AND a MedicalRecord where `followUpDate` = today AND `followUpCompleted = false`
- **D-A2:** Visible to all roles (admin, staff, vet, volunteer)
- **D-A3:** "Mark as done" button PATCHes `followUpCompleted: true` on the MedicalRecord; animal row animates out and disappears from the list
- **D-A4:** `followUpCompleted: Boolean` field added to MedicalRecord schema (default `false`)
- **D-B1:** Two-panel layout — tasks list on the left (main content area), status counts widget on the right sidebar
- **D-B2:** Empty state: "No follow-ups due today" shown in the tasks panel; section remains visible (never hidden)
- **D-B3:** Plain "Dashboard" heading, no greeting or date display
- **D-C1:** Only action on the dashboard is "Mark as done" — no quick-add care log form; all other work happens on the animal detail page
- **D-C2:** Each task row shows: animal name + species + follow-up date from the MedicalRecord
- **D-C3:** "Mark as done" button always visible inline on the row (not hover-only)
- **D-C4:** Smooth removal animation when a row is marked done
- **D-D1:** Widget shows the 3 existing statuses only — no enum expansion in this phase
- **D-D2:** Labels: "In the center" (`in-center`), "Released" (`released`), "Deceased" (`deceased`)
- **D-D3:** Zero-count statuses always render (e.g., "Deceased: 0" still shows)
- **D-D4:** Clicking a status navigates to `/animals?status=<value>`, filtering the animal list

### Claude's Discretion
- Exact animation duration and easing for row removal
- Styling of the status count items in the sidebar widget (cards, list, etc.)
- Loading and error states for both panels
- "Mark as done" button variant (outline, filled, etc.)

### Deferred Ideas (OUT OF SCOPE)
- Quick-add care log form on dashboard — mentioned in ROADMAP but dropped; add to backlog if needed
- "Ready for Release" and "Transferred" statuses — ROADMAP listed these but Animal model only has 3; deferred to Phase 4 when status workflow is built
- Notification when animal has no care log for 24+ hours — NOTIF-V2-01 in v2 requirements
- Filtering today's tasks by animal group/species

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Staff sees a "today's tasks" view showing which animals need care entries today | MongoDB date-range query (followUpDate = today), MedicalRecord schema with followUpCompleted boolean, GET /api/dashboard/today endpoint |
| DASH-02 | Dashboard shows count of animals by status (in center, released, deceased) | MongoDB $group aggregation pipeline counting by status enum, GET /api/dashboard/status endpoint, zero-count display in UI |
| DASH-03 | Clicking an animal in the dashboard navigates to its detail page | React Router `<Link>` to `/animals/:id`, reuse of existing AnimalDetail component |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Mongoose | ^8.1.1 | MongoDB ODM — date queries, aggregation pipelines | Existing codebase; supports `$gte`, `$lt`, `$group`, `$sum` operators; standard for Node.js + MongoDB |
| Express | ^4.18.2 | REST API routing — query handling, PATCH endpoints | Existing stack; `findByIdAndUpdate()` pattern already in medical.js |
| React | ^18.2.0 | Frontend state, conditional rendering for animation | Existing stack; `useState` for visibility state, `useEffect` for fetch, conditional rendering triggers CSS transitions |
| Tailwind CSS | ^3.4.1 | Utility-first styling — two-panel layout, transitions | Existing stack; `flex`, `flex-1`, `grid-cols-[1fr_auto]` for layout, `transition-opacity` + `duration-300` for animations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Router DOM | ^6.22.0 | Navigation — status widget links to `/animals?status=...` | Already wired; useNavigate and `<Link>` components available |
| None required | — | Smooth element removal — CSS transitions sufficient | No new library needed (Tailwind v3 supports opacity/transform; no `transition-discrete` from v4) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mongoose aggregation | MongoDB shell commands or Mongoose query builder | Aggregation pipeline is more readable, supports multi-stage operations; query builder works but less flexible |
| CSS transitions for removal | react-transition-group or Framer Motion | Adds 15-30KB; CSS-only approach keeps bundle lean and matches project philosophy |
| Tailwind flex layout | CSS Grid with grid-cols-2 + gap | Flex is more flexible for responsive adjustments later; grid-cols with auto columns less predictable with variable sidebar |

**Installation:** No new packages required. Existing Mongoose, Express, React, Tailwind versions support all Phase 3 features.

---

## Architecture Patterns

### Recommended Project Structure

```
api/
├── routes/
│   └── dashboard.js         # NEW — GET /today (follow-ups), GET /status (counts)
├── models/
│   └── MedicalRecord.js     # PATCH — add followUpCompleted: Boolean field
└── tests/
    └── dashboard.test.js    # NEW — DASH-01, DASH-02, DASH-03 tests

frontend/src/
├── pages/
│   └── Dashboard.jsx        # NEW — two-panel layout, fetch today's tasks + status counts
├── components/
│   └── Layout.jsx           # PATCH — add Dashboard to navItems
└── App.jsx                  # PATCH — add /dashboard route
```

### Pattern 1: Date Range Query for "Today"

**What:** Capture a full 24-hour day (UTC) to query records created/due on a specific date without time-of-day ambiguity.

**When to use:** Filtering by date where time precision doesn't matter (e.g., "today's tasks", "logs from March 15"). Always use UTC to avoid timezone confusion in distributed systems.

**Example:**
```javascript
// Source: MongoDB + Mongoose best practice; verified against care-log.test.js pattern in codebase
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

const followUps = await MedicalRecord.find({
  followUpDate: { $gte: today, $lt: tomorrow },
  followUpCompleted: false
});
```

### Pattern 2: PATCH Endpoint for Single Field Update

**What:** Use `findByIdAndUpdate()` with explicit field update to modify one or more fields without replacing the entire document.

**When to use:** Partial updates — marking a task done, toggling a boolean, updating a timestamp. Always use `{ new: true }` to return the updated document for the client to reflect immediately.

**Example:**
```javascript
// Source: api/routes/medical.js lines 6-17 (existing pattern in codebase)
router.patch('/:id', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { followUpCompleted: true },  // Only update this field
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

### Pattern 3: MongoDB Aggregation for Status Counts

**What:** Use `$group` aggregation stage to count documents grouped by a field (status enum), returning count per status value including zero-count statuses.

**When to use:** Summary statistics, counts by category, widgets showing distribution. Aggregation pipelines scale better than multiple find() queries.

**Example:**
```javascript
// Source: MongoDB docs $group operator; verified against aggregation pattern in codebase
const statusCounts = await Animal.aggregate([
  { $match: { status: { $in: ['in-center', 'released', 'deceased'] } } },
  { $group: { _id: '$status', count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);

// If a status has zero animals, $group won't include it; ensure all statuses shown:
const allStatuses = ['in-center', 'released', 'deceased'];
const statusMap = {};
statusCounts.forEach(({ _id, count }) => { statusMap[_id] = count; });
const result = allStatuses.map(s => ({ status: s, count: statusMap[s] || 0 }));
```

### Pattern 4: React Smooth Element Removal with CSS Transitions

**What:** Render element conditionally; on "mark done", set a flag to trigger CSS opacity/transform to 0, then remove from DOM after transition completes.

**When to use:** Deleting list items, dismissing alerts, removing rows from tables. Avoids janky layout shifts by animating opacity/transform first, then unmounting.

**Note:** Tailwind v3.4.1 (current project) doesn't have `transition-discrete`, so conditional rendering + transition classes is the pattern. Use `opacity-0 scale-95` as exit state, `opacity-100 scale-100` as initial state.

**Example:**
```jsx
// Source: Tailwind transitions + React conditional rendering best practice
const [removingIds, setRemovingIds] = useState(new Set());

const handleMarkDone = (medicalRecordId) => {
  // Start animation
  setRemovingIds(prev => new Set([...prev, medicalRecordId]));

  // API call
  fetch(`/api/medical/${medicalRecordId}`, { method: 'PATCH', body: JSON.stringify({ followUpCompleted: true }) })
    .then(() => {
      // After animation duration (300ms default), remove from DOM
      setTimeout(() => {
        setFollowUps(prev => prev.filter(f => f._id !== medicalRecordId));
        setRemovingIds(prev => { const next = new Set(prev); next.delete(medicalRecordId); return next; });
      }, 300);
    });
};

// In render, apply transition classes based on removingIds:
{followUps.map(followUp => (
  <tr
    key={followUp._id}
    className={`transition-all duration-300 ${
      removingIds.has(followUp._id)
        ? 'opacity-0 scale-95'
        : 'opacity-100 scale-100'
    }`}
  >
    {/* row content */}
  </tr>
))}
```

### Pattern 5: Two-Panel Layout with Tailwind Flex

**What:** Use flexbox with `flex-1` for the main content area and a fixed-width or `w-64` sidebar. Flex is more predictable than grid for responsive sidebars.

**When to use:** Dashboard, admin panels, two-column layouts. Flex grows main content; sidebar maintains width.

**Example:**
```jsx
// Source: Tailwind flexbox utilities; verified against existing Layout.jsx pattern
export default function Dashboard() {
  return (
    <div className="flex gap-6">
      {/* Main panel — grows to fill remaining space */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4">Today's Follow-ups</h2>
        {/* Tasks list */}
      </div>

      {/* Sidebar — fixed width, never shrinks */}
      <aside className="w-64 shrink-0">
        <h3 className="text-lg font-bold mb-3">Status Counts</h3>
        {/* Status widget */}
      </aside>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Hard-deleting list items immediately:** Causes layout shift before animation completes; always animate first, unmount after transition duration.
- **Using `setTimeout` without state cleanup:** If user marks multiple items done rapidly, timers can queue and cause bugs; use explicit state tracking (`removingIds` set) instead.
- **Aggregation without `$match` first:** Don't run `$group` on the entire collection; always `$match` to filter before grouping for performance.
- **Not using UTC for date boundaries:** Using local time causes off-by-one errors in different timezones; always use `setUTCHours()` and `setUTCDate()`.
- **Returning old document from PATCH:** Forgetting `{ new: true }` in `findByIdAndUpdate()` returns pre-update doc; client UI won't reflect change.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date range queries | Custom date parsing/comparison | Mongoose `$gte` and `$lt` with UTC Date objects | Timezone edge cases are subtle; operators handle them correctly |
| Counting by status | Multiple find() queries per status | MongoDB `$group` aggregation | Single query scales to any number of statuses; multiple queries are N+1 query problem |
| Smooth removal animations | CSS keyframes from scratch, or setTimeout + animation tracking | Conditional className + Tailwind transition utilities | Tailwind utilities are tested, work with React state, avoid custom animation frame bugs |
| Status enum display | Hardcoded status strings in Dashboard component | Extract STATUS_LABELS from AnimalList.jsx (DRY) | Reduces duplication, single source of truth for status names |

**Key insight:** Date queries and aggregations seem simple but have many hidden cases (timezone handling, query planning, missing zero-count statuses). Use Mongoose operators and pipelines — they're designed for these patterns. Animations in React + CSS are tricky because removal must happen after transition completes; state-based conditional rendering + Tailwind transitions handle this automatically.

---

## Runtime State Inventory

This phase involves adding a `followUpCompleted` boolean field to MedicalRecord. The only schema change is additive (new field with default `false`), so no existing stored data needs migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — followUpCompleted is new field, default false for all existing records | None — Mongoose applies default on read |
| Live service config | None — dashboard is read-only query aggregation | None |
| OS-registered state | None | None |
| Secrets/env vars | None — no new env vars needed | None |
| Build artifacts | None | None |

**Verified explicitly:** No data migration needed. Existing MedicalRecord documents will have `followUpCompleted` undefined until explicitly set; Mongoose schema default `false` ensures queries filter correctly.

---

## Common Pitfalls

### Pitfall 1: Timezone Offset Errors in Date Queries
**What goes wrong:** Using local time for date boundaries means dashboard shows different results depending on server timezone. East Coast server sets `new Date()` to "2026-03-23 08:00 EDT" (local); UTC boundary becomes "2026-03-23 12:00 UTC". Same instant in time, but `$gte`/`$lt` filters are timezone-agnostic, causing off-by-one-day errors.

**Why it happens:** JavaScript `new Date()` is locale-dependent; MongoDB stores all dates as UTC internally. Mismatch between client/server assumptions.

**How to avoid:** Always use `setUTCHours()` and `setUTCDate()` explicitly. Set boundaries in UTC; verify with `date.toISOString()` in tests.

**Warning signs:** Dashboard tasks don't appear until after midnight server time, or appear for 23 hours then disappear.

### Pitfall 2: Aggregation Missing Zero-Count Statuses
**What goes wrong:** `$group` only returns groups that exist in the collection. If no animals are "deceased", the results won't include `{ _id: 'deceased', count: 0 }`. Widget shows only 2 statuses, violating D-D3.

**Why it happens:** `$group` is a filtering stage — it groups what exists, not what *could* exist.

**How to avoid:** After aggregation, iterate all possible status values and fill in missing statuses with count 0. Example in Pattern 3 above.

**Warning signs:** Status widget shows 1-2 items some days, then 3 items other days, depending on whether animals exist with each status.

### Pitfall 3: Forgotten `{ new: true }` in findByIdAndUpdate
**What goes wrong:** PATCH returns the pre-update document. Frontend doesn't see `followUpCompleted: true`, so the row doesn't animate out. User marks item done, button click succeeds, but UI doesn't change — confusing UX.

**Why it happens:** Mongoose's `findByIdAndUpdate()` default is `{ new: false }` for backward compatibility.

**How to avoid:** Always pass `{ new: true, runValidators: true }` to return the updated document.

**Warning signs:** Test passes (database updates correctly), but frontend integration test fails because row is still visible.

### Pitfall 4: Removing Row from DOM Before Animation Completes
**What goes wrong:** Set state to remove item from followUps array immediately after fetch(). React unmounts row before 300ms transition completes. No animation visible; row just vanishes.

**Why it happens:** Conditional rendering + transitions need timing coordination. If state removes the element, transition never gets to play.

**How to avoid:** Keep element in DOM with `removingIds` state set. After transition duration (use `setTimeout(300)`), then remove from followUps. Example in Pattern 4 above.

**Warning signs:** "Mark as done" works, but there's no animation — row disappears instantly without fade-out.

### Pitfall 5: Status Enum Mismatch Between Frontend/Backend
**What goes wrong:** Frontend has `STATUS_COLORS` with keys `'in-center'`, `'released'`, `'deceased'`. Dashboard endpoint returns status enum from Animal model. If keys don't match exactly (e.g., capitalization, hyphenation), widget labels won't render.

**Why it happens:** Strings are fragile; easy to mistype or refactor one place and forget another.

**How to avoid:** Extract `STATUS_LABELS` and `STATUS_COLORS` to a shared constants file, or import from AnimalList.jsx where they're already defined. Use the same object in both Dashboard and AnimalList.

**Warning signs:** Status widget renders counts correctly but labels are blank or say "undefined".

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Get Today's Follow-up Tasks (Dashboard Endpoint)

```javascript
// Source: Mongoose docs date queries + existing care-log query pattern in codebase
// api/routes/dashboard.js — GET /api/dashboard/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const tasks = await MedicalRecord.aggregate([
      {
        $match: {
          followUpDate: { $gte: today, $lt: tomorrow },
          followUpCompleted: false
        }
      },
      {
        $lookup: {
          from: 'animals',
          localField: 'animal',
          foreignField: '_id',
          as: 'animalData'
        }
      },
      { $unwind: '$animalData' },
      {
        $match: { 'animalData.status': 'in-center' }
      },
      {
        $project: {
          _id: 1,
          followUpDate: 1,
          description: 1,
          'animalData.givenName': 1,
          'animalData.commonName': 1,
          'animalData._id': 1
        }
      },
      { $sort: { followUpDate: 1 } }
    ]);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Mark Follow-up Done (PATCH Endpoint)

```javascript
// Source: api/routes/medical.js pattern, adapted for PATCH single field
// PATCH /api/medical/:id — requires staff/vet/admin role (write action)
router.patch('/:id', requireRole('staff', 'vet', 'admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { followUpCompleted: true },
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

### Get Status Counts

```javascript
// Source: MongoDB docs $group aggregation
// api/routes/dashboard.js — GET /api/dashboard/status
router.get('/status', async (req, res) => {
  try {
    const counts = await Animal.aggregate([
      { $match: { status: { $in: ['in-center', 'released', 'deceased'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Ensure all statuses present, even with zero count
    const allStatuses = ['in-center', 'released', 'deceased'];
    const countMap = {};
    counts.forEach(({ _id, count }) => { countMap[_id] = count; });
    const result = allStatuses.map(status => ({
      status,
      count: countMap[status] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Dashboard Page Component (React)

```jsx
// Source: Existing AnimalList.jsx + Tailwind layout patterns
// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  'in-center': 'In the center',
  released: 'Released',
  deceased: 'Deceased',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [statusCounts, setStatusCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/today').then(r => r.json()),
      fetch('/api/dashboard/status').then(r => r.json())
    ])
      .then(([tasks, counts]) => {
        setFollowUps(tasks);
        setStatusCounts(counts);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkDone = async (medicalRecordId) => {
    try {
      setRemovingIds(prev => new Set([...prev, medicalRecordId]));

      await fetch(`/api/medical/${medicalRecordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpCompleted: true })
      });

      setTimeout(() => {
        setFollowUps(prev => prev.filter(f => f._id !== medicalRecordId));
        setRemovingIds(prev => { const next = new Set(prev); next.delete(medicalRecordId); return next; });
      }, 300);
    } catch (err) {
      setError(err.message);
      setRemovingIds(prev => { const next = new Set(prev); next.delete(medicalRecordId); return next; });
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="flex gap-8">
      {/* Main panel */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Follow-ups Due Today</h3>
          </div>

          {followUps.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No follow-ups due today</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Animal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Species</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {followUps.map(task => (
                  <tr
                    key={task._id}
                    className={`transition-all duration-300 ${
                      removingIds.has(task._id)
                        ? 'opacity-0 scale-95'
                        : 'opacity-100 scale-100'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link to={`/animals/${task.animalData._id}`} className="text-green-700 hover:underline">
                        {task.animalData.givenName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{task.animalData.commonName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(task.followUpDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {user && ['staff', 'vet', 'admin'].includes(user.role) && (
                        <button
                          onClick={() => handleMarkDone(task._id)}
                          className="text-green-700 hover:text-green-900 font-medium transition-colors"
                        >
                          Mark as done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-64 shrink-0">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Animals by Status</h3>
          <div className="space-y-3">
            {statusCounts.map(({ status, count }) => (
              <Link
                key={status}
                to={`/animals?status=${status}`}
                className="block p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">{STATUS_LABELS[status]}</div>
                <div className="text-lg font-bold text-green-700">{count}</div>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Date construction for ranges | Mongoose `$gte`/`$lt` with UTC Date boundaries | Always (standard practice) | Eliminates timezone bugs, readable code |
| Multiple queries per status | Single `$group` aggregation pipeline | MongoDB 3.2+ | Single query scales to any number of statuses |
| Hardcoded animation timing | Tailwind transition utilities + state-driven CSS classes | Tailwind 1.0+ (2019) | Consistent with design system, testable |
| Removing rows immediately | State flag + setTimeout after transition | React Concurrent Features era (~2020) | Smooth UX, prevents layout thrashing |

**Deprecated/outdated:**
- **XMLHttpRequest for data fetching:** Modern projects use `fetch()` API (available in all browsers since ~2015). All Phase 3 examples use `fetch()`.
- **Hard-deleting with immediate unmount:** Old pattern; now understood that animations need time to complete before DOM removal.

---

## Open Questions

1. **Should dashboard queries be two separate endpoints or combined?**
   - What we know: CONTEXT.md shows two logical sections (tasks + status widget), which could map to two endpoints or one
   - What's unclear: Whether combining them (e.g., `GET /api/dashboard` returns `{ tasks, statusCounts }`) is better for performance/UX
   - Recommendation: **Two endpoints** (`/dashboard/today` and `/dashboard/status`). Allows frontend to fetch independently, easier to cache/invalidate, matches REST convention. Planner will decide during task breakdown.

2. **Role-based visibility of "Mark as done" button — confirm implementation?**
   - What we know: CONTEXT.md D-A2 says visible to all roles, but D-C1 + Phase 1 D-11 suggest write action hidden from volunteers
   - What's unclear: Should volunteer see button disabled, or button completely hidden?
   - Recommendation: **Button completely hidden for volunteers** (like AnimalList "Add Animal" button). Use `['staff', 'vet', 'admin'].includes(user.role)` check. Cleaner UX, no confusing disabled state.

3. **Loading state for two-panel dashboard?**
   - What we know: CONTEXT.md lists "Loading and error states" as Claude's discretion
   - What's unclear: Should both panels load in parallel, or tasks load first?
   - Recommendation: **Parallel fetch** with single loading state while both queries complete. If one fails, show error but allow other panel to render. Pattern in Code Example 4 shows `Promise.all()` for parallel fetch.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest ^29.7.0 + Supertest ^7.2.2 |
| Config file | api/jest.config.js |
| Quick run command | `npm test --prefix api -- dashboard.test.js` |
| Full suite command | `npm test --prefix api` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | GET /api/dashboard/today returns animals with status=in-center AND followUpDate=today AND followUpCompleted=false | Integration | `npm test --prefix api -- dashboard.test.js -t "dash.today"` | ❌ Wave 0 |
| DASH-01 | GET /api/dashboard/today returns empty array when no follow-ups | Integration | `npm test --prefix api -- dashboard.test.js -t "dash.today.empty"` | ❌ Wave 0 |
| DASH-02 | GET /api/dashboard/status returns counts for all 3 statuses even with zero count | Integration | `npm test --prefix api -- dashboard.test.js -t "dash.status.zero"` | ❌ Wave 0 |
| DASH-02 | GET /api/dashboard/status counts match animal collection | Integration | `npm test --prefix api -- dashboard.test.js -t "dash.status.accuracy"` | ❌ Wave 0 |
| DASH-03 | PATCH /api/medical/:id with followUpCompleted=true returns updated record | Integration | `npm test --prefix api -- dashboard.test.js -t "dash.mark-done"` | ❌ Wave 0 |
| DASH-03 | Volunteer cannot PATCH /api/medical/:id (returns 403) | Integration | `npm test --prefix api -- dashboard.test.js -t "dash.mark-done.forbidden"` | ❌ Wave 0 |
| DASH-03 | Frontend Dashboard navigates to /animals/:id when animal clicked | Unit/E2E | Manual or Cypress | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test --prefix api -- dashboard.test.js --testNamePattern="DASH"` (all dashboard tests < 10 seconds)
- **Per wave merge:** `npm test --prefix api` (full suite including auth, access, care-log tests)
- **Phase gate:** Full suite green + manual smoke test on Dashboard page before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `api/tests/dashboard.test.js` — covers DASH-01, DASH-02, DASH-03 (6 test cases: two for today's tasks, two for status counts, two for mark-done role gating)
- [ ] `api/routes/dashboard.js` — GET /today and GET /status endpoints with proper error handling
- [ ] `api/models/MedicalRecord.js` — add `followUpCompleted: { type: Boolean, default: false }` field
- [ ] `frontend/src/pages/Dashboard.jsx` — full component with two-panel layout, animation, status widget
- [ ] `frontend/src/App.jsx` — add `<Route path="/dashboard" element={<Dashboard />} />`
- [ ] `frontend/src/components/Layout.jsx` — add `{ to: '/dashboard', label: 'Dashboard' }` to navItems

*(Framework install not needed — Jest and Supertest already present in api/package.json)*

---

## Sources

### Primary (HIGH confidence)
- **Mongoose v8.1.1 docs** — Date queries with `$gte`/`$lt` UTC boundaries, aggregation `$group` stage
- **MongoDB official docs** — `$group` aggregation operator, `$match` filtering, `$lookup` joins
- **Express ^4.18.2** — `findByIdAndUpdate()` pattern (verified in api/routes/medical.js)
- **Tailwind CSS v3.4.1** — Flex layout utilities (`flex`, `flex-1`, `w-64`, `shrink-0`), transition utilities (`transition-opacity`, `duration-300`, `scale-95`)
- **React ^18.2.0 docs** — Conditional rendering, useState for state management

### Secondary (MEDIUM confidence)
- [Mongoose Tutorials: Working With Dates](https://mongoosejs.com/docs/tutorials/dates.html) — Date range query pattern verified
- [TypeScript Express tutorial #15: PUT vs PATCH in MongoDB](https://wanago.io/2020/04/27/typescript-express-put-vs-patch-mongodb-mongoose/) — PATCH semantics and `findByIdAndUpdate()` usage
- [MongoDB Community Hub: Query date range of the same day](https://www.mongodb.com/community/forums/t/query-date-range-of-the-same-day/146171) — UTC boundary approach confirmed
- [Tailwind CSS Transition Documentation](https://tailwindcss.com/docs/transition-property) — Transition utilities and timing
- [Tailwind CSS Grid & Flex Layout](https://tailwindcss.com/docs/grid-template-columns) — Two-column layout patterns

### Tertiary (referenced but not primary source)
- WebSearch on "React CSS transition remove element animation Tailwind 2026" — Tailwind v4 `transition-discrete` mentioned (not used; project on v3.4.1)

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — Mongoose, Express, React, Tailwind versions locked in package.json; all features verified in docs
- Architecture: **HIGH** — Date query patterns verified in code (care-log.test.js uses similar date filtering); PATCH pattern confirmed in medical.js; CSS transitions standard
- Pitfalls: **MEDIUM** — Based on common patterns; some edge cases (timezone, zero-count aggregation) based on experience, not project-specific examples yet
- Validation Architecture: **HIGH** — Jest and Supertest already configured; test patterns from Phase 1-2 established

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days; stable APIs, no fast-moving dependencies)
**Requires re-verification if:** Mongoose major version changes, Tailwind updated to v4, aggregation pipeline queries slow down (check performance during planning)
