const pool = require('../config/db');
const {
  validateReadingPayload,
  validateBusinessRules,
} = require('../utils/validateReading');
const { getSlotLabel } = require('../utils/slots');

// Add a new glucose reading
async function createReading(req, res) {
  try {
    const { date, slot, value } = req.body;
    const userId = req.user.id;

    // 1. Validate payload format and values
    const payloadError = validateReadingPayload({ date, slot, value });
    if (payloadError) {
      return res.status(400).json({ error: payloadError });
    }

    // 2. Validate business rules (4 per day first, then duplicate slot)
    const businessError = await validateBusinessRules(pool, {
      userId,
      date,
      slot,
    });
    if (businessError) {
      return res.status(400).json({ error: businessError });
    }

    // 3. Insert into database
    const result = await pool.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, reading_date AS date, slot, value, created_at, updated_at`,
      [userId, date, slot, Number(value)]
    );

    const created = result.rows[0];
    return res.status(201).json({
      message: 'Reading added successfully.',
      reading: {
        ...created,
        slot_label: getSlotLabel(created.slot),
      },
    });
  } catch (err) {
    // Database constraint safety net
    if (err.code === '23505') {
      return res.status(400).json({
        error: `You already have an ${getSlotLabel(req.body.slot)} reading for this date.`,
      });
    }
    if (err.code === '23514') {
      return res
        .status(400)
        .json({ error: 'Value must be between 40 and 600 mg/dl.' });
    }
    console.error('Create reading error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Get readings for logged-in user with optional date filter and pagination
async function getReadings(req, res) {
  try {
    const userId = req.user.id;
    const { date, page, limit } = req.query;

    const queryParams = [userId];
    let whereClause = 'WHERE user_id = $1';

    if (date) {
      queryParams.push(date);
      whereClause += ` AND reading_date = $${queryParams.length}`;
    }

    const orderClause = `
      ORDER BY reading_date DESC,
      CASE slot
        WHEN 'morning' THEN 1
        WHEN 'after_breakfast' THEN 2
        WHEN 'after_lunch' THEN 3
        WHEN 'after_dinner' THEN 4
        ELSE 5
      END ASC
    `;

    // If pagination params are present
    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 20);
      const offset = (pageNum - 1) * limitNum;

      // Count total matching items
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM readings ${whereClause}`,
        queryParams
      );
      const total = countResult.rows[0].total;

      // Fetch paginated slice
      const paginatedParams = [...queryParams, limitNum, offset];
      const dataResult = await pool.query(
        `SELECT id, reading_date AS date, slot, value, created_at, updated_at
         FROM readings
         ${whereClause}
         ${orderClause}
         LIMIT $${paginatedParams.length - 1} OFFSET $${paginatedParams.length}`,
        paginatedParams
      );

      const readings = dataResult.rows.map((r) => ({
        ...r,
        slot_label: getSlotLabel(r.slot),
      }));

      return res.status(200).json({
        readings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    }

    // Default: fetch all matching readings
    const result = await pool.query(
      `SELECT id, reading_date AS date, slot, value, created_at, updated_at
       FROM readings
       ${whereClause}
       ${orderClause}`,
      queryParams
    );

    const readings = result.rows.map((r) => ({
      ...r,
      slot_label: getSlotLabel(r.slot),
    }));

    return res.status(200).json({ readings });
  } catch (err) {
    console.error('Get readings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Get a single reading by ID
async function getReadingById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, reading_date AS date, slot, value, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const reading = result.rows[0];
    return res.status(200).json({
      reading: {
        ...reading,
        slot_label: getSlotLabel(reading.slot),
      },
    });
  } catch (err) {
    console.error('Get reading by ID error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Update an existing reading
async function updateReading(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, slot, value } = req.body;

    // Check if the reading exists and belongs to the user (return 404 if not)
    const existing = await pool.query(
      'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    // 1. Validate payload format and values
    const payloadError = validateReadingPayload({ date, slot, value });
    if (payloadError) {
      return res.status(400).json({ error: payloadError });
    }

    // 2. Validate business rules, excluding current reading id
    const businessError = await validateBusinessRules(pool, {
      userId,
      date,
      slot,
      excludeReadingId: id,
    });
    if (businessError) {
      return res.status(400).json({ error: businessError });
    }

    // 3. Update the record
    const updateResult = await pool.query(
      `UPDATE readings
       SET reading_date = $1, slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, reading_date AS date, slot, value, created_at, updated_at`,
      [date, slot, Number(value), id, userId]
    );

    const updated = updateResult.rows[0];
    return res.status(200).json({
      message: 'Reading updated successfully.',
      reading: {
        ...updated,
        slot_label: getSlotLabel(updated.slot),
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({
        error: `You already have an ${getSlotLabel(req.body.slot)} reading for this date.`,
      });
    }
    if (err.code === '23514') {
      return res
        .status(400)
        .json({ error: 'Value must be between 40 and 600 mg/dl.' });
    }
    console.error('Update reading error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// Delete a reading
async function deleteReading(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Delete only if it belongs to logged-in user
    const result = await pool.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    return res.status(200).json({ message: 'Reading deleted successfully.' });
  } catch (err) {
    console.error('Delete reading error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
};
