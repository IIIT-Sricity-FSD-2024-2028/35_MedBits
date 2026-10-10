/**
 * FrontDeskDashboard.jsx — Front Desk Reception Dashboard Page
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

export default function FrontDeskDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock live OPD queue data
  const queueData = [
    { token: 'TK-102', patient: 'Arun Menon', doctor: 'Dr. S Madhuri', room: 'OPD Room 101', waitTime: 'Current', status: 'In Consultation' },
    { token: 'TK-103', patient: 'Farah Ali', doctor: 'Dr. S Madhuri', room: 'OPD Room 101', waitTime: '~10 mins', status: 'Waiting' },
    { token: 'TK-104', patient: 'Dev Patel', doctor: 'Dr. Ashwini Ray', room: 'OPD Room 103', waitTime: '~15 mins', status: 'Checked In' },
    { token: 'TK-105', patient: 'Meera Sen', doctor: 'Dr. Ramesh Iyer', room: 'OPD Room 105', waitTime: '~20 mins', status: 'Waiting' },
    { token: 'TK-106', patient: 'Vijay Kumar', doctor: 'Dr. Ashwini Ray', room: 'OPD Room 103', waitTime: '~30 mins', status: 'Checked In' },
  ];

  const queueColumns = [
    { key: 'token', header: 'Token #' },
    { key: 'patient', header: 'Patient Name' },
    { key: 'doctor', header: 'Assigned Doctor' },
    { key: 'room', header: 'OPD Room' },
    { key: 'waitTime', header: 'Estimated Wait' },
    {
      key: 'status',
      header: 'Queue Status',
      render: (val) => {
        const colors = {
          'In Consultation': '#0284c7',
          Waiting: '#f59e0b',
          'Checked In': '#10b981',
        };
        return (
          <span style={{
            background: `${colors[val] || '#64748b'}18`,
            color: colors[val] || '#64748b',
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

  const frontdeskActions = [
    {
      label: 'Walk-in Registration',
      icon: '🚶',
      color: '#0284c7',
      onClick: () => navigate('/front-desk/walkin'),
    },
    {
      label: 'Appointments Desk',
      icon: '📅',
      color: '#10b981',
      onClick: () => navigate('/front-desk/appointments'),
    },
    {
      label: 'Live Queue Manager',
      icon: '📋',
      color: '#f59e0b',
      onClick: () => navigate('/front-desk/queue'),
    },
    {
      label: 'Follow-Up & Referrals',
      icon: '🔄',
      color: '#8b5cf6',
      onClick: () => navigate('/front-desk/followup'),
    },
  ];

  return (
    <AppShell pageTitle="Front Desk Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME BANNER ────────────────────────────────────── */}
        <WelcomeCard
          eyebrow="FRONT DESK OPERATIONS"
          title={`Welcome back, ${user?.name || 'Priya Nair'}!`}
          subtitle="Manage OPD registrations, check in arriving patients, and balance doctor consultation queues."
          stats={[
            { label: 'Walk-ins Today', value: '18' },
            { label: 'Live Queue', value: '6' },
            { label: 'Active Doctors', value: '5' },
          ]}
        />

        {/* ── 2. METRIC HIGHLIGHTS ─────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Walk-in Registrations"
            value="18"
            delta="Patients checked in today"
            deltaType="positive"
            icon="🚶"
          />
          <StatCard
            label="Live OPD Queue"
            value="6"
            delta="Currently waiting in lounge"
            deltaType="warning"
            icon="📋"
          />
          <StatCard
            label="Doctors On Duty"
            value="5"
            delta="Actively consulting in OPD"
            deltaType="info"
            icon="🩺"
          />
          <StatCard
            label="Total Appointments"
            value="32"
            delta="Scheduled for today"
            deltaType="positive"
            icon="📅"
          />
        </StatGrid>

        {/* ── 3. WORKFLOW ACTIONS GRID ─────────────────────────────── */}
        <QuickActions
          title="Front Desk Operations"
          actions={frontdeskActions}
          variant="grid"
        />

        {/* ── 4. LIVE QUEUE DATA TABLE ─────────────────────────────── */}
        <ContentCard
          title="Live Patient Queue Management"
          subtitle="Real-time status of patients in line for doctor consultations"
        >
          <DataTable
            columns={queueColumns}
            data={queueData}
            searchPlaceholder="Search token, patient name, or doctor..."
          />
        </ContentCard>

      </div>
    </AppShell>
  );
}
