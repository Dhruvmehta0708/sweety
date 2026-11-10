import React, { useState, useEffect } from 'react';
import { SLOTS } from '../constants/slots';
import { readingsApi } from '../api/api';

// Returns today's date formatted as "YYYY-MM-DD"
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReadingForm({ editingReading, onSuccess, onCancelEdit }) {
  const today = getTodayString();

  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState('morning');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync state whenever editingReading changes (switching to edit mode or reset)
  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.date);
      setSlot(editingReading.slot);
      setValue(String(editingReading.value));
      setError('');
    } else {
      setDate(today);
      setSlot('morning');
      setValue('');
      setError('');
    }
  }, [editingReading]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Pre-flight check on client, but the authoritative validation happens on the server
    if (value === '' || value === null || value === undefined) {
      setError('Please enter a glucose value.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        date,
        slot,
        value: Number(value),
      };

      if (editingReading) {
        // Edit existing reading
        await readingsApi.update(editingReading.id, payload);
      } else {
        // Create new reading
        await readingsApi.create(payload);
      }

      // Reset form if creating, or clear edit mode
      if (!editingReading) {
        setValue('');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Display the exact server error message next to the form
      setError(err.message || 'Failed to save reading.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h3 className="card-title">
        {editingReading ? 'Edit Blood Glucose Reading' : 'Add New Reading'}
      </h3>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Date Input */}
          <div className="form-group">
            <label htmlFor="reading-date">Date</label>
            <input
              id="reading-date"
              type="date"
              required
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Time Slot Dropdown */}
          <div className="form-group">
            <label htmlFor="reading-slot">Time Slot</label>
            <select
              id="reading-slot"
              required
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {SLOTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Glucose Value Input */}
          <div className="form-group">
            <label htmlFor="reading-value">Glucose Level (mg/dl)</label>
            <input
              id="reading-value"
              type="number"
              required
              min="40"
              max="600"
              step="1"
              placeholder="e.g. 115"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting
              ? 'Saving...'
              : editingReading
              ? 'Update Reading'
              : 'Add Reading'}
          </button>

          {editingReading && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancelEdit}
              disabled={submitting}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
