/**
 * branchDoctorsSlice.js — Branch Admin Manage Doctors State (Redux Toolkit)
 * ==========================================================================
 * Location: src/store/slices/branchAdmin/branchDoctorsSlice.js
 *
 * Manages state for the Branch Admin Manage Doctors page:
 *   - Data: `doctors`, `doctorAppointments` (for the view modal)
 *   - Filters: `searchQuery`, `selectedDept`
 *   - Modals: `formModal` (create/edit), `viewDoctor`, `doctorToDelete`
 *   - Async/UI state: `status`, `appointmentsStatus`, `isDeleting`, `alert`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

const initialState = {
  doctors: [],
  status: 'idle',
  alert: null,
  searchQuery: '',
  selectedDept: '',
  formModal: {
    isOpen: false,
    doctor: null, // null = create mode, object = edit mode
  },
  viewDoctor: null,
  doctorAppointments: [],
  appointmentsStatus: 'idle',
  appointmentsRequestId: null,
  doctorToDelete: null,
  isDeleting: false,
};

const getRequestUser = (getState) => {
  const user = getState().auth.user;
  return { ...user, role: user?.role || 'branch_admin' };
};

const extractErrorDetail = (err, fallback) => {
  const raw = err?.message || '';
  const detail = raw.includes(': ') ? raw.split(': ').slice(1).join(': ') : raw;
  return detail || fallback;
};

const getDoctorId = (doc) => doc?.userId || doc?.id;

export const fetchBranchDoctors = createAsyncThunk(
  'branchDoctors/fetchBranchDoctors',
  async (_, { getState, rejectWithValue }) => {
    const user = getRequestUser(getState);
    const branchParam = user?.branchId ? `?branchId=${encodeURIComponent(user.branchId)}` : '';

    try {
      const data = await apiFetch(`/doctors${branchParam}`, { user });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to load doctors.');
    }
  }
);

export const fetchDoctorAppointments = createAsyncThunk(
  'branchDoctors/fetchDoctorAppointments',
  async (doctor, { getState, rejectWithValue }) => {
    const user = getRequestUser(getState);

    try {
      const data = await apiFetch(
        `/appointments/doctor/${encodeURIComponent(getDoctorId(doctor))}`,
        { user }
      );
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to load appointments.');
    }
  }
);

export const deleteBranchDoctor = createAsyncThunk(
  'branchDoctors/deleteBranchDoctor',
  async (doctor, { getState, dispatch, rejectWithValue }) => {
    const user = getRequestUser(getState);

    try {
      await apiFetch(`/doctors/${encodeURIComponent(getDoctorId(doctor))}`, {
        user,
        method: 'DELETE',
      });
      await dispatch(fetchBranchDoctors());
      return doctor;
    } catch (err) {
      return rejectWithValue(extractErrorDetail(err, 'Failed to delete doctor.'));
    }
  }
);

const branchDoctorsSlice = createSlice({
  name: 'branchDoctors',
  initialState,
  reducers: {
    setDoctorSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setDoctorDeptFilter(state, action) {
      state.selectedDept = action.payload;
    },
    openDoctorForm(state, action) {
      state.formModal = { isOpen: true, doctor: action.payload || null };
      state.viewDoctor = null;
    },
    closeDoctorForm(state) {
      state.formModal = { isOpen: false, doctor: null };
    },
    openDoctorView(state, action) {
      state.viewDoctor = action.payload;
      state.doctorAppointments = [];
    },
    closeDoctorView(state) {
      state.viewDoctor = null;
      state.doctorAppointments = [];
      state.appointmentsStatus = 'idle';
      state.appointmentsRequestId = null;
    },
    openDoctorDelete(state, action) {
      state.doctorToDelete = action.payload;
    },
    closeDoctorDelete(state) {
      state.doctorToDelete = null;
    },
    setDoctorAlert(state, action) {
      state.alert = action.payload;
    },
    clearDoctorAlert(state) {
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchDoctors.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBranchDoctors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.doctors = action.payload;
      })
      .addCase(fetchBranchDoctors.rejected, (state, action) => {
        state.status = 'failed';
        state.alert = {
          type: 'error',
          message: action.payload || 'Failed to load doctors.',
        };
      })
      // Track the latest request so a slow response for a previously opened
      // doctor cannot overwrite the appointments of the one now on screen.
      .addCase(fetchDoctorAppointments.pending, (state, action) => {
        state.appointmentsStatus = 'loading';
        state.appointmentsRequestId = action.meta.requestId;
        state.doctorAppointments = [];
      })
      .addCase(fetchDoctorAppointments.fulfilled, (state, action) => {
        if (state.appointmentsRequestId !== action.meta.requestId) return;
        state.appointmentsStatus = 'succeeded';
        state.doctorAppointments = action.payload;
      })
      .addCase(fetchDoctorAppointments.rejected, (state, action) => {
        if (state.appointmentsRequestId !== action.meta.requestId) return;
        state.appointmentsStatus = 'failed';
        state.doctorAppointments = [];
      })
      .addCase(deleteBranchDoctor.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteBranchDoctor.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.doctorToDelete = null;
        state.alert = {
          type: 'success',
          message: `${action.payload?.name || 'Doctor'} removed successfully.`,
        };
      })
      .addCase(deleteBranchDoctor.rejected, (state, action) => {
        state.isDeleting = false;
        state.alert = {
          type: 'error',
          message: action.payload || 'Failed to delete doctor.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setDoctorSearchQuery,
  setDoctorDeptFilter,
  openDoctorForm,
  closeDoctorForm,
  openDoctorView,
  closeDoctorView,
  openDoctorDelete,
  closeDoctorDelete,
  setDoctorAlert,
  clearDoctorAlert,
} = branchDoctorsSlice.actions;

export const selectBranchDoctors = (state) => state.branchDoctors.doctors;
export const selectBranchDoctorsStatus = (state) => state.branchDoctors.status;
export const selectDoctorAlert = (state) => state.branchDoctors.alert;
export const selectDoctorSearchQuery = (state) => state.branchDoctors.searchQuery;
export const selectDoctorDeptFilter = (state) => state.branchDoctors.selectedDept;
export const selectDoctorFormModal = (state) => state.branchDoctors.formModal;
export const selectViewDoctor = (state) => state.branchDoctors.viewDoctor;
export const selectDoctorAppointments = (state) => state.branchDoctors.doctorAppointments;
export const selectDoctorAppointmentsStatus = (state) => state.branchDoctors.appointmentsStatus;
export const selectDoctorToDelete = (state) => state.branchDoctors.doctorToDelete;
export const selectIsDeletingDoctor = (state) => state.branchDoctors.isDeleting;

export default branchDoctorsSlice.reducer;
