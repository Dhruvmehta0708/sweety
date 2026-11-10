const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
} = require('../controllers/readingController');

// All reading endpoints require user authentication
router.use(requireAuth);

router.post('/', createReading);
router.get('/', getReadings);
router.get('/:id', getReadingById);
router.put('/:id', updateReading);
router.delete('/:id', deleteReading);

module.exports = router;
