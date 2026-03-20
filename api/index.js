const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./db');

const authenticateToken = require('./middleware/authenticate');
const authRouter = require('./routes/auth');
const animalsRouter = require('./routes/animals');
const medicalRouter = require('./routes/medical');
const speciesRouter = require('./routes/species');

const app = express();

app.use(cors({ credentials: true, origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(cookieParser());

// Connect to DB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Public routes (no auth required)
app.use('/api/auth', authRouter);

// Auth wall — all routes below require valid JWT cookie
app.use(authenticateToken);

// Protected routes
app.use('/api/animals', animalsRouter);
app.use('/api/medical', medicalRouter);
app.use('/api/species', speciesRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', user: req.user }));

// Local dev server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

// Vercel serverless export
module.exports = app;
