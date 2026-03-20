const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const connectDB = require('../db');
const User = require('../models/User');

async function seedAdmin() {
  await connectDB();

  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    console.log('Admin already exists, skipping seed');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const passwordHash = await bcryptjs.hash(process.env.ADMIN_PASSWORD, 10);
  const admin = await User.create({
    email: process.env.ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
  });

  console.log('Admin created:', admin.email);
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
