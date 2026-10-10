/**
 * LabTechDashboard.jsx — Laboratory Technician Dashboard Page
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

export default function LabTechDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock test requests data
  const testRequests = [
    { id: 'LAB-881', patient: 'Ria Sharma', test: 'Complete Blood Count (CBC)', doctor: 'Dr. S Madhuri', priority: 'Routine', status: 'Completed' },
    { id: 'LAB-882', patient: 'Arun Menon', test: 'Lipid Profile & Serum Glucose', doctor: 'Dr. Ramesh Iyer', priority: 'STAT (Urgent)', status: 'In Analysis' },
    { id: 'LAB-883', patient: 'Farah Ali', test: 'Thyroid Stimulating Hormone (TSH)', doctor: 'Dr. S Madhuri', priority: 'Routine', status: 'Sample Received' },
    { id: 'LAB-884', patient: 'Dev Patel', test: 'HbA1c Glycated Hemoglobin', doctor: 'Dr. Ashwini Ray', priority: 'Routine', status: 'Pending Collection' },
    { id: 'LAB-885', patient: 'Kiran Bedi', test: 'Liver Function Test (LFT)', doctor: 'Dr. Sarah Johnson', priority: 'STAT (Urgent)', status: 'In Analysis' },
  ];

  const testColumns = [
    { key: 'id', header: 'Request ID' },
    { key: 'patient', header: 'Patient Name' },
    { key: 'test', header: 'Prescribed Test' },
    { key: 'doctor', header: 'Referring Doctor' },
    {
      key: 'priority',
      header: 'Priority',
      render: (val) => {
        const isUrgent = val.includes('STAT') || val.includes('Urgent');
        return (
          <span style={{
            color: isUrgent ? '#ef4444' : '#64748b',
            fontWeight: 700,
            fontSize: '12px',
          }}>
            {isUrgent ? '⚡ ' : ''}{val}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const colors = {
          Completed: '#10b981',
          'In Analysis': '#0284c7',
          'Sample Received': '#f59e0b',
          'Pending Collection': '#64748b',
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

  const labActions = [
    {
      label: 'Test Requests Queue',
      icon: '📋',
      onClick: () => navigate('/lab-technician/test-requests'),
    },
    {
      label: 'Upload / Generate Lab Reports',
      icon: '📊',
      onClick: () => navigate('/lab-technician/lab-reports'),
    },
    {
      label: 'Apply for Leave',
      icon: '📅',
      onClick: () => navigate('/lab-technician/leave'),
    },
    {
      label: 'My Account Settings',
      icon: '◉',
      onClick: () => navigate('/lab-technician/my-account'),
    },
  ];

  return (
    <AppShell pageTitle="Lab Technician Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME BANNER ────────────────────────────────────── */}
        <WelcomeCard
          eyebrow="LABORATORY PORTAL"
          title={`Welcome back, ${user?.name || 'Suresh Kumar'}!`}
          subtitle="Track incoming diagnostic orders, review specimen batches, and publish verified digital reports."
          stats={[
            { label: 'Pending Tests', value: '5' },
            { label: 'Reports Today', value: '18' },
            { label: 'Samples Collected', value: '23' },
          ]}
        />

        {/* ── 2. METRIC STAT CARDS ─────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Pending Test Requests"
            value="5"
            delta="Awaiting specimen analysis"
            deltaType="warning"
            icon="🔬"
          />
          <StatCard
            label="Completed Lab Reports"
            value="18"
            delta="Uploaded and verified today"
            deltaType="positive"
            icon="📊"
          />
          <StatCard
            label="Samples Collected"
            value="23"
            delta="Processed in diagnostic lab"
            deltaType="info"
            icon="🧪"
          />
          <StatCard
            label="Critical Alerts"
            value="0"
            delta="All diagnostic indicators normal"
            deltaType="positive"
            icon="🛡️"
          />
        </StatGrid>

        {/* ── 3. WORKFLOW ROW ──────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: '24px',
          alignItems: 'start',
        }}>

          {/* Test Requests Table */}
          <ContentCard
            title="Recent Diagnostic Orders"
            subtitle="Live status of ordered pathology and biochemical tests"
          >
            <DataTable
              columns={testColumns}
              data={testRequests}
              searchPlaceholder="Filter by test name or patient..."
            />
          </ContentCard>

          {/* Quick Actions Panel */}
          <QuickActions
            title="Laboratory Actions"
            actions={labActions}
            variant="list"
          />

        </div>

      </div>
    </AppShell>
  );
}
