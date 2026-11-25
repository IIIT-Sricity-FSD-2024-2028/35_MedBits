/**
 * internalReferralSlice.js — Doctor Internal Referral State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/doctor/internalReferralSlice.js
 *
 * Data:
 *   - `doctors`      — other doctors the patient can be referred to
 *   - `patients`     — patients from /patients merged with appointment patients
 *   - `appointments` — the doctor's appointments (to link a referral)
 *   - `referrals`    — referrals sent by or to this doctor
 *   - `status`       — 'idle' | 'loading' | 'succeeded' | 'failed' (load)
 *   - `submitStatus` — 'idle' | 'loading' | 'succeeded' | 'failed' (send)
 *   - `alert`        — { type: 'success' | 'error', text } | null
 *
 * View / form:
 *   - `activeTab`    — 'new' | 'sent' | 'received'
 *   - `form`         — new referral draft
 *   - `doctorSearch` — filter text for the doctor browser
 *
 * API:
 *   GET  /doctors
 *   GET  /patients
 *   GET  /appointments/doctor/:doctorId
 *   GET  /doctors/:doctorId/referrals
 *   POST /doctors/:doctorId/referrals
 *   PUT  /doctors/:doctorId/referrals/:referralId/status
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
} from './doctorHelpers';

const REFERRAL_HISTORY_KEY = 'referralHistory';

export const EMPTY_REFERRAL_FORM = {
  patientId: '',
  patientName: '',
  toDoctorId: '',
  reason: '',
  urgency: 'Routine',
  preferredDate: '',
  appointmentId: '',
};

const initialState = {
  doctors: [],
  patients: [],
  appointments: [],
  referrals: [],
  status: 'idle',
  submitStatus: 'idle',
  alert: null,
  activeTab: 'new',
  form: EMPTY_REFERRAL_FORM,
  doctorSearch: '',
};

/**
 * The Front Desk follow-up page reads referrals from this localStorage cache,
 * so every new referral is mirrored there.
 */
function cacheReferral(referral) {
  try {
    const cached = JSON.parse(localStorage.getItem(REFERRAL_HISTORY_KEY) || '[]');
    localStorage.setItem(
      REFERRAL_HISTORY_KEY,
      JSON.stringify([referral, ...cached.filter((c) => c.id !== referral.id)])
    );
  } catch {
    // Ignore storage errors
  }
}

export const fetchReferralData = createAsyncThunk(
  'internalReferral/fetchData',
  async (_, { getState }) => {
    const user = getDoctorRequestUser(getState());
    const myId = user.id;
    const id = encodeURIComponent(myId);

    const [doctors, referrals, patients, appointments] = await Promise.all([
      fetchListOrNull('/doctors', user),
      fetchListOrNull(`/doctors/${id}/referrals`, user),
      fetchListOrNull('/patients', user),
      fetchListOrNull(`/appointments/doctor/${id}`, user),
    ]);

    return {
      doctors:
        doctors && doctors.length > 0
          ? doctors.filter((d) => d.id !== myId && d.userId !== myId)
          : null,
      referrals,
      appointments: appointments ?? [],
      patients: buildPatientList(appointments ?? [], patients ?? []),
    };
  }
);

/**
 * Sends the referral in the form. If the backend is unreachable the referral
 * is still recorded locally (offline/demo mode), as before.
 */
