# Animal List — Configurable Column Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a grouped column-picker modal to the animal list so users can toggle which fields are visible, persisted in localStorage, with `currentWeight` pulled from the latest care log via a backend aggregation.

**Architecture:** `GET /api/animals` switches from `Animal.find()` to `Animal.aggregate()`, adding a `$lookup` that joins the most recent non-empty weight from `carelogs`. A static `COLUMNS` config in `animalColumns.jsx` defines all 31 columns (including two derived ones). A `useColumnConfig` hook reads/writes `animalListColumns` in localStorage. `ColumnPickerModal` renders grouped checkboxes. `AnimalList.jsx` wires everything together.

**Tech Stack:** Node.js/Express, Mongoose aggregation pipeline, React, Tailwind CSS, localStorage, Jest/Supertest

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `api/tests/animal-list-current-weight.test.js` | Backend tests for `currentWeight` on list endpoint |
| Modify | `api/routes/animals.js` | Switch `GET /api/animals` to aggregation with `$lookup` |
| Create | `frontend/src/config/animalColumns.jsx` | COLUMNS array, DEFAULT_COLUMN_IDS, COLUMN_GROUPS, STATUS constants |
| Create | `frontend/src/hooks/useColumnConfig.js` | localStorage read/write for visible column IDs |
| Create | `frontend/src/components/ColumnPickerModal.jsx` | Grouped checkbox modal for column visibility |
| Modify | `frontend/src/pages/AnimalList.jsx` | Use hook + modal, render dynamic columns from config |

---

## Task 1: Failing tests for `currentWeight` on list endpoint

**Files:**
- Create: `api/tests/animal-list-current-weight.test.js`

- [ ] **Step 1.1: Write the failing tests**

Create `api/tests/animal-list-current-weight.test.js`:

```js
const request = require('supertest');
const { connectTestDB, clearTestDB, closeTestDB } = require('./helpers/db');
const { createTestUser, TEST_PASSWORDS } = require('./helpers/fixtures');

let app;

beforeAll(async () => {
  await connectTestDB();
  app = require('../index');
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

async function login(role) {
  const user = await createTestUser(role);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password: TEST_PASSWORDS.plain });
  return { cookie: res.headers['set-cookie'][0].split(';')[0], user };
}

describe('LIST-WEIGHT-01: currentWeight on list endpoint', () => {
  test('list.weight.latest — returns most recent non-empty weight from care logs', async () => {
    const { cookie } = await login('staff');

    const animalRes = await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Weight Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });
    const animalId = animalRes.body._id;

    // Older entry with weight
    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: '2026-04-01', weight: '300', feeding: '', observation: '' });

    // Newer entry with weight — this should be returned
    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: '2026-04-10', weight: '342', feeding: '', observation: '' });

    const res = await request(app).get('/api/animals').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].currentWeight).toBe('342');
  });

  test('list.weight.skipsEmpty — ignores care log entries with empty weight', async () => {
    const { cookie } = await login('staff');

    const animalRes = await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Skip Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });
    const animalId = animalRes.body._id;

    // Older entry with weight
    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: '2026-04-01', weight: '280', feeding: '', observation: '' });

    // Newer entry with NO weight — should be skipped
    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: '2026-04-10', weight: '', feeding: 'mice x3', observation: '' });

    const res = await request(app).get('/api/animals').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body[0].currentWeight).toBe('280');
  });

  test('list.weight.noLogs — currentWeight is null when animal has no care logs', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'No Logs Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });

    const res = await request(app).get('/api/animals').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body[0].currentWeight).toBeNull();
  });

  test('list.weight.noWeightLogs — currentWeight is null when care logs exist but none have weight', async () => {
    const { cookie } = await login('staff');

    const animalRes = await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Obs Only Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });
    const animalId = animalRes.body._id;

    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: '2026-04-01', weight: '', feeding: '', observation: 'looks good' });

    const res = await request(app).get('/api/animals').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body[0].currentWeight).toBeNull();
  });
});
```

- [ ] **Step 1.2: Run the tests to confirm they fail**

```bash
cd api && npx jest tests/animal-list-current-weight.test.js --runInBand --forceExit
```

Expected: 4 failing tests — `currentWeight` is `undefined` (not yet in response).

---

## Task 2: Rewrite `GET /api/animals` with aggregation

**Files:**
- Modify: `api/routes/animals.js` (lines 8–22)

- [ ] **Step 2.1: Replace the list handler with an aggregation pipeline**

