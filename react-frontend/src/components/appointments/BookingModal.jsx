/**
 * BookingModal.jsx — Doctor Appointment Booking & Time Slot Modal
 * ================================================================
 * Location: src/components/appointments/BookingModal.jsx
 *
 * WHAT THIS COMPONENT DOES:
 *  Pops up when a patient clicks "Book" for a doctor.
 *  Displays:
 *   1. Doctor profile details (name, specialization, branch, consultation fee)
 *   2. Date picker to choose preferred appointment date
 *   3. Interactive grid of available time slots fetched dynamically from backend
 *   4. Selected slot feedback and Confirm Booking action
 *
 * PROPS:
 *  @param {boolean} isOpen         — Whether modal is visible
 *  @param {object} doctor          — Selected doctor object { id, name, specialization, ... }
 *  @param {string} initialDate     — Pre-selected appointment date (YYYY-MM-DD)
 *  @param {Array} slots            — Optional pre-loaded slots array
 *  @param {boolean} isBooking      — Loading state during booking submission
 *  @param {function} onClose       — Modal dismiss handler
 *  @param {function} onConfirm     — Booking confirm handler ({ doctor, date, slot }) => void
 *  @param {string} apiBaseUrl      — Backend API base URL
 */

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import './BookingModal.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function BookingModal({
  isOpen,
  doctor,
  initialDate,
  slots,
  isBooking = false,
  onClose,
  onConfirm,
  apiBaseUrl = API_BASE_URL,
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayIso());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [fetchedSlots, setFetchedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState(null);

  // Reset selected slot when doctor changes
  useEffect(() => {
    setSelectedSlot('');
    setSlotError(null);
  }, [doctor?.id]);

  // Fetch available doctor slots for selected date (only if not passed via slots prop)
  useEffect(() => {
    if (!isOpen || !doctor?.id || !selectedDate || slots) return;

    let isMounted = true;
    async function loadDoctorSlots() {
      setIsLoadingSlots(true);
      setSlotError(null);

      try {
        const response = await fetch(
          `${apiBaseUrl}/doctors/${encodeURIComponent(doctor.id)}/slots?date=${encodeURIComponent(selectedDate)}`,
          {
            headers: {
              role: 'patient',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load available slots for this date.');
        }

        const data = await response.json();
        if (isMounted) {
          setFetchedSlots(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching doctor slots:', err);
          setSlotError(err.message || 'Failed to retrieve available slots.');
          setFetchedSlots([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadDoctorSlots();

    return () => {
      isMounted = false;
    };
  }, [isOpen, doctor?.id, selectedDate, slots, apiBaseUrl]);

  if (!isOpen || !doctor) return null;

  const availableSlots = slots || fetchedSlots;

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
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot('');
            }}
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
                    onClick={() => setSelectedSlot(slot)}
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
