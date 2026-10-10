/**
 * PatientDashboard.jsx — Patient Main Dashboard Page
 * ====================================================================
 * Location: src/pages/patient/PatientDashboard.jsx
 *
 * Direct backend integration:
 *  - Upcoming Appointments fetched from /appointments/user/:userId
 *  - Lab Orders fetched directly from backend (/lab-requests/patient)
 *  - Side-by-side DataTables without ID columns or search/filter bars
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import WelcomeCard from '../../components/dashboard/WelcomeCard';
import QuickActions from '../../components/dashboard/QuickActions';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';

// Backend API Base URL from environment or local port 3000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── STATE: Dynamic backend data ───────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── DATA FETCHING: Load upcoming appointments & lab orders ────────
  useEffect(() => {
    let isMounted = true;

    async function fetchPatientDashboardData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFetchError(null);

      const userId = user.id;
      const headers = {
        'role': 'patient',
        'x-user-id': userId,
      };

      try {
        // 1. Fetch upcoming appointments directly
        const aptRes = await fetch(
          `${API_BASE_URL}/appointments/user/${encodeURIComponent(userId)}?status=upcoming`,
          { headers }
        );
        let aptList = aptRes.ok ? await aptRes.json() : [];

        // Fallback: check general user appointment list if upcoming filter is empty
        if (!aptList.length) {
          const allAptRes = await fetch(
            `${API_BASE_URL}/appointments/user/${encodeURIComponent(userId)}`,
            { headers }
          );
          if (allAptRes.ok) {
            const allApt = await allAptRes.json();
            aptList = allApt.filter((item) => item.status !== 'cancelled');
          }
        }

        // 2. Fetch lab orders directly
        const labRes = await fetch(
          `${API_BASE_URL}/lab-requests/patient`,
          { headers }
        );
        let labList = labRes.ok ? await labRes.json() : [];

        // Fallback: check lab test history if lab requests is empty
        if (!labList.length) {
          const histRes = await fetch(
            `${API_BASE_URL}/labtests/history/${encodeURIComponent(userId)}`,
            { headers }
          );
          if (histRes.ok) {
            labList = await histRes.json();
          }
        }

        if (!isMounted) return;

        // ── MAP APPOINTMENTS DIRECTLY (NO ID COLUMN) ────────────────
        const formattedAppointments = (aptList || []).map((apt) => ({
          doctor: apt.doctor?.name || apt.doctorName || 'Consulting Doctor',
          department: apt.doctor?.department || apt.doctor?.specialization || 'OPD',
          dateTime: `${apt.date || 'Scheduled'}${apt.slot ? ` • ${apt.slot}` : ''}`,
          status: apt.status || 'Upcoming',
        }));

        // ── MAP LAB ORDERS DIRECTLY (NO ID COLUMN) ──────────────────
        const formattedLabOrders = (labList || []).map((lab) => ({
          testName: lab.testName || 'Diagnostic Test',
          doctor: lab.doctorName || 'Pathology Department',
          date: lab.requestDate || lab.date || 'Recent',
          status: lab.status || 'Pending',
        }));

        setAppointments(formattedAppointments);
        setLabOrders(formattedLabOrders);

      } catch {
        if (isMounted) {
          setFetchError('Unable to connect to the backend server.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPatientDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // ── TABLE COLUMNS: Upcoming Appointments (NO ID COLUMN) ───────────
  const appointmentColumns = [
    { key: 'doctor', header: 'Doctor' },
    { key: 'department', header: 'Department' },
    { key: 'dateTime', header: 'Date & Slot' },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const isCompleted = String(val).toLowerCase() === 'completed';
        const isUpcoming = String(val).toLowerCase() === 'upcoming' || String(val).toLowerCase() === 'scheduled';
        return (
          <span style={{
            background: isCompleted ? '#dcfce7' : isUpcoming ? '#eff6ff' : '#f1f5f9',
            color: isCompleted ? '#16a34a' : isUpcoming ? '#0284c7' : '#475569',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'capitalize',
          }}>
            {val}
          </span>
        );
      },
    },
  ];

  // ── TABLE COLUMNS: Lab Orders (NO ID COLUMN) ──────────────────────
  const labOrderColumns = [
    { key: 'testName', header: 'Test Name' },
    { key: 'doctor', header: 'Doctor / Lab' },
    { key: 'date', header: 'Date' },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const normalized = String(val).toLowerCase();
        const isReady = normalized === 'submitted' || normalized === 'completed' || normalized === 'report ready';
        const isInProgress = normalized === 'in_progress' || normalized === 'in analysis';
        return (
          <span style={{
            background: isReady ? '#dcfce7' : isInProgress ? '#e0f2fe' : '#fef3c7',
            color: isReady ? '#16a34a' : isInProgress ? '#0284c7' : '#d97706',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'capitalize',
          }}>
            {val.replace('_', ' ')}
          </span>
        );
      },
    },
  ];

  // ── QUICK ACTIONS DEFINITION ──────────────────────────────────────
  const patientActions = [
    {
      label: 'Book Appointment',
      icon: '📅',
      color: '#0284c7',
      onClick: () => navigate('/patient/appointments'),
    },
    {
      label: 'Book Lab Tests',
      icon: '🧪',
      color: '#10b981',
      onClick: () => navigate('/patient/labtests'),
    },
    {
      label: 'Medical Records',
      icon: '📋',
      color: '#8b5cf6',
      onClick: () => navigate('/patient/records'),
    },
    {
      label: 'Billing & Invoices',
      icon: '💳',
      color: '#f59e0b',
      onClick: () => navigate('/patient/billing'),
    },
  ];

  return (
    <AppShell pageTitle="Patient Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── 1. WELCOME HERO BANNER ────────────────────────────────── */}
        <WelcomeCard
          eyebrow="MEDBITS PATIENT PORTAL"
          title={`Welcome back, ${user?.firstName || user?.name || 'Patient'}!`}
          subtitle="Manage your upcoming doctor visits, lab diagnostic orders, and medical records."
        />

        {/* Optional Error notification if backend fetch fails */}
        {fetchError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13.5px',
          }}>
            ⚠️ {fetchError}
          </div>
        )}

        {/* ── 2. SHORTCUT QUICK ACTIONS ─────────────────────────────── */}
        <QuickActions
          title="Patient Quick Actions"
          actions={patientActions}
          variant="grid"
        />

        {/* ── 3. SIDE-BY-SIDE DATA TABLES: APPOINTMENTS & LAB ORDERS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}>

          {/* TABLE 1: UPCOMING APPOINTMENTS (No filter, No ID column) */}
          <ContentCard
            title="Upcoming Appointments"
            subtitle="Scheduled consultations with doctors"
          >
            <DataTable
              columns={appointmentColumns}
              data={appointments}
              searchable={false}
              emptyMessage={isLoading ? "Loading appointments..." : "No upcoming appointments found."}
            />
          </ContentCard>

          {/* TABLE 2: LAB ORDERS (No filter, No ID column) */}
          <ContentCard
            title="Lab Orders & Diagnostics"
            subtitle="Diagnostic test requests and lab reports"
          >
            <DataTable
              columns={labOrderColumns}
              data={labOrders}
              searchable={false}
              emptyMessage={isLoading ? "Loading lab orders..." : "No lab orders found."}
            />
          </ContentCard>

        </div>

      </div>
    </AppShell>
  );
}
