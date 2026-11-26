/**
 * walkInSlice.js — Frontdesk Walk-in Registration State (Redux Toolkit)
 * =======================================================================
 * Location: src/store/slices/frontdesk/walkInSlice.js
 *
 * Manages state for the Frontdesk Walk-in Registration page:
 *   - `walkins`      — recent walk-in registrations from GET /walkins
 *   - `formData`     — controlled form inputs for new patient registration
 *   - `formErrors`   — client-side validation error map
 *   - `listStatus`   — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `listError`    — string | null
 *   - `submitStatus` — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `submitError`  — string | null
 *   - `successInfo`  — confirmation receipt details after POST /walkins
 *
 * APIs:
 *   - GET  /walkins
 *   - POST /walkins
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { extractErrorMessage, getFrontdeskRequestUser } from './frontdeskHelpers';

export const INITIAL_WALKIN_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  guardianName: '',
};

const initialState = {
  walkins: [],
  formData: { ...INITIAL_WALKIN_FORM },
  formErrors: {},
  listStatus: 'idle',
  listError: null,
  submitStatus: 'idle',
  submitError: null,
  successInfo: null,
};

/**
 * Converts YYYY-MM-DD from <input type="date"> to DD-MM-YYYY
 * as expected by backend WalkInsService.toIsoDate().
 */
function formatDobForBackend(dobInput) {
  const trimmed = (dobInput || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}-${month}-${year}`;
  }
  return trimmed;
}

export const fetchWalkIns = createAsyncThunk(
  'walkIn/fetchWalkIns',
  async (_, { getState, rejectWithValue }) => {
    const requestUser = getFrontdeskRequestUser(getState());
    try {
      const data = await apiFetch('/walkins', { user: requestUser });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Unable to connect to backend server on port 3000.')
      );
    }
  }
);

export const registerWalkIn = createAsyncThunk(
  'walkIn/registerWalkIn',
  async (formInput, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const requestUser = getFrontdeskRequestUser(state);
    const source = formInput || state.walkIn.formData;

    const payload = {
      firstName: source.firstName.trim(),
      lastName: source.lastName.trim(),
      email: source.email.trim(),
      phone: source.phone.trim().replace(/\D/g, ''),
      dob: formatDobForBackend(source.dob),
      gender: source.gender,
      bloodGroup: source.bloodGroup,
      guardianName: source.guardianName?.trim() || undefined,
    };

    try {
      const result = await apiFetch('/walkins', {
        user: requestUser,
        method: 'POST',
        body: payload,
      });

      await dispatch(fetchWalkIns());

      return {
        name: result?.name || `${payload.firstName} ${payload.lastName}`,
        registrationId: result?.registrationId || result?.id || 'Registered',
        patientId: result?.userId || result?.patientId || result?.id || '—',
        phone: payload.phone,
        bloodGroup: payload.bloodGroup,
        gender: payload.gender,
      };
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(
          err,
          'Failed to complete walk-in registration. Please check the backend connection.'
        )
      );
    }
  }
);

const walkInSlice = createSlice({
  name: 'walkIn',
  initialState,
  reducers: {
    updateWalkInField(state, action) {
      const { name, value } = action.payload;
      state.formData[name] = value;
      if (state.formErrors[name]) {
        delete state.formErrors[name];
      }
    },
    setWalkInFormErrors(state, action) {
      state.formErrors = action.payload || {};
    },
    resetWalkInForm(state) {
      state.formData = { ...INITIAL_WALKIN_FORM };
      state.formErrors = {};
      state.submitError = null;
    },
    clearWalkInSuccess(state) {
      state.successInfo = null;
    },
    clearWalkInSubmitError(state) {
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalkIns.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchWalkIns.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.walkins = action.payload;
        state.listError = null;
      })
      .addCase(fetchWalkIns.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload || 'Unable to load walk-in registrations.';
      })
      .addCase(registerWalkIn.pending, (state) => {
        state.submitStatus = 'loading';
        state.submitError = null;
        state.successInfo = null;
      })
      .addCase(registerWalkIn.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.successInfo = action.payload;
        state.formData = { ...INITIAL_WALKIN_FORM };
        state.formErrors = {};
        state.submitError = null;
      })
      .addCase(registerWalkIn.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError =
          action.payload || 'Failed to complete walk-in registration.';
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  updateWalkInField,
  setWalkInFormErrors,
  resetWalkInForm,
  clearWalkInSuccess,
  clearWalkInSubmitError,
} = walkInSlice.actions;

export const selectWalkInState = (state) => state.walkIn;
export const selectWalkInsList = (state) => state.walkIn.walkins;
export const selectWalkInFormData = (state) => state.walkIn.formData;
export const selectWalkInFormErrors = (state) => state.walkIn.formErrors;
export const selectWalkInListStatus = (state) => state.walkIn.listStatus;
export const selectWalkInListError = (state) => state.walkIn.listError;
export const selectWalkInSubmitStatus = (state) => state.walkIn.submitStatus;
export const selectWalkInSubmitError = (state) => state.walkIn.submitError;
export const selectWalkInSuccessInfo = (state) => state.walkIn.successInfo;

export default walkInSlice.reducer;
