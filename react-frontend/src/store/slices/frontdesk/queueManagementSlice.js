/**
 * queueManagementSlice.js — Frontdesk OPD Queue & Token State (Redux Toolkit)
 * ==============================================================================
 * Location: src/store/slices/frontdesk/queueManagementSlice.js
 *
 * Manages state for Frontdesk Queue Management:
 *   - `queueItems`, `patients`, `doctors`
 *   - Filters: `selectedDoctorFilter`, `statusFilter`, `searchQuery`
 *   - Token issuance modal: `isTokenModalOpen`, `issuedTokenData`
 *   - Async/mutation flags: `status`, `isGenerating`, `updatingId`, `alert`
 *
 * APIs:
 *   - GET  /queue
 *   - POST /queue
 *   - PUT  /queue/:id
 *   - GET  /patients
 *   - GET  /doctors
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import {
  extractErrorMessage,
  fetchFrontdeskResource,
  getFrontdeskRequestUser,
  getPatientDisplayName,
} from './frontdeskHelpers';

const initialState = {
  queueItems: [],
  patients: [],
  doctors: [],
  selectedDoctorFilter: '',
  statusFilter: 'all',
  searchQuery: '',
  status: 'idle',
  isGenerating: false,
  updatingId: null,
  isTokenModalOpen: false,
  issuedTokenData: null,
  alert: null,
};

function normalizeDoctors(doctorsList) {
  if (!Array.isArray(doctorsList)) return [];
  return doctorsList.map((d) => ({
    ...d,
    id: d.userId || d.id,
    userId: d.userId || d.id,
  }));
}

function normalizePatients(patientsList) {
  if (!Array.isArray(patientsList)) return [];
  const seen = new Set();
  const normalized = [];
  for (const p of patientsList) {
    const patId = (p?.userId || p?.id || '').trim();
    if (!patId || seen.has(patId)) continue;
    seen.add(patId);
    normalized.push({
      ...p,
      id: patId,
      userId: patId,
    });
  }
  return normalized;
}

function enrichQueueItems(rawQueue, doctors = [], patients = []) {
  if (!Array.isArray(rawQueue)) return [];
  return rawQueue.map((item) => {
    const docObj =
      item.doctor && item.doctor.name
        ? item.doctor
        : doctors.find((d) => d.id === item.doctorId || d.userId === item.doctorId) ||
          item.doctor ||
          {};
    const patObj =
      item.patient && (item.patient.name || item.patient.firstName)
        ? item.patient
        : patients.find((p) => p.userId === item.userId || p.id === item.userId) ||
          item.patient ||
          {};

    return {
      ...item,
      doctor: docObj,
      patient: patObj,
    };
  });
}

export const fetchQueueInitialData = createAsyncThunk(
  'queueManagement/fetchInitialData',
  async (_, { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());

    const [patRes, docRes, queueRes] = await Promise.allSettled([
      fetchFrontdeskResource('/patients', requestUser, 'Patients'),
      fetchFrontdeskResource('/doctors', requestUser, 'Doctors'),
      fetchFrontdeskResource('/queue', requestUser, 'Queue'),
    ]);

    const patients =
      patRes.status === 'fulfilled' ? normalizePatients(patRes.value) : [];
    const doctors =
      docRes.status === 'fulfilled' ? normalizeDoctors(docRes.value) : [];

    const failures = [patRes, docRes, queueRes]
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Request failed');

    if (queueRes.status === 'rejected') {
      return rejectWithValue({
        patients,
        doctors,
        message: `Failed to load clinic queue: ${failures.join(', ')}`,
      });
    }

    const queueItems = enrichQueueItems(queueRes.value, doctors, patients);
    const warning =
      failures.length > 0 ? `Partial load issue: ${failures.join(', ')}` : null;

    return { patients, doctors, queueItems, warning };
  }
);

export const refreshQueue = createAsyncThunk(
  'queueManagement/refreshQueue',
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const requestUser = getFrontdeskRequestUser(state);
    const { doctors, patients } = state.queueManagement;

    try {
      const data = await apiFetch('/queue', { user: requestUser });
      return enrichQueueItems(data, doctors, patients);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to refresh clinic queue.'));
    }
  }
);

export const generateQueueToken = createAsyncThunk(
  'queueManagement/generateToken',
  async ({ patientId, doctorId }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const requestUser = getFrontdeskRequestUser(state);
    const { doctors, patients, queueItems } = state.queueManagement;
    const cleanPatientId = (patientId || '').trim();

    const existingActive = queueItems.find(
      (q) =>
        q.userId === cleanPatientId &&
        (q.status === 'waiting' || q.status === 'in-consultation')
    );
    if (existingActive) {
      const statusLabel =
        existingActive.status === 'in-consultation' ? 'In Consultation' : 'Waiting';
      return rejectWithValue(
        `Patient ${cleanPatientId} already has Active Token #${existingActive.tokenNumber} (${statusLabel}). Mark it Done before generating a new token.`
      );
    }

    const selectedDoctor = doctors.find(
      (d) => (d.id || d.userId) === doctorId
    );

    const payload = {
      userId: cleanPatientId,
      doctorId,
      ...(selectedDoctor?.branchId ? { branchId: selectedDoctor.branchId } : {}),
    };

    try {
      const createdToken = await apiFetch('/queue', {
        user: requestUser,
        method: 'POST',
        body: payload,
      });

      const [enriched] = enrichQueueItems([createdToken], doctors, patients);
      await dispatch(refreshQueue());
      return enriched || createdToken;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Unable to issue token.'));
    }
  }
);

export const updateQueueItemStatus = createAsyncThunk(
  'queueManagement/updateStatus',
  async ({ queueId, nextStatus }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const { queueItems } = state.queueManagement;

    // Business rule: only one patient can be in-consultation at a time per doctor
    if (nextStatus === 'in-consultation') {
      const currentItem = queueItems.find((q) => q.id === queueId);
      if (currentItem) {
        const activeConsultation = queueItems.find(
          (q) =>
            q.doctorId === currentItem.doctorId &&
            q.status === 'in-consultation' &&
            q.id !== queueId
        );

        if (activeConsultation) {
          const docName =
            activeConsultation.doctor?.name || activeConsultation.doctorId || 'Doctor';
          const currentPatient = getPatientDisplayName(activeConsultation);
          return rejectWithValue(
            `${docName} is currently consulting with ${currentPatient}. Please mark the active consultation as Done before calling in another patient.`
          );
        }
      }
    }

    const requestUser = getFrontdeskRequestUser(state);
    try {
      await apiFetch(`/queue/${encodeURIComponent(queueId)}`, {
        user: requestUser,
        method: 'PUT',
        body: { status: nextStatus },
      });

      await dispatch(refreshQueue());
      return { queueId, nextStatus };
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to update queue status.')
      );
    }
  }
);

const queueManagementSlice = createSlice({
  name: 'queueManagement',
  initialState,
  reducers: {
    setSelectedDoctorFilter(state, action) {
      state.selectedDoctorFilter = action.payload;
    },
    setQueueStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    setQueueSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    closeTokenModal(state) {
      state.isTokenModalOpen = false;
      state.issuedTokenData = null;
    },
    setQueueAlert(state, action) {
      state.alert = action.payload;
    },
    clearQueueAlert(state) {
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueueInitialData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchQueueInitialData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.patients = action.payload.patients;
        state.doctors = action.payload.doctors;
        state.queueItems = action.payload.queueItems;
        if (action.payload.warning) {
          state.alert = { type: 'error', text: action.payload.warning };
        }
      })
      .addCase(fetchQueueInitialData.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload?.patients) state.patients = action.payload.patients;
        if (action.payload?.doctors) state.doctors = action.payload.doctors;
        state.alert = {
          type: 'error',
          text: action.payload?.message || 'Unable to load clinic queue from backend.',
        };
      })
      .addCase(refreshQueue.fulfilled, (state, action) => {
        state.queueItems = action.payload;
      })
      .addCase(refreshQueue.rejected, (state, action) => {
        state.alert = {
          type: 'error',
          text: action.payload || 'Failed to refresh clinic queue.',
        };
      })
      .addCase(generateQueueToken.pending, (state) => {
        state.isGenerating = true;
        state.alert = null;
      })
      .addCase(generateQueueToken.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.issuedTokenData = action.payload;
        state.isTokenModalOpen = true;
      })
      .addCase(generateQueueToken.rejected, (state, action) => {
        state.isGenerating = false;
        state.alert = {
          type: 'error',
          text: action.payload || 'Unable to issue queue token.',
        };
      })
      .addCase(updateQueueItemStatus.pending, (state, action) => {
        state.updatingId = action.meta.arg.queueId;
        state.alert = null;
      })
      .addCase(updateQueueItemStatus.fulfilled, (state, action) => {
        state.updatingId = null;
        const { nextStatus } = action.payload;
        state.alert = {
          type: 'success',
          text: `Queue entry marked as ${
            nextStatus === 'in-consultation' ? 'In Consultation' : 'Completed'
          }.`,
        };
      })
      .addCase(updateQueueItemStatus.rejected, (state, action) => {
        state.updatingId = null;
        state.alert = {
          type: 'error',
          text: action.payload || 'Failed to update queue status.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setSelectedDoctorFilter,
  setQueueStatusFilter,
  setQueueSearchQuery,
  closeTokenModal,
  setQueueAlert,
  clearQueueAlert,
} = queueManagementSlice.actions;

export const selectQueueManagementState = (state) => state.queueManagement;

export default queueManagementSlice.reducer;
