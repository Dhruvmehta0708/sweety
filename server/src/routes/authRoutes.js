const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);

// Protected route to verify current token and get user info
router.get('/me', requireAuth, getMe);

module.exports = router;
