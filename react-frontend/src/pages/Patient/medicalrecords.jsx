/**
 * medicalrecords.jsx — Patient Medical Records & Clinical History
 * ====================================================================
 * Location: src/pages/Patient/medicalrecords.jsx
 *
 * Displays all patient medical records organized into three separate
 * dedicated sections:
 *  1. Consultations
 *  2. Treatment Plans
 *  3. Lab Tests
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import './medicalrecords.css';

// Base URL for backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Formats ISO date string into user-friendly clinical date
 */
function formatClinicalDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Fetches medical records for patient from backend
 */
async function fetchPatientMedicalRecords(patientId) {
  const headers = {
    role: 'patient',
    'x-user-id': patientId,
  };

  const response = await fetch(
    `${API_BASE_URL}/medical-records/${encodeURIComponent(patientId)}`,
    { headers }
  );

  if (!response.ok) {
    throw new Error('Failed to load medical records from backend server.');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Consultation record card component
 */
function ConsultationCard({ record }) {
  const doctorName = record.doctorName || 'Assigned Physician';
  const specialization = record.specialization || 'General Medicine';
  const doctorInitial = doctorName.replace(/^Dr\.\s*/i, '').charAt(0) || 'D';

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-header-left">
          <div className="rec-doc-avatar">{doctorInitial}</div>
          <div className="rec-title-wrap">
            <div className="rec-doctor-name">{doctorName}</div>
            <div className="rec-meta">
              <span>🩺 {specialization}</span>
              <span>•</span>
              <span>📅 {formatClinicalDate(record.date)}</span>
            </div>
          </div>
        </div>
        <div className="rec-header-right">
          <span className="badge badge-teal">Consultation</span>
          {record.id && <span className="rec-id-tag">ID: {record.id}</span>}
        </div>
      </div>

      <div className="rec-body">
        <div className="rec-field-row">
          <span className="rec-field-label">📝 Consultation Note:</span>
          <span className="rec-field-value">
            {record.consultationNote || 'Routine clinical assessment.'}
          </span>
        </div>

        {record.medicines && (
          <div className="rec-field-row">
            <span className="rec-field-label">💊 Prescribed Medicines:</span>
            <span className="rec-field-value highlight">{record.medicines}</span>
          </div>
        )}

        {record.followUp && (
          <div className="rec-field-row">
            <span className="rec-field-label">📅 Recommended Follow-Up:</span>
            <span className="rec-followup-badge">
              🔔 {formatClinicalDate(record.followUp)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Treatment plan record card component
 */
function TreatmentPlanCard({ record }) {
  const doctorName = record.doctorName || 'Assigned Physician';
  const specialization = record.specialization || 'General Medicine';
  const doctorInitial = doctorName.replace(/^Dr\.\s*/i, '').charAt(0) || 'D';

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-header-left">
          <div className="rec-doc-avatar">{doctorInitial}</div>
          <div className="rec-title-wrap">
            <div className="rec-doctor-name">{doctorName}</div>
            <div className="rec-meta">
              <span>🩺 {specialization}</span>
              <span>•</span>
              <span>📅 {formatClinicalDate(record.date)}</span>
            </div>
          </div>
        </div>
        <div className="rec-header-right">
          <span className="badge badge-orange">Treatment Plan</span>
          {record.id && <span className="rec-id-tag">ID: {record.id}</span>}
        </div>
      </div>

      <div className="rec-body">
        {record.medicines && (
          <div className="rec-field-row">
            <span className="rec-field-label">💊 Regimen / Medicines:</span>
            <span className="rec-field-value highlight">{record.medicines}</span>
          </div>
        )}

        {record.tests && (
          <div className="rec-field-row">
            <span className="rec-field-label">🧪 Diagnostic Tests:</span>
            <span className="rec-field-value">{record.tests}</span>
          </div>
        )}

        {record.lifestyle && (
          <div className="rec-field-row">
            <span className="rec-field-label">🏃 Lifestyle Advice:</span>
            <span className="rec-field-value">{record.lifestyle}</span>
          </div>
        )}

        {record.diet && (
          <div className="rec-field-row">
            <span className="rec-field-label">🥗 Dietary Guidelines:</span>
            <span className="rec-field-value">{record.diet}</span>
          </div>
        )}

        {record.duration && (
          <div className="rec-field-row">
            <span className="rec-field-label">⏳ Treatment Duration:</span>
            <span className="rec-field-value">{record.duration}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Lab test record card component
 */
function LabTestCard({ record }) {
  const specialistName = record.doctorName || record.technicianName || 'Lab Specialist';
  const department = record.specialization || 'Clinical Laboratory';
  const avatarInitial = specialistName.replace(/^Dr\.\s*/i, '').charAt(0) || 'L';
  const testTitle = record.tests || record.testName || 'Diagnostic Laboratory Test';
  const observations = record.consultationNote || record.findings || record.notes || 'Lab test conducted and processed.';

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-header-left">
          <div className="rec-doc-avatar">{avatarInitial}</div>
          <div className="rec-title-wrap">
            <div className="rec-doctor-name">{specialistName}</div>
            <div className="rec-meta">
              <span>🔬 {department}</span>
              <span>•</span>
              <span>📅 {formatClinicalDate(record.labTestDate || record.date)}</span>
            </div>
          </div>
        </div>
        <div className="rec-header-right">
          <span className="badge badge-blue">Lab Test</span>
          {record.id && <span className="rec-id-tag">ID: {record.id}</span>}
        </div>
      </div>

      <div className="rec-body">
        <div className="rec-field-row">
          <span className="rec-field-label">🧪 Test Name:</span>
          <span className="rec-field-value highlight">{testTitle}</span>
        </div>

        <div className="rec-field-row">
          <span className="rec-field-label">📋 Findings & Notes:</span>
          <span className="rec-field-value">{observations}</span>
        </div>
      </div>
    </div>
  );
}

export default function MedicalRecords() {
  const { user } = useAuth();
  const patientId = (user?.userId || user?.patientId || user?.id || '').trim();

  // Component state
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(patientId));
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch patient medical records on mount or patientId change
  useEffect(() => {
    if (!patientId) return;

    let isMounted = true;
    fetchPatientMedicalRecords(patientId)
      .then((records) => {
        if (isMounted) {
          setMedicalRecords(records);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching medical records:', err);
          setErrorMessage(err.message || 'Unable to retrieve clinical history records.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // Separate records into distinct sections
  const consultations = medicalRecords.filter((rec) => rec.type === 'consultation');
  const treatments = medicalRecords.filter(
    (rec) => rec.type === 'treatment' || rec.type === 'treatment_plan'
  );
  const labTests = medicalRecords.filter(
    (rec) => rec.type === 'lab' || rec.type === 'lab_report' || rec.type === 'labtest'
  );

  return (
    <AppShell pageTitle="Medical Records">
      <div className="records-container">

        {/* Hero banner */}
        <div className="records-banner">
          <div className="records-banner-left">
            <div className="records-banner-icon">📋</div>
            <div>
              <h2>Medical Records & Clinical History</h2>
              <p>
                Comprehensive overview of your consultations, treatment plans, prescriptions, and diagnostics.
              </p>
            </div>
          </div>
        </div>

        {/* Status error alert */}
        {errorMessage && (
          <div className="records-alert error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stats summary cards */}
        <div className="records-stats-grid">
          <div className="records-stat-card">
            <div className="records-stat-num">{consultations.length}</div>
            <div className="records-stat-label">Consultations</div>
          </div>
          <div className="records-stat-card">
            <div className="records-stat-num">{treatments.length}</div>
            <div className="records-stat-label">Treatment Plans</div>
          </div>
          <div className="records-stat-card">
            <div className="records-stat-num">{labTests.length}</div>
            <div className="records-stat-label">Lab Tests</div>
          </div>
        </div>

        {isLoading ? (
          <div className="records-main-card">
            <p style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
              Loading patient medical records...
            </p>
          </div>
        ) : (
          <>
            {/* ── 1. CONSULTATIONS SECTION ──────────────────────── */}
            <div className="records-main-card">
              <div className="records-section-header">
                <h3 className="records-section-title">
                  <span>🩺</span>
                  <span>Consultation</span>
                </h3>
                <span className="badge badge-teal">
                  {consultations.length} Record{consultations.length === 1 ? '' : 's'}
                </span>
              </div>

              {consultations.length === 0 ? (
                <div className="records-section-empty">
                  No consultation records on file.
                </div>
              ) : (
                <div className="records-list">
                  {consultations.map((rec) => (
                    <ConsultationCard key={rec.id || `consultation-${rec.date}`} record={rec} />
                  ))}
                </div>
              )}
            </div>

            {/* ── 2. TREATMENT PLAN SECTION ─────────────────────── */}
            <div className="records-main-card">
              <div className="records-section-header">
                <h3 className="records-section-title">
                  <span>📋</span>
                  <span>Treatment Plan</span>
                </h3>
                <span className="badge badge-orange">
                  {treatments.length} Plan{treatments.length === 1 ? '' : 's'}
                </span>
              </div>

              {treatments.length === 0 ? (
                <div className="records-section-empty">
                  No treatment plans recorded yet.
                </div>
              ) : (
                <div className="records-list">
                  {treatments.map((rec) => (
                    <TreatmentPlanCard key={rec.id || `treatment-${rec.date}`} record={rec} />
                  ))}
                </div>
              )}
            </div>

            {/* ── 3. LAB TEST SECTION ───────────────────────────── */}
            <div className="records-main-card">
              <div className="records-section-header">
                <h3 className="records-section-title">
                  <span>🧪</span>
                  <span>Lab Test</span>
                </h3>
                <span className="badge badge-blue">
                  {labTests.length} Report{labTests.length === 1 ? '' : 's'}
                </span>
              </div>

              {labTests.length === 0 ? (
                <div className="records-section-empty">
                  No laboratory test reports available.
                </div>
              ) : (
                <div className="records-list">
                  {labTests.map((rec) => (
                    <LabTestCard key={rec.id || `lab-${rec.date}`} record={rec} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
