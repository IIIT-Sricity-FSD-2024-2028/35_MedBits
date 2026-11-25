/**
 * patientLabTestsSlice.js — Patient Diagnostic Lab Tests State (Redux Toolkit)
 * ==============================================================================
 * Location: src/store/slices/patient/patientLabTestsSlice.js
 *
 * Manages state for the Patient Lab Tests booking page:
 *   - Filters: `selectedBranchId`, `selectedCategory`, `searchQuery`, `sortBy`, `fastingFilter`
 *   - Data: `branches`, `tests`, `historyOrders`
 *   - Cart: `cartQuantities`
 *   - UI/Async state: `branchesStatus`, `testsStatus`, `historyStatus`,
 *     `isSubmitting`, `feedbackNotice`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

// Canonical test catalog with medical descriptions
export const FALLBACK_TESTS = [
  {
    id: 'LAB001',
    name: 'Prime Full Body Checkup',
    price: 1549,
    category: 'Full Body Check Up',
    description: 'Comprehensive preventive health screening package covering lipid profile, liver function, renal function, hemogram, and thyroid markers.',
    parametersCount: '63 Tests',
    sampleType: 'Blood & Urine',
    fastingRequired: '10-12 hrs fasting',
    turnaroundTime: 'Reports in 24 hrs',
  },
  {
    id: 'LAB002',
    name: 'Xpert Regular Full Body Health Checkup',
    price: 1079,
    category: 'Full Body Check Up',
    description: 'Routine full body screening with essential health markers for regular annual checkups and early disease detection.',
    parametersCount: '48 Tests',
    sampleType: 'Blood Sample',
    fastingRequired: '10-12 hrs fasting',
    turnaroundTime: 'Reports in 24 hrs',
  },
  {
    id: 'LAB003',
    name: 'HbA1c Test (Glycated Hemoglobin)',
    price: 649,
    category: 'Diabetes',
    description: 'Measures average blood sugar levels over the last 2 to 3 months to diagnose and manage pre-diabetes and diabetes mellitus.',
    parametersCount: 'Gold Standard',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB004',
    name: 'Fasting Blood Sugar Test (FBS)',
    price: 100,
    category: 'Diabetes',
    description: 'Checks your basal glucose level after an overnight fast for primary diabetes diagnosis and glycemic regulation evaluation.',
    parametersCount: '1 Parameter',
    sampleType: 'Blood Sample',
    fastingRequired: '8-10 hrs fasting',
    turnaroundTime: 'Reports in 6 hrs',
  },
  {
    id: 'LAB005',
    name: 'Complete Blood Count (CBC)',
    price: 419,
    category: 'Blood Studies',
    description: 'Complete blood count assessing RBC, WBC, platelets, hemoglobin, and hematocrit to evaluate infections, anemia, and general wellness.',
    parametersCount: '24 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 8 hrs',
  },
  {
    id: 'LAB006',
    name: 'Comprehensive Lipid Profile',
    price: 829,
    category: 'Heart',
    description: 'Measures total cholesterol, HDL, LDL, VLDL, and triglycerides to calculate coronary risk assessment and cardiovascular health.',
    parametersCount: '8 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: '12 hrs fasting',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB007',
    name: 'Thyroid Profile Total (T3, T4, TSH)',
    price: 550,
    category: 'Thyroid',
    description: 'Evaluates thyroid gland activity and metabolic hormone regulation to detect hyperthyroidism or hypothyroidism.',
    parametersCount: '3 Hormones',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB008',
    name: 'Vitamin D (25-OH) & Vitamin B12 Duo',
    price: 1299,
    category: 'Vitamin',
    description: 'Crucial screening for bone density, calcium absorption, neurological health, energy metabolism, and immunity strength.',
    parametersCount: '2 Essential Vitamins',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 24 hrs',
  },
  {
    id: 'LAB009',
    name: 'Renal / Kidney Function Test (KFT)',
    price: 699,
    category: 'Kidney',
    description: 'Assesses serum creatinine, blood urea nitrogen (BUN), uric acid, and electrolytes to evaluate kidney filtration health.',
    parametersCount: '6 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
  {
    id: 'LAB010',
    name: 'Liver Function Test (LFT)',
    price: 749,
    category: 'Liver',
    description: 'Evaluates liver enzymes (SGOT, SGPT, ALP), bilirubin levels, and total proteins to detect hepatic infection or inflammation.',
    parametersCount: '11 Parameters',
    sampleType: 'Blood Sample',
    fastingRequired: 'No fasting required',
    turnaroundTime: 'Reports in 12 hrs',
  },
];

const initialState = {
  branches: [],
  selectedBranchId: '',
  selectedCategory: 'All Tests',
  searchQuery: '',
  sortBy: 'default',
  fastingFilter: 'all',
  tests: [],
  cartQuantities: {},
  historyOrders: [],
  branchesStatus: 'idle',
  testsStatus: 'idle',
  historyStatus: 'idle',
  isSubmitting: false,
  feedbackNotice: null,
};

export const fetchLabBranches = createAsyncThunk(
  'patientLabTests/fetchBranches',
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

export const fetchLabTests = createAsyncThunk(
  'patientLabTests/fetchTests',
  async (_, { getState }) => {
    const user = getState().auth.user;
    try {
      const data = await apiFetch('/labtests', {
        user: { ...user, role: user?.role || 'patient' },
      });
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => {
          const fb = FALLBACK_TESTS.find(
            (f) => f.id === item.id || f.name.toLowerCase() === item.name?.toLowerCase()
          );
          return {
            ...item,
            description:
              item.description ||
              fb?.description ||
              'Diagnostic laboratory analysis performed under NABL accredited protocols.',
            parametersCount: fb?.parametersCount || 'Standard Markers',
            sampleType: fb?.sampleType || 'Blood Sample',
            fastingRequired: fb?.fastingRequired || 'Routine checkup guidelines',
            turnaroundTime: fb?.turnaroundTime || 'Reports in 24 hrs',
          };
        });
      }
      return FALLBACK_TESTS;
    } catch {
      return FALLBACK_TESTS;
    }
  }
);

export const fetchDiagnosticHistory = createAsyncThunk(
  'patientLabTests/fetchHistory',
  async (patientId, { getState }) => {
    const user = getState().auth.user;
    const targetId = patientId || user?.id || 'PAT001';
    const requestUser = { ...user, id: targetId, role: user?.role || 'patient' };

    const [requestsResult, bookedResult] = await Promise.allSettled([
      apiFetch('/lab-requests/patient', { user: requestUser }),
      apiFetch(`/labtests/history/${encodeURIComponent(targetId)}`, { user: requestUser }),
    ]);

    let list = [];
    if (requestsResult.status === 'fulfilled' && Array.isArray(requestsResult.value)) {
      list = requestsResult.value;
    }

    if (bookedResult.status === 'fulfilled' && Array.isArray(bookedResult.value)) {
      const existingBookingIds = new Set(list.map((r) => r.sourceBookingId).filter(Boolean));
      const extra = bookedResult.value
        .filter((b) => !existingBookingIds.has(b.id))
        .map((b) => ({
          id: b.id,
          testName: b.labTest?.name || 'Diagnostic Health Panel',
          requestDate: new Date().toISOString().split('T')[0],
          doctorName: 'Central Pathology Department',
          status: b.status === 'booked' ? 'pending' : (b.status || 'pending'),
        }));
      list = [...list, ...extra];
    }

    return list;
  }
);

export const confirmLabTestBooking = createAsyncThunk(
  'patientLabTests/confirmBooking',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const user = state.auth.user;
    const userId = user?.id || 'PAT001';
    const requestUser = { ...user, id: userId, role: user?.role || 'patient' };
    const { cartQuantities, tests, selectedBranchId } = state.patientLabTests;

    const cartEntries = Object.entries(cartQuantities).filter(([, qty]) => qty > 0);
    if (cartEntries.length === 0) {
      return rejectWithValue('Your lab cart is empty.');
    }

    const totalCartCount = cartEntries.reduce((acc, [, qty]) => acc + qty, 0);
    const branchId = selectedBranchId || '00000000-0000-4000-8000-000000000001';

    try {
      for (const [testId] of cartEntries) {
        const testObj =
          tests.find((t) => t.id === testId) || FALLBACK_TESTS.find((t) => t.id === testId);
        if (!testObj) continue;

        await apiFetch('/labtests/book', {
          user: requestUser,
          method: 'POST',
          body: {
            userId,
            labTestId: testObj.id,
            branchId,
          },
        });
      }

      const patientDisplayName =
        user?.name ||
        (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Patient');

      await apiFetch(`/labtests/confirm/${encodeURIComponent(userId)}`, {
        user: requestUser,
        method: 'POST',
        body: {
          patientName: patientDisplayName,
        },
      });

      await dispatch(fetchDiagnosticHistory(userId));

      return { totalCartCount };
    } catch {
      return rejectWithValue('Unable to complete test booking. Please check connection and retry.');
    }
  }
);

const patientLabTestsSlice = createSlice({
  name: 'patientLabTests',
  initialState,
  reducers: {
    setSelectedBranchId(state, action) {
      state.selectedBranchId = action.payload;
    },
    setSelectedCategory(state, action) {
      state.selectedCategory = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setSortBy(state, action) {
      state.sortBy = action.payload;
    },
    setFastingFilter(state, action) {
      state.fastingFilter = action.payload;
    },
    resetLabTestFilters(state) {
      state.searchQuery = '';
      state.sortBy = 'default';
      state.fastingFilter = 'all';
      state.selectedCategory = 'All Tests';
    },
    setTestQuantity(state, action) {
      const { testId, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.cartQuantities[testId];
      } else {
        state.cartQuantities[testId] = quantity;
      }
    },
    clearLabCart(state) {
      state.cartQuantities = {};
    },
    clearLabTestNotice(state) {
      state.feedbackNotice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabBranches.pending, (state) => {
        state.branchesStatus = 'loading';
      })
      .addCase(fetchLabBranches.fulfilled, (state, action) => {
        state.branchesStatus = 'succeeded';
        state.branches = action.payload;
        if (!state.selectedBranchId && action.payload.length > 0) {
          state.selectedBranchId = action.payload[0].id;
        }
      })
      .addCase(fetchLabBranches.rejected, (state) => {
        state.branchesStatus = 'failed';
      })
      .addCase(fetchLabTests.pending, (state) => {
        state.testsStatus = 'loading';
      })
      .addCase(fetchLabTests.fulfilled, (state, action) => {
        state.testsStatus = 'succeeded';
        state.tests = action.payload;
      })
      .addCase(fetchLabTests.rejected, (state) => {
        state.testsStatus = 'failed';
        state.tests = FALLBACK_TESTS;
      })
      .addCase(fetchDiagnosticHistory.pending, (state) => {
        state.historyStatus = 'loading';
      })
      .addCase(fetchDiagnosticHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded';
        state.historyOrders = action.payload;
      })
      .addCase(fetchDiagnosticHistory.rejected, (state) => {
        state.historyStatus = 'failed';
      })
      .addCase(confirmLabTestBooking.pending, (state) => {
        state.isSubmitting = true;
        state.feedbackNotice = null;
      })
      .addCase(confirmLabTestBooking.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.cartQuantities = {};
        state.feedbackNotice = {
          type: 'success',
          text: `Success! ${action.payload.totalCartCount} test(s) booked. You can review your tests under Diagnostic Records below.`,
        };
      })
      .addCase(confirmLabTestBooking.rejected, (state, action) => {
        state.isSubmitting = false;
        state.feedbackNotice = {
          type: 'error',
          text:
            action.payload ||
            'Unable to complete test booking. Please check connection and retry.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setSelectedBranchId,
  setSelectedCategory,
  setSearchQuery,
  setSortBy,
  setFastingFilter,
  resetLabTestFilters,
  setTestQuantity,
  clearLabCart,
  clearLabTestNotice,
} = patientLabTestsSlice.actions;

export const selectLabBranches = (state) => state.patientLabTests.branches;
export const selectLabTests = (state) => state.patientLabTests.tests;
export const selectLabHistoryOrders = (state) => state.patientLabTests.historyOrders;
export const selectSelectedLabBranchId = (state) => state.patientLabTests.selectedBranchId;
export const selectSelectedLabCategory = (state) => state.patientLabTests.selectedCategory;
export const selectLabSearchQuery = (state) => state.patientLabTests.searchQuery;
export const selectLabSortBy = (state) => state.patientLabTests.sortBy;
export const selectLabFastingFilter = (state) => state.patientLabTests.fastingFilter;
export const selectLabCartQuantities = (state) => state.patientLabTests.cartQuantities;
export const selectLabBranchesStatus = (state) => state.patientLabTests.branchesStatus;
export const selectLabTestsStatus = (state) => state.patientLabTests.testsStatus;
export const selectLabHistoryStatus = (state) => state.patientLabTests.historyStatus;
export const selectIsSubmittingLabBooking = (state) => state.patientLabTests.isSubmitting;
export const selectLabFeedbackNotice = (state) => state.patientLabTests.feedbackNotice;

export default patientLabTestsSlice.reducer;
