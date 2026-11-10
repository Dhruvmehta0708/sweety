const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  if (!res.headersSent) {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
