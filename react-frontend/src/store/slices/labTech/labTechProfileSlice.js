/**
 * labTechProfileSlice.js — Lab Technician Profile State (Redux Toolkit)
 * ==============================================================================
 * Location: src/store/slices/labTech/labTechProfileSlice.js
 *
 * Manages the authenticated Lab Technician's profile details & branch info.
 * Note: Lab Technician accounts & branch assignments are managed by Branch Admins.
 *
 * API:
 *   GET /hospital-branches/:branchId
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { getLabTechRequestUser } from './labTechHelpers';

const initialState = {
  branchName: '',
  status: 'idle',
  error: null,
};

export const fetchLabTechBranch = createAsyncThunk(
  'labTechProfile/fetchBranch',
  async (branchId, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    const id = branchId || user?.branchId;
    if (!id) return '';

    try {
      const data = await apiFetch(`/hospital-branches/${encodeURIComponent(id)}`, {
        user,
      });
      return data?.name || data?.branchName || data?.hospitalName || '';
    } catch {
      return '';
    }
  }
);

const labTechProfileSlice = createSlice({
  name: 'labTechProfile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabTechBranch.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLabTechBranch.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.branchName = action.payload || '';
        state.error = null;
      })
      .addCase(fetchLabTechBranch.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load branch information.';
      })
      .addCase(logout, () => initialState);
  },
});

export const selectLabTechBranchName = (state) => state.labTechProfile.branchName;
export const selectLabTechProfileStatus = (state) => state.labTechProfile.status;
export const selectLabTechProfileError = (state) => state.labTechProfile.error;

export default labTechProfileSlice.reducer;
