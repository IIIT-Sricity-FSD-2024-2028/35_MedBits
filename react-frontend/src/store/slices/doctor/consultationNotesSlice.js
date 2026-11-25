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
import { fetchListOrNull, getDoctorRequestUser, todayISO } from './doctorHelpers';

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
  async (_, { getState }) => {
    const user = getDoctorRequestUser(getState());
    const id = encodeURIComponent(user.id);

    const [appointments, records, labCatalog, labReports] = await Promise.all([
      fetchListOrNull(`/appointments/doctor/${id}`, user),
      fetchListOrNull(`/medical-records/doctor/${id}`, user),
      fetchListOrNull('/labtests', user),
      fetchListOrNull('/lab-reports/doctor', user),
    ]);

    return {
      // Only appointments still waiting for a consultation belong in the queue.
      appointments: (appointments ?? []).filter((a) => a.status === 'upcoming'),
      records: records ? records.filter((r) => r.type === 'consultation' || !r.type) : null,
      labCatalog,
      labReports,
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
      })
      .addCase(fetchConsultationData.fulfilled, (state, action) => {
        const { appointments, records, labCatalog, labReports } = action.payload;
        state.status = 'succeeded';
        state.appointments = appointments;
        // Keep the previous list if one of the optional endpoints failed.
        if (records) state.records = records;
        if (labCatalog) state.labCatalog = labCatalog;
        if (labReports) state.labReports = labReports;
      })
      .addCase(fetchConsultationData.rejected, (state) => {
        state.status = 'failed';
        state.appointments = [];
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
