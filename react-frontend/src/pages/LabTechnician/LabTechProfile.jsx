/**
 * LabTechProfile.jsx — Lab Technician Profile & Operational Assignment
 * ==============================================================================
 * Powered by Redux Toolkit (`labTechProfileSlice` + `authSlice`).
 * Reuses shared profile styling (`UserProfile.css`) and `AlertBanner`.
 *
 * NOTE:
 *  - Lab Technician accounts and branch assignments are managed by Branch Administrators.
 *  - This profile is read-only.
 * ==============================================================================
 */

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  clearLabTechProfileError,
  fetchLabTechBranch,
  selectLabTechBranchName,
  selectLabTechProfileError,
  selectLabTechProfileStatus,
} from '../../store/slices/labTech/labTechProfileSlice';
import { getInitials } from '../../utils/userHelpers';
import AlertBanner from '../../components/dashboard/AlertBanner';
import '../../components/profile/UserProfile.css';

const LAB_TECH_FIELDS = [
  { name: 'name', label: 'Full Name' },
  { name: 'userId', label: 'Technician ID' },
  { name: 'email', label: 'Email Address', type: 'email' },
  { name: 'phone', label: 'Contact Phone', type: 'tel' },
  { name: 'gender', label: 'Gender' },
  { name: 'roleLabel', label: 'System Role' },
  { name: 'department', label: 'Department' },
  { name: 'status', label: 'Account Status' },
  { name: 'branchName', label: 'Hospital Branch' },
  { name: 'branchId', label: 'Branch Identifier', fullWidth: true },
];

export default function LabTechProfile() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const branchName = useSelector(selectLabTechBranchName);
  const loadStatus = useSelector(selectLabTechProfileStatus);
  const error = useSelector(selectLabTechProfileError);

  const branchId = user?.branchId || '00000000-0000-4000-8000-000000000001';
  const isLoading = loadStatus === 'loading';

  // Fetch branch details to display friendly branch name alongside branchId
  useEffect(() => {
    if (!branchId) return undefined;
    dispatch(fetchLabTechBranch(branchId));
    return () => {
      dispatch(clearLabTechProfileError());
    };
  }, [dispatch, branchId]);

  const profileData = useMemo(
    () => ({
      name: user?.name || 'Lab Technician',
      userId: user?.userId || user?.id || 'LABTECH_001',
      id: user?.userId || user?.id || 'LABTECH_001',
      email: user?.email || 'labtech@medbits.com',
      phone: user?.phone || '9876543210',
      gender: user?.gender || 'Male',
      roleLabel: 'Lab Technician',
      department: 'Clinical Pathology & Diagnostic Laboratory',
      status: 'Active',
      branchName: branchName || 'Main Branch',
      branchId,
    }),
    [user, branchName, branchId]
  );

  const displayName = profileData.name;
  const initials = getInitials(displayName);

  function handleRetry() {
    if (branchId) {
      dispatch(fetchLabTechBranch(branchId));
    }
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
              <span className="profile-banner-role">Lab Technician</span>
              <span style={{ opacity: 0.85, fontSize: '13px' }}>
                ID: {profileData.userId || profileData.id || '—'}
              </span>
            </div>
          </div>
        </div>

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
      </div>

      {/* Status notification alert */}
      {error && (
        <AlertBanner
          type="error"
          message={error}
          onRetry={handleRetry}
          isRetrying={isLoading}
          onDismiss={() => dispatch(clearLabTechProfileError())}
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* ── 2. READ-ONLY PROFILE CARD ────────────────────────────── */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h3 className="profile-card-title">Personal &amp; Professional Information</h3>
          <span className="profile-card-badge">Administrative Record</span>
        </div>

        {isLoading ? (
          <p style={{ color: '#64748b', padding: '24px 0', textAlign: 'center' }}>
            Loading profile details from backend...
          </p>
        ) : (
          <div className="profile-form-grid">
            {LAB_TECH_FIELDS.map((field) => (
              <div
                key={field.name}
                className={`profile-field ${field.fullWidth ? 'full' : ''}`}
              >
                <label htmlFor={`field-${field.name}`}>{field.label}</label>
                <input
                  id={`field-${field.name}`}
                  name={field.name}
                  type={field.type || 'text'}
                  value={profileData[field.name] || '—'}
                  readOnly
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
