---
phase: quick
plan: 260330-lgr
type: execute
wave: 1
depends_on: []
files_modified:
  - api/models/CareLog.js
  - api/routes/animals.js
  - frontend/src/pages/AnimalDetail.jsx
autonomous: true
requirements: [CARE-01, CARE-02, CARE-03]

must_haves:
  truths:
    - "Add care log form shows 3 labeled textareas: Feeding, Weight, Observation"
    - "No type selector dropdown in the add form"
    - "All 3 fields are optional — form submits with any combination filled"
    - "Edit form also shows 3 textareas instead of type selector"
    - "Timeline cards display the three fields when present"
    - "Backend accepts and stores feeding/weight/observation as distinct fields"
  artifacts:
    - path: "api/models/CareLog.js"
      provides: "Schema with feeding, weight, observation string fields (optional)"
    - path: "api/routes/animals.js"
      provides: "PUT handler destructures feeding/weight/observation instead of type/value/notes"
    - path: "frontend/src/pages/AnimalDetail.jsx"
      provides: "Add and edit forms with 3 textareas, timeline rendering updated"
  key_links:
    - from: "frontend/src/pages/AnimalDetail.jsx"
      to: "POST /api/animals/:id/carelogs"
      via: "addCareLog fetch with {date, feeding, weight, observation}"
    - from: "frontend/src/pages/AnimalDetail.jsx"
      to: "PUT /api/animals/:id/carelogs/:logId"
      via: "saveCareLog fetch with {date, feeding, weight, observation}"
---

<objective>
Replace the care log type selector (feeding/weight/observation enum + single notes field) with three independent optional textarea fields: Feeding, Weight, Observation.

Purpose: Each care log entry can capture all three aspects of a care session in one submission, rather than requiring one entry per type.
Output: Updated schema, route handler, and AnimalDetail form + timeline rendering.
</objective>

<execution_context>
@/home/arnaud/workspace/perso/wildlife-rescue/.claude/get-shit-done/workflows/execute-plan.md
@/home/arnaud/workspace/perso/wildlife-rescue/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key facts extracted from codebase:
- CareLog schema: `api/models/CareLog.js` — currently has `type` (enum feeding/weight/observation, required), `value` (string), `notes` (string)
- Care log routes live in `api/routes/animals.js` (lines 92-157) — POST creates, PUT updates with `{ date, type, value, notes }`
- Add form lives in `frontend/src/pages/AnimalDetail.jsx` around line 405
  - `careForm` state: `{ date, type, value, notes }`
  - After save, resets to `{ date: today, type: 'feeding', value: '', notes: '' }`
- Edit form: `careEditForm` state `{ date, type, value, notes }`, initialized on "Edit" click at line 590
- Timeline rendering at line 575 shows `typeLabel` badge + `entry.value` + `entry.notes`
- Tests in `api/tests/care-log.test.js` send `{ date, type, notes }` — tests will need updating to match new schema
- Existing compound index: `{ animal: 1, date: -1, type: 1 }` — remove `type` from index since field is gone
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update CareLog schema and route handler</name>
  <files>api/models/CareLog.js, api/routes/animals.js, api/tests/care-log.test.js</files>
  <action>
**api/models/CareLog.js** — Replace the `type`/`value`/`notes` fields with three optional string fields. Remove `type` from the compound index.

New schema (keep animal, date, submittedAt, createdBy, timestamps unchanged):
```js
const careLogSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  date: { type: Date, required: true },
  submittedAt: { type: Date, default: Date.now },
  feeding: { type: String, trim: true },
  weight: { type: String, trim: true },
  observation: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

careLogSchema.index({ animal: 1, date: -1 });
```

**api/routes/animals.js** — Update the PUT handler (around line 147):
- Change `const { date, type, value, notes } = req.body;` to `const { date, feeding, weight, observation } = req.body;`
- Change the update object in `findByIdAndUpdate` from `{ date, type, value, notes }` to `{ date, feeding, weight, observation }`
- The POST handler uses `...req.body` spread so it requires no change.

**api/tests/care-log.test.js** — Update all test payloads to use new fields:
- Replace `{ date, type: 'feeding', notes: '...' }` with `{ date, feeding: '...' }` in CARE-01 test
- Replace `{ date, type: 'observation', notes: '...' }` with `{ date, observation: '...' }` in CARE-02 test
- In CARE-03 test, change the two POST payloads to `{ date, feeding: 'First feed' }` and `{ date, weight: 'Weight check' }` respectively
- Update assertions: replace `res.body.type` and `res.body.notes` checks with the new fields (e.g., `res.body.feeding`, `res.body.observation`)
  </action>
  <verify>
    <automated>cd /home/arnaud/workspace/perso/wildlife-rescue && npm test --prefix api -- --testPathPattern=care-log 2>&1 | tail -20</automated>
  </verify>
  <done>All 3 CARE-0x tests pass with new field names. No `type`, `value`, `notes` fields in schema.</done>
