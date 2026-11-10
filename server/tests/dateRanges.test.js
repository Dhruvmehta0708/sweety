const {
  isLeapYear,
  getDaysInMonth,
  getDailyRange,
  getMonthToDateRange,
  getPreviousMonthRange,
} = require('../src/utils/dateRanges');

describe('dateRanges utility functions', () => {
  describe('isLeapYear', () => {
    test('identifies leap years correctly', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2026)).toBe(false);
      expect(isLeapYear(1900)).toBe(false); // Century not divisible by 400
    });
  });

  describe('getDaysInMonth', () => {
    test('returns 29 days for February in a leap year', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });

    test('returns 28 days for February in a non-leap year', () => {
      expect(getDaysInMonth(2026, 2)).toBe(28);
      expect(getDaysInMonth(2023, 2)).toBe(28);
    });

    test('returns correct days for 30-day and 31-day months', () => {
      expect(getDaysInMonth(2026, 4)).toBe(30); // Apr
      expect(getDaysInMonth(2026, 9)).toBe(30); // Sep
      expect(getDaysInMonth(2026, 1)).toBe(31); // Jan
      expect(getDaysInMonth(2026, 10)).toBe(31); // Oct
    });
  });

  describe('getDailyRange', () => {
    test('returns same start and end date for daily range', () => {
      const range = getDailyRange('2026-10-15');
      expect(range).toEqual({
        startDate: '2026-10-15',
        endDate: '2026-10-15',
      });
    });
  });

  describe('getMonthToDateRange', () => {
    test('returns 1st of month to selected date', () => {
      const range = getMonthToDateRange('2026-10-15');
      expect(range).toEqual({
        startDate: '2026-10-01',
        endDate: '2026-10-15',
      });
    });

    test('works on the 1st of the month', () => {
      const range = getMonthToDateRange('2026-05-01');
      expect(range).toEqual({
        startDate: '2026-05-01',
        endDate: '2026-05-01',
      });
    });
  });

  describe('getPreviousMonthRange', () => {
    test('returns whole previous month for normal month (e.g. October -> September)', () => {
      const range = getPreviousMonthRange('2026-10-15');
      expect(range).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      });
    });

    test('handles January -> December of previous year', () => {
      const range = getPreviousMonthRange('2026-01-15');
      expect(range).toEqual({
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      });
    });

    test('handles leap-year February (March in leap year 2024)', () => {
      const range = getPreviousMonthRange('2024-03-10');
      expect(range).toEqual({
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      });
    });

    test('handles non-leap-year February (March in non-leap year 2023)', () => {
      const range = getPreviousMonthRange('2023-03-10');
      expect(range).toEqual({
        startDate: '2023-02-01',
        endDate: '2023-02-28',
      });
    });
  });
});
