/**
 * treatmentPlanSlice.js — Doctor Treatment Plan State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/doctor/treatmentPlanSlice.js
 *
 * Data:
 *   - `plans`        — treatment-type medical records created by the doctor
 *   - `labCatalog`   — lab tests that can be ordered (default list until loaded)
 *   - `appointments` — the doctor's appointments (to link a plan)
 *   - `patients`     — patients from /patients merged with appointment patients
 *   - `status`       — 'idle' | 'loading' | 'succeeded' | 'failed' (load)
 *   - `saveStatus`   — 'idle' | 'loading' | 'succeeded' | 'failed' (save)
 *   - `alert`        — { type: 'success' | 'error', text } | null
 *
 * View / form:
 *   - `viewMode`      — 'list' | 'create'
 *   - `form`          — new plan draft
 *   - `selectedTests` — lab test names ticked in the form
 *   - `testSearch`    — filter text for the lab test list
 *   - `search`        — filter text for the plans list
 *
 * API:
 *   GET  /medical-records/doctor/:doctorId
 *   GET  /labtests
 *   GET  /appointments/doctor/:doctorId
 *   GET  /patients
 *   POST /medical-records
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import {
  buildPatientList,
  fetchListOrNull,
  getAppointmentPatient,
  getDoctorRequestUser,
  normalizePatient,
  todayISO,
} from './doctorHelpers';

const DEFAULT_LAB_TESTS = [
  { id: 'LT001', name: 'Complete Blood Count (CBC)', price: 400, department: 'Hematology' },
  { id: 'LT002', name: 'Lipid Profile', price: 750, department: 'Biochemistry' },
  { id: 'LT003', name: 'Fasting Blood Sugar', price: 150, department: 'Biochemistry' },
  { id: 'LT004', name: 'Liver Function Test (LFT)', price: 800, department: 'Biochemistry' },
  { id: 'LT005', name: 'Kidney Function Test (KFT)', price: 700, department: 'Biochemistry' },
  { id: 'LT006', name: 'Thyroid Profile (T3, T4, TSH)', price: 650, department: 'Endocrinology' },
  { id: 'LT007', name: 'Urine Routine Examination', price: 200, department: 'Clinical Pathology' },
  { id: 'LT008', name: 'HbA1c', price: 500, department: 'Biochemistry' },
];

export const EMPTY_TREATMENT_FORM = {
  patientId: '',
  patientName: '',
  appointmentId: '',
  medicines: '',
  lifestyle: '',
  diet: '',
  duration: '',
  labTestDate: '',
};

const initialState = {
  plans: [],
  labCatalog: DEFAULT_LAB_TESTS,
  appointments: [],
  patients: [],
  status: 'idle',
  saveStatus: 'idle',
  alert: null,
  viewMode: 'list',
  form: EMPTY_TREATMENT_FORM,
  selectedTests: [],
  testSearch: '',
  search: '',
};

export const fetchTreatmentData = createAsyncThunk(
  'treatmentPlan/fetchData',
  async (_, { getState }) => {
    const user = getDoctorRequestUser(getState());
    const id = encodeURIComponent(user.id);

    const [records, labCatalog, appointments, patients] = await Promise.all([
      fetchListOrNull(`/medical-records/doctor/${id}`, user),
      fetchListOrNull('/labtests', user),
      fetchListOrNull(`/appointments/doctor/${id}`, user),
      fetchListOrNull('/patients', user),
    ]);

    return {
      plans: records ? records.filter((r) => r.type === 'treatment') : null,
      labCatalog: labCatalog && labCatalog.length > 0 ? labCatalog : null,
      appointments: appointments ?? [],
      patients: buildPatientList(appointments ?? [], patients ?? []),
    };
  }
);

/**
 * Saves the plan in the form as a treatment-type medical record. If the
 * backend is unreachable the plan is kept locally (offline/demo mode), as before.
 */
