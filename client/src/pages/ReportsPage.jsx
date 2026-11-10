import React, { useState, useEffect } from 'react';
import ReportCard from '../components/ReportCard';
import { reportsApi } from '../api/api';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReportsPage() {
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);

  const [dailyReport, setDailyReport] = useState(null);
  const [mtdReport, setMtdReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all 3 reports whenever selectedDate changes
  async function fetchReports(dateToQuery) {
    if (!dateToQuery) return;

    try {
      setLoading(true);
      setError('');

      const [daily, mtd, monthly] = await Promise.all([
        reportsApi.getDaily(dateToQuery),
        reportsApi.getMonthToDate(dateToQuery),
        reportsApi.getMonthly(dateToQuery),
      ]);

      setDailyReport(daily);
      setMtdReport(mtd);
      setMonthlyReport(monthly);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports(selectedDate);
  }, [selectedDate]);

  function handleDateChange(e) {
    setSelectedDate(e.target.value);
  }

  function handleSetToday() {
    setSelectedDate(today);
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
            Glucose Reports & Summaries
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Review key metrics: highest, lowest, average, and reading count across time windows.
          </p>
        </div>

        {/* Date Selector */}
        <div className="date-picker-bar">
          <label htmlFor="report-date-selector">Report Date:</label>
          <input
            id="report-date-selector"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
          />
          {selectedDate !== today && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleSetToday}
            >
              Today
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* 3 Report Cards Grid */}
      <div className="reports-grid">
        <ReportCard
          title="Daily Summary"
          report={dailyReport}
          loading={loading}
          isDaily={true}
        />

        <ReportCard
          title="Month-to-Date"
          report={mtdReport}
          loading={loading}
          isDaily={false}
        />

        <ReportCard
          title="Previous Month"
          report={monthlyReport}
          loading={loading}
          isDaily={false}
        />
      </div>
    </div>
  );
}
