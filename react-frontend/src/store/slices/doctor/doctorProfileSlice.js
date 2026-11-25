/**
 * doctorProfileSlice.js — Doctor Profile State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/doctor/doctorProfileSlice.js
 *
 * Manages the authenticated doctor's professional profile state:
 *   - `profile`       — fetched doctor profile object
 *   - `editForm`      — controlled draft values while editing
 *   - `isEditing`     — boolean toggle for edit mode
 *   - `status`        — 'idle' | 'loading' | 'succeeded' | 'failed' (fetch state)
 *   - `saveStatus`    — 'idle' | 'loading' | 'succeeded' | 'failed' (save state)
 *   - `statusMessage` — { type: 'success' | 'error', text: string } | null
 *
 * API:
 *   GET /doctors/:doctorId  — accepts either the doctor id or the userId
 *   PUT /doctors/:userId    — looks the doctor up by userId only
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout, updateUserProfile } from '../authSlice';

const LOAD_ERROR = 'Unable to load profile data from the backend server.';
const SAVE_ERROR = 'Unable to update profile. Please ensure the backend server is running.';

/**
 * Resolves the doctor id for the logged-in user. Mirrors the mapping used by
 * the other doctor pages (demo user DOCTOR_001 maps to seeded DOC001).
 */
export function resolveDoctorId(user) {
  return user?.doctorId || (user?.id === 'DOCTOR_001' ? 'DOC001' : user?.id) || 'DOC001';
}

/** Converts a form value to a number, or undefined when left blank. */
function toNumberOrUndefined(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

const initialState = {
  profile: null,
  editForm: {},
  isEditing: false,
  status: 'idle',
  saveStatus: 'idle',
  statusMessage: null,
};

export const fetchDoctorProfile = createAsyncThunk(
  'doctorProfile/fetchProfile',
  async (doctorId, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const targetId = doctorId || resolveDoctorId(user);

    try {
      return await apiFetch(`/doctors/${encodeURIComponent(targetId)}`, {
        user: { ...user, role: 'doctor' },
      });
    } catch {
      return rejectWithValue(LOAD_ERROR);
    }
  }
);

export const updateDoctorProfile = createAsyncThunk(
  'doctorProfile/updateProfile',
  async ({ formData }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = state.auth.user;
    // PUT is keyed by userId, so prefer the userId returned by the GET.
    const targetId = state.doctorProfile.profile?.userId || resolveDoctorId(user);

    // Only send fields a doctor is allowed to edit. branchId, slots and
    // percentageCut are managed by the branch admin and deliberately omitted.
    // Number inputs give strings, but the backend DTO requires real numbers.
    const payload = {
      name: formData.name ?? '',
      specialization: formData.specialization ?? '',
      department: formData.department ?? '',
      qualification: formData.qualification ?? '',
      experience: toNumberOrUndefined(formData.experience),
      licenseNo: formData.licenseNo ?? '',
      phone: formData.phone ?? '',
      email: formData.email ?? '',
      consultationFee: toNumberOrUndefined(formData.consultationFee),
      gender: formData.gender ?? '',
      bio: formData.bio ?? '',
    };

    try {
      const updated = await apiFetch(`/doctors/${encodeURIComponent(targetId)}`, {
        user: { ...user, role: 'doctor' },
        method: 'PUT',
        body: payload,
      });

      if (user) {
        dispatch(
          updateUserProfile({
            name: updated.name || user.name,
            email: updated.email || user.email,
          })
        );
      }

      return updated;
    } catch {
      return rejectWithValue(SAVE_ERROR);
    }
  }
);

const doctorProfileSlice = createSlice({
  name: 'doctorProfile',
  initialState,
  reducers: {
    startEditing(state) {
      state.editForm = state.profile ? { ...state.profile } : {};
      state.isEditing = true;
      state.statusMessage = null;
      state.saveStatus = 'idle';
    },
    cancelEditing(state) {
      state.editForm = state.profile ? { ...state.profile } : {};
      state.isEditing = false;
      state.statusMessage = null;
      state.saveStatus = 'idle';
    },
    updateEditField(state, action) {
      const { name, value } = action.payload;
      state.editForm[name] = value;
    },
    clearProfileStatus(state) {
      state.statusMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorProfile.pending, (state) => {
        state.status = 'loading';
        state.statusMessage = null;
      })
      .addCase(fetchDoctorProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
        state.editForm = action.payload ? { ...action.payload } : {};
      })
      .addCase(fetchDoctorProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.statusMessage = { type: 'error', text: action.payload || LOAD_ERROR };
      })
      .addCase(updateDoctorProfile.pending, (state) => {
        state.saveStatus = 'loading';
        state.statusMessage = null;
      })
      .addCase(updateDoctorProfile.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.profile = action.payload;
        state.editForm = action.payload ? { ...action.payload } : {};
        state.isEditing = false;
        state.statusMessage = { type: 'success', text: 'Profile updated successfully!' };
      })
      .addCase(updateDoctorProfile.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.statusMessage = { type: 'error', text: action.payload || SAVE_ERROR };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  startEditing,
  cancelEditing,
  updateEditField,
  clearProfileStatus,
} = doctorProfileSlice.actions;

export const selectDoctorProfile = (state) => state.doctorProfile.profile;
export const selectDoctorEditForm = (state) => state.doctorProfile.editForm;
export const selectDoctorIsEditing = (state) => state.doctorProfile.isEditing;
export const selectDoctorProfileStatus = (state) => state.doctorProfile.status;
export const selectDoctorProfileSaveStatus = (state) => state.doctorProfile.saveStatus;
export const selectDoctorProfileMessage = (state) => state.doctorProfile.statusMessage;

export default doctorProfileSlice.reducer;
