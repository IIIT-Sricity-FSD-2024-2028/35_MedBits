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
  return (
    <div className="cn-section-card">
      <div className="cn-section-header">
        <h3 className="cn-section-title">Upcoming Appointments</h3>
        <span className="cn-count-badge">{appointments.length} patients waiting</span>
      </div>

      {appointments.length === 0 ? (
        <p className="cn-empty-text">No upcoming appointments scheduled for today.</p>
      ) : (
        <div className="cn-list-column">
          {appointments.map((apt) => {
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
                      Token: <strong>{apt.token || '—'}</strong> | Time: {apt.slot || apt.time || '—'}
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
        </div>
      )}
    </div>
  );
}
