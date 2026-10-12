/**
 * CancelAppointmentModal.jsx — Front Desk Cancel Appointment Confirmation Dialog
 * =========================================================================
 * Displays patient, doctor, and date/time details prior to cancelling an appointment.
 * Utilizes the reusable Modal and AlertBanner components.
 *
 * PROPS:
 *  @param {boolean} isOpen       - Whether the modal is open
 *  @param {object} appointment   - Appointment record targeted for cancellation
 *  @param {boolean} isCancelling - Whether the DELETE API request is in-flight
 *  @param {string} error         - Error message if cancellation request fails
 *  @param {function} onClose     - Dismiss modal handler
 *  @param {function} onConfirm   - Execute cancellation handler
 */

import React from 'react';
import Modal from '../../../components/common/Modal';
import AlertBanner from '../../../components/dashboard/AlertBanner';

export default function CancelAppointmentModal({
  isOpen,
  appointment,
  isCancelling,
  error,
  onClose,
  onConfirm,
}) {
  if (!appointment) return null;

  const patientName =
    appointment.patient?.name ||
    (appointment.patient?.firstName
      ? `${appointment.patient.firstName} ${appointment.patient.lastName || ''}`.trim()
      : appointment.userId || 'Patient');

  const doctorName = appointment.doctor?.name || appointment.doctorId || 'Assigned Doctor';
  const doctorSpec = appointment.doctor?.specialization || '';

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isCancelling}
        style={{
          padding: '9px 18px',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          color: '#334155',
          cursor: isCancelling ? 'not-allowed' : 'pointer',
        }}
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={() => onConfirm(appointment.id)}
        disabled={isCancelling}
        style={{
          padding: '9px 18px',
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          cursor: isCancelling ? 'not-allowed' : 'pointer',
          opacity: isCancelling ? 0.7 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isCancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Appointment"
      subtitle="Please confirm if you want to cancel this scheduled consultation."
      footer={modalFooter}
      maxWidth="500px"
    >
      {error && <AlertBanner message={error} type="error" style={{ marginBottom: '16px' }} />}

      <div
        style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px', display: 'block' }}>Patient</span>
            <strong style={{ color: '#0f172a', fontSize: '15px' }}>{patientName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px', display: 'block' }}>Doctor</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>
              {doctorName} {doctorSpec ? `(${doctorSpec})` : ''}
            </span>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '13px', display: 'block' }}>Scheduled Schedule</span>
            <span style={{ color: '#b91c1c', fontWeight: 600 }}>
              {appointment.date} at {appointment.slot}
            </span>
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
        Cancelling will remove this appointment from the active schedule and free up the doctor's time slot for other patients.
      </p>
    </Modal>
  );
}
