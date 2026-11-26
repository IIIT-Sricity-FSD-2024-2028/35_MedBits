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
import patientLabTestsReducer from './slices/patient/patientLabTestsSlice';
import doctorProfileReducer from './slices/doctor/doctorProfileSlice';
import doctorDashboardReducer from './slices/doctor/doctorDashboardSlice';
import doctorEarningsReducer from './slices/doctor/doctorEarningsSlice';
import consultationNotesReducer from './slices/doctor/consultationNotesSlice';
import treatmentPlanReducer from './slices/doctor/treatmentPlanSlice';
import slotManagementReducer from './slices/doctor/slotManagementSlice';
import internalReferralReducer from './slices/doctor/internalReferralSlice';
import branchStatisticsReducer from './slices/superAdmin/branchStatisticsSlice';
import superAdminDashboardReducer from './slices/superAdmin/superAdminDashboardSlice';
import frontdeskProfileReducer from './slices/frontdesk/frontdeskProfileSlice';
import frontdeskDashboardReducer from './slices/frontdesk/frontdeskDashboardSlice';
import walkInReducer from './slices/frontdesk/walkInSlice';
import frontdeskAppointmentsReducer from './slices/frontdesk/frontdeskAppointmentsSlice';
import queueManagementReducer from './slices/frontdesk/queueManagementSlice';
import followUpReferralReducer from './slices/frontdesk/followUpReferralSlice';
import branchAdminDashboardReducer from './slices/branchAdmin/branchAdminDashboardSlice';
import branchLeaveManagementReducer from './slices/branchAdmin/branchLeaveManagementSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    patientProfile: patientProfileReducer,
    patientAppointments: patientAppointmentsReducer,
    patientFeedback: patientFeedbackReducer,
    patientLabTests: patientLabTestsReducer,
    doctorProfile: doctorProfileReducer,
    doctorDashboard: doctorDashboardReducer,
    doctorEarnings: doctorEarningsReducer,
    consultationNotes: consultationNotesReducer,
    treatmentPlan: treatmentPlanReducer,
    slotManagement: slotManagementReducer,
    internalReferral: internalReferralReducer,
    branchStatistics: branchStatisticsReducer,
    superAdminDashboard: superAdminDashboardReducer,
    frontdeskProfile: frontdeskProfileReducer,
    frontdeskDashboard: frontdeskDashboardReducer,
    walkIn: walkInReducer,
    frontdeskAppointments: frontdeskAppointmentsReducer,
    queueManagement: queueManagementReducer,
    followUpReferral: followUpReferralReducer,
    branchAdminDashboard: branchAdminDashboardReducer,
    branchLeaveManagement: branchLeaveManagementReducer,
  },
});

export default store;
