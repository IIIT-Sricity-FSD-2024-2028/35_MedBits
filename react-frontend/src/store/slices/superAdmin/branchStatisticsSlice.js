/**
 * branchStatisticsSlice.js — Super Admin Branch Statistics State (Redux Toolkit)
 * ===============================================================================
 * Location: src/store/slices/superAdmin/branchStatisticsSlice.js
 *
 * Manages state for the Super Admin Branch Statistics page:
 *   - Data: `branches`, `stats` (`branch`, `summary`, `doctors`, `frontdesk`, `labTechnicians`)
 *   - Search filters: `docSearch`, `fdSearch`, `ltSearch`
 *   - Async state: `branchesStatus`, `statsStatus`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

// Fallback demo branches for offline preview
export const DEFAULT_BRANCHES = [
  {
    id: 'br-blr-01',
    branchName: 'Central Bangalore',
    hospitalName: 'MedBits Central (Apollo Wing)',
    city: 'Bangalore',
    state: 'Karnataka',
    email: 'indiranagar@medbits.com',
    phone: '+91 80 4123 4567',
    address: '100 Feet Road, Indiranagar',
    pincode: '560038',
    status: 'Active',
  },
  {
    id: 'br-blr-02',
    branchName: 'Tech Hub Clinic',
    hospitalName: 'MedBits Electronic City',
    city: 'Bangalore',
    state: 'Karnataka',
    email: 'electroniccity@medbits.com',
    phone: '+91 80 9876 5432',
    address: 'Phase 1, Hosur Main Road',
    pincode: '560100',
    status: 'Active',
  },
  {
    id: 'br-hyd-01',
    branchName: 'Cyber Towers Wing',
    hospitalName: 'MedBits Hitec City',
    city: 'Hyderabad',
    state: 'Telangana',
    email: 'hiteccity@medbits.com',
    phone: '+91 40 2345 6789',
    address: 'Madhapur Main Road',
    pincode: '500081',
    status: 'Active',
  },
];

const EMPTY_STATS = {
  branch: null,
  summary: {
    totalDoctors: 0,
    totalAppointments: 0,
    totalFrontdesks: 0,
    totalLabTechnicians: 0,
  },
  doctors: [],
  frontdesk: [],
  labTechnicians: [],
};

const initialState = {
  branches: [],
  stats: EMPTY_STATS,
  docSearch: '',
  fdSearch: '',
  ltSearch: '',
  branchesStatus: 'idle',
  statsStatus: 'idle',
};

function buildFallbackStats(branchId, branches) {
  const matched = branches.find((b) => b.id === branchId) || DEFAULT_BRANCHES[0];
  return {
    branch: matched,
    summary: {
      totalDoctors: 4,
      totalAppointments: 86,
      totalFrontdesks: 2,
      totalLabTechnicians: 2,
    },
    doctors: [
      {
        id: 'd-1',
        name: 'Dr. Ria Sharma',
        email: 'ria.sharma@medbits.com',
        specialization: 'Cardiology',
        department: 'Cardiology',
        experience: 12,
        phone: '+91 98765 43210',
        gender: 'Female',
        qualification: 'MBBS, MD',
      },
      {
        id: 'd-2',
        name: 'Dr. Arvind Swaminathan',
        email: 'arvind.s@medbits.com',
        specialization: 'Neurology',
        department: 'Neurology',
        experience: 15,
        phone: '+91 98450 11223',
        gender: 'Male',
        qualification: 'MBBS, DM',
      },
    ],
    frontdesk: [
      {
        userId: 'fd-1',
        name: 'Pooja Verma',
        email: 'pooja.v@medbits.com',
        counter: 'Desk 1 - Reception',
        shiftStart: '08:00 AM',
        shiftEnd: '04:00 PM',
        languages: ['English', 'Hindi'],
        phone: '+91 91234 56780',
        gender: 'Female',
        reportingManagerId: 'admin@medbits.com',
      },
    ],
    labTechnicians: [
      {
        id: 'lt-1',
        name: 'Suresh Kumar',
        email: 'suresh.k@medbits.com',
        branchId,
        createdAt: '2025-01-15T09:30:00.000Z',
      },
    ],
  };
}

export const fetchSuperAdminBranches = createAsyncThunk(
  'branchStatistics/fetchBranches',
  async (_, { getState }) => {
    const user = getState().auth.user;
    try {
      const list = await apiFetch('/super-admin/hospital-branches', {
        user: { ...user, role: user?.role || 'super_admin' },
      });
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
      return DEFAULT_BRANCHES;
    } catch {
      return DEFAULT_BRANCHES;
    }
  }
);

export const fetchBranchStatistics = createAsyncThunk(
  'branchStatistics/fetchStatistics',
  async (branchId, { getState }) => {
    const state = getState();
    const user = state.auth.user;
    const branches = state.branchStatistics.branches;

    try {
      const data = await apiFetch(
        `/super-admin/hospital-branches/${encodeURIComponent(branchId)}/statistics`,
        {
          user: { ...user, role: user?.role || 'super_admin' },
        }
      );

      return {
        branch: data.branch || branches.find((b) => b.id === branchId) || null,
        summary: data.summary || {
          totalDoctors: data.doctors?.length || 0,
          totalAppointments: 0,
          totalFrontdesks: data.frontdesk?.length || 0,
          totalLabTechnicians: data.labTechnicians?.length || 0,
        },
        doctors: Array.isArray(data.doctors) ? data.doctors : [],
        frontdesk: Array.isArray(data.frontdesk) ? data.frontdesk : [],
        labTechnicians: Array.isArray(data.labTechnicians) ? data.labTechnicians : [],
      };
    } catch {
      return buildFallbackStats(branchId, branches);
    }
  }
);

const branchStatisticsSlice = createSlice({
  name: 'branchStatistics',
  initialState,
  reducers: {
    setDocSearch(state, action) {
      state.docSearch = action.payload;
    },
    setFdSearch(state, action) {
      state.fdSearch = action.payload;
    },
    setLtSearch(state, action) {
      state.ltSearch = action.payload;
    },
    resetBranchStatsFilters(state) {
      state.docSearch = '';
      state.fdSearch = '';
      state.ltSearch = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuperAdminBranches.pending, (state) => {
        state.branchesStatus = 'loading';
      })
      .addCase(fetchSuperAdminBranches.fulfilled, (state, action) => {
        state.branchesStatus = 'succeeded';
        state.branches = action.payload;
      })
      .addCase(fetchSuperAdminBranches.rejected, (state) => {
        state.branchesStatus = 'failed';
        state.branches = DEFAULT_BRANCHES;
      })
      .addCase(fetchBranchStatistics.pending, (state) => {
        state.statsStatus = 'loading';
      })
      .addCase(fetchBranchStatistics.fulfilled, (state, action) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchBranchStatistics.rejected, (state) => {
        state.statsStatus = 'failed';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setDocSearch,
  setFdSearch,
  setLtSearch,
  resetBranchStatsFilters,
} = branchStatisticsSlice.actions;

export const selectSuperAdminBranches = (state) => state.branchStatistics.branches;
export const selectBranchStatistics = (state) => state.branchStatistics.stats;
export const selectDocSearch = (state) => state.branchStatistics.docSearch;
export const selectFdSearch = (state) => state.branchStatistics.fdSearch;
export const selectLtSearch = (state) => state.branchStatistics.ltSearch;
export const selectSuperAdminBranchesStatus = (state) => state.branchStatistics.branchesStatus;
export const selectBranchStatsStatus = (state) => state.branchStatistics.statsStatus;

export default branchStatisticsSlice.reducer;
