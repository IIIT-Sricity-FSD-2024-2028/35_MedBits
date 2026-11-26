/**
 * followUpReferralSlice.js — Frontdesk Follow-Up & Referral Coordination State (Redux Toolkit)
 * ============================================================================================
 * Location: src/store/slices/frontdesk/followUpReferralSlice.js
 *
 * Manages state for Frontdesk Follow-Up & Referral Coordination:
 *   - `followUps`, `referrals`
 *   - Search & tab filters: `searchQuery`, `activeTab`
 *   - Booking modal state: `isModalOpen`, `selectedItemForBooking`,
 *     `availableSlots`, `slotsStatus`, `slotsError`, `isSubmitting`, `modalError`
 *   - Page alerts: `status`, `alertMessage`
 *
 * APIs:
 *   - GET  /followups
 *   - GET  /doctors/referrals/all
 *   - GET  /doctors/:doctorId/slots?date=
 *   - POST /appointments
 *   - PUT  /doctors/:doctorId/referrals/:referralId/status
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import {
  extractErrorMessage,
  fetchFrontdeskResource,
  getFrontdeskRequestUser,
} from './frontdeskHelpers';

const REFERRAL_HISTORY_KEY = 'referralHistory';
const DEFAULT_BRANCH_ID = '00000000-0000-4000-8000-000000000001';

const initialState = {
  followUps: [],
  referrals: [],
  searchQuery: '',
  activeTab: 'all',
  status: 'idle',
  alertMessage: null,

  isModalOpen: false,
  selectedItemForBooking: null,
  availableSlots: [],
  slotsStatus: 'idle',
  slotsError: null,
  isSubmitting: false,
  modalError: null,
};

function normalizeFollowUp(r) {
  return {
    id: r.id,
    appointmentId: r.appointmentId || '',
    patientId: r.patientId,
    patientName: r.patientName || r.patientId,
    patientPhone: r.patientPhone || '',
    doctorId: r.doctorId,
    doctorName: r.doctorName || 'Doctor',
    specialization: r.specialization || '',
    consultationNote: r.consultationNote || 'Routine consultation follow-up.',
    followUpDate: r.followUpDate || r.followUp || r.date,
    date: r.date,
    tests: r.tests || '',
    isReferral: false,
  };
}

function normalizeReferral(r) {
  return {
    id: r.id,
    patientId: r.patientId,
    patientName: r.patientName || r.patientId,
    patientPhone: r.patientPhone || '',
    fromDoctorId: r.fromDoctorId,
    fromDoctorName: r.fromDoctorName || r.fromDoctorId || 'Doctor',
    fromSpecialization: r.fromSpecialization || '',
    toDoctorId: r.toDoctorId,
    toDoctorName: r.toDoctorName || r.toDoctorId,
    toSpecialization: r.toSpecialization || '',
    reason: r.reason || 'Referral appointment',
    urgency: r.urgency || 'Routine',
    preferredDate: r.preferredDate || '',
    status: r.status || 'pending',
    isReferral: true,
  };
}

function readLocalReferralHistory() {
  try {
    const cached = JSON.parse(localStorage.getItem(REFERRAL_HISTORY_KEY) || '[]');
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

function markLocalReferralAccepted(referralId) {
  try {
    const cached = readLocalReferralHistory();
    if (cached.length === 0) return;
    const updated = cached.map((r) =>
      r.id === referralId
        ? { ...r, status: 'Accepted', statusClass: 'badge-confirmed' }
        : r
    );
    localStorage.setItem(REFERRAL_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export const fetchFollowUpsAndReferrals = createAsyncThunk(
  'followUpReferral/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());

    const [fuRes, refRes] = await Promise.allSettled([
      fetchFrontdeskResource('/followups', requestUser, 'Follow-ups'),
      fetchFrontdeskResource('/doctors/referrals/all', requestUser, 'Referrals'),
    ]);

    const failures = [fuRes, refRes]
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Request failed');

    if (fuRes.status === 'rejected' && refRes.status === 'rejected') {
      return rejectWithValue(
        `Unable to load coordination records: ${failures.join(', ')}`
      );
    }

    const followUps =
      fuRes.status === 'fulfilled' && Array.isArray(fuRes.value)
        ? fuRes.value.map(normalizeFollowUp)
        : [];

    const apiAllReferrals =
      refRes.status === 'fulfilled' && Array.isArray(refRes.value) ? refRes.value : [];
    const apiAllIds = new Set(apiAllReferrals.map((r) => r.id));

    const pendingApiReferrals = apiAllReferrals
      .filter((r) => (r.status || '').toLowerCase() === 'pending')
      .map(normalizeReferral);

    // Merge pending referrals created locally by doctors (e.g. offline mode) that are not in backend
    const localPendingReferrals = readLocalReferralHistory()
      .filter(
        (r) =>
          (r.status || '').toLowerCase() === 'pending' &&
          r.id &&
          !apiAllIds.has(r.id)
      )
      .map(normalizeReferral);

    const referrals = [...pendingApiReferrals, ...localPendingReferrals];

    return {
      followUps,
      referrals,
      warning:
        failures.length > 0 ? `Partial load issue: ${failures.join(', ')}` : null,
    };
  }
);

export const fetchFollowUpSlots = createAsyncThunk(
  'followUpReferral/fetchSlots',
  async ({ doctorId, date }, { getState, rejectWithValue }) => {
    if (!doctorId || !date) {
      return [];
    }

    const requestUser = getFrontdeskRequestUser(getState());
    try {
      const slotsData = await apiFetch(
        `/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`,
        { user: requestUser }
      );
      return Array.isArray(slotsData) ? slotsData : [];
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Unable to fetch available doctor slots.')
      );
    }
  }
);

export const bookFollowUpOrReferral = createAsyncThunk(
  'followUpReferral/book',
  async ({ item, date, slot }, { getState, rejectWithValue }) => {
    const state = getState();
    const requestUser = getFrontdeskRequestUser(state);
    const authUser = state.auth.user;

    const targetDoctorId = item?.toDoctorId || item?.doctorId;
    const patientId = item?.patientId || item?.userId;

    if (!targetDoctorId || !patientId) {
      return rejectWithValue('Missing patient or doctor information for booking.');
    }

    const effectiveBranchId =
      item?.branchId || authUser?.branchId || DEFAULT_BRANCH_ID;

    const bookingPayload = {
      userId: patientId,
      doctorId: targetDoctorId,
      branchId: effectiveBranchId,
      date,
      slot,
      source: 'frontdesk',
      bookedBy: requestUser.id,
      frontdeskId: requestUser.id,
    };

    try {
      const createdAppointment = await apiFetch('/appointments', {
        user: requestUser,
        method: 'POST',
        body: bookingPayload,
      });

      let referralStatusWarning = null;
      if (item.isReferral && item.id) {
        const statusDoctorId = item.fromDoctorId || targetDoctorId;
        try {
          await apiFetch(
            `/doctors/${encodeURIComponent(statusDoctorId)}/referrals/${encodeURIComponent(
              item.id
            )}/status`,
            {
              user: requestUser,
              method: 'PUT',
              body: { status: 'accepted' },
            }
          );
          markLocalReferralAccepted(item.id);
        } catch (statusErr) {
          markLocalReferralAccepted(item.id);
          referralStatusWarning = extractErrorMessage(
            statusErr,
            'Referral status update failed.'
          );
        }
      }

      return { createdAppointment, bookedItem: item, referralStatusWarning };
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Server error while booking appointment.')
      );
    }
  }
);

const followUpReferralSlice = createSlice({
  name: 'followUpReferral',
  initialState,
  reducers: {
    setFollowUpSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setFollowUpActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    openFollowUpBookingModal(state, action) {
      state.selectedItemForBooking = action.payload;
      state.isModalOpen = true;
      state.modalError = null;
      state.slotsError = null;
      state.availableSlots = [];
    },
    closeFollowUpBookingModal(state) {
      state.isModalOpen = false;
      state.selectedItemForBooking = null;
      state.modalError = null;
      state.slotsError = null;
      state.availableSlots = [];
    },
    setFollowUpModalError(state, action) {
      state.modalError = action.payload;
    },
    clearFollowUpAlert(state) {
      state.alertMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFollowUpsAndReferrals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFollowUpsAndReferrals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.followUps = action.payload.followUps;
        state.referrals = action.payload.referrals;
        if (action.payload.warning) {
          state.alertMessage = { type: 'error', text: action.payload.warning };
        }
      })
      .addCase(fetchFollowUpsAndReferrals.rejected, (state, action) => {
        state.status = 'failed';
        state.alertMessage = {
          type: 'error',
          text: action.payload || 'Unable to load follow-up and referral records.',
        };
      })
      .addCase(fetchFollowUpSlots.pending, (state) => {
        state.slotsStatus = 'loading';
        state.slotsError = null;
      })
      .addCase(fetchFollowUpSlots.fulfilled, (state, action) => {
        state.slotsStatus = 'succeeded';
        state.availableSlots = action.payload;
        state.slotsError = null;
      })
      .addCase(fetchFollowUpSlots.rejected, (state, action) => {
        state.slotsStatus = 'failed';
        state.availableSlots = [];
        state.slotsError = action.payload || 'Unable to load available time slots.';
      })
      .addCase(bookFollowUpOrReferral.pending, (state) => {
        state.isSubmitting = true;
        state.modalError = null;
      })
      .addCase(bookFollowUpOrReferral.fulfilled, (state, action) => {
        const { createdAppointment, bookedItem, referralStatusWarning } = action.payload;
        state.isSubmitting = false;
        state.isModalOpen = false;
        state.selectedItemForBooking = null;
        state.modalError = null;
        state.availableSlots = [];

        if (bookedItem.isReferral) {
          state.referrals = state.referrals.filter((r) => r.id !== bookedItem.id);
        } else {
          state.followUps = state.followUps.filter((fu) => fu.id !== bookedItem.id);
        }

        const pName = bookedItem.patientName || bookedItem.patientId || 'Patient';
        const docName = bookedItem.toDoctorName || bookedItem.doctorName || 'Doctor';
        const baseText = `Appointment successfully booked for ${pName} with ${docName} on ${createdAppointment.date} at ${createdAppointment.slot}!`;

        state.alertMessage = {
          type: 'success',
          text: referralStatusWarning
            ? `${baseText} (Note: ${referralStatusWarning})`
            : baseText,
        };
      })
      .addCase(bookFollowUpOrReferral.rejected, (state, action) => {
        state.isSubmitting = false;
        state.modalError =
          action.payload || 'Unable to confirm appointment booking. Please try again.';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setFollowUpSearchQuery,
  setFollowUpActiveTab,
  openFollowUpBookingModal,
  closeFollowUpBookingModal,
  setFollowUpModalError,
  clearFollowUpAlert,
} = followUpReferralSlice.actions;

export const selectFollowUpReferralState = (state) => state.followUpReferral;

export default followUpReferralSlice.reducer;
