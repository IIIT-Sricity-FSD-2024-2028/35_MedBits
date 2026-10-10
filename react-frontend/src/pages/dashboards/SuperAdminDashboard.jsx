/**
 * SuperAdminDashboard.jsx — Super Admin Master Dashboard Page
 * ====================================================================
 * Utilizes the core reusable UI components: AppShell, WelcomeCard,
 * StatCard, QuickActions, ContentCard, and DataTable.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock hospital branches registry
  const branchData = [
    { code: 'BR-BLR-01', name: 'MedBits Central (Apollo Wing)', city: 'Bangalore, KA', admin: 'Admin User (admin@medbits.com)', doctors: '18', status: 'Active' },
    { code: 'BR-BLR-02', name: 'MedBits Electronic City', city: 'Bangalore, KA', admin: 'Ramesh (rameshmedbits@gmail.com)', doctors: '14', status: 'Active' },
    { code: 'BR-BLR-03', name: 'MedBits Jayanagar Super-Clinic', city: 'Bangalore, KA', admin: 'Ram (ram@gmail.com)', doctors: '12', status: 'Active' },
    { code: 'BR-HYD-01', name: 'MedBits Hitec City', city: 'Hyderabad, TS', admin: 'Kavita Reddy', doctors: '16', status: 'Active' },
    { code: 'BR-CHN-01', name: 'MedBits T Nagar Care Center', city: 'Chennai, TN', admin: 'Suresh Mani', doctors: '14', status: 'Active' },
  ];

  const branchColumns = [
    { key: 'code', header: 'Branch Code' },
    { key: 'name', header: 'Hospital Branch Name' },
    { key: 'city', header: 'City & State' },
    { key: 'admin', header: 'Branch Administrator' },
    { key: 'doctors', header: 'Doctors' },
    {
      key: 'status',
      header: 'Network Status',
      render: (val) => (
        <span style={{
          background: '#dcfce7',
          color: '#16a34a',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
        }}>
          {val}
        </span>
      ),
    },
  ];

  const superAdminActions = [
    {
      label: 'Network Earnings Report',
      icon: '₹',
      color: '#0284c7',
      onClick: () => navigate('/superuser/earnings'),
    },
    {
      label: 'Branch Analytics & Stats',
      icon: '📊',
      color: '#10b981',
      onClick: () => navigate('/superuser/branch-statistics'),
    },
  ];

  return (
    <AppShell pageTitle="Super Admin Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME BANNER ────────────────────────────────────── */}
        <WelcomeCard
          eyebrow="SUPER ADMIN CONTROL ROOM"
          title={`Welcome back, ${user?.name || 'Super Admin'}!`}
          subtitle="Hospital network monitoring, branch administration, user roles, and centralized statistics."
          stats={[
            { label: 'Active Branches', value: '6' },
            { label: 'Total Doctors', value: '74' },
            { label: 'Total Patients', value: '15.4K' },
          ]}
        />

        {/* ── 2. METRIC STATS ──────────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Registered Hospital Branches"
            value="6"
            delta="100% operational across India"
            deltaType="positive"
            icon="🏥"
          />
          <StatCard
            label="Network Doctors"
            value="74"
            delta="Across all branch locations"
            deltaType="info"
            icon="🩺"
          />
          <StatCard
            label="Registered Patients"
            value="15,400"
            delta="Stored in secure database"
            deltaType="positive"
            icon="👥"
          />
          <StatCard
            label="System Health & Uptime"
            value="99.9%"
            delta="All backend services operational"
            deltaType="positive"
            icon="⚡"
          />
        </StatGrid>

        {/* ── 3. QUICK ACTIONS GRID ─────────────────────────────────── */}
        <QuickActions
          title="Network Administration"
          actions={superAdminActions}
          variant="grid"
        />

        {/* ── 4. BRANCH REGISTRY DATA TABLE ────────────────────────── */}
        <ContentCard
          title="Hospital Branch Network Registry"
          subtitle="Live registry of all hospital facilities and designated administrators"
        >
          <DataTable
            columns={branchColumns}
            data={branchData}
            searchPlaceholder="Search branches by code, location, or admin..."
          />
        </ContentCard>

      </div>
    </AppShell>
  );
}
