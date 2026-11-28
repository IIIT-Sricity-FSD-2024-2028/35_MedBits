/**
 * doctorHelpers.js — Shared helpers for the doctor Redux slices
 * ====================================================================
 * Location: src/store/slices/doctor/doctorHelpers.js
 *
 * Pure functions reused by every doctor slice so the id mapping, request
 * identity and patient normalisation logic lives in one place.
 */

import { apiFetch } from '../../../api/apiClient';

/**
 * Resolves the doctor id for the logged-in user. The demo user DOCTOR_001
 * maps to the seeded DOC001 record.
 */
export function resolveDoctorId(user) {
  return user?.doctorId || (user?.id === 'DOCTOR_001' ? 'DOC001' : user?.id) || 'DOC001';
}

/**
 * Builds the identity passed to apiFetch for doctor requests, so every call
 * sends `role: doctor` and `x-user-id: <doctorId>`.
 */
export function getDoctorRequestUser(state) {
  const user = state.auth.user;
  return { ...user, role: 'doctor', id: resolveDoctorId(user) };
}

/**
 * GETs a list endpoint and returns the array, or `null` when the request fails
 * or the response is not an array. Lets a thunk load several endpoints at once
 * and keep whatever succeeded (same behaviour as Promise.allSettled before).
 */
export async function fetchListOrNull(path, user) {
  try {
    const data = await apiFetch(path, { user });
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

/** Extracts a clean user-facing error message from an apiFetch error. */
export function extractDoctorError(err, fallback = 'Request failed') {
  const raw = err?.message || '';
  if (!raw) return fallback;
  const colonIdx = raw.indexOf(': ');
  if (colonIdx !== -1 && raw.startsWith('API Error ')) {
    return raw.slice(colonIdx + 2) || raw;
  }
  return raw;
}

/** Normalises a patient record from any source to { id, userId, name, firstName, lastName }. */
export function normalizePatient(p) {
  const id = p.userId || p.id || p.patientId || '';
  const firstName = p.firstName || '';
  const lastName = p.lastName || '';
  const name = p.name || `${firstName} ${lastName}`.trim() || id;
  return {
    ...p,
    userId: id,
    id,
    firstName: firstName || name.split(' ')[0] || '',
    lastName: lastName || name.split(' ').slice(1).join(' ') || '',
    name,
  };
}

/** Extracts { patientId, patientName } from an appointment object. */
export function getAppointmentPatient(appt) {
  const patientId =
    appt.userId || appt.patientId || appt.patient?.userId || appt.patient?.id || '';
  const patientName =
    appt.patient?.name ||
    (appt.patient ? `${appt.patient.firstName || ''} ${appt.patient.lastName || ''}`.trim() : '') ||
    appt.patientName ||
    patientId;
  return { patientId, patientName };
}

/**
 * Merges patients found in the doctor's appointments with the /patients list.
 * Records from /patients win because they carry the full profile.
 */
export function buildPatientList(appointments = [], apiPatients = []) {
  const patientMap = new Map();

  appointments.forEach((appt) => {
    const { patientId, patientName } = getAppointmentPatient(appt);
    if (patientId && !patientMap.has(patientId)) {
      patientMap.set(patientId, normalizePatient({ userId: patientId, name: patientName }));
    }
  });

  apiPatients.forEach((p) => {
    const norm = normalizePatient(p);
    if (norm.userId) patientMap.set(norm.userId, norm);
  });

  return Array.from(patientMap.values());
}

/** Today's date as YYYY-MM-DD. */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}
