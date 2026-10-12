/**
 * FrontDeskDashboard.jsx — Front Desk Reception Dashboard Page
 * ====================================================================
 * Connects with the MedBits NestJS backend API:
 *   - GET /queue        → Live OPD patient queue table & active count
 *   - GET /walkins      → Walk-in registrations total & today's count
 *   - GET /appointments → Total, today's, and upcoming appointment metrics
 *   - GET /doctors      → Active registered doctors in OPD
 *
 * Utilizes the core reusable UI components: AppShell, WelcomeCard,
 * StatCard, QuickActions, ContentCard, and DataTable.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import QuickActions from '../../components/dashboard/QuickActions';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';
import AlertBanner from '../../components/dashboard/AlertBanner';

// Backend API URL (defaults to http://localhost:3000 if not specified in .env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FrontDeskDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for data fetching, loading, and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [stats, setStats] = useState({
    walkinsTotal: 0,
    walkinsToday: 0,
    queueActive: 0,
    queueWaiting: 0,
    queueConsulting: 0,
    doctorsTotal: 0,
    appointmentsTotal: 0,
    appointmentsToday: 0,
    appointmentsUpcoming: 0,
  });

  /**
   * Main data loader: Fetches queue, walk-ins, appointments, and doctors
   * concurrently from the NestJS backend API using role-based headers.
   */
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        role: user?.role || 'frontdesk',
      };

      // Fetch all four required endpoints concurrently
      const [queueRes, walkinsRes, apptsRes, doctorsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/queue`, { headers }),
        fetch(`${API_BASE_URL}/walkins`, { headers }),
        fetch(`${API_BASE_URL}/appointments`, { headers }),
        fetch(`${API_BASE_URL}/doctors`, { headers }),
      ]);

      // Check for any HTTP error responses
      if (!queueRes.ok || !walkinsRes.ok || !apptsRes.ok || !doctorsRes.ok) {
        const failedEndpoints = [
          !queueRes.ok && `Queue (HTTP ${queueRes.status})`,
          !walkinsRes.ok && `Walk-ins (HTTP ${walkinsRes.status})`,
          !apptsRes.ok && `Appointments (HTTP ${apptsRes.status})`,
          !doctorsRes.ok && `Doctors (HTTP ${doctorsRes.status})`,
        ].filter(Boolean).join(', ');

        throw new Error(`Server returned error for: ${failedEndpoints}`);
      }

      // Parse JSON responses
      const [rawQueue, rawWalkins, rawAppts, rawDoctors] = await Promise.all([
        queueRes.json(),
        walkinsRes.json(),
        apptsRes.json(),
        doctorsRes.json(),
      ]);

      // Determine today's date in local YYYY-MM-DD format for date filtering
      const today = new Date();
      const todayIsoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // ── 1. Calculate Walk-in Statistics ─────────────────────────
      const walkinsList = Array.isArray(rawWalkins) ? rawWalkins : [];
      const walkinsTotal = walkinsList.length;
      const walkinsToday = walkinsList.filter((w) => {
        if (!w.createdAt) return false;
        return w.createdAt.slice(0, 10) === todayIsoDate;
      }).length;

      // ── 3. Calculate Doctors Statistics & Build Doctor Lookup ──
      const doctorsList = Array.isArray(rawDoctors) ? rawDoctors : [];
      const doctorsTotal = doctorsList.length;

      // Build a lookup map of doctors by ID and userId for fast doctor details lookup
      const doctorMap = new Map();
      doctorsList.forEach((doc) => {
        if (doc.id) doctorMap.set(doc.id, doc);
        if (doc.userId) doctorMap.set(doc.userId, doc);
      });

      // ── 2. Calculate Queue Statistics & Map Table Rows ──────────
      const queueList = Array.isArray(rawQueue) ? rawQueue : [];
      const queueWaiting = queueList.filter((q) => q.status === 'waiting').length;
      const queueConsulting = queueList.filter((q) => q.status === 'in-consultation').length;
      const queueActive = queueWaiting + queueConsulting;

      const formattedQueue = queueList.map((item, index) => {
        // Look up doctor in doctorMap to get the real doctor name and department
        const matchedDoctor = doctorMap.get(item.doctorId) || item.doctor || {};
        const doctorName = matchedDoctor.name || item.doctor?.name || (item.doctorId ? `Doctor #${item.doctorId}` : 'Assigned Doctor');
        const doctorCode = item.doctorId || matchedDoctor.id || '';

        const patientName = item.patient?.name || (item.patient?.firstName
          ? `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim()
          : (item.userId || 'Patient'));

        // Resolve department/specialization and prevent duplicate "OPD" (e.g. avoids "General OPD OPD")
        const dept = matchedDoctor.department || matchedDoctor.specialization || item.doctor?.department || item.doctor?.specialization || 'General OPD';
        let room = 'OPD Room';
        if (dept) {
          const trimmedDept = dept.trim();
          room = trimmedDept.toLowerCase().endsWith('opd') ? trimmedDept : `${trimmedDept} OPD`;
        }

        let statusLabel = 'Waiting';
        let waitTime = 'In Queue';
        if (item.status === 'in-consultation') {
          statusLabel = 'In Consultation';
          waitTime = 'Current';
        } else if (item.status === 'waiting') {
          statusLabel = 'Waiting';
          waitTime = `Position #${index + 1}`;
        } else if (item.status === 'done') {
          statusLabel = 'Completed';
          waitTime = 'Done';
        }

        const tokenFormatted = item.tokenNumber ? `TK-${String(item.tokenNumber).padStart(3, '0')}` : `#${index + 1}`;

        return {
          id: item.id || `queue-${index}`,
          token: tokenFormatted,
          doctorCode: doctorCode,
          tokenNumber: item.tokenNumber,
          patient: patientName,
          doctor: doctorName,
          room: room,
          waitTime: waitTime,
          status: statusLabel,
          rawStatus: item.status,
        };
      });

      // ── 4. Calculate Appointments Statistics ─────────────────────
      const apptsList = Array.isArray(rawAppts) ? rawAppts : [];
      const appointmentsTotal = apptsList.length;
      const appointmentsToday = apptsList.filter((a) => a.date === todayIsoDate).length;
      const appointmentsUpcoming = apptsList.filter((a) => a.status === 'upcoming').length;

      // Update React state with computed real values
      setStats({
        walkinsTotal,
        walkinsToday,
        queueActive,
        queueWaiting,
        queueConsulting,
        doctorsTotal,
        appointmentsTotal,
        appointmentsToday,
        appointmentsUpcoming,
      });

      setQueueData(formattedQueue);
    } catch (err) {
      console.error('Error loading front desk dashboard data:', err);
      setErrorMessage(
        err.message || 'Unable to connect to backend server on port 3000. Ensure the NestJS backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  // Load dashboard data once on component mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      render: (val) => {
        const colors = {
          'In Consultation': '#0284c7', // Blue
          Waiting: '#f59e0b',          // Amber
          Completed: '#10b981',        // Emerald Green
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
              onClick={loadDashboardData}
              disabled={isLoading}
              title="Refresh queue and dashboard metrics from backend"
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
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
    </AppShell>
  );
}
