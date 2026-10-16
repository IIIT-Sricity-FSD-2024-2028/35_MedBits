/**
 * UpcomingAppointmentsList.jsx — Today's Doctor OPD Appointment Queue
 * =========================================================================
 * Location: src/pages/doctor/consultation/UpcomingAppointmentsList.jsx
 *
 * Displays scheduled outpatient appointments for today's doctor session.
 * Each row allows starting a consultation note with 1-click.
 */

import React from 'react';
import './consultation.css';

export default function UpcomingAppointmentsList({
  appointments = [],
  onStartConsultation,
}) {
  const upcomingList = appointments.filter((apt) => apt.status === 'upcoming');
  const MAX_DISPLAY = 5;
  const displayedAppointments = upcomingList.slice(0, MAX_DISPLAY);

  return (
    <div className="cn-section-card">
      <div className="cn-section-header">
        <h3 className="cn-section-title">Upcoming Appointments</h3>
        <span className="cn-count-badge">
          {displayedAppointments.length}{displayedAppointments.length < upcomingList.length ? ` of ${upcomingList.length}` : ''} patients waiting
        </span>
      </div>

      {displayedAppointments.length === 0 ? (
        <p className="cn-empty-text">No upcoming appointments scheduled for today.</p>
      ) : (
        <div className="cn-list-column">
          {displayedAppointments.map((apt) => {
            const patientName = apt.patient?.name || apt.patientName || apt.userId || 'Patient';
            const initials = (patientName.slice(0, 2)).toUpperCase();

            return (
              <div key={apt.id} className="cn-item-row">
                <div className="cn-item-left">
                  {/* Initials Avatar */}
                  <div className="cn-avatar-circle">{initials}</div>
                  <div>
                    <h4 className="cn-item-name">{patientName}</h4>
                    <div className="cn-item-subtitle">
                      Token: <strong>{apt.token || apt.id || '—'}</strong> | Time: {apt.slot || apt.time || '—'} | Date: {apt.date || '—'}
                    </div>
                  </div>
                </div>

                {/* Start note trigger */}
                <button
                  type="button"
                  className="btn-action-outline"
                  onClick={() => onStartConsultation(apt)}
                >
                  Start Note
                </button>
              </div>
            );
          })}
          {upcomingList.length > MAX_DISPLAY && (
            <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '8px 0 2px' }}>
              + {upcomingList.length - MAX_DISPLAY} more scheduled appointments (use search above to find any patient)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
