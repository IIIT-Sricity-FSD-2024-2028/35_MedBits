/**
 * DoctorProfile.jsx — Doctor Professional Profile & Clinical Settings
 * ====================================================================
 * Powered by Redux Toolkit (`doctorProfileSlice` + `authSlice`).
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchDoctorProfile,
  updateDoctorProfile,
  startEditing,
  cancelEditing,
  updateEditField,
  clearProfileStatus,
  selectDoctorProfile,
  selectDoctorEditForm,
  selectDoctorIsEditing,
  selectDoctorProfileStatus,
  selectDoctorProfileSaveStatus,
  selectDoctorProfileMessage,
} from '../../store/slices/doctor/doctorProfileSlice';
import { resolveDoctorId } from '../../store/slices/doctor/doctorHelpers';
import AlertBanner from '../../components/dashboard/AlertBanner';
import '../../components/profile/UserProfile.css';

const DOCTOR_FIELDS = [
  { name: 'name', label: 'Doctor Full Name', required: true },
  { name: 'specialization', label: 'Specialization (e.g. Cardiologist)', required: true },
  { name: 'department', label: 'Department' },
  { name: 'qualification', label: 'Qualification (e.g. MBBS, MD)' },
  { name: 'experience', label: 'Years of Experience', type: 'number' },
  { name: 'licenseNo', label: 'Medical License Number' },
  { name: 'phone', label: 'Contact Phone', type: 'tel' },
  { name: 'email', label: 'Email Address', type: 'email', required: true },
  { name: 'consultationFee', label: 'Consultation Fee (₹)', type: 'number' },
  {
    name: 'gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female', 'Other'],
  },
  { name: 'bio', label: 'Professional Biography / Summary', type: 'textarea', fullWidth: true },
];

export default function DoctorProfile() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const profile = useSelector(selectDoctorProfile);
  const editForm = useSelector(selectDoctorEditForm);
  const isEditing = useSelector(selectDoctorIsEditing);
  const loadStatus = useSelector(selectDoctorProfileStatus);
  const saveStatus = useSelector(selectDoctorProfileSaveStatus);
  const statusMessage = useSelector(selectDoctorProfileMessage);

  const doctorId = resolveDoctorId(user);
  const isLoading = loadStatus === 'loading';
  const isSaving = saveStatus === 'loading';

  useEffect(() => {
    dispatch(fetchDoctorProfile(doctorId));
    return () => {
      dispatch(cancelEditing());
    };
  }, [dispatch, doctorId]);

  function handleRetry() {
    dispatch(fetchDoctorProfile(doctorId));
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    dispatch(updateEditField({ name, value }));
  }

  function handleStartEditing() {
    dispatch(startEditing());
  }

  function handleCancelEditing() {
    dispatch(cancelEditing());
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    dispatch(updateDoctorProfile({ formData: editForm }));
  }

  const displayName = profile?.name || user?.name || 'Doctor';

  const initials =
    displayName
      .replace(/^Dr\.?\s+/i, '')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'D';

  function renderField(field) {
    const isReadOnlyField = !isEditing;
    const value = isEditing ? editForm[field.name] ?? '' : profile?.[field.name] ?? '—';

    if (field.type === 'select') {
      return isEditing ? (
        <select
          id={`field-${field.name}`}
          name={field.name}
          value={editForm[field.name] ?? ''}
          onChange={handleInputChange}
          required={field.required}
        >
          <option value="" disabled>
            Select {field.label}
          </option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input id={`field-${field.name}`} type="text" value={profile?.[field.name] || '—'} readOnly />
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          id={`field-${field.name}`}
          name={field.name}
          value={value}
          onChange={handleInputChange}
          readOnly={isReadOnlyField}
          placeholder={field.placeholder || ''}
          rows={3}
        />
      );
    }

    return (
      <input
        id={`field-${field.name}`}
        name={field.name}
        // A read-only number input cannot display the '—' placeholder.
        type={!isEditing && field.type === 'number' ? 'text' : field.type || 'text'}
        min={field.type === 'number' ? 0 : undefined}
        value={value}
        onChange={handleInputChange}
        readOnly={isReadOnlyField}
        placeholder={field.placeholder || ''}
        required={isEditing && field.required}
      />
    );
  }

  return (
    <div className="profile-container">
      {/* ── 1. HERO BANNER ────────────────────────────────────────── */}
      <div className="profile-banner">
        <div className="profile-banner-left">
          <div className="profile-avatar-lg">{initials}</div>
          <div>
            <h2>{displayName}</h2>
            <div>
              <span className="profile-banner-role">Doctor</span>
              <span style={{ opacity: 0.85, fontSize: '13px' }}>
                ID: {profile?.id || profile?.userId || doctorId || '—'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-profile-edit"
          onClick={isEditing ? handleCancelEditing : handleStartEditing}
          disabled={!profile}
        >
          {isEditing ? '✕ Cancel' : '✎ Edit Profile'}
        </button>
      </div>

      {/* Status notification alert */}
      {statusMessage && (
        <AlertBanner
          type={statusMessage.type}
          message={statusMessage.text}
          onRetry={statusMessage.type === 'error' ? handleRetry : undefined}
          onDismiss={() => dispatch(clearProfileStatus())}
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* ── 2. EDITABLE PROFILE CARD ─────────────────────────────── */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h3 className="profile-card-title">Personal & Professional Information</h3>
          <span className="profile-card-badge">{isEditing ? 'Editing Mode' : 'Read-Only View'}</span>
        </div>

        {isLoading ? (
          <p style={{ color: '#64748b', padding: '24px 0', textAlign: 'center' }}>
            Loading profile details from backend...
          </p>
        ) : (
          <form onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              {DOCTOR_FIELDS.map((field) => (
                <div key={field.name} className={`profile-field ${field.fullWidth ? 'full' : ''}`}>
                  <label htmlFor={`field-${field.name}`}>{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* ── 3. SAVE / CANCEL BUTTONS ───────────────────────── */}
            {isEditing && (
              <div className="profile-actions-row">
                <button
                  type="button"
                  className="btn-cancel-profile"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save-profile" disabled={isSaving}>
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
