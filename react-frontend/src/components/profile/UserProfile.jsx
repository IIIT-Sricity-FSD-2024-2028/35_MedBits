/**
 * UserProfile.jsx — Shared Generic Profile Component
 * ====================================================================
 * Location: src/components/profile/UserProfile.jsx
 *
 * Can be configured and used across ALL user roles:
 *  - Patient
 *  - Doctor
 *  - Front Desk
 *  - Lab Technician
 *
 * PROPS:
 *  - pageTitle: string (Title shown in AppShell navbar)
 *  - roleLabel: string (Display badge text e.g. "Doctor", "Patient")
 *  - fetchUrl: string (Full URL or path to GET user profile)
 *  - saveUrl: string (Full URL or path to PUT/update user profile)
 *  - requestRole: string (Role header sent to backend RBAC guard)
 *  - fields: Array of field definitions:
 *      {
 *        name: string,
 *        label: string,
 *        type?: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea',
 *        placeholder?: string,
 *        options?: string[], // if type === 'select'
 *        fullWidth?: boolean,
 *        required?: boolean,
 *        readOnlyAlways?: boolean,
 *      }
 *  - transformDataOnLoad?: (data) => formattedData (optional hook)
 *  - transformDataOnSave?: (formData) => payload (optional hook)
 *  - onSaveSuccess?: (updatedData) => void (callback for e.g. updating AuthContext)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../layout/AppShell';
import AlertBanner from '../dashboard/AlertBanner';
import './UserProfile.css';

export default function UserProfile({
  pageTitle = 'Profile',
  roleLabel = 'User',
  fetchUrl,
  saveUrl,
  requestRole,
  fields = [],
  transformDataOnLoad,
  transformDataOnSave,
  onSaveSuccess,
}) {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  // ── Fetch Profile ────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!fetchUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setStatusMessage(null);

      try {
        const response = await fetch(fetchUrl, {
          headers: {
            role: requestRole || user?.role || 'patient',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        const finalData = transformDataOnLoad ? transformDataOnLoad(data) : data;

        if (isMounted) {
          setProfile(finalData);
          setEditForm(finalData);
        }
      } catch (err) {
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
  }, [fetchUrl, requestRole, user?.role, transformDataOnLoad, reloadKey]);

  // ── Input Changes ────────────────────────────────────────────────
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

  // ── Save Updates ─────────────────────────────────────────────────
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!saveUrl) return;

    setIsSaving(true);
    setStatusMessage(null);

    const payload = transformDataOnSave ? transformDataOnSave(editForm) : editForm;

    try {
      const response = await fetch(saveUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          role: requestRole || user?.role || 'patient',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const updated = await response.json();
      const finalUpdated = transformDataOnLoad ? transformDataOnLoad(updated) : updated;

      setProfile(finalUpdated);
      setEditForm(finalUpdated);
      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });

      if (onSaveSuccess) {
        onSaveSuccess(finalUpdated);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Unable to update profile. Please ensure the backend server is running.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Initials generator
  const displayName = profile?.name || 
    (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user?.name || 'User');

  const initials = (
    (profile?.firstName?.[0] || profile?.name?.[0] || user?.name?.[0] || 'U') +
    (profile?.lastName?.[0] || '')
  ).toUpperCase();

  return (
    <AppShell pageTitle={pageTitle}>
      <div className="profile-container">

        {/* ── 1. HERO BANNER ────────────────────────────────────────── */}
        <div className="profile-banner">
          <div className="profile-banner-left">
            <div className="profile-avatar-lg">{initials}</div>
            <div>
              <h2>{displayName}</h2>
              <div>
                <span className="profile-banner-role">{roleLabel}</span>
                <span style={{ opacity: 0.85, fontSize: '13px' }}>ID: {profile?.userId || profile?.id || user?.id || '—'}</span>
              </div>
            </div>
          </div>

          {saveUrl ? (
            <button
              type="button"
              className="btn-profile-edit"
              onClick={isEditing ? handleCancelEditing : handleStartEditing}
            >
              {isEditing ? '✕ Cancel' : '✎ Edit Profile'}
            </button>
          ) : (
            <span
              style={{
                fontSize: '13px',
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 500,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              Administrative Record
            </span>
          )}
        </div>

        {/* Status notification alert */}
        {statusMessage && (
          <AlertBanner
            type={statusMessage.type}
            message={statusMessage.text}
            onRetry={statusMessage.type === 'error' ? handleRetry : undefined}
            onDismiss={() => setStatusMessage(null)}
            style={{ marginBottom: '20px' }}
          />
        )}

        {/* ── 2. EDITABLE PROFILE CARD ─────────────────────────────── */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h3 className="profile-card-title">Personal & Professional Information</h3>
            <span className="profile-card-badge">
              {saveUrl ? (isEditing ? 'Editing Mode' : 'Read-Only View') : 'Administrative Record'}
            </span>
          </div>

          {isLoading ? (
            <p style={{ color: '#64748b', padding: '24px 0', textAlign: 'center' }}>
              Loading profile details from backend...
            </p>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-grid">
                {fields.map((field) => {
                  const isReadOnlyField = field.readOnlyAlways || !isEditing;
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
                        isEditing && !field.readOnlyAlways ? (
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
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={`field-${field.name}`}
                          name={field.name}
                          value={isEditing ? editForm[field.name] ?? '' : profile?.[field.name] ?? '—'}
                          onChange={handleInputChange}
                          readOnly={isReadOnlyField}
                          placeholder={field.placeholder || ''}
                          rows={3}
                        />
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
    </AppShell>
  );
}
