/**
 * medicalrecords.jsx — Patient Medical Records & Clinical History
 * ====================================================================
 * Location: src/pages/Patient/medicalrecords.jsx
 *
 * Powered by Redux Toolkit (`patientMedicalRecordsSlice` + `authSlice`).
 * Displays all patient medical records organized into four distinct sections:
 *  1. Consultations
 *  2. Treatment Plans
 *  3. Recommended & Active Lab Tests
 *  4. Completed Lab Reports
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchPatientMedicalRecords,
  clearMedicalRecordsError,
  selectPatientMedicalRecords,
  selectPatientMedicalRecordsStatus,
  selectPatientMedicalRecordsError,
} from '../../store/slices/patient/patientMedicalRecordsSlice';
import './medicalrecords.css';

const LAB_REQUEST_STATUS_BADGES = {
  pending: { label: 'Pending Lab Processing', cls: 'badge-amber' },
  in_progress: { label: 'In Progress', cls: 'badge-blue' },
  accepted: { label: 'In Progress', cls: 'badge-blue' },
  draft_report: { label: 'Report In Preparation', cls: 'badge-blue' },
  rejected: { label: 'Declined', cls: 'badge-red' },
  completed: { label: 'Completed', cls: 'badge-green' },
};

function parseRecordTimestamp(value) {
  if (!value) return NaN;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    return Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const ts = Date.parse(trimmed);
  return Number.isFinite(ts) ? ts : NaN;
}

/**
 * Formats ISO date string or YYYY-MM-DD into user-friendly clinical date
 */
function formatClinicalDate(dateStr) {
  if (!dateStr) return '—';
  const trimmed = typeof dateStr === 'string' ? dateStr.trim() : '';
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function getRecordCategory(rec) {
  if (!rec) return 'other';
  if (rec.type === 'consultation') return 'consultation';
  if (rec.type === 'treatment' || rec.type === 'treatment_plan') return 'treatment';
  if (rec.type === 'lab' || rec.type === 'lab_report' || rec.type === 'labtest') {
    if (
      rec.hasReport ||
      rec.reportStatus === 'submitted' ||
      rec.labReport ||
      rec.status === 'completed'
    ) {
      return 'lab_report';
    }
    if (rec.tests || rec.testName || rec.labRequestId) {
      return 'lab_request';
    }
  }
  return 'other';
}

function sortByDateDesc(list, getDateFn) {
  return [...list].sort((a, b) => {
    const tA = parseRecordTimestamp(getDateFn(a));
    const tB = parseRecordTimestamp(getDateFn(b));
    if (Number.isFinite(tA) && Number.isFinite(tB)) {
      if (tB !== tA) return tB - tA;
    } else if (Number.isFinite(tA) !== Number.isFinite(tB)) {
      return Number.isFinite(tA) ? -1 : 1;
    }
    return 0;
  });
}

/**
 * Consultation record card component
 */
function ConsultationCard({ record, onOpen }) {
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

        {record.tests && (
          <div className="rec-field-row">
            <span className="rec-field-label">🧪 Recommended Labs:</span>
            <span className="rec-field-value">{record.tests}</span>
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

      <div className="rec-actions-row">
        <button type="button" className="rec-detail-btn" onClick={() => onOpen(record)}>
          View Details
        </button>
      </div>
    </div>
  );
}

/**
 * Treatment plan record card component
 */
function TreatmentPlanCard({ record, onOpen }) {
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

      <div className="rec-actions-row">
        <button type="button" className="rec-detail-btn" onClick={() => onOpen(record)}>
          View Details
        </button>
      </div>
    </div>
  );
}

/**
 * Lab recommendation / active diagnostic request card component
 */
function LabRecommendationCard({ record, onOpen }) {
  const doctorName = record.doctorName || 'Assigned Physician';
  const avatarInitial = doctorName.replace(/^Dr\.\s*/i, '').charAt(0) || 'L';
  const testTitle = record.testName || record.tests || 'Diagnostic Laboratory Test';
  const statusInfo =
    LAB_REQUEST_STATUS_BADGES[record.status] || {
      label: record.status || 'Recommended',
      cls: 'badge-blue',
    };
  const scheduledDate = record.labTestDate || record.recommendationDate || record.requestDate;

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-header-left">
          <div className="rec-doc-avatar">{avatarInitial}</div>
          <div className="rec-title-wrap">
            <div className="rec-doctor-name">{testTitle}</div>
            <div className="rec-meta">
              <span>👨‍⚕️ {doctorName}</span>
              <span>•</span>
              <span>📅 Scheduled: {formatClinicalDate(scheduledDate)}</span>
            </div>
          </div>
        </div>
        <div className="rec-header-right">
          <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
          {(record.labRequestId || record.id) && (
            <span className="rec-id-tag">Req: {record.labRequestId || record.id}</span>
          )}
        </div>
      </div>

      <div className="rec-body">
        <div className="rec-field-row">
          <span className="rec-field-label">📅 Request Date:</span>
          <span className="rec-field-value">
            {formatClinicalDate(record.requestDate || record.recommendationDate)}
          </span>
        </div>

        <div className="rec-field-row">
          <span className="rec-field-label">🗓️ Scheduled Date:</span>
          <span className="rec-field-value">{formatClinicalDate(scheduledDate)}</span>
        </div>

        {record.consultationNote && (
          <div className="rec-field-row">
            <span className="rec-field-label">📝 Clinical Notes:</span>
            <span className="rec-field-value">{record.consultationNote}</span>
          </div>
        )}

        {record.rejectionReason && (
          <div className="rec-field-row">
            <span className="rec-field-label">⚠️ Decline Reason:</span>
            <span className="rec-field-value">{record.rejectionReason}</span>
          </div>
        )}
      </div>

      <div className="rec-actions-row">
        <button type="button" className="rec-detail-btn" onClick={() => onOpen(record)}>
          View Request Details
        </button>
      </div>
    </div>
  );
}

