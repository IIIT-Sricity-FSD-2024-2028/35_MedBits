/**
 * frontdeskAppointmentsSlice.js — Frontdesk Appointment Management State (Redux Toolkit)
 * ======================================================================================
 * Location: src/store/slices/frontdesk/frontdeskAppointmentsSlice.js
 *
 * Manages state for Frontdesk Appointment Management and its booking/reschedule/cancel modals:
 *   - Appointments list, status filter, loading/error/success feedback
 *   - Modal targets & open state (`isBookModalOpen`, `rescheduleTarget`, `cancelTarget`)
 *   - Lookup lists (`patients`, `branches`, `doctors`, `availableSlots`)
 *   - Mutations: book, reschedule, cancel, and complete appointments
 *
 * APIs:
 *   - GET    /appointments
 *   - POST   /appointments
 *   - PUT    /appointments/:id
 *   - DELETE /appointments/:id
 *   - POST   /appointments/:id/complete
 *   - GET    /patients
 *   - GET    /hospital-branches
 *   - GET    /doctors
 *   - GET    /doctors/:doctorId/slots?date=
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { extractErrorMessage, getFrontdeskRequestUser } from './frontdeskHelpers';

const DEFAULT_BRANCH_ID = '00000000-0000-4000-8000-000000000001';

const initialState = {
  appointments: [],
  statusFilter: 'all',
  status: 'idle',
  errorMessage: null,
  successMessage: null,

  isBookModalOpen: false,
  rescheduleTarget: null,
  cancelTarget: null,

  patients: [],
  branches: [],
  doctors: [],
  availableSlots: [],
  lookupsStatus: 'idle',
  doctorsStatus: 'idle',
  slotsStatus: 'idle',
  slotsError: null,

  isBooking: false,
  bookingError: null,
  isRescheduling: false,
  rescheduleError: null,
  isCancelling: false,
  cancelError: null,
  actionInProgressId: null,
};

export const fetchFrontdeskAppointments = createAsyncThunk(
  'frontdeskAppointments/fetchAll',
  async (_, { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    try {
      const data = await apiFetch('/appointments', { user: requestUser });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load appointments from the server.')
      );
    }
  }
);

export const fetchBookingLookups = createAsyncThunk(
  'frontdeskAppointments/fetchBookingLookups',
  async (_, { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    const [patientsRes, branchesRes] = await Promise.allSettled([
      apiFetch('/patients', { user: requestUser }),
      apiFetch('/hospital-branches', { user: requestUser }),
    ]);

    if (patientsRes.status === 'rejected' && branchesRes.status === 'rejected') {
      return rejectWithValue(
        extractErrorMessage(patientsRes.reason, 'Failed to load patient and branch lists.')
      );
    }

    const patients =
      patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value)
        ? patientsRes.value
        : [];
    const branches =
      branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value)
        ? branchesRes.value
        : [];

    return {
      patients,
      branches,
      patientWarning:
        patientsRes.status === 'rejected'
          ? extractErrorMessage(patientsRes.reason, 'Failed to load patients list.')
          : null,
    };
  }
);

export const fetchDoctorsByBranch = createAsyncThunk(
  'frontdeskAppointments/fetchDoctorsByBranch',
  async (branchId = '', { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    const path = branchId
      ? `/doctors?branchId=${encodeURIComponent(branchId)}`
      : '/doctors';

    try {
      const data = await apiFetch(path, { user: requestUser });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to load doctors list.')
      );
    }
  }
);

export const fetchDoctorAvailableSlots = createAsyncThunk(
  'frontdeskAppointments/fetchDoctorAvailableSlots',
  async ({ doctorId, date, currentAppointment = null }, { getState, rejectWithValue }) => {
    if (!doctorId || !date) {
      return [];
    }

    const requestUser = getFrontdeskRequestUser(getState());
    try {
      const data = await apiFetch(
        `/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`,
        { user: requestUser }
      );
      const slotsList = Array.isArray(data) ? [...data] : [];

      if (
        currentAppointment &&
        date === currentAppointment.date &&
        currentAppointment.slot &&
        !slotsList.includes(currentAppointment.slot)
      ) {
        slotsList.unshift(currentAppointment.slot);
      }

      return slotsList;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Unable to retrieve available doctor slots for this date.')
      );
    }
  }
);

export const bookFrontdeskAppointment = createAsyncThunk(
  'frontdeskAppointments/book',
  async ({ patientId, doctorId, branchId, date, slot }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const requestUser = getFrontdeskRequestUser(state);
    const { doctors, branches } = state.frontdeskAppointments;
    const selectedDoctor = doctors.find((doc) => (doc.userId || doc.id) === doctorId);

    const effectiveBranchId =
      selectedDoctor?.branchId ||
      branchId ||
      branches[0]?.id ||
      DEFAULT_BRANCH_ID;

    try {
      const created = await apiFetch('/appointments', {
        user: requestUser,
        method: 'POST',
        body: {
          userId: patientId,
          doctorId,
          branchId: effectiveBranchId,
          date,
          slot,
          source: 'frontdesk',
          bookedBy: requestUser.id,
          frontdeskId: requestUser.id,
        },
      });

      await dispatch(fetchFrontdeskAppointments());
      return created;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to book appointment. Please verify details.')
      );
    }
  }
);

export const rescheduleFrontdeskAppointment = createAsyncThunk(
  'frontdeskAppointments/reschedule',
  async ({ appointmentId, date, slot }, { getState, dispatch, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    try {
      const updated = await apiFetch(`/appointments/${encodeURIComponent(appointmentId)}`, {
        user: requestUser,
        method: 'PUT',
        body: { date, slot },
      });

      await dispatch(fetchFrontdeskAppointments());
      return updated;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to reschedule appointment.')
      );
    }
  }
);

export const cancelFrontdeskAppointment = createAsyncThunk(
  'frontdeskAppointments/cancel',
  async (appointmentId, { getState, dispatch, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    try {
      await apiFetch(`/appointments/${encodeURIComponent(appointmentId)}`, {
        user: requestUser,
        method: 'DELETE',
      });

      await dispatch(fetchFrontdeskAppointments());
      return appointmentId;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to cancel appointment.')
      );
    }
  }
);

export const completeFrontdeskAppointment = createAsyncThunk(
  'frontdeskAppointments/complete',
  async (appointmentId, { getState, dispatch, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    try {
      const updated = await apiFetch(
        `/appointments/${encodeURIComponent(appointmentId)}/complete`,
        {
          user: requestUser,
          method: 'POST',
        }
      );

      await dispatch(fetchFrontdeskAppointments());
      return updated;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to mark appointment as completed.')
      );
    }
  }
);

const frontdeskAppointmentsSlice = createSlice({
  name: 'frontdeskAppointments',
  initialState,
  reducers: {
    setAppointmentStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    openBookAppointmentModal(state) {
      state.isBookModalOpen = true;
      state.bookingError = null;
      state.availableSlots = [];
      state.slotsError = null;
    },
    closeBookAppointmentModal(state) {
      state.isBookModalOpen = false;
      state.bookingError = null;
      state.availableSlots = [];
      state.slotsError = null;
    },
    openRescheduleModal(state, action) {
      state.rescheduleTarget = action.payload;
      state.rescheduleError = null;
      state.availableSlots = [];
      state.slotsError = null;
    },
    closeRescheduleModal(state) {
      state.rescheduleTarget = null;
      state.rescheduleError = null;
      state.availableSlots = [];
      state.slotsError = null;
    },
    openCancelModal(state, action) {
      state.cancelTarget = action.payload;
      state.cancelError = null;
    },
    closeCancelModal(state) {
      state.cancelTarget = null;
      state.cancelError = null;
    },
    clearAvailableSlots(state) {
      state.availableSlots = [];
      state.slotsError = null;
    },
    setBookingError(state, action) {
      state.bookingError = action.payload;
    },
    clearAppointmentMessages(state) {
      state.errorMessage = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFrontdeskAppointments.pending, (state) => {
        state.status = 'loading';
        state.errorMessage = null;
      })
      .addCase(fetchFrontdeskAppointments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appointments = action.payload;
        state.errorMessage = null;
      })
      .addCase(fetchFrontdeskAppointments.rejected, (state, action) => {
        state.status = 'failed';
        state.errorMessage = action.payload || 'Unable to load appointments.';
      })
      .addCase(fetchBookingLookups.pending, (state) => {
        state.lookupsStatus = 'loading';
      })
      .addCase(fetchBookingLookups.fulfilled, (state, action) => {
        state.lookupsStatus = 'succeeded';
        state.patients = action.payload.patients;
        state.branches = action.payload.branches;
        if (action.payload.patientWarning) {
          state.bookingError = action.payload.patientWarning;
        }
      })
      .addCase(fetchBookingLookups.rejected, (state, action) => {
        state.lookupsStatus = 'failed';
        state.bookingError = action.payload || 'Failed to load booking data.';
      })
      .addCase(fetchDoctorsByBranch.pending, (state) => {
        state.doctorsStatus = 'loading';
      })
      .addCase(fetchDoctorsByBranch.fulfilled, (state, action) => {
        state.doctorsStatus = 'succeeded';
        state.doctors = action.payload;
      })
      .addCase(fetchDoctorsByBranch.rejected, (state, action) => {
        state.doctorsStatus = 'failed';
        state.doctors = [];
        state.bookingError = action.payload || 'Failed to load doctors.';
      })
      .addCase(fetchDoctorAvailableSlots.pending, (state) => {
        state.slotsStatus = 'loading';
        state.slotsError = null;
      })
      .addCase(fetchDoctorAvailableSlots.fulfilled, (state, action) => {
        state.slotsStatus = 'succeeded';
        state.availableSlots = action.payload;
        state.slotsError = null;
      })
      .addCase(fetchDoctorAvailableSlots.rejected, (state, action) => {
        state.slotsStatus = 'failed';
        state.availableSlots = [];
        state.slotsError = action.payload || 'Failed to load time slots.';
      })
      .addCase(bookFrontdeskAppointment.pending, (state) => {
        state.isBooking = true;
        state.bookingError = null;
      })
      .addCase(bookFrontdeskAppointment.fulfilled, (state) => {
        state.isBooking = false;
        state.isBookModalOpen = false;
        state.bookingError = null;
        state.availableSlots = [];
        state.successMessage = 'New appointment successfully booked!';
      })
      .addCase(bookFrontdeskAppointment.rejected, (state, action) => {
        state.isBooking = false;
        state.bookingError =
          action.payload || 'An error occurred while booking the appointment.';
      })
      .addCase(rescheduleFrontdeskAppointment.pending, (state) => {
        state.isRescheduling = true;
        state.rescheduleError = null;
      })
      .addCase(rescheduleFrontdeskAppointment.fulfilled, (state) => {
        state.isRescheduling = false;
        state.rescheduleTarget = null;
        state.rescheduleError = null;
        state.availableSlots = [];
        state.successMessage = 'Appointment rescheduled successfully.';
      })
      .addCase(rescheduleFrontdeskAppointment.rejected, (state, action) => {
        state.isRescheduling = false;
        state.rescheduleError = action.payload || 'Error rescheduling appointment.';
      })
      .addCase(cancelFrontdeskAppointment.pending, (state) => {
        state.isCancelling = true;
        state.cancelError = null;
      })
      .addCase(cancelFrontdeskAppointment.fulfilled, (state) => {
        state.isCancelling = false;
        state.cancelTarget = null;
        state.cancelError = null;
        state.successMessage = 'Appointment cancelled successfully.';
      })
      .addCase(cancelFrontdeskAppointment.rejected, (state, action) => {
        state.isCancelling = false;
        state.cancelError = action.payload || 'Error cancelling appointment.';
      })
      .addCase(completeFrontdeskAppointment.pending, (state, action) => {
        state.actionInProgressId = action.meta.arg;
        state.errorMessage = null;
      })
      .addCase(completeFrontdeskAppointment.fulfilled, (state) => {
        state.actionInProgressId = null;
        state.successMessage = 'Appointment marked as completed.';
      })
      .addCase(completeFrontdeskAppointment.rejected, (state, action) => {
        state.actionInProgressId = null;
        state.errorMessage = action.payload || 'Error updating appointment status.';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setAppointmentStatusFilter,
  openBookAppointmentModal,
  closeBookAppointmentModal,
  openRescheduleModal,
  closeRescheduleModal,
  openCancelModal,
  closeCancelModal,
  clearAvailableSlots,
  setBookingError,
  clearAppointmentMessages,
} = frontdeskAppointmentsSlice.actions;

export const selectFrontdeskAppointmentsState = (state) => state.frontdeskAppointments;

export default frontdeskAppointmentsSlice.reducer;
