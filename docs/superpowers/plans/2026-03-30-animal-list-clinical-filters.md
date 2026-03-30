# Animal List Clinical Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "In clinic" and "Under vigilance" checkbox filters to the animal list view.

**Architecture:** Backend gains two new query params (`inClinic`, `underVigilance`) on `GET /api/animals`; frontend adds two boolean state variables and checkboxes that append those params to the fetch URL.

**Tech Stack:** Express/Mongoose (backend), React + Tailwind (frontend), Jest + Supertest (backend tests)

---

## Files

| Action | Path | Responsibility |
|---|---|---|
| Create | `api/tests/animal-list-filters.test.js` | Backend tests for inClinic/underVigilance query params |
| Modify | `api/routes/animals.js` | Handle inClinic/underVigilance query params in GET / |
| Modify | `frontend/src/pages/AnimalList.jsx` | Add checkbox state + UI for both filters |

---

## Task 1: Write failing backend tests

**Files:**
- Create: `api/tests/animal-list-filters.test.js`

- [ ] **Step 1: Create the test file**

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

describe('LIST-FILTER-01: inClinic filter', () => {
  test('list.filter.inClinic — returns only animals with inClinic=true when param is set', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Clinic Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: true });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Field Badger', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: false });

    const res = await request(app)
      .get('/api/animals?inClinic=true')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].commonName).toBe('Clinic Fox');
  });

  test('list.filter.inClinic.absent — returns all animals when inClinic param is absent', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Fox A', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: true });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Fox B', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: false });

    const res = await request(app)
      .get('/api/animals')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('LIST-FILTER-02: underVigilance filter', () => {
  test('list.filter.underVigilance — returns only animals with underVigilance=true when param is set', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Vigilance Otter', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), underVigilance: true });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Normal Otter', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), underVigilance: false });

    const res = await request(app)
      .get('/api/animals?underVigilance=true')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].commonName).toBe('Vigilance Otter');
  });
});

describe('LIST-FILTER-03: combined filters', () => {
  test('list.filter.combined — inClinic and underVigilance can be combined', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Both Flags', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: true, underVigilance: true });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Only Clinic', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: true, underVigilance: false });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Neither', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: false, underVigilance: false });

    const res = await request(app)
      .get('/api/animals?inClinic=true&underVigilance=true')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].commonName).toBe('Both Flags');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd api && npx jest tests/animal-list-filters.test.js --runInBand --forceExit
```

Expected: all 4 tests FAIL (inClinic/underVigilance params are not yet handled).

---

## Task 2: Implement backend filter params

**Files:**
- Modify: `api/routes/animals.js:10-14`

- [ ] **Step 3: Update the GET / handler to handle the new params**

In `api/routes/animals.js`, replace the query destructuring and filter block (lines 10–14):

```js
const { status, species, search, inClinic, underVigilance } = req.query;
const filter = {};
if (status) filter.status = status;
if (species) filter.species = new RegExp(species, 'i');
if (search) filter.name = new RegExp(search, 'i');
if (inClinic === 'true') filter.inClinic = true;
if (underVigilance === 'true') filter.underVigilance = true;
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd api && npx jest tests/animal-list-filters.test.js --runInBand --forceExit
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
cd api && npm test
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add api/tests/animal-list-filters.test.js api/routes/animals.js
git commit -m "feat: add inClinic and underVigilance filter params to GET /api/animals"
```

---

## Task 3: Add frontend checkboxes

**Files:**
- Modify: `frontend/src/pages/AnimalList.jsx`

- [ ] **Step 7: Add state variables**

In `AnimalList.jsx`, add two new state variables after the existing `statusFilter` line (line 24):

```js
const [inClinicFilter, setInClinicFilter] = useState(false);
const [underVigilanceFilter, setUnderVigilanceFilter] = useState(false);
```

- [ ] **Step 8: Pass new params to fetch URL**

In the `useEffect` fetch block, add the two new params after the `statusFilter` block (after line 29):

```js
if (inClinicFilter) params.set('inClinic', 'true');
if (underVigilanceFilter) params.set('underVigilance', 'true');
```

Add both state variables to the `useEffect` dependency array (line 37):

```js
}, [search, statusFilter, inClinicFilter, underVigilanceFilter]);
```

- [ ] **Step 9: Add checkboxes to the filter bar**

In the filter bar `<div>` (after the closing `</select>` tag, line 70), add:

```jsx
<label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
  <input
    type="checkbox"
    checked={inClinicFilter}
    onChange={(e) => setInClinicFilter(e.target.checked)}
    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
  />
  In clinic
</label>
<label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
  <input
    type="checkbox"
    checked={underVigilanceFilter}
    onChange={(e) => setUnderVigilanceFilter(e.target.checked)}
    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
  />
  Under vigilance
</label>
```

- [ ] **Step 10: Verify in browser**

Start the dev server:
```bash
npm run dev
```

Navigate to the Animals list. Confirm:
- Two checkboxes appear after the status dropdown.
- Checking "In clinic" re-fetches and shows only animals with `inClinic: true`.
- Checking "Under vigilance" re-fetches and shows only animals with `underVigilance: true`.
- Both can be checked simultaneously.
- Unchecking removes the filter.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/pages/AnimalList.jsx
git commit -m "feat: add in-clinic and under-vigilance checkbox filters to animal list"
```
