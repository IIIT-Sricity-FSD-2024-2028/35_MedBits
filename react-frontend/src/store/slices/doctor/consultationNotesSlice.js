/**
 * consultationNotesSlice.js — Doctor Consultation Notes State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/doctor/consultationNotesSlice.js
 *
 * Data:
 *   - `appointments` — the doctor's upcoming appointments (OPD queue)
 *   - `records`      — the doctor's consultation records
 *   - `labReports`   — lab reports submitted for this doctor
 *   - `labCatalog`   — diagnostic tests that can be ordered
 *   - `status`       — 'idle' | 'loading' | 'succeeded' | 'failed' (load)
 *   - `saveStatus`   — 'idle' | 'loading' | 'succeeded' | 'failed' (save)
 *   - `alert`        — { type: 'success' | 'error', text } | null
 *
 * View:
 *   - `viewMode`            — 'list' | 'editor'
 *   - `selectedPatient`     — patient shown in the note editor
 *   - `selectedAppointment` — appointment the note is being written for
 *   - `editingRecord`       — existing record being edited (null for new notes)
 *   - `activeReport`        — lab report open in the modal
 *
 * API:
 *   GET  /appointments/doctor/:doctorId
 *   GET  /medical-records/doctor/:doctorId
 *   GET  /labtests
 *   GET  /lab-reports/doctor            (x-user-id = doctorId)
 *   POST /medical-records               (new note)
 *   PUT  /medical-records/:id           (edit note)
 *   POST /appointments/:id/complete     (after a new note)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { extractDoctorError, getDoctorRequestUser, todayISO } from './doctorHelpers';

const LOAD_ERROR = 'Failed to load consultation data. Please check backend connection.';
const SAVE_ERROR = 'Failed to save note. Please check backend connection.';

const initialState = {
  appointments: [],
  records: [],
  labReports: [],
  labCatalog: [],
  status: 'idle',
  saveStatus: 'idle',
  alert: null,
  viewMode: 'list',
  selectedPatient: null,
  selectedAppointment: null,
  editingRecord: null,
  activeReport: null,
};

export const fetchConsultationData = createAsyncThunk(
  'consultationNotes/fetchData',
  async (_, { getState, rejectWithValue }) => {
    const user = getDoctorRequestUser(getState());
    const id = encodeURIComponent(user.id);

    const results = await Promise.allSettled([
      apiFetch(`/appointments/doctor/${id}`, { user }),
      apiFetch(`/medical-records/doctor/${id}`, { user }),
      apiFetch('/labtests', { user }),
      apiFetch('/lab-reports/doctor', { user }),
    ]);

    if (results.every((res) => res.status === 'rejected')) {
      return rejectWithValue(extractDoctorError(results[0]?.reason, LOAD_ERROR));
    }

    const [apptsResult, recordsResult, catalogResult, reportsResult] = results;

    return {
      // Only appointments still waiting for a consultation belong in the queue.
      appointments:
        apptsResult.status === 'fulfilled' && Array.isArray(apptsResult.value)
          ? apptsResult.value.filter((a) => a.status === 'upcoming')
          : null,
      records:
        recordsResult.status === 'fulfilled' && Array.isArray(recordsResult.value)
          ? recordsResult.value.filter((r) => r.type === 'consultation' || !r.type)
          : null,
      labCatalog:
        catalogResult.status === 'fulfilled' && Array.isArray(catalogResult.value)
          ? catalogResult.value
          : null,
      labReports:
        reportsResult.status === 'fulfilled' && Array.isArray(reportsResult.value)
          ? reportsResult.value
          : null,
    };
  }
);

/**
 * Saves the note open in the editor: PUT when editing an existing record,
 * otherwise POST a new record and complete the linked appointment.
 */
export const saveConsultationNote = createAsyncThunk(
  'consultationNotes/saveNote',
  async (notePayload, { getState, rejectWithValue }) => {
    const state = getState();
    const authUser = state.auth.user;
    const user = getDoctorRequestUser(state);
    const { editingRecord, selectedAppointment } = state.consultationNotes;

    const payload = {
      doctorId: user.id,
      doctorName: authUser?.name || 'Dr. Medical Officer',
      specialization: authUser?.specialization || 'General Physician',
      date: todayISO(),
      ...notePayload,
    };

    try {
      if (editingRecord?.id) {
        const record = await apiFetch(`/medical-records/${encodeURIComponent(editingRecord.id)}`, {
          user,
          method: 'PUT',
          body: payload,
        });
        return { mode: 'updated', record, previousId: editingRecord.id };
      }

      const record = await apiFetch('/medical-records', { user, method: 'POST', body: payload });

      const completedAppointmentId = notePayload.appointmentId || selectedAppointment?.id || null;
      if (completedAppointmentId) {
        // The note is saved even if completing the appointment fails.
        await apiFetch(`/appointments/${encodeURIComponent(completedAppointmentId)}/complete`, {
          user,
          method: 'POST',
        }).catch(() => {});
      }

      return { mode: 'created', record, completedAppointmentId };
    } catch {
      return rejectWithValue(SAVE_ERROR);
    }
  }
);