/**
 * Submitted / completed lab report card component
 */
function LabReportCard({ record, onOpen }) {
  const report = record.labReport || record;
  const testTitle = report.testName || record.testName || record.tests || 'Diagnostic Lab Report';
  const doctorName = record.doctorName || report.doctorName || 'Assigned Physician';
  const avatarInitial = doctorName.replace(/^Dr\.\s*/i, '').charAt(0) || 'R';
  const scheduledDate = record.labTestDate || record.recommendationDate || record.requestDate;
  const submittedDate = report.submittedAt || record.submittedAt || record.completedAt;
  const attachment = report.fileAttachment || record.fileAttachment;

  return (
    <div className="rec-card">
      <div className="rec-header">
        <div className="rec-header-left">
          <div className="rec-doc-avatar">{avatarInitial}</div>
          <div className="rec-title-wrap">
            <div className="rec-doctor-name">{testTitle}</div>
            <div className="rec-meta">
              <span>👨‍⚕️ {doctorName}</span>
              <span>•</span>
              <span>📅 Submitted: {formatClinicalDate(submittedDate)}</span>
            </div>
          </div>
        </div>
        <div className="rec-header-right">
          <span className="badge badge-green">Submitted Report</span>
          {(record.reportId || report.id) && (
            <span className="rec-id-tag">Report: {record.reportId || report.id}</span>
          )}
        </div>
      </div>

      <div className="rec-body">
        {report.result && (
          <div className="rec-field-row">
            <span className="rec-field-label">🧪 Result:</span>
            <span className="rec-field-value highlight">{report.result}</span>
          </div>
        )}

        {report.findings && (
          <div className="rec-field-row">
            <span className="rec-field-label">📋 Clinical Findings:</span>
            <span className="rec-field-value">{report.findings}</span>
          </div>
        )}

        {report.remarks && (
          <div className="rec-field-row">
            <span className="rec-field-label">💬 Lab Remarks:</span>
            <span className="rec-field-value">{report.remarks}</span>
          </div>
        )}

        <div className="rec-field-row">
          <span className="rec-field-label">🗓️ Scheduled Date:</span>
          <span className="rec-field-value">{formatClinicalDate(scheduledDate)}</span>
        </div>

        {(report.technicianName || record.technicianName) && (
          <div className="rec-field-row">
            <span className="rec-field-label">🔬 Certified By:</span>
            <span className="rec-field-value">
              {report.technicianName || record.technicianName}
            </span>
          </div>
        )}

        {attachment?.fileData && (
          <div className="rec-field-row">
            <span className="rec-field-label">📎 Attachment:</span>
            <a
              href={attachment.fileData}
              download={attachment.fileName || 'lab-report'}
              className="rec-field-value highlight"
            >
              Download {attachment.fileName || 'Attached Report'}
            </a>
          </div>
        )}
      </div>

      <div className="rec-actions-row">
        <button type="button" className="rec-detail-btn" onClick={() => onOpen(record)}>
          View Full Report
        </button>
      </div>
    </div>
  );
}

