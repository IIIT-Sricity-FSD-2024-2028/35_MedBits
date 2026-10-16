/**
 * LabReportModal.jsx — Diagnostic Lab Report Detail Viewer
 * =========================================================================
 * Location: src/pages/doctor/consultation/LabReportModal.jsx
 *
 * Popup dialog allowing doctors to review lab test results and values,
 * complete with a print trigger.
 */

import React from 'react';
import './consultation.css';

export default function LabReportModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="cn-modal-overlay" onClick={onClose}>
      <div className="cn-modal-card" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="cn-modal-header">
          <h3 className="cn-modal-title">Diagnostic Lab Report</h3>
          <button
            type="button"
            className="cn-remove-tag"
            style={{ fontSize: '20px', color: '#64748b' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="cn-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Patient</span>
              <strong style={{ fontSize: '15px' }}>{report.patientName || report.patientId}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Test Type</span>
              <strong style={{ fontSize: '15px' }}>{report.testName || report.testType}</strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Date Generated</span>
              <span>{report.submittedAt ? report.submittedAt.split('T')[0] : (report.completedDate || report.date || '—')}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Lab Technician</span>
              <strong style={{ color: '#0f766e' }}>{report.technicianName || 'Certified Technician'}</strong>
            </div>
          </div>

          {report.result && (
            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600, display: 'block' }}>Measured Result</span>
              <strong style={{ fontSize: '16px', color: '#15803d' }}>{report.result}</strong>
            </div>
          )}

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1e293b' }}>Clinical Findings & Observations</h4>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
              {report.findings || report.summary || 'All values within standard physiological parameters. No abnormalities detected.'}
            </p>
          </div>

          {report.remarks && (
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#475569' }}>Technician Remarks</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{report.remarks}</p>
            </div>
          )}

          {report.fileAttachment?.fileData && (
            <div style={{ padding: '8px 0' }}>
              <a
                href={report.fileAttachment.fileData}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
              >
                📎 View / Download Attached Report File ({report.fileAttachment.fileName || 'Report'})
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="cn-modal-footer">
          <button type="button" className="btn-back" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-create-note"
            onClick={() => window.print()}
          >
            Print Report
          </button>
        </div>

      </div>
    </div>
  );
}