function closeEditor(state) {
  state.viewMode = 'list';
  state.selectedPatient = null;
  state.selectedAppointment = null;
  state.editingRecord = null;
}

const consultationNotesSlice = createSlice({
  name: 'consultationNotes',
  initialState,
  reducers: {
    /** Opens the editor for an appointment in the queue. */
    startConsultation(state, action) {
      const appointment = action.payload;
      const patient = appointment.patient
        ? { ...appointment.patient }
        : {
            name: appointment.patientName || appointment.userId,
            userId: appointment.userId || appointment.patientId,
            gender: appointment.gender,
            age: appointment.age,
          };
      if (!patient.appointmentId) patient.appointmentId = appointment.id;

      state.selectedAppointment = appointment;
      state.selectedPatient = patient;
      state.editingRecord = null;
      state.viewMode = 'editor';
      state.alert = null;
    },
    /** Opens the editor on an existing consultation record. */
    editRecord(state, action) {
      const rec = action.payload;
      state.selectedAppointment = null;
      state.selectedPatient = {
        name: rec.patientName || rec.patientId,
        userId: rec.patientId,
        gender: rec.gender,
        age: rec.age,
        appointmentId: rec.appointmentId,
      };
      state.editingRecord = rec;
      state.viewMode = 'editor';
      state.alert = null;
    },
    /** Opens an empty editor not tied to an appointment. */
    createNewNote(state) {
      state.selectedAppointment = null;
      state.selectedPatient = null;
      state.editingRecord = null;
      state.viewMode = 'editor';
    },
    backToList(state) {
      state.viewMode = 'list';
    },
    openLabReport(state, action) {
      state.activeReport = action.payload;
    },
    closeLabReport(state) {
      state.activeReport = null;
    },
    clearConsultationAlert(state) {
      state.alert = null;
    },
    /** Called when the page unmounts so it reopens on the list view. */
    resetConsultationView(state) {
      closeEditor(state);
      state.activeReport = null;
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConsultationData.pending, (state) => {
        state.status = 'loading';
        if (state.alert?.isLoadError) {
          state.alert = null;
        }
      })
      .addCase(fetchConsultationData.fulfilled, (state, action) => {
        const { appointments, records, labCatalog, labReports } = action.payload;
        state.status = 'succeeded';
        if (appointments !== null) state.appointments = appointments;
        // Keep the previous list if one of the optional endpoints failed.
        if (records !== null) state.records = records;
        if (labCatalog !== null) state.labCatalog = labCatalog;
        if (labReports !== null) state.labReports = labReports;
        if (state.alert?.isLoadError) {
          state.alert = null;
        }
      })
      .addCase(fetchConsultationData.rejected, (state, action) => {
        state.status = 'failed';
        state.alert = {
          type: 'error',
          text: action.payload || LOAD_ERROR,
          isLoadError: true,
        };
      })
      .addCase(saveConsultationNote.pending, (state) => {
        state.saveStatus = 'loading';
        state.alert = null;
      })
      .addCase(saveConsultationNote.fulfilled, (state, action) => {
        const { mode, record, previousId, completedAppointmentId } = action.payload;
        state.saveStatus = 'succeeded';

        if (mode === 'updated') {
          // Replace in place so editing never creates a duplicate record.
          state.records = state.records.map((r) => (r.id === previousId ? record : r));
          state.alert = { type: 'success', text: 'Consultation note updated successfully!' };
        } else {
          state.records = [record, ...state.records];
          if (completedAppointmentId) {
            state.appointments = state.appointments.filter((a) => a.id !== completedAppointmentId);
          }
          state.alert = { type: 'success', text: 'Consultation note saved successfully!' };
        }

        closeEditor(state);
      })
      .addCase(saveConsultationNote.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.alert = { type: 'error', text: action.payload || SAVE_ERROR };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  startConsultation,
  editRecord,
  createNewNote,
  backToList,
  openLabReport,
  closeLabReport,
  clearConsultationAlert,
  resetConsultationView,
} = consultationNotesSlice.actions;

export const selectConsultationNotes = (state) => state.consultationNotes;

export default consultationNotesSlice.reducer;
