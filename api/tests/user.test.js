const { connectTestDB, clearTestDB, closeTestDB } = require('./helpers/db');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('User model', () => {
  describe('AUTH-04: Role enum', () => {
    test('user.role.enum — User model accepts admin, staff, vet, volunteer; rejects other values', async () => {
      throw new Error('not implemented — implement after Plan 02 creates User model');
    });
  });
});
