/**
 * DoctorDashboard.jsx — Doctor Main Dashboard Page
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

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock appointments data reflecting clinical OPD workflow
  const appointmentsData = [
    { token: 'TK-101', patient: 'Ria Sharma', ageGender: '28 / F', time: '09:30 AM', type: 'Follow-up', status: 'Completed' },
    { token: 'TK-102', patient: 'Arun Menon', ageGender: '45 / M', time: '10:00 AM', type: 'General Checkup', status: 'In Consultation' },
    { token: 'TK-103', patient: 'Farah Ali', ageGender: '34 / F', time: '10:30 AM', type: 'Lab Review', status: 'Waiting' },
    { token: 'TK-104', patient: 'Dev Patel', ageGender: '52 / M', time: '11:15 AM', type: 'Routine Consultation', status: 'Scheduled' },
    { token: 'TK-105', patient: 'Ananya Rao', ageGender: '23 / F', time: '11:45 AM', type: 'Follow-up', status: 'Scheduled' },
  ];

  // Table columns definition with customized badge rendering
  const appointmentColumns = [
    { key: 'token', header: 'Token' },
    { key: 'patient', header: 'Patient Name' },
    { key: 'ageGender', header: 'Age / Gender' },
    { key: 'time', header: 'Slot Time' },
    { key: 'type', header: 'Visit Type' },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const colors = {
          Completed: '#10b981',
          'In Consultation': '#0284c7',
          Waiting: '#f59e0b',
          Scheduled: '#64748b',
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

  // Quick shortcut actions for doctor workflow
  const doctorActions = [
    {
      label: 'New Consultation Note',
      icon: '📋',
      onClick: () => navigate('/doctor/consultation-notes'),
    },
    {
      label: 'New Treatment Plan',
      icon: '💊',
      onClick: () => navigate('/doctor/treatment-plan'),
    },
    {
      label: 'Manage Slots & Timing',
      icon: '🕐',
      onClick: () => navigate('/doctor/slot-management'),
    },
    {
      label: 'Internal Referral',
      icon: '🔗',
      onClick: () => navigate('/doctor/internal-referral'),
    },
  ];

  return (
    <AppShell pageTitle="Doctor Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME BANNER ────────────────────────────────────── */}
        <WelcomeCard
          eyebrow="MEDBITS DOCTOR PORTAL"
          title={`Welcome back, ${user?.name || 'Dr. S Madhuri'}!`}
          subtitle="Review today's appointments schedule, pending lab reviews, and patient queues."
          stats={[
            { label: "Today's Appts", value: '8' },
            { label: 'Pending Labs', value: '3' },
            { label: 'Patients Seen', value: '14' },
          ]}
        />

        {/* ── 2. METRIC STAT CARDS ─────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Today's Appointments"
            value="8"
            delta="Scheduled for today"
            deltaType="positive"
            icon="📅"
          />
          <StatCard
            label="Completed Consultations"
            value="142"
            delta="All-time patient visits"
            deltaType="positive"
            icon="✅"
          />
          <StatCard
            label="Pending Lab Reports"
            value="3"
            delta="3 awaiting laboratory results"
            deltaType="warning"
            icon="🧪"
          />
          <StatCard
            label="Active Prescriptions"
            value="24"
            delta="Issued this week"
            deltaType="info"
            icon="💊"
          />
        </StatGrid>

        {/* ── 3. TWO-COLUMN WORKFLOW ROW ───────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: '24px',
          alignItems: 'start',
        }}>

          {/* Today's Appointments Table */}
          <ContentCard
            title="Today's Appointments"
            subtitle="Live schedule of registered patient visits"
          >
            <DataTable
              columns={appointmentColumns}
              data={appointmentsData}
              searchPlaceholder="Filter patients by name or token..."
            />
          </ContentCard>

          {/* Quick Actions Panel */}
          <QuickActions
            title="Quick Actions"
            actions={doctorActions}
            variant="list"
          />

        </div>

      </div>
    </AppShell>
  );
}
