/**
 * superAdminDashboardSlice.js — Super Admin Dashboard State (Redux Toolkit)
 * ===========================================================================
 * Location: src/store/slices/superAdmin/superAdminDashboardSlice.js
 *
 * Manages state for the Super Admin Master Dashboard (`dashboard.jsx` / `SuperUserDashboard.jsx`):
 *   - Data: `branches`
 *   - Table search filter: `searchQuery`
 *   - Forms: `branchForm`, `adminForm`
 *   - Async/UI state: `status`, `isCreatingBranch`, `isAssigningAdmin`, `toast`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

// Fallback demo data if backend is offline or empty
export const FALLBACK_DASHBOARD_BRANCHES = [
  {
    id: 'br-blr-01',
    branchName: 'Central Bangalore',
    hospitalName: 'MedBits Central (Apollo Wing)',
    city: 'Bangalore',
    state: 'Karnataka',
    status: 'Active',
    branchAdmin: { name: 'Admin User', email: 'admin@medbits.com', phone: '+91 98765 43210' },
  },
  {
    id: 'br-blr-02',
    branchName: 'Tech Hub Clinic',
    hospitalName: 'MedBits Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    status: 'Active',
    branchAdmin: { name: 'Ramesh Kumar', email: 'rameshmedbits@gmail.com', phone: '+91 98765 12345' },
  },
  {
    id: 'br-hyd-01',
    branchName: 'Cyber Towers Wing',
    hospitalName: 'MedBits Hitec City',
    city: 'Hyderabad',
    state: 'Telangana',
    status: 'Active',
    branchAdmin: null,
  },
];

const EMPTY_BRANCH_FORM = {
  hospitalName: '',
  branchName: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
};

const EMPTY_ADMIN_FORM = {
  branchId: '',
  name: '',
  email: '',
  phone: '',
  password: '',
};

const initialState = {
  branches: [],
  searchQuery: '',
  branchForm: { ...EMPTY_BRANCH_FORM },
  adminForm: { ...EMPTY_ADMIN_FORM },
  status: 'idle',
  isCreatingBranch: false,
  isAssigningAdmin: false,
  toast: null,
};

function extractErrorMessage(err, fallback) {
  const raw = err?.message || '';
  const detail = raw.includes(': ') ? raw.split(': ').slice(1).join(': ') : raw;
  return detail || fallback;
}

export const fetchSuperAdminDashboard = createAsyncThunk(
  'superAdminDashboard/fetchDashboard',
  async (_, { getState }) => {
    const user = getState().auth.user;
    try {
      const data = await apiFetch('/super-admin/dashboard', {
        user: { ...user, role: user?.role || 'super_admin' },
      });
      return Array.isArray(data?.branches) && data.branches.length > 0
        ? data.branches
        : FALLBACK_DASHBOARD_BRANCHES;
    } catch {
      return FALLBACK_DASHBOARD_BRANCHES;
    }
  }
);

export const createHospitalBranch = createAsyncThunk(
  'superAdminDashboard/createBranch',
  async (branchPayload, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = state.auth.user;
    const payload = branchPayload || state.superAdminDashboard.branchForm;

    try {
      await apiFetch('/super-admin/hospital-branches', {
        user: { ...user, role: user?.role || 'super_admin' },
        method: 'POST',
        body: payload,
      });

      await dispatch(fetchSuperAdminDashboard());
      return { message: 'Branch created successfully!' };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Could not create branch'));
    }
  }
);

export const assignBranchAdmin = createAsyncThunk(
  'superAdminDashboard/assignAdmin',
  async (adminPayload, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = state.auth.user;
    const payload = adminPayload || state.superAdminDashboard.adminForm;

    if (!payload.branchId) {
      return rejectWithValue('Please select a branch first');
    }

    try {
      await apiFetch('/super-admin/branch-admins', {
        user: { ...user, role: user?.role || 'super_admin' },
        method: 'POST',
        body: payload,
      });

      await dispatch(fetchSuperAdminDashboard());
      return { message: 'Branch admin created & linked successfully!' };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Could not assign branch admin'));
    }
  }
);

const superAdminDashboardSlice = createSlice({
  name: 'superAdminDashboard',
  initialState,
  reducers: {
    setDashboardSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    updateBranchFormField(state, action) {
      const { field, value } = action.payload;
      state.branchForm[field] = value;
    },
    resetBranchForm(state) {
      state.branchForm = { ...EMPTY_BRANCH_FORM };
    },
    updateAdminFormField(state, action) {
      const { field, value } = action.payload;
      state.adminForm[field] = value;
    },
    resetAdminForm(state) {
      state.adminForm = { ...EMPTY_ADMIN_FORM };
    },
    showDashboardToast(state, action) {
      const { message, type = 'success' } = action.payload;
      state.toast = { message, type };
    },
    clearDashboardToast(state) {
      state.toast = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuperAdminDashboard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSuperAdminDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.branches = action.payload;
      })
      .addCase(fetchSuperAdminDashboard.rejected, (state) => {
        state.status = 'failed';
        state.branches = FALLBACK_DASHBOARD_BRANCHES;
      })
      .addCase(createHospitalBranch.pending, (state) => {
        state.isCreatingBranch = true;
      })
      .addCase(createHospitalBranch.fulfilled, (state, action) => {
        state.isCreatingBranch = false;
        state.branchForm = { ...EMPTY_BRANCH_FORM };
        state.toast = {
          message: action.payload.message,
          type: 'success',
        };
      })
      .addCase(createHospitalBranch.rejected, (state, action) => {
        state.isCreatingBranch = false;
        state.toast = {
          message: action.payload || 'Could not create branch',
          type: 'error',
        };
      })
      .addCase(assignBranchAdmin.pending, (state) => {
        state.isAssigningAdmin = true;
      })
      .addCase(assignBranchAdmin.fulfilled, (state, action) => {
        state.isAssigningAdmin = false;
        state.adminForm = { ...EMPTY_ADMIN_FORM };
        state.toast = {
          message: action.payload.message,
          type: 'success',
        };
      })
      .addCase(assignBranchAdmin.rejected, (state, action) => {
        state.isAssigningAdmin = false;
        state.toast = {
          message: action.payload || 'Could not assign branch admin',
          type: 'error',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setDashboardSearchQuery,
  updateBranchFormField,
  resetBranchForm,
  updateAdminFormField,
  resetAdminForm,
  showDashboardToast,
  clearDashboardToast,
} = superAdminDashboardSlice.actions;

export const selectDashboardBranches = (state) => state.superAdminDashboard.branches;
export const selectDashboardSearchQuery = (state) => state.superAdminDashboard.searchQuery;
export const selectBranchForm = (state) => state.superAdminDashboard.branchForm;
export const selectAdminForm = (state) => state.superAdminDashboard.adminForm;
export const selectSuperAdminDashboardStatus = (state) => state.superAdminDashboard.status;
export const selectIsCreatingBranch = (state) => state.superAdminDashboard.isCreatingBranch;
export const selectIsAssigningAdmin = (state) => state.superAdminDashboard.isAssigningAdmin;
export const selectDashboardToast = (state) => state.superAdminDashboard.toast;

export default superAdminDashboardSlice.reducer;
