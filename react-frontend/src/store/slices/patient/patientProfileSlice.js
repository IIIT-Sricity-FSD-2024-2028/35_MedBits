/**
 * patientProfileSlice.js — Patient Profile State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/patient/patientProfileSlice.js
 *
 * Manages the authenticated patient's personal profile state:
 *   - `profile`       — fetched patient profile object
 *   - `editForm`      — controlled draft values while editing
 *   - `isEditing`     — boolean toggle for edit mode
 *   - `status`        — 'idle' | 'loading' | 'succeeded' | 'failed' (fetch state)
 *   - `saveStatus`    — 'idle' | 'loading' | 'succeeded' | 'failed' (save state)
 *   - `statusMessage` — { type: 'success' | 'error', text: string } | null
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout, updateUserProfile } from '../authSlice';

const initialState = {
  profile: null,
  editForm: {},
  isEditing: false,
  status: 'idle',
  saveStatus: 'idle',
  statusMessage: null,
};

export const fetchPatientProfile = createAsyncThunk(
  'patientProfile/fetchProfile',
  async (patientId, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const targetId = patientId || user?.id;

    if (!targetId) {
      return rejectWithValue('Patient ID is missing.');
    }

    try {
      const data = await apiFetch(`/patients/${encodeURIComponent(targetId)}`, {
        user: { ...user, role: user?.role || 'patient' },
      });
      return data;
    } catch {
      return rejectWithValue('Unable to load profile data from the backend server.');
    }
  }
);

export const updatePatientProfile = createAsyncThunk(
  'patientProfile/updateProfile',
  async ({ patientId, formData }, { getState, dispatch, rejectWithValue }) => {
    const user = getState().auth.user;
    const targetId = patientId || user?.id;

    if (!targetId) {
      return rejectWithValue('Patient ID is missing.');
    }

    const payload = {
      firstName: formData.firstName ?? '',
      lastName: formData.lastName ?? '',
      dob: formData.dob ?? '',
      gender: formData.gender ?? '',
      bloodGroup: formData.bloodGroup ?? '',
      phone: formData.phone ?? '',
      email: formData.email ?? '',
      guardianName: formData.guardianName ?? '',
    };

    try {
      const updated = await apiFetch(`/patients/${encodeURIComponent(targetId)}`, {
        user: { ...user, role: user?.role || 'patient' },
        method: 'PUT',
        body: payload,
      });

      if (user) {
        dispatch(
          updateUserProfile({
            firstName: updated.firstName,
            lastName: updated.lastName,
            name: `${updated.firstName || ''} ${updated.lastName || ''}`.trim(),
            email: updated.email,
          })
        );
      }

      return updated;
    } catch {
      return rejectWithValue(
        'Unable to update profile. Please ensure the backend server is running.'
      );
    }
  }
);

const patientProfileSlice = createSlice({
  name: 'patientProfile',
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
      .addCase(fetchPatientProfile.pending, (state) => {
        state.status = 'loading';
        state.statusMessage = null;
      })
      .addCase(fetchPatientProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload;
        state.editForm = action.payload ? { ...action.payload } : {};
      })
      .addCase(fetchPatientProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.statusMessage = {
          type: 'error',
          text: action.payload || 'Unable to load profile data from the backend server.',
        };
      })
      .addCase(updatePatientProfile.pending, (state) => {
        state.saveStatus = 'loading';
        state.statusMessage = null;
      })
      .addCase(updatePatientProfile.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.profile = action.payload;
        state.editForm = action.payload ? { ...action.payload } : {};
        state.isEditing = false;
        state.statusMessage = {
          type: 'success',
          text: 'Profile updated successfully!',
        };
      })
      .addCase(updatePatientProfile.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.statusMessage = {
          type: 'error',
          text: action.payload || 'Unable to update profile. Please ensure the backend server is running.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  startEditing,
  cancelEditing,
  updateEditField,
  clearProfileStatus,
} = patientProfileSlice.actions;

export const selectPatientProfile = (state) => state.patientProfile.profile;
export const selectPatientEditForm = (state) => state.patientProfile.editForm;
export const selectPatientIsEditing = (state) => state.patientProfile.isEditing;
export const selectPatientProfileStatus = (state) => state.patientProfile.status;
export const selectPatientProfileSaveStatus = (state) => state.patientProfile.saveStatus;
export const selectPatientProfileMessage = (state) => state.patientProfile.statusMessage;

export default patientProfileSlice.reducer;
