/**
 * patientMedicalRecordsSlice.js — Patient Medical Records State (Redux Toolkit)
 * ============================================================================
 * Location: src/store/slices/patient/patientMedicalRecordsSlice.js
 *
 * Manages state for the Patient Medical Records page:
 *   - `records` — array of consultation, treatment plan, and lab test records
 *   - `status`  — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `error`   — string | null
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

const initialState = {
  records: [],
  status: 'idle',
  error: null,
};

export const fetchPatientMedicalRecords = createAsyncThunk(
  'patientMedicalRecords/fetchRecords',
  async (patientId, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const targetId = (
      patientId ||
      user?.userId ||
      user?.patientId ||
      user?.id ||
      ''
    ).trim();

    if (!targetId) {
      return [];
    }

    try {
      const data = await apiFetch(`/medical-records/${encodeURIComponent(targetId)}`, {
        user: { ...user, id: targetId, role: user?.role || 'patient' },
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return rejectWithValue('Failed to load medical records from backend server.');
    }
  }
);

const patientMedicalRecordsSlice = createSlice({
  name: 'patientMedicalRecords',
  initialState,
  reducers: {
    clearMedicalRecordsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientMedicalRecords.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPatientMedicalRecords.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.records = action.payload;
        state.error = null;
      })
      .addCase(fetchPatientMedicalRecords.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to retrieve clinical history records.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearMedicalRecordsError } = patientMedicalRecordsSlice.actions;

export const selectPatientMedicalRecords = (state) =>
  state.patientMedicalRecords.records;
export const selectPatientMedicalRecordsStatus = (state) =>
  state.patientMedicalRecords.status;
export const selectPatientMedicalRecordsError = (state) =>
  state.patientMedicalRecords.error;

export default patientMedicalRecordsSlice.reducer;
