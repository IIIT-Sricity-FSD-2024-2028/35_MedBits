/**
 * testRequestsSlice.js — Lab Technician Test Requests State (Redux Toolkit)
 * ==============================================================================
 * Location: src/store/slices/labTech/testRequestsSlice.js
 *
 * Manages server-side lab request state and mutations for TestRequests.jsx:
 *   - `requests`        — branch-scoped lab requests visible to the technician
 *   - `loading`         — initial/refresh fetch state
 *   - `actionLoadingId` — request ID currently undergoing accept/reject mutation
 *   - `error`           — last API error message
 *   - `actionMessage`   — success feedback for accept/reject actions
 *
 * API:
 *   GET   /lab-requests
 *   PATCH /lab-requests/:id/accept
 *   PATCH /lab-requests/:id/reject
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import {
  extractErrorMessage,
  getLabTechRequestUser,
  upsertById,
} from './labTechHelpers';

const initialState = {
  requests: [],
  loading: false,
  actionLoadingId: null,
  error: null,
  actionMessage: null,
  selectedReportRequest: null,
  selectedReport: null,
  reportLoading: false,
  reportError: null,
};

export const fetchTestRequests = createAsyncThunk(
  'labTechTestRequests/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    try {
      const data = await apiFetch('/lab-requests', { user });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load lab test requests.')
      );
    }
  }
);

export const acceptTestRequest = createAsyncThunk(
  'labTechTestRequests/accept',
  async (requestId, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    try {
      return await apiFetch(
        `/lab-requests/${encodeURIComponent(requestId)}/accept`,
        { user, method: 'PATCH' }
      );
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to accept lab test request.')
      );
    }
  }
);

export const rejectTestRequest = createAsyncThunk(
  'labTechTestRequests/reject',
  async ({ id, reason }, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    try {
      return await apiFetch(
        `/lab-requests/${encodeURIComponent(id)}/reject`,
        {
          user,
          method: 'PATCH',
          body: { reason: reason?.trim() || 'Declined by lab tech' },
        }
      );
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to reject lab test request.')
      );
    }
  }
);

export const fetchTestRequestReport = createAsyncThunk(
  'labTechTestRequests/fetchReport',
  async (request, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    const requestId = request?.id;
    if (!requestId) {
      return rejectWithValue('Invalid lab request identifier.');
    }

    try {
      const report = await apiFetch(
        `/lab-requests/${encodeURIComponent(requestId)}/report`,
        { user }
      );
      if (!report) {
        return { request, report: null };
      }
      const matchesRelationship =
        report.labRequestId === requestId ||
        (Boolean(request.reportId) && report.id === request.reportId);
      if (!matchesRelationship) {
        return { request, report: null };
      }
      return { request, report };
    } catch (err) {
      if (err instanceof SyntaxError) {
        return { request, report: null };
      }
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load submitted report details.')
      );
    }
  }
);

const testRequestsSlice = createSlice({
  name: 'labTechTestRequests',
  initialState,
  reducers: {
    clearTestRequestsError(state) {
      state.error = null;
    },
    clearTestRequestsActionMessage(state) {
      state.actionMessage = null;
    },
    clearSelectedTestRequestReport(state) {
      state.selectedReportRequest = null;
      state.selectedReport = null;
      state.reportLoading = false;
      state.reportError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTestRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchTestRequests.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error?.message ||
          'Failed to load lab test requests.';
      })
      .addCase(acceptTestRequest.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg || null;
        state.error = null;
        state.actionMessage = null;
      })
      .addCase(acceptTestRequest.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        state.requests = upsertById(state.requests, action.payload, true);
        state.actionMessage = 'Test request accepted and moved to In Progress.';
      })
      .addCase(acceptTestRequest.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error =
          action.payload ||
          action.error?.message ||
          'Failed to accept lab test request.';
      })
      .addCase(rejectTestRequest.pending, (state, action) => {
        state.actionLoadingId = action.meta.arg?.id || null;
        state.error = null;
        state.actionMessage = null;
      })
      .addCase(rejectTestRequest.fulfilled, (state, action) => {
        state.actionLoadingId = null;
        state.requests = upsertById(state.requests, action.payload, true);
        state.actionMessage = 'Test request rejected.';
      })
      .addCase(rejectTestRequest.rejected, (state, action) => {
        state.actionLoadingId = null;
        state.error =
          action.payload ||
          action.error?.message ||
          'Failed to reject lab test request.';
      })
      .addCase(fetchTestRequestReport.pending, (state, action) => {
        state.selectedReportRequest = action.meta.arg || null;
        state.selectedReport = null;
        state.reportLoading = true;
        state.reportError = null;
      })
      .addCase(fetchTestRequestReport.fulfilled, (state, action) => {
        state.reportLoading = false;
        state.selectedReportRequest = action.payload.request;
        state.selectedReport = action.payload.report;
      })
      .addCase(fetchTestRequestReport.rejected, (state, action) => {
        state.reportLoading = false;
        state.selectedReport = null;
        state.reportError =
          action.payload ||
          action.error?.message ||
          'Failed to load submitted report details.';
      })
      .addCase(logout, () => initialState)
      .addMatcher(
        (action) =>
          action.type === 'labTechReports/saveDraft/fulfilled' ||
          action.type === 'labTechReports/submit/fulfilled',
        (state, action) => {
          if (action.payload?.request) {
            state.requests = upsertById(
              state.requests,
              action.payload.request,
              true
            );
          }
        }
      );
  },
});

export const {
  clearTestRequestsError,
  clearTestRequestsActionMessage,
  clearSelectedTestRequestReport,
} = testRequestsSlice.actions;

export const selectTestRequests = (state) => state.labTechTestRequests.requests;
export const selectTestRequestsLoading = (state) =>
  state.labTechTestRequests.loading;
export const selectTestRequestActionLoadingId = (state) =>
  state.labTechTestRequests.actionLoadingId;
export const selectTestRequestsError = (state) =>
  state.labTechTestRequests.error;
export const selectTestRequestsActionMessage = (state) =>
  state.labTechTestRequests.actionMessage;
export const selectSelectedTestRequestReportRequest = (state) =>
  state.labTechTestRequests.selectedReportRequest;
export const selectSelectedTestRequestReport = (state) =>
  state.labTechTestRequests.selectedReport;
export const selectTestRequestReportLoading = (state) =>
  state.labTechTestRequests.reportLoading;
export const selectTestRequestReportError = (state) =>
  state.labTechTestRequests.reportError;

export default testRequestsSlice.reducer;
