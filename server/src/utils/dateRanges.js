// Pure date calculation helpers working strictly with "YYYY-MM-DD" strings
// to avoid any timezone shifting bugs.

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Determine if a given year is a leap year
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Return the total number of days in a given month (1-12) of a year
function getDaysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  const thirtyDayMonths = [4, 6, 9, 11];
  return thirtyDayMonths.includes(month) ? 30 : 31;
}

// Splits "YYYY-MM-DD" into numeric [year, month, day]
function parseDateParts(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

// Format parts as zero-padded "YYYY-MM-DD" string
function toDateString(year, month, day) {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Daily range: start and end are the exact same date
function getDailyRange(dateStr) {
  return {
    startDate: dateStr,
    endDate: dateStr,
  };
}

// Month-to-date range: 1st of the selected date's month up to the selected date
function getMonthToDateRange(dateStr) {
  const { year, month } = parseDateParts(dateStr);
  const startDate = toDateString(year, month, 1);
  return {
    startDate,
    endDate: dateStr,
  };
}

// Monthly range: the WHOLE PREVIOUS month relative to selected date
// Handles January -> December of previous year and leap years
function getPreviousMonthRange(dateStr) {
  const { year, month } = parseDateParts(dateStr);

  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const daysInMonth = getDaysInMonth(prevYear, prevMonth);
  const startDate = toDateString(prevYear, prevMonth, 1);
  const endDate = toDateString(prevYear, prevMonth, daysInMonth);

  return {
    startDate,
    endDate,
  };
}

// Formats a "YYYY-MM-DD" string to readable format e.g. "15 Oct 2026"
function formatReadableDate(dateStr) {
  const { year, month, day } = parseDateParts(dateStr);
  const monthName = MONTH_NAMES[month - 1];
  return `${day} ${monthName} ${year}`;
}

// Formats a start and end date into human-readable range, e.g. "1 Oct – 15 Oct 2026"
function formatReadableRange(startDate, endDate) {
  const startParts = parseDateParts(startDate);
  const endParts = parseDateParts(endDate);

  const startMonth = MONTH_NAMES[startParts.month - 1];
  const endMonth = MONTH_NAMES[endParts.month - 1];

  if (startDate === endDate) {
    return `${startParts.day} ${startMonth} ${startParts.year}`;
  }

  if (startParts.year === endParts.year && startParts.month === endParts.month) {
    return `${startParts.day} ${startMonth} – ${endParts.day} ${endMonth} ${endParts.year}`;
  }

  if (startParts.year === endParts.year) {
    return `${startParts.day} ${startMonth} – ${endParts.day} ${endMonth} ${endParts.year}`;
  }

  return `${startParts.day} ${startMonth} ${startParts.year} – ${endParts.day} ${endMonth} ${endParts.year}`;
}

module.exports = {
  isLeapYear,
  getDaysInMonth,
  parseDateParts,
  toDateString,
  getDailyRange,
  getMonthToDateRange,
  getPreviousMonthRange,
  formatReadableDate,
  formatReadableRange,
};
