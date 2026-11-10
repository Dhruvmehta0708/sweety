const pool = require('../config/db');
const {
  getDailyRange,
  getMonthToDateRange,
  getPreviousMonthRange,
  formatReadableRange,
} = require('../utils/dateRanges');
const { getTodayString, isValidDateFormat } = require('../utils/validateReading');
const { getSlotLabel } = require('../utils/slots');

// Helper to query statistics (highest, lowest, average, count) for a date range
async function queryRangeStats(userId, startDate, endDate) {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS count,
       MAX(value)::int AS highest,
       MIN(value)::int AS lowest,
       ROUND(AVG(value)::numeric, 1)::float AS average
     FROM readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
    [userId, startDate, endDate]
  );

  const stats = result.rows[0];

  return {
    startDate,
    endDate,
    rangeLabel: formatReadableRange(startDate, endDate),
    count: stats.count || 0,
    highest: stats.count > 0 ? stats.highest : null,
    lowest: stats.count > 0 ? stats.lowest : null,
    average: stats.count > 0 ? stats.average : null,
  };
}

// GET /api/reports/daily?date=YYYY-MM-DD
async function getDailyReport(req, res) {
  try {
    const userId = req.user.id;
    const date = req.query.date || getTodayString();

    if (!isValidDateFormat(date)) {
      return res
        .status(400)
        .json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
    }

    const { startDate, endDate } = getDailyRange(date);
    const stats = await queryRangeStats(userId, startDate, endDate);

    // Also fetch the list of readings for that day ordered morning to dinner
    const readingsResult = await pool.query(
      `SELECT id, reading_date AS date, slot, value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY
         CASE slot
           WHEN 'morning' THEN 1
           WHEN 'after_breakfast' THEN 2
           WHEN 'after_lunch' THEN 3
           WHEN 'after_dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, date]
    );

    const readings = readingsResult.rows.map((r) => ({
      ...r,
      slot_label: getSlotLabel(r.slot),
    }));

    return res.status(200).json({
      ...stats,
      readings,
    });
  } catch (err) {
    console.error('Daily report error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /api/reports/month-to-date?date=YYYY-MM-DD
async function getMonthToDateReport(req, res) {
  try {
    const userId = req.user.id;
    const date = req.query.date || getTodayString();

    if (!isValidDateFormat(date)) {
      return res
        .status(400)
        .json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
    }

    const { startDate, endDate } = getMonthToDateRange(date);
    const stats = await queryRangeStats(userId, startDate, endDate);

    return res.status(200).json(stats);
  } catch (err) {
    console.error('Month-to-date report error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// GET /api/reports/monthly?date=YYYY-MM-DD
// Reports on the whole previous month relative to the selected date
async function getPreviousMonthReport(req, res) {
  try {
    const userId = req.user.id;
    const date = req.query.date || getTodayString();

    if (!isValidDateFormat(date)) {
      return res
        .status(400)
        .json({ error: 'Please provide a valid date in YYYY-MM-DD format.' });
    }

    const { startDate, endDate } = getPreviousMonthRange(date);
    const stats = await queryRangeStats(userId, startDate, endDate);

    return res.status(200).json(stats);
  } catch (err) {
    console.error('Previous month report error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
};