function RecordDetailModal({ record, onClose }) {
  if (!record) return null;

  const category = getRecordCategory(record);
  const report = record.labReport || record;
  const attachment = report?.fileAttachment || record.fileAttachment;

  return (
    <div className="rec-modal-backdrop" onClick={onClose}>
      <div className="rec-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="rec-modal-header">
          <h3>
            {category === 'lab_report'
              ? 'Submitted Diagnostic Lab Report'
              : category === 'lab_request'
              ? 'Lab Test Recommendation Details'
              : category === 'treatment'
              ? 'Treatment Plan Details'
              : 'Consultation Record Details'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        <div className="rec-modal-body">
          {category === 'lab_report' ? (
            <>
              <div className="rec-field-row">
                <span className="rec-field-label">🧪 Test Name:</span>
                <span className="rec-field-value highlight">
                  {report.testName || record.testName || record.tests || '—'}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">🆔 Report ID:</span>
                <span className="rec-field-value">{record.reportId || report.id || '—'}</span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">🔗 Request ID:</span>
                <span className="rec-field-value">
                  {record.labRequestId || report.labRequestId || '—'}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">👨‍⚕️ Referring Doctor:</span>
                <span className="rec-field-value">
                  {record.doctorName || report.doctorName || '—'}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">🗓️ Scheduled Date:</span>
                <span className="rec-field-value">
                  {formatClinicalDate(
                    record.labTestDate || record.recommendationDate || record.requestDate
                  )}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">📅 Submitted Date:</span>
                <span className="rec-field-value">
                  {formatClinicalDate(report.submittedAt || record.submittedAt)}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">🧪 Result:</span>
                <span className="rec-field-value highlight">{report.result || '—'}</span>
              </div>
              {report.findings && (
                <div className="rec-field-row">
                  <span className="rec-field-label">📋 Clinical Findings:</span>
                  <span className="rec-field-value">{report.findings}</span>
                </div>
              )}
              {report.remarks && (
                <div className="rec-field-row">
                  <span className="rec-field-label">💬 Lab Remarks:</span>
                  <span className="rec-field-value">{report.remarks}</span>
                </div>
              )}
              {(report.technicianName || record.technicianName) && (
                <div className="rec-field-row">
                  <span className="rec-field-label">🔬 Certified By:</span>
                  <span className="rec-field-value">
                    {report.technicianName || record.technicianName}
                  </span>
                </div>
              )}
              {attachment?.fileData && (
                <div className="rec-field-row">
                  <span className="rec-field-label">📎 Attachment:</span>
                  <a
                    href={attachment.fileData}
                    download={attachment.fileName || 'lab-report'}
                    className="rec-field-value highlight"
                  >
                    Download {attachment.fileName || 'Attached Report'}
                  </a>
                </div>
              )}
            </>
          ) : category === 'lab_request' ? (
            <>
              <div className="rec-field-row">
                <span className="rec-field-label">🧪 Test Name:</span>
                <span className="rec-field-value highlight">
                  {record.testName || record.tests || '—'}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">🔗 Request ID:</span>
                <span className="rec-field-value">{record.labRequestId || record.id || '—'}</span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">📊 Status:</span>
                <span className="rec-field-value">
                  {LAB_REQUEST_STATUS_BADGES[record.status]?.label || record.status || 'Pending'}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">👨‍⚕️ Referring Doctor:</span>
                <span className="rec-field-value">{record.doctorName || '—'}</span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">📅 Request Date:</span>
                <span className="rec-field-value">
                  {formatClinicalDate(record.requestDate || record.recommendationDate)}
                </span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">🗓️ Scheduled Date:</span>
                <span className="rec-field-value">
                  {formatClinicalDate(
                    record.labTestDate || record.recommendationDate || record.requestDate
                  )}
                </span>
              </div>
              {record.consultationNote && (
                <div className="rec-field-row">
                  <span className="rec-field-label">📝 Clinical Instructions:</span>
                  <span className="rec-field-value">{record.consultationNote}</span>
                </div>
              )}
              {record.rejectionReason && (
                <div className="rec-field-row">
                  <span className="rec-field-label">⚠️ Decline Reason:</span>
                  <span className="rec-field-value">{record.rejectionReason}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rec-field-row">
                <span className="rec-field-label">👨‍⚕️ Doctor:</span>
                <span className="rec-field-value">{record.doctorName || '—'}</span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">🩺 Department:</span>
                <span className="rec-field-value">{record.specialization || '—'}</span>
              </div>
              <div className="rec-field-row">
                <span className="rec-field-label">📅 Record Date:</span>
                <span className="rec-field-value">{formatClinicalDate(record.date)}</span>
              </div>
              {record.consultationNote && (
                <div className="rec-field-row">
                  <span className="rec-field-label">📝 Notes:</span>
                  <span className="rec-field-value">{record.consultationNote}</span>
                </div>
              )}
              {record.medicines && (
                <div className="rec-field-row">
                  <span className="rec-field-label">💊 Medicines:</span>
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
                  <span className="rec-field-label">⏳ Duration:</span>
                  <span className="rec-field-value">{record.duration}</span>
                </div>
              )}
              {record.followUp && (
                <div className="rec-field-row">
                  <span className="rec-field-label">📅 Follow-Up:</span>
                  <span className="rec-field-value">{formatClinicalDate(record.followUp)}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rec-modal-footer">
          <button type="button" className="rec-detail-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MedicalRecords() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const rawPatientId = (user?.userId || user?.patientId || user?.id || '').trim();
  const patientId =
    rawPatientId.toUpperCase() === 'PATIENT_001' ? 'PAT001' : rawPatientId;

  const medicalRecords = useSelector(selectPatientMedicalRecords);
  const status = useSelector(selectPatientMedicalRecordsStatus);
  const errorMessage = useSelector(selectPatientMedicalRecordsError);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const isLoading = Boolean(patientId) && status === 'loading';

  // Fetch patient medical records on mount or patientId change
  useEffect(() => {
    if (patientId) {
      dispatch(fetchPatientMedicalRecords(patientId));
    }
    return () => {
      dispatch(clearMedicalRecordsError());
    };
  }, [dispatch, patientId]);

  const { consultations, treatments, labRecommendations, completedLabReports } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = (rec) => {
      if (!query) return true;
      const haystack = [
        rec.id,
        rec.labRequestId,
        rec.reportId,
        rec.doctorName,
        rec.specialization,
        rec.consultationNote,
        rec.medicines,
        rec.tests,
        rec.testName,
        rec.result,
        rec.findings,
        rec.remarks,
        rec.labReport?.result,
        rec.labReport?.findings,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    };

    const grouped = {
      consultation: [],
      treatment: [],
      lab_request: [],
      lab_report: [],
    };

    for (const rec of medicalRecords) {
      if (!matchesSearch(rec)) continue;
      const category = getRecordCategory(rec);
      if (grouped[category]) {
        grouped[category].push(rec);
      }
    }

    return {
      consultations: sortByDateDesc(grouped.consultation, (r) => r.date),
      treatments: sortByDateDesc(grouped.treatment, (r) => r.date),
      labRecommendations: sortByDateDesc(
        grouped.lab_request,
        (r) => r.labTestDate || r.recommendationDate || r.requestDate
      ),
      completedLabReports: sortByDateDesc(
        grouped.lab_report,
        (r) => r.submittedAt || r.completedAt || r.date
      ),
    };
  }, [medicalRecords, searchQuery]);

  const showConsultations = activeTab === 'all' || activeTab === 'consultation';
  const showTreatments = activeTab === 'all' || activeTab === 'treatment';
  const showLabRequests = activeTab === 'all' || activeTab === 'lab_request';
  const showLabReports = activeTab === 'all' || activeTab === 'lab_report';

  return (
    <div className="records-container">
      {/* Hero banner */}
      <div className="records-banner">
        <div className="records-banner-left">
          <div className="records-banner-icon">📋</div>
          <div>
            <h2>Medical Records & Clinical History</h2>
            <p>
              Comprehensive overview of your consultations, treatment plans, recommended lab tests, and submitted diagnostic reports.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-refresh-records"
          onClick={() => patientId && dispatch(fetchPatientMedicalRecords(patientId))}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing…' : '🔄 Refresh'}
        </button>
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
          <div className="records-stat-num">{labRecommendations.length}</div>
          <div className="records-stat-label">Recommended Labs</div>
        </div>
        <div className="records-stat-card">
          <div className="records-stat-num">{completedLabReports.length}</div>
          <div className="records-stat-label">Lab Reports</div>
        </div>
      </div>

      {/* Search & category controls */}
      <div className="records-controls-card">
        <div className="records-search-wrap">
          <span className="records-search-icon">🔍</span>
          <input
            type="text"
            className="records-search-input"
            placeholder="Search consultations, lab tests, results, or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="records-tabs">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'consultation', label: 'Consultations' },
            { id: 'treatment', label: 'Treatment Plans' },
            { id: 'lab_request', label: 'Lab Recommendations' },
            { id: 'lab_report', label: 'Lab Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`records-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
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
          {showConsultations && (
            <div className="records-main-card">
              <div className="records-section-header">
                <h3 className="records-section-title">
                  <span>🩺</span>
                  <span>Consultations</span>
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
                    <ConsultationCard
                      key={rec.id || `consultation-${rec.date}`}
                      record={rec}
                      onOpen={setSelectedRecord}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 2. TREATMENT PLAN SECTION ─────────────────────── */}
          {showTreatments && (
            <div className="records-main-card">
              <div className="records-section-header">
                <h3 className="records-section-title">
                  <span>📋</span>
                  <span>Treatment Plans</span>
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
                    <TreatmentPlanCard
                      key={rec.id || `treatment-${rec.date}`}
                      record={rec}
                      onOpen={setSelectedRecord}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 3. RECOMMENDED & ACTIVE LAB TESTS SECTION ────── */}
          {showLabRequests && (
            <div className="records-main-card">
              <div className="records-section-header">
                <h3 className="records-section-title">
                  <span>🔬</span>
                  <span>Recommended & Pending Lab Tests</span>
                </h3>
                <span className="badge badge-blue">
                  {labRecommendations.length} Request{labRecommendations.length === 1 ? '' : 's'}
                </span>
              </div>

              {labRecommendations.length === 0 ? (
                <div className="records-section-empty">
                  No pending or recommended laboratory tests.
                </div>
              ) : (
                <div className="records-list">
                  {labRecommendations.map((rec) => (
                    <LabRecommendationCard
                      key={rec.labRequestId || rec.id}
                      record={rec}
                      onOpen={setSelectedRecord}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 4. COMPLETED LAB REPORTS SECTION ──────────────── */}
          {showLabReports && (
            <div className="records-main-card">
              <div className="records-section-header">
                <h3 className="records-section-title">
                  <span>🧪</span>
                  <span>Completed Lab Reports</span>
                </h3>
                <span className="badge badge-green">
                  {completedLabReports.length} Report{completedLabReports.length === 1 ? '' : 's'}
                </span>
              </div>

              {completedLabReports.length === 0 ? (
                <div className="records-section-empty">
                  No completed laboratory test reports available.
                </div>
              ) : (
                <div className="records-list">
                  {completedLabReports.map((rec) => (
                    <LabReportCard
                      key={rec.reportId || rec.id}
                      record={rec}
                      onOpen={setSelectedRecord}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
