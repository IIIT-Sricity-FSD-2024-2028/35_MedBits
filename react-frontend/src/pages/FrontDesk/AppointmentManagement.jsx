/**
 * AppointmentManagement.jsx — Front Desk Appointment Management Page
 * =========================================================================
 * Location: src/pages/FrontDesk/AppointmentManagement.jsx
 *
 * Powered by Redux Toolkit (`frontdeskAppointmentsSlice` + `authSlice`).
 * Connects with the MedBits NestJS backend API:
 *   - GET /appointments               → Lists all scheduled appointments with doctor & patient profiles
 *   - POST /appointments              → Schedules new appointment (via BookAppointmentModal)
 *   - PUT /appointments/:id           → Reschedules date & time slot (via RescheduleAppointmentModal)
 *   - DELETE /appointments/:id        → Cancels an appointment (via CancelAppointmentModal)
 *   - POST /appointments/:id/complete → Marks appointment as completed
 *
 * Utilizes core reusable components:
 *   - ContentCard, DataTable, StatCard, StatGrid, AlertBanner
 *   - Extracted subcomponents: BookAppointmentModal, RescheduleAppointmentModal,
 *     CancelAppointmentModal, AppointmentStatusBadge, AppointmentActionButtons
 */

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchFrontdeskAppointments,
  cancelFrontdeskAppointment,
  completeFrontdeskAppointment,
  setAppointmentStatusFilter,
  openBookAppointmentModal,
  closeBookAppointmentModal,
  openRescheduleModal,
  closeRescheduleModal,
  openCancelModal,
  closeCancelModal,
  clearAppointmentMessages,
  selectFrontdeskAppointmentsState,
} from '../../store/slices/frontdesk/frontdeskAppointmentsSlice';
import {
  getPatientDisplayName,
  todayLocalISO,
} from '../../store/slices/frontdesk/frontdeskHelpers';
import ContentCard from '../../components/dashboard/ContentCard';
import DataTable from '../../components/dashboard/DataTable';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import AlertBanner from '../../components/dashboard/AlertBanner';
import BookAppointmentModal from './components/BookAppointmentModal';
import RescheduleAppointmentModal from './components/RescheduleAppointmentModal';
import CancelAppointmentModal from './components/CancelAppointmentModal';
import AppointmentStatusBadge from './components/AppointmentStatusBadge';
import AppointmentActionButtons from './components/AppointmentActionButtons';
import './AppointmentManagement.css';

export default function AppointmentManagement() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const {
    appointments,
    statusFilter,
    status,
    errorMessage,
    successMessage,
    isBookModalOpen,
    rescheduleTarget,
    cancelTarget,
    isCancelling,
    cancelError,
    actionInProgressId,
  } = useSelector(selectFrontdeskAppointmentsState);

  const isLoading = status === 'loading';
  const userId = user?.id;

  const loadAppointments = useCallback(() => {
    dispatch(fetchFrontdeskAppointments());
  }, [dispatch]);

  useEffect(() => {
    loadAppointments();
    return () => {
      dispatch(clearAppointmentMessages());
    };
  }, [loadAppointments, dispatch, userId]);

  const handleCancelSubmit = (appointmentId) => {
    dispatch(cancelFrontdeskAppointment(appointmentId));
  };

  const handleCompleteAppointment = (appointmentId) => {
    dispatch(completeFrontdeskAppointment(appointmentId));
  };

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

  const todayStr = todayLocalISO();
  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter((apt) => apt.date === todayStr).length;
  const upcomingAppointments = appointments.filter((apt) => apt.status === 'upcoming').length;
  const completedAppointments = appointments.filter((apt) => apt.status === 'completed').length;
  const cancelledAppointments = appointments.filter(
    (apt) => (apt.status || '').toLowerCase() === 'cancelled'
  ).length;

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === 'all') return true;
    return (apt.status || '').toLowerCase() === statusFilter;
  });

  // Flatten searchable string fields so DataTable's search matches patient name,
  // phone, doctor name, department, and appointment ID without modifying DataTable.jsx
  const searchableAppointments = filteredAppointments.map((apt) => {
    const patientName = getPatientDisplayName(apt);
    const rawDoctorName = apt.doctor?.name || apt.doctorId || 'Assigned Doctor';
    const doctorDisplay =
      rawDoctorName === apt.doctorId
        ? rawDoctorName
        : `Dr. ${rawDoctorName.replace(/^Dr\.?\s+/i, '')}`;
    const doctorSpec = apt.doctor?.specialization || apt.doctor?.department || '';

    return {
      ...apt,
      patientName,
      patientPhone: apt.patient?.phone || '',
      doctorDisplay,
      doctorSpec,
      formattedDate: formatDisplayDate(apt.date),
    };
  });

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
      key: 'patientName',
      header: 'Patient Details',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{val}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {row.patientPhone ? `📞 ${row.patientPhone}` : `ID: ${row.userId}`}
          </div>
        </div>
      ),
    },
    {
      key: 'doctorDisplay',
      header: 'Doctor & Department',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{val}</div>
          {row.doctorSpec && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>{row.doctorSpec}</div>
          )}
        </div>
      ),
    },
    {
      key: 'formattedDate',
      header: 'Date & Time',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{val}</div>
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
          onReschedule={(appt) => dispatch(openRescheduleModal(appt))}
          onComplete={handleCompleteAppointment}
          onCancel={(appt) => dispatch(openCancelModal(appt))}
        />
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Error and Success Notifications */}
        {errorMessage && (
          <AlertBanner
            message={errorMessage}
            type="error"
            onRetry={loadAppointments}
            isRetrying={isLoading}
            onDismiss={() => dispatch(clearAppointmentMessages())}
          />
        )}
        {successMessage && (
          <AlertBanner
            message={successMessage}
            type="success"
            onDismiss={() => dispatch(clearAppointmentMessages())}
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
              <select
                value={statusFilter}
                onChange={(e) => dispatch(setAppointmentStatusFilter(e.target.value))}
                className="appointment-status-select"
              >
                <option value="all">All Statuses ({appointments.length})</option>
                <option value="upcoming">Upcoming ({upcomingAppointments})</option>
                <option value="completed">Completed ({completedAppointments})</option>
                <option value="cancelled">Cancelled ({cancelledAppointments})</option>
              </select>

              <button
                type="button"
                onClick={() => dispatch(openBookAppointmentModal())}
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
              data={searchableAppointments}
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
      {isBookModalOpen && (
        <BookAppointmentModal
          isOpen={isBookModalOpen}
          onClose={() => dispatch(closeBookAppointmentModal())}
        />
      )}

      {/* 2. Reschedule Appointment Modal */}
      {rescheduleTarget && (
        <RescheduleAppointmentModal
          key={rescheduleTarget.id}
          isOpen={Boolean(rescheduleTarget)}
          appointment={rescheduleTarget}
          onClose={() => dispatch(closeRescheduleModal())}
        />
      )}

      {/* 3. Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={Boolean(cancelTarget)}
        appointment={cancelTarget}
        isCancelling={isCancelling}
        error={cancelError}
        onClose={() => dispatch(closeCancelModal())}
        onConfirm={handleCancelSubmit}
      />
    </>
  );
}
