/**
 * store/index.js — Root Redux Store Configuration
 * ============================================================
 * Centralizes all Redux slices using Redux Toolkit's configureStore.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import patientProfileReducer from './slices/patient/patientProfileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patientProfile: patientProfileReducer,
  },
});

export default store;
