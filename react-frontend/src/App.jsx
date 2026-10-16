/**
 * App.jsx — Master Application Router & Route Protection
 * ====================================================================
 * Configures all application routes with role-based access control.
 *
 * WORKFLOW:
 *  1. Root route ('/') loads the Landing page by default.
 *  2. Public login ('/login') authenticates users against the backend.
 *  3. Authenticated users are routed to their respective role dashboards:
 *     - Doctor       → /doctor/dashboard
 *     - Patient      → /patient/dashboard
 *     - Front Desk   → /front-desk/dashboard
 *     - Lab Tech     → /lab-technician/dashboard
 *     - Branch Admin → /branch-admin/dashboard
 *     - Super Admin  → /superuser/dashboard
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';
import ConsultationNotes from './pages/doctor/ConsultationNotes';
import SlotManagement from './pages/doctor/SlotManagement';
import InternalReferral from './pages/doctor/InternalReferral';
import TreatmentPlan from './pages/doctor/TreatmentPlan';
import DoctorEarnings from './pages/doctor/DoctorEarnings';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/Profile';
import PatientAppointments from './pages/patient/appointments';
import PatientLabTest from './pages/Patient/labtest';
import PatientFeedback from './pages/patient/feedback';
import PatientMedicalRecords from './pages/patient/medicalrecords';
import FrontDeskDashboard from './pages/FrontDesk/FrontDeskDashboard';
import WalkInRegistration from './pages/FrontDesk/WalkInRegistration';
import AppointmentManagement from './pages/FrontDesk/AppointmentManagement';
import FollowUpReferral from './pages/FrontDesk/FollowUpReferral';
import QueueManagement from './pages/FrontDesk/QueueManagement';
import FrontDeskProfile from './pages/FrontDesk/FrontDeskProfile';
import LabTechDashboard from './pages/dashboards/LabTechDashboard';
import TestRequests from './pages/LabTechnician/TestRequests';
import LabReports from './pages/LabTechnician/LabReports';
import LeaveRequest from './pages/LabTechnician/LeaveRequest';
import LabTechProfile from './pages/LabTechnician/LabTechProfile';
import BranchAdminDashboard from './pages/BranchAdmin/BranchAdminDashboard';
import ManageDoctors from './pages/BranchAdmin/ManageDoctors';
import ManageFrontDesk from './pages/BranchAdmin/ManageFrontDesk';
import ManageLabTechnicians from './pages/BranchAdmin/ManageLabTechnicians';
import LeaveManagement from './pages/BranchAdmin/LeaveManagement';
import Earnings from './pages/BranchAdmin/Earnings';
import SuperAdminDashboard from './pages/SuperAdmin/dashboard';
import SuperAdminEarnings from './pages/SuperAdmin/earnings';
import BranchStatistics from './pages/SuperAdmin/branch-statistics';

// Subpage Placeholder Shell
import DemoPage from './pages/demo/DemoPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── 1. PUBLIC ROUTES ────────────────────────────────────────
              Landing page is the initial entry point on running the app.
          ──────────────────────────────────────────────────────────── */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── 2. DOCTOR ROUTES ────────────────────────────────────────
              Accessible exclusively by users with role: 'doctor'
          ──────────────────────────────────────────────────────────── */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/doctor/profile" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorProfile />
            </ProtectedRoute>
          } />
          <Route path="/doctor/consultation-notes" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <ConsultationNotes />
            </ProtectedRoute>
          } />
          <Route path="/doctor/internal-referral" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <InternalReferral />
            </ProtectedRoute>
          } />
          <Route path="/doctor/treatment-plan" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <TreatmentPlan />
            </ProtectedRoute>
          } />
          <Route path="/doctor/slot-management" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <SlotManagement />
            </ProtectedRoute>
          } />
          <Route path="/doctor/earnings" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorEarnings />
            </ProtectedRoute>
          } />

          {/* ── 3. PATIENT ROUTES ───────────────────────────────────────
              Accessible exclusively by users with role: 'patient'
          ──────────────────────────────────────────────────────────── */}
          <Route path="/patient/dashboard" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/patient/profile" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientProfile />
            </ProtectedRoute>
          } />
          <Route path="/patient/appointments" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAppointments />
            </ProtectedRoute>
          } />
          <Route path="/patient/labtests" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientLabTest />
            </ProtectedRoute>
          } />
          <Route path="/patient/records" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientMedicalRecords />
            </ProtectedRoute>
          } />
          <Route path="/patient/billing" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Billing" />
            </ProtectedRoute>
          } />
          <Route path="/patient/feedback" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientFeedback />
            </ProtectedRoute>
          } />

          {/* ── 4. FRONT DESK ROUTES ────────────────────────────────────
              Accessible exclusively by users with role: 'frontdesk'
          ──────────────────────────────────────────────────────────── */}
          <Route path="/front-desk/dashboard" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <FrontDeskDashboard />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/walkin" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <WalkInRegistration />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/appointments" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <AppointmentManagement />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/followup" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <FollowUpReferral />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/queue" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <QueueManagement />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/profile" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <FrontDeskProfile />
            </ProtectedRoute>
          } />

          {/* ── 5. LAB TECHNICIAN ROUTES ────────────────────────────────
              Accessible exclusively by users with role: 'labtech'
          ──────────────────────────────────────────────────────────── */}
          <Route path="/lab-technician/dashboard" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <LabTechDashboard />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/test-requests" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <TestRequests />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/lab-reports" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <LabReports />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/leave" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <LeaveRequest />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/leave-request" element={
            <Navigate to="/lab-technician/leave" replace />
          } />
          <Route path="/lab-technician/profile" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <LabTechProfile />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/my-account" element={
            <Navigate to="/lab-technician/profile" replace />
          } />

          {/* ── 6. BRANCH ADMIN ROUTES ──────────────────────────────────
              Accessible by users with role: 'branch_admin' or alias 'admin'
          ──────────────────────────────────────────────────────────── */}
          <Route path="/branch-admin/dashboard" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <BranchAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/doctors" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <ManageDoctors />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/frontdesk" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <ManageFrontDesk />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/lab-technicians" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <ManageLabTechnicians />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/leave-management" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <LeaveManagement />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/earnings" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <Earnings />
            </ProtectedRoute>
          } />

          {/* ── 7. SUPER ADMIN ROUTES ───────────────────────────────────
              Accessible exclusively by users with role: 'super_admin'
          ──────────────────────────────────────────────────────────── */}
          <Route path="/superuser/dashboard" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/superuser/earnings" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminEarnings />
            </ProtectedRoute>
          } />
          <Route path="/superuser/branch-statistics" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <BranchStatistics />
            </ProtectedRoute>
          } />

          {/* ── 8. CATCH-ALL ROUTE ──────────────────────────────────────
              Redirect any unknown path to the home Landing page
          ──────────────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
