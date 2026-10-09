/**
 * navConfig.js — Navigation Items Configuration Per Actor
 * =========================================================
 * This file centralises all sidebar navigation items.
 *
 * PREVIOUSLY (old HTML/JS):
 *  Each portal had its own hardcoded sidebar HTML (ba_sidebar.html,
 *  sidebar.html, etc.) with nav links duplicated everywhere.
 *
 * NOW (React):
 *  One single config object. The <Sidebar> component reads from here
 *  based on the user's role. If you add a new page, you only add it here.
 *
 * STRUCTURE OF EACH NAV ITEM:
 *  {
 *    key:   string  — unique ID, must match the route (e.g. 'dashboard')
 *    label: string  — text shown in the sidebar
 *    path:  string  — React Router path for <NavLink>
 *    icon:  string  — emoji or text icon (matching the old HTML)
 *  }
 */

export const NAV_CONFIG = {

  /* ─────────────────────────────────────────────
     SUPERUSER  (super_admin role)
     Old sidebar: html/superuser/components/sidebar.html
     ───────────────────────────────────────────── */
  super_admin: [
    { key: 'dashboard',         label: 'Dashboard',         path: '/superuser/dashboard',         icon: '⊞' },
    { key: 'earnings',          label: 'Earnings',          path: '/superuser/earnings',          icon: '₹' },
    { key: 'branch-statistics', label: 'Branch Statistics', path: '/superuser/branch-statistics', icon: '📊' },
  ],

  /* ─────────────────────────────────────────────
     BRANCH ADMIN  (branch_admin / admin role)
     Old sidebar: html/branch-admin/components/ba_sidebar.html
     ───────────────────────────────────────────── */
  branch_admin: [
    { key: 'dashboard',        label: 'Dashboard',          path: '/branch-admin/dashboard',        icon: '⊞' },
    { key: 'doctors',          label: 'Manage Doctors',     path: '/branch-admin/doctors',          icon: '🩺' },
    { key: 'frontdesk',        label: 'Manage Front Desk',  path: '/branch-admin/frontdesk',        icon: '🖥️' },
    { key: 'lab-technicians',  label: 'Lab Technicians',    path: '/branch-admin/lab-technicians',  icon: '🔬' },
    { key: 'leave-management', label: 'Leave Management',   path: '/branch-admin/leave-management', icon: '📅' },
    { key: 'earnings',         label: 'Earnings',           path: '/branch-admin/earnings',         icon: '₹' },
  ],

  /* alias — 'admin' is treated the same as 'branch_admin' in auth.js */
  admin: null, // resolved dynamically in Sidebar.jsx (see below)

  /* ─────────────────────────────────────────────
     DOCTOR  (doctor role)
     Old sidebar: html/doctor/components/sidebar.html
     ───────────────────────────────────────────── */
  doctor: [
    { key: 'dashboard',          label: 'Dashboard',          path: '/doctor/dashboard',          icon: '⊞' },
    { key: 'profile',            label: 'Profile',            path: '/doctor/profile',            icon: '◉' },
    { key: 'consultation-notes', label: 'Consultation Notes', path: '/doctor/consultation-notes', icon: '📋' },
    { key: 'internal-referral',  label: 'Internal Referral',  path: '/doctor/internal-referral',  icon: '🔗' },
    { key: 'treatment-plan',     label: 'Treatment Plan',     path: '/doctor/treatment-plan',     icon: '💊' },
    { key: 'slot-management',    label: 'Slot Management',    path: '/doctor/slot-management',    icon: '🕐' },
    { key: 'earnings',           label: 'Earnings',           path: '/doctor/earnings',           icon: '₹' },
  ],

  /* ─────────────────────────────────────────────
     FRONT DESK  (frontdesk role)
     Old sidebar: html/components/fd_sidebar.html + shared.js navItems[]
     ───────────────────────────────────────────── */
  frontdesk: [
    { key: 'dashboard',    label: 'Dashboard',                        path: '/front-desk/dashboard',    icon: '⊞' },
    { key: 'walkin',       label: 'Walk-in Registrations',            path: '/front-desk/walkin',       icon: '🚶' },
    { key: 'appointments', label: 'Appointment Management',           path: '/front-desk/appointments', icon: '📅' },
    { key: 'followup',     label: 'Follow-Up & Referral',             path: '/front-desk/followup',     icon: '🔄' },
    { key: 'queue',        label: 'Queue Management',                 path: '/front-desk/queue',        icon: '📋' },
    { key: 'profile',      label: 'Profile',                         path: '/front-desk/profile',      icon: '◉' },
  ],

  /* ─────────────────────────────────────────────
     LAB TECHNICIAN  (labtech role)
     Old sidebar: js/lab-technician/components.js getSidebarTemplate()
     ───────────────────────────────────────────── */
  labtech: [
    { key: 'dashboard',     label: 'Dashboard',     path: '/lab-technician/dashboard',     icon: '⊞' },
    { key: 'test-requests', label: 'Test Requests', path: '/lab-technician/test-requests', icon: '📋' },
    { key: 'lab-reports',   label: 'Lab Reports',   path: '/lab-technician/lab-reports',   icon: '📊' },
    { key: 'leave',         label: 'Leave',         path: '/lab-technician/leave',         icon: '📅' },
    { key: 'my-account',    label: 'My Account',    path: '/lab-technician/my-account',    icon: '◉' },
  ],

  /* ─────────────────────────────────────────────
     PATIENT  (patient role)
     Old sidebar: html/components/p_sidebar.html
     ───────────────────────────────────────────── */
  patient: [
    { key: 'dashboard',    label: 'Dashboard',       path: '/patient/dashboard',    icon: '⊞' },
    { key: 'profile',      label: 'Profile',         path: '/patient/profile',      icon: '◉' },
    { key: 'appointments', label: 'Appointments',    path: '/patient/appointments', icon: '📅' },
    { key: 'labtests',     label: 'Lab Tests',       path: '/patient/labtests',     icon: '🧪' },
    { key: 'records',      label: 'Medical Records', path: '/patient/records',      icon: '📋' },
    { key: 'billing',      label: 'Billing',         path: '/patient/billing',      icon: '💳' },
    { key: 'feedback',     label: 'Feedback',        path: '/patient/feedback',     icon: '💬' },
  ],
};

/**
 * Portal labels shown in the Topbar subtitle (e.g. "Doctor Portal").
 * Mirrors the old hardcoded strings in each components.js / shared.js.
 */
export const PORTAL_LABELS = {
  super_admin:  'Super Admin Portal',
  branch_admin: 'Branch Admin Portal',
  admin:        'Branch Admin Portal',
  doctor:       'Doctor Portal',
  frontdesk:    'Frontdesk Portal',
  labtech:      'Lab Technician Portal',
  patient:      'Patient Portal',
};

/**
 * getNavItems(role) — Returns the nav items array for a given user role.
 * Handles the 'admin' alias → branch_admin.
 *
 * @param {string} role  — user.role from localStorage
 * @returns {Array}      — array of nav item objects
 */
export function getNavItems(role) {
  if (role === 'admin') return NAV_CONFIG.branch_admin;
  return NAV_CONFIG[role] || [];
}

/**
 * getPortalLabel(role) — Returns the portal label string for a given role.
 * @param {string} role
 * @returns {string}
 */
export function getPortalLabel(role) {
  return PORTAL_LABELS[role] || 'Portal';
}
