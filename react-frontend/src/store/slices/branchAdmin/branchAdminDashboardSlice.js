/**
 * branchAdminDashboardSlice.js — Branch Admin Dashboard State (Redux Toolkit)
 * ============================================================================
 * Location: src/store/slices/branchAdmin/branchAdminDashboardSlice.js
 *
 * Manages state for the Branch Admin Dashboard page:
 *   - `branchInfo`     — active hospital branch metadata
 *   - `doctors`        — branch doctors roster
 *   - `frontdeskStaff` — branch front desk staff list
 *   - `labTechs`       — branch laboratory technicians list
 *   - `earnings`       — branch revenue & completed consults summary
 *   - `status`         — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `error`          — string | null
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import {
  extractBranchErrorDetail,
  getBranchAdminRequestUser,
} from './branchStaffHelpers';

const initialState = {
  branchInfo: null,
  doctors: [],
  frontdeskStaff: [],
  labTechs: [],
  earnings: null,
  status: 'idle',
  error: null,
};

export const fetchBranchAdminDashboard = createAsyncThunk(
  'branchAdminDashboard/fetchDashboard',
  async (_, { getState, rejectWithValue }) => {
    const requestUser = getBranchAdminRequestUser(getState);
    const branchId = requestUser?.branchId;
    const branchParam = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';

    const results = await Promise.allSettled([
      apiFetch(`/doctors${branchParam}`, { user: requestUser }),
      apiFetch('/frontdesk', { user: requestUser }),
      apiFetch('/lab-technicians', { user: requestUser }),
      apiFetch('/appointments/earnings/branch', { user: requestUser }),
      apiFetch('/hospital-branches', { user: requestUser }),
    ]);

    if (results.every((res) => res.status === 'rejected')) {
      return rejectWithValue(
        extractBranchErrorDetail(
          results[0]?.reason,
          'Unable to load branch dashboard data from the backend server.'
        )
      );
    }

    const [docsResult, fdResult, ltResult, earnResult, branchesResult] = results;

    const doctors =
      docsResult.status === 'fulfilled'
        ? Array.isArray(docsResult.value)
          ? docsResult.value
          : []
        : null;

    const frontdeskStaff =
      fdResult.status === 'fulfilled'
        ? (() => {
            const fdList = Array.isArray(fdResult.value) ? fdResult.value : [];
            return branchId ? fdList.filter((f) => f.branchId === branchId) : fdList;
          })()
        : null;

    const labTechs =
      ltResult.status === 'fulfilled'
        ? (() => {
            const ltList = Array.isArray(ltResult.value) ? ltResult.value : [];
            return branchId ? ltList.filter((t) => t.branchId === branchId) : ltList;
          })()
        : null;

    const earnings =
      earnResult.status === 'fulfilled'
        ? earnResult.value && typeof earnResult.value === 'object'
          ? earnResult.value
          : null
        : undefined;

    const branchInfo =
      branchesResult.status === 'fulfilled'
        ? (() => {
            const branches = Array.isArray(branchesResult.value) ? branchesResult.value : [];
            return branchId
              ? branches.find((b) => b.id === branchId) || null
              : branches[0] || null;
          })()
        : undefined;

    return {
      doctors,
      frontdeskStaff,
      labTechs,
      earnings,
      branchInfo,
    };
  }
);

const branchAdminDashboardSlice = createSlice({
  name: 'branchAdminDashboard',
  initialState,
  reducers: {
    clearBranchAdminDashboardError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchAdminDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBranchAdminDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        if (action.payload.doctors !== null) state.doctors = action.payload.doctors;
        if (action.payload.frontdeskStaff !== null) state.frontdeskStaff = action.payload.frontdeskStaff;
        if (action.payload.labTechs !== null) state.labTechs = action.payload.labTechs;
        if (action.payload.earnings !== undefined) state.earnings = action.payload.earnings;
        if (action.payload.branchInfo !== undefined) state.branchInfo = action.payload.branchInfo;
      })
      .addCase(fetchBranchAdminDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to load branch dashboard data.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearBranchAdminDashboardError } = branchAdminDashboardSlice.actions;

export const selectBranchAdminInfo = (state) => state.branchAdminDashboard.branchInfo;
export const selectBranchDoctors = (state) => state.branchAdminDashboard.doctors;
export const selectBranchFrontdeskStaff = (state) => state.branchAdminDashboard.frontdeskStaff;
export const selectBranchLabTechs = (state) => state.branchAdminDashboard.labTechs;
export const selectBranchEarnings = (state) => state.branchAdminDashboard.earnings;
export const selectBranchAdminDashboardStatus = (state) => state.branchAdminDashboard.status;
export const selectBranchAdminDashboardError = (state) => state.branchAdminDashboard.error;

export default branchAdminDashboardSlice.reducer;
