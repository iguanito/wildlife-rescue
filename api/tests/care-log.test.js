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

async function createAnimal(cookie) {
  const res = await request(app)
    .post('/api/animals')
    .set('Cookie', cookie)
    .send({ commonName: 'Test Fox', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });
  return res.body._id;
}

describe('CARE-01: Staff can add care log entry', () => {
  test('care.create — POST /api/animals/:id/carelogs with staff token creates care log and returns 201', async () => {
    const { cookie } = await login('staff');
    const animalId = await createAnimal(cookie);

    const res = await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: new Date().toISOString(), type: 'feeding', notes: 'Fed well' });

    expect(res.status).toBe(201);
    expect(res.body.type).toBe('feeding');
    expect(res.body.notes).toBe('Fed well');
  });

  test('care.create.forbidden — POST /api/animals/:id/carelogs with volunteer token returns 403', async () => {
    const { cookie: staffCookie } = await login('staff');
    const animalId = await createAnimal(staffCookie);

    const { cookie: volCookie } = await login('volunteer');
    const res = await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', volCookie)
      .send({ date: new Date().toISOString(), type: 'feeding', notes: 'Fed well' });

    expect(res.status).toBe(403);
  });
});

describe('CARE-02: Care log includes createdBy attribution', () => {
  test('care.attribution — POST /api/animals/:id/carelogs sets createdBy to logged-in user', async () => {
    const { cookie, user: staffUser } = await login('staff');
    const animalId = await createAnimal(cookie);

    const res = await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: new Date().toISOString(), type: 'observation', notes: 'Looking alert' });

    expect(res.status).toBe(201);
    expect(res.body.createdBy).toBeDefined();
    expect(res.body.createdBy.email).toBe(staffUser.email);
    expect(res.body.createdBy.role).toBe('staff');
    expect(res.body.date).toBeDefined();
    expect(res.body.submittedAt).toBeDefined();
  });
});

describe('CARE-03: Staff can view all care logs for animal', () => {
  test('care.query — GET /api/animals/:id/carelogs returns array of care logs sorted by date desc', async () => {
    const { cookie } = await login('staff');
    const animalId = await createAnimal(cookie);

    const olderDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const newerDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: olderDate, type: 'feeding', notes: 'First feed' });

    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: newerDate, type: 'weight', notes: 'Weight check' });

    const res = await request(app)
      .get(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(new Date(res.body[0].date) >= new Date(res.body[1].date)).toBe(true);
  });
});
