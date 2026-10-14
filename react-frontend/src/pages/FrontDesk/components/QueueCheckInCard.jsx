/**
 * QueueCheckInCard.jsx — Patient Check-In & Token Generator
 * ==============================================================================
 * WHAT THIS COMPONENT DOES:
 *  1. Lets front desk staff select an arriving patient from the system registry.
 *  2. Lets staff assign the patient to a consultation doctor.
 *  3. Dispatches POST /queue to create an in-person clinic consultation token.
 *  4. Provides clear validation feedback if fields are missing.
 */

import React, { useState } from 'react';

/**
 * @param {Array} patients          - List of registered patient objects
 * @param {Array} doctors           - List of active doctor objects
 * @param {function} onGenerate     - Callback (patientId, doctorId) invoked to generate token
 * @param {boolean} isSubmitting    - Whether token creation is in-flight
 */
export default function QueueCheckInCard({
  patients = [],
  doctors = [],
  onGenerate,
  isSubmitting = false,
}) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [validationError, setValidationError] = useState(null);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setValidationError('Please select a patient to check in.');
      return;
    }
    if (!selectedDoctorId) {
      setValidationError('Please select the attending doctor for this consultation.');
      return;
    }

    setValidationError(null);
    onGenerate(selectedPatientId, selectedDoctorId, () => {
      // Reset selection on success
      setSelectedPatientId('');
    });
  };

  return (
    <div className="queue-checkin-card">
      <div className="queue-checkin-header">
        <h3 className="queue-checkin-title">
          <span>🎫</span>
          <span>Patient Check-In & Token Issuance</span>
        </h3>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Issue arrival tokens for live clinic consultations
        </span>
      </div>

      {validationError && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '13.5px',
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      <form onSubmit={handleGenerate} className="queue-checkin-form-row">
        {/* ── Patient Dropdown ────────────────────────────────────────── */}
        <div className="queue-field">
          <label className="queue-label">Select Patient *</label>
          <select
            className="queue-select"
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setValidationError(null);
            }}
          >
            <option value="">— Choose arriving patient —</option>
            {patients.map((pat) => {
              const pId = pat.userId || pat.id;
              const pName = pat.name || `${pat.firstName || ''} ${pat.lastName || ''}`.trim() || pId;
              const phone = pat.phone ? ` · 📞 ${pat.phone}` : '';
              return (
                <option key={pId} value={pId}>
                  {pName} ({pId}){phone}
                </option>
              );
            })}
          </select>
        </div>

        {/* ── Doctor Dropdown ─────────────────────────────────────────── */}
        <div className="queue-field">
          <label className="queue-label">Assign Attending Doctor *</label>
          <select
            className="queue-select"
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setValidationError(null);
            }}
          >
            <option value="">— Choose consultation doctor —</option>
            {doctors.map((doc) => {
              const docId = doc.id || doc.userId;
              return (
                <option key={docId} value={docId}>
                  {doc.name} — {doc.specialization} ({doc.department || 'General'})
                </option>
              );
            })}
          </select>
        </div>

        {/* ── Generate Action Button ──────────────────────────────────── */}
        <button
          type="submit"
          className="queue-token-btn"
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? 'Generating…' : '🎟️ Generate Token'}</span>
        </button>
      </form>
    </div>
  );
}
