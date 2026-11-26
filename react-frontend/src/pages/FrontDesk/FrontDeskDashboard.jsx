/**
 * FrontDeskDashboard.jsx — Front Desk Reception Dashboard Page
 * ====================================================================
 * Powered by Redux Toolkit (`frontdeskDashboardSlice` + `authSlice`).
 * Connects with the MedBits NestJS backend API via `fetchFrontdeskDashboard`:
 *   - GET /queue        → Live OPD patient queue table & active count
 *   - GET /walkins      → Walk-in registrations total & today's count
 *   - GET /appointments → Total, today's, and upcoming appointment metrics
 *   - GET /doctors      → Active registered doctors in OPD
 *
 * Utilizes core reusable UI components: WelcomeCard, StatCard,
 * QuickActions, ContentCard, DataTable, AlertBanner, and StatusBadge.
 */

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchFrontdeskDashboard,
  selectFrontdeskDashboard,
} from '../../store/slices/frontdesk/frontdeskDashboardSlice';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';
import AlertBanner from '../../components/dashboard/AlertBanner';
import StatusBadge from '../../components/common/StatusBadge';

export default function FrontDeskDashboard() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const {
    queueData,
    stats,
    status,
    error: errorMessage,
  } = useSelector(selectFrontdeskDashboard);

  const isLoading = status === 'loading' || status === 'idle';
  const userId = user?.id;

  const loadDashboardData = useCallback(() => {
    dispatch(fetchFrontdeskDashboard());
  }, [dispatch]);

  // Load dashboard data once on mount or when authenticated user changes
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, userId]);

  // DataTable column definitions with status pill badge rendering
  const queueColumns = [
    {
      key: 'token',
      header: 'Token #',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 700, color: '#0284c7' }}>
            {val}
          </span>
          {row.doctorCode && (
            <span
              style={{
                fontSize: '11px',
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
              title={`Token ${val} for ${row.doctor} (${row.doctorCode})`}
            >
              {row.doctorCode}
            </span>
          )}
        </div>
      ),
    },
    { key: 'patient', header: 'Patient Name' },
    {
      key: 'doctor',
      header: 'Assigned Doctor',
      render: (val, row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{val}</span>
          {row.doctorCode && val !== row.doctorCode && (
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
              {row.doctorCode}
            </span>
          )}
        </div>
      ),
    },
    { key: 'room', header: 'OPD Room' },
    { key: 'waitTime', header: 'Estimated Wait' },
    {
      key: 'status',
      header: 'Queue Status',
      render: (val) => <StatusBadge status={val} />,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── 0. ERROR BANNER (Displayed if backend requests fail) ──── */}
      {errorMessage && (
        <AlertBanner
          type="error"
          title="Backend Connection Issue"
          message={errorMessage}
          onRetry={loadDashboardData}
          isRetrying={isLoading}
          retryLabel="Retry Connection"
        />
      )}

      {/* ── 1. WELCOME BANNER ────────────────────────────────────── */}
      <WelcomeCard
        eyebrow="FRONT DESK OPERATIONS"
        title={`Welcome back, ${user?.name || 'Priya Nair'}!`}
        subtitle="Manage OPD registrations, check in arriving patients, and balance doctor consultation queues."
        stats={[
          { label: 'Walk-ins Today', value: isLoading ? '—' : String(stats.walkinsToday) },
          { label: 'Live Queue', value: isLoading ? '—' : String(stats.queueActive) },
          { label: 'Active Doctors', value: isLoading ? '—' : String(stats.doctorsTotal) },
        ]}
      />

      {/* ── 2. METRIC HIGHLIGHTS ─────────────────────────────────── */}
      <StatGrid>
        <StatCard
          label="Walk-in Registrations"
          value={isLoading ? '—' : stats.walkinsTotal}
          delta={
            isLoading
              ? 'Fetching registrations...'
              : `${stats.walkinsToday} registered today (${stats.walkinsTotal} total)`
          }
          deltaType="positive"
          icon="🚶"
        />
        <StatCard
          label="Live OPD Queue"
          value={isLoading ? '—' : stats.queueActive}
          delta={
            isLoading
              ? 'Loading queue...'
              : `${stats.queueWaiting} waiting, ${stats.queueConsulting} in consultation`
          }
          deltaType={stats.queueActive > 0 ? 'warning' : 'info'}
          icon="📋"
        />
        <StatCard
          label="Doctors On Duty"
          value={isLoading ? '—' : stats.doctorsTotal}
          delta={
            isLoading
              ? 'Loading doctors...'
              : 'Active doctors registered in OPD'
          }
          deltaType="info"
          icon="🩺"
        />
        <StatCard
          label="Total Appointments"
          value={isLoading ? '—' : stats.appointmentsTotal}
          delta={
            isLoading
              ? 'Loading appointments...'
              : `${stats.appointmentsToday} scheduled today (${stats.appointmentsUpcoming} upcoming)`
          }
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
        action={
          <button
            type="button"
            className="btn-card-refresh"
            onClick={loadDashboardData}
            disabled={isLoading}
            title="Refresh queue and dashboard metrics from backend"
          >
            <span>{isLoading ? '⏳' : '🔄'}</span>
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        }
      >
        <DataTable
          columns={queueColumns}
          data={queueData}
          searchPlaceholder="Search token, patient name, or doctor..."
          emptyMessage={
            isLoading
              ? 'Loading live patient queue from backend...'
              : errorMessage
              ? 'Unable to display queue data due to a server connection issue.'
              : 'No patients currently in queue.'
          }
        />
      </ContentCard>

    </div>
  );
}
