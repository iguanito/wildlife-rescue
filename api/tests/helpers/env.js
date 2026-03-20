// Test environment variables — loaded before all test suites
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-jest-only';
process.env.NODE_ENV = 'test';
