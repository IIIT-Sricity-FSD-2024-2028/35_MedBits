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
  labReports = [],
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

  // Only show returned lab reports if specifically editing an existing medical record
  // that already has a completed lab report specifically linked to it.
  // When writing a note for a patient, previous lab reports must NOT be shown.
  const isEditing = Boolean(initialRecord?.id);
  const relevantReports = isEditing
    ? [
        ...(initialRecord?.labReport ? [initialRecord.labReport] : []),
        ...(labReports || []).filter((r) => {
          if (
            initialRecord?.labReport &&
            (r.id === initialRecord.labReport.id || r.labRequestId === initialRecord.labReport.labRequestId)
          ) {
            return false;
          }
          return r.medicalRecordId && r.medicalRecordId === initialRecord.id;
        }),
      ]
    : [];

  if (isEditing && relevantReports.length === 0 && (initialRecord?.labResult || initialRecord?.labFindings)) {
    relevantReports.push({
      testName: initialRecord.tests || 'Diagnostic Lab Test',
      result: initialRecord.labResult,
      findings: initialRecord.labFindings,
      remarks: initialRecord.labRemarks,
      status: initialRecord.labReportStatus || 'submitted',
    });
  }

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
      id: initialRecord?.id,
      appointmentId: initialRecord?.appointmentId || patient?.appointmentId,
      patientId: patient?.userId || patient?.id || initialRecord?.patientId || 'PAT001',
      patientName: patient?.name || (patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : null) || initialRecord?.patientName || 'Patient',
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

      {/* Returned Diagnostic Lab Report from Technician */}
      {relevantReports.length > 0 && (
        <div className="cn-section-card" style={{ borderLeft: '4px solid #10b981', marginBottom: '20px' }}>
          <div className="cn-section-header" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🧪</span>
              <h3 className="cn-section-title" style={{ margin: 0, color: '#065f46' }}>
                Diagnostic Lab Test Report (Returned by Lab Technician)
              </h3>
            </div>
            <span
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              ✓ Report Received
            </span>
          </div>

          {relevantReports.map((rep, idx) => (
            <div
              key={rep.id || idx}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: idx < relevantReports.length - 1 ? '12px' : 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1e293b' }}>
                    {rep.testName || rep.testType || 'Diagnostic Lab Test'}
                  </h4>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Lab Technician: <strong>{rep.technicianName || 'Certified Technician'}</strong> •{' '}
                    Completed: {rep.submittedAt ? rep.submittedAt.split('T')[0] : (rep.completedDate || rep.date || 'Recently')}
                  </div>
                </div>

                {rep.result && (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      textAlign: 'right',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#065f46', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                      Measured Result
                    </span>
                    <strong style={{ fontSize: '14px', color: '#047857' }}>{rep.result}</strong>
                  </div>
                )}
              </div>

              {rep.findings && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                    Clinical Findings & Observations:
                  </span>
                  <div style={{ fontSize: '13.5px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                    {rep.findings}
                  </div>
                </div>
              )}

              {rep.remarks && (
                <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#64748b' }}>
                  <strong>Technician Remarks:</strong> {rep.remarks}
                </div>
              )}

              {rep.fileAttachment?.fileData && (
                <div style={{ marginTop: '10px' }}>
                  <a
                    href={rep.fileAttachment.fileData}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    📎 Download Attached Report File ({rep.fileAttachment.fileName || 'Report'})
                  </a>
                </div>
              )}

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-back"
                  style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0', fontSize: '12px', padding: '4px 10px' }}
                  onClick={() => {
                    const textToAppend = `[Lab Findings - ${rep.testName || 'Test'}]: Result: ${rep.result || 'Completed'}. Findings: ${rep.findings || 'Within normal parameters.'}`;
                    setNotes((prev) => (prev ? `${prev}\n\n${textToAppend}` : textToAppend));
                  }}
                >
                  📋 Append Findings to Consultation Note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
