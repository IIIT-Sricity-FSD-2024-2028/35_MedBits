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
    const user = getState().auth.user;
    const requestUser = { ...user, role: user?.role || 'branch_admin' };
    const branchId = user?.branchId;
    const branchParam = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';

    try {
      const [docsRes, fdRes, ltRes, earnRes, branchesRes] = await Promise.all([
        apiFetch(`/doctors${branchParam}`, { user: requestUser }).catch(() => []),
        apiFetch('/frontdesk', { user: requestUser }).catch(() => []),
        apiFetch('/lab-technicians', { user: requestUser }).catch(() => []),
        apiFetch('/appointments/earnings/branch', { user: requestUser }).catch(() => null),
        apiFetch('/hospital-branches', { user: requestUser }).catch(() => []),
      ]);

      const doctors = Array.isArray(docsRes) ? docsRes : [];
      const fdList = Array.isArray(fdRes) ? fdRes : [];
      const frontdeskStaff = branchId
        ? fdList.filter((f) => f.branchId === branchId)
        : fdList;

      const ltList = Array.isArray(ltRes) ? ltRes : [];
      const labTechs = branchId
        ? ltList.filter((t) => t.branchId === branchId)
        : ltList;

      const branches = Array.isArray(branchesRes) ? branchesRes : [];
      const branchInfo = branchId
        ? branches.find((b) => b.id === branchId) || null
        : branches[0] || null;

      return {
        doctors,
        frontdeskStaff,
        labTechs,
        earnings: earnRes && typeof earnRes === 'object' ? earnRes : null,
        branchInfo,
      };
    } catch {
      return rejectWithValue('Unable to load branch dashboard data from the backend server.');
    }
  }
);

const branchAdminDashboardSlice = createSlice({
  name: 'branchAdminDashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchAdminDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBranchAdminDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.doctors = action.payload.doctors;
        state.frontdeskStaff = action.payload.frontdeskStaff;
        state.labTechs = action.payload.labTechs;
        state.earnings = action.payload.earnings;
        state.branchInfo = action.payload.branchInfo;
      })
      .addCase(fetchBranchAdminDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to load branch dashboard data.';
      })
      .addCase(logout, () => initialState);
  },
});

export const selectBranchAdminInfo = (state) => state.branchAdminDashboard.branchInfo;
export const selectBranchDoctors = (state) => state.branchAdminDashboard.doctors;
export const selectBranchFrontdeskStaff = (state) => state.branchAdminDashboard.frontdeskStaff;
export const selectBranchLabTechs = (state) => state.branchAdminDashboard.labTechs;
export const selectBranchEarnings = (state) => state.branchAdminDashboard.earnings;
export const selectBranchAdminDashboardStatus = (state) => state.branchAdminDashboard.status;

export default branchAdminDashboardSlice.reducer;
