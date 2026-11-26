/**
 * branchEarningsSlice.js — Branch Admin Financial Earnings State (Redux Toolkit)
 * ==============================================================================
 * Location: src/store/slices/branchAdmin/branchEarningsSlice.js
 *
 * Manages state for the Branch Admin Earnings page:
 *   - Data: `data` (branch revenue summary, appointment entries, lab entries)
 *   - Filters: `selectedMonthKey`, `searchQuery`
 *   - Async state: `status`, `error`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

export function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return '';
  const raw = String(dateStr);
  const d = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getAvailableMonthKeys(data) {
  const keys = new Set();
  const currentKey = getCurrentMonthKey();
  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const labEntries = Array.isArray(data?.labEntries) ? data.labEntries : [];

  entries.forEach((e) => {
    const k = getMonthKeyFromDate(e.date);
    if (k && k <= currentKey) keys.add(k);
  });

  labEntries.forEach((l) => {
    const k = getMonthKeyFromDate(l.date);
    if (k && k <= currentKey) keys.add(k);
  });

  keys.add(currentKey);
  return [...keys].sort((a, b) => b.localeCompare(a));
}

const initialState = {
  data: null,
  selectedMonthKey: '',
  searchQuery: '',
  status: 'idle',
  error: null,
};

export const fetchBranchEarnings = createAsyncThunk(
  'branchEarnings/fetchEarnings',
  async (_, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const requestUser = { ...user, role: user?.role || 'branch_admin' };

    try {
      const json = await apiFetch('/appointments/earnings/branch', {
        user: requestUser,
      });

      const available = getAvailableMonthKeys(json);
      const cur = getCurrentMonthKey();
      const defaultMonthKey = available.includes(cur) ? cur : available[0] || cur;

      return {
        data: json,
        defaultMonthKey,
      };
    } catch (err) {
      const raw = err?.message || '';
      const detail = raw.includes(': ') ? raw.split(': ').slice(1).join(': ') : raw;
      return rejectWithValue(detail || 'Error fetching earnings data');
    }
  }
);

const branchEarningsSlice = createSlice({
  name: 'branchEarnings',
  initialState,
  reducers: {
    setSelectedMonthKey(state, action) {
      state.selectedMonthKey = action.payload;
    },
    setEarningsSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    clearBranchEarningsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchEarnings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBranchEarnings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload.data;
        state.selectedMonthKey = action.payload.defaultMonthKey;
      })
      .addCase(fetchBranchEarnings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Error fetching earnings data';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setSelectedMonthKey,
  setEarningsSearchQuery,
  clearBranchEarningsError,
} = branchEarningsSlice.actions;

export const selectBranchEarningsData = (state) => state.branchEarnings.data;
export const selectBranchEarningsSelectedMonthKey = (state) =>
  state.branchEarnings.selectedMonthKey;
export const selectBranchEarningsSearchQuery = (state) => state.branchEarnings.searchQuery;
export const selectBranchEarningsStatus = (state) => state.branchEarnings.status;
export const selectBranchEarningsError = (state) => state.branchEarnings.error;

export default branchEarningsSlice.reducer;
