const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
} = require('../controllers/reportController');

// All report endpoints require user authentication
router.use(requireAuth);

router.get('/daily', getDailyReport);
router.get('/month-to-date', getMonthToDateReport);
router.get('/monthly', getPreviousMonthReport);

module.exports = router;
