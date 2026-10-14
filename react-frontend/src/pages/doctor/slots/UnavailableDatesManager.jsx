/**
 * UnavailableDatesManager.jsx — Whole Day Absence & Leave Management
 * =========================================================================
 * Location: src/pages/doctor/slots/UnavailableDatesManager.jsx
 *
 * Allows doctors to register full off-duty dates (conferences, vacations, leaves)
 * so that no appointments can be scheduled by OPD or patients on those dates.
 */

import React, { useState } from 'react';
import './slots.css';

export default function UnavailableDatesManager({
  unavailableDates = [],
  onAddUnavailableDate,
  onRemoveUnavailableDate,
}) {
  const [dateInput, setDateInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!dateInput) return;
    onAddUnavailableDate(dateInput);
    setDateInput('');
  };

  return (
    <div className="slot-card">
      <div className="slot-card-header">
        <h3 className="slot-card-title">Mark Full Days Unavailable (Leave / Conference)</h3>
      </div>

      <form onSubmit={handleAdd} className="unavail-form-row">
        <input
          type="date"
          className="slot-date-input"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          required
        />
        <button type="submit" className="btn-mark-unavail">
          Mark Date Off
        </button>
      </form>

      {unavailableDates.length > 0 ? (
        <div className="unavail-tag-container">
          {unavailableDates.map((item) => (
            <span key={item.id || item.date} className="unavail-tag">
              📅 {item.date}
              <button
                type="button"
                className="unavail-remove-btn"
                onClick={() => onRemoveUnavailableDate(item.date, item.id)}
                title="Remove off-day"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="unavail-empty-note">
          No days marked unavailable. You are on duty on all regular working days.
        </p>
      )}
    </div>
  );
}
