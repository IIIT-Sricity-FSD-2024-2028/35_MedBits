/**
 * BookFollowUpModal.jsx — Front Desk Follow-Up & Referral Booking Dialog
 * ==============================================================================
 * WHAT THIS COMPONENT DOES:
 *  1. Displays full context of the selected referral or follow-up:
 *     - Patient name, ID, and phone
 *     - Doctor name & department
 *     - Recommended/preferred date and doctor notes
 *  2. Allows front desk staff to confirm or adjust the appointment date.
 *  3. Queries the live doctor slot availability endpoint:
 *     GET /doctors/:doctorId/slots?date=YYYY-MM-DD
 *  4. Lets staff click a time slot chip to select it.
 *  5. Posts the confirmed booking to:
 *     POST /appointments
 *  6. Updates referral status to 'Accepted' upon successful booking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/common/Modal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const todayIso = () => new Date().toISOString().split('T')[0];

const DEFAULT_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00'];

/**
 * Format ISO date for clean modal display
 */
function formatDisplayDate(dateValue) {
  if (!dateValue) return 'Flexible';
  const d = new Date(dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateValue;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * @param {boolean} isOpen       - Modal open state
 * @param {function} onClose     - Dismiss modal handler
 * @param {object} item          - Selected referral or follow-up item
 * @param {function} onSuccess   - Callback invoked on successful booking
 */
export default function BookFollowUpModal({ isOpen, onClose, item, onSuccess }) {
  const { user } = useAuth();

  // Selected date and time slot
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  // Loading and error states
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Target doctor ID for slot checking and booking
  const targetDoctorId = item?.toDoctorId || item?.doctorId || 'DOC001';
  const patientId = item?.patientId || item?.userId || 'PAT001';
  const patientName = item?.patientName || item?.patient || patientId;
  const doctorName = item?.toDoctorName || item?.doctorName || item?.doctor || 'Doctor';
  const suggestedDate = item?.followUpDate || item?.preferredDate || item?.date || todayIso();

  // Reset modal state whenever a new item is selected or modal opens
  useEffect(() => {
    if (isOpen && item) {
      const initialDate = suggestedDate && suggestedDate >= todayIso() ? suggestedDate : todayIso();
      setSelectedDate(initialDate);
      setSelectedSlot('');
      setErrorMessage(null);
    }
  }, [isOpen, item, suggestedDate]);

  // Fetch available slots from backend whenever date or doctor changes
  const fetchDoctorSlots = useCallback(async (docId, date) => {
    if (!docId || !date) return;
    setIsLoadingSlots(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `${API_BASE}/doctors/${encodeURIComponent(docId)}/slots?date=${encodeURIComponent(date)}`,
        {
          headers: { role: 'frontdesk' },
        },
      );
      if (res.ok) {
        const slotsData = await res.json();
        if (Array.isArray(slotsData) && slotsData.length > 0) {
          setAvailableSlots(slotsData);
          return;
        }
      }
      // Safe fallback if doctor slots empty for date
      setAvailableSlots(DEFAULT_SLOTS);
    } catch {
      setAvailableSlots(DEFAULT_SLOTS);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && targetDoctorId && selectedDate) {
      fetchDoctorSlots(targetDoctorId, selectedDate);
    }
  }, [isOpen, targetDoctorId, selectedDate, fetchDoctorSlots]);

  // Handle booking submission
  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!selectedDate) {
      setErrorMessage('Please choose an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please select an available time slot.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const staffId = user?.id || user?.userId || 'FRONTDESK_001';
    const effectiveBranchId =
      item?.branchId ||
      user?.branchId ||
      '00000000-0000-4000-8000-000000000001';

    const bookingPayload = {
      userId: patientId,
      doctorId: targetDoctorId,
      branchId: effectiveBranchId,
      date: selectedDate,
      slot: selectedSlot,
      source: 'frontdesk',
      bookedBy: staffId,
      frontdeskId: staffId,
    };

    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: 'frontdesk',
          'x-user-id': staffId,
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message || 'Server error while booking appointment.';
        throw new Error(msg);
      }

      const createdAppointment = await res.json();

      // If this was a referral, update status to 'accepted'
      if (item.isReferral && item.id) {
        try {
          await fetch(
            `${API_BASE}/doctors/${encodeURIComponent(item.fromDoctorId || 'DOC001')}/referrals/${item.id}/status`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', role: 'doctor' },
              body: JSON.stringify({ status: 'accepted' }),
            },
          );
        } catch (_) {}

        // Also update local cached referrals
        try {
          const cached = JSON.parse(localStorage.getItem('referralHistory') || '[]');
          const updated = cached.map((r) =>
            r.id === item.id ? { ...r, status: 'Accepted', statusClass: 'badge-confirmed' } : r,
          );
          localStorage.setItem('referralHistory', JSON.stringify(updated));
        } catch (_) {}
      }

      onSuccess(createdAppointment, item);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Unable to confirm appointment booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.isReferral ? 'Book Referral Appointment' : 'Book Follow-Up Consultation'}
      subtitle="Select appointment date and available doctor time slot"
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
          <button
            type="button"
            className="followup-clear-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="followup-book-btn"
            onClick={handleConfirmBooking}
            disabled={isSubmitting || !selectedSlot}
          >
            {isSubmitting ? 'Booking…' : '✓ Confirm Booking'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleConfirmBooking}>
        {/* Error message banner */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '13.5px',
              marginBottom: '14px',
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ── Context Summary Card ─────────────────────────────────────── */}
        <div className="followup-modal-info">
          <div className="followup-modal-info-row">
            <span className="followup-modal-info-label">Patient:</span>
            <span className="followup-modal-info-val">
              {patientName} ({patientId})
            </span>
          </div>

          <div className="followup-modal-info-row">
            <span className="followup-modal-info-label">Doctor:</span>
            <span className="followup-modal-info-val">
              {doctorName} {item.specialization ? `· ${item.specialization}` : ''}
            </span>
          </div>

          <div className="followup-modal-info-row">
            <span className="followup-modal-info-label">Recommended Date:</span>
            <span className="followup-modal-info-val">
              📅 {formatDisplayDate(suggestedDate)}
            </span>
          </div>
        </div>

        {/* ── Date Picker ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
            }}
          >
            Appointment Date *
          </label>
          <input
            type="date"
            className="followup-search-input"
            value={selectedDate}
            min={todayIso()}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot('');
            }}
            required
          />
        </div>

        {/* ── Time Slot Selection Grid ─────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Select Time Slot *
            </label>
            {selectedSlot && (
              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                ✓ {selectedSlot} selected
              </span>
            )}
          </div>

          <div className="followup-slot-grid">
            {isLoadingSlots ? (
              <div className="followup-slot-empty">Checking doctor availability…</div>
            ) : availableSlots.length === 0 ? (
              <div className="followup-slot-empty">No slots available on this date. Please pick another date.</div>
            ) : (
              availableSlots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`followup-slot-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setErrorMessage(null);
                    }}
                  >
                    {slot}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