</task>

<task type="auto">
  <name>Task 2: Update AnimalDetail form and timeline rendering</name>
  <files>frontend/src/pages/AnimalDetail.jsx</files>
  <action>
**State — careForm** (line 82): Change initial value from `{ date: today, type: 'feeding', value: '', notes: '' }` to `{ date: today, feeding: '', weight: '', observation: '' }`.

**State — careEditForm** (line 79): Default shape will be `{ date: '', feeding: '', weight: '', observation: '' }`.

**addCareLog reset** (line 233): Change reset to `{ date: new Date().toISOString().split('T')[0], feeding: '', weight: '', observation: '' }`.

**Edit button initializer** (line 590): Change the setCareEditForm call from `{ date: ..., type: entry.type, value: entry.value || '', notes: entry.notes || '' }` to `{ date: entry.date?.split('T')[0] || '', feeding: entry.feeding || '', weight: entry.weight || '', observation: entry.observation || '' }`.

**Add form** (lines 418-453): Remove the type selector `<div>` block entirely (the second column in the grid with the `<select>`). Replace the single conditional value/notes field with three separate labeled textarea blocks:
```jsx
<div className="col-span-2">
  <label className="block text-xs font-medium text-gray-500 mb-1">Feeding</label>
  <textarea
    rows={2}
    placeholder="e.g. 5ml formula, fed well"
    value={careForm.feeding}
    onChange={(e) => setCareForm((f) => ({ ...f, feeding: e.target.value }))}
    className={inputCls}
  />
</div>
<div className="col-span-2">
  <label className="block text-xs font-medium text-gray-500 mb-1">Weight</label>
  <textarea
    rows={1}
    placeholder="e.g. 450g"
    value={careForm.weight}
    onChange={(e) => setCareForm((f) => ({ ...f, weight: e.target.value }))}
    className={inputCls}
  />
</div>
<div className="col-span-2">
  <label className="block text-xs font-medium text-gray-500 mb-1">Observation</label>
  <textarea
    rows={2}
    placeholder="Describe what you observed"
    value={careForm.observation}
    onChange={(e) => setCareForm((f) => ({ ...f, observation: e.target.value }))}
    className={inputCls}
  />
</div>
```
The date field stays as-is (first column). Remove `required` from the button/submit — all 3 fields are optional. The date field keeps `required`.

**Edit form** (lines 608-624): Remove the type `<select>` block. Replace the conditional value/notes field with the same three labeled textarea pattern, bound to `careEditForm.feeding`, `careEditForm.weight`, `careEditForm.observation` with `setCareEditForm((f) => ({ ...f, feeding/weight/observation: e.target.value }))`.

**Timeline rendering** (lines 575-635):
- Line 576: Remove `const typeLabel = ...` and the `<span>` badge that shows the type label (line 581). Keep the rest of the card header (author email, edit/delete buttons).
- Lines 632-633: Replace `{entry.value && ...}` / `{entry.notes && ...}` with:
```jsx
{entry.feeding && <p className="text-sm text-gray-900 mt-2"><span className="font-medium">Feeding:</span> {entry.feeding}</p>}
{entry.weight && <p className="text-sm text-gray-900 mt-1"><span className="font-medium">Weight:</span> {entry.weight}</p>}
{entry.observation && <p className="text-sm text-gray-500 mt-1"><span className="font-medium">Observation:</span> {entry.observation}</p>}
```
  </action>
  <verify>
    <automated>cd /home/arnaud/workspace/perso/wildlife-rescue && npm run build --prefix frontend 2>&1 | tail -20</automated>
  </verify>
  <done>Frontend build succeeds with no errors. Form has 3 optional textareas (Feeding, Weight, Observation) and no type selector. Timeline shows each filled field with its label.</done>
</task>

</tasks>

<verification>
After both tasks:
1. `npm test --prefix api -- --testPathPattern=care-log` — all CARE-0x tests pass
2. `npm run build --prefix frontend` — no build errors
3. Manual: open AnimalDetail for any animal, click "+ Add Care Log", confirm no type dropdown, 3 labeled textareas visible, all optional
</verification>

<success_criteria>
- CareLog schema has `feeding`, `weight`, `observation` string fields (all optional); `type`, `value` fields removed
- POST and PUT routes accept and persist the three new fields
- Add form: date field + 3 optional textareas, no type selector
- Edit form: same 3-textarea layout
- Timeline cards display Feeding / Weight / Observation labels for any field that has content
- All care-log tests pass green
</success_criteria>

<output>
After completion, create `.planning/quick/260330-lgr-replace-care-log-type-selector-with-feed/260330-lgr-SUMMARY.md`
</output>
