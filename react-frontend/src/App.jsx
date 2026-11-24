/**
 * App.jsx — Master Application Router & Route Protection
 * ====================================================================
 * Configures all application routes with role-based access control.
 *
 * ROUTE STRUCTURE (after AppShell remount fix):
 * ─────────────────────────────────────────────
 * Public routes (/, /login, /unauthorized) render without any shell.
 *
 * All authenticated routes are wrapped in <LayoutShell>, which renders
 * <AppShell> exactly ONCE and keeps it mounted during navigation.
 * Individual page components no longer need to import or render <AppShell>.
 * Page titles are passed via each route's `handle: { pageTitle }` metadata
 * and read by LayoutShell using useMatches().
 *
 * FOLDER CASING FIX:
 * ─────────────────
 * All Patient page imports now use the correct 'Patient' (capital P) path
 * matching the actual directory name on disk.
 * All Doctor page imports use 'doctor' (lowercase d) matching their directory.
 *
 * ROLE DASHBOARD ROUTES:
 *   - Doctor       → /doctor/dashboard
 *   - Patient      → /patient/dashboard
 *   - Front Desk   → /front-desk/dashboard
 *   - Lab Tech     → /lab-technician/dashboard
 *   - Branch Admin → /branch-admin/dashboard
 *   - Super Admin  → /superuser/dashboard
 */

import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
} from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

// ── Layout Shell (wraps all authenticated routes; renders AppShell once) ─────
import LayoutShell from './pages/LayoutShell';

// ── Public Pages (no shell) ──────────────────────────────────────────────────
import Landing      from './pages/Landing';
import Login        from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// ── Doctor Pages ─────────────────────────────────────────────────────────────
import DoctorDashboard    from './pages/dashboards/DoctorDashboard';
import DoctorProfile      from './pages/doctor/DoctorProfile';
import ConsultationNotes  from './pages/doctor/ConsultationNotes';
import SlotManagement     from './pages/doctor/SlotManagement';
import InternalReferral   from './pages/doctor/InternalReferral';
import TreatmentPlan      from './pages/doctor/TreatmentPlan';
import DoctorEarnings     from './pages/doctor/DoctorEarnings';

// ── Patient Pages ─────────────────────────────────────────────────────────────
// NOTE: All imports use 'Patient' (capital P) — the actual directory name on disk.
// Previously some used lowercase 'patient' which would break on Linux/CI.
import PatientDashboard      from './pages/Patient/PatientDashboard';
import PatientProfile        from './pages/Patient/Profile';
import PatientAppointments   from './pages/Patient/appointments';
import PatientLabTest        from './pages/Patient/labtest';
import PatientFeedback       from './pages/Patient/feedback';
import PatientMedicalRecords from './pages/Patient/medicalrecords';

// ── Front Desk Pages ──────────────────────────────────────────────────────────
import FrontDeskDashboard    from './pages/FrontDesk/FrontDeskDashboard';
import WalkInRegistration    from './pages/FrontDesk/WalkInRegistration';
import AppointmentManagement from './pages/FrontDesk/AppointmentManagement';
import FollowUpReferral      from './pages/FrontDesk/FollowUpReferral';
import QueueManagement       from './pages/FrontDesk/QueueManagement';
import FrontDeskProfile      from './pages/FrontDesk/FrontDeskProfile';

// ── Lab Technician Pages ──────────────────────────────────────────────────────
import LabTechDashboard from './pages/dashboards/LabTechDashboard';
import TestRequests     from './pages/LabTechnician/TestRequests';
import LabReports       from './pages/LabTechnician/LabReports';
import LeaveRequest     from './pages/LabTechnician/LeaveRequest';
import LabTechProfile   from './pages/LabTechnician/LabTechProfile';

// ── Branch Admin Pages ────────────────────────────────────────────────────────
import BranchAdminDashboard  from './pages/BranchAdmin/BranchAdminDashboard';
import ManageDoctors         from './pages/BranchAdmin/ManageDoctors';
import ManageFrontDesk       from './pages/BranchAdmin/ManageFrontDesk';
import ManageLabTechnicians  from './pages/BranchAdmin/ManageLabTechnicians';
import LeaveManagement       from './pages/BranchAdmin/LeaveManagement';
import Earnings              from './pages/BranchAdmin/Earnings';

// ── Super Admin Pages ─────────────────────────────────────────────────────────
import SuperAdminDashboard from './pages/SuperAdmin/dashboard';
import SuperAdminEarnings  from './pages/SuperAdmin/earnings';
import BranchStatistics    from './pages/SuperAdmin/branch-statistics';

