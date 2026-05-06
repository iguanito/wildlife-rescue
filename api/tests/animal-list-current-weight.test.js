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
