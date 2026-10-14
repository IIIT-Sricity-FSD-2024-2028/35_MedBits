/**
 * ConsultationRecordsList.jsx — Historical Consultation Records
 * =========================================================================
 * Location: src/pages/doctor/consultation/ConsultationRecordsList.jsx
 *
 * Shows doctor's previous consultation entries, diagnosis notes,
 * and follow-up recommendations. Allows editing previous entries.
 */

import React from 'react';
import './consultation.css';

export default function ConsultationRecordsList({
  records = [],
  onViewAll,
  onEditRecord,
}) {
  return (
    <div className="cn-section-card">
      <div className="cn-section-header">
        <h3 className="cn-section-title">Patient Consultation Records</h3>
        {records.length > 0 && (
          <button
            type="button"
            className="cn-link-btn"
            onClick={onViewAll}
          >
            View All ({records.length})
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="cn-empty-text">No previous consultation notes recorded yet.</p>
      ) : (
        <div className="cn-list-column">
          {records.slice(0, 4).map((record) => {
            const displayName = record.patientName || record.patientId || 'Patient';
            const initials = (displayName.slice(0, 2)).toUpperCase();

            return (
              <div key={record.id} className="cn-item-row">
                <div className="cn-item-left">
                  <div className="cn-avatar-circle" style={{ background: '#f8fafc' }}>
                    {initials}
                  </div>
                  <div>
                    <h4 className="cn-item-name">{displayName}</h4>
                    <div className="cn-item-subtitle" style={{ maxWidth: '480px' }}>
                      {record.consultationNote
                        ? `${record.consultationNote.substring(0, 75)}...`
                        : 'No diagnosis notes entered.'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      Date: {record.date || '—'} {record.followUpDate ? `• Follow-Up: ${record.followUpDate}` : ''}
                    </div>
                  </div>
                </div>

                {/* Edit / Inspect previous note */}
                <button
                  type="button"
                  className="btn-action-outline"
                  onClick={() => onEditRecord(record)}
                >
                  View / Edit
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
