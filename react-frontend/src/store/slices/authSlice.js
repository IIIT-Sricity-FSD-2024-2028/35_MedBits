/**
 * authSlice.js — Global Authentication State (Redux Toolkit)
 * ============================================================
 * Replaces src/context/AuthContext.jsx.
 *
 * Manages:
 *   - `user`      — authenticated user object (hydrated from localStorage)
 *   - `status`    — 'idle' | 'loading' | 'succeeded' | 'failed'
 *   - `error`     — string | null (last login error message)
 *   - `isOffline` — boolean (true when backend login failed due to network error)
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../api/apiClient';

const USER_STORAGE_KEY = 'user';

export const ROLE_ROUTES = {
  super_admin:  '/superuser/dashboard',
  branch_admin: '/branch-admin/dashboard',
  admin:        '/branch-admin/dashboard',
  patient:      '/patient/dashboard',
  doctor:       '/doctor/dashboard',
  frontdesk:    '/front-desk/dashboard',
  labtech:      '/lab-technician/dashboard',
};

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredUser(userData) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  } catch {
    // Ignore storage quota errors
  }
}

function clearStoredUser() {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return rejectWithValue({
        message:
          'Unable to reach backend server on port 3000. Ensure the NestJS backend is running, or continue in Demo Mode below.',
        isOffline: true,
      });
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 400) {
        return rejectWithValue({
          message: 'Invalid email or password. Please verify your credentials.',
          isOffline: false,
        });
      }
      return rejectWithValue({
        message: `Login failed (Server error: HTTP ${response.status}).`,
        isOffline: false,
      });
    }

    const authenticatedUser = await response.json();
    saveStoredUser(authenticatedUser);
    return authenticatedUser;
  }
);

const initialState = {
  user: loadStoredUser(),
  status: 'idle',
  error: null,
  isOffline: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      const userData = action.payload;
      saveStoredUser(userData);
      state.user = userData;
      state.status = 'succeeded';
      state.error = null;
      state.isOffline = false;
    },
    updateUserProfile(state, action) {
      if (!state.user) return;
      const updatedUser = { ...state.user, ...action.payload };
      saveStoredUser(updatedUser);
      state.user = updatedUser;
    },
    logout(state) {
      clearStoredUser();
      state.user = null;
      state.status = 'idle';
      state.error = null;
      state.isOffline = false;
    },
    clearAuthError(state) {
      state.error = null;
      state.isOffline = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.isOffline = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.error = null;
        state.isOffline = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Login failed. Please try again.';
        state.isOffline = Boolean(action.payload?.isOffline);
      });
  },
});

export const { setUser, updateUserProfile, logout, clearAuthError } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user);
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthIsOffline = (state) => state.auth.isOffline;

export default authSlice.reducer;
