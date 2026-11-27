/**
 * LabReportDetailModal.jsx — Shared Diagnostic Report Detail Viewer
 * ==============================================================================
 * Location: src/pages/LabTechnician/components/LabReportDetailModal.jsx
 *
 * Shared by both LabReports.jsx and TestRequests.jsx (Completed section) so both
 * views present the exact same authoritative report details, attachments, and
 * distinct Scheduled / Completed / Submitted timestamps.
 */

import React from 'react';
import {
  buildLabReportViewModel,
  formatLabDate,
} from '../../../store/slices/labTech/labTechHelpers';
import '../LabReports.css';

export default function LabReportDetailModal({
  isOpen,
  report,
  request = null,
  loading = false,
  error = null,
  onClose,
}) {
  if (!isOpen) return null;

  const viewModel = buildLabReportViewModel(report, request);

  return (
    <div className="lr-modal-backdrop" onClick={onClose}>
      <div
        className="lr-modal-dialog"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lr-modal-header">
          <h3 className="lr-modal-title">Diagnostic Lab Report</h3>
          <button
            type="button"
            className="lr-modal-close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="lr-modal-body lr-report-sheet">
          {loading ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: '#64748b' }}>
              Loading submitted report details…
            </div>
          ) : error ? (
            <div className="lr-alert-banner lr-alert-banner--error">
              <span>⚠️ {error}</span>
            </div>
          ) : !viewModel ? (
            <div
              style={{
                padding: '28px 16px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
              }}
            >
              No submitted diagnostic report record was found for this request
              {request?.id ? ` (#${request.id})` : ''}.
            </div>
          ) : (
            <>
              <div className="lr-report-banner">
                <div>
                  <div className="lr-report-brand-title">
                    MEDBITS DIAGNOSTIC LABS
                  </div>
                  <div className="lr-report-brand-sub">
                    Clinical Pathology & Diagnostic Medicine
                  </div>
                </div>
                <div className="lr-report-meta-box">
                  <div>
                    <strong>Report ID:</strong> {viewModel.id}
                  </div>
                  <div>
                    <strong>Request ID:</strong> {viewModel.labRequestId}
                  </div>
                  <div>
                    <strong>Scheduled Date:</strong>{' '}
                    {formatLabDate(viewModel.scheduledDate)}
                  </div>
                  <div>
                    <strong>Completed Date:</strong>{' '}
                    {formatLabDate(viewModel.completedDate)}
                  </div>
                  <div>
                    <strong>Submitted Date:</strong>{' '}
                    {formatLabDate(viewModel.submittedDate)}
                  </div>
                </div>
              </div>

              <div className="lr-report-grid">
                <div>
                  <strong>Patient:</strong> {viewModel.patientName} (
                  {viewModel.patientId})
                </div>
                <div>
                  <strong>Doctor:</strong> Dr.{' '}
                  {viewModel.doctorName.replace(/^Dr\.\s*/i, '')} |{' '}
                  <strong>Test:</strong> {viewModel.testName}
                </div>
              </div>

              {[
                {
                  t: 'Diagnostic Result & Measured Values',
                  v: viewModel.result,
                  c: 'lr-report-result-box',
                },
                {
                  t: 'Clinical Findings',
                  v: viewModel.findings,
                  c: 'lr-report-text-box',
                },
                {
                  t: 'Remarks & Recommendations',
                  v: viewModel.remarks,
                  c: 'lr-report-text-box',
                },
              ]
                .filter((s) => s.v)
                .map(({ t, v, c }) => (
                  <div className="lr-report-section" key={t}>
                    <div className="lr-report-section-title">{t}</div>
                    <div className={c}>{v}</div>
                  </div>
                ))}

              {viewModel.fileAttachment?.fileData && (
                <div className="lr-report-section">
                  <div className="lr-report-section-title">
                    Attached Document
                  </div>
                  <a
                    href={viewModel.fileAttachment.fileData}
                    download={viewModel.fileAttachment.fileName}
                    className="lr-btn lr-btn--outline"
                  >
                    📄 Download {viewModel.fileAttachment.fileName}
                  </a>
                </div>
              )}

              <div className="lr-report-signoff">
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Verified Electronic Diagnostic Record
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      color: '#64748b',
                      fontWeight: 700,
                    }}
                  >
                    Certified By
                  </div>
                  <strong>{viewModel.technicianName}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="lr-modal-footer">
          <button
            type="button"
            className="lr-btn lr-btn--outline"
            onClick={onClose}
          >
            Close
          </button>
          {viewModel && !loading && !error && (
            <button
              type="button"
              className="lr-btn lr-btn--primary"
              onClick={() => window.print()}
            >
              🖨️ Print Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
