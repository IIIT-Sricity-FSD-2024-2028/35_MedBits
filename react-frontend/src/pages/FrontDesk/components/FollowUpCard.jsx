/**
 * FollowUpCard.jsx — Consultation Follow-Up Recommendation Card
 * ==============================================================================
 * Displays a recommended patient follow-up originated from a previous consultation.
 * Allows front desk personnel to review:
 *  - Patient details (Name, ID, Phone)
 *  - Consulting doctor and department
 *  - Suggested follow-up date and last consultation date
 *  - Doctor's clinical notes and prescribed lab investigations (read-only)
 *  - Action button to schedule the follow-up appointment
 */

import React from 'react';

/**
 * Format ISO date string into Indian English format (e.g. 24 Oct 2026)
 */
function formatDisplayDate(dateValue) {
  if (!dateValue) return 'Not specified';
  const d = new Date(dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateValue;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * @param {object} item   - The follow-up record object
 * @param {function} onBook - Handler callback when "Book Follow-Up" is clicked
 */
export default function FollowUpCard({ item, onBook }) {
  const patientName = item.patientName || item.patient || item.patientId || 'Patient';
  const doctorName = item.doctorName || item.doctor || 'Doctor';
  const specialization = item.specialization || item.department || '';
  const note = item.consultationNote || item.doctorNote || 'Routine follow-up consultation recommended.';
  const followUpDate = item.followUpDate || item.followUp || item.date;

  return (
    <div className="followup-card followup-card--followup">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="followup-card-header">
        <div className="followup-card-title-group">
          <div className="followup-card-patient-name">
            <span>{patientName}</span>
            {item.patientId && (
              <span className="followup-card-patient-id">{item.patientId}</span>
            )}
            {item.patientPhone && (
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>
                📞 {item.patientPhone}
              </span>
            )}
          </div>
          <div className="followup-card-doctor-line">
            Consulting Physician: <strong>{doctorName}</strong>
            {specialization ? ` (${specialization})` : ''}
            {item.date && (
              <span style={{ color: '#94a3b8' }}> · Last visit: {formatDisplayDate(item.date)}</span>
            )}
          </div>
        </div>

        <span className="followup-badge followup-badge--followup">
          🔄 Follow-Up Required
        </span>
      </div>

      {/* ── Doctor's Consultation Notes Box ──────────────────────────────── */}
      <div className="followup-notes-box">
        <span className="followup-notes-badge followup-notes-badge--info">
          Doctor's Consultation Notes (Read Only)
        </span>
        <p className="followup-notes-text">{note}</p>
        {item.tests && (
          <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#0369a1', fontWeight: 500 }}>
            🧪 Prescribed Investigations: {item.tests}
          </div>
        )}
      </div>

      {/* ── Card Footer with Suggested Date & Action ─────────────────────── */}
      <div className="followup-card-footer">
        <div className="followup-date-meta">
          <span className="followup-date-meta-label">Suggested Follow-Up Date:</span>
          <span className="followup-date-meta-value">
            📅 {formatDisplayDate(followUpDate)}
          </span>
        </div>

        <button
          type="button"
          className="followup-book-btn"
          onClick={() => onBook(item)}
        >
          <span>📅</span>
          <span>Book Follow-Up</span>
        </button>
      </div>
    </div>
  );
}