In `api/routes/animals.js`, replace the `GET /` handler (lines 8–22) with:

```js
// GET /api/animals
router.get('/', async (req, res) => {
  try {
    const { status, search, inClinic, underVigilance } = req.query;
    const match = {};
    if (status) match.status = status;
    if (search) match.givenName = new RegExp(search, 'i');
    if (inClinic === 'true') match.inClinic = true;
    if (underVigilance === 'true') match.underVigilance = true;

    const animals = await Animal.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'carelogs',
          let: { animalId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$animal', '$$animalId'] },
                weight: { $nin: [null, ''] },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 1 },
            { $project: { weight: 1 } },
          ],
          as: 'latestWeightLog',
        },
      },
      {
        $addFields: {
          currentWeight: { $arrayElemAt: ['$latestWeightLog.weight', 0] },
        },
      },
      { $project: { latestWeightLog: 0 } },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(animals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

Note: `currentWeight` defaults to `null` (not `undefined`) when `$arrayElemAt` finds nothing — this satisfies the test assertions. Also fixes the pre-existing bug where `search` filtered on `filter.name` instead of `givenName`.

- [ ] **Step 2.2: Run the weight tests — expect all 4 to pass**

```bash
cd api && npx jest tests/animal-list-current-weight.test.js --runInBand --forceExit
```

Expected output:
```
PASS tests/animal-list-current-weight.test.js
  LIST-WEIGHT-01: currentWeight on list endpoint
    ✓ list.weight.latest
    ✓ list.weight.skipsEmpty
    ✓ list.weight.noLogs
    ✓ list.weight.noWeightLogs
```

- [ ] **Step 2.3: Run the full test suite to confirm no regressions**

```bash
cd api && npm test
```

Expected: all existing tests still pass.

- [ ] **Step 2.4: Commit**

```bash
git add api/tests/animal-list-current-weight.test.js api/routes/animals.js
git commit -m "feat: rewrite GET /api/animals with aggregation to include currentWeight"
```

---

## Task 3: Column config

**Files:**
- Create: `frontend/src/config/animalColumns.jsx`

- [ ] **Step 3.1: Create the column definitions file**

Create `frontend/src/config/animalColumns.jsx`:

```jsx
export const STATUS_COLORS = {
  'in-center': 'bg-blue-100 text-blue-800',
  released: 'bg-teal-100 text-teal-800',
  deceased: 'bg-gray-100 text-gray-600',
};

export const STATUS_LABELS = {
  'in-center': 'In the center',
  released: 'Released',
  deceased: 'Deceased',
};

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

function bool(val) {
  return val ? '✓' : '—';
}

