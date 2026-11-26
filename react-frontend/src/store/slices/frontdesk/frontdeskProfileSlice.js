/**
 * frontdeskProfileSlice.js — Frontdesk Staff Profile State (Redux Toolkit)
 * =========================================================================
 * Location: src/store/slices/frontdesk/frontdeskProfileSlice.js
 *
 * Manages the authenticated Frontdesk staff member's read-only profile state:
 *   - `profile` — fetched Frontdesk entity from GET /frontdesk/:userId
 *   - `status`  — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `error`   — string | null
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { extractErrorMessage, getFrontdeskRequestUser } from './frontdeskHelpers';

const LOAD_ERROR = 'Unable to load profile data from the backend server.';

const initialState = {
  profile: null,
  status: 'idle',
  error: null,
};

export const fetchFrontdeskProfile = createAsyncThunk(
  'frontdeskProfile/fetchProfile',
  async (userId, { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    const targetId = (userId || requestUser.id || '').trim();

    if (!targetId) {
      return rejectWithValue('Frontdesk user ID is missing.');
    }

    try {
      const data = await apiFetch(`/frontdesk/${encodeURIComponent(targetId)}`, {
        user: requestUser,
      });
      return data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, LOAD_ERROR) || LOAD_ERROR);
    }
  }
);

const frontdeskProfileSlice = createSlice({
  name: 'frontdeskProfile',
  initialState,
  reducers: {
    clearFrontdeskProfileError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFrontdeskProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFrontdeskProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload || null;
        state.error = null;
      })
      .addCase(fetchFrontdeskProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || LOAD_ERROR;
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearFrontdeskProfileError } = frontdeskProfileSlice.actions;

export const selectFrontdeskProfile = (state) => state.frontdeskProfile.profile;
export const selectFrontdeskProfileStatus = (state) => state.frontdeskProfile.status;
export const selectFrontdeskProfileError = (state) => state.frontdeskProfile.error;

export default frontdeskProfileSlice.reducer;
