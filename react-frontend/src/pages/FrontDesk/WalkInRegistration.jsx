/**
 * WalkInRegistration.jsx — Front Desk Walk-in Registration Page
 * ====================================================================
 * Powered by Redux Toolkit (`walkInSlice` + `authSlice`).
 * Connects with the MedBits NestJS backend API:
 *   - POST /walkins → Registers a new walk-in patient and generates Patient/Walk-in IDs
 *   - GET /walkins  → Lists all recent walk-in registrations
 *
 * Utilizes core reusable components: ContentCard, DataTable, AlertBanner,
 * WalkInRegistrationForm, and RegistrationSuccessCard.
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchWalkIns,
  registerWalkIn,
  updateWalkInField,
  setWalkInFormErrors,
  resetWalkInForm,
  clearWalkInSuccess,
  clearWalkInSubmitError,
  selectWalkInState,
} from '../../store/slices/frontdesk/walkInSlice';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';
import AlertBanner from '../../components/dashboard/AlertBanner';
import WalkInRegistrationForm from './components/WalkInRegistrationForm';
import RegistrationSuccessCard from './components/RegistrationSuccessCard';

export default function WalkInRegistration() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const {
    walkins,
    formData,
    formErrors,
    listStatus,
    listError,
    submitStatus,
    submitError,
    successInfo,
  } = useSelector(selectWalkInState);

  const isLoadingList = listStatus === 'loading';
  const isSubmitting = submitStatus === 'loading';
  const userId = user?.id;

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

  const loadWalkIns = useCallback(() => {
    dispatch(fetchWalkIns());
  }, [dispatch]);

  useEffect(() => {
    loadWalkIns();
    return () => {
      dispatch(clearWalkInSubmitError());
      dispatch(clearWalkInSuccess());
    };
  }, [loadWalkIns, dispatch, userId]);

  const walkinsList = useMemo(
    () =>
      walkins.map((item, index) => {
        const fullName =
          `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown Patient';
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
      }),
    [walkins, calculateAge, formatDisplayDate]
  );

  function handleInputChange(e) {
    const { name, value } = e.target;
    dispatch(updateWalkInField({ name, value }));
  }

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

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(clearWalkInSubmitError());
    dispatch(clearWalkInSuccess());

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      dispatch(setWalkInFormErrors(errors));
      return;
    }

    dispatch(registerWalkIn(formData));
  }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── 1. SUCCESS NOTIFICATION BANNER ──────────────────────── */}
      <RegistrationSuccessCard
        successInfo={successInfo}
        onDismiss={() => dispatch(clearWalkInSuccess())}
        onRegisterAnother={() => dispatch(clearWalkInSuccess())}
        onReturnToDashboard={() => navigate('/front-desk/dashboard')}
      />

      {/* ── 2. SUBMIT ERROR BANNER ──────────────────────────────── */}
      {submitError && (
        <AlertBanner
          type="error"
          title="Registration Request Failed"
          message={submitError}
          onDismiss={() => dispatch(clearWalkInSubmitError())}
        />
      )}

      {/* ── 3. PATIENT REGISTRATION FORM ─────────────────────────── */}
      <WalkInRegistrationForm
        formData={formData}
        formErrors={formErrors}
        isSubmitting={isSubmitting}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onClear={() => dispatch(resetWalkInForm())}
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
            onRetry={loadWalkIns}
            isRetrying={isLoadingList}
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
  );
}
