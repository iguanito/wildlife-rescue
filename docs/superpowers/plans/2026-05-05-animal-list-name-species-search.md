# Animal List — Combined Name & Species Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the animal list search to match either `givenName` or `commonName` so staff can find animals by name or by species.

**Architecture:** The search filter in `GET /api/animals` currently applies a regex only to `givenName`. Replace it with a `$or` that tests both `givenName` and `commonName`. The frontend gets a placeholder update only — no logic changes.

**Tech Stack:** Node.js/Express, Mongoose aggregation pipeline, React, Jest/Supertest

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `api/routes/animals.js` | Switch search from single-field to `$or` |
| Modify | `api/tests/animal-list-filters.test.js` | Add species search test cases |
| Modify | `frontend/src/pages/AnimalList.jsx` | Update placeholder text |

---

## Task 1: Failing test for species search

**Files:**
- Modify: `api/tests/animal-list-filters.test.js`

- [ ] **Step 1.1: Add a new describe block at the end of `api/tests/animal-list-filters.test.js`**

```js
describe('LIST-FILTER-04: search by name or species', () => {
  test('list.search.species — returns animal when search matches commonName', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ givenName: 'Buddy', commonName: 'Red Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ givenName: 'Zara', commonName: 'Golden Eagle', animalGroup: 'Bird', intakeDate: new Date().toISOString() });

    const res = await request(app)
      .get('/api/animals?search=fox')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].givenName).toBe('Buddy');
  });

  test('list.search.name — returns animal when search matches givenName', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ givenName: 'Titi', commonName: 'Red Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ givenName: 'Rex', commonName: 'Golden Eagle', animalGroup: 'Bird', intakeDate: new Date().toISOString() });

    const res = await request(app)
      .get('/api/animals?search=titi')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].givenName).toBe('Titi');
  });

  test('list.search.both — returns animals matching either givenName or commonName', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ givenName: 'Fox', commonName: 'Red Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ givenName: 'Buddy', commonName: 'Arctic Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ givenName: 'Zara', commonName: 'Golden Eagle', animalGroup: 'Bird', intakeDate: new Date().toISOString() });

    const res = await request(app)
      .get('/api/animals?search=fox')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});
```

- [ ] **Step 1.2: Run the new tests to confirm they fail**

```bash
cd api && npx jest tests/animal-list-filters.test.js --runInBand --forceExit
```

Expected: the 3 new `LIST-FILTER-04` tests fail — species search returns 0 results because the current filter only checks `givenName`.

---

## Task 2: Implement combined search in the backend

**Files:**
- Modify: `api/routes/animals.js`

- [ ] **Step 2.1: Replace the single-field search filter with `$or`**

In `api/routes/animals.js`, find this line inside the `GET /` handler:

```js
if (search) match.givenName = new RegExp(search, 'i');
```

Replace it with:

```js
if (search) match.$or = [
  { givenName: new RegExp(search, 'i') },
  { commonName: new RegExp(search, 'i') },
];
```

- [ ] **Step 2.2: Run the filter tests — all should pass**

```bash
cd api && npx jest tests/animal-list-filters.test.js --runInBand --forceExit
```

Expected:
```
PASS tests/animal-list-filters.test.js
  LIST-FILTER-01: inClinic filter (2 tests)
  LIST-FILTER-02: underVigilance filter (2 tests)
  LIST-FILTER-03: combined filters (1 test)
  LIST-FILTER-04: search by name or species (3 tests)
```

- [ ] **Step 2.3: Run the full test suite — no regressions**

```bash
cd api && npm test
```

Expected: all tests pass.

- [ ] **Step 2.4: Commit**

```bash
git add api/routes/animals.js api/tests/animal-list-filters.test.js
git commit -m "feat: extend animal search to match givenName or commonName"
```

---

## Task 3: Update frontend placeholder

**Files:**
- Modify: `frontend/src/pages/AnimalList.jsx`

- [ ] **Step 3.1: Update the search input placeholder**

In `frontend/src/pages/AnimalList.jsx`, find:

```jsx
placeholder="Search by name..."
```

Replace with:

```jsx
placeholder="Search by name or species..."
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/pages/AnimalList.jsx
git commit -m "feat: update search placeholder to reflect name or species search"
```

---

## Task 4: Push

- [ ] **Step 4.1: Push to remote**

```bash
git push
```
