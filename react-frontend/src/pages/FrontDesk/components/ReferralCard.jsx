/**
 * ReferralCard.jsx — Pending Doctor Internal Referral Card
 * ==============================================================================
 * Displays an incoming internal referral from one doctor to another specialist.
 * Allows front desk personnel to quickly review:
 *  - Patient details (Name, ID)
 *  - Referring doctor and target specialist doctor
 *  - Urgency level (Routine, Urgent, Emergency)
 *  - Clinical reason / findings entered by referring physician (read-only)
 *  - Preferred appointment date
 *  - Action button to launch booking modal
 */

import React from 'react';

/**
 * Format ISO or standard date strings into clean Indian English presentation
 */
function formatDisplayDate(dateValue) {
  if (!dateValue) return 'Flexible / Not specified';
  const d = new Date(dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateValue;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Map urgency values to CSS modifier classes
 */
function getUrgencyClass(urgency = '') {
  const norm = urgency.toLowerCase();
  if (norm === 'emergency') return 'followup-card--emergency';
  if (norm === 'urgent') return 'followup-card--urgent';
  return 'followup-card--routine';
}

/**
 * @param {object} referral - The referral object
 * @param {function} onBook  - Handler callback when "Book Appointment" is clicked
 */
export default function ReferralCard({ referral, onBook }) {
  const urgency = referral.urgency || referral.priority || 'Routine';
  const urgencyClass = getUrgencyClass(urgency);

  const patientName = referral.patientName || referral.patient || referral.patientId || 'Patient';
  const targetDoctor = referral.toDoctorName || referral.doctor || referral.toDoctorId || 'Specialist';
  const fromDoctor = referral.fromDoctorName || referral.fromDoctorId || 'Doctor';
  const specialization = referral.toSpecialization || referral.specialization || '';
  const reason = referral.reason || referral.doctorNote || 'No specific clinical notes provided.';

  return (
    <div className={`followup-card ${urgencyClass}`}>
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="followup-card-header">
        <div className="followup-card-title-group">
          <div className="followup-card-patient-name">
            <span>{patientName}</span>
            {referral.patientId && (
              <span className="followup-card-patient-id">{referral.patientId}</span>
            )}
          </div>
          <div className="followup-card-doctor-line">
            Referral from <strong>{fromDoctor}</strong> ➔ Target: <strong>{targetDoctor}</strong>
            {specialization ? ` (${specialization})` : ''}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="followup-badge followup-badge--referral">
            🔗 Internal Referral
          </span>
          <span className={`followup-badge followup-badge--${urgency.toLowerCase()}`}>
            {urgency}
          </span>
        </div>
      </div>

      {/* ── Doctor's Clinical Reason Box ──────────────────────────────────── */}
      <div className="followup-notes-box followup-notes-box--referral">
        <span className="followup-notes-badge followup-notes-badge--referral">
          Referring Doctor's Notes (Read Only)
        </span>
        <p className="followup-notes-text">{reason}</p>
      </div>

      {/* ── Card Footer with Meta & Book Action ───────────────────────────── */}
      <div className="followup-card-footer">
        <div className="followup-date-meta">
          <span className="followup-date-meta-label">Preferred Consultation Date:</span>
          <span className="followup-date-meta-value">
            📅 {formatDisplayDate(referral.preferredDate || referral.date)}
          </span>
        </div>

        <button
          type="button"
          className="followup-book-btn"
          onClick={() => onBook(referral)}
        >
          <span>📅</span>
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
}
