/**
 * labTechDashboardSlice.js — Lab Technician Dashboard State (Redux Toolkit)
 * ==============================================================================
 * Location: src/store/slices/labTech/labTechDashboardSlice.js
 *
 * Manages live operational metrics and recent test requests for LabTechDashboard.jsx:
 *   - `recentRequests` — formatted list of recent diagnostic orders
 *   - `stats`          — KPI cards (pendingTests, completedReports, samplesCollected, criticalAlerts)
 *   - `status`         — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `error`          — last API error message
 *
 * API:
 *   GET /lab-requests
 *   GET /lab-reports
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { extractErrorMessage, getLabTechRequestUser } from './labTechHelpers';

const INITIAL_STATS = {
  pendingTests: 0,
  completedReports: 0,
  samplesCollected: 0,
  criticalAlerts: 0,
};

const initialState = {
  recentRequests: [],
  stats: INITIAL_STATS,
  status: 'idle',
  error: null,
};

function formatRequestPriority(req) {
  const isUrgent =
    req.priority === 'urgent' ||
    req.priority === 'stat' ||
    String(req.testName || '').toLowerCase().includes('stat') ||
    String(req.remarks || '').toLowerCase().includes('urgent');
  return isUrgent ? 'STAT (Urgent)' : 'Routine';
}

function formatRequestStatus(status) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
    case 'draft_report':
      return 'In Analysis';
    case 'accepted':
      return 'Sample Received';
    case 'pending':
    default:
      return 'Pending Collection';
  }
}

export const fetchLabTechDashboard = createAsyncThunk(
  'labTechDashboard/fetchDashboard',
  async (_, { getState, rejectWithValue }) => {
    const user = getLabTechRequestUser(getState());

    try {
      const [reqsResult, repsResult] = await Promise.allSettled([
        apiFetch('/lab-requests', { user }),
        apiFetch('/lab-reports', { user }),
      ]);

      if (reqsResult.status === 'rejected' && repsResult.status === 'rejected') {
        throw (
          reqsResult.reason ||
          repsResult.reason ||
          new Error('Failed to load laboratory dashboard data.')
        );
      }

      const reqsData = reqsResult.status === 'fulfilled' ? reqsResult.value : [];
      const repsData = repsResult.status === 'fulfilled' ? repsResult.value : [];

      const requests = Array.isArray(reqsData) ? reqsData : [];
      const reports = Array.isArray(repsData) ? repsData : [];

      // Calculate stats
      const pendingTests = requests.filter(
        (r) => r.status === 'pending' || r.status === 'in_progress' || r.status === 'accepted'
      ).length;
      const completedReports = reports.length;
      const samplesCollected = requests.filter(
        (r) => r.status === 'accepted' || r.status === 'in_progress' || r.status === 'completed'
      ).length;
      const criticalAlerts = requests.filter(
        (r) => r.priority === 'urgent' || r.priority === 'stat'
      ).length;

      // Map up to 10 most recent orders for table
      const sortedRequests = [...requests].sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );

      const recentRequests = sortedRequests.slice(0, 10).map((req, idx) => ({
        id: req.id || `LAB-${880 + idx}`,
        patient: req.patientName || req.patientId || 'Patient',
        test: req.testName || 'Diagnostic Lab Test',
        doctor: req.doctorName || 'Referring Doctor',
        priority: formatRequestPriority(req),
        status: formatRequestStatus(req.status),
      }));

      return {
        recentRequests,
        stats: {
          pendingTests,
          completedReports,
          samplesCollected,
          criticalAlerts,
        },
      };
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load laboratory dashboard data.')
      );
    }
  }
);

const labTechDashboardSlice = createSlice({
  name: 'labTechDashboard',
  initialState,
  reducers: {
    clearLabTechDashboardError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabTechDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLabTechDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.recentRequests = action.payload.recentRequests;
        state.stats = action.payload.stats;
        state.error = null;
      })
      .addCase(fetchLabTechDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load laboratory dashboard data.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearLabTechDashboardError } = labTechDashboardSlice.actions;

export const selectLabTechDashboardRecentRequests = (state) =>
  state.labTechDashboard.recentRequests;
export const selectLabTechDashboardStats = (state) =>
  state.labTechDashboard.stats;
export const selectLabTechDashboardStatus = (state) =>
  state.labTechDashboard.status;
export const selectLabTechDashboardError = (state) =>
  state.labTechDashboard.error;

export default labTechDashboardSlice.reducer;
