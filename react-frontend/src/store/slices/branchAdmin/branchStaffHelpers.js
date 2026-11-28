/**
 * branchStaffHelpers.js — Shared helpers for Branch Admin staff Redux slices
 * ==============================================================================
 * Centralizes request-user scoping, error extraction, form state builders,
 * reducer field helpers, and shared save flow across Branch Admin slices.
 */

import { apiFetch } from '../../../api/apiClient';
import { parseTime24 } from '../../../pages/BranchAdmin/utils/staffHelpers';

export const DOCTOR_TIME_PRESETS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

export function buildDoctorFormData(doctor = null) {
  return {
    name: doctor?.name || '',
    email: doctor?.email || '',
    password: '',
    specialization: doctor?.specialization || '',
    department: doctor?.department || '',
    qualification: doctor?.qualification || '',
    experience: doctor?.experience ?? '',
    consultationFee: doctor?.consultationFee ?? '',
    percentageCut: doctor?.percentageCut ?? '',
    age: doctor?.age ?? '',
    gender: doctor?.gender || '',
    phone: doctor?.phone || '',
    licenseNo: doctor?.licenseNo || '',
    bio: doctor?.bio || '',
    slots: Array.isArray(doctor?.slots) ? [...doctor.slots] : [],
    branchId: doctor?.branchId || '',
  };
}

export function buildFrontDeskFormData(staff = null) {
  return {
    name: staff?.name || '',
    email: staff?.email || '',
    password: '',
    phone: staff?.phone || '',
    gender: staff?.gender || '',
    counter: staff?.counter || '',
    shiftStart: parseTime24(staff?.shiftStart || ''),
    shiftEnd: parseTime24(staff?.shiftEnd || ''),
    reportingManagerId: staff?.reportingManagerId || '',
    languages: Array.isArray(staff?.languages) ? [...staff.languages] : [],
    branchId: staff?.branchId || '',
  };
}

export function buildLabTechFormData(tech = null) {
  return {
    name: tech?.name || '',
    email: tech?.email || '',
    password: '',
    phone: tech?.phone || '',
    gender: tech?.gender || '',
    branchId: tech?.branchId || '',
  };
}

export function applyStaffFormFieldUpdate(state, { name, value }) {
  state.formData[name] = value;
  if (state.formErrors[name]) {
    state.formErrors[name] = null;
  }
  state.saveError = null;
}

export function getBranchAdminRequestUser(getState) {
  const user = getState().auth.user;
  return { ...user, role: user?.role || 'branch_admin' };
}

export function extractBranchErrorDetail(err, fallback) {
  const raw = err?.message || '';
  const detail = raw.includes(': ') ? raw.split(': ').slice(1).join(': ') : raw;
  return detail || fallback;
}

/**
 * Creates or updates a branch staff record via apiFetch and refreshes the roster.
 */
export async function saveBranchStaffMember({
  basePath,
  id,
  payload,
  user,
  dispatch,
  refreshThunk,
}) {
  const isEdit = Boolean(id);
  const endpoint = isEdit ? `${basePath}/${encodeURIComponent(id)}` : basePath;
  const saved = await apiFetch(endpoint, {
    user,
    method: isEdit ? 'PUT' : 'POST',
    body: payload,
  });
  await dispatch(refreshThunk());
  return saved;
}
