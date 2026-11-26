/**
 * branchLeaveManagementSlice.js — Branch Admin Leave Management State (Redux Toolkit)
 * ====================================================================================
 * Location: src/store/slices/branchAdmin/branchLeaveManagementSlice.js
 *
 * Manages state for the Branch Admin Leave Management page:
 *   - Data: `leaveRequests`
 *   - Filter & Modals: `statusFilter`, `confirmModal`, `detailsModal`
 *   - Async/UI state: `status`, `isActioning`, `alert`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { formatDate } from '../../../pages/BranchAdmin/utils/staffHelpers';
import { logout } from '../authSlice';

const initialState = {
  leaveRequests: [],
  status: 'idle',
  alert: null,
  statusFilter: '',
  confirmModal: {
    isOpen: false,
    request: null,
    action: null, // 'approved' | 'rejected'
  },
  isActioning: false,
  detailsModal: {
    isOpen: false,
    request: null,
  },
};

export const fetchLeaveRequests = createAsyncThunk(
  'branchLeaveManagement/fetchLeaveRequests',
  async (_, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const requestUser = { ...user, role: user?.role || 'branch_admin' };

    try {
      const data = await apiFetch('/leave-requests', { user: requestUser });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(
        err?.message || 'Error connecting to backend server on port 3000.'
      );
    }
  }
);

export const decideLeaveRequest = createAsyncThunk(
  'branchLeaveManagement/decideLeaveRequest',
  async ({ request, action }, { getState, dispatch, rejectWithValue }) => {
    const user = getState().auth.user;
    const requestUser = { ...user, role: user?.role || 'branch_admin' };

    try {
      await apiFetch(`/leave-requests/${encodeURIComponent(request.id)}`, {
        user: requestUser,
        method: 'PUT',
        body: { status: action },
      });

      await dispatch(fetchLeaveRequests());
      return { request, action };
    } catch (err) {
      const raw = err?.message || '';
      const detail = raw.includes(': ') ? raw.split(': ').slice(1).join(': ') : raw;
      return rejectWithValue({
        action,
        message: detail || 'Failed to update leave request.',
      });
    }
  }
);

const branchLeaveManagementSlice = createSlice({
  name: 'branchLeaveManagement',
  initialState,
  reducers: {
    setLeaveStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    openLeaveConfirmModal(state, action) {
      const { request, decision } = action.payload;
      state.confirmModal = {
        isOpen: true,
        request,
        action: decision,
      };
    },
    closeLeaveConfirmModal(state) {
      state.confirmModal = {
        isOpen: false,
        request: null,
        action: null,
      };
    },
    openLeaveDetailsModal(state, action) {
      state.detailsModal = {
        isOpen: true,
        request: action.payload,
      };
    },
    closeLeaveDetailsModal(state) {
      state.detailsModal = {
        isOpen: false,
        request: null,
      };
    },
    clearLeaveAlert(state) {
      state.alert = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leaveRequests = action.payload;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.status = 'failed';
        state.alert = {
          type: 'error',
          title: 'Unable to Load Leave Requests',
          message: action.payload || 'Error connecting to backend server on port 3000.',
        };
      })
      .addCase(decideLeaveRequest.pending, (state) => {
        state.isActioning = true;
      })
      .addCase(decideLeaveRequest.fulfilled, (state, action) => {
        const { request, action: decision } = action.payload;
        state.isActioning = false;
        state.alert = {
          type: 'success',
          title: decision === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected',
          message: `Leave request for ${request.name || 'staff member'} on ${
            request.dateRange || formatDate(request.date)
          } has been ${decision} successfully.`,
        };
        state.confirmModal = { isOpen: false, request: null, action: null };
        if (state.detailsModal.isOpen && state.detailsModal.request?.id === request.id) {
          state.detailsModal = { isOpen: false, request: null };
        }
      })
      .addCase(decideLeaveRequest.rejected, (state, action) => {
        const decision = action.payload?.action;
        state.isActioning = false;
        state.alert = {
          type: 'error',
          title: decision === 'approved' ? 'Approval Prevented' : 'Rejection Failed',
          message: action.payload?.message || 'Failed to update leave request.',
        };
        state.confirmModal = { isOpen: false, request: null, action: null };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setLeaveStatusFilter,
  openLeaveConfirmModal,
  closeLeaveConfirmModal,
  openLeaveDetailsModal,
  closeLeaveDetailsModal,
  clearLeaveAlert,
} = branchLeaveManagementSlice.actions;

export const selectLeaveRequests = (state) => state.branchLeaveManagement.leaveRequests;
export const selectLeaveRequestsStatus = (state) => state.branchLeaveManagement.status;
export const selectLeaveAlert = (state) => state.branchLeaveManagement.alert;
export const selectLeaveStatusFilter = (state) => state.branchLeaveManagement.statusFilter;
export const selectLeaveConfirmModal = (state) => state.branchLeaveManagement.confirmModal;
export const selectIsActioningLeave = (state) => state.branchLeaveManagement.isActioning;
export const selectLeaveDetailsModal = (state) => state.branchLeaveManagement.detailsModal;

export default branchLeaveManagementSlice.reducer;
