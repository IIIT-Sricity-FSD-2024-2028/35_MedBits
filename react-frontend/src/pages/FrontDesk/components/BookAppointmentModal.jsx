/**
 * BookAppointmentModal.jsx — Front Desk Schedule New Appointment Dialog
 * =========================================================================
 * Full booking modal allowing front desk staff to:
 *   1. Search and select an existing patient (with fallback link to Walk-in Registration).
 *   2. Select hospital branch and doctor (filtered by branch/specialty).
 *   3. Pick consultation date and select from live doctor time slots.
 *   4. Submit the booking to POST /appointments with frontdesk credentials.
 *
 * PROPS:
 *  @param {boolean} isOpen     - Whether the modal is open
 *  @param {function} onClose   - Dismiss modal handler
 *  @param {function} onSuccess - Callback invoked on successful appointment creation
 *  @param {string} apiBaseUrl  - Backend API base URL
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../../components/common/Modal';
import FormField from '../../../components/common/FormField';
import AlertBanner from '../../../components/dashboard/AlertBanner';

const todayIso = () => new Date().toISOString().split('T')[0];

export default function BookAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  apiBaseUrl = 'http://localhost:3000',
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data sources
  const [patients, setPatients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  // Selection state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedSlot, setSelectedSlot] = useState('');

  // UI state
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPatientSearchQuery('');
      setSelectedPatient(null);
      setSelectedDoctorId('');
      setSelectedDate(todayIso());
      setSelectedSlot('');
      setSubmitError(null);
      setSlots([]);
    }
  }, [isOpen]);

  // Load patients and branches on modal mount
  useEffect(() => {
    if (!isOpen) return;

    const loadInitialData = async () => {
      setIsLoadingPatients(true);
      try {
        const headers = {
          'Content-Type': 'application/json',
          role: user?.role || 'frontdesk',
        };

        const [patientsRes, branchesRes] = await Promise.all([
          fetch(`${apiBaseUrl}/patients`, { headers }),
          fetch(`${apiBaseUrl}/hospital-branches`, { headers }).catch(() => null),
        ]);

        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setPatients(Array.isArray(patientsData) ? patientsData : []);
        }

        if (branchesRes && branchesRes.ok) {
          const branchesData = await branchesRes.json();
          const branchList = Array.isArray(branchesData) ? branchesData : [];
          setBranches(branchList);
          if (branchList.length > 0 && !selectedBranchId) {
            setSelectedBranchId(branchList[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load initial booking data:', err);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    loadInitialData();
  }, [isOpen, apiBaseUrl, user, selectedBranchId]);

  // Load doctors filtered by selected branch
  useEffect(() => {
    if (!isOpen) return;

    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const url = selectedBranchId
          ? `${apiBaseUrl}/doctors?branchId=${encodeURIComponent(selectedBranchId)}`
          : `${apiBaseUrl}/doctors`;

        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            role: user?.role || 'frontdesk',
          },
        });

        if (res.ok) {
          const docsData = await res.json();
          setDoctors(Array.isArray(docsData) ? docsData : []);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [isOpen, selectedBranchId, apiBaseUrl, user]);

  // Load available doctor slots when doctor and date are chosen
  const loadSlots = useCallback(
    async (doctorId, date) => {
      if (!doctorId || !date) {
        setSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      try {
        const res = await fetch(
          `${apiBaseUrl}/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              role: user?.role || 'frontdesk',
            },
          },
        );

        if (res.ok) {
          const slotsData = await res.json();
          setSlots(Array.isArray(slotsData) ? slotsData : []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        console.error('Failed to load doctor slots:', err);
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [apiBaseUrl, user],
  );

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      loadSlots(selectedDoctorId, selectedDate);
    } else {
      setSlots([]);
    }
  }, [selectedDoctorId, selectedDate, loadSlots]);

  // Filtered patients for search auto-suggest
  const filteredPatients = patients.filter((pat) => {
    if (!patientSearchQuery.trim()) return false;
    const q = patientSearchQuery.toLowerCase();
    const fullName = `${pat.firstName || ''} ${pat.lastName || ''}`.toLowerCase();
    const phone = pat.phone || '';
    const userId = (pat.userId || pat.id || '').toLowerCase();
    return fullName.includes(q) || phone.includes(q) || userId.includes(q);
  });

  const selectedDoctor = doctors.find((doc) => (doc.userId || doc.id) === selectedDoctorId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedPatient) {
      setSubmitError('Please select a patient before booking.');
      return;
    }
    if (!selectedDoctorId) {
      setSubmitError('Please select an attending doctor.');
      return;
    }
    if (!selectedDate) {
      setSubmitError('Please select an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setSubmitError('Please choose an available time slot.');
      return;
    }

    const effectiveBranchId =
      selectedDoctor?.branchId ||
      selectedBranchId ||
      branches[0]?.id ||
      '00000000-0000-4000-8000-000000000001';

    const staffId = user?.id || user?.userId || 'frontdesk';

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: user?.role || 'frontdesk',
          'x-user-id': staffId,
        },
        body: JSON.stringify({
          userId: selectedPatient.userId || selectedPatient.id,
          doctorId: selectedDoctorId,
          branchId: effectiveBranchId,
          date: selectedDate,
          slot: selectedSlot,
          source: 'frontdesk',
          bookedBy: staffId,
          frontdeskId: staffId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to book appointment. Please verify details.');
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while booking the appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        style={{
          padding: '9px 18px',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          color: '#334155',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedPatient || !selectedDoctorId || !selectedSlot}
        style={{
          padding: '9px 20px',
          fontSize: '14px',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          cursor: isSubmitting || !selectedPatient || !selectedDoctorId || !selectedSlot ? 'not-allowed' : 'pointer',
          opacity: isSubmitting || !selectedPatient || !selectedDoctorId || !selectedSlot ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book New Appointment"
      subtitle="Schedule an outpatient consultation for an existing patient."
      footer={modalFooter}
      maxWidth="620px"
    >
      {submitError && <AlertBanner message={submitError} type="error" style={{ marginBottom: '18px' }} />}

      <form onSubmit={handleSubmit}>
        {/* ── STEP 1: PATIENT SELECTION ── */}
        <div style={{ marginBottom: '22px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '6px',
            }}
          >
            Patient <span style={{ color: '#dc2626' }}>*</span>
          </label>

          {selectedPatient ? (
            /* Selected Patient Card */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              <div>
                <strong style={{ color: '#166534', fontSize: '14.5px', display: 'block' }}>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </strong>
                <span style={{ color: '#15803d', fontSize: '12px' }}>
                  ID: {selectedPatient.userId || selectedPatient.id} | Phone: {selectedPatient.phone || '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientSearchQuery('');
                }}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#15803d',
                  backgroundColor: '#ffffff',
                  border: '1px solid #bbf7d0',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Change
              </button>
            </div>
          ) : (
            /* Patient Search Input & Auto-suggest Dropdown */
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={isLoadingPatients ? 'Loading patient list...' : 'Search by patient name, phone, or ID...'}
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                disabled={isLoadingPatients || isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />

              {/* Suggestions Dropdown */}
              {patientSearchQuery.trim() && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    maxHeight: '190px',
                    overflowY: 'auto',
                    zIndex: 20,
                  }}
                >
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((pat) => (
                      <div
                        key={pat.userId || pat.id}
                        onClick={() => {
                          setSelectedPatient(pat);
                          setPatientSearchQuery('');
                        }}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          fontSize: '13.5px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      >
                        <strong style={{ color: '#0f172a' }}>
                          {pat.firstName} {pat.lastName}
                        </strong>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          ID: {pat.userId || pat.id} | Phone: {pat.phone}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b' }}>
                      No matching patient found.
                    </div>
                  )}
                </div>
              )}

              {/* Helpful fallback trigger for new patients */}
              <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#64748b' }}>
                First-time patient?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/front-desk/walkin');
                  }}
                  style={{
                    color: '#0284c7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  Register as Walk-in here →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── STEP 2: BRANCH & DOCTOR SELECTION ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: branches.length > 1 ? '1fr 1fr' : '1fr',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          {branches.length > 1 && (
            <FormField
              label="Hospital Branch"
              name="branchId"
              type="select"
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setSelectedDoctorId('');
                setSelectedSlot('');
              }}
              options={branches.map((b) => ({ value: b.id, label: b.branchName }))}
              disabled={isSubmitting}
            />
          )}

          <FormField
            label="Doctor"
            name="doctorId"
            type="select"
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              setSelectedSlot('');
            }}
            placeholder={isLoadingDoctors ? 'Loading doctors...' : 'Select a doctor...'}
            options={doctors.map((d) => ({
              value: d.userId || d.id,
              label: `Dr. ${d.name} (${d.specialization})`,
            }))}
            required
            disabled={isLoadingDoctors || isSubmitting}
          />
        </div>

        {/* ── STEP 3: DATE & TIME SLOTS ── */}
        <div style={{ marginBottom: '20px' }}>
          <FormField
            label="Consultation Date"
            name="appointmentDate"
            type="date"
            value={selectedDate}
            min={todayIso()}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot('');
            }}
            required
            disabled={isSubmitting}
          />
        </div>

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

          {!selectedDoctorId ? (
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
              Please select a doctor to view available time slots.
            </div>
          ) : isLoadingSlots ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
              Fetching available slots for Dr. {selectedDoctor?.name}...
            </div>
          ) : slots.length === 0 ? (
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
              No available slots found for Dr. {selectedDoctor?.name} on {selectedDate}. Please select another date.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                gap: '8px',
                maxHeight: '170px',
                overflowY: 'auto',
                padding: '4px',
              }}
            >
              {slots.map((slot) => {
                const isSelected = slot === selectedSlot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#1e293b',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {slot}
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