// ── Placeholder Shell ─────────────────────────────────────────────────────────
import DemoPage from './pages/demo/DemoPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* ── 1. PUBLIC ROUTES ─────────────────────────────────────────
          These routes render without AppShell (no sidebar / topbar).
      ─────────────────────────────────────────────────────────── */}
      <Route path="/"             element={<Landing />} />
      <Route path="/login"        element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ── 2. AUTHENTICATED ROUTES ──────────────────────────────────
          All routes below share a single <LayoutShell> parent.
          <LayoutShell> renders <AppShell> ONCE and keeps it mounted
          across navigation — sidebar state, notifications, and
          collapse/expand state all persist between page changes.

          Each route uses `handle: { pageTitle }` so LayoutShell can
          display the correct title in the Topbar without each page
          needing to own <AppShell>.
      ─────────────────────────────────────────────────────────── */}
      <Route element={<LayoutShell />}>

            {/* ── DOCTOR ─────────────────────────────────────────────── */}
            <Route path="/doctor/dashboard" handle={{ pageTitle: 'Dashboard' }}
              element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>}
            />
            <Route path="/doctor/profile" handle={{ pageTitle: 'My Profile' }}
              element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfile /></ProtectedRoute>}
            />
            <Route path="/doctor/consultation-notes" handle={{ pageTitle: 'Consultation Notes' }}
              element={<ProtectedRoute allowedRoles={['doctor']}><ConsultationNotes /></ProtectedRoute>}
            />
            <Route path="/doctor/internal-referral" handle={{ pageTitle: 'Internal Referral' }}
              element={<ProtectedRoute allowedRoles={['doctor']}><InternalReferral /></ProtectedRoute>}
            />
            <Route path="/doctor/treatment-plan" handle={{ pageTitle: 'Treatment Plan' }}
              element={<ProtectedRoute allowedRoles={['doctor']}><TreatmentPlan /></ProtectedRoute>}
            />
            <Route path="/doctor/slot-management" handle={{ pageTitle: 'Slot Management' }}
              element={<ProtectedRoute allowedRoles={['doctor']}><SlotManagement /></ProtectedRoute>}
            />
            <Route path="/doctor/earnings" handle={{ pageTitle: 'Earnings' }}
              element={<ProtectedRoute allowedRoles={['doctor']}><DoctorEarnings /></ProtectedRoute>}
            />

            {/* ── PATIENT ────────────────────────────────────────────── */}
            <Route path="/patient/dashboard" handle={{ pageTitle: 'Patient Dashboard' }}
              element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>}
            />
            <Route path="/patient/profile" handle={{ pageTitle: 'My Profile' }}
              element={<ProtectedRoute allowedRoles={['patient']}><PatientProfile /></ProtectedRoute>}
            />
            <Route path="/patient/appointments" handle={{ pageTitle: 'Appointments' }}
              element={<ProtectedRoute allowedRoles={['patient']}><PatientAppointments /></ProtectedRoute>}
            />
            <Route path="/patient/labtests" handle={{ pageTitle: 'Lab Tests' }}
              element={<ProtectedRoute allowedRoles={['patient']}><PatientLabTest /></ProtectedRoute>}
            />
            <Route path="/patient/records" handle={{ pageTitle: 'Medical Records' }}
              element={<ProtectedRoute allowedRoles={['patient']}><PatientMedicalRecords /></ProtectedRoute>}
            />
            <Route path="/patient/billing" handle={{ pageTitle: 'Billing' }}
              element={<ProtectedRoute allowedRoles={['patient']}><DemoPage pageTitle="Billing" /></ProtectedRoute>}
            />
            <Route path="/patient/feedback" handle={{ pageTitle: 'Doctor Feedback' }}
              element={<ProtectedRoute allowedRoles={['patient']}><PatientFeedback /></ProtectedRoute>}
            />

            {/* ── FRONT DESK ─────────────────────────────────────────── */}
            <Route path="/front-desk/dashboard" handle={{ pageTitle: 'Front Desk Dashboard' }}
              element={<ProtectedRoute allowedRoles={['frontdesk']}><FrontDeskDashboard /></ProtectedRoute>}
            />
            <Route path="/front-desk/walkin" handle={{ pageTitle: 'Walk-in Registration' }}
              element={<ProtectedRoute allowedRoles={['frontdesk']}><WalkInRegistration /></ProtectedRoute>}
            />
            <Route path="/front-desk/appointments" handle={{ pageTitle: 'Appointment Management' }}
              element={<ProtectedRoute allowedRoles={['frontdesk']}><AppointmentManagement /></ProtectedRoute>}
            />
            <Route path="/front-desk/followup" handle={{ pageTitle: 'Follow-Up & Referral Coordination' }}
              element={<ProtectedRoute allowedRoles={['frontdesk']}><FollowUpReferral /></ProtectedRoute>}
            />
            <Route path="/front-desk/queue" handle={{ pageTitle: 'Queue Management' }}
              element={<ProtectedRoute allowedRoles={['frontdesk']}><QueueManagement /></ProtectedRoute>}
            />
            <Route path="/front-desk/profile" handle={{ pageTitle: 'My Profile' }}
              element={<ProtectedRoute allowedRoles={['frontdesk']}><FrontDeskProfile /></ProtectedRoute>}
            />

            {/* ── LAB TECHNICIAN ─────────────────────────────────────── */}
            <Route path="/lab-technician/dashboard" handle={{ pageTitle: 'Lab Technician Dashboard' }}
              element={<ProtectedRoute allowedRoles={['labtech']}><LabTechDashboard /></ProtectedRoute>}
            />
            <Route path="/lab-technician/test-requests" handle={{ pageTitle: 'Test Requests' }}
              element={<ProtectedRoute allowedRoles={['labtech']}><TestRequests /></ProtectedRoute>}
            />
            <Route path="/lab-technician/lab-reports" handle={{ pageTitle: 'Lab Reports' }}
              element={<ProtectedRoute allowedRoles={['labtech']}><LabReports /></ProtectedRoute>}
            />
            <Route path="/lab-technician/leave" handle={{ pageTitle: 'Leave Request' }}
              element={<ProtectedRoute allowedRoles={['labtech']}><LeaveRequest /></ProtectedRoute>}
            />
            <Route path="/lab-technician/profile" handle={{ pageTitle: 'My Account' }}
              element={<ProtectedRoute allowedRoles={['labtech']}><LabTechProfile /></ProtectedRoute>}
            />

            {/* ── BRANCH ADMIN ───────────────────────────────────────── */}
            <Route path="/branch-admin/dashboard" handle={{ pageTitle: 'Branch Admin Dashboard' }}
              element={<ProtectedRoute allowedRoles={['branch_admin', 'admin']}><BranchAdminDashboard /></ProtectedRoute>}
            />
            <Route path="/branch-admin/doctors" handle={{ pageTitle: 'Manage Doctors' }}
              element={<ProtectedRoute allowedRoles={['branch_admin', 'admin']}><ManageDoctors /></ProtectedRoute>}
            />
            <Route path="/branch-admin/frontdesk" handle={{ pageTitle: 'Manage Front Desk' }}
              element={<ProtectedRoute allowedRoles={['branch_admin', 'admin']}><ManageFrontDesk /></ProtectedRoute>}
            />
            <Route path="/branch-admin/lab-technicians" handle={{ pageTitle: 'Manage Lab Technicians' }}
              element={<ProtectedRoute allowedRoles={['branch_admin', 'admin']}><ManageLabTechnicians /></ProtectedRoute>}
            />
            <Route path="/branch-admin/leave-management" handle={{ pageTitle: 'Leave Management' }}
              element={<ProtectedRoute allowedRoles={['branch_admin', 'admin']}><LeaveManagement /></ProtectedRoute>}
            />
            <Route path="/branch-admin/earnings" handle={{ pageTitle: 'Branch Earnings' }}
              element={<ProtectedRoute allowedRoles={['branch_admin', 'admin']}><Earnings /></ProtectedRoute>}
            />

            {/* ── SUPER ADMIN ────────────────────────────────────────── */}
            <Route path="/superuser/dashboard" handle={{ pageTitle: 'Super Admin Dashboard' }}
              element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>}
            />
            <Route path="/superuser/earnings" handle={{ pageTitle: 'Earnings' }}
              element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminEarnings /></ProtectedRoute>}
            />
            <Route path="/superuser/branch-statistics" handle={{ pageTitle: 'Branch Statistics' }}
              element={<ProtectedRoute allowedRoles={['super_admin']}><BranchStatistics /></ProtectedRoute>}
            />

          </Route> {/* end <LayoutShell> */}

          {/* ── REDIRECT ALIASES ──────────────────────────────────────── */}
          {/* These redirects sit outside LayoutShell so they resolve cleanly */}
          <Route path="/lab-technician/leave-request"
            element={<Navigate to="/lab-technician/leave" replace />}
          />
          <Route path="/lab-technician/my-account"
            element={<Navigate to="/lab-technician/profile" replace />}
          />

          {/* ── CATCH-ALL ─────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
    </>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