export const COLUMNS = [
  // Animal characteristics
  { id: 'givenName',           label: 'Given name',        group: 'Animal characteristics', render: a => a.givenName || '—' },
  { id: 'commonName',          label: 'Common name',       group: 'Animal characteristics', render: a => a.commonName || '—' },
  { id: 'scientificName',      label: 'Scientific name',   group: 'Animal characteristics', render: a => a.scientificName || '—' },
  { id: 'animalGroup',         label: 'Group',             group: 'Animal characteristics', render: a => a.animalGroup || '—' },
  { id: 'sex',                 label: 'Sex',               group: 'Animal characteristics', render: a => a.sex || '—' },
  { id: 'estimatedDateOfBirth',label: 'Date of birth',     group: 'Animal characteristics', render: a => formatDate(a.estimatedDateOfBirth) },
  { id: 'ageAtAdmission',      label: 'Age at admission',  group: 'Animal characteristics', render: a => a.ageAtAdmission || '—' },
  { id: 'microchipNumber',     label: 'Microchip',         group: 'Animal characteristics', render: a => a.microchipNumber || '—' },
  { id: 'placement',           label: 'Placement',         group: 'Animal characteristics', render: a => a.placement || '—' },
  { id: 'otherDetails',        label: 'Other details',     group: 'Animal characteristics', render: a => a.otherDetails || '—' },

  // Rescue details
  { id: 'incomeReasons',       label: 'Income reason(s)',  group: 'Rescue details', render: a => a.incomeReasons || '—' },
  { id: 'rescueDate',          label: 'Rescue date',       group: 'Rescue details', render: a => formatDate(a.rescueDate) },
  { id: 'whereFound',          label: 'Where found',       group: 'Rescue details', render: a => a.whereFound || '—' },
  { id: 'distanceFromCenter',  label: 'Km from center',    group: 'Rescue details', render: a => a.distanceFromCenter != null ? a.distanceFromCenter : '—' },
  { id: 'latitude',            label: 'Latitude',          group: 'Rescue details', render: a => a.latitude != null ? a.latitude : '—' },
  { id: 'longitude',           label: 'Longitude',         group: 'Rescue details', render: a => a.longitude != null ? a.longitude : '—' },
  { id: 'captureNeeded',       label: 'Capture needed',    group: 'Rescue details', render: a => bool(a.captureNeeded) },
  { id: 'whoBrought',          label: 'Who brought',       group: 'Rescue details', render: a => a.whoBrought || '—' },
  { id: 'whoCalled',           label: 'Who called',        group: 'Rescue details', render: a => a.whoCalled || '—' },
  { id: 'callDetails',         label: 'Call details',      group: 'Rescue details', render: a => a.callDetails || '—' },
  { id: 'otherRescueDetails',  label: 'Other rescue details', group: 'Rescue details', render: a => a.otherRescueDetails || '—' },

  // Clinical
  { id: 'arrivalWeight',       label: 'Arrival weight',    group: 'Clinical', render: a => a.arrivalWeight != null ? `${a.arrivalWeight} g` : '—' },
  { id: 'currentWeight',       label: 'Current weight',    group: 'Clinical', render: a => a.currentWeight || '—' },
  { id: 'hadTreatment',        label: 'Had treatment',     group: 'Clinical', render: a => bool(a.hadTreatment) },
  { id: 'underVigilance',      label: 'Under vigilance',   group: 'Clinical', render: a => bool(a.underVigilance) },
  { id: 'inClinic',            label: 'In clinic',         group: 'Clinical', render: a => bool(a.inClinic) },
  { id: 'firstExamination',    label: 'First examination', group: 'Clinical', render: a => a.firstExamination || '—' },
  { id: 'clinicalEvolution',   label: 'Clinical evolution',group: 'Clinical', render: a => a.clinicalEvolution || '—' },
  { id: 'necropsyDetails',     label: 'Necropsy details',  group: 'Clinical', render: a => a.necropsyDetails || '—' },

  // Status & Time
  {
    id: 'status',
    label: 'Status',
    group: 'Status & Time',
    render: a => (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
        {STATUS_LABELS[a.status] ?? a.status}
      </span>
    ),
  },
  { id: 'intakeDate',          label: 'Intake date',       group: 'Status & Time', render: a => formatDate(a.intakeDate) },
  {
    id: 'daysInCenter',
    label: 'Days in center',
    group: 'Status & Time',
    render: a => a.intakeDate ? Math.floor((Date.now() - new Date(a.intakeDate)) / 86400000) : '—',
  },
];

export const COLUMN_GROUPS = [
  'Animal characteristics',
  'Rescue details',
  'Clinical',
  'Status & Time',
];

export const DEFAULT_COLUMN_IDS = [
  'givenName',
  'commonName',
  'intakeDate',
  'status',
  'whereFound',
  'underVigilance',
  'daysInCenter',
  'currentWeight',
];
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/config/animalColumns.jsx
git commit -m "feat: add animal column config with 31 columns and defaults"
```

---

## Task 4: `useColumnConfig` hook

**Files:**
- Create: `frontend/src/hooks/useColumnConfig.js`

- [ ] **Step 4.1: Create the hook**

Create `frontend/src/hooks/useColumnConfig.js`:

```js
import { useState } from 'react';
import { DEFAULT_COLUMN_IDS } from '../config/animalColumns.jsx';

const LS_KEY = 'animalListColumns';

function readFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_COLUMN_IDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COLUMN_IDS;
  } catch {
    return DEFAULT_COLUMN_IDS;
  }
}

export default function useColumnConfig() {
  const [visibleIds, setVisibleIds] = useState(readFromStorage);

  function update(ids) {
    setVisibleIds(ids);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(ids));
    } catch {
      // localStorage unavailable (e.g. private browsing) — silent no-op
    }
  }

  return [visibleIds, update];
}
```

- [ ] **Step 4.2: Commit**

```bash
git add frontend/src/hooks/useColumnConfig.js
git commit -m "feat: add useColumnConfig hook for localStorage column persistence"
```

---

## Task 5: `ColumnPickerModal` component

**Files:**
- Create: `frontend/src/components/ColumnPickerModal.jsx`

- [ ] **Step 5.1: Create the modal component**

Create `frontend/src/components/ColumnPickerModal.jsx`:

```jsx
import { COLUMNS, COLUMN_GROUPS, DEFAULT_COLUMN_IDS } from '../config/animalColumns.jsx';

