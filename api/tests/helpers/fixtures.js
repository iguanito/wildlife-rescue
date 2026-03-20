// User model required lazily (inside functions) because User.js doesn't exist until Plan 02.
const bcryptjs = require('bcryptjs');

const TEST_PASSWORDS = {
  plain: 'TestPassword123!',
};

async function getPasswordHash() {
  return bcryptjs.hash(TEST_PASSWORDS.plain, 10);
}

async function createTestUser(role) {
  const User = require('../../models/User');
  const passwordHash = await getPasswordHash();
  return User.create({
    email: `test-${role}-${Date.now()}@example.com`,
    passwordHash,
    role,
  });
}

const TEST_USERS = {
  admin:     { email: 'admin@test.com',     role: 'admin' },
  staff:     { email: 'staff@test.com',     role: 'staff' },
  vet:       { email: 'vet@test.com',       role: 'vet' },
  volunteer: { email: 'volunteer@test.com', role: 'volunteer' },
};

module.exports = { createTestUser, TEST_USERS, TEST_PASSWORDS };
