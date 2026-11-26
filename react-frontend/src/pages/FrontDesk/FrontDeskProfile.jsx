/**
 * FrontDeskProfile.jsx — Front Desk Staff Profile & Operational Assignment
 * =========================================================================
 * Location: src/pages/FrontDesk/FrontDeskProfile.jsx
 *
 * Powered by Redux Toolkit (`frontdeskProfileSlice` + `authSlice`).
 * Reuses shared profile styling (`UserProfile.css`) and `AlertBanner`.
 *
 * BACKEND PERMISSIONS NOTE:
 *  - GET /frontdesk/:userId is permitted for 'frontdesk' and 'admin' roles.
 *  - PUT /frontdesk/:userId is strictly restricted to 'admin' role only.
 *  - Front Desk staff counter assignments, shift timings, and reporting manager
 *    are managed by Branch Administrators, so this profile is strictly read-only.
 */

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchFrontdeskProfile,
  clearFrontdeskProfileError,
  selectFrontdeskProfile,
  selectFrontdeskProfileStatus,
  selectFrontdeskProfileError,
} from '../../store/slices/frontdesk/frontdeskProfileSlice';
import { resolveFrontdeskId } from '../../store/slices/frontdesk/frontdeskHelpers';
import { getInitials } from '../../utils/userHelpers';
import AlertBanner from '../../components/dashboard/AlertBanner';
import '../../components/profile/UserProfile.css';

const FRONTDESK_FIELDS = [
  { name: 'name', label: 'Staff Full Name' },
  { name: 'userId', label: 'Staff ID' },
  { name: 'email', label: 'Email Address', type: 'email' },
  { name: 'phone', label: 'Contact Phone', type: 'tel' },
  { name: 'gender', label: 'Gender' },
  { name: 'counter', label: 'Assigned Counter' },
  { name: 'shift', label: 'Shift Timings' },
  { name: 'languages', label: 'Languages Spoken' },
  { name: 'reportingManagerId', label: 'Reporting Manager ID' },
  { name: 'branchId', label: 'Branch Identifier', fullWidth: true },
];

/**
 * Formats raw Frontdesk profile data into friendly display strings:
 *  - Joins `languages` array into a comma-separated string.
 *  - Formats `shiftStart` and `shiftEnd` into a single shift string.
 *  - Prefixes numeric `counter` with "Counter ".
 */
function formatFrontdeskProfile(data) {
  if (!data) return null;

  const formattedLanguages = Array.isArray(data.languages)
    ? data.languages.join(', ') || '—'
    : data.languages || '—';

  let formattedShift = '—';
  if (data.shiftStart && data.shiftEnd) {
    formattedShift = `${data.shiftStart} - ${data.shiftEnd}`;
  } else if (data.shiftStart || data.shiftEnd) {
    formattedShift = data.shiftStart || data.shiftEnd;
  }

  const formattedCounter = data.counter
    ? String(data.counter).toLowerCase().startsWith('counter')
      ? data.counter
      : `Counter ${data.counter}`
    : '—';

  return {
    ...data,
    languages: formattedLanguages,
    shift: formattedShift,
    counter: formattedCounter,
  };
}

export default function FrontDeskProfile() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const rawProfile = useSelector(selectFrontdeskProfile);
  const loadStatus = useSelector(selectFrontdeskProfileStatus);
  const error = useSelector(selectFrontdeskProfileError);

  const frontdeskId = resolveFrontdeskId(user);
  const isLoading = loadStatus === 'loading';

  useEffect(() => {
    dispatch(fetchFrontdeskProfile(frontdeskId));
    return () => {
      dispatch(clearFrontdeskProfileError());
    };
  }, [dispatch, frontdeskId]);

  const profile = useMemo(() => formatFrontdeskProfile(rawProfile), [rawProfile]);

  function handleRetry() {
    dispatch(fetchFrontdeskProfile(frontdeskId));
  }

  const displayName = profile?.name || user?.name || 'User';
  const initials = getInitials(displayName);

  return (
    <div className="profile-container">
      {/* ── 1. HERO BANNER ────────────────────────────────────────── */}
      <div className="profile-banner">
        <div className="profile-banner-left">
          <div className="profile-avatar-lg">{initials}</div>
          <div>
            <h2>{displayName}</h2>
            <div>
              <span className="profile-banner-role">Front Desk</span>
              <span style={{ opacity: 0.85, fontSize: '13px' }}>
                ID: {profile?.userId || profile?.id || frontdeskId || '—'}
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
          onDismiss={() => dispatch(clearFrontdeskProfileError())}
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
            {FRONTDESK_FIELDS.map((field) => (
              <div
                key={field.name}
                className={`profile-field ${field.fullWidth ? 'full' : ''}`}
              >
                <label htmlFor={`field-${field.name}`}>{field.label}</label>
                <input
                  id={`field-${field.name}`}
                  name={field.name}
                  type={field.type || 'text'}
                  value={profile?.[field.name] || '—'}
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
