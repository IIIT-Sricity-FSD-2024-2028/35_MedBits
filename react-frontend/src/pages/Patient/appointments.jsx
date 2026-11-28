/**
 * appointments.jsx — Patient Doctor Appointments & Booking Page
 * ================================================================
 * Location: src/pages/Patient/appointments.jsx
 *
 * Powered by Redux Toolkit (`patientAppointmentsSlice` + `authSlice`).
 * Reuses AppointmentFilters, SpecialityCard, and BookingModal components.
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchBranches,
  fetchDoctors,
  fetchUserAppointments,
  fetchDoctorAvailableSlots,
  bookPatientAppointment,
  cancelPatientAppointment,
  setSelectedBranch,
  setSelectedSpeciality,
  setSelectedDate,
  setDoctorName,
  resetFilters,
  openBookingModal,
  closeBookingModal,
  setBookingDate,
  setBookingSlot,
  clearAppointmentStatus,
  selectAppointmentBranches,
  selectAppointmentDoctors,
  selectUserAppointments,
  selectSelectedBranch,
  selectSelectedSpeciality,
  selectSelectedDate,
  selectDoctorNameFilter,
  selectDoctorsStatus,
  selectDoctorAvailableSlots,
  selectDoctorSlotsStatus,
  selectDoctorSlotsError,
  selectIsSubmittingAppointment,
  selectBookingDoctor,
  selectBookingDate,
  selectBookingSlot,
  selectAppointmentStatusMessage,
} from '../../store/slices/patient/patientAppointmentsSlice';
import AppointmentFilters from '../../components/appointments/AppointmentFilters';
import SpecialityCard from '../../components/appointments/SpecialityCard';
import BookingModal from '../../components/appointments/BookingModal';
import StatusBadge from '../../components/common/StatusBadge';
import './appointments.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function PatientAppointments() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const userId = user?.id;

  const branches = useSelector(selectAppointmentBranches);
  const doctors = useSelector(selectAppointmentDoctors);
  const userAppointments = useSelector(selectUserAppointments);
  const selectedBranch = useSelector(selectSelectedBranch);
  const selectedSpeciality = useSelector(selectSelectedSpeciality);
  const selectedDate = useSelector(selectSelectedDate);
  const doctorName = useSelector(selectDoctorNameFilter);
  const doctorsStatus = useSelector(selectDoctorsStatus);
  const availableSlots = useSelector(selectDoctorAvailableSlots);
  const slotsStatus = useSelector(selectDoctorSlotsStatus);
  const slotsError = useSelector(selectDoctorSlotsError);
  const isSubmitting = useSelector(selectIsSubmittingAppointment);
  const bookingDoctor = useSelector(selectBookingDoctor);
  const bookingDate = useSelector(selectBookingDate);
  const bookingSlot = useSelector(selectBookingSlot);
  const statusMessage = useSelector(selectAppointmentStatusMessage);

  const isLoading = doctorsStatus === 'loading';

  // Fetch branches once and clean up transient UI state on unmount
  useEffect(() => {
    dispatch(fetchBranches());
    return () => {
      dispatch(clearAppointmentStatus());
      dispatch(closeBookingModal());
    };
  }, [dispatch]);

  // Fetch doctors whenever selected branch changes
  useEffect(() => {
    dispatch(fetchDoctors(selectedBranch));
  }, [dispatch, selectedBranch]);

  // Fetch patient appointments when userId is available
  useEffect(() => {
    if (userId) {
      dispatch(fetchUserAppointments(userId));
    }
  }, [dispatch, userId]);

  // Fetch available doctor slots via Redux whenever modal opens or booking date changes
  useEffect(() => {
    const doctorId = bookingDoctor?.id || bookingDoctor?.userId;
    if (doctorId && bookingDate) {
      dispatch(fetchDoctorAvailableSlots({ doctorId, date: bookingDate }));
    }
  }, [dispatch, bookingDoctor, bookingDate]);

  // Derived filtered doctors
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedSpeciality && doc.specialization !== selectedSpeciality) return false;
    if (doctorName && !doc.name.toLowerCase().includes(doctorName.toLowerCase())) return false;
    return true;
  });

  // Unique specialties for browsing
  const uniqueSpecialties = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))].sort();

  // Upcoming and completed appointments
  const upcomingAppointments = userAppointments.filter((a) => a.status === 'upcoming');
  const pastAppointments = userAppointments.filter((a) => a.status === 'completed');

  function handleConfirmBooking({ doctor, date, slot }) {
    if (!userId) return;
    dispatch(bookPatientAppointment({ doctor, date, slot }));
  }

  function handleCancelAppointment(appointmentId) {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    dispatch(cancelPatientAppointment(appointmentId));
  }

  return (
    <div className="appt-container">
      {/* Status notification alert */}
      {statusMessage && (
        <div className={`appt-alert ${statusMessage.type}`}>
          <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. Reusable Search Filters & Dropdowns */}
      <AppointmentFilters
        branches={branches}
        specialities={uniqueSpecialties}
        selectedBranch={selectedBranch}
        selectedSpeciality={selectedSpeciality}
        selectedDate={selectedDate}
        doctorName={doctorName}
        onBranchChange={(branchId) => dispatch(setSelectedBranch(branchId))}
        onSpecialityChange={(spec) => dispatch(setSelectedSpeciality(spec))}
        onDateChange={(date) => dispatch(setSelectedDate(date))}
        onDoctorNameChange={(name) => dispatch(setDoctorName(name))}
        onReset={() => dispatch(resetFilters())}
      />

      {/* 2. Available Doctors List */}
      <div className="appt-card">
        <div className="appt-section-header">
          <h3 className="appt-section-title">
            <span>🩺</span>
            <span>Available Doctors ({filteredDoctors.length})</span>
          </h3>
        </div>

        {isLoading ? (
          <p className="appt-empty-msg">Loading doctors list...</p>
        ) : filteredDoctors.length === 0 ? (
          <p className="appt-empty-msg">No doctors match your selected filters. Try broadening your criteria.</p>
        ) : (
          <div className="doc-list">
            {filteredDoctors.map((doc) => {
              const initial = (doc.name || 'D').replace(/^Dr\.\s*/i, '').charAt(0) || 'D';
              const feeText = doc.consultationFee ? `Rs ${Number(doc.consultationFee).toLocaleString()}` : 'Rs 1,200.00';

              return (
                <div key={doc.id || doc.userId} className="doc-card">
                  <div className="doc-info">
                    <div className="doc-avatar">{initial}</div>
                    <div>
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-sub">{doc.specialization} {doc.qualification ? `• ${doc.qualification}` : ''}</div>
                      {doc.experience && <div className="doc-sub2">{doc.experience} yrs experience</div>}
                    </div>
                  </div>

                  <div className="doc-actions">
                    <div className="doc-fee">{feeText}</div>
                    <button
                      type="button"
                      className="btn-book-doc"
                      onClick={() => dispatch(openBookingModal(doc))}
                    >
                      Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Upcoming & Past Appointments (Two-column) */}
      <div className="appt-two-col">
        {/* Upcoming */}
        <div className="appt-card">
          <div className="appt-section-header">
            <h3 className="appt-section-title">Upcoming Appointments ({upcomingAppointments.length})</h3>
          </div>
          {upcomingAppointments.length === 0 ? (
            <p className="appt-empty-msg">No upcoming appointments scheduled.</p>
          ) : (
            upcomingAppointments.map((appt) => (
              <div key={appt.id} className="appt-list-item">
                <div className="appt-list-info">
                  <div className="appt-list-doc">{appt.doctor?.name || `Doctor ID: ${appt.doctorId}`}</div>
                  <div className="appt-list-meta">
                    📅 {formatDate(appt.date)} • 🕒 {appt.slot}
                  </div>
                </div>
                <div className="appt-list-actions">
                  <StatusBadge status="upcoming" label="Upcoming" />
                  <button
                    type="button"
                    className="btn-cancel-appt"
                    onClick={() => handleCancelAppointment(appt.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Past */}
        <div className="appt-card">
          <div className="appt-section-header">
            <h3 className="appt-section-title">Past Appointments ({pastAppointments.length})</h3>
          </div>
          {pastAppointments.length === 0 ? (
            <p className="appt-empty-msg">No completed appointments found.</p>
          ) : (
            pastAppointments.map((appt) => (
              <div key={appt.id} className="appt-list-item">
                <div className="appt-list-info">
                  <div className="appt-list-doc">{appt.doctor?.name || `Doctor ID: ${appt.doctorId}`}</div>
                  <div className="appt-list-meta">
                    📅 {formatDate(appt.date)} • 🕒 {appt.slot}
                  </div>
                </div>
                <StatusBadge status="completed" label="Completed" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Browse by Specialty */}
      {uniqueSpecialties.length > 0 && (
        <div className="appt-card">
          <div className="appt-section-header">
            <h3 className="appt-section-title">
              <span>✨</span>
              <span>Browse by Specialty</span>
            </h3>
          </div>
          <div className="cat-grid">
            {uniqueSpecialties.map((spec) => (
              <SpecialityCard
                key={spec}
                speciality={spec}
                isSelected={selectedSpeciality === spec}
                onClick={(clickedSpec) => {
                  dispatch(
                    setSelectedSpeciality(clickedSpec === selectedSpeciality ? '' : clickedSpec)
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Reusable Booking Modal */}
      <BookingModal
        key={bookingDoctor?.id || bookingDoctor?.userId || 'closed'}
        isOpen={Boolean(bookingDoctor)}
        doctor={bookingDoctor}
        initialDate={bookingDate}
        slots={availableSlots}
        selectedSlot={bookingSlot}
        isLoadingSlots={slotsStatus === 'loading'}
        slotError={slotsError}
        isBooking={isSubmitting}
        onDateChange={(date) => dispatch(setBookingDate(date))}
        onSlotSelect={(slot) => dispatch(setBookingSlot(slot))}
        onClose={() => dispatch(closeBookingModal())}
        onConfirm={handleConfirmBooking}
      />
    </div>
  );
}
