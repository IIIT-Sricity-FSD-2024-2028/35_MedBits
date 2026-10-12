/**
 * WalkInRegistration.jsx — Front Desk Walk-in Registration Page
 * ====================================================================
 * Connects with the MedBits NestJS backend API:
 *   - POST /walkins → Registers a new walk-in patient and generates Patient/Walk-in IDs
 *   - GET /walkins  → Lists all recent walk-in registrations
 *
 * Utilizes core reusable components: AppShell, ContentCard, and DataTable.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';

// Backend API URL (defaults to http://localhost:3000 if not specified in .env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const INITIAL_FORM_STATE = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  guardianName: '',
};

export default function WalkInRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form input state
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  // Recent registrations list state
  const [walkinsList, setWalkinsList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  /**
   * Helper: Calculates age in years from a date of birth string
   */
  const calculateAge = useCallback((dobStr) => {
    if (!dobStr) return '';
    let birthDate;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
      birthDate = new Date(dobStr);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dobStr)) {
      const [d, m, y] = dobStr.split('-').map(Number);
      birthDate = new Date(y, m - 1, d);
    } else {
      birthDate = new Date(dobStr);
    }
    if (Number.isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} yrs` : '';
  }, []);

  /**
   * Helper: Formats ISO date or DD-MM-YYYY for display in table
   */
  const formatDisplayDate = useCallback((dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }, []);

  /**
   * Fetch recent walk-in registrations from GET /walkins
   */
  const loadWalkIns = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/walkins`, {
        headers: {
          'Content-Type': 'application/json',
          role: user?.role || 'frontdesk',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load walk-ins (HTTP ${response.status})`);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];

      // Map raw backend walk-in objects to DataTable rows
      const mappedRows = list.map((item, index) => {
        const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Patient';
        const age = calculateAge(item.dob);

        return {
          id: item.id || `WALKIN-${index}`,
          registrationId: item.registrationId || item.id,
          patientName: fullName,
          contactPhone: item.phone || '—',
          contactEmail: item.email || '—',
          ageGender: [age, item.gender].filter(Boolean).join(' • ') || '—',
          gender: item.gender || '—',
          bloodGroup: item.bloodGroup || '—',
          guardianName: item.guardianName || 'None',
          createdAtFormatted: formatDisplayDate(item.createdAt),
          rawCreatedAt: item.createdAt,
        };
      });

      setWalkinsList(mappedRows);
    } catch (err) {
      console.error('Error loading walk-ins list:', err);
      setListError(err.message || 'Unable to connect to backend server on port 3000.');
    } finally {
      setIsLoadingList(false);
    }
  }, [user?.role, calculateAge, formatDisplayDate]);

  // Load walk-ins on mount
  useEffect(() => {
    loadWalkIns();
  }, [loadWalkIns]);

  /**
   * Form input change handler
   */
  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error as user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  /**
   * Form validation function
   */
  function validateForm() {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters.';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. patient@example.com).';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(formData.phone.trim().replace(/\D/g, ''))) {
      errors.phone = 'Phone number must be a 10-digit number.';
    }

    if (!formData.dob.trim()) {
      errors.dob = 'Date of birth is required.';
    }

    if (!formData.gender) {
      errors.gender = 'Please select a gender.';
    }

    if (!formData.bloodGroup) {
      errors.bloodGroup = 'Please select a blood group.';
    }

    return errors;
  }

  /**
   * Convert YYYY-MM-DD from <input type="date"> to DD-MM-YYYY
   * as expected by backend's WalkInsService.toIsoDate()
   */
  function formatDobForBackend(dobInput) {
    const trimmed = dobInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day}-${month}-${year}`;
    }
    return trimmed;
  }

  /**
   * Form submission handler
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessInfo(null);

    // Validate inputs
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim().replace(/\D/g, ''),
        dob: formatDobForBackend(formData.dob),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        guardianName: formData.guardianName.trim() || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/walkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: user?.role || 'frontdesk',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || `Registration failed (HTTP ${response.status})`);
      }

      // Success: display registered patient details
      setSuccessInfo({
        name: result.name || `${payload.firstName} ${payload.lastName}`,
        registrationId: result.registrationId || result.id || 'Registered',
        patientId: result.userId || result.patientId || result.id,
        phone: payload.phone,
        bloodGroup: payload.bloodGroup,
        gender: payload.gender,
      });

      // Reset form
      setFormData(INITIAL_FORM_STATE);
      setFormErrors({});

      // Refresh recent registrations list
      await loadWalkIns();
    } catch (err) {
      console.error('Walk-in registration error:', err);
      setSubmitError(err.message || 'Failed to complete walk-in registration. Please check the backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // DataTable column definitions for recent registrations
  const columns = [
    {
      key: 'registrationId',
      header: 'Reg ID',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#0284c7' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'contactPhone',
      header: 'Phone Number',
    },
    {
      key: 'contactEmail',
      header: 'Email Address',
      render: (val) => (
        <span style={{ color: '#64748b', fontSize: '13px' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'ageGender',
      header: 'Age / Gender',
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (val) => (
        <span
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'guardianName',
      header: 'Guardian',
      render: (val) => (
        <span style={{ color: val === 'None' ? '#94a3b8' : '#334155' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'createdAtFormatted',
      header: 'Registered At',
      render: (val) => (
        <span style={{ color: '#64748b', fontSize: '12px' }}>
          {val}
        </span>
      ),
    },
  ];

  return (
    <AppShell pageTitle="Walk-in Registration">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ── 1. SUCCESS NOTIFICATION BANNER ──────────────────────── */}
        {successInfo && (
          <div
            role="status"
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <div>
                  <h3 style={{ margin: 0, color: '#166534', fontSize: '16px', fontWeight: 700 }}>
                    Walk-in Patient Successfully Registered!
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#15803d', fontSize: '13px' }}>
                    Patient record created and walk-in token generated in the system.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  color: '#15803d',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                title="Dismiss message"
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                background: '#ffffff',
                border: '1px solid #dcfce7',
                borderRadius: '6px',
                padding: '12px 16px',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Patient Name
                </span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  {successInfo.name}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Registration ID
                </span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
                  {successInfo.registrationId}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Patient User ID
                </span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>
                  {successInfo.patientId}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Phone / Blood Group
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  {successInfo.phone} ({successInfo.bloodGroup})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => navigate('/front-desk/dashboard')}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Return to Dashboard
              </button>
              <button
                type="button"
                onClick={() => setSuccessInfo(null)}
                style={{
                  background: '#ffffff',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Register Another Patient
              </button>
            </div>
          </div>
        )}

        {/* ── 2. SUBMIT ERROR BANNER ──────────────────────────────── */}
        {submitError && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#991b1b', display: 'block', fontSize: '14px' }}>
                Registration Request Failed
              </strong>
              <span style={{ color: '#b91c1c', fontSize: '13px' }}>
                {submitError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#b91c1c',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── 3. PATIENT REGISTRATION FORM ─────────────────────────── */}
        <ContentCard
          title="New Walk-in Patient Registration"
          subtitle="Enter arriving patient details. The system will register the patient and assign a walk-in token."
        >
          <form onSubmit={handleSubmit} noValidate>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '24px',
              }}
            >
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  First Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="e.g. Rahul"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${formErrors.firstName ? '#dc2626' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {formErrors.firstName && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {formErrors.firstName}
                  </span>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Last Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="e.g. Sharma"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${formErrors.lastName ? '#dc2626' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {formErrors.lastName && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {formErrors.lastName}
                  </span>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Email Address <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. rahul.sharma@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${formErrors.email ? '#dc2626' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {formErrors.email && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {formErrors.email}
                  </span>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phone"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Phone Number (10 digits) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${formErrors.phone ? '#dc2626' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {formErrors.phone && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {formErrors.phone}
                  </span>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dob"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Date of Birth <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={formData.dob}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${formErrors.dob ? '#dc2626' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                />
                {formErrors.dob && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {formErrors.dob}
                  </span>
                )}
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Gender <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${formErrors.gender ? '#dc2626' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                >
                  <option value="">Select Gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.gender && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {formErrors.gender}
                  </span>
                )}
              </div>

              {/* Blood Group */}
              <div>
                <label
                  htmlFor="bloodGroup"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Blood Group <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: `1px solid ${formErrors.bloodGroup ? '#dc2626' : '#cbd5e1'}`,
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                >
                  <option value="">Select Blood Group...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
                {formErrors.bloodGroup && (
                  <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {formErrors.bloodGroup}
                  </span>
                )}
              </div>

              {/* Guardian Name (Optional) */}
              <div>
                <label
                  htmlFor="guardianName"
                  style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
                >
                  Guardian Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  id="guardianName"
                  name="guardianName"
                  type="text"
                  placeholder="e.g. Suresh Sharma"
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Form Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: isSubmitting ? '#93c5fd' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {/* <span>{isSubmitting ? '⏳' : '🚶'}</span> */}
                <span>{isSubmitting ? 'Registering Patient...' : 'Register Walk-in Patient'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData(INITIAL_FORM_STATE);
                  setFormErrors({});
                  setSubmitError(null);
                }}
                disabled={isSubmitting}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                Clear Form
              </button>
            </div>
          </form>
        </ContentCard>

        {/* ── 4. RECENT WALK-IN REGISTRATIONS TABLE ───────────────── */}
        <ContentCard
          title="Recent Walk-in Registrations"
          subtitle="All walk-in patients registered in the hospital system"
          action={
            <button
              type="button"
              onClick={loadWalkIns}
              disabled={isLoadingList}
              title="Refresh registrations from server"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                cursor: isLoadingList ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{isLoadingList ? '⏳' : '🔄'}</span>
              <span>{isLoadingList ? 'Refreshing...' : 'Refresh List'}</span>
            </button>
          }
        >
          {listError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '10px 16px',
                color: '#b91c1c',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              ⚠️ {listError}
            </div>
          )}

          <DataTable
            columns={columns}
            data={walkinsList}
            searchPlaceholder="Search by name, ID, phone, or blood group..."
            emptyMessage={
              isLoadingList
                ? 'Loading walk-in registrations from server...'
                : listError
                ? 'Unable to load registrations.'
                : 'No walk-in registrations found.'
            }
          />
        </ContentCard>

      </div>
    </AppShell>
  );
}
