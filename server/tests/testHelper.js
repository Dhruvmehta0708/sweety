process.env.NODE_ENV = 'test';
const pool = require('../src/config/db');
const request = require('supertest');
const app = require('../src/app');

// Clean test database before or after test suites
async function cleanDatabase() {
  await pool.query('TRUNCATE TABLE readings, users RESTART IDENTITY CASCADE;');
}

// Helper to register a unique test user and return auth token
async function createTestUser(emailPrefix = 'user') {
  const email = `${emailPrefix}_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
  const password = 'Password@123';
  const name = 'Test User';

  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });

  return {
    user: res.body.user,
    token: res.body.token,
    password,
    email,
  };
}

module.exports = {
  pool,
  cleanDatabase,
  createTestUser,
  app,
};
