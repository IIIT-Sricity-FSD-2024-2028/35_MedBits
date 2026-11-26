/**
 * QueueCheckInCard.jsx — Patient Check-In & Token Generator
 * ==============================================================================
 * WHAT THIS COMPONENT DOES:
 *  1. Lets front desk staff select an eligible registered patient from the system registry.
 *  2. Disables patients who already have an active queue token ('waiting' or 'in-consultation').
 *  3. Lets staff assign the patient to a consultation doctor.
 *  4. Dispatches POST /queue to create an in-person clinic consultation token.
 *  5. Provides clear validation feedback if fields are missing or patient is already queued.
 */

import React, { useState, useMemo } from 'react';

/**
 * @param {Array} patients          - List of registered patient objects
 * @param {Array} doctors           - List of active doctor objects
 * @param {Array} queueItems        - Current queue items to identify active patient tokens
 * @param {function} onGenerate     - Callback (patientId, doctorId, onSuccess) invoked to generate token
 * @param {boolean} isSubmitting    - Whether token creation is in-flight
 */
export default function QueueCheckInCard({
  patients = [],
  doctors = [],
  queueItems = [],
  onGenerate,
  isSubmitting = false,
}) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [validationError, setValidationError] = useState(null);

  const activeTokenByPatientId = useMemo(() => {
    const map = new Map();
    for (const item of queueItems) {
      if (item.status === 'waiting' || item.status === 'in-consultation') {
        if (item.userId && !map.has(item.userId)) {
          map.set(item.userId, item);
        }
      }
    }
    return map;
  }, [queueItems]);

  const uniquePatients = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const pat of patients) {
      const pId = (pat?.userId || pat?.id || '').trim();
      if (!pId || seen.has(pId)) continue;
      seen.add(pId);
      list.push({ ...pat, userId: pId, id: pId });
    }
    return list;
  }, [patients]);

  const selectedActiveToken = selectedPatientId
    ? activeTokenByPatientId.get(selectedPatientId)
    : null;
  const activeSelectionWarning = selectedActiveToken
    ? `This patient already has Active Token #${selectedActiveToken.tokenNumber} (${
        selectedActiveToken.status === 'in-consultation' ? 'In Consultation' : 'Waiting'
      }). Complete the active visit before issuing another token.`
    : null;

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setValidationError('Please select a patient to check in.');
      return;
    }
    if (selectedActiveToken) {
      setValidationError(activeSelectionWarning);
      return;
    }
    if (!selectedDoctorId) {
      setValidationError('Please select the attending doctor for this consultation.');
      return;
    }

    setValidationError(null);
    onGenerate(selectedPatientId, selectedDoctorId, () => {
      setSelectedPatientId('');
    });
  };

  const displayError = validationError || activeSelectionWarning;

  return (
    <div className="queue-checkin-card">
      <div className="queue-checkin-header">
        <h3 className="queue-checkin-title">
          <span>🎫</span>
          <span>Patient Check-In &amp; Token Issuance</span>
        </h3>
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          Issue arrival tokens for live clinic consultations
        </span>
      </div>

      {displayError && (
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
          ⚠️ {displayError}
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
            {uniquePatients.map((pat) => {
              const pId = pat.userId;
              const pName =
                pat.name || `${pat.firstName || ''} ${pat.lastName || ''}`.trim() || pId;
              const phone = pat.phone ? ` · 📞 ${pat.phone}` : '';
              const activeToken = activeTokenByPatientId.get(pId);
              const activeText = activeToken
                ? ` — Active Token #${activeToken.tokenNumber} (${
                    activeToken.status === 'in-consultation' ? 'In Consultation' : 'Waiting'
                  })`
                : '';

              return (
                <option key={pId} value={pId} disabled={Boolean(activeToken)}>
                  {pName} ({pId})
                  {activeToken ? activeText : phone}
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
          disabled={isSubmitting || Boolean(selectedActiveToken)}
        >
          <span>{isSubmitting ? 'Generating…' : '🎟️ Generate Token'}</span>
        </button>
      </form>
    </div>
  );
}
