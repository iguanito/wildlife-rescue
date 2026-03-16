const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const animalsRouter = require('./routes/animals');
const medicalRouter = require('./routes/medical');
const app = express();

app.use(cors());
app.use(express.json());

// Connect to DB before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/animals', animalsRouter);
app.use('/api/medical', medicalRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Local dev server
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

// Vercel serverless export
module.exports = app;
