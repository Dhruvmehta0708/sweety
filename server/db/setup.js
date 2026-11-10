const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

// Reads schema.sql and runs all DDL statements to set up tables and indexes
async function setupDatabase(targetPool = pool) {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Applying schema to database...');
    await targetPool.query(sql);
    console.log('Database tables and constraints created successfully.');
  } catch (err) {
    console.error('Failed to set up database:', err.message);
    process.exitCode = 1;
    throw err;
  }
}

// When run directly from CLI (e.g. npm run db:setup)
if (require.main === module) {
  setupDatabase()
    .then(async () => {
      await pool.end();
      console.log('Database setup complete.');
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = setupDatabase;
