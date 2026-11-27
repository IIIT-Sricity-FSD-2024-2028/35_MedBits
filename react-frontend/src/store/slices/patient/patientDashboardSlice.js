/**
 * patientDashboardSlice.js — Patient Dashboard State (Redux Toolkit)
 * =====================================================================
 * Location: src/store/slices/patient/patientDashboardSlice.js
 *
 * Manages state for the Patient Dashboard page:
 *   - `appointments` — formatted upcoming/active appointments for table display
 *   - `labOrders`    — formatted lab requests / diagnostic orders for table display
 *   - `status`       — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `error`        — string | null
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

const initialState = {
  appointments: [],
  labOrders: [],
  status: 'idle',
  error: null,
};

async function fetchListOrEmpty(path, requestUser) {
  try {
    const data = await apiFetch(path, { user: requestUser });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err?.message?.startsWith('Network error')) {
      throw err;
    }
    return [];
  }
}

export const fetchPatientDashboard = createAsyncThunk(
  'patientDashboard/fetchDashboard',
  async (patientId, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const targetId = patientId || user?.id;

    if (!targetId) {
      return { appointments: [], labOrders: [] };
    }

    const requestUser = {
      ...user,
      id: targetId,
      role: user?.role || 'patient',
    };
    const encodedId = encodeURIComponent(targetId);

    try {
      // 1. Fetch upcoming appointments directly, fallback to all non-cancelled
      let aptList = await fetchListOrEmpty(
        `/appointments/user/${encodedId}?status=upcoming`,
        requestUser
      );
      if (!aptList.length) {
        const allApt = await fetchListOrEmpty(
          `/appointments/user/${encodedId}`,
          requestUser
        );
        aptList = allApt.filter((item) => item.status !== 'cancelled');
      }

      // 2. Fetch lab orders directly, fallback to lab test history
      let labList = await fetchListOrEmpty('/lab-requests/patient', requestUser);
      if (!labList.length) {
        labList = await fetchListOrEmpty(
          `/labtests/history/${encodedId}`,
          requestUser
        );
      }

      const appointments = aptList.map((apt) => ({
        doctor: apt.doctor?.name || apt.doctorName || 'Consulting Doctor',
        department: apt.doctor?.department || apt.doctor?.specialization || 'OPD',
        dateTime: `${apt.date || 'Scheduled'}${apt.slot ? ` • ${apt.slot}` : ''}`,
        status: apt.status || 'Upcoming',
      }));

      const labOrders = labList.map((lab) => ({
        testName: lab.testName || lab.labTest?.name || 'Diagnostic Test',
        doctor: lab.doctorName || 'Pathology Department',
        date:
          lab.requestDate ||
          lab.date ||
          (lab.createdAt ? lab.createdAt.split('T')[0] : 'Recent'),
        status: lab.status || 'Pending',
      }));

      return { appointments, labOrders };
    } catch {
      return rejectWithValue('Unable to connect to the backend server.');
    }
  }
);

const patientDashboardSlice = createSlice({
  name: 'patientDashboard',
  initialState,
  reducers: {
    clearPatientDashboardError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPatientDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appointments = action.payload.appointments;
        state.labOrders = action.payload.labOrders;
        state.error = null;
      })
      .addCase(fetchPatientDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to connect to the backend server.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearPatientDashboardError } = patientDashboardSlice.actions;

export const selectPatientDashboardAppointments = (state) =>
  state.patientDashboard.appointments;
export const selectPatientDashboardLabOrders = (state) =>
  state.patientDashboard.labOrders;
export const selectPatientDashboardStatus = (state) =>
  state.patientDashboard.status;
export const selectPatientDashboardError = (state) =>
  state.patientDashboard.error;

export default patientDashboardSlice.reducer;
