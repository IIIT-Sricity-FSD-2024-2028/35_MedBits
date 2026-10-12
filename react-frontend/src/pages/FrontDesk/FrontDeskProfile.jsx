/**
 * FrontDeskProfile.jsx — Front Desk Staff Profile & Operational Assignment
 * =========================================================================
 * Location: src/pages/FrontDesk/FrontDeskProfile.jsx
 *
 * Utilizes the shared <UserProfile> component configured for the Front Desk role.
 *
 * BACKEND PERMISSIONS NOTE:
 *  - GET /frontdesk/:userId is permitted for 'frontdesk' and 'admin' roles.
 *  - PUT /frontdesk/:userId is strictly restricted to 'admin' role only.
 *  - Front Desk staff counter assignments, shift timings, and reporting manager
 *    are managed by Branch Administrators, so this profile is strictly read-only.
 *  - Therefore, `saveUrl` is omitted (null) to prevent unauthorized updates.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import UserProfile from '../../components/profile/UserProfile';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FrontDeskProfile() {
  const { user } = useAuth();

  const frontdeskFields = [
    { name: 'name', label: 'Staff Full Name', readOnlyAlways: true },
    { name: 'userId', label: 'Staff ID', readOnlyAlways: true },
    { name: 'email', label: 'Email Address', type: 'email', readOnlyAlways: true },
    { name: 'phone', label: 'Contact Phone', type: 'tel', readOnlyAlways: true },
    { name: 'gender', label: 'Gender', readOnlyAlways: true },
    { name: 'counter', label: 'Assigned Counter', readOnlyAlways: true },
    { name: 'shift', label: 'Shift Timings', readOnlyAlways: true },
    { name: 'languages', label: 'Languages Spoken', readOnlyAlways: true },
    { name: 'reportingManagerId', label: 'Reporting Manager ID', readOnlyAlways: true },
    { name: 'branchId', label: 'Branch Identifier', fullWidth: true, readOnlyAlways: true },
  ];

  /**
   * Transforms raw backend entity data into friendly display strings:
   *  - Joins the `languages` array into a readable comma-separated string.
   *  - Formats `shiftStart` and `shiftEnd` into a single combined shift string.
   *  - Prefixes `counter` number with "Counter " if numeric.
   */
  function transformDataOnLoad(data) {
    if (!data) return data;

    const formattedLanguages = Array.isArray(data.languages)
      ? data.languages.join(', ')
      : (data.languages || '—');

    let formattedShift = '—';
    if (data.shiftStart && data.shiftEnd) {
      formattedShift = `${data.shiftStart} - ${data.shiftEnd}`;
    } else if (data.shiftStart || data.shiftEnd) {
      formattedShift = data.shiftStart || data.shiftEnd;
    }

    const formattedCounter = data.counter
      ? (String(data.counter).toLowerCase().startsWith('counter') ? data.counter : `Counter ${data.counter}`)
      : '—';

    return {
      ...data,
      languages: formattedLanguages,
      shift: formattedShift,
      counter: formattedCounter,
    };
  }

  return (
    <UserProfile
      pageTitle="Front Desk Profile"
      roleLabel="Front Desk"
      fetchUrl={user?.id ? `${API_BASE_URL}/frontdesk/${encodeURIComponent(user.id)}` : null}
      saveUrl={null}
      requestRole="frontdesk"
      fields={frontdeskFields}
      transformDataOnLoad={transformDataOnLoad}
    />
  );
}
