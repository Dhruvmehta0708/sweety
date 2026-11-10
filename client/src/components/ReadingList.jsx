import React from 'react';
import { getSlotLabel } from '../constants/slots';

// Helper to determine styling badge based on glucose reading level
function getValueBadgeClass(val) {
  if (val < 70) return 'value-badge low';
  if (val <= 140) return 'value-badge normal';
  if (val <= 199) return 'value-badge high';
  return 'value-badge very-high';
}

export default function ReadingList({ readings, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="card">
        <div className="loading-container">
          <p>Loading your readings...</p>
        </div>
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4 className="empty-title">No readings recorded yet</h4>
          <p>Use the form above to record your first blood glucose measurement.</p>
        </div>
      </div>
    );
  }

  function handleDeleteClick(reading) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the ${getSlotLabel(reading.slot)} reading for ${reading.date}?`
    );
    if (confirmed) {
      onDelete(reading.id);
    }
  }

  return (
    <div className="card">
      <h3 className="card-title">Recorded Readings ({readings.length})</h3>
      <div className="table-container">
        <table className="readings-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time Slot</th>
              <th>Glucose Value</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.date}</strong></td>
                <td>
                  <span className="slot-tag">
                    {r.slot_label || getSlotLabel(r.slot)}
                  </span>
                </td>
                <td>
                  <span className={getValueBadgeClass(r.value)}>
                    {r.value} mg/dl
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => onEdit(r)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteClick(r)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
