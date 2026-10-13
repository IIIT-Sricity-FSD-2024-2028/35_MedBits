/**
 * DoctorDashboard.jsx — Doctor Main Dashboard Page
 * ====================================================================
 * Fetches live data from backend APIs:
 *  - Today's appointments: GET /appointments/doctor/:id
 *  - Earnings summary:     GET /appointments/earnings/doctor/:id
 *  - Medical records:      GET /medical-records/doctor/:id
 *
 * Falls back gracefully if any API call fails.
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TODAY = new Date().toISOString().split('T')[0];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Live state ─────────────────────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [pendingLabCount, setPendingLabCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Fetch all dashboard data ───────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [apptRes, earningsRes, recordsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/appointments/doctor/${encodeURIComponent(user.id)}`, {
          headers: { role: 'doctor' },
        }),
        fetch(`${API_BASE}/appointments/earnings/doctor/${encodeURIComponent(user.id)}`, {
          headers: { role: 'doctor' },
        }),
        fetch(`${API_BASE}/medical-records/doctor/${encodeURIComponent(user.id)}`, {
          headers: { role: 'doctor' },
        }),
      ]);

      // Process appointments
      if (apptRes.status === 'fulfilled' && apptRes.value.ok) {
        const apptData = await apptRes.value.json();
        setAppointments(Array.isArray(apptData) ? apptData : []);
      }

      // Process earnings
      if (earningsRes.status === 'fulfilled' && earningsRes.value.ok) {
        const earningsData = await earningsRes.value.json();
        setEarningsSummary(earningsData);
      }

      // Count pending lab orders from records
      if (recordsRes.status === 'fulfilled' && recordsRes.value.ok) {
        const recData = await recordsRes.value.json();
        const labPending = Array.isArray(recData)
          ? recData.filter((r) => r.type === 'lab' || (r.tests && r.type === 'treatment')).length
          : 0;
        setPendingLabCount(labPending);
      }
    } catch {
      // Silently fail — dashboard still shows available data
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const todaysAppointments = appointments.filter((a) => a.date === TODAY);
  const upcomingToday = todaysAppointments.filter((a) => a.status === 'upcoming').length;
  const completedTotal = appointments.filter((a) => a.status === 'completed').length;
  const completedToday = todaysAppointments.filter((a) => a.status === 'completed').length;

  // Format appointments for the table
  const tableRows = todaysAppointments.map((a, idx) => ({
    token: `TK-${String(idx + 1).padStart(3, '0')}`,
    patient: a.patient?.name || a.patientName || a.userId,
    ageGender: a.patient?.age
      ? `${a.patient.age} / ${a.patient.gender?.[0]?.toUpperCase() || '?'}`
      : '—',
    time: a.slot || '—',
    type: a.appointmentType || 'General Consultation',
    status: a.status === 'upcoming' ? 'Scheduled' : a.status === 'completed' ? 'Completed' : a.status,
  }));

  // Table columns definition with status badge rendering
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
    {
      label: 'View Earnings',
      icon: '₹',
      onClick: () => navigate('/doctor/earnings'),
    },
  ];

  return (
    <AppShell pageTitle="Doctor Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME BANNER ──────────────────────────────────────────── */}
        <WelcomeCard
          eyebrow="MEDBITS DOCTOR PORTAL"
          title={`Welcome back, ${user?.name || 'Doctor'}!`}
          subtitle="Review today's appointments schedule, pending lab reviews, and patient queues."
          stats={[
            { label: "Today's Appts", value: String(todaysAppointments.length) },
            { label: 'Pending Labs', value: String(pendingLabCount) },
            { label: 'Completed', value: String(completedToday) },
          ]}
        />

        {/* ── 2. METRIC STAT CARDS ────────────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Today's Appointments"
            value={loading ? '—' : String(todaysAppointments.length)}
            delta={`${upcomingToday} upcoming today`}
            deltaType="positive"
            icon="📅"
          />
          <StatCard
            label="Completed Consultations"
            value={loading ? '—' : String(completedTotal)}
            delta="All-time patient visits"
            deltaType="positive"
            icon="✅"
          />
          <StatCard
            label="Pending Lab Reports"
            value={loading ? '—' : String(pendingLabCount)}
            delta="Awaiting laboratory results"
            deltaType={pendingLabCount > 0 ? 'warning' : 'info'}
            icon="🧪"
          />
          <StatCard
            label="This Month's Earnings"
            value={
              loading
                ? '—'
                : earningsSummary
                  ? `₹${Number(earningsSummary.currentMonthEarnings || 0).toLocaleString('en-IN')}`
                  : '₹0'
            }
            delta={earningsSummary ? `${earningsSummary.percentageCut || 0}% cut per consultation` : 'View earnings'}
            deltaType="info"
            icon="₹"
          />
        </StatGrid>

        {/* ── 3. TWO-COLUMN WORKFLOW ROW ────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: '24px',
          alignItems: 'start',
        }}>

          {/* Today's Appointments Table */}
          <ContentCard
            title="Today's Appointments"
            subtitle={
              loading
                ? 'Loading schedule…'
                : `${todaysAppointments.length} appointment(s) scheduled for ${TODAY}`
            }
          >
            {loading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                Loading appointments…
              </div>
            ) : tableRows.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
                <p>No appointments scheduled for today.</p>
              </div>
            ) : (
              <DataTable
                columns={appointmentColumns}
                data={tableRows}
                searchPlaceholder="Filter patients by name or token…"
              />
            )}
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
