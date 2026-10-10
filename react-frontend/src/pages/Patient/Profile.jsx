/**
 * Profile.jsx — Patient Personal Profile & Account Details
 * ====================================================================
 * Location: src/pages/patient/Profile.jsx
 *
 * FEATURES:
 *  - Fetches live patient record from GET /patients/:userId
 *  - Displays personal demographics, contact info, and guardian details
 *  - In-place profile editing with PUT /patients/:userId
 *  - Synchronizes updated name and email with global AuthContext
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import './Profile.css';

// Backend API URL from environment or local port 3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Profile() {
  const { user, login } = useAuth();

  // ── STATE: Patient profile and editing mode ───────────────────────
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // ── DATA FETCHING: Load patient record from backend ───────────────
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setStatusMessage(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/patients/${encodeURIComponent(user.id)}`,
          {
            headers: {
              role: 'patient',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        if (isMounted) {
          setProfile(data);
          setEditForm(data);
        }
      } catch {
        if (isMounted) {
          setStatusMessage({
            type: 'error',
            text: 'Unable to load profile data from the backend server.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // ── HANDLERS: Form input changes & editing toggle ─────────────────
  function handleInputChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleStartEditing() {
    setEditForm(profile || {});
    setIsEditing(true);
    setStatusMessage(null);
  }

  function handleCancelEditing() {
    setEditForm(profile || {});
    setIsEditing(false);
    setStatusMessage(null);
  }

  // ── API SAVE: Update patient profile on the backend ───────────────
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      firstName: editForm.firstName?.trim() || '',
      lastName: editForm.lastName?.trim() || '',
      dob: editForm.dob?.trim() || '',
      gender: editForm.gender?.trim() || '',
      bloodGroup: editForm.bloodGroup?.trim() || '',
      phone: editForm.phone?.trim() || '',
      email: editForm.email?.trim() || '',
      guardianName: editForm.guardianName?.trim() || '',
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/patients/${encodeURIComponent(user.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            role: 'patient',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Update global AuthContext user session with new name/email
      login({
        ...user,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        name: `${updatedProfile.firstName} ${updatedProfile.lastName}`.trim(),
        email: updatedProfile.email,
      });

    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Unable to update profile. Please ensure the backend is running.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Generate patient avatar initials
  const initials = (
    (profile?.firstName?.[0] || user?.name?.[0] || 'P') +
    (profile?.lastName?.[0] || '')
  ).toUpperCase();

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.name || 'Patient';

  return (
    <AppShell pageTitle="Patient Profile">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── 1. PROFILE HERO BANNER ────────────────────────────────── */}
        <div className="profile-banner">
          <div className="profile-banner-left">
            <div className="profile-avatar-lg">{initials}</div>
            <div>
              <h2>{fullName}</h2>
              <p>Patient ID: {profile?.userId || user?.id || '—'}</p>
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
          <div className={`profile-alert ${statusMessage.type}`}>
            {statusMessage.type === 'success' ? '✓' : '⚠️'} {statusMessage.text}
          </div>
        )}

        {/* ── 2. PERSONAL INFORMATION FORM CARD ─────────────────────── */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3 className="profile-card-title">Personal Information</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              {isEditing ? 'Editing Mode' : 'Read-Only View'}
            </span>
          </div>

          {isLoading ? (
            <p style={{ color: '#64748b', padding: '24px 0', textAlign: 'center' }}>
              Loading patient details from backend...
            </p>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-grid">

                {/* First Name */}
                <div className="profile-field">
                  <label htmlFor="pf-firstName">First Name</label>
                  <input
                    id="pf-firstName"
                    name="firstName"
                    type="text"
                    value={isEditing ? editForm.firstName || '' : profile?.firstName || '—'}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    required
                  />
                </div>

                {/* Last Name */}
                <div className="profile-field">
                  <label htmlFor="pf-lastName">Last Name</label>
                  <input
                    id="pf-lastName"
                    name="lastName"
                    type="text"
                    value={isEditing ? editForm.lastName || '' : profile?.lastName || '—'}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    required
                  />
                </div>

                {/* Date Of Birth */}
                <div className="profile-field">
                  <label htmlFor="pf-dob">Date Of Birth</label>
                  <input
                    id="pf-dob"
                    name="dob"
                    type="text"
                    placeholder="YYYY-MM-DD"
                    value={isEditing ? editForm.dob || '' : profile?.dob || '—'}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>

                {/* Gender */}
                <div className="profile-field">
                  <label htmlFor="pf-gender">Gender</label>
                  {isEditing ? (
                    <select
                      id="pf-gender"
                      name="gender"
                      value={editForm.gender || 'Female'}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <input
                      id="pf-gender"
                      type="text"
                      value={profile?.gender || '—'}
                      readOnly
                    />
                  )}
                </div>

                {/* Blood Group */}
                <div className="profile-field">
                  <label htmlFor="pf-blood">Blood Group</label>
                  <input
                    id="pf-blood"
                    name="bloodGroup"
                    type="text"
                    placeholder="e.g. O+, A+, B+"
                    value={isEditing ? editForm.bloodGroup || '' : profile?.bloodGroup || '—'}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>

                {/* Phone Number */}
                <div className="profile-field">
                  <label htmlFor="pf-phone">Phone Number</label>
                  <input
                    id="pf-phone"
                    name="phone"
                    type="tel"
                    value={isEditing ? editForm.phone || '' : profile?.phone || '—'}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>

                {/* Email Address */}
                <div className="profile-field full">
                  <label htmlFor="pf-email">Email Address</label>
                  <input
                    id="pf-email"
                    name="email"
                    type="email"
                    value={isEditing ? editForm.email || '' : profile?.email || '—'}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    required
                  />
                </div>

                {/* Guardian's Name */}
                <div className="profile-field full">
                  <label htmlFor="pf-guardian">Guardian's Name</label>
                  <input
                    id="pf-guardian"
                    name="guardianName"
                    type="text"
                    placeholder="Parent / Guardian Name"
                    value={isEditing ? editForm.guardianName || '' : profile?.guardianName || '—'}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                  />
                </div>

              </div>

              {/* ── 3. SAVE / CANCEL BUTTONS (Visible during edit mode) ── */}
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
    </AppShell>
  );
}
