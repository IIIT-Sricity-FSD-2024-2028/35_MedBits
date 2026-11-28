/**
 * branchLabTechniciansSlice.js — Branch Admin Manage Lab Technicians State (Redux Toolkit)
 * ========================================================================================
 * Location: src/store/slices/branchAdmin/branchLabTechniciansSlice.js
 *
 * Manages state for the Branch Admin Manage Lab Technicians page:
 *   - Data: `techList`
 *   - Filter: `selectedGender`
 *   - Modals: `formModal` (create/edit), `viewTech`, `techToDelete`
 *   - Async/UI state: `status`, `isDeleting`, `alert`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import {
  buildLabTechFormData,
  applyStaffFormFieldUpdate,
  getBranchAdminRequestUser,
  extractBranchErrorDetail,
  saveBranchStaffMember,
} from './branchStaffHelpers';

const initialState = {
  techList: [],
  status: 'idle',
  alert: null,
  selectedGender: '',
  formModal: {
    isOpen: false,
    tech: null, // null = create mode, object = edit mode
  },
  formData: buildLabTechFormData(null),
  formErrors: {},
  isSaving: false,
  saveError: null,
  viewTech: null,
  techToDelete: null,
  isDeleting: false,
};

export const fetchLabTechnicians = createAsyncThunk(
  'branchLabTechnicians/fetchLabTechnicians',
  async (_, { getState, rejectWithValue }) => {
    const user = getBranchAdminRequestUser(getState);

    try {
      const data = await apiFetch('/lab-technicians', { user });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to connect to backend server.');
    }
  }
);

export const saveLabTechnician = createAsyncThunk(
  'branchLabTechnicians/saveLabTechnician',
  async ({ formData: argFormData, initialData: argInitialData, branchId } = {}, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = getBranchAdminRequestUser(getState);
    const initialData = argInitialData !== undefined ? argInitialData : state.branchLabTechnicians.formModal.tech;
    const formData = argFormData || state.branchLabTechnicians.formData;
    const techId = initialData?.id || initialData?.userId;
    const isEdit = Boolean(techId);
    const effectiveBranchId = branchId || formData.branchId || user?.branchId || initialData?.branchId || '';

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      phone: formData.phone?.trim() || '',
      gender: formData.gender || '',
    };
    if (!isEdit) {
      payload.password = formData.password;
    } else if (formData.password?.trim()) {
      payload.password = formData.password;
    }

    try {
      return await saveBranchStaffMember({
        basePath: '/lab-technicians',
        id: techId,
        payload,
        user,
        dispatch,
        refreshThunk: fetchLabTechnicians,
      });
    } catch (err) {
      return rejectWithValue(extractBranchErrorDetail(err, 'Failed to save lab technician.'));
    }
  }
);

export const deleteLabTechnician = createAsyncThunk(
  'branchLabTechnicians/deleteLabTechnician',
  async (tech, { getState, dispatch, rejectWithValue }) => {
    const user = getBranchAdminRequestUser(getState);
    const techId = tech?.id || tech?.userId;

    try {
      await apiFetch(`/lab-technicians/${encodeURIComponent(techId)}`, {
        user,
        method: 'DELETE',
      });
      await dispatch(fetchLabTechnicians());
      return tech;
    } catch (err) {
      return rejectWithValue(extractBranchErrorDetail(err, 'Failed to remove lab technician.'));
    }
  }
);

const branchLabTechniciansSlice = createSlice({
  name: 'branchLabTechnicians',
  initialState,
  reducers: {
    setLabTechGenderFilter(state, action) {
      state.selectedGender = action.payload;
    },
    openLabTechForm(state, action) {
      const tech = action.payload || null;
      state.formModal = { isOpen: true, tech };
      state.formData = buildLabTechFormData(tech);
      state.formErrors = {};
      state.viewTech = null;
      state.saveError = null;
    },
    closeLabTechForm(state) {
      state.formModal = { isOpen: false, tech: null };
      state.formData = buildLabTechFormData(null);
      state.formErrors = {};
      state.saveError = null;
    },
    updateLabTechFormField(state, action) {
      applyStaffFormFieldUpdate(state, action.payload);
    },
    setLabTechFormErrors(state, action) {
      state.formErrors = action.payload || {};
    },
    clearLabTechSaveError(state) {
      state.saveError = null;
    },
    openLabTechView(state, action) {
      state.viewTech = action.payload;
    },
    closeLabTechView(state) {
      state.viewTech = null;
    },
    openLabTechDelete(state, action) {
      state.techToDelete = action.payload;
    },
    closeLabTechDelete(state) {
      state.techToDelete = null;
    },
    setLabTechAlert(state, action) {
      state.alert = action.payload;
    },
    clearLabTechAlert(state) {
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabTechnicians.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLabTechnicians.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.techList = action.payload;
      })
      .addCase(fetchLabTechnicians.rejected, (state, action) => {
        state.status = 'failed';
        state.alert = {
          type: 'error',
          message: action.payload || 'Failed to connect to backend server.',
        };
      })
      .addCase(saveLabTechnician.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(saveLabTechnician.fulfilled, (state, action) => {
        const submittedName = action.meta.arg?.formData?.name || state.formData.name;
        state.isSaving = false;
        state.saveError = null;
        state.formModal = { isOpen: false, tech: null };
        state.formData = buildLabTechFormData(null);
        state.formErrors = {};
        state.alert = {
          type: 'success',
          message: `${action.payload?.name || submittedName || 'Lab technician'} saved successfully!`,
        };
      })
      .addCase(saveLabTechnician.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload || 'Operation failed';
      })
      .addCase(deleteLabTechnician.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteLabTechnician.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.techToDelete = null;
        state.alert = {
          type: 'success',
          message: `${action.payload?.name || 'Lab technician'} removed successfully.`,
        };
      })
      .addCase(deleteLabTechnician.rejected, (state, action) => {
        state.isDeleting = false;
        state.alert = {
          type: 'error',
          message: action.payload || 'Failed to remove lab technician.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setLabTechGenderFilter,
  openLabTechForm,
  closeLabTechForm,
  updateLabTechFormField,
  setLabTechFormErrors,
  clearLabTechSaveError,
  openLabTechView,
  closeLabTechView,
  openLabTechDelete,
  closeLabTechDelete,
  setLabTechAlert,
  clearLabTechAlert,
} = branchLabTechniciansSlice.actions;

export const selectLabTechnicians = (state) => state.branchLabTechnicians.techList;
export const selectLabTechniciansStatus = (state) => state.branchLabTechnicians.status;
export const selectLabTechAlert = (state) => state.branchLabTechnicians.alert;
export const selectLabTechGenderFilter = (state) => state.branchLabTechnicians.selectedGender;
export const selectLabTechFormModal = (state) => state.branchLabTechnicians.formModal;
export const selectLabTechFormData = (state) => state.branchLabTechnicians.formData;
export const selectLabTechFormErrors = (state) => state.branchLabTechnicians.formErrors;
export const selectIsSavingLabTech = (state) => state.branchLabTechnicians.isSaving;
export const selectLabTechSaveError = (state) => state.branchLabTechnicians.saveError;
export const selectViewLabTech = (state) => state.branchLabTechnicians.viewTech;
export const selectLabTechToDelete = (state) => state.branchLabTechnicians.techToDelete;
export const selectIsDeletingLabTech = (state) => state.branchLabTechnicians.isDeleting;

export default branchLabTechniciansSlice.reducer;
