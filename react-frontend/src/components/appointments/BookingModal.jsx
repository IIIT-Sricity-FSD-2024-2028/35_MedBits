/**
 * BookingModal.jsx — Doctor Appointment Booking & Time Slot Modal
 * ================================================================
 * Location: src/components/appointments/BookingModal.jsx
 *
 * Presentational modal controlled via Redux state in PatientAppointments.
 *
 * PROPS:
 *  @param {boolean} isOpen         — Whether modal is visible
 *  @param {object} doctor          — Selected doctor object { id, name, specialization, ... }
 *  @param {string} initialDate     — Appointment date (YYYY-MM-DD)
 *  @param {Array} slots            — Available slots array loaded via Redux
 *  @param {string} selectedSlot    — Controlled selected slot value
 *  @param {boolean} isLoadingSlots — Loading state for slot lookup
 *  @param {string} slotError       — Error message if slot lookup fails
 *  @param {boolean} isBooking      — Loading state during booking submission
 *  @param {function} onDateChange  — Date change handler (date) => void
 *  @param {function} onSlotSelect  — Slot click handler (slot) => void
 *  @param {function} onClose       — Modal dismiss handler
 *  @param {function} onConfirm     — Booking confirm handler ({ doctor, date, slot }) => void
 */

import React from 'react';
import Modal from '../common/Modal';
import './BookingModal.css';

function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export default function BookingModal({
  isOpen,
  doctor,
  initialDate,
  slots = [],
  selectedSlot: controlledSlot = '',
  isLoadingSlots = false,
  slotError = null,
  isBooking = false,
  onDateChange,
  onSlotSelect,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !doctor) return null;

  const selectedDate = initialDate || getTodayIso();
  const selectedSlot = controlledSlot || '';
  const availableSlots = Array.isArray(slots) ? slots : [];

  const handleDateChange = (nextDate) => {
    onDateChange?.(nextDate);
  };

  const handleSlotClick = (slot) => {
    onSlotSelect?.(slot);
  };

  const doctorName = doctor.name || 'Assigned Physician';
  const doctorSpec = doctor.specialization || doctor.department || 'Consultant Specialist';
  const doctorInitial = doctorName.replace(/^Dr\.\s*/i, '').charAt(0) || 'D';
  const consultationFee = doctor.consultationFee
    ? `Rs ${Number(doctor.consultationFee).toLocaleString()}`
    : 'Rs 1,200.00';

  const handleConfirmClick = () => {
    if (!selectedSlot || isBooking) return;
    if (onConfirm) {
      onConfirm({
        doctor,
        date: selectedDate,
        slot: selectedSlot,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Appointment"
      subtitle="Select a date and available time slot to complete your booking"
      maxWidth="620px"
      footer={
        <div className="booking-modal-footer">
          <div className="booking-summary-info">
            <div className="booking-summary-slot">
              {selectedSlot ? `🕒 ${selectedSlot}` : 'Please choose a time slot'}
            </div>
            <div className="booking-summary-sub">
              📅 {selectedDate} • {consultationFee}
            </div>
          </div>

          <div className="booking-footer-actions">
            <button
              type="button"
              className="btn-booking-cancel"
              onClick={onClose}
              disabled={isBooking}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-booking-confirm"
              onClick={handleConfirmClick}
              disabled={!selectedSlot || isBooking}
            >
              {isBooking ? (
                <>
                  <span>⏳</span>
                  <span>Booking...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Confirm Booking</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="booking-modal-body">

        {/* 1. Doctor Information Card */}
        <div className="booking-doc-card">
          <div className="booking-doc-info">
            <div className="booking-doc-avatar">{doctorInitial}</div>
            <div>
              <div className="booking-doc-name">{doctorName}</div>
              <div className="booking-doc-sub">🩺 {doctorSpec}</div>
              {doctor.branchName && (
                <div className="booking-doc-branch">🏥 {doctor.branchName}</div>
              )}
            </div>
          </div>

          <div className="booking-doc-fee-wrap">
            <div className="booking-doc-fee-label">Consultation Fee</div>
            <div className="booking-doc-fee">{consultationFee}</div>
          </div>
        </div>

        {/* Error notification if slots failed to fetch */}
        {slotError && (
          <div className="booking-error-alert">
            <span>⚠️</span>
            <span>{slotError}</span>
          </div>
        )}

        {/* 2. Date Selection */}
        <div>
          <label htmlFor="booking-date" className="booking-section-label">
            <span>Select Appointment Date</span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Minimum: Today
            </span>
          </label>
          <input
            id="booking-date"
            type="date"
            className="booking-date-input"
            min={getTodayIso()}
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        {/* 3. Available Slots Grid */}
        <div className="booking-slots-container">
          <div className="booking-section-label">
            <span>Available Time Slots</span>
            {availableSlots.length > 0 && (
              <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>
                {availableSlots.length} slot{availableSlots.length === 1 ? '' : 's'} available
              </span>
            )}
          </div>

          {isLoadingSlots ? (
            <div className="booking-slots-loading">
              Loading available slots from clinic schedule...
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="booking-slots-empty">
              No available slots for this date. Please pick another date above.
            </div>
          ) : (
            <div className="booking-slot-grid" role="group" aria-label="Select appointment time slot">
              {availableSlots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`booking-slot-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSlotClick(slot)}
                    aria-pressed={isSelected}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
