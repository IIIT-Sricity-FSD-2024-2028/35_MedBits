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
import { formatTime12 } from '../../../pages/BranchAdmin/utils/staffHelpers';
import {
  DOCTOR_TIME_PRESETS,
  buildDoctorFormData,
  applyStaffFormFieldUpdate,
  getBranchAdminRequestUser,
  extractBranchErrorDetail,
  saveBranchStaffMember,
} from './branchStaffHelpers';

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
  formData: buildDoctorFormData(null),
  formErrors: {},
  customSlot: '',
  isSaving: false,
  saveError: null,
  viewDoctor: null,
  doctorAppointments: [],
  appointmentsStatus: 'idle',
  appointmentsRequestId: null,
  doctorToDelete: null,
  isDeleting: false,
};

const getDoctorId = (doc) => doc?.userId || doc?.id;

export const fetchBranchDoctors = createAsyncThunk(
  'branchDoctors/fetchBranchDoctors',
  async (_, { getState, rejectWithValue }) => {
    const user = getBranchAdminRequestUser(getState);
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
    const user = getBranchAdminRequestUser(getState);

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

export const saveBranchDoctor = createAsyncThunk(
  'branchDoctors/saveBranchDoctor',
  async ({ formData: argFormData, initialData: argInitialData, branchId } = {}, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = getBranchAdminRequestUser(getState);
    const initialData = argInitialData !== undefined ? argInitialData : state.branchDoctors.formModal.doctor;
    const formData = argFormData || state.branchDoctors.formData;
    const docId = getDoctorId(initialData);
    const isEdit = Boolean(docId);
    const effectiveBranchId = branchId || formData.branchId || user?.branchId || initialData?.branchId || '';

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      specialization: formData.specialization.trim(),
      branchId: effectiveBranchId,
      slots: formData.slots || [],
      ...(formData.department ? { department: formData.department.trim() } : {}),
      ...(formData.qualification ? { qualification: formData.qualification.trim() } : {}),
      ...(formData.gender ? { gender: formData.gender } : {}),
      ...(formData.phone ? { phone: formData.phone.trim() } : {}),
      ...(formData.licenseNo ? { licenseNo: formData.licenseNo.trim() } : {}),
      ...(formData.bio ? { bio: formData.bio.trim() } : {}),
    };

    if (formData.experience !== '') payload.experience = Number(formData.experience);
    if (formData.age !== '') payload.age = Number(formData.age);
    if (formData.consultationFee !== '') payload.consultationFee = Number(formData.consultationFee);
    if (formData.percentageCut !== '') payload.percentageCut = Number(formData.percentageCut);
    if (!isEdit) payload.password = formData.password;

    try {
      return await saveBranchStaffMember({
        basePath: '/doctors',
        id: docId,
        payload,
        user,
        dispatch,
        refreshThunk: fetchBranchDoctors,
      });
    } catch (err) {
      return rejectWithValue(extractBranchErrorDetail(err, 'Failed to save doctor.'));
    }
  }
);

export const deleteBranchDoctor = createAsyncThunk(
  'branchDoctors/deleteBranchDoctor',
  async (doctor, { getState, dispatch, rejectWithValue }) => {
    const user = getBranchAdminRequestUser(getState);

    try {
      await apiFetch(`/doctors/${encodeURIComponent(getDoctorId(doctor))}`, {
        user,
        method: 'DELETE',
      });
      await dispatch(fetchBranchDoctors());
      return doctor;
    } catch (err) {
      return rejectWithValue(extractBranchErrorDetail(err, 'Failed to delete doctor.'));
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
      const doctor = action.payload || null;
      state.formModal = { isOpen: true, doctor };
      state.formData = buildDoctorFormData(doctor);
      state.formErrors = {};
      state.customSlot = '';
      state.viewDoctor = null;
      state.saveError = null;
    },
    closeDoctorForm(state) {
      state.formModal = { isOpen: false, doctor: null };
      state.formData = buildDoctorFormData(null);
      state.formErrors = {};
      state.customSlot = '';
      state.saveError = null;
    },
    updateDoctorFormField(state, action) {
      applyStaffFormFieldUpdate(state, action.payload);
    },
    setDoctorFormErrors(state, action) {
      state.formErrors = action.payload || {};
    },
    setDoctorCustomSlot(state, action) {
      state.customSlot = action.payload;
    },
    addDoctorSlot(state, action) {
      const raw = action.payload || formatTime12(state.customSlot);
      const slot = String(raw || '').trim();
      if (!slot) return;
      const current = state.formData.slots || [];
      if (!current.includes(slot)) {
        state.formData.slots = [...current, slot];
      }
      state.customSlot = '';
    },
    removeDoctorSlot(state, action) {
      const index = action.payload;
      state.formData.slots = (state.formData.slots || []).filter((_, i) => i !== index);
    },
    addDoctorStandardSchedule(state) {
      const current = new Set(state.formData.slots || []);
      DOCTOR_TIME_PRESETS.forEach((slot) => current.add(slot));
      state.formData.slots = Array.from(current);
    },
    clearDoctorSaveError(state) {
      state.saveError = null;
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
      .addCase(saveBranchDoctor.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(saveBranchDoctor.fulfilled, (state, action) => {
        const submittedName = action.meta.arg?.formData?.name || state.formData.name;
        state.isSaving = false;
        state.saveError = null;
        state.formModal = { isOpen: false, doctor: null };
        state.formData = buildDoctorFormData(null);
        state.formErrors = {};
        state.customSlot = '';
        state.alert = {
          type: 'success',
          message: `${action.payload?.name || submittedName || 'Doctor'} saved successfully!`,
        };
      })
      .addCase(saveBranchDoctor.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload || 'Operation failed';
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
  updateDoctorFormField,
  setDoctorFormErrors,
  setDoctorCustomSlot,
  addDoctorSlot,
  removeDoctorSlot,
  addDoctorStandardSchedule,
  clearDoctorSaveError,
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
export const selectDoctorFormData = (state) => state.branchDoctors.formData;
export const selectDoctorFormErrors = (state) => state.branchDoctors.formErrors;
export const selectDoctorCustomSlot = (state) => state.branchDoctors.customSlot;
export const selectIsSavingDoctor = (state) => state.branchDoctors.isSaving;
export const selectDoctorSaveError = (state) => state.branchDoctors.saveError;
export const selectViewDoctor = (state) => state.branchDoctors.viewDoctor;
export const selectDoctorAppointments = (state) => state.branchDoctors.doctorAppointments;
export const selectDoctorAppointmentsStatus = (state) => state.branchDoctors.appointmentsStatus;
export const selectDoctorToDelete = (state) => state.branchDoctors.doctorToDelete;
export const selectIsDeletingDoctor = (state) => state.branchDoctors.isDeleting;

export default branchDoctorsSlice.reducer;
