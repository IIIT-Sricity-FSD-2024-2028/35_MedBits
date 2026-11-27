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

const initialState = {
  techList: [],
  status: 'idle',
  alert: null,
  selectedGender: '',
  formModal: {
    isOpen: false,
    tech: null, // null = create mode, object = edit mode
  },
  viewTech: null,
  techToDelete: null,
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

export const fetchLabTechnicians = createAsyncThunk(
  'branchLabTechnicians/fetchLabTechnicians',
  async (_, { getState, rejectWithValue }) => {
    const user = getRequestUser(getState);

    try {
      const data = await apiFetch('/lab-technicians', { user });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to connect to backend server.');
    }
  }
);

export const deleteLabTechnician = createAsyncThunk(
  'branchLabTechnicians/deleteLabTechnician',
  async (tech, { getState, dispatch, rejectWithValue }) => {
    const user = getRequestUser(getState);
    const techId = tech?.id || tech?.userId;

    try {
      await apiFetch(`/lab-technicians/${encodeURIComponent(techId)}`, {
        user,
        method: 'DELETE',
      });
      await dispatch(fetchLabTechnicians());
      return tech;
    } catch (err) {
      return rejectWithValue(extractErrorDetail(err, 'Failed to remove lab technician.'));
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
      state.formModal = { isOpen: true, tech: action.payload || null };
      state.viewTech = null;
    },
    closeLabTechForm(state) {
      state.formModal = { isOpen: false, tech: null };
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
export const selectViewLabTech = (state) => state.branchLabTechnicians.viewTech;
export const selectLabTechToDelete = (state) => state.branchLabTechnicians.techToDelete;
export const selectIsDeletingLabTech = (state) => state.branchLabTechnicians.isDeleting;

export default branchLabTechniciansSlice.reducer;
