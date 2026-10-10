/**
 * BranchAdminDashboard.jsx — Hospital Branch Admin Dashboard Page
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

export default function BranchAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock department & doctor roster data
  const departmentData = [
    { dept: 'General Medicine', leadDoctor: 'Dr. S Madhuri', rooms: 'Rooms 101, 102', patients: '38', status: 'Active' },
    { dept: 'Cardiology', leadDoctor: 'Dr. Ramesh Iyer', rooms: 'Room 105', patients: '19', status: 'Active' },
    { dept: 'Pediatrics', leadDoctor: 'Dr. Ashwini Ray', rooms: 'Room 103', patients: '24', status: 'Active' },
    { dept: 'Pathology & Lab', leadDoctor: 'Dr. Sarah Johnson', rooms: 'Diagnostic Wing', patients: '42', status: 'Active' },
    { dept: 'Orthopedics', leadDoctor: 'Dr. Paul Johnson', rooms: 'Room 107', patients: '15', status: 'On Call' },
  ];

  const deptColumns = [
    { key: 'dept', header: 'Specialty Department' },
    { key: 'leadDoctor', header: 'Lead Consultant' },
    { key: 'rooms', header: 'OPD Suites' },
    { key: 'patients', header: 'Patients Today' },
    {
      key: 'status',
      header: 'Operational Status',
      render: (val) => {
        const isActive = val === 'Active';
        return (
          <span style={{
            background: isActive ? '#dcfce7' : '#fef3c7',
            color: isActive ? '#16a34a' : '#d97706',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            {val}
          </span>
        );
      },
    },
  ];

  const branchActions = [
    {
      label: 'Manage Doctors',
      icon: '🩺',
      color: '#0284c7',
      onClick: () => navigate('/branch-admin/doctors'),
    },
    {
      label: 'Manage Front Desk',
      icon: '🖥️',
      color: '#10b981',
      onClick: () => navigate('/branch-admin/frontdesk'),
    },
    {
      label: 'Lab Technicians',
      icon: '🔬',
      color: '#8b5cf6',
      onClick: () => navigate('/branch-admin/lab-technicians'),
    },
    {
      label: 'Leave Management',
      icon: '📅',
      color: '#f59e0b',
      onClick: () => navigate('/branch-admin/leave-management'),
    },
  ];

  return (
    <AppShell pageTitle="Branch Admin Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME BANNER ────────────────────────────────────── */}
        <WelcomeCard
          eyebrow="BRANCH ADMIN PORTAL"
          title={`Welcome back, ${user?.name || 'Admin User'}!`}
          subtitle="Oversee branch staff, active doctor schedules, daily patient footfall, and earnings."
          stats={[
            { label: 'Total Doctors', value: '12' },
            { label: 'Active Staff', value: '28' },
            { label: "Today's Revenue", value: '₹42.5K' },
          ]}
        />

        {/* ── 2. METRIC STATS ──────────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Active Doctors"
            value="12"
            delta="Consulting across OPDs"
            deltaType="positive"
            icon="🩺"
          />
          <StatCard
            label="Front Desk Staff"
            value="4"
            delta="Reception and registration"
            deltaType="info"
            icon="🖥️"
          />
          <StatCard
            label="Lab Technicians"
            value="3"
            delta="Operating pathology wing"
            deltaType="info"
            icon="🔬"
          />
          <StatCard
            label="Today's Revenue"
            value="₹42,500"
            delta="86 total transactions"
            deltaType="positive"
            icon="₹"
          />
        </StatGrid>

        {/* ── 3. QUICK ACTIONS GRID ─────────────────────────────────── */}
        <QuickActions
          title="Branch Staff Operations"
          actions={branchActions}
          variant="grid"
        />

        {/* ── 4. DEPARTMENT ROSTER DATA TABLE ──────────────────────── */}
        <ContentCard
          title="Clinical Departments & Duty Roster"
          subtitle="Departmental overview and current operational staffing"
        >
          <DataTable
            columns={deptColumns}
            data={departmentData}
            searchPlaceholder="Search departments or lead doctors..."
          />
        </ContentCard>

      </div>
    </AppShell>
  );
}
