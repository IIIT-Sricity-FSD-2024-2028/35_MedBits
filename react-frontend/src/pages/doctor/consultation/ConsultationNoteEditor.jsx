/**
 * ConsultationNoteEditor.jsx — Clinical Consultation Entry Workspace
 * =========================================================================
 * Location: src/pages/doctor/consultation/ConsultationNoteEditor.jsx
 *
 * FEATURES:
 *  - Clinical Observation & Diagnosis notes input.
 *  - Dynamic multi-item prescription manager (add/remove medications).
 *  - Lab test catalog picker with scheduled date.
 *  - Next follow-up appointment date picker.
 */

import React, { useState } from 'react';
import './consultation.css';

export default function ConsultationNoteEditor({
  patient,
  initialRecord,
  labCatalog = [],
  onCancel,
  onSave,
  isSaving,
}) {
  // Form fields state
  const [notes, setNotes] = useState(initialRecord?.consultationNote || '');
  const [medicines, setMedicines] = useState(
    initialRecord?.medicines ? initialRecord.medicines.split('|').filter(Boolean) : []
  );
  const [newMed, setNewMed] = useState('');
  const [selectedLabTest, setSelectedLabTest] = useState('');
  const [labTests, setLabTests] = useState(
    initialRecord?.tests ? initialRecord.tests.split('|').filter(Boolean) : []
  );
  const [labTestDate, setLabTestDate] = useState(initialRecord?.labTestDate || '');
  const [followUpDate, setFollowUpDate] = useState(initialRecord?.followUpDate || initialRecord?.followUp || '');

  // Prescription adder & remover
  const handleAddMedicine = () => {
    if (newMed.trim()) {
      setMedicines([...medicines, newMed.trim()]);
      setNewMed('');
    }
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // Lab test adder & remover
  const handleAddLabTest = () => {
    if (selectedLabTest && !labTests.includes(selectedLabTest)) {
      setLabTests([...labTests, selectedLabTest]);
      setSelectedLabTest('');
    }
  };

  const handleRemoveLabTest = (testToRemove) => {
    setLabTests(labTests.filter((t) => t !== testToRemove));
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      patientId: patient?.userId || patient?.id,
      patientName: patient?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient',
      consultationNote: notes.trim(),
      medicines: medicines.join('|'),
      tests: labTests.join('|'),
      labTestDate,
      followUpDate,
    });
  };

  const patientName =
    patient?.name || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';
  const avatarInitials = (patientName.slice(0, 2)).toUpperCase();

  return (
    <div>
      {/* Back button */}
      <div className="cn-back-row">
        <button type="button" className="btn-back" onClick={onCancel}>
          ← Back to Appointments
        </button>
      </div>

      {/* Patient Meta Banner */}
      <div className="cn-patient-banner">
        <div className="cn-banner-avatar">{avatarInitials}</div>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>{patientName}</h2>
          <span style={{ fontSize: '13px', opacity: 0.85 }}>
            ID: {patient?.userId || patient?.id || '—'} • Gender: {patient?.gender || '—'} • Age: {patient?.age || '—'}
          </span>
        </div>
      </div>

      {/* Form Card */}
      <div className="cn-section-card">
        <form onSubmit={handleSubmit} className="cn-editor-form">

          {/* 1. Observation & Diagnosis Notes */}
          <div className="cn-form-group">
            <label htmlFor="cn-notes">Consultation Notes & Clinical Diagnosis</label>
            <textarea
              id="cn-notes"
              className="cn-textarea"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record presenting symptoms, vital examination findings, and medical diagnosis..."
              required
            />
          </div>

          {/* 2. Prescription Builder */}
          <div className="cn-form-group">
            <label>Prescriptions</label>
            <div className="cn-tag-adder">
              <input
                type="text"
                className="cn-input"
                placeholder="e.g. Paracetamol 500mg (1-0-1 after food, 5 days)"
                value={newMed}
                onChange={(e) => setNewMed(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMedicine();
                  }
                }}
              />
              <button
                type="button"
                className="btn-back"
                onClick={handleAddMedicine}
                style={{ background: '#f8fafc', whiteSpace: 'nowrap' }}
              >
                + Add Medicine
              </button>
            </div>

            {medicines.length > 0 && (
              <div className="cn-tag-pill-container">
                {medicines.map((med, idx) => (
                  <span key={idx} className="cn-tag-pill">
                    {med}
                    <button
                      type="button"
                      className="cn-remove-tag"
                      onClick={() => handleRemoveMedicine(idx)}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3. Lab Tests Selector */}
          <div className="cn-form-group">
            <label>Recommended Diagnostic Lab Tests</label>
            <div className="cn-tag-adder">
              <select
                className="cn-select"
                value={selectedLabTest}
                onChange={(e) => setSelectedLabTest(e.target.value)}
              >
                <option value="">-- Choose diagnostic test from catalog --</option>
                {labCatalog.map((t) => (
                  <option key={t.id || t.name} value={t.name}>
                    {t.name} {t.category ? `(${t.category})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-back"
                onClick={handleAddLabTest}
                style={{ background: '#f8fafc', whiteSpace: 'nowrap' }}
              >
                + Add Lab Test
              </button>
            </div>

            {labTests.length > 0 && (
              <div className="cn-tag-pill-container">
                {labTests.map((t) => (
                  <span key={t} className="cn-tag-pill lab">
                    {t}
                    <button
                      type="button"
                      className="cn-remove-tag"
                      onClick={() => handleRemoveLabTest(t)}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4. Scheduling dates grid */}
          <div className="cn-two-col-grid">
            <div className="cn-form-group">
              <label htmlFor="cn-lab-date">Scheduled Lab Test Date</label>
              <input
                id="cn-lab-date"
                type="date"
                className="cn-input"
                value={labTestDate}
                onChange={(e) => setLabTestDate(e.target.value)}
              />
            </div>

            <div className="cn-form-group">
              <label htmlFor="cn-followup-date">Recommend Follow-Up Date</label>
              <input
                id="cn-followup-date"
                type="date"
                className="cn-input"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Submit / Cancel actions */}
          <div className="cn-footer-actions">
            <button
              type="button"
              className="btn-back"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create-note"
              disabled={isSaving}
            >
              {isSaving ? 'Saving Note...' : 'Save Consultation Note'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
