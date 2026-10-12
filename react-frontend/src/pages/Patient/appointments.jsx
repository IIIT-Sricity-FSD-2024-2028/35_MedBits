/**
 * appointments.jsx — Patient Doctor Appointments & Booking Page
 * ================================================================
 * Location: src/pages/Patient/appointments.jsx
 *
 * Reuses AppointmentFilters, SpecialityCard, and BookingModal components
 * with clean, concise code for finding doctors, browsing specialties,
 * booking time slots, and managing upcoming/past visits.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import AppointmentFilters from '../../components/appointments/AppointmentFilters';
import SpecialityCard from '../../components/appointments/SpecialityCard';
import BookingModal from '../../components/appointments/BookingModal';
import StatusBadge from '../../components/common/StatusBadge';
import './appointments.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function PatientAppointments() {
  const { user } = useAuth();
  const userId = user?.id;

  // Filter state
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [doctorName, setDoctorName] = useState('');

  // Data state
  const [doctors, setDoctors] = useState([]);
  const [userAppointments, setUserAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Initial data load effect
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const docUrl = selectedBranch
          ? `${API_BASE_URL}/doctors?branchId=${encodeURIComponent(selectedBranch)}`
          : `${API_BASE_URL}/doctors`;

        const [docRes, apptRes] = await Promise.all([
          fetch(docUrl, { headers: { role: 'patient' } }),
          userId
            ? fetch(`${API_BASE_URL}/appointments/user/${encodeURIComponent(userId)}`, {
                headers: { role: 'patient' },
              })
            : Promise.resolve(null),
        ]);

        if (docRes && docRes.ok && isMounted) {
          const docData = await docRes.json();
          setDoctors(Array.isArray(docData) ? docData : []);
        }

        if (apptRes && apptRes.ok && isMounted) {
          const apptData = await apptRes.json();
          setUserAppointments(Array.isArray(apptData) ? apptData : []);
        }
      } catch (err) {
        console.error('Failed to load appointment data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, userId]);

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

  // Helper to reload patient appointments after booking or cancel
  async function refreshUserAppointments() {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/user/${encodeURIComponent(userId)}`, {
        headers: { role: 'patient' },
      });
      if (res.ok) {
        const data = await res.json();
        setUserAppointments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to reload appointments:', err);
    }
  }

  // Handle booking confirmation from BookingModal
  async function handleConfirmBooking({ doctor, date, slot }) {
    if (!userId) return;
    setIsSubmitting(true);
    setStatusMessage(null);

    const payload = {
      userId,
      doctorId: doctor.id || doctor.userId,
      branchId: doctor.branchId || selectedBranch || undefined,
      date,
      slot,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: 'patient',
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to book appointment.');
      }

      setStatusMessage({ type: 'success', text: `Appointment booked with ${doctor.name} on ${formatDate(date)} at ${slot}!` });
      setBookingDoctor(null);
      await refreshUserAppointments();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Unable to book appointment.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Cancel an upcoming appointment
  async function handleCancelAppointment(appointmentId) {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}`, {
        method: 'DELETE',
        headers: { role: 'patient', 'x-user-id': userId },
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Appointment cancelled successfully.' });
        await refreshUserAppointments();
      }
    } catch (_err) {
      setStatusMessage({ type: 'error', text: 'Unable to cancel appointment.' });
    }
  }

  return (
    <AppShell pageTitle="Appointments">
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
          selectedBranch={selectedBranch}
          selectedSpeciality={selectedSpeciality}
          selectedDate={selectedDate}
          doctorName={doctorName}
          onBranchChange={(branchId) => {
            setSelectedBranch(branchId);
            setSelectedSpeciality('');
          }}
          onSpecialityChange={(spec) => setSelectedSpeciality(spec)}
          onDateChange={(date) => setSelectedDate(date)}
          onDoctorNameChange={(name) => setDoctorName(name)}
          onReset={() => {
            setSelectedBranch('');
            setSelectedSpeciality('');
            setSelectedDate('');
            setDoctorName('');
          }}
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
                        onClick={() => setBookingDoctor(doc)}
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
                    setSelectedSpeciality(clickedSpec === selectedSpeciality ? '' : clickedSpec);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 5. Reusable Booking Modal */}
        <BookingModal
          isOpen={Boolean(bookingDoctor)}
          doctor={bookingDoctor}
          initialDate={selectedDate}
          isBooking={isSubmitting}
          onClose={() => setBookingDoctor(null)}
          onConfirm={handleConfirmBooking}
        />

      </div>
    </AppShell>
  );
}
