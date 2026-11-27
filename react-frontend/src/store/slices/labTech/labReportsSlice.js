/**
 * labReportsSlice.js — Lab Technician Diagnostic Reports State (Redux Toolkit)
 * ==============================================================================
 * Location: src/store/slices/labTech/labReportsSlice.js
 *
 * Manages server-side lab requests, diagnostic reports, drafts, and report
 * submission workflows for LabReports.jsx:
 *   - `requests`     — lab requests eligible for / tracked in reporting
 *   - `reports`      — technician's diagnostic reports (draft + submitted)
 *   - `activeDraft`  — preloaded existing draft report for the active request
 *   - `loading`      — list fetch status
 *   - `draftLoading` — per-request draft lookup status
 *   - `submitting`   — draft save / final report submission status
 *   - `error`        — last API error message
 *   - `feedback`     — { type: 'success' | 'info' | 'error', message: string }
 *
 * API:
 *   GET   /lab-requests
 *   GET   /lab-reports
 *   GET   /lab-requests/:id/report
 *   PATCH /lab-requests/:id/report/draft
 *   PATCH /lab-requests/:id/report/submit
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
  reports: [],
  activeDraft: null,
  loading: false,
  draftLoading: false,
  submitting: false,
  error: null,
  feedback: null,
};

export const fetchLabReportsData = createAsyncThunk(
  'labTechReports/fetchData',
  async (_, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    try {
      const [reqs, reps] = await Promise.all([
        apiFetch('/lab-requests', { user }),
        apiFetch('/lab-reports', { user }),
      ]);
      return {
        requests: Array.isArray(reqs) ? reqs : [],
        reports: Array.isArray(reps) ? reps : [],
      };
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load lab reports data.')
      );
    }
  }
);

export const fetchReportDraft = createAsyncThunk(
  'labTechReports/fetchDraft',
  async (requestId, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    try {
      const draft = await apiFetch(
        `/lab-requests/${encodeURIComponent(requestId)}/report`,
        { user }
      );
      return draft || null;
    } catch (err) {
      // Backend returns `null` with HTTP 200 and an empty body when no draft exists yet,
      // causing response.json() inside apiFetch to throw SyntaxError.
      if (err instanceof SyntaxError) {
        return null;
      }
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load existing draft report.')
      );
    }
  }
);

export const saveLabReportDraft = createAsyncThunk(
  'labTechReports/saveDraft',
  async ({ requestId, payload }, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    try {
      return await apiFetch(
        `/lab-requests/${encodeURIComponent(requestId)}/report/draft`,
        {
          user,
          method: 'PATCH',
          body: payload,
        }
      );
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to save draft report.')
      );
    }
  }
);

export const submitLabReport = createAsyncThunk(
  'labTechReports/submit',
  async ({ requestId, payload }, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());
    try {
      return await apiFetch(
        `/lab-requests/${encodeURIComponent(requestId)}/report/submit`,
        {
          user,
          method: 'PATCH',
          body: payload,
        }
      );
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to submit lab report.')
      );
    }
  }
);

function applyReportMutationResult(state, payload, feedback) {
  state.submitting = false;
  if (payload?.request) {
    state.requests = upsertById(state.requests, payload.request, true);
  }
  if (payload?.report) {
    state.reports = upsertById(state.reports, payload.report, true);
  }
  state.activeDraft = null;
  state.feedback = feedback;
}

const labReportsSlice = createSlice({
  name: 'labTechReports',
  initialState,
  reducers: {
    setLabReportsFeedback(state, action) {
      state.feedback = action.payload;
    },
    clearLabReportsFeedback(state) {
      state.feedback = null;
      state.error = null;
    },
    clearActiveDraft(state) {
      state.activeDraft = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabReportsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLabReportsData.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests;
        state.reports = action.payload.reports;
      })
      .addCase(fetchLabReportsData.rejected, (state, action) => {
        state.loading = false;
        const msg =
          action.payload ||
          action.error?.message ||
          'Failed to load lab reports data.';
        state.error = msg;
        state.feedback = { type: 'error', message: msg };
      })
      .addCase(fetchReportDraft.pending, (state) => {
        state.draftLoading = true;
        state.activeDraft = null;
      })
      .addCase(fetchReportDraft.fulfilled, (state, action) => {
        state.draftLoading = false;
        state.activeDraft = action.payload;
      })
      .addCase(fetchReportDraft.rejected, (state, action) => {
        state.draftLoading = false;
        const msg =
          action.payload ||
          action.error?.message ||
          'Failed to load existing draft report.';
        state.error = msg;
        state.feedback = { type: 'error', message: msg };
      })
      .addCase(saveLabReportDraft.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(saveLabReportDraft.fulfilled, (state, action) => {
        applyReportMutationResult(state, action.payload, {
          type: 'info',
          message: 'Draft saved successfully.',
        });
      })
      .addCase(saveLabReportDraft.rejected, (state, action) => {
        state.submitting = false;
        const msg =
          action.payload ||
          action.error?.message ||
          'Failed to save draft report.';
        state.error = msg;
        state.feedback = { type: 'error', message: msg };
      })
      .addCase(submitLabReport.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitLabReport.fulfilled, (state, action) => {
        applyReportMutationResult(state, action.payload, {
          type: 'success',
          message: 'Lab Report sent to Doctor and Patient!',
        });
      })
      .addCase(submitLabReport.rejected, (state, action) => {
        state.submitting = false;
        const msg =
          action.payload ||
          action.error?.message ||
          'Failed to submit lab report.';
        state.error = msg;
        state.feedback = { type: 'error', message: msg };
      })
      .addCase(logout, () => initialState)
      .addMatcher(
        (action) =>
          action.type === 'labTechTestRequests/accept/fulfilled' ||
          action.type === 'labTechTestRequests/reject/fulfilled',
        (state, action) => {
          if (action.payload?.id) {
            state.requests = upsertById(state.requests, action.payload, true);
          }
        }
      );
  },
});

export const {
  setLabReportsFeedback,
  clearLabReportsFeedback,
  clearActiveDraft,
} = labReportsSlice.actions;

export const selectLabReportsRequests = (state) =>
  state.labTechReports.requests;
export const selectLabReportsList = (state) => state.labTechReports.reports;
export const selectActiveReportDraft = (state) =>
  state.labTechReports.activeDraft;
export const selectLabReportsLoading = (state) => state.labTechReports.loading;
export const selectLabReportDraftLoading = (state) =>
  state.labTechReports.draftLoading;
export const selectLabReportsSubmitting = (state) =>
  state.labTechReports.submitting;
export const selectLabReportsError = (state) => state.labTechReports.error;
export const selectLabReportsFeedback = (state) =>
  state.labTechReports.feedback;

export default labReportsSlice.reducer;
