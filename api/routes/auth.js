const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');
const authenticateToken = require('../middleware/authenticate');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: { _id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/logout
router.delete('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
