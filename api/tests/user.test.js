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
      const User = require('../models/User');

      const validUser = await User.create({ email: 'test@ex.com', passwordHash: 'hash', role: 'volunteer' });
      expect(validUser.role).toBe('volunteer');

      await expect(User.create({ email: 'x@ex.com', passwordHash: 'h', role: 'superuser' })).rejects.toThrow();

      const adminUser = await User.create({ email: 'admin@ex.com', passwordHash: 'hash', role: 'admin' });
      expect(adminUser.role).toBe('admin');

      const staffUser = await User.create({ email: 'staff@ex.com', passwordHash: 'hash', role: 'staff' });
      expect(staffUser.role).toBe('staff');

      const vetUser = await User.create({ email: 'vet@ex.com', passwordHash: 'hash', role: 'vet' });
      expect(vetUser.role).toBe('vet');
    });
  });
});
