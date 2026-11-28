/**
 * patientAppointmentsSlice.js — Patient Appointments & Booking State (Redux Toolkit)
 * ====================================================================================
 * Location: src/store/slices/patient/patientAppointmentsSlice.js
 *
 * Manages state for the Patient Appointments page:
 *   - Filters: `selectedBranch`, `selectedSpeciality`, `selectedDate`, `doctorName`
 *   - Data: `branches`, `doctors`, `userAppointments`
 *   - UI/Async state: `doctorsStatus`, `appointmentsStatus`, `branchesStatus`,
 *     `isSubmitting`, `bookingDoctor`, `statusMessage`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getTodayLocalIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

function extractPatientErrorDetail(err, fallback) {
  const raw = err?.message || '';
  const detail = raw.includes(': ') ? raw.split(': ').slice(1).join(': ') : raw;
  return detail || fallback;
}

const initialState = {
  selectedBranch: '',
  selectedSpeciality: '',
  selectedDate: '',
  doctorName: '',
  branches: [],
  doctors: [],
  userAppointments: [],
  availableSlots: [],
  branchesStatus: 'idle',
  doctorsStatus: 'idle',
  appointmentsStatus: 'idle',
  slotsStatus: 'idle',
  slotsError: null,
  slotsRequestId: null,
  isSubmitting: false,
  bookingDoctor: null,
  bookingDate: '',
  bookingSlot: '',
  statusMessage: null,
};

export const fetchBranches = createAsyncThunk(
  'patientAppointments/fetchBranches',
  async (_, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    try {
      const data = await apiFetch('/hospital-branches', {
        user: { ...user, role: user?.role || 'patient' },
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load hospital branches.');
    }
  }
);

export const fetchDoctors = createAsyncThunk(
  'patientAppointments/fetchDoctors',
  async (branchId = '', { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const path = branchId
      ? `/doctors?branchId=${encodeURIComponent(branchId)}`
      : '/doctors';

    try {
      const data = await apiFetch(path, {
        user: { ...user, role: user?.role || 'patient' },
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load doctors list.');
    }
  }
);

export const fetchUserAppointments = createAsyncThunk(
  'patientAppointments/fetchUserAppointments',
  async (patientId, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const targetId = patientId || user?.id;

    if (!targetId) {
      return [];
    }

    try {
      const data = await apiFetch(`/appointments/user/${encodeURIComponent(targetId)}`, {
        user: { ...user, role: user?.role || 'patient' },
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load appointments.');
    }
  }
);

export const fetchDoctorAvailableSlots = createAsyncThunk(
  'patientAppointments/fetchDoctorAvailableSlots',
  async ({ doctorId, date }, { getState, rejectWithValue }) => {
    if (!doctorId || !date) {
      return [];
    }

    const user = getState().auth.user;
    try {
      const data = await apiFetch(
        `/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`,
        { user: { ...user, role: user?.role || 'patient' } }
      );
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(
        extractPatientErrorDetail(err, 'Unable to load available slots for this date.')
      );
    }
  }
);

export const bookPatientAppointment = createAsyncThunk(
  'patientAppointments/bookAppointment',
  async ({ doctor, date, slot }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = state.auth.user;
    const userId = user?.id;

    if (!userId) {
      return rejectWithValue('User session is missing.');
    }

    const payload = {
      userId,
      doctorId: doctor.id || doctor.userId,
      branchId: doctor.branchId || state.patientAppointments.selectedBranch || undefined,
      date,
      slot,
    };

    try {
      await apiFetch('/appointments', {
        user: { ...user, role: user?.role || 'patient' },
        method: 'POST',
        body: payload,
      });

      await dispatch(fetchUserAppointments(userId));

      return {
        message: `Appointment booked with ${doctor.name} on ${formatDateLabel(date)} at ${slot}!`,
      };
    } catch (err) {
      return rejectWithValue(extractPatientErrorDetail(err, 'Unable to book appointment.'));
    }
  }
);

export const cancelPatientAppointment = createAsyncThunk(
  'patientAppointments/cancelAppointment',
  async (appointmentId, { getState, dispatch, rejectWithValue }) => {
    const user = getState().auth.user;
    const userId = user?.id;

    if (!userId) {
      return rejectWithValue('User session is missing.');
    }

    try {
      await apiFetch(`/appointments/${encodeURIComponent(appointmentId)}`, {
        user: { ...user, role: user?.role || 'patient' },
        method: 'DELETE',
      });

      await dispatch(fetchUserAppointments(userId));
      return { appointmentId };
    } catch {
      return rejectWithValue('Unable to cancel appointment.');
    }
  }
);

const patientAppointmentsSlice = createSlice({
  name: 'patientAppointments',
  initialState,
  reducers: {
    setSelectedBranch(state, action) {
      state.selectedBranch = action.payload;
      state.selectedSpeciality = '';
    },
    setSelectedSpeciality(state, action) {
      state.selectedSpeciality = action.payload;
    },
    setSelectedDate(state, action) {
      state.selectedDate = action.payload;
    },
    setDoctorName(state, action) {
      state.doctorName = action.payload;
    },
    resetFilters(state) {
      state.selectedBranch = '';
      state.selectedSpeciality = '';
      state.selectedDate = '';
      state.doctorName = '';
    },
    openBookingModal(state, action) {
      state.bookingDoctor = action.payload;
      state.bookingDate = state.selectedDate || getTodayLocalIso();
      state.bookingSlot = '';
      state.availableSlots = [];
      state.slotsStatus = 'idle';
      state.slotsError = null;
      state.slotsRequestId = null;
    },
    closeBookingModal(state) {
      state.bookingDoctor = null;
      state.bookingDate = '';
      state.bookingSlot = '';
      state.availableSlots = [];
      state.slotsStatus = 'idle';
      state.slotsError = null;
      state.slotsRequestId = null;
    },
    setBookingDate(state, action) {
      state.bookingDate = action.payload;
      state.bookingSlot = '';
      state.slotsError = null;
    },
    setBookingSlot(state, action) {
      state.bookingSlot = action.payload;
    },
    clearAppointmentStatus(state) {
      state.statusMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.branchesStatus = 'loading';
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.branchesStatus = 'succeeded';
        state.branches = action.payload;
      })
      .addCase(fetchBranches.rejected, (state) => {
        state.branchesStatus = 'failed';
      })
      .addCase(fetchDoctors.pending, (state) => {
        state.doctorsStatus = 'loading';
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.doctorsStatus = 'succeeded';
        state.doctors = action.payload;
      })
      .addCase(fetchDoctors.rejected, (state) => {
        state.doctorsStatus = 'failed';
      })
      .addCase(fetchUserAppointments.pending, (state) => {
        state.appointmentsStatus = 'loading';
      })
      .addCase(fetchUserAppointments.fulfilled, (state, action) => {
        state.appointmentsStatus = 'succeeded';
        state.userAppointments = action.payload;
      })
      .addCase(fetchUserAppointments.rejected, (state) => {
        state.appointmentsStatus = 'failed';
      })
      .addCase(fetchDoctorAvailableSlots.pending, (state, action) => {
        state.slotsStatus = 'loading';
        state.slotsRequestId = action.meta.requestId;
        state.slotsError = null;
        state.availableSlots = [];
      })
      .addCase(fetchDoctorAvailableSlots.fulfilled, (state, action) => {
        if (state.slotsRequestId !== action.meta.requestId) return;
        state.slotsStatus = 'succeeded';
        state.availableSlots = action.payload;
        state.slotsError = null;
      })
      .addCase(fetchDoctorAvailableSlots.rejected, (state, action) => {
        if (state.slotsRequestId !== action.meta.requestId) return;
        state.slotsStatus = 'failed';
        state.availableSlots = [];
        state.slotsError = action.payload || 'Unable to load available slots for this date.';
      })
      .addCase(bookPatientAppointment.pending, (state) => {
        state.isSubmitting = true;
        state.statusMessage = null;
      })
      .addCase(bookPatientAppointment.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.bookingDoctor = null;
        state.bookingDate = '';
        state.bookingSlot = '';
        state.availableSlots = [];
        state.slotsStatus = 'idle';
        state.slotsError = null;
        state.slotsRequestId = null;
        state.statusMessage = {
          type: 'success',
          text: action.payload.message,
        };
      })
      .addCase(bookPatientAppointment.rejected, (state, action) => {
        state.isSubmitting = false;
        state.statusMessage = {
          type: 'error',
          text: action.payload || 'Unable to book appointment.',
        };
      })
      .addCase(cancelPatientAppointment.fulfilled, (state) => {
        state.statusMessage = {
          type: 'success',
          text: 'Appointment cancelled successfully.',
        };
      })
      .addCase(cancelPatientAppointment.rejected, (state, action) => {
        state.statusMessage = {
          type: 'error',
          text: action.payload || 'Unable to cancel appointment.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setSelectedBranch,
  setSelectedSpeciality,
  setSelectedDate,
  setDoctorName,
  resetFilters,
  openBookingModal,
  closeBookingModal,
  setBookingDate,
  setBookingSlot,
  clearAppointmentStatus,
} = patientAppointmentsSlice.actions;

export const selectAppointmentBranches = (state) => state.patientAppointments.branches;
export const selectAppointmentDoctors = (state) => state.patientAppointments.doctors;
export const selectUserAppointments = (state) => state.patientAppointments.userAppointments;
export const selectSelectedBranch = (state) => state.patientAppointments.selectedBranch;
export const selectSelectedSpeciality = (state) => state.patientAppointments.selectedSpeciality;
export const selectSelectedDate = (state) => state.patientAppointments.selectedDate;
export const selectDoctorNameFilter = (state) => state.patientAppointments.doctorName;
export const selectBranchesStatus = (state) => state.patientAppointments.branchesStatus;
export const selectDoctorsStatus = (state) => state.patientAppointments.doctorsStatus;
export const selectDoctorAvailableSlots = (state) => state.patientAppointments.availableSlots;
export const selectDoctorSlotsStatus = (state) => state.patientAppointments.slotsStatus;
export const selectDoctorSlotsError = (state) => state.patientAppointments.slotsError;
export const selectIsSubmittingAppointment = (state) => state.patientAppointments.isSubmitting;
export const selectBookingDoctor = (state) => state.patientAppointments.bookingDoctor;
export const selectBookingDate = (state) => state.patientAppointments.bookingDate;
export const selectBookingSlot = (state) => state.patientAppointments.bookingSlot;
export const selectAppointmentStatusMessage = (state) => state.patientAppointments.statusMessage;

export default patientAppointmentsSlice.reducer;
