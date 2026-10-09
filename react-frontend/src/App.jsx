/**
 * App.jsx — Root Application Component with Routing
 * ===================================================
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }   from './context/AuthContext';
import ProtectedRoute     from './components/auth/ProtectedRoute';
import DemoPage           from './pages/demo/DemoPage';

/* ─── Placeholder Login page ─── */
function LoginPage() {
  return (
    <div style={{ display:'grid', placeItems:'center', minHeight:'100vh',
                  fontFamily:'DM Sans, sans-serif', background:'#f8fafc' }}>
      <div style={{ background:'#fff', padding:'40px', borderRadius:'12px',
                    boxShadow:'0 4px 24px rgba(0,0,0,.08)', textAlign:'center' }}>
        <h1 style={{ fontFamily:'Sora, sans-serif', marginBottom:'8px' }}>MEDBITS</h1>
        <p style={{ color:'#64748b', marginBottom:'24px' }}>Login page — to be implemented</p>
        
        {/* Demo Login Buttons for all 6 actors */}
        <button
          style={{ background:'#0284c7', color:'#fff', padding:'10px 24px',
                   borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', margin: '5px' }}
          onClick={() => {
            localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Dr. Sarah Johnson', role: 'doctor' }));
            window.location.href = '/doctor/dashboard';
          }}
        >
          Login as Doctor
        </button>
        <button
          style={{ background:'#0f172a', color:'#fff', padding:'10px 24px',
                   borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', margin: '5px' }}
          onClick={() => {
            localStorage.setItem('user', JSON.stringify({ id: 2, name: 'Arun Kumar', role: 'labtech' }));
            window.location.href = '/lab-technician/dashboard';
          }}
        >
          Login as Lab Tech
        </button>
        <button
          style={{ background:'#10b981', color:'#fff', padding:'10px 24px',
                   borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', margin: '5px' }}
          onClick={() => {
            localStorage.setItem('user', JSON.stringify({ id: 3, name: 'Neha Sharma', role: 'patient' }));
            window.location.href = '/patient/dashboard';
          }}
        >
          Login as Patient
        </button>
        <button
          style={{ background:'#f59e0b', color:'#fff', padding:'10px 24px',
                   borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', margin: '5px' }}
          onClick={() => {
            localStorage.setItem('user', JSON.stringify({ id: 4, name: 'Priya Desk', role: 'frontdesk' }));
            window.location.href = '/front-desk/dashboard';
          }}
        >
          Login as Front Desk
        </button>
        <button
          style={{ background:'#8b5cf6', color:'#fff', padding:'10px 24px',
                   borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', margin: '5px' }}
          onClick={() => {
            localStorage.setItem('user', JSON.stringify({ id: 5, name: 'Mr. Admin', role: 'branch_admin' }));
            window.location.href = '/branch-admin/dashboard';
          }}
        >
          Login as Branch Admin
        </button>
        <button
          style={{ background:'#ef4444', color:'#fff', padding:'10px 24px',
                   borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'14px', margin: '5px' }}
          onClick={() => {
            localStorage.setItem('user', JSON.stringify({ id: 6, name: 'Super Boss', role: 'super_admin' }));
            window.location.href = '/superuser/dashboard';
          }}
        >
          Login as Super Admin
        </button>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div style={{ display:'grid', placeItems:'center', minHeight:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <h1>403 — Unauthorized</h1>
        <p>You don't have permission to access this page.</p>
        <a href="/login" style={{ color:'#0284c7' }}>Go to Login</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── PUBLIC ROUTES ──────────────────────────────── */}
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/"             element={<Navigate to="/login" replace />} />

          {/* ── SUPERUSER ROUTES ───────────────────────────── */}
          <Route path="/superuser/dashboard"         element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DemoPage pageTitle="Dashboard" />
            </ProtectedRoute>
          } />
          <Route path="/superuser/earnings"          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DemoPage pageTitle="Earnings" />
            </ProtectedRoute>
          } />
          <Route path="/superuser/branch-statistics" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <DemoPage pageTitle="Branch Statistics" />
            </ProtectedRoute>
          } />

          {/* ── BRANCH ADMIN ROUTES ────────────────────────── */}
          <Route path="/branch-admin/dashboard"        element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Dashboard" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/doctors"          element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Manage Doctors" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/frontdesk"        element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Manage Front Desk" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/lab-technicians"  element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Lab Technicians" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/leave-management" element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Leave Management" />
            </ProtectedRoute>
          } />
          <Route path="/branch-admin/earnings"         element={
            <ProtectedRoute allowedRoles={['branch_admin', 'admin']}>
              <DemoPage pageTitle="Earnings" />
            </ProtectedRoute>
          } />

          {/* ── DOCTOR ROUTES ──────────────────────────────── */}
          <Route path="/doctor/dashboard"          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Dashboard" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/profile"            element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Profile" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/consultation-notes" element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Consultation Notes" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/internal-referral"  element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Internal Referral" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/treatment-plan"     element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Treatment Plan" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/slot-management"    element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Slot Management" />
            </ProtectedRoute>
          } />
          <Route path="/doctor/earnings"           element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DemoPage pageTitle="Earnings" />
            </ProtectedRoute>
          } />

          {/* ── FRONT DESK ROUTES ──────────────────────────── */}
          <Route path="/front-desk/dashboard"    element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Dashboard" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/walkin"       element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Walk-in Registrations" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/appointments" element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Appointment Management" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/followup"     element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Follow-Up & Referral" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/queue"        element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Queue Management" />
            </ProtectedRoute>
          } />
          <Route path="/front-desk/profile"      element={
            <ProtectedRoute allowedRoles={['frontdesk']}>
              <DemoPage pageTitle="Profile" />
            </ProtectedRoute>
          } />

          {/* ── LAB TECHNICIAN ROUTES ──────────────────────── */}
          <Route path="/lab-technician/dashboard"     element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="Dashboard" />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/test-requests" element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="Test Requests" />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/lab-reports"   element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="Lab Reports" />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/leave"         element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="Leave" />
            </ProtectedRoute>
          } />
          <Route path="/lab-technician/my-account"    element={
            <ProtectedRoute allowedRoles={['labtech']}>
              <DemoPage pageTitle="My Account" />
            </ProtectedRoute>
          } />

          {/* ── PATIENT ROUTES ─────────────────────────────── */}
          <Route path="/patient/dashboard"    element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Dashboard" />
            </ProtectedRoute>
          } />
          <Route path="/patient/profile"      element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Profile" />
            </ProtectedRoute>
          } />
          <Route path="/patient/appointments" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Appointments" />
            </ProtectedRoute>
          } />
          <Route path="/patient/labtests"     element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Lab Tests" />
            </ProtectedRoute>
          } />
          <Route path="/patient/records"      element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Medical Records" />
            </ProtectedRoute>
          } />
          <Route path="/patient/billing"      element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Billing" />
            </ProtectedRoute>
          } />
          <Route path="/patient/feedback"     element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DemoPage pageTitle="Feedback" />
            </ProtectedRoute>
          } />

          {/* ── CATCH-ALL → 404 redirect to login ──────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
