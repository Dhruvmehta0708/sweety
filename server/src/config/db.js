const { Pool, types } = require('pg');
require('dotenv').config();

// PostgreSQL OID 1082 represents the DATE type.
// By default, pg parses DATE into a local JavaScript Date object which can shift
// the day due to time zones. Parsing it as a raw "YYYY-MM-DD" string preserves the exact date.
types.setTypeParser(1082, (val) => val);

// Select database URL based on environment (test vs development/production)
const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
    : process.env.DATABASE_URL;

// Create a connection pool to reuse database connections efficiently
const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database:
        process.env.NODE_ENV === 'test'
          ? process.env.DB_NAME_TEST || 'sweety_test'
          : process.env.DB_NAME || 'sweety',
    });

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

module.exports = pool;
