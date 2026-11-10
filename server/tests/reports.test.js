const request = require('supertest');
const { app, pool, cleanDatabase, createTestUser } = require('./testHelper');

describe('Reports API (Daily, Month-to-date, Previous Month)', () => {
  let userToken;

  beforeEach(async () => {
    await cleanDatabase();
    const testUser = await createTestUser('report_user');
    userToken = testUser.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  test('empty case: returns count 0 and null for highest, lowest, average', async () => {
    const res = await request(app)
      .get('/api/reports/daily?date=2026-10-15')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.highest).toBeNull();
    expect(res.body.lowest).toBeNull();
    expect(res.body.average).toBeNull();
    expect(res.body.readings).toEqual([]);
    expect(res.body.startDate).toBe('2026-10-15');
    expect(res.body.endDate).toBe('2026-10-15');
  });

  test('daily report: computes correct numbers and returns ordered readings', async () => {
    // Insert 3 readings out of order
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-10-15', slot: 'after_dinner', value: 135 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-10-15', slot: 'morning', value: 92 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-10-15', slot: 'after_lunch', value: 140 });

    const res = await request(app)
      .get('/api/reports/daily?date=2026-10-15')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.highest).toBe(140);
    expect(res.body.lowest).toBe(92);
    // (92 + 140 + 135) / 3 = 367 / 3 = 122.333... -> rounded to 122.3
    expect(res.body.average).toBe(122.3);

    // Readings must be ordered morning -> after_lunch -> after_dinner
    expect(res.body.readings).toHaveLength(3);
    expect(res.body.readings[0].slot).toBe('morning');
    expect(res.body.readings[1].slot).toBe('after_lunch');
    expect(res.body.readings[2].slot).toBe('after_dinner');
  });

  test('month-to-date report: includes readings from 1st of month to selected date', async () => {
    // Add readings inside month-to-date window
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-10-01', slot: 'morning', value: 100 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-10-15', slot: 'morning', value: 110 });

    // Add reading later in month (outside Oct 1 - Oct 15 window)
    // Note: since this is in the past relative to today (Nov 2026), 2026-10-20 is valid
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-10-20', slot: 'morning', value: 200 });

    const res = await request(app)
      .get('/api/reports/month-to-date?date=2026-10-15')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.startDate).toBe('2026-10-01');
    expect(res.body.endDate).toBe('2026-10-15');
    expect(res.body.count).toBe(2);
    expect(res.body.highest).toBe(110);
    expect(res.body.lowest).toBe(100);
    expect(res.body.average).toBe(105);
  });

  test('monthly report: computes stats for entire previous month', async () => {
    // Add readings in September 2026
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-09-01', slot: 'morning', value: 90 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ date: '2026-09-30', slot: 'after_dinner', value: 130 });

    // When query date is 2026-10-15, previous month is 2026-09-01 to 2026-09-30
    const res = await request(app)
      .get('/api/reports/monthly?date=2026-10-15')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.startDate).toBe('2026-09-01');
    expect(res.body.endDate).toBe('2026-09-30');
    expect(res.body.count).toBe(2);
    expect(res.body.highest).toBe(130);
    expect(res.body.lowest).toBe(90);
    expect(res.body.average).toBe(110);
  });
});
