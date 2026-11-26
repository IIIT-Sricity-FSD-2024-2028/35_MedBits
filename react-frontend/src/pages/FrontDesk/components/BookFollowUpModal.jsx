/**
 * BookFollowUpModal.jsx — Front Desk Follow-Up & Referral Booking Dialog
 * ==============================================================================
 * Powered by Redux Toolkit (`followUpReferralSlice`).
 * WHAT THIS COMPONENT DOES:
 *  1. Displays full context of the selected referral or follow-up.
 *  2. Allows front desk staff to confirm or adjust the appointment date.
 *  3. Queries live doctor slot availability via Redux (`fetchFollowUpSlots`).
 *  4. Lets staff click a time slot chip to select it.
 *  5. Submits booking and referral status update via `bookFollowUpOrReferral`.
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFollowUpSlots,
  bookFollowUpOrReferral,
  setFollowUpModalError,
  selectFollowUpReferralState,
} from '../../../store/slices/frontdesk/followUpReferralSlice';
import { todayLocalISO } from '../../../store/slices/frontdesk/frontdeskHelpers';
import Modal from '../../../components/common/Modal';

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

export default function BookFollowUpModal({ isOpen, onClose, item }) {
  const dispatch = useDispatch();
  const {
    availableSlots,
    slotsStatus,
    slotsError,
    isSubmitting,
    modalError,
  } = useSelector(selectFollowUpReferralState);

  const today = todayLocalISO();
  const targetDoctorId = item?.toDoctorId || item?.doctorId || '';
  const patientId = item?.patientId || item?.userId || '';
  const patientName = item?.patientName || item?.patient || patientId || 'Patient';
  const doctorName = item?.toDoctorName || item?.doctorName || item?.doctor || 'Doctor';
  const suggestedDate = item?.followUpDate || item?.preferredDate || item?.date || today;
  const initialDate = suggestedDate && suggestedDate >= today ? suggestedDate : today;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState('');

  const isLoadingSlots = slotsStatus === 'loading';

  useEffect(() => {
    if (isOpen && targetDoctorId && selectedDate) {
      dispatch(fetchFollowUpSlots({ doctorId: targetDoctorId, date: selectedDate }));
    }
  }, [isOpen, targetDoctorId, selectedDate, dispatch]);

  const handleConfirmBooking = (e) => {
    e.preventDefault();

    if (!selectedDate) {
      dispatch(setFollowUpModalError('Please choose an appointment date.'));
      return;
    }
    if (!selectedSlot) {
      dispatch(setFollowUpModalError('Please select an available time slot.'));
      return;
    }

    dispatch(setFollowUpModalError(null));
    dispatch(
      bookFollowUpOrReferral({
        item,
        date: selectedDate,
        slot: selectedSlot,
      })
    );
  };

  if (!item) return null;

  const displayError = modalError || slotsError;

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
        {displayError && (
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
            ⚠️ {displayError}
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
            min={today}
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
              <div className="followup-slot-empty">
                No slots available on this date. Please pick another date.
              </div>
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
                      dispatch(setFollowUpModalError(null));
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
