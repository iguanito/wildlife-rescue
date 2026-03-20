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

describe('ACCESS', () => {
  describe('ACCESS-01: Volunteer read-only', () => {
    test('access.volunteer — GET /api/animals succeeds with volunteer token; POST /api/animals returns 403', async () => {
      throw new Error('not implemented — implement after Plan 02+03 create auth and role middleware');
    });
  });

  describe('ACCESS-02: Staff can create animals', () => {
    test('access.staff — POST /api/animals with staff role returns 201; GET /api/animals returns 200', async () => {
      throw new Error('not implemented — implement after Plan 02+03');
    });
  });

  describe('ACCESS-03: Vet can create/edit medical records', () => {
    test('access.vet — POST /api/animals/:id/medical with vet role returns 201; volunteer on same endpoint returns 403', async () => {
      throw new Error('not implemented — implement after Plan 02+03');
    });
  });

  describe('ACCESS-04: Admin full access', () => {
    test('access.admin — admin can POST /api/animals, PUT /api/animals/:id, DELETE /api/medical/:id', async () => {
      throw new Error('not implemented — implement after Plan 02+03');
    });
  });

  describe('ACCESS-05: All write routes require auth', () => {
    test('auth.required.all-endpoints — unauthenticated request to POST /api/animals returns 401; same for PUT /api/animals/:id, DELETE /api/medical/:id', async () => {
      throw new Error('not implemented — implement after Plan 02+03');
    });
  });
});
