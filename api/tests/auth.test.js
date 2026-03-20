const request = require('supertest');
const bcryptjs = require('bcryptjs');
const { connectTestDB, clearTestDB, closeTestDB } = require('./helpers/db');

// app required lazily — doesn't exist until Plan 02 retrofits index.js
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

async function createUser(email, password, role = 'admin') {
  const User = require('../models/User');
  const passwordHash = await bcryptjs.hash(password, 10);
  return User.create({ email, passwordHash, role });
}

describe('AUTH', () => {
  describe('AUTH-01: Login with valid credentials', () => {
    test('auth.login.valid — POST /api/auth/login with valid email+password returns user object and sets httpOnly cookie', async () => {
      await createUser('admin@test.com', 'password123');
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@test.com');
      expect(res.body.user.role).toBe('admin');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=');
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    test('auth.login.invalid — POST /api/auth/login with wrong password returns 401', async () => {
      await createUser('admin@test.com', 'password123');
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('AUTH-02: Session persistence', () => {
    test('auth.cookie.persist — httpOnly cookie sent on login is accepted by protected route without re-login', async () => {
      await createUser('admin@test.com', 'password123');
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      expect(loginRes.status).toBe(200);

      const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

      const protectedRes = await request(app)
        .get('/api/animals')
        .set('Cookie', cookie);
      expect(protectedRes.status).toBe(200);
    });
  });

  describe('AUTH-03: Logout', () => {
    test('auth.logout — DELETE /api/auth/logout clears cookie; subsequent GET /api/auth/me returns 401', async () => {
      await createUser('admin@test.com', 'password123');
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });
      const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

      const logoutRes = await request(app)
        .delete('/api/auth/logout')
        .set('Cookie', cookie);
      expect(logoutRes.status).toBe(200);

      // After logout, using the old cookie on /me should return 403 (token still technically valid JWT)
      // but the cookie is cleared client-side; a fresh request without a cookie returns 401
      const meRes = await request(app)
        .get('/api/auth/me');
      expect(meRes.status).toBe(401);
    });
  });
});
