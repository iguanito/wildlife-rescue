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

async function createMedicalRecord(animalId, cookie, overrides = {}) {
  const Animal = require('../models/Animal');
  const MedicalRecord = require('../models/MedicalRecord');
  await Animal.findByIdAndUpdate(animalId, { status: 'in-center' });
  return MedicalRecord.create({
    animal: animalId,
    date: new Date(),
    description: 'Test follow-up',
    followUpDate: new Date(),
    followUpCompleted: false,
    ...overrides,
  });
}

describe('DASH-01: Dashboard shows today\'s animals requiring attention', () => {
  test('dash.today — GET /api/dashboard/today returns animals with in-center status and followUpDate=today', async () => {
    const { cookie } = await login('staff');
    const animalId = await createAnimal(cookie);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    await createMedicalRecord(animalId, cookie, { followUpDate: today, followUpCompleted: false });

    const res = await request(app)
      .get('/api/dashboard/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].animalData._id).toBe(animalId);
  });

  test('dash.today.empty — GET /api/dashboard/today returns empty array when no follow-ups due', async () => {
    const { cookie } = await login('staff');

    const res = await request(app)
      .get('/api/dashboard/today')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('DASH-02: Dashboard shows status counts for all animal statuses', () => {
  test('dash.status.zero — GET /api/dashboard/status returns all 3 statuses even when count is 0', async () => {
    const { cookie } = await login('staff');

    const res = await request(app)
      .get('/api/dashboard/status')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    expect(res.body.every(item => 'status' in item && 'count' in item)).toBe(true);
    const statuses = res.body.map(item => item.status);
    expect(statuses).toContain('in-center');
    expect(statuses).toContain('released');
    expect(statuses).toContain('deceased');
  });

  test('dash.status.accuracy — GET /api/dashboard/status counts match animals in collection', async () => {
    const { cookie } = await login('staff');
    const Animal = require('../models/Animal');
    const id1 = await createAnimal(cookie);
    const id2 = await createAnimal(cookie);
    await Animal.findByIdAndUpdate(id1, { status: 'in-center' });
    await Animal.findByIdAndUpdate(id2, { status: 'in-center' });

    const res = await request(app)
      .get('/api/dashboard/status')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    const inCenterEntry = res.body.find(item => item.status === 'in-center');
    expect(inCenterEntry).toBeDefined();
    expect(inCenterEntry.count).toBe(2);
  });
});

describe('DASH-03: Staff can mark follow-up tasks as done', () => {
  test('dash.mark-done — PATCH /api/medical/:id with staff token sets followUpCompleted true', async () => {
    const { cookie } = await login('staff');
    const animalId = await createAnimal(cookie);
    const record = await createMedicalRecord(animalId, cookie);

    const res = await request(app)
      .patch(`/api/medical/${record._id}`)
      .set('Cookie', cookie)
      .send({ followUpCompleted: true });

    expect(res.status).toBe(200);
    expect(res.body.followUpCompleted).toBe(true);
  });

  test('dash.mark-done.forbidden — PATCH /api/medical/:id with volunteer token returns 403', async () => {
    const { cookie: staffCookie } = await login('staff');
    const animalId = await createAnimal(staffCookie);
    const record = await createMedicalRecord(animalId, staffCookie);

    const { cookie: volCookie } = await login('volunteer');
    const res = await request(app)
      .patch(`/api/medical/${record._id}`)
      .set('Cookie', volCookie)
      .send({ followUpCompleted: true });

    expect(res.status).toBe(403);
  });
});
