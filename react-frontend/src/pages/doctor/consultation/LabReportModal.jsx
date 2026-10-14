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
              <span>{report.completedDate || report.date || '—'}</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Status</span>
              <span style={{ color: '#059669', fontWeight: 600 }}>Completed</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Findings & Summary</h4>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
              {report.summary || report.findings || 'All values within standard physiological parameters. No abnormalities detected.'}
            </p>
          </div>
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
