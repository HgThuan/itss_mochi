const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/decks', require('./routes/decks'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/extract', require('./routes/extract'));
app.use('/api/test', require('./routes/test'));
app.use('/api/dictionary', require('./routes/dictionary'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dummy endpoints to prevent 404 errors for unimplemented features during demo
app.post('/api/pet/add-exp', (req, res) => {
  res.json({ success: true, message: 'EXP updated (demo bypass)' });
});
app.post('/api/streak/log', (req, res) => {
  res.json({ success: true, message: 'Streak logged (demo bypass)' });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
