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

describe('DETAIL-01: Timeline merges intake, care logs, medical records chronologically', () => {
  test('detail.timeline.carelogs — GET /api/animals/:id/carelogs returns logs in date order after multiple creates', async () => {
    const { cookie } = await login('staff');
    const animalRes = await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Test Badger', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });
    const animalId = animalRes.body._id;

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: twoDaysAgo, type: 'feeding', notes: 'Older entry' });

    await request(app)
      .post(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie)
      .send({ date: yesterday, type: 'observation', notes: 'Newer entry' });

    const res = await request(app)
      .get(`/api/animals/${animalId}/carelogs`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(new Date(res.body[0].date) >= new Date(res.body[1].date)).toBe(true);
  });

  test('detail.timeline.medical — GET /api/animals/:id/medical returns medical records', async () => {
    const { cookie: vetCookie } = await login('vet');
    const animalRes = await request(app)
      .post('/api/animals')
      .set('Cookie', vetCookie)
      .send({ commonName: 'Test Otter', animalGroup: 'Mammal', intakeDate: new Date().toISOString() });
    const animalId = animalRes.body._id;

    await request(app)
      .post(`/api/animals/${animalId}/medical`)
      .set('Cookie', vetCookie)
      .send({ description: 'Checkup', date: new Date().toISOString() });

    const res = await request(app)
      .get(`/api/animals/${animalId}/medical`)
      .set('Cookie', vetCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].description).toBe('Checkup');
  });
});

describe('DETAIL-02: Detail page shows all animal fields', () => {
  test('detail.fields — GET /api/animals/:id returns all key intake fields', async () => {
    const { cookie } = await login('staff');
    const createRes = await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({
        commonName: 'Test Hedgehog',
        animalGroup: 'Mammal',
        intakeDate: '2026-03-01',
        status: 'in-center',
        otherDetails: 'Found near road',
      });
    const animalId = createRes.body._id;

    const res = await request(app)
      .get(`/api/animals/${animalId}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.commonName).toBe('Test Hedgehog');
    expect(res.body.animalGroup).toBe('Mammal');
    expect(res.body.status).toBeDefined();
    expect(res.body.intakeDate).toBeDefined();
    expect(res.body.otherDetails).toBe('Found near road');
    expect(res.body._id).toBeDefined();
  });
});
