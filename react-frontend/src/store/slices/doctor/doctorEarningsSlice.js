/**
 * doctorEarningsSlice.js — Doctor Earnings State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/doctor/doctorEarningsSlice.js
 *
 * Manages the doctor's earnings report:
 *   - `summary`     — DoctorEarningsSummary from the backend (or an empty fallback)
 *   - `status`      — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `filterMonth` — 'all' | 'YYYY-MM' (table filter)
 *
 * API: GET /appointments/earnings/doctor/:doctorId
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { getDoctorRequestUser } from './doctorHelpers';

const initialState = {
  summary: null,
  status: 'idle',
  filterMonth: 'all',
};

export const fetchDoctorEarnings = createAsyncThunk(
  'doctorEarnings/fetchEarnings',
  async (_, { getState }) => {
    const state = getState();
    const requestUser = getDoctorRequestUser(state);
    const doctorId = requestUser.id;

    try {
      const data = await apiFetch(
        `/appointments/earnings/doctor/${encodeURIComponent(doctorId)}`,
        { user: requestUser }
      );
      if (data && typeof data === 'object') return data;
    } catch {
      // Fall through to the empty summary below.
    }

    // The page shows an empty report rather than an error when the backend
    // has no earnings data for this doctor.
    return {
      doctorId,
      doctorName: state.auth.user?.name || 'Doctor',
      percentageCut: 50,
      totalEarnings: 0,
      currentMonthEarnings: 0,
      entries: [],
    };
  }
);

const doctorEarningsSlice = createSlice({
  name: 'doctorEarnings',
  initialState,
  reducers: {
    setFilterMonth(state, action) {
      state.filterMonth = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDoctorEarnings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDoctorEarnings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchDoctorEarnings.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(logout, () => initialState);
  },
});

export const { setFilterMonth } = doctorEarningsSlice.actions;

export const selectDoctorEarningsSummary = (state) => state.doctorEarnings.summary;
export const selectDoctorEarningsStatus = (state) => state.doctorEarnings.status;
export const selectDoctorEarningsFilterMonth = (state) => state.doctorEarnings.filterMonth;

export default doctorEarningsSlice.reducer;
