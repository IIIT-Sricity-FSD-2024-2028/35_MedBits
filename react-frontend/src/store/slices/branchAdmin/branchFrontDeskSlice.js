/**
 * branchFrontDeskSlice.js — Branch Admin Manage Front Desk State (Redux Toolkit)
 * ===============================================================================
 * Location: src/store/slices/branchAdmin/branchFrontDeskSlice.js
 *
 * Manages state for the Branch Admin Manage Front Desk page:
 *   - Data: `staffList`
 *   - Filter: `selectedGender`
 *   - Modals: `formModal` (create/edit), `viewStaff`, `staffToDelete`
 *   - Async/UI state: `status`, `isDeleting`, `alert`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { formatTime12 } from '../../../pages/BranchAdmin/utils/staffHelpers';
import {
  buildFrontDeskFormData,
  applyStaffFormFieldUpdate,
  getBranchAdminRequestUser,
  extractBranchErrorDetail,
  saveBranchStaffMember,
} from './branchStaffHelpers';

const initialState = {
  staffList: [],
  status: 'idle',
  alert: null,
  selectedGender: '',
  formModal: {
    isOpen: false,
    staff: null, // null = create mode, object = edit mode
  },
  formData: buildFrontDeskFormData(null),
  formErrors: {},
  customLang: '',
  isSaving: false,
  saveError: null,
  viewStaff: null,
  staffToDelete: null,
  isDeleting: false,
};

export const fetchFrontDeskStaff = createAsyncThunk(
  'branchFrontDesk/fetchFrontDeskStaff',
  async (_, { getState, rejectWithValue }) => {
    const user = getBranchAdminRequestUser(getState);

    try {
      const data = await apiFetch('/frontdesk', { user });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to connect to backend server.');
    }
  }
);

export const saveFrontDeskStaff = createAsyncThunk(
  'branchFrontDesk/saveFrontDeskStaff',
  async ({ formData: argFormData, initialData: argInitialData, branchId } = {}, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = getBranchAdminRequestUser(getState);
    const initialData = argInitialData !== undefined ? argInitialData : state.branchFrontDesk.formModal.staff;
    const formData = argFormData || state.branchFrontDesk.formData;
    const fdId = initialData?.userId || initialData?.id;
    const isEdit = Boolean(fdId);
    const effectiveBranchId = branchId || formData.branchId || user?.branchId || initialData?.branchId || '';

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      branchId: effectiveBranchId,
      ...(formData.phone ? { phone: formData.phone.trim() } : {}),
      ...(formData.gender ? { gender: formData.gender } : {}),
      ...(formData.counter ? { counter: formData.counter.trim() } : {}),
      ...(formData.shiftStart ? { shiftStart: formatTime12(formData.shiftStart) } : {}),
      ...(formData.shiftEnd ? { shiftEnd: formatTime12(formData.shiftEnd) } : {}),
      ...(formData.reportingManagerId
        ? { reportingManagerId: formData.reportingManagerId.trim() }
        : {}),
      languages: formData.languages || [],
    };
    if (!isEdit) payload.password = formData.password;

    try {
      return await saveBranchStaffMember({
        basePath: '/frontdesk',
        id: fdId,
        payload,
        user,
        dispatch,
        refreshThunk: fetchFrontDeskStaff,
      });
    } catch (err) {
      return rejectWithValue(extractBranchErrorDetail(err, 'Failed to save staff member.'));
    }
  }
);

export const deleteFrontDeskStaff = createAsyncThunk(
  'branchFrontDesk/deleteFrontDeskStaff',
  async (staff, { getState, dispatch, rejectWithValue }) => {
    const user = getBranchAdminRequestUser(getState);
    const fdId = staff?.userId || staff?.id;

    try {
      await apiFetch(`/frontdesk/${encodeURIComponent(fdId)}`, {
        user,
        method: 'DELETE',
      });
      await dispatch(fetchFrontDeskStaff());
      return staff;
    } catch (err) {
      return rejectWithValue(extractBranchErrorDetail(err, 'Failed to remove staff member.'));
    }
  }
);

const branchFrontDeskSlice = createSlice({
  name: 'branchFrontDesk',
  initialState,
  reducers: {
    setFrontDeskGenderFilter(state, action) {
      state.selectedGender = action.payload;
    },
    openFrontDeskForm(state, action) {
      const staff = action.payload || null;
      state.formModal = { isOpen: true, staff };
      state.formData = buildFrontDeskFormData(staff);
      state.formErrors = {};
      state.customLang = '';
      state.viewStaff = null;
      state.saveError = null;
    },
    closeFrontDeskForm(state) {
      state.formModal = { isOpen: false, staff: null };
      state.formData = buildFrontDeskFormData(null);
      state.formErrors = {};
      state.customLang = '';
      state.saveError = null;
    },
    updateFrontDeskFormField(state, action) {
      applyStaffFormFieldUpdate(state, action.payload);
    },
    setFrontDeskFormErrors(state, action) {
      state.formErrors = action.payload || {};
    },
    setFrontDeskCustomLang(state, action) {
      state.customLang = action.payload;
    },
    addFrontDeskLanguage(state, action) {
      const raw = typeof action.payload === 'string' ? action.payload : state.customLang;
      const lang = raw.trim();
      if (!lang) return;
      const current = state.formData.languages || [];
      if (!current.some((l) => l.toLowerCase() === lang.toLowerCase())) {
        state.formData.languages = [...current, lang];
      }
      state.customLang = '';
    },
    removeFrontDeskLanguage(state, action) {
      const index = action.payload;
      state.formData.languages = (state.formData.languages || []).filter((_, i) => i !== index);
    },
    clearFrontDeskSaveError(state) {
      state.saveError = null;
    },
    openFrontDeskView(state, action) {
      state.viewStaff = action.payload;
    },
    closeFrontDeskView(state) {
      state.viewStaff = null;
    },
    openFrontDeskDelete(state, action) {
      state.staffToDelete = action.payload;
    },
    closeFrontDeskDelete(state) {
      state.staffToDelete = null;
    },
    setFrontDeskAlert(state, action) {
      state.alert = action.payload;
    },
    clearFrontDeskAlert(state) {
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFrontDeskStaff.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFrontDeskStaff.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.staffList = action.payload;
      })
      .addCase(fetchFrontDeskStaff.rejected, (state, action) => {
        state.status = 'failed';
        state.alert = {
          type: 'error',
          message: action.payload || 'Failed to connect to backend server.',
        };
      })
      .addCase(saveFrontDeskStaff.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(saveFrontDeskStaff.fulfilled, (state, action) => {
        const submittedName = action.meta.arg?.formData?.name || state.formData.name;
        state.isSaving = false;
        state.saveError = null;
        state.formModal = { isOpen: false, staff: null };
        state.formData = buildFrontDeskFormData(null);
        state.formErrors = {};
        state.customLang = '';
        state.alert = {
          type: 'success',
          message: `${action.payload?.name || submittedName || 'Front desk staff'} saved successfully!`,
        };
      })
      .addCase(saveFrontDeskStaff.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload || 'Operation failed';
      })
      .addCase(deleteFrontDeskStaff.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteFrontDeskStaff.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.staffToDelete = null;
        state.alert = {
          type: 'success',
          message: `${action.payload?.name || 'Staff member'} removed successfully.`,
        };
      })
      .addCase(deleteFrontDeskStaff.rejected, (state, action) => {
        state.isDeleting = false;
        state.alert = {
          type: 'error',
          message: action.payload || 'Failed to remove staff member.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setFrontDeskGenderFilter,
  openFrontDeskForm,
  closeFrontDeskForm,
  updateFrontDeskFormField,
  setFrontDeskFormErrors,
  setFrontDeskCustomLang,
  addFrontDeskLanguage,
  removeFrontDeskLanguage,
  clearFrontDeskSaveError,
  openFrontDeskView,
  closeFrontDeskView,
  openFrontDeskDelete,
  closeFrontDeskDelete,
  setFrontDeskAlert,
  clearFrontDeskAlert,
} = branchFrontDeskSlice.actions;

export const selectFrontDeskStaff = (state) => state.branchFrontDesk.staffList;
export const selectFrontDeskStatus = (state) => state.branchFrontDesk.status;
export const selectFrontDeskAlert = (state) => state.branchFrontDesk.alert;
export const selectFrontDeskGenderFilter = (state) => state.branchFrontDesk.selectedGender;
export const selectFrontDeskFormModal = (state) => state.branchFrontDesk.formModal;
export const selectFrontDeskFormData = (state) => state.branchFrontDesk.formData;
export const selectFrontDeskFormErrors = (state) => state.branchFrontDesk.formErrors;
export const selectFrontDeskCustomLang = (state) => state.branchFrontDesk.customLang;
export const selectIsSavingFrontDesk = (state) => state.branchFrontDesk.isSaving;
export const selectFrontDeskSaveError = (state) => state.branchFrontDesk.saveError;
export const selectViewFrontDeskStaff = (state) => state.branchFrontDesk.viewStaff;
export const selectFrontDeskStaffToDelete = (state) => state.branchFrontDesk.staffToDelete;
export const selectIsDeletingFrontDesk = (state) => state.branchFrontDesk.isDeleting;

export default branchFrontDeskSlice.reducer;
