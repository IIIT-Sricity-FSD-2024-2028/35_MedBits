/**
 * ConsultationToolbar.jsx — Patient / Appointment Search & Quick Actions
 * =========================================================================
 * Location: src/pages/doctor/consultation/ConsultationToolbar.jsx
 *
 * FEATURES:
 *  - Real-time search by patient name or appointment token.
 *  - Auto-suggest dropdown showing appointment time slot and token.
 *  - "+ Create Note" primary trigger to launch a consultation note.
 */

import React, { useState, useRef, useEffect } from 'react';
import './consultation.css';

export default function ConsultationToolbar({
  appointments = [],
  onSelectAppointment,
  onCreateNewNote,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Filter matching appointments by token or patient name
  const filtered = appointments.filter((apt) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return false;
    const name = (apt.patient?.name || apt.patientName || apt.userId || '').toLowerCase();
    const token = (apt.token || apt.id || '').toLowerCase();
    return name.includes(query) || token.includes(query);
  });

  // Close dropdown when doctor clicks outside the input shell
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="cn-toolbar-card">
      <div className="cn-toolbar-row">
        {/* Search input with live dropdown */}
        <div ref={containerRef} className="cn-search-shell">
          <input
            type="text"
            className="cn-search-input"
            placeholder="Search and select appointment by patient name or token..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />

          {isOpen && searchTerm.trim() && (
            <div className="cn-search-dropdown">
              {filtered.length === 0 ? (
                <div style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>
                  No matching appointments found
                </div>
              ) : (
                filtered.map((apt) => {
                  const patientName = apt.patient?.name || apt.patientName || apt.userId || 'Patient';
                  return (
                    <div
                      key={apt.id}
                      className="cn-search-item"
                      onClick={() => {
                        onSelectAppointment(apt);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '14px', display: 'block' }}>{patientName}</strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Slot: {apt.slot || apt.time || '—'}
                        </span>
                      </div>
                      <span className="cn-token-badge">
                        {apt.token || 'Appt'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Action Button: Create note directly */}
        <button
          type="button"
          className="btn-create-note"
          onClick={onCreateNewNote}
        >
          ✚ Create Note
        </button>
      </div>
    </div>
  );
}
