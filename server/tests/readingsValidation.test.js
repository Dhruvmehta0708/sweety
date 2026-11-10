const request = require('supertest');
const { app, pool, cleanDatabase, createTestUser } = require('./testHelper');

describe('Readings Validation Rules via API', () => {
  let userToken;

  beforeEach(async () => {
    await cleanDatabase();
    const testUser = await createTestUser('validator');
    userToken = testUser.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  // Rule 1: Value missing
  test('Rule 1: rejects when value is missing', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please enter a glucose value.');
  });

  // Rule 2: Value not a whole number between 40 and 600
  test('Rule 2: rejects when value is below 40', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 39,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('Rule 2: rejects when value is above 600', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 601,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('Rule 2: rejects non-whole numbers or strings', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 120.5,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  // Rule 3: Duplicate slot already used that day
  test('Rule 3: rejects duplicate slot on same day with real slot label', async () => {
    // Add "After lunch" reading
    const first = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'after_lunch',
        value: 140,
      });
    expect(first.status).toBe(201);

    // Try to add another "After lunch" reading for the same date
    const second = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'after_lunch',
        value: 155,
      });

    expect(second.status).toBe(400);
    expect(second.body.error).toBe(
      'You already have an After lunch reading for this date.'
    );
  });

  // Rule 4: Already 4 readings that day
  test('Rule 4: rejects 5th reading on the same day (checked before duplicate slot)', async () => {
    const slots = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];

    // Add 4 valid readings for the same day
    for (const slot of slots) {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-10-15',
          slot,
          value: 120,
        });
      expect(res.status).toBe(201);
    }

    // Attempting a 5th reading on that day
    const fifth = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 130,
      });

    expect(fifth.status).toBe(400);
    expect(fifth.body.error).toBe('You can add only 4 readings per day.');
  });

  // Rule 5: Date in the future
  test('Rule 5: rejects date in the future', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2099-01-01',
        slot: 'morning',
        value: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Date cannot be in the future.');
  });

  // Edit reading: excludes itself from checks
  test('Edit reading allows updating value on same date and slot without triggering duplicate error', async () => {
    const create = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 95,
      });

    const readingId = create.body.reading.id;

    const update = await request(app)
      .put(`/api/readings/${readingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: '2026-10-15',
        slot: 'morning',
        value: 105,
      });

    expect(update.status).toBe(200);
    expect(update.body.reading.value).toBe(105);
  });
});