export const saveTreatmentPlan = createAsyncThunk(
  'treatmentPlan/save',
  async (_, { getState }) => {
    const state = getState();
    const authUser = state.auth.user;
    const user = getDoctorRequestUser(state);
    const { form, selectedTests } = state.treatmentPlan;

    const payload = {
      doctorId: user.id,
      doctorName: authUser?.name || 'Dr. S Madhuri',
      specialization: authUser?.specialization || 'Dermatologist',
      patientId: form.patientId.trim(),
      patientName: form.patientName.trim() || form.patientId.trim(),
      type: 'treatment',
      date: todayISO(),
      medicines: form.medicines.trim() || undefined,
      tests: selectedTests.length > 0 ? selectedTests.join(' | ') : undefined,
      labTestDate: form.labTestDate || undefined,
      lifestyle: form.lifestyle.trim() || undefined,
      diet: form.diet.trim() || undefined,
      duration: form.duration.trim() || undefined,
      appointmentId: form.appointmentId.trim() || undefined,
    };

    try {
      return await apiFetch('/medical-records', { user, method: 'POST', body: payload });
    } catch {
      return { id: `TP${Date.now()}`, ...payload, createdAt: new Date().toISOString() };
    }
  }
);

function clearForm(state) {
  state.form = EMPTY_TREATMENT_FORM;
  state.selectedTests = [];
}

const treatmentPlanSlice = createSlice({
  name: 'treatmentPlan',
  initialState,
  reducers: {
    setTreatmentViewMode(state, action) {
      state.viewMode = action.payload;
      state.alert = null;
    },
    updateTreatmentField(state, action) {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    /** Picks a patient and fills in their display name. */
    selectTreatmentPatient(state, action) {
      const patientId = action.payload;
      const patient = state.patients.find((p) => (p.userId || p.id) === patientId);
      state.form.patientId = patientId;
      state.form.patientName = patient
        ? patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patientId
        : '';
    },
    /** Links an appointment and auto-fills its patient. */
    selectTreatmentAppointment(state, action) {
      const apptId = action.payload;
      const appt = apptId ? state.appointments.find((a) => a.id === apptId) : null;
      if (!appt) {
        state.form.appointmentId = '';
        return;
      }

      const { patientId, patientName } = getAppointmentPatient(appt);
      if (patientId && !state.patients.some((p) => (p.userId || p.id) === patientId)) {
        state.patients.push(normalizePatient({ userId: patientId, name: patientName }));
      }
      state.form.appointmentId = apptId;
      state.form.patientId = patientId;
      state.form.patientName = patientName;
    },
    toggleLabTest(state, action) {
      const testName = action.payload;
      state.selectedTests = state.selectedTests.includes(testName)
        ? state.selectedTests.filter((t) => t !== testName)
        : [...state.selectedTests, testName];
    },
    setTestSearch(state, action) {
      state.testSearch = action.payload;
    },
    setPlanSearch(state, action) {
      state.search = action.payload;
    },
    resetTreatmentForm: clearForm,
    setTreatmentAlert(state, action) {
      state.alert = action.payload;
    },
    clearTreatmentAlert(state) {
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTreatmentData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTreatmentData.fulfilled, (state, action) => {
        const { plans, labCatalog, appointments, patients } = action.payload;
        state.status = 'succeeded';
        if (plans) state.plans = plans;
        if (labCatalog) state.labCatalog = labCatalog;
        state.appointments = appointments;
        state.patients = patients;
      })
      .addCase(fetchTreatmentData.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(saveTreatmentPlan.pending, (state) => {
        state.saveStatus = 'loading';
        state.alert = null;
      })
      .addCase(saveTreatmentPlan.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.plans.unshift(action.payload);
        state.alert = { type: 'success', text: 'Treatment plan saved successfully!' };
        clearForm(state);
        state.viewMode = 'list';
      })
      .addCase(saveTreatmentPlan.rejected, (state) => {
        state.saveStatus = 'failed';
        state.alert = { type: 'error', text: 'Failed to save treatment plan.' };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setTreatmentViewMode,
  updateTreatmentField,
  selectTreatmentPatient,
  selectTreatmentAppointment,
  toggleLabTest,
  setTestSearch,
  setPlanSearch,
  resetTreatmentForm,
  setTreatmentAlert,
  clearTreatmentAlert,
} = treatmentPlanSlice.actions;

export const selectTreatmentPlan = (state) => state.treatmentPlan;

export default treatmentPlanSlice.reducer;
