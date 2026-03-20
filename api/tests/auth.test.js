const request = require('supertest');
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

describe('AUTH', () => {
  describe('AUTH-01: Login with valid credentials', () => {
    test('auth.login.valid — POST /api/auth/login with valid email+password returns user object and sets httpOnly cookie', async () => {
      throw new Error('not implemented — implement after Plan 02 creates auth routes');
    });

    test('auth.login.invalid — POST /api/auth/login with wrong password returns 401', async () => {
      throw new Error('not implemented — implement after Plan 02 creates auth routes');
    });
  });

  describe('AUTH-02: Session persistence', () => {
    test('auth.cookie.persist — httpOnly cookie sent on login is accepted by protected route without re-login', async () => {
      throw new Error('not implemented — implement after Plan 02 creates auth routes');
    });
  });

  describe('AUTH-03: Logout', () => {
    test('auth.logout — DELETE /api/auth/logout clears cookie; subsequent GET /api/auth/me returns 401', async () => {
      throw new Error('not implemented — implement after Plan 02 creates auth routes');
    });
  });
});
