const request = require('supertest');
const { app, pool, cleanDatabase, createTestUser } = require('./testHelper');

describe('Authentication & User Isolation', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('register stores a hashed password (not equal to plain text) and login works', async () => {
    const plainPassword = 'SecretPassword123';
    const email = 'patient@sweety.com';

    // 1. Register user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Sarah Connor',
        email,
        password: plainPassword,
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.token).toBeDefined();
    expect(regRes.body.user.email).toBe(email);

    // 2. Query database directly to verify password is NOT stored as plain text
    const dbUser = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [email]
    );

    expect(dbUser.rows.length).toBe(1);
    const storedHash = dbUser.rows[0].password_hash;
    expect(storedHash).not.toBe(plainPassword);
    expect(storedHash.startsWith('$2')).toBe(true); // bcrypt hash prefix

    // 3. Login with correct password works
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: plainPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.name).toBe('Sarah Connor');

    // 4. Login with wrong password is rejected
    const wrongPassRes = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: 'WrongPassword',
      });

    expect(wrongPassRes.status).toBe(401);
    expect(wrongPassRes.body.error).toBe('Invalid email or password.');
  });

  test('user isolation: a user cannot see, edit, or delete another user readings', async () => {
    // Create User A and User B
    const userA = await createTestUser('user_a');
    const userB = await createTestUser('user_b');

    // User A creates a reading
    const createRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 110,
      });

    expect(createRes.status).toBe(201);
    const readingId = createRes.body.reading.id;

    // User B fetches their readings -> must be empty (User B cannot see User A's reading)
    const listResB = await request(app)
      .get('/api/readings')
      .set('Authorization', `Bearer ${userB.token}`);

    expect(listResB.status).toBe(200);
    expect(listResB.body.readings).toHaveLength(0);

    // User B tries to view User A's reading by ID -> returns 404
    const getResB = await request(app)
      .get(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(getResB.status).toBe(404);

    // User B tries to edit User A's reading -> returns 404
    const editResB = await request(app)
      .put(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 120,
      });

    expect(editResB.status).toBe(404);

    // User B tries to delete User A's reading -> returns 404
    const deleteResB = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(deleteResB.status).toBe(404);

    // User A can still see and delete their own reading
    const deleteResA = await request(app)
      .delete(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(deleteResA.status).toBe(200);
  });
});
