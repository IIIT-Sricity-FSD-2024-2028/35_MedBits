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
import { fetchListOrNull, getDoctorRequestUser } from './doctorHelpers';

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
};

export const fetchDoctorDashboard = createAsyncThunk(
  'doctorDashboard/fetchDashboard',
  async (_, { getState }) => {
    const user = getDoctorRequestUser(getState());
    const id = encodeURIComponent(user.id);

    const [appointments, earnings, records] = await Promise.all([
      fetchListOrNull(`/appointments/doctor/${id}`, user),
      apiFetch(`/appointments/earnings/doctor/${id}`, { user }).catch(() => null),
      fetchListOrNull(`/medical-records/doctor/${id}`, user),
    ]);

    return {
      appointments: appointments ?? [],
      earningsSummary: earnings && typeof earnings === 'object' ? earnings : null,
      records,
    };
  }
);

const doctorDashboardSlice = createSlice({
  name: 'doctorDashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorDashboard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDoctorDashboard.fulfilled, (state, action) => {
        const { appointments, earningsSummary, records } = action.payload;
        state.status = 'succeeded';
        state.appointments = appointments;
        if (earningsSummary) state.earningsSummary = earningsSummary;
        if (records) {
          state.recordsCount = records.length;
          state.pendingLabCount = records.filter((r) => r.tests && r.type === 'treatment').length;
        }
      })
      .addCase(fetchDoctorDashboard.rejected, (state) => {
        state.status = 'failed';
        state.appointments = [];
      })
      .addCase(logout, () => initialState);
  },
});

export const selectDoctorDashboard = (state) => state.doctorDashboard;

export default doctorDashboardSlice.reducer;
