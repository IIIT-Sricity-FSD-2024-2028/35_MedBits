/**
 * dashboard.jsx — Super Admin Master Dashboard Page
 * =========================================================================
 * Super Admin control room page for branch setup and access management.
 * Wraps the reusable SuperUserDashboard component inside AppShell layout.
 */

import React from 'react';
import SuperUserDashboard from '../../components/superuser/SuperUserDashboard';

export default function SuperAdminDashboard() {
  return (
    // Standard application shell with sidebar, topbar, and title
    <SuperUserDashboard />
  );
}
