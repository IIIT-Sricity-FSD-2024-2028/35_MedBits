/**
 * frontdeskDashboardSlice.js — Frontdesk Operations Dashboard State (Redux Toolkit)
 * ==================================================================================
 * Location: src/store/slices/frontdesk/frontdeskDashboardSlice.js
 *
 * Fetches and aggregates live operational metrics and the OPD queue table from:
 *   - GET /queue
 *   - GET /walkins
 *   - GET /appointments
 *   - GET /doctors
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logout } from '../authSlice';
import {
  fetchFrontdeskResource,
  getFrontdeskRequestUser,
  getPatientDisplayName,
  todayLocalISO,
} from './frontdeskHelpers';

const INITIAL_STATS = {
  walkinsTotal: 0,
  walkinsToday: 0,
  queueActive: 0,
  queueWaiting: 0,
  queueConsulting: 0,
  doctorsTotal: 0,
  appointmentsTotal: 0,
  appointmentsToday: 0,
  appointmentsUpcoming: 0,
};

const initialState = {
  queueData: [],
  stats: INITIAL_STATS,
  status: 'idle',
  error: null,
};

function deriveDashboardState(rawQueue, rawWalkins, rawAppts, rawDoctors) {
  const todayIsoDate = todayLocalISO();

  // 1. Walk-in statistics
  const walkinsList = Array.isArray(rawWalkins) ? rawWalkins : [];
  const walkinsTotal = walkinsList.length;
  const walkinsToday = walkinsList.filter(
    (w) => w.createdAt && w.createdAt.slice(0, 10) === todayIsoDate
  ).length;

  // 2. Doctors statistics & lookup map
  const doctorsList = Array.isArray(rawDoctors) ? rawDoctors : [];
  const doctorsTotal = doctorsList.length;
  const doctorMap = new Map();
  doctorsList.forEach((doc) => {
    if (doc.id) doctorMap.set(doc.id, doc);
    if (doc.userId) doctorMap.set(doc.userId, doc);
  });

  // 3. Queue statistics & table row mapping
  const queueList = Array.isArray(rawQueue) ? rawQueue : [];
  const queueWaiting = queueList.filter((q) => q.status === 'waiting').length;
  const queueConsulting = queueList.filter((q) => q.status === 'in-consultation').length;
  const queueActive = queueWaiting + queueConsulting;

  const doctorWaitingQueues = new Map();
  queueList.forEach((q) => {
    if (q.status === 'waiting') {
      const docId = q.doctorId || 'default';
      if (!doctorWaitingQueues.has(docId)) {
        doctorWaitingQueues.set(docId, []);
      }
      doctorWaitingQueues.get(docId).push(q.id);
    }
  });

  const queueData = queueList.map((item, index) => {
    const matchedDoctor = doctorMap.get(item.doctorId) || item.doctor || {};
    const doctorName =
      matchedDoctor.name ||
      item.doctor?.name ||
      (item.doctorId ? `Doctor #${item.doctorId}` : 'Assigned Doctor');
    const doctorCode = item.doctorId || matchedDoctor.id || '';
    const patientName = getPatientDisplayName(item);

    const dept =
      matchedDoctor.department ||
      matchedDoctor.specialization ||
      item.doctor?.department ||
      item.doctor?.specialization ||
      'General OPD';

    let room = 'OPD Room';
    if (dept) {
      const trimmedDept = dept.trim();
      room = trimmedDept.toLowerCase().endsWith('opd') ? trimmedDept : `${trimmedDept} OPD`;
    }

    let statusLabel = 'Waiting';
    let waitTime = 'In Queue';
    if (item.status === 'in-consultation') {
      statusLabel = 'In Consultation';
      waitTime = 'Current';
    } else if (item.status === 'waiting') {
      statusLabel = 'Waiting';
      const waitingIds = doctorWaitingQueues.get(item.doctorId || 'default') || [];
      const doctorPos = waitingIds.indexOf(item.id) + 1;
      waitTime = doctorPos > 0 ? `Position #${doctorPos}` : 'In Queue';
    } else if (item.status === 'done') {
      statusLabel = 'Completed';
      waitTime = 'Done';
    }

    const tokenFormatted = item.tokenNumber
      ? `TK-${String(item.tokenNumber).padStart(3, '0')}`
      : `#${index + 1}`;

    return {
      id: item.id || `queue-${index}`,
      token: tokenFormatted,
      doctorCode,
      tokenNumber: item.tokenNumber,
      patient: patientName,
      doctor: doctorName,
      room,
      waitTime,
      status: statusLabel,
      rawStatus: item.status,
    };
  });

  // 4. Appointments statistics
  const apptsList = Array.isArray(rawAppts) ? rawAppts : [];
  const appointmentsTotal = apptsList.length;
  const appointmentsToday = apptsList.filter((a) => a.date === todayIsoDate).length;
  const appointmentsUpcoming = apptsList.filter((a) => a.status === 'upcoming').length;

  return {
    queueData,
    stats: {
      walkinsTotal,
      walkinsToday,
      queueActive,
      queueWaiting,
      queueConsulting,
      doctorsTotal,
      appointmentsTotal,
      appointmentsToday,
      appointmentsUpcoming,
    },
  };
}

export const fetchFrontdeskDashboard = createAsyncThunk(
  'frontdeskDashboard/fetchDashboard',
  async (_, { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());

    const results = await Promise.allSettled([
      fetchFrontdeskResource('/queue', requestUser, 'Queue'),
      fetchFrontdeskResource('/walkins', requestUser, 'Walk-ins'),
      fetchFrontdeskResource('/appointments', requestUser, 'Appointments'),
      fetchFrontdeskResource('/doctors', requestUser, 'Doctors'),
    ]);

    const failures = results
      .filter((res) => res.status === 'rejected')
      .map((res) => res.reason?.message || 'Request failed');

    if (failures.length > 0) {
      return rejectWithValue(`Server returned error for: ${failures.join(', ')}`);
    }

    const [rawQueue, rawWalkins, rawAppts, rawDoctors] = results.map((res) => res.value);
    return deriveDashboardState(rawQueue, rawWalkins, rawAppts, rawDoctors);
  }
);

const frontdeskDashboardSlice = createSlice({
  name: 'frontdeskDashboard',
  initialState,
  reducers: {
    clearFrontdeskDashboardError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFrontdeskDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFrontdeskDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.queueData = action.payload.queueData;
        state.stats = action.payload.stats;
        state.error = null;
      })
      .addCase(fetchFrontdeskDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.payload ||
          'Unable to connect to backend server on port 3000. Ensure the NestJS backend is running.';
      })
      .addCase(logout, () => initialState);
  },
});

export const { clearFrontdeskDashboardError } = frontdeskDashboardSlice.actions;

export const selectFrontdeskDashboard = (state) => state.frontdeskDashboard;
export const selectFrontdeskQueueData = (state) => state.frontdeskDashboard.queueData;
export const selectFrontdeskDashboardStats = (state) => state.frontdeskDashboard.stats;
export const selectFrontdeskDashboardStatus = (state) => state.frontdeskDashboard.status;
export const selectFrontdeskDashboardError = (state) => state.frontdeskDashboard.error;

export default frontdeskDashboardSlice.reducer;