export const submitReferral = createAsyncThunk(
  'internalReferral/submit',
  async (_, { getState }) => {
    const state = getState();
    const authUser = state.auth.user;
    const user = getDoctorRequestUser(state);
    const { form, doctors } = state.internalReferral;

    const payload = {
      patientId: form.patientId.trim(),
      patientName: form.patientName.trim() || form.patientId.trim(),
      toDoctorId: form.toDoctorId,
      reason: form.reason.trim(),
      urgency: form.urgency || 'Routine',
      preferredDate: form.preferredDate || undefined,
      appointmentId: form.appointmentId.trim() || undefined,
    };

    let referral;
    let offline = false;
    try {
      referral = await apiFetch(`/doctors/${encodeURIComponent(user.id)}/referrals`, {
        user,
        method: 'POST',
        body: payload,
      });
    } catch {
      offline = true;
      const targetDoctor = doctors.find((d) => (d.id || d.userId) === form.toDoctorId);
      referral = {
        id: `REF${Date.now()}`,
        fromDoctorId: user.id,
        fromDoctorName: authUser?.name || 'Doctor',
        fromSpecialization: authUser?.specialization || 'General',
        toDoctorId: form.toDoctorId,
        toDoctorName: targetDoctor?.name || form.toDoctorId,
        toSpecialization: targetDoctor?.specialization || 'Specialist',
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...payload,
      };
    }

    cacheReferral(referral);
    return { referral, offline };
  }
);

/** Updates a received referral's status, falling back to a local update offline. */
export const updateReferralStatus = createAsyncThunk(
  'internalReferral/updateStatus',
  async ({ referralId, status }, { getState }) => {
    const user = getDoctorRequestUser(getState());
    try {
      const updated = await apiFetch(
        `/doctors/${encodeURIComponent(user.id)}/referrals/${encodeURIComponent(referralId)}/status`,
        { user, method: 'PUT', body: { status } }
      );
      return { referralId, status, updated };
    } catch {
      return { referralId, status, updated: null };
    }
  }
);

const internalReferralSlice = createSlice({
  name: 'internalReferral',
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    setDoctorSearch(state, action) {
      state.doctorSearch = action.payload;
    },
    updateReferralField(state, action) {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    /** Picks a patient and fills in their display name. */
    selectReferralPatient(state, action) {
      const patientId = action.payload;
      const patient = state.patients.find((p) => (p.userId || p.id) === patientId);
      state.form.patientId = patientId;
      state.form.patientName = patient
        ? patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || patientId
        : '';
    },
    /** Links an appointment and auto-fills its patient. */
    selectReferralAppointment(state, action) {
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
    resetReferralForm(state) {
      state.form = EMPTY_REFERRAL_FORM;
    },
    setReferralAlert(state, action) {
      state.alert = action.payload;
    },
    clearReferralAlert(state) {
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferralData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReferralData.fulfilled, (state, action) => {
        const { doctors, referrals, appointments, patients } = action.payload;
        state.status = 'succeeded';
        if (doctors) state.doctors = doctors;
        if (referrals) state.referrals = referrals;
        state.appointments = appointments;
        state.patients = patients;
      })
      .addCase(fetchReferralData.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(submitReferral.pending, (state) => {
        state.submitStatus = 'loading';
        state.alert = null;
      })
      .addCase(submitReferral.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        const { referral, offline } = action.payload;
        state.referrals.unshift(referral);
        state.alert = {
          type: 'success',
          text: offline ? 'Referral created and saved successfully!' : 'Referral sent successfully!',
        };
        state.form = EMPTY_REFERRAL_FORM;
        state.activeTab = 'sent';
      })
      .addCase(submitReferral.rejected, (state) => {
        state.submitStatus = 'failed';
        state.alert = { type: 'error', text: 'Failed to send referral.' };
      })
      .addCase(updateReferralStatus.fulfilled, (state, action) => {
        const { referralId, status, updated } = action.payload;
        state.referrals = state.referrals.map((r) =>
          r.id === referralId ? updated || { ...r, status } : r
        );
        state.alert = { type: 'success', text: `Referral marked as ${status}.` };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setActiveTab,
  setDoctorSearch,
  updateReferralField,
  selectReferralPatient,
  selectReferralAppointment,
  resetReferralForm,
  setReferralAlert,
  clearReferralAlert,
} = internalReferralSlice.actions;

export const selectInternalReferral = (state) => state.internalReferral;

export default internalReferralSlice.reducer;
