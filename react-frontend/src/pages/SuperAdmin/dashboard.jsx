/**
 * dashboard.jsx — Super Admin Master Dashboard Page
 * =========================================================================
 * Super Admin control room page for branch setup and access management.
 * Wraps the reusable SuperUserDashboard component inside AppShell layout.
 */

import React from 'react';
import AppShell from '../../components/layout/AppShell';
import SuperUserDashboard from '../../components/superuser/SuperUserDashboard';

export default function SuperAdminDashboard() {
  return (
    // Standard application shell with sidebar, topbar, and title
    <AppShell pageTitle="Super Admin Dashboard">
      {/* Main branch management and live registry component */}
      <SuperUserDashboard />
    </AppShell>
  );
}
