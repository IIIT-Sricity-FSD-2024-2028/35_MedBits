/**
 * labTechLeaveRequestSlice.js — Lab Technician Leave Requests State (Redux Toolkit)
 * ==================================================================================
 * Location: src/store/slices/labTech/labTechLeaveRequestSlice.js
 *
 * Manages leave application and history state for Lab Technicians (LeaveRequest.jsx):
 *   - `requests`     — filtered list of leave requests for this lab technician
 *   - `statusFilter` — 'all' | 'pending' | 'approved' | 'rejected'
 *   - `formData`     — { date, type, reason }
 *   - `loading`      — history fetch status
 *   - `submitting`   — application submission status
 *   - `feedback`     — { type: 'success' | 'error', message: string } | null
 *
 * API:
 *   GET  /leave-requests
 *   POST /leave-requests
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { extractErrorMessage, getLabTechRequestUser } from './labTechHelpers';

const INITIAL_FORM = {
  date: '',
  type: 'Casual',
  reason: '',
};

const initialState = {
  requests: [],
  statusFilter: 'all',
  formData: INITIAL_FORM,
  loading: false,
  submitting: false,
  feedback: null,
};

export const fetchLabTechLeaveRequests = createAsyncThunk(
  'labTechLeaveRequest/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    const techId = user?.id;

    try {
      const data = await apiFetch('/leave-requests', { user });
      const myRequests = (Array.isArray(data) ? data : []).filter(
        (r) => r.doctorId === techId || r.userId === techId || r.labTechId === techId
      );
      myRequests.sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      return myRequests;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load leave requests.')
      );
    }
  }
);

export const submitLabTechLeaveRequest = createAsyncThunk(
  'labTechLeaveRequest/submit',
  async (formData, { getState, dispatch, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    const techId = user?.id;

    try {
      await apiFetch('/leave-requests', {
        user,
        method: 'POST',
        body: {
          doctorId: techId,
          date: formData.date,
          type: formData.type,
          reason: formData.reason.trim(),
        },
      });

      dispatch(fetchLabTechLeaveRequests());
      return { message: 'Leave request submitted successfully!' };
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Error submitting leave request.')
      );
    }
  }
);

const labTechLeaveRequestSlice = createSlice({
  name: 'labTechLeaveRequest',
  initialState,
  reducers: {
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    updateLeaveFormField(state, action) {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    resetLeaveForm(state) {
      state.formData = INITIAL_FORM;
    },
    setLeaveFeedback(state, action) {
      state.feedback = action.payload;
    },
    clearLeaveFeedback(state) {
      state.feedback = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabTechLeaveRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLabTechLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchLabTechLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.feedback = {
          type: 'error',
          message: action.payload || 'Failed to load leave requests.',
        };
      })
      .addCase(submitLabTechLeaveRequest.pending, (state) => {
        state.submitting = true;
        state.feedback = null;
      })
      .addCase(submitLabTechLeaveRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.formData = INITIAL_FORM;
        state.feedback = {
          type: 'success',
          message: action.payload.message,
        };
      })
      .addCase(submitLabTechLeaveRequest.rejected, (state, action) => {
        state.submitting = false;
        state.feedback = {
          type: 'error',
          message: action.payload || 'Error submitting leave request.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setStatusFilter,
  updateLeaveFormField,
  resetLeaveForm,
  setLeaveFeedback,
  clearLeaveFeedback,
} = labTechLeaveRequestSlice.actions;

export const selectLabTechLeaveRequests = (state) =>
  state.labTechLeaveRequest.requests;
export const selectLabTechLeaveStatusFilter = (state) =>
  state.labTechLeaveRequest.statusFilter;
export const selectLabTechLeaveFormData = (state) =>
  state.labTechLeaveRequest.formData;
export const selectLabTechLeaveLoading = (state) =>
  state.labTechLeaveRequest.loading;
export const selectLabTechLeaveSubmitting = (state) =>
  state.labTechLeaveRequest.submitting;
export const selectLabTechLeaveFeedback = (state) =>
  state.labTechLeaveRequest.feedback;

export default labTechLeaveRequestSlice.reducer;
