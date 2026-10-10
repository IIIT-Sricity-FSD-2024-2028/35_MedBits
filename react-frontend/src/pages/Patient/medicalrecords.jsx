/**
 * medicalrecords.jsx — Patient Medical Records & Clinical History
 * ====================================================================
 * Location: src/pages/Patient/medicalrecords.jsx
 *
 * OVERVIEW:
 *  Displays all clinical history, consultation notes, prescription plans,
 *  treatment regimens, and laboratory summaries for the authenticated patient.
 *
 * BACKEND INTEGRATION:
 *  - GET /medical-records/:patientId
 *    Headers: { role: 'patient', 'x-user-id': patientId }
 *    Returns an array of MedicalRecord objects including:
 *      • consultation: clinical notes, prescribed medications, follow-up dates
 *      • treatment: multi-modal care plans (medicines, tests, lifestyle, diet, duration)
 *      • lab: diagnostic test reports and lab specialist notes
 *
 * WORKFLOW & BUSINESS RULES:
 *  1. Retrieves all records associated with the patient ID.
 *  2. Computes summary metrics (Total Records, Consultations, Treatments).
 *  3. Supports category tab filtering (All, Consultations, Treatments, Lab)
 *     and live search across doctors, diagnoses, and medications.
 *  4. Provides real-time refresh capability.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import './medicalrecords.css';

// Base URL for backend API from Vite environment or default localhost:3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Formats ISO date string into a user-friendly clinical date format (e.g., 'Oct 14, 2026')
 * @param {string} dateStr - Raw date string
 * @returns {string} Formatted clinical date or fallback
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
 * Returns badge styling class according to medical record type
 * @param {string} type - 'consultation' | 'treatment' | 'lab'
 * @returns {string} CSS badge class
 */
function getRecordTypeBadgeClass(type) {
  switch (type) {
    case 'consultation':
      return 'badge-teal';
    case 'treatment':
      return 'badge-orange';
    case 'lab':
      return 'badge-blue';
    default:
      return 'badge-teal';
  }
}

/**
 * Capitalizes and formats record category labels
 * @param {string} type - 'consultation' | 'treatment' | 'lab'
 * @returns {string} Formatted label
 */
