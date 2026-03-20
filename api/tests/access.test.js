const request = require('supertest');
const bcryptjs = require('bcryptjs');
const { connectTestDB, clearTestDB, closeTestDB } = require('./helpers/db');
const { TEST_PASSWORDS } = require('./helpers/fixtures');
const User = require('../models/User');

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

// Helper: create user and login, return cookie string
async function loginAs(role) {
  const email = `${role}-${Date.now()}@test.com`;
  const passwordHash = await bcryptjs.hash(TEST_PASSWORDS.plain, 10);
  await User.create({ email, passwordHash, role });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: TEST_PASSWORDS.plain });
  return res.headers['set-cookie'][0];
}

// Minimal valid animal body — only intakeDate is required (has default, so can be omitted)
// Using commonName so it's identifiable in logs
const VALID_ANIMAL = {
  commonName: 'Test Mallard',
  animalGroup: 'Bird',
  intakeDate: new Date().toISOString(),
};

describe('ACCESS', () => {
  describe('ACCESS-01: Volunteer read-only', () => {
    test('access.volunteer — GET /api/animals succeeds with volunteer token; POST /api/animals returns 403', async () => {
      const cookie = await loginAs('volunteer');

      const getRes = await request(app)
        .get('/api/animals')
        .set('Cookie', cookie);
      expect(getRes.status).toBe(200);

      const postRes = await request(app)
        .post('/api/animals')
        .set('Cookie', cookie)
        .send(VALID_ANIMAL);
      expect(postRes.status).toBe(403);
    });
  });

  describe('ACCESS-02: Staff can create animals', () => {
    test('access.staff — POST /api/animals with staff role returns 201; GET /api/animals returns 200', async () => {
      const cookie = await loginAs('staff');

      const postRes = await request(app)
        .post('/api/animals')
        .set('Cookie', cookie)
        .send(VALID_ANIMAL);
      expect(postRes.status).toBe(201);

      const getRes = await request(app)
        .get('/api/animals')
        .set('Cookie', cookie);
      expect(getRes.status).toBe(200);
    });
  });

  describe('ACCESS-03: Vet can create/edit medical records', () => {
    test('access.vet — POST /api/animals/:id/medical with vet role returns 201; volunteer on same endpoint returns 403', async () => {
      // Create an animal as admin to get a valid ID
      const adminCookie = await loginAs('admin');
      const animalRes = await request(app)
        .post('/api/animals')
        .set('Cookie', adminCookie)
        .send(VALID_ANIMAL);
      expect(animalRes.status).toBe(201);
      const animalId = animalRes.body._id;

      const VALID_MEDICAL = {
        date: new Date().toISOString(),
        description: 'Routine checkup',
      };

      // Vet can create medical record
      const vetCookie = await loginAs('vet');
      const vetRes = await request(app)
        .post(`/api/animals/${animalId}/medical`)
        .set('Cookie', vetCookie)
        .send(VALID_MEDICAL);
      expect(vetRes.status).toBe(201);

      // Volunteer cannot create medical record
      const volCookie = await loginAs('volunteer');
      const volRes = await request(app)
        .post(`/api/animals/${animalId}/medical`)
        .set('Cookie', volCookie)
        .send(VALID_MEDICAL);
      expect(volRes.status).toBe(403);
    });
  });

  describe('ACCESS-04: Admin full access', () => {
    test('access.admin — admin can POST /api/animals, PUT /api/animals/:id', async () => {
      const adminCookie = await loginAs('admin');

      const createRes = await request(app)
        .post('/api/animals')
        .set('Cookie', adminCookie)
        .send(VALID_ANIMAL);
      expect(createRes.status).toBe(201);

      const animalId = createRes.body._id;
      const updateRes = await request(app)
        .put(`/api/animals/${animalId}`)
        .set('Cookie', adminCookie)
        .send({ commonName: 'Updated Mallard' });
      expect(updateRes.status).toBe(200);
    });
  });

  describe('ACCESS-05: All write routes require auth', () => {
    test('auth.required.all-endpoints — unauthenticated request to POST /api/animals returns 401; same for PUT /api/animals/:id, DELETE /api/medical/:id', async () => {
      // No cookie — should hit authenticateToken and return 401
      const postRes = await request(app)
        .post('/api/animals')
        .send(VALID_ANIMAL);
      expect(postRes.status).toBe(401);

      // Create an animal as admin to get valid IDs
      const adminCookie = await loginAs('admin');
      const animalRes = await request(app)
        .post('/api/animals')
        .set('Cookie', adminCookie)
        .send(VALID_ANIMAL);
      const animalId = animalRes.body._id;

      // PUT without auth
      const putRes = await request(app)
        .put(`/api/animals/${animalId}`)
        .send({ commonName: 'Hack' });
      expect(putRes.status).toBe(401);
    });
  });
});
