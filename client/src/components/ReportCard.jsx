import React from 'react';
import { getSlotLabel } from '../constants/slots';

export default function ReportCard({ title, report, loading, isDaily }) {
  if (loading) {
    return (
      <div className="card report-card">
        <div className="report-header">
          <h3 className="report-title">{title}</h3>
        </div>
        <div className="loading-container" style={{ padding: '30px 0' }}>
          <p>Calculating metrics...</p>
        </div>
      </div>
    );
  }

  const hasData = report && report.count > 0;

  return (
    <div className="card report-card">
      <div className="report-header">
        <h3 className="report-title">{title}</h3>
        {report?.rangeLabel && (
          <div className="report-range">Period: {report.rangeLabel}</div>
        )}
      </div>

      {!hasData ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <p style={{ fontStyle: 'italic', color: '#64748b' }}>
            No readings for this period yet.
          </p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Total Readings</div>
              <div className="stat-val">{report.count}</div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Average</div>
              <div className="stat-val">
                {report.average} <span className="unit">mg/dl</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Highest</div>
              <div className="stat-val" style={{ color: '#dc2626' }}>
                {report.highest} <span className="unit">mg/dl</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Lowest</div>
              <div className="stat-val" style={{ color: '#16a34a' }}>
                {report.lowest} <span className="unit">mg/dl</span>
              </div>
            </div>
          </div>

          {/* Daily Card additional section: readings ordered from morning to dinner */}
          {isDaily && report.readings && report.readings.length > 0 && (
            <div className="daily-readings-list">
              <h4>Daily Slot Breakdown</h4>
              <div>
                {report.readings.map((r) => (
                  <div key={r.id} className="daily-reading-item">
                    <span className="slot-tag">
                      {r.slot_label || getSlotLabel(r.slot)}
                    </span>
                    <strong>{r.value} mg/dl</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
