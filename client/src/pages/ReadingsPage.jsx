import React, { useState, useEffect } from 'react';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import { readingsApi } from '../api/api';

export default function ReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReading, setEditingReading] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch all readings for current user
  async function loadReadings() {
    try {
      setLoading(true);
      const data = await readingsApi.getAll();
      setReadings(data.readings || []);
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load readings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReadings();
  }, []);

  // When form successfully submits (add or edit)
  function handleFormSuccess() {
    setStatusMessage(
      editingReading
        ? 'Reading updated successfully.'
        : 'New reading recorded successfully.'
    );
    setEditingReading(null);
    loadReadings();

    // Auto-clear success message after 4 seconds
    setTimeout(() => {
      setStatusMessage('');
    }, 4000);
  }

  // Switch to editing an existing reading
  function handleEdit(reading) {
    setEditingReading(reading);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Cancel edit mode
  function handleCancelEdit() {
    setEditingReading(null);
  }

  // Delete a reading
  async function handleDelete(id) {
    try {
      await readingsApi.delete(id);
      setStatusMessage('Reading deleted successfully.');
      if (editingReading && editingReading.id === id) {
        setEditingReading(null);
      }
      loadReadings();

      setTimeout(() => {
        setStatusMessage('');
      }, 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete reading.');
    }
  }

  return (
    <div className="readings-page">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
          Blood Glucose Readings
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Record up to 4 readings per day across morning, after breakfast, after lunch, and after dinner.
        </p>
      </div>

      {statusMessage && (
        <div className="alert alert-success">{statusMessage}</div>
      )}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

      {/* Add / Edit Form */}
      <ReadingForm
        editingReading={editingReading}
        onSuccess={handleFormSuccess}
        onCancelEdit={handleCancelEdit}
      />

      {/* Readings Table / List */}
      <ReadingList
        readings={readings}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
