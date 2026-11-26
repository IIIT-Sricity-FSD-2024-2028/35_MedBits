/**
 * RescheduleAppointmentModal.jsx — Front Desk Reschedule Appointment Dialog
 * =========================================================================
 * Powered by Redux Toolkit (`frontdeskAppointmentsSlice`).
 * Displays patient & doctor summary, provides a date picker (min = today),
 * fetches real-time doctor available slots, and submits the updated date & slot.
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDoctorAvailableSlots,
  rescheduleFrontdeskAppointment,
  selectFrontdeskAppointmentsState,
} from '../../../store/slices/frontdesk/frontdeskAppointmentsSlice';
import {
  getPatientDisplayName,
  todayLocalISO,
} from '../../../store/slices/frontdesk/frontdeskHelpers';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import AlertBanner from '../../../components/dashboard/AlertBanner';

export default function RescheduleAppointmentModal({ isOpen, appointment, onClose }) {
  const dispatch = useDispatch();
  const {
    availableSlots,
    slotsStatus,
    slotsError,
    isRescheduling,
    rescheduleError: error,
  } = useSelector(selectFrontdeskAppointmentsState);

  const [selectedDate, setSelectedDate] = useState(appointment?.date || todayLocalISO());
  const [selectedSlot, setSelectedSlot] = useState(appointment?.slot || '');

  const isLoadingSlots = slotsStatus === 'loading';

  useEffect(() => {
    if (isOpen && appointment?.doctorId && selectedDate) {
      dispatch(
        fetchDoctorAvailableSlots({
          doctorId: appointment.doctorId,
          date: selectedDate,
          currentAppointment: appointment,
        })
      );
    }
  }, [isOpen, appointment, selectedDate, dispatch]);

  if (!appointment) return null;

  const patientName = getPatientDisplayName(appointment);
  const doctorName = appointment.doctor?.name || appointment.doctorId || 'Assigned Doctor';
  const doctorSpec = appointment.doctor?.specialization || '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) return;

    dispatch(
      rescheduleFrontdeskAppointment({
        appointmentId: appointment.id,
        date: selectedDate,
        slot: selectedSlot,
      })
    );
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isRescheduling}
        style={{
          padding: '9px 18px',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          color: '#334155',
          cursor: isRescheduling ? 'not-allowed' : 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isRescheduling || !selectedDate || !selectedSlot}
        style={{
          padding: '9px 18px',
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          cursor: isRescheduling || !selectedDate || !selectedSlot ? 'not-allowed' : 'pointer',
          opacity: isRescheduling || !selectedDate || !selectedSlot ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isRescheduling ? 'Saving...' : 'Save Changes'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Appointment"
      subtitle="Update the consultation date and time slot for this patient."
      footer={modalFooter}
      maxWidth="560px"
    >
      {error && <AlertBanner message={error} type="error" style={{ marginBottom: '16px' }} />}
      {slotsError && (
        <AlertBanner message={slotsError} type="warning" style={{ marginBottom: '16px' }} />
      )}

      {/* Appointment Summary Card */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '13.5px',
        }}
      >
        <div>
          <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Patient</span>
          <strong style={{ color: '#0f172a', fontSize: '15px' }}>{patientName}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Doctor</span>
          <span style={{ color: '#0f172a', fontWeight: 600 }}>
            {doctorName} {doctorSpec ? `(${doctorSpec})` : ''}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>
            Current Date &amp; Slot
          </span>
          <span style={{ color: '#0284c7', fontWeight: 600 }}>
            {appointment.date} at {appointment.slot}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Date Selector */}
        <div style={{ marginBottom: '20px' }}>
          <FormField
            label="Select New Date"
            name="rescheduleDate"
            type="date"
            value={selectedDate}
            min={todayLocalISO()}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot('');
            }}
            required
            disabled={isRescheduling}
          />
        </div>

        {/* Slot Selector */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '8px',
            }}
          >
            Available Time Slots <span style={{ color: '#dc2626' }}>*</span>
          </label>

          {isLoadingSlots ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              Loading available slots...
            </div>
          ) : availableSlots.length === 0 ? (
            <div
              style={{
                padding: '14px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '6px',
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              No available slots found for {selectedDate}. Please choose a different date.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                gap: '8px',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {availableSlots.map((slot) => {
                const isSelected = slot === selectedSlot;
                const isCurrent = slot === appointment.slot && selectedDate === appointment.date;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isRescheduling}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#1e293b',
                      cursor: isRescheduling ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    {slot}
                    {isCurrent && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          color: '#64748b',
                          fontWeight: 400,
                        }}
                      >
                        (current)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
