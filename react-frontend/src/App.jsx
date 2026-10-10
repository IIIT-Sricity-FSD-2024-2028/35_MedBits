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

// Respective Role Dashboards
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/Profile';
import PatientFeedback from './pages/patient/feedback';
import FrontDeskDashboard from './pages/dashboards/FrontDeskDashboard';
import LabTechDashboard from './pages/dashboards/LabTechDashboard';
import BranchAdminDashboard from './pages/dashboards/BranchAdminDashboard';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';

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
              <DemoPage pageTitle="Profile" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/consultation-notes" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Consultation Notes" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/internal-referral" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Internal Referral" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/treatment-plan" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Treatment Plan" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/slot-management" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Slot Management" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/earnings" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Earnings" />
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
              <DemoPage pageTitle="Appointments" />
            </ProtectedRoute>
          } />
          <Route path="/patient/labtests" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Lab Tests" />
            </ProtectedRoute>
          } />
          <Route path="/patient/records" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Medical Records" />
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
              <DemoPage pageTitle="Walk-in Registrations" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/appointments" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Appointment Management" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/followup" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Follow-Up & Referral" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/queue" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Queue Management" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/profile" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Profile" />
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
              <DemoPage pageTitle="Test Requests" />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/lab-reports" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="Lab Reports" />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/leave" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="Leave" />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/my-account" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="My Account" />
            </ProtectedRoute>
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
              <DemoPage pageTitle="Manage Doctors" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/frontdesk" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Manage Front Desk" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/lab-technicians" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Lab Technicians" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/leave-management" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Leave Management" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/earnings" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Earnings" />
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
              <DemoPage pageTitle="Earnings" />
            </ProtectedRoute>
          } />
          <Route path="/superuser/branch-statistics" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DemoPage pageTitle="Branch Statistics" />
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
