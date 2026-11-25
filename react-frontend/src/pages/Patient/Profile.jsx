/**
 * Profile.jsx — Patient Personal Profile & Account Details
 * ====================================================================
 * Powered by Redux Toolkit (`patientProfileSlice` + `authSlice`).
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchPatientProfile,
  updatePatientProfile,
  startEditing,
  cancelEditing,
  updateEditField,
  clearProfileStatus,
  selectPatientProfile,
  selectPatientEditForm,
  selectPatientIsEditing,
  selectPatientProfileStatus,
  selectPatientProfileSaveStatus,
  selectPatientProfileMessage,
} from '../../store/slices/patient/patientProfileSlice';
import AlertBanner from '../../components/dashboard/AlertBanner';
import '../../components/profile/UserProfile.css';

const PATIENT_FIELDS = [
  { name: 'firstName', label: 'First Name', required: true },
  { name: 'lastName', label: 'Last Name', required: true },
  { name: 'dob', label: 'Date Of Birth', placeholder: 'YYYY-MM-DD' },
  {
    name: 'gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female', 'Other'],
  },
  { name: 'bloodGroup', label: 'Blood Group', placeholder: 'e.g. O+, A+, B+' },
  { name: 'phone', label: 'Phone Number', type: 'tel' },
  { name: 'email', label: 'Email Address', type: 'email', fullWidth: true, required: true },
  { name: 'guardianName', label: "Guardian's Name", placeholder: 'Parent / Guardian Name', fullWidth: true },
];

export default function PatientProfile() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const profile = useSelector(selectPatientProfile);
  const editForm = useSelector(selectPatientEditForm);
  const isEditing = useSelector(selectPatientIsEditing);
  const loadStatus = useSelector(selectPatientProfileStatus);
  const saveStatus = useSelector(selectPatientProfileSaveStatus);
  const statusMessage = useSelector(selectPatientProfileMessage);

  const userId = user?.id;
  const isLoading = loadStatus === 'loading';
  const isSaving = saveStatus === 'loading';

  useEffect(() => {
    if (userId) {
      dispatch(fetchPatientProfile(userId));
    }
    return () => {
      dispatch(cancelEditing());
    };
  }, [dispatch, userId]);

  function handleRetry() {
    if (userId) {
      dispatch(fetchPatientProfile(userId));
    }
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
    if (!user?.id) return;
    dispatch(updatePatientProfile({ patientId: user.id, formData: editForm }));
  }

  const displayName =
    profile?.name ||
    (profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`.trim()
      : user?.name || 'User');

  const initials = (
    (profile?.firstName?.[0] || profile?.name?.[0] || user?.name?.[0] || 'U') +
    (profile?.lastName?.[0] || '')
  ).toUpperCase();

  return (
    <div className="profile-container">
      {/* ── 1. HERO BANNER ────────────────────────────────────────── */}
      <div className="profile-banner">
        <div className="profile-banner-left">
          <div className="profile-avatar-lg">{initials}</div>
          <div>
            <h2>{displayName}</h2>
            <div>
              <span className="profile-banner-role">Patient</span>
              <span style={{ opacity: 0.85, fontSize: '13px' }}>
                ID: {profile?.userId || profile?.id || user?.id || '—'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-profile-edit"
          onClick={isEditing ? handleCancelEditing : handleStartEditing}
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
          <span className="profile-card-badge">
            {isEditing ? 'Editing Mode' : 'Read-Only View'}
          </span>
        </div>

        {isLoading ? (
          <p style={{ color: '#64748b', padding: '24px 0', textAlign: 'center' }}>
            Loading profile details from backend...
          </p>
        ) : (
          <form onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              {PATIENT_FIELDS.map((field) => {
                const isReadOnlyField = !isEditing;
                const value = isEditing
                  ? editForm[field.name] ?? ''
                  : profile?.[field.name] ?? '—';

                return (
                  <div
                    key={field.name}
                    className={`profile-field ${field.fullWidth ? 'full' : ''}`}
                  >
                    <label htmlFor={`field-${field.name}`}>{field.label}</label>

                    {field.type === 'select' ? (
                      isEditing ? (
                        <select
                          id={`field-${field.name}`}
                          name={field.name}
                          value={editForm[field.name] ?? ''}
                          onChange={handleInputChange}
                          required={field.required}
                        >
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`field-${field.name}`}
                          type="text"
                          value={profile?.[field.name] ?? '—'}
                          readOnly
                        />
                      )
                    ) : (
                      <input
                        id={`field-${field.name}`}
                        name={field.name}
                        type={field.type || 'text'}
                        value={value}
                        onChange={handleInputChange}
                        readOnly={isReadOnlyField}
                        placeholder={field.placeholder || ''}
                        required={isEditing && field.required}
                      />
                    )}
                  </div>
                );
              })}
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
                <button
                  type="submit"
                  className="btn-save-profile"
                  disabled={isSaving}
                >
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
