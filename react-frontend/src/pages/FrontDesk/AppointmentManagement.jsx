/**
 * AppointmentManagement.jsx — Front Desk Appointment Management Page
 * =========================================================================
 * Location: src/pages/FrontDesk/AppointmentManagement.jsx
 *
 * Connects with the MedBits NestJS backend API:
 *   - GET /appointments             → Lists all scheduled appointments with doctor & patient profiles
 *   - POST /appointments            → Schedules new appointment (via BookAppointmentModal)
 *   - PUT /appointments/:id         → Reschedules date & time slot (via RescheduleAppointmentModal)
 *   - DELETE /appointments/:id      → Cancels an appointment (via CancelAppointmentModal)
 *   - POST /appointments/:id/complete → Marks appointment as completed
 *
 * Utilizes core reusable components:
 *   - AppShell, ContentCard, DataTable, StatCard, StatGrid, AlertBanner
 *   - Extracted subcomponents: BookAppointmentModal, RescheduleAppointmentModal,
 *     CancelAppointmentModal, AppointmentStatusBadge
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import AlertBanner from '../../components/dashboard/AlertBanner';

// Feature Subcomponents
import BookAppointmentModal from './components/BookAppointmentModal';
import RescheduleAppointmentModal from './components/RescheduleAppointmentModal';
import CancelAppointmentModal from './components/CancelAppointmentModal';
import AppointmentStatusBadge from './components/AppointmentStatusBadge';
import AppointmentActionButtons from './components/AppointmentActionButtons';
import './AppointmentManagement.css';

// Backend API URL (defaults to http://localhost:3000 if not specified in .env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const todayIso = () => new Date().toISOString().split('T')[0];

export default function AppointmentManagement() {
  const { user } = useAuth();

  // Data state
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal dialog states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Reschedule state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);

  // Cancel state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Action in-flight state (for 1-click completion)
  const [actionInProgressId, setActionInProgressId] = useState(null);

  /**
   * Fetch all appointments from the backend with frontdesk credentials
   */
  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        headers: {
          'Content-Type': 'application/json',
          role: user?.role || 'frontdesk',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load appointments from the server.');
      }

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Frontdesk loadAppointments error:', err);
      setErrorMessage(err.message || 'Unable to load appointments.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  /**
   * Handler: Reschedule Appointment Submission (PUT /appointments/:id)
   */
  const handleRescheduleSubmit = async ({ appointmentId, date, slot }) => {
    setIsRescheduling(true);
    setRescheduleError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            role: user?.role || 'frontdesk',
          },
          body: JSON.stringify({ date, slot }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to reschedule appointment.');
      }

      // Close modal and refresh appointments list
      setRescheduleTarget(null);
      setSuccessMessage('Appointment rescheduled successfully.');
      await loadAppointments();
    } catch (err) {
      setRescheduleError(err.message || 'Error rescheduling appointment.');
    } finally {
      setIsRescheduling(false);
    }
  };

  /**
   * Handler: Cancel Appointment Submission (DELETE /appointments/:id)
   */
  const handleCancelSubmit = async (appointmentId) => {
    setIsCancelling(true);
    setCancelError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            role: user?.role || 'frontdesk',
          },
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to cancel appointment.');
      }

      setCancelTarget(null);
      setSuccessMessage('Appointment cancelled successfully.');
      await loadAppointments();
    } catch (err) {
      setCancelError(err.message || 'Error cancelling appointment.');
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Handler: Mark Appointment as Completed (POST /appointments/:id/complete)
   */
  const handleCompleteAppointment = async (appointmentId) => {
    setActionInProgressId(appointmentId);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            role: user?.role || 'frontdesk',
          },
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to mark appointment as completed.');
      }

      setSuccessMessage('Appointment marked as completed.');
      await loadAppointments();
    } catch (err) {
      setErrorMessage(err.message || 'Error updating appointment status.');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Helper: Format ISO date string into readable date (e.g. 12 Oct 2026)
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(`${dateStr}T00:00:00`);
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Compute summary stats from actual appointment data
  const todayStr = todayIso();
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter((apt) => apt.date === todayStr).length;
  const upcomingAppointments = appointments.filter((apt) => apt.status === 'upcoming').length;
  const completedAppointments = appointments.filter((apt) => apt.status === 'completed').length;

  // Filter appointments for the DataTable based on the selected status tab
  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'all') return true;
    return (apt.status || '').toLowerCase() === statusFilter;
  });

  // Table column configuration for DataTable component
  const columns = [
    {
      key: 'id',
      header: 'Appointment ID',
      render: (val, row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
          {val || row.id}
        </span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient Details',
      render: (_, row) => {
        const patientName =
          row.patient?.name ||
          (row.patient?.firstName
            ? `${row.patient.firstName} ${row.patient.lastName || ''}`.trim()
            : row.userId || 'Patient');

        return (
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{patientName}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {row.patient?.phone ? `📞 ${row.patient.phone}` : `ID: ${row.userId}`}
            </div>
          </div>
        );
      },
    },
    {
      key: 'doctor',
      header: 'Doctor & Department',
      render: (_, row) => {
        const doctorName = row.doctor?.name || row.doctorId || 'Assigned Doctor';
        const spec = row.doctor?.specialization || row.doctor?.department || '';

        return (
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>Dr. {doctorName}</div>
            {spec && <div style={{ fontSize: '12px', color: '#64748b' }}>{spec}</div>}
          </div>
        );
      },
    },
    {
      key: 'schedule',
      header: 'Date & Time',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatDisplayDate(row.date)}</div>
          <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 500 }}>
            ⏰ {row.slot || '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <AppointmentStatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <AppointmentActionButtons
          appointment={row}
          isLoading={actionInProgressId === row.id}
          onReschedule={(appt) => {
            setRescheduleError(null);
            setRescheduleTarget(appt);
          }}
          onComplete={handleCompleteAppointment}
          onCancel={(appt) => {
            setCancelError(null);
            setCancelTarget(appt);
          }}
        />
      ),
    },
  ];

  return (
    <AppShell
      role="frontdesk"
      activePath="/front-desk/appointments"
      pageTitle="Appointment Management"
      subtitle="Schedule, reschedule, and manage outpatient clinic appointments"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Error and Success Notifications */}
        {errorMessage && (
          <AlertBanner
            message={errorMessage}
            type="error"
            onDismiss={() => setErrorMessage(null)}
          />
        )}
        {successMessage && (
          <AlertBanner
            message={successMessage}
            type="success"
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        {/* ── TOP STATS GRID ── */}
        <StatGrid>
          <StatCard
            icon="📅"
            label="Total Appointments"
            value={totalAppointments}
            sub="Lifetime registered"
            color="blue"
          />
          <StatCard
            icon="🕒"
            label="Today's Appointments"
            value={todayAppointments}
            sub="Scheduled for today"
            color="purple"
          />
          <StatCard
            icon="⏳"
            label="Upcoming Consultations"
            value={upcomingAppointments}
            sub="Awaiting visit"
            color="teal"
          />
          <StatCard
            icon="✅"
            label="Completed Appointments"
            value={completedAppointments}
            sub="Finished consultations"
            color="green"
          />
        </StatGrid>

        {/* ── APPOINTMENTS TABLE CARD ── */}
        <ContentCard
          title="Scheduled Appointments"
          subtitle="View and manage all patient outpatient consultations"
          action={
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appointment-status-select"
              >
                <option value="all">All Statuses ({appointments.length})</option>
                <option value="upcoming">Upcoming ({upcomingAppointments})</option>
                <option value="completed">Completed ({completedAppointments})</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Primary Book New Appointment Button */}
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="btn-book-appointment"
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Book Appointment
              </button>
            </div>
          }
        >
          {isLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
              Loading appointments data from backend...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAppointments}
              searchable={true}
              searchPlaceholder="Search by patient, phone, doctor, or ID..."
              emptyMessage={
                statusFilter === 'all'
                  ? 'No appointments found in the system.'
                  : `No ${statusFilter} appointments found.`
              }
            />
          )}
        </ContentCard>
      </div>

      {/* ── MODALS ── */}

      {/* 1. Book New Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        apiBaseUrl={API_BASE_URL}
        onSuccess={() => {
          setSuccessMessage('New appointment successfully booked!');
          loadAppointments();
        }}
      />

      {/* 2. Reschedule Appointment Modal */}
      <RescheduleAppointmentModal
        isOpen={Boolean(rescheduleTarget)}
        appointment={rescheduleTarget}
        isRescheduling={isRescheduling}
        error={rescheduleError}
        apiBaseUrl={API_BASE_URL}
        onClose={() => {
          setRescheduleTarget(null);
          setRescheduleError(null);
        }}
        onReschedule={handleRescheduleSubmit}
      />

      {/* 3. Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={Boolean(cancelTarget)}
        appointment={cancelTarget}
        isCancelling={isCancelling}
        error={cancelError}
        onClose={() => {
          setCancelTarget(null);
          setCancelError(null);
        }}
        onConfirm={handleCancelSubmit}
      />
    </AppShell>
  );
}
