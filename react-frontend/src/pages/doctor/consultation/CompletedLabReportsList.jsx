/**
 * CompletedLabReportsList.jsx — Diagnostic Test Results for Doctor
 * =========================================================================
 * Location: src/pages/doctor/consultation/CompletedLabReportsList.jsx
 *
 * Displays laboratory test reports completed by Lab Technicians.
 * Includes status count and triggers report inspection modal.
 */

import React from 'react';
import './consultation.css';

export default function CompletedLabReportsList({
  reports = [],
  onViewReport,
}) {
  return (
    <div className="cn-section-card">
      <div className="cn-section-header">
        <h3 className="cn-section-title">Completed Lab Reports</h3>
        <span
          className="cn-count-badge"
          style={{ background: '#ecfdf5', color: '#065f46' }}
        >
          {reports.length} reports
        </span>
      </div>

      {reports.length === 0 ? (
        <p className="cn-empty-text">No diagnostic lab reports uploaded yet.</p>
      ) : (
        <div className="cn-list-column">
          {reports.map((report) => (
            <div key={report.id} className="cn-item-row">
              <div className="cn-item-left">
                <div
                  className="cn-avatar-circle"
                  style={{ background: '#eff6ff', color: '#1d4ed8' }}
                >
                  🧪
                </div>
                <div>
                  <h4 className="cn-item-name">{report.testName || report.testType || 'Diagnostic Lab Test'}</h4>
                  <div className="cn-item-subtitle">
                    Patient: <strong>{report.patientName || report.patientId}</strong> • Completed:{' '}
                    {report.completedDate || report.date || 'Today'}
                  </div>
                </div>
              </div>

              {/* View diagnostic report */}
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => onViewReport(report)}
              >
                View Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
