/**
 * frontdeskHelpers.js — Shared Helpers for Frontdesk Redux Slices
 * ====================================================================
 * Location: src/store/slices/frontdesk/frontdeskHelpers.js
 *
 * Centralizes Frontdesk user identity resolution, request user construction,
 * apiClient integration, and shared display/date helpers.
 */

import { apiFetch } from '../../../api/apiClient';

/**
 * Resolves the Frontdesk userId for backend requests.
 * Maps the offline demo ID 'FRONTDESK_001' (used in Login.jsx) to the
 * seeded backend user ID 'FD001'.
 */
export function resolveFrontdeskId(user) {
  const rawId = (user?.id || user?.userId || '').trim();
  if (!rawId || rawId.toUpperCase() === 'FRONTDESK_001') {
    return 'FD001';
  }
  return rawId;
}

/**
 * Builds the request user object passed to apiFetch so every Frontdesk
 * request sends `role: frontdesk` and `x-user-id: <resolvedFrontdeskId>`.
 */
export function getFrontdeskRequestUser(state) {
  const user = state?.auth?.user || null;
  return {
    ...(user || {}),
    role: 'frontdesk',
    id: resolveFrontdeskId(user),
  };
}

/**
 * Extracts a clean error message from an apiFetch error.
 */
export function extractErrorMessage(err, fallback = 'Request failed') {
  const raw = err?.message || '';
  if (!raw) return fallback;
  const colonIdx = raw.indexOf(': ');
  if (colonIdx !== -1 && raw.startsWith('API Error ')) {
    return raw.slice(colonIdx + 2) || raw;
  }
  return raw;
}

/**
 * Wrapper around apiFetch that attaches a readable resource label on failure.
 */
export async function fetchFrontdeskResource(path, user, label) {
  try {
    return await apiFetch(path, { user });
  } catch (err) {
    const detail = extractErrorMessage(err, 'Request failed');
    throw new Error(label ? `${label} (${detail})` : detail);
  }
}

/**
 * Returns today's date in local YYYY-MM-DD format.
 */
export function todayLocalISO() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extracts a patient's display name from a queue/appointment record.
 */
export function getPatientDisplayName(record, fallback = 'Patient') {
  if (!record) return fallback;
  if (record.patient?.name) return record.patient.name;
  if (record.patient?.firstName) {
    return `${record.patient.firstName} ${record.patient.lastName || ''}`.trim();
  }
  return record.patientName || record.userId || fallback;
}
