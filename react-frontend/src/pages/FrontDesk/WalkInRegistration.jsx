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
import AlertBanner from '../../components/dashboard/AlertBanner';
import WalkInRegistrationForm from './components/WalkInRegistrationForm';
import RegistrationSuccessCard from './components/RegistrationSuccessCard';

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
        <RegistrationSuccessCard
          successInfo={successInfo}
          onDismiss={() => setSuccessInfo(null)}
          onRegisterAnother={() => setSuccessInfo(null)}
          onReturnToDashboard={() => navigate('/front-desk/dashboard')}
        />

        {/* ── 2. SUBMIT ERROR BANNER ──────────────────────────────── */}
        {submitError && (
          <AlertBanner
            type="error"
            title="Registration Request Failed"
            message={submitError}
            onDismiss={() => setSubmitError(null)}
          />
        )}

        {/* ── 3. PATIENT REGISTRATION FORM ─────────────────────────── */}
        <WalkInRegistrationForm
          formData={formData}
          formErrors={formErrors}
          isSubmitting={isSubmitting}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          onClear={() => {
            setFormData(INITIAL_FORM_STATE);
            setFormErrors({});
            setSubmitError(null);
          }}
        />


        {/* ── 4. RECENT WALK-IN REGISTRATIONS TABLE ───────────────── */}
        <ContentCard
          title="Recent Walk-in Registrations"
          subtitle="All walk-in patients registered in the hospital system"
          action={
            <button
              type="button"
              className="btn-card-refresh"
              onClick={loadWalkIns}
              disabled={isLoadingList}
              title="Refresh registrations from server"
            >
              <span>{isLoadingList ? '⏳' : '🔄'}</span>
              <span>{isLoadingList ? 'Refreshing...' : 'Refresh List'}</span>
            </button>
          }
        >
          {listError && (
            <AlertBanner
              type="error"
              message={listError}
              style={{ marginBottom: '16px' }}
            />
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
