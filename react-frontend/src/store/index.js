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
import doctorDashboardReducer from './slices/doctor/doctorDashboardSlice';
import doctorEarningsReducer from './slices/doctor/doctorEarningsSlice';
import consultationNotesReducer from './slices/doctor/consultationNotesSlice';
import treatmentPlanReducer from './slices/doctor/treatmentPlanSlice';
import slotManagementReducer from './slices/doctor/slotManagementSlice';
import internalReferralReducer from './slices/doctor/internalReferralSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patientProfile: patientProfileReducer,
    patientAppointments: patientAppointmentsReducer,
    patientFeedback: patientFeedbackReducer,
    doctorProfile: doctorProfileReducer,
    doctorDashboard: doctorDashboardReducer,
    doctorEarnings: doctorEarningsReducer,
    consultationNotes: consultationNotesReducer,
    treatmentPlan: treatmentPlanReducer,
    slotManagement: slotManagementReducer,
    internalReferral: internalReferralReducer,
  },
});

export default store;
