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

  test('list.filter.underVigilance.absent — returns all animals when underVigilance param is absent', async () => {
    const { cookie } = await login('staff');

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Otter A', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), underVigilance: true });

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Otter B', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), underVigilance: false });

    const res = await request(app)
      .get('/api/animals')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
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

    await request(app)
      .post('/api/animals')
      .set('Cookie', cookie)
      .send({ commonName: 'Only Vigilance', animalGroup: 'Mammal', intakeDate: new Date().toISOString(), inClinic: false, underVigilance: true });

    const res = await request(app)
      .get('/api/animals?inClinic=true&underVigilance=true')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].commonName).toBe('Both Flags');
  });
});

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
