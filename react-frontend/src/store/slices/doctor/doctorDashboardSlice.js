/**
 * doctorDashboardSlice.js — Doctor Dashboard State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/doctor/doctorDashboardSlice.js
 *
 * Manages the data behind the doctor's home dashboard:
 *   - `appointments`    — all appointments assigned to the doctor
 *   - `earningsSummary` — earnings summary (zeros until loaded)
 *   - `recordsCount`    — number of medical records the doctor created
 *   - `pendingLabCount` — treatment plans that ordered lab tests
 *   - `status`          — 'idle' | 'loading' | 'succeeded' | 'failed'
 *
 * API:
 *   GET /appointments/doctor/:doctorId
 *   GET /appointments/earnings/doctor/:doctorId
 *   GET /medical-records/doctor/:doctorId
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { extractDoctorError, getDoctorRequestUser } from './doctorHelpers';

const EMPTY_EARNINGS = {
  totalEarnings: 0,
  currentMonthEarnings: 0,
  percentageCut: 50,
  entries: [],
};

const initialState = {
  appointments: [],
  earningsSummary: EMPTY_EARNINGS,
  recordsCount: 0,
  pendingLabCount: 0,
  status: 'idle',
  error: null,
};

export const fetchDoctorDashboard = createAsyncThunk(
  'doctorDashboard/fetchDashboard',
  async (_, { getState, rejectWithValue }) => {
    const user = getDoctorRequestUser(getState());
    const id = encodeURIComponent(user.id);

    const results = await Promise.allSettled([
      apiFetch(`/appointments/doctor/${id}`, { user }),
      apiFetch(`/appointments/earnings/doctor/${id}`, { user }),
      apiFetch(`/medical-records/doctor/${id}`, { user }),
    ]);

    if (results.every((res) => res.status === 'rejected')) {
      return rejectWithValue(
        extractDoctorError(
          results[0]?.reason,
          'Unable to load doctor dashboard data from the backend server.'
        )
      );
    }

    const [apptsResult, earningsResult, recordsResult] = results;

    return {
      appointments:
        apptsResult.status === 'fulfilled' && Array.isArray(apptsResult.value)
          ? apptsResult.value
          : null,
      earningsSummary:
        earningsResult.status === 'fulfilled' &&
        earningsResult.value &&
        typeof earningsResult.value === 'object'
          ? earningsResult.value
          : null,
      records:
        recordsResult.status === 'fulfilled' && Array.isArray(recordsResult.value)
          ? recordsResult.value
          : null,
    };
  }
);

const doctorDashboardSlice = createSlice({
  name: 'doctorDashboard',
  initialState,
  reducers: {
    clearDoctorDashboardError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDoctorDashboard.fulfilled, (state, action) => {
        const { appointments, earningsSummary, records } = action.payload;
        state.status = 'succeeded';
        state.error = null;
        if (appointments !== null) state.appointments = appointments;
        if (earningsSummary !== null) state.earningsSummary = earningsSummary;
        if (records !== null) {
          state.recordsCount = records.length;
          state.pendingLabCount = records.filter((r) => r.tests && r.type === 'treatment').length;
        }
      })
      .addCase(fetchDoctorDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.payload || 'Unable to load doctor dashboard data from the backend server.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearDoctorDashboardError } = doctorDashboardSlice.actions;

export const selectDoctorDashboard = (state) => state.doctorDashboard;
export const selectDoctorDashboardError = (state) => state.doctorDashboard.error;

export default doctorDashboardSlice.reducer;
