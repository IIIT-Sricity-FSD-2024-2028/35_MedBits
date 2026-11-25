/**
 * store/index.js — Root Redux Store Configuration
 * ============================================================
 * Centralizes all Redux slices using Redux Toolkit's configureStore.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import patientProfileReducer from './slices/patient/patientProfileSlice';
import patientAppointmentsReducer from './slices/patient/patientAppointmentsSlice';
import patientFeedbackReducer from './slices/patient/patientFeedbackSlice';
import doctorProfileReducer from './slices/doctor/doctorProfileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patientProfile: patientProfileReducer,
    patientAppointments: patientAppointmentsReducer,
    patientFeedback: patientFeedbackReducer,
    doctorProfile: doctorProfileReducer,
  },
});

export default store;