function formatRecordTypeLabel(type) {
  if (!type) return 'Record';
  if (type === 'lab') return 'Lab Report';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function MedicalRecords() {
  const { user } = useAuth();
  // Resolve patient identifier from auth user profile
  const patientId = (user?.userId || user?.patientId || user?.id || '').trim();

  // ── 1. COMPONENT STATE ──────────────────────────────────────────────
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Filtering & Search
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'consultation' | 'treatment' | 'lab'
  const [searchQuery, setSearchQuery] = useState('');

  // ── 2. DATA FETCHING EFFECT ─────────────────────────────────────────
  /**
   * Loads patient clinical history directly from GET /medical-records/:patientId
   */
  useEffect(() => {
    let isMounted = true;

    async function fetchPatientRecords() {
      if (!patientId) {
        setIsLoading(false);
        return;
      }

      setErrorMessage(null);

      const headers = {
        role: 'patient',
        'x-user-id': patientId,
      };

      try {
        const response = await fetch(
          `${API_BASE_URL}/medical-records/${encodeURIComponent(patientId)}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error('Failed to load medical records from backend server.');
        }

        const data = await response.json();
        if (isMounted) {
          setMedicalRecords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching medical records:', err);
          setErrorMessage(err.message || 'Unable to retrieve clinical history records.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPatientRecords();

    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // ── 3. MANUAL DATA REFRESH ──────────────────────────────────────────
  /**
   * Refreshes medical records from backend upon patient request
   */
  const handleManualRefresh = async () => {
    if (!patientId) return;

    setIsRefreshing(true);
    setErrorMessage(null);

    const headers = {
      role: 'patient',
      'x-user-id': patientId,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/medical-records/${encodeURIComponent(patientId)}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to refresh medical records.');
      }

      const data = await response.json();
      setMedicalRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error refreshing records:', err);
      setErrorMessage(err.message || 'Unable to refresh clinical records.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── 4. DERIVED METRICS & FILTERING ──────────────────────────────────
  /**
   * Statistical summary counts for the metrics cards
   */
  const stats = useMemo(() => {
    const consultationsCount = medicalRecords.filter((r) => r.type === 'consultation').length;
    const treatmentsCount = medicalRecords.filter((r) => r.type === 'treatment').length;
    const labCount = medicalRecords.filter((r) => r.type === 'lab').length;

    return {
      total: medicalRecords.length,
      consultations: consultationsCount,
      treatments: treatmentsCount,
      labReports: labCount,
    };
  }, [medicalRecords]);

  /**
   * Filtered records according to active tab category and search keyword
   */
  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return medicalRecords.filter((rec) => {
      // 1. Category tab filter
      if (activeCategory !== 'all' && rec.type !== activeCategory) {
        return false;
      }

      // 2. Search query filter
      if (!query) return true;

      const doctorMatch = (rec.doctorName || '').toLowerCase().includes(query);
      const specMatch = (rec.specialization || '').toLowerCase().includes(query);
      const noteMatch = (rec.consultationNote || '').toLowerCase().includes(query);
      const medMatch = (rec.medicines || '').toLowerCase().includes(query);
      const testMatch = (rec.tests || '').toLowerCase().includes(query);
      const idMatch = (rec.id || '').toLowerCase().includes(query);

      return doctorMatch || specMatch || noteMatch || medMatch || testMatch || idMatch;
    });
  }, [medicalRecords, activeCategory, searchQuery]);

  // ── 5. RENDER UI ────────────────────────────────────────────────────
  return (
    <AppShell pageTitle="Medical Records">
      <div className="records-container">

        {/* ── HERO BANNER ────────────────────────────────────────────── */}
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

          <button
            type="button"
            className="btn-refresh-records"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            title="Refresh records from server"
          >
            <span>{isRefreshing ? '🔄' : '⚡'}</span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Records'}</span>
          </button>
        </div>

        {/* Status notification alert */}
        {errorMessage && (
          <div className="records-alert error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── STATS SUMMARY CARDS ────────────────────────────────────── */}
        <div className="records-stats-grid">
          <div className="records-stat-card">
            <div className="records-stat-num">{stats.total}</div>
            <div className="records-stat-label">Total Records</div>
          </div>
          <div className="records-stat-card">
            <div className="records-stat-num">{stats.consultations}</div>
            <div className="records-stat-label">Consultations</div>
          </div>
          <div className="records-stat-card">
            <div className="records-stat-num">{stats.treatments}</div>
            <div className="records-stat-label">Treatment Plans</div>
          </div>
        </div>

        {/* ── SEARCH & FILTER CONTROLS ───────────────────────────────── */}
        <div className="records-controls-card">
          <div className="records-search-wrap">
            <span className="records-search-icon">🔍</span>
            <input
              type="text"
              className="records-search-input"
              placeholder="Search by doctor, specialization, medication, or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="records-tabs" role="tablist" aria-label="Medical record categories">
            <button
              type="button"
              className={`records-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              className={`records-tab-btn ${activeCategory === 'consultation' ? 'active' : ''}`}
              onClick={() => setActiveCategory('consultation')}
            >
              Consultations ({stats.consultations})
            </button>
            <button
              type="button"
              className={`records-tab-btn ${activeCategory === 'treatment' ? 'active' : ''}`}
              onClick={() => setActiveCategory('treatment')}
            >
              Treatments ({stats.treatments})
            </button>
            {stats.labReports > 0 && (
              <button
                type="button"
                className={`records-tab-btn ${activeCategory === 'lab' ? 'active' : ''}`}
                onClick={() => setActiveCategory('lab')}
              >
                Lab Tests ({stats.labReports})
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN RECORDS LIST ──────────────────────────────────────── */}
        <div className="records-main-card">
          <div className="records-section-header">
            <h3 className="records-section-title">
              <span>🩺</span>
              <span>Clinical Record History</span>
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Showing {filteredRecords.length} of {medicalRecords.length} record{medicalRecords.length === 1 ? '' : 's'}
            </span>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '36px 0' }}>
              Loading patient medical records...
            </p>
          ) : filteredRecords.length === 0 ? (
            <div className="records-empty-state">
              <div className="records-empty-icon">📂</div>
              <div className="records-empty-title">No Medical Records Found</div>
              <p className="records-empty-text">
                {searchQuery || activeCategory !== 'all'
                  ? 'No records match your active search filters. Try clearing your search keyword or switching tabs.'
                  : 'You do not have any registered medical records or consultation notes on file yet.'}
              </p>
            </div>
          ) : (
            <div className="records-list">
              {filteredRecords.map((record) => {
                const doctorName = record.doctorName || 'Assigned Physician';
                const specialization = record.specialization || 'General Medicine';
                const doctorInitial = doctorName.replace(/^Dr\.\s*/i, '').charAt(0) || 'D';
                const badgeClass = getRecordTypeBadgeClass(record.type);
                const typeLabel = formatRecordTypeLabel(record.type);

                return (
                  <div key={record.id || `${record.doctorId}-${record.date}`} className="rec-card">

                    {/* Card Header */}
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
                        <span className={`badge ${badgeClass}`}>{typeLabel}</span>
                        <span className="rec-id-tag">ID: {record.id}</span>
                      </div>
                    </div>

                    {/* Card Body - Record Specific Fields */}
                    <div className="rec-body">

                      {/* 1. Consultation Specific Details */}
                      {record.type === 'consultation' && (
                        <>
                          <div className="rec-field-row">
                            <span className="rec-field-label">📝 Consultation Note:</span>
                            <span className="rec-field-value">
                              {record.consultationNote || 'Routine clinical assessment.'}
                            </span>
                          </div>

                          {record.medicines && (
                            <div className="rec-field-row">
                              <span className="rec-field-label">💊 Prescribed Medicines:</span>
                              <span className="rec-field-value highlight">
                                {record.medicines}
                              </span>
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
                        </>
                      )}

                      {/* 2. Treatment Plan Specific Details */}
                      {record.type === 'treatment' && (
                        <>
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
                        </>
                      )}

                      {/* 3. Diagnostic / Lab Specific Details */}
                      {record.type === 'lab' && (
                        <>
                          <div className="rec-field-row">
                            <span className="rec-field-label">🧪 Laboratory Test:</span>
                            <span className="rec-field-value highlight">
                              {record.tests || 'Laboratory Diagnostic Report'}
                            </span>
                          </div>

                          {record.consultationNote && (
                            <div className="rec-field-row">
                              <span className="rec-field-label">🔬 Findings / Notes:</span>
                              <span className="rec-field-value">{record.consultationNote}</span>
                            </div>
                          )}
                        </>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
