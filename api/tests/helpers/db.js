const mongoose = require('mongoose');

const TEST_DB_URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI.replace(/\/[^/]+(\?|$)/, '/wildlife_rescue_test$1')
  : 'mongodb://localhost:27017/wildlife_rescue_test';

async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
}

async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

async function closeTestDB() {
  await mongoose.connection.close();
}

module.exports = { connectTestDB, clearTestDB, closeTestDB };
