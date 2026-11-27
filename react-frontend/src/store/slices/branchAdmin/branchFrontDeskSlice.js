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

const initialState = {
  staffList: [],
  status: 'idle',
  alert: null,
  selectedGender: '',
  formModal: {
    isOpen: false,
    staff: null, // null = create mode, object = edit mode
  },
  viewStaff: null,
  staffToDelete: null,
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

export const fetchFrontDeskStaff = createAsyncThunk(
  'branchFrontDesk/fetchFrontDeskStaff',
  async (_, { getState, rejectWithValue }) => {
    const user = getRequestUser(getState);

    try {
      const data = await apiFetch('/frontdesk', { user });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(err?.message || 'Failed to connect to backend server.');
    }
  }
);

export const deleteFrontDeskStaff = createAsyncThunk(
  'branchFrontDesk/deleteFrontDeskStaff',
  async (staff, { getState, dispatch, rejectWithValue }) => {
    const user = getRequestUser(getState);
    const fdId = staff?.userId || staff?.id;

    try {
      await apiFetch(`/frontdesk/${encodeURIComponent(fdId)}`, {
        user,
        method: 'DELETE',
      });
      await dispatch(fetchFrontDeskStaff());
      return staff;
    } catch (err) {
      return rejectWithValue(extractErrorDetail(err, 'Failed to remove staff member.'));
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
      state.formModal = { isOpen: true, staff: action.payload || null };
      state.viewStaff = null;
    },
    closeFrontDeskForm(state) {
      state.formModal = { isOpen: false, staff: null };
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
export const selectViewFrontDeskStaff = (state) => state.branchFrontDesk.viewStaff;
export const selectFrontDeskStaffToDelete = (state) => state.branchFrontDesk.staffToDelete;
export const selectIsDeletingFrontDesk = (state) => state.branchFrontDesk.isDeleting;

export default branchFrontDeskSlice.reducer;
