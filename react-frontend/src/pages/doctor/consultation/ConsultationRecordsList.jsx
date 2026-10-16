/**
 * ConsultationRecordsList.jsx — Historical Consultation Records
 * =========================================================================
 * Location: src/pages/doctor/consultation/ConsultationRecordsList.jsx
 *
 * Shows doctor's previous consultation entries, diagnosis notes,
 * and follow-up recommendations. Allows editing previous entries.
 */

import React, { useState } from 'react';
import './consultation.css';

export default function ConsultationRecordsList({
  records = [],
  onViewAll,
  onEditRecord,
  onViewLabReport,
}) {
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = searchTerm.trim()
    ? records.filter(
        (r) =>
          (r.patientName || r.patientId || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (r.consultationNote || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : records;

  const displayedRecords = showAll ? filtered : filtered.slice(0, 4);

  return (
    <div className="cn-section-card">
      <div className="cn-section-header">
        <h3 className="cn-section-title">Patient Consultation Records</h3>
        {records.length > 4 ? (
          <button
            type="button"
            className="cn-link-btn"
            onClick={() => {
              setShowAll((prev) => !prev);
              onViewAll?.();
            }}
          >
            {showAll ? 'Show Less ↑' : `View All (${records.length})`}
          </button>
        ) : (
          records.length > 0 && (
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              {records.length} record{records.length > 1 ? 's' : ''}
            </span>
          )
        )}
      </div>

      {showAll && records.length > 4 && (
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            className="cn-input"
            placeholder="Search previous records by patient name or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ fontSize: '13px', padding: '8px 14px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {records.length === 0 ? (
        <p className="cn-empty-text">No previous consultation notes recorded yet.</p>
      ) : displayedRecords.length === 0 ? (
        <p className="cn-empty-text">No consultation records match "{searchTerm}".</p>
      ) : (
        <div className="cn-list-column">
          {displayedRecords.map((record) => {
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
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>Date: {record.date || '—'} {record.followUpDate ? `• Follow-Up: ${record.followUpDate}` : ''}</span>
                      {record.labReport && (
                        <span
                          style={{
                            background: '#ecfdf5',
                            color: '#065f46',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '11px',
                            border: '1px solid #a7f3d0',
                            cursor: onViewLabReport ? 'pointer' : 'default',
                          }}
                          onClick={() => onViewLabReport?.(record.labReport)}
                          title="Click to view full diagnostic report"
                        >
                          🧪 Lab Report: {record.labReport.result || 'Submitted'}
                        </span>
                      )}
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

      {showAll && records.length > 4 && (
        <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            className="cn-link-btn"
            onClick={() => setShowAll(false)}
          >
            Show Less ↑
          </button>
        </div>
      )}
    </div>
  );
}
