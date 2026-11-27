/**
 * superAdminEarningsSlice.js — Super Admin Financial Earnings State (Redux Toolkit)
 * ==================================================================================
 * Location: src/store/slices/superAdmin/superAdminEarningsSlice.js
 *
 * Manages state for the Super Admin Financial Earnings page (`pages/SuperAdmin/earnings.jsx`):
 *   - Data: `overview`, `branches`, `branchData`
 *   - Selection & Filters: `selectedBranchId`, `selectedMonth`
 *   - Async state: `overviewStatus`, `branchStatus`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

const STORAGE_KEY = 'superadmin-selected-branch-id';

function loadSelectedBranchId() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveSelectedBranchId(branchId) {
  try {
    if (branchId) {
      localStorage.setItem(STORAGE_KEY, branchId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Returns the current calendar month key in `YYYY-MM` format.
 */
export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Extracts a `YYYY-MM` month key from a date string, or returns `''` if invalid.
 */
export function getMonthKeyFromDate(dateStr) {
  if (!dateStr) return '';
  const raw = String(dateStr);
  const d = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getSuperAdminRequestUser(getState) {
  const user = getState().auth.user;
  return { ...user, role: user?.role || 'super_admin' };
}

const initialState = {
  overview: null,
  branches: [],
  selectedBranchId: loadSelectedBranchId(),
  branchData: null,
  selectedMonth: '',
  overviewStatus: 'idle',
  branchStatus: 'idle',
};

export const fetchSuperAdminEarningsOverviewAndBranches = createAsyncThunk(
  'superAdminEarnings/fetchOverviewAndBranches',
  async (_, { getState }) => {
    const requestUser = getSuperAdminRequestUser(getState);

    const [overviewResult, branchesResult] = await Promise.allSettled([
      apiFetch('/super-admin/hospital-branches/earnings', { user: requestUser }),
      apiFetch('/super-admin/hospital-branches', { user: requestUser }),
    ]);

    const overview =
      overviewResult.status === 'fulfilled' && overviewResult.value
        ? overviewResult.value
        : null;

    const branches =
      branchesResult.status === 'fulfilled' && Array.isArray(branchesResult.value)
        ? branchesResult.value
        : [];

    return { overview, branches };
  }
);

export const fetchSuperAdminBranchEarnings = createAsyncThunk(
  'superAdminEarnings/fetchBranchEarnings',
  async (branchId, { getState }) => {
    const requestUser = getSuperAdminRequestUser(getState);
    if (!branchId) {
      return { branchData: null, defaultMonth: getCurrentMonthKey() };
    }

    try {
      const data = await apiFetch(
        `/super-admin/hospital-branches/${encodeURIComponent(branchId)}/earnings`,
        { user: requestUser }
      );
      return {
        branchData: data || null,
        defaultMonth: getCurrentMonthKey(),
      };
    } catch (err) {
      console.warn('Failed to load branch earnings:', err);
      return {
        branchData: null,
        defaultMonth: getCurrentMonthKey(),
      };
    }
  }
);

const superAdminEarningsSlice = createSlice({
  name: 'superAdminEarnings',
  initialState,
  reducers: {
    setSelectedEarningsBranchId(state, action) {
      const nextId = action.payload || '';
      state.selectedBranchId = nextId;
      saveSelectedBranchId(nextId);
    },
    setSelectedEarningsMonth(state, action) {
      state.selectedMonth = action.payload || '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuperAdminEarningsOverviewAndBranches.pending, (state) => {
        state.overviewStatus = 'loading';
      })
      .addCase(fetchSuperAdminEarningsOverviewAndBranches.fulfilled, (state, action) => {
        state.overviewStatus = 'succeeded';
        if (action.payload.overview) {
          state.overview = action.payload.overview;
        }
        const list = action.payload.branches;
        if (list.length > 0) {
          state.branches = list;
          const isCurrentValid = list.some((b) => b.id === state.selectedBranchId);
          const nextId = isCurrentValid ? state.selectedBranchId : list[0].id;
          state.selectedBranchId = nextId;
          saveSelectedBranchId(nextId);
        }
      })
      .addCase(fetchSuperAdminEarningsOverviewAndBranches.rejected, (state) => {
        state.overviewStatus = 'failed';
      })
      .addCase(fetchSuperAdminBranchEarnings.pending, (state) => {
        state.branchStatus = 'loading';
      })
      .addCase(fetchSuperAdminBranchEarnings.fulfilled, (state, action) => {
        state.branchStatus = 'succeeded';
        state.branchData = action.payload.branchData;
        state.selectedMonth = action.payload.defaultMonth;
      })
      .addCase(fetchSuperAdminBranchEarnings.rejected, (state) => {
        state.branchStatus = 'failed';
      })
      .addCase(logout, () => ({
        ...initialState,
        selectedBranchId: '',
      }));
  },
});

export const {
  setSelectedEarningsBranchId,
  setSelectedEarningsMonth,
} = superAdminEarningsSlice.actions;

export const selectPlatformOverview = (state) => state.superAdminEarnings.overview;
export const selectEarningsBranches = (state) => state.superAdminEarnings.branches;
export const selectEarningsSelectedBranchId = (state) =>
  state.superAdminEarnings.selectedBranchId;
export const selectBranchEarningsDetail = (state) => state.superAdminEarnings.branchData;
export const selectSelectedEarningsMonth = (state) => state.superAdminEarnings.selectedMonth;
export const selectSuperAdminEarningsOverviewStatus = (state) =>
  state.superAdminEarnings.overviewStatus;
export const selectSuperAdminBranchEarningsStatus = (state) =>
  state.superAdminEarnings.branchStatus;

export default superAdminEarningsSlice.reducer;