export default function ColumnPickerModal({ visibleIds, onChange, onClose }) {
  function toggle(id) {
    if (visibleIds.includes(id)) {
      onChange(visibleIds.filter(v => v !== id));
    } else {
      onChange([...visibleIds, id]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Customize columns</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange(DEFAULT_COLUMN_IDS)}
              className="text-xs text-gray-500 underline hover:text-gray-700"
            >
              Reset to default
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="px-4 py-3 max-h-96 overflow-y-auto flex flex-col gap-4">
          {COLUMN_GROUPS.map(group => {
            const cols = COLUMNS.filter(c => c.group === group);
            return (
              <div key={group}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{group}</div>
                <div className="grid grid-cols-3 gap-y-1.5 gap-x-2">
                  {cols.map(col => (
                    <label key={col.id} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleIds.includes(col.id)}
                        onChange={() => toggle(col.id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-green-800 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Commit**

```bash
git add frontend/src/components/ColumnPickerModal.jsx
git commit -m "feat: add ColumnPickerModal component with grouped column toggles"
```

---

## Task 6: Wire up `AnimalList.jsx`

**Files:**
- Modify: `frontend/src/pages/AnimalList.jsx`

- [ ] **Step 6.1: Replace `AnimalList.jsx` with the updated version**

Replace the entire contents of `frontend/src/pages/AnimalList.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COLUMNS } from '../config/animalColumns.jsx';
import useColumnConfig from '../hooks/useColumnConfig.js';
import ColumnPickerModal from '../components/ColumnPickerModal.jsx';

export default function AnimalList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'in-center');
  const [inClinicFilter, setInClinicFilter] = useState(false);
  const [underVigilanceFilter, setUnderVigilanceFilter] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [visibleIds, setVisibleIds] = useColumnConfig();

  const visibleColumns = visibleIds.map(id => COLUMNS.find(c => c.id === id)).filter(Boolean);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (inClinicFilter) params.set('inClinic', 'true');
    if (underVigilanceFilter) params.set('underVigilance', 'true');

    setLoading(true);
    fetch(`/api/animals?${params}`)
      .then(r => r.json())
      .then(setAnimals)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, inClinicFilter, underVigilanceFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Animals</h2>
        {user && ['staff', 'vet', 'admin'].includes(user.role) && (
          <Link
            to="/animals/new"
            className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Add Animal
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All statuses</option>
          <option value="in-center">In the center</option>
          <option value="released">Released</option>
          <option value="deceased">Deceased</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inClinicFilter}
            onChange={e => setInClinicFilter(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          In clinic
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={underVigilanceFilter}
            onChange={e => setUnderVigilanceFilter(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Under vigilance
        </label>
        <button
          onClick={() => setShowColumnPicker(true)}
          className="ml-auto flex items-center gap-1.5 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ⊞ Columns
          <span className="bg-green-700 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
            {visibleIds.length}
          </span>
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : animals.length === 0 ? (
        <p className="text-gray-500">No animals found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map(col => (
                  <th
                    key={col.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {animals.map(a => (
                <tr key={a._id} className="hover:bg-gray-50">
                  {visibleColumns.map(col => (
                    <td key={col.id} className="px-6 py-4 text-sm text-gray-600">
                      {col.render(a)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/animals/${a._id}`}
                      className="text-green-700 hover:underline text-sm font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showColumnPicker && (
        <ColumnPickerModal
          visibleIds={visibleIds}
          onChange={setVisibleIds}
          onClose={() => setShowColumnPicker(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6.2: Start the dev server and verify manually**

```bash
cd /path/to/project && npm run dev
```

Open `http://localhost:5173/animals` and verify:
1. Table shows the 8 default columns
2. "Columns 8" button appears in the toolbar (right side)
3. Clicking the button opens the modal with 4 groups
4. Toggling a checkbox adds/removes that column from the table immediately
5. "Reset to default" restores the 8 defaults
6. "Apply" or clicking outside closes the modal
7. Reload the page — column selection persists

- [ ] **Step 6.3: Run the full backend test suite one more time**

```bash
cd api && npm test
```

Expected: all tests pass.

- [ ] **Step 6.4: Commit**

```bash
git add frontend/src/pages/AnimalList.jsx
git commit -m "feat: add configurable column picker to animal list"
```

---

## Task 7: Push

- [ ] **Step 7.1: Push to remote**

```bash
git push
```
