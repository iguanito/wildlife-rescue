// Test environment variables — loaded before all test suites
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-jest-only';
process.env.NODE_ENV = 'test';
// Point to test database so connectDB() in Express middleware doesn't override test connection
process.env.MONGODB_URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI.replace(/\/[^/]+(\?|$)/, '/wildlife_rescue_test$1')
  : 'mongodb://localhost:27017/wildlife_rescue_test';
