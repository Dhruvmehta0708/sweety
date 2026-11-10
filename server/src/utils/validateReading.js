const { isValidSlot, getSlotLabel } = require('./slots');

// Returns today's date formatted as "YYYY-MM-DD" based on local server time
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Checks if a string is a valid calendar date in YYYY-MM-DD format
function isValidDateFormat(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12) return false;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

// Validates the shape and values of the input payload
function validateReadingPayload({ date, slot, value }) {
  // 1. Value presence check
  if (value === undefined || value === null || value === '') {
    return 'Please enter a glucose value.';
  }

  // 2. Value must be a whole number between 40 and 600
  const numValue = Number(value);
  const isWholeNumber =
    typeof value !== 'boolean' &&
    Number.isInteger(numValue) &&
    String(value).trim() !== '';

  if (!isWholeNumber || numValue < 40 || numValue > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }

  // 3. Date format check
  if (!date || !isValidDateFormat(date)) {
    return 'Please provide a valid date in YYYY-MM-DD format.';
  }

  // 4. Future date check
  const today = getTodayString();
  if (date > today) {
    return 'Date cannot be in the future.';
  }

  // 5. Time slot check
  if (!slot || !isValidSlot(slot)) {
    return 'Please select a valid time slot.';
  }

  return null;
}

// Validates business rules against the database:
// - Max 4 readings per day (checked first)
// - Duplicate slot on the same day (checked second)
// Excludes the reading being edited if excludeReadingId is provided
async function validateBusinessRules(pool, { userId, date, slot, excludeReadingId = null }) {
  // Rule A: Max 4 readings per day
  let countQuery = `
    SELECT COUNT(*)::int AS total
    FROM readings
    WHERE user_id = $1 AND reading_date = $2
  `;
  const countParams = [userId, date];

  if (excludeReadingId) {
    countQuery += ' AND id != $3';
    countParams.push(excludeReadingId);
  }

  const countResult = await pool.query(countQuery, countParams);
  if (countResult.rows[0].total >= 4) {
    return 'You can add only 4 readings per day.';
  }

  // Rule B: Duplicate slot on the same day
  let duplicateQuery = `
    SELECT id
    FROM readings
    WHERE user_id = $1 AND reading_date = $2 AND slot = $3
  `;
  const dupParams = [userId, date, slot];

  if (excludeReadingId) {
    duplicateQuery += ' AND id != $4';
    dupParams.push(excludeReadingId);
  }

  const dupResult = await pool.query(duplicateQuery, dupParams);
  if (dupResult.rows.length > 0) {
    const label = getSlotLabel(slot);
    return `You already have an ${label} reading for this date.`;
  }

  return null;
}

module.exports = {
  getTodayString,
  isValidDateFormat,
  validateReadingPayload,
  validateBusinessRules,
};
