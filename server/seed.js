require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');
const { getTodayString } = require('./src/utils/validateReading');
const { getPreviousMonthRange, parseDateParts, toDateString } = require('./src/utils/dateRanges');

async function seed() {
  console.log('--- Starting Sweety Database Seed ---');

  try {
    const demoEmail = 'demo@sweety.com';
    const demoPassword = 'Demo@123';
    const demoName = 'Demo Patient';

    // 1. Check or create demo user
    let userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [demoEmail]
    );

    let userId;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(demoPassword, saltRounds);

    if (userResult.rows.length === 0) {
      console.log(`Creating demo user: ${demoEmail}`);
      const insertUser = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [demoName, demoEmail, passwordHash]
      );
      userId = insertUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
      // Ensure password matches Demo@123
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId]
      );
      console.log(`Demo user exists (ID: ${userId}). Updated password hash.`);
    }

    // 2. Generate realistic readings spread across previous month and current month
    const todayStr = getTodayString();
    const todayParts = parseDateParts(todayStr);

    const prevMonthRange = getPreviousMonthRange(todayStr);
    const prevParts = parseDateParts(prevMonthRange.startDate);
    const prevEndParts = parseDateParts(prevMonthRange.endDate);

    const sampleReadings = [
      // Current Month - Today's readings
      { date: todayStr, slot: 'morning', value: 95 },
      { date: todayStr, slot: 'after_breakfast', value: 142 },
      { date: todayStr, slot: 'after_lunch', value: 128 },

      // Current Month - Earlier days (if today > 1)
      ...(todayParts.day > 1
        ? [
            {
              date: toDateString(todayParts.year, todayParts.month, 1),
              slot: 'morning',
              value: 102,
            },
            {
              date: toDateString(todayParts.year, todayParts.month, 1),
              slot: 'after_dinner',
              value: 138,
            },
          ]
        : []),
      ...(todayParts.day > 5
        ? [
            {
              date: toDateString(todayParts.year, todayParts.month, 3),
              slot: 'morning',
              value: 98,
            },
            {
              date: toDateString(todayParts.year, todayParts.month, 3),
              slot: 'after_lunch',
              value: 135,
            },
          ]
        : []),

      // Previous Month - Rich distribution across whole month
      {
        date: prevMonthRange.startDate, // 1st of previous month
        slot: 'morning',
        value: 105,
      },
      {
        date: prevMonthRange.startDate,
        slot: 'after_breakfast',
        value: 148,
      },
      {
        date: toDateString(prevParts.year, prevParts.month, 7),
        slot: 'morning',
        value: 94,
      },
      {
        date: toDateString(prevParts.year, prevParts.month, 7),
        slot: 'after_dinner',
        value: 130,
      },
      {
        date: toDateString(prevParts.year, prevParts.month, 15),
        slot: 'morning',
        value: 110,
      },
      {
        date: toDateString(prevParts.year, prevParts.month, 15),
        slot: 'after_lunch',
        value: 152,
      },
      {
        date: toDateString(prevParts.year, prevParts.month, 22),
        slot: 'morning',
        value: 88,
      },
      {
        date: toDateString(prevParts.year, prevParts.month, 22),
        slot: 'after_breakfast',
        value: 136,
      },
      {
        date: prevMonthRange.endDate, // Last day of previous month
        slot: 'morning',
        value: 99,
      },
      {
        date: prevMonthRange.endDate,
        slot: 'after_dinner',
        value: 140,
      },
    ];

    console.log(`Seeding ${sampleReadings.length} realistic readings...`);

    // Insert with ON CONFLICT DO UPDATE so seed script is idempotent and safe to run multiple times
    for (const r of sampleReadings) {
      await pool.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, slot)
         DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [userId, r.date, r.slot, r.value]
      );
    }

    console.log('--- Seed completed successfully! ---');
    console.log('Credentials:');
    console.log(`  Email:    ${demoEmail}`);
    console.log(`  Password: ${demoPassword}`);
  } catch (err) {
    console.error('Error during database seed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
