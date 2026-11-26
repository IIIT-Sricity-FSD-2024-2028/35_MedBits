/**
 * QueueManagement.jsx — Front Desk Clinic Queue & Token Coordination
 * ==============================================================================
 * Powered by Redux Toolkit (`queueManagementSlice` + `authSlice`).
 * Central Front Desk page for:
 *  1. Checking in arriving patients and issuing queue tokens (POST /queue).
 *  2. Real-time monitoring of patients currently waiting, in-consultation, and done.
 *  3. Live doctor-specific queue filtering.
 *  4. Enforcing clinic flow: calling patients into rooms and marking consultations complete.
 *  5. Periodic background polling (auto-refresh) to sync with doctor portal actions.
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchQueueInitialData,
  refreshQueue,
  generateQueueToken,
  updateQueueItemStatus,
  setSelectedDoctorFilter,
  setQueueStatusFilter,
  setQueueSearchQuery,
  closeTokenModal,
  clearQueueAlert,
  selectQueueManagementState,
} from '../../store/slices/frontdesk/queueManagementSlice';
import QueueCheckInCard from './components/QueueCheckInCard';
import QueueEntryCard from './components/QueueEntryCard';
import TokenGeneratedModal from './components/TokenGeneratedModal';
import './QueueManagement.css';

export default function QueueManagement() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const {
    queueItems,
    patients,
    doctors,
    selectedDoctorFilter,
    statusFilter,
    searchQuery,
    status,
    isGenerating,
    updatingId,
    isTokenModalOpen,
    issuedTokenData,
    alert,
  } = useSelector(selectQueueManagementState);

  const isLoading = status === 'loading';
  const userId = user?.id;

  // Initial load of patients, doctors, and live queue
  useEffect(() => {
    dispatch(fetchQueueInitialData());
    return () => {
      dispatch(clearQueueAlert());
    };
  }, [dispatch, userId]);

  // Auto-dismiss alert after 5s
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => dispatch(clearQueueAlert()), 5000);
    return () => clearTimeout(timer);
  }, [alert, dispatch]);

  // Background auto-refresh polling every 6 seconds when tab is visible
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        dispatch(refreshQueue());
      }
    }, 6000);

    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch]);

  const handleGenerateToken = async (patientId, doctorId, onSuccess) => {
    try {
      await dispatch(generateQueueToken({ patientId, doctorId })).unwrap();
      onSuccess?.();
    } catch {
      // Rejection is handled in queueManagementSlice (sets alert)
    }
  };

  const handleUpdateStatus = (queueId, nextStatus) => {
    dispatch(updateQueueItemStatus({ queueId, nextStatus }));
  };

  // Filter computations
  const visibleItems = queueItems.filter((item) => {
    if (selectedDoctorFilter && item.doctorId !== selectedDoctorFilter) {
      return false;
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const pName = (
        item.patient?.name ||
        `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`
      ).toLowerCase();
      const pId = (item.userId || '').toLowerCase();
      const phone = (item.patient?.phone || '').toLowerCase();
      const dName = (item.doctor?.name || '').toLowerCase();
      const token = String(item.tokenNumber || '');

      return (
        pName.includes(q) ||
        pId.includes(q) ||
        phone.includes(q) ||
        dName.includes(q) ||
        token.includes(q)
      );
    }
    return true;
  });

  // Metric counts
  const waitingCount = queueItems.filter((q) => q.status === 'waiting').length;
  const consultingCount = queueItems.filter((q) => q.status === 'in-consultation').length;
  const doneCount = queueItems.filter((q) => q.status === 'done').length;

  return (
    <div className="queue-page-container">

      {/* ── Alert Notification Banner ─────────────────────────────────── */}
      {alert && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '9px',
            background: alert.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: alert.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${alert.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{alert.type === 'success' ? '✓' : '⚠️'} {alert.text}</span>
          <button
            type="button"
            onClick={() => dispatch(clearQueueAlert())}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              color: 'inherit',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 1. Top Metrics Strip ───────────────────────────────────────── */}
      <div className="queue-stats-strip">
        <div className="queue-stat-card">
          <div className="queue-stat-icon queue-stat-icon--waiting">⏳</div>
          <div className="queue-stat-content">
            <h4>Waiting in Lounge</h4>
            <p className="queue-stat-number">{waitingCount}</p>
          </div>
        </div>

        <div className="queue-stat-card">
          <div className="queue-stat-icon queue-stat-icon--consulting">🩺</div>
          <div className="queue-stat-content">
            <h4>In Consultation</h4>
            <p className="queue-stat-number">{consultingCount}</p>
          </div>
        </div>

        <div className="queue-stat-card">
          <div className="queue-stat-icon queue-stat-icon--done">✓</div>
          <div className="queue-stat-content">
            <h4>Consultations Done</h4>
            <p className="queue-stat-number">{doneCount}</p>
          </div>
        </div>

        <div className="queue-stat-card">
          <div className="queue-stat-icon queue-stat-icon--total">📋</div>
          <div className="queue-stat-content">
            <h4>Total Checked In</h4>
            <p className="queue-stat-number">{queueItems.length}</p>
          </div>
        </div>
      </div>

      {/* ── 2. Patient Check-In & Token Issuance Form ─────────────────── */}
      <QueueCheckInCard
        patients={patients}
        doctors={doctors}
        queueItems={queueItems}
        onGenerate={handleGenerateToken}
        isSubmitting={isGenerating}
      />

      {/* ── 3. Filter & Controls Bar ──────────────────────────────────── */}
      <div className="queue-filter-card">
        <div className="queue-filter-left">
          <input
            type="text"
            className="queue-input"
            placeholder="Search token #, patient name, phone, or doctor…"
            value={searchQuery}
            onChange={(e) => dispatch(setQueueSearchQuery(e.target.value))}
            style={{ maxWidth: '340px' }}
          />

          <select
            className="queue-select"
            value={selectedDoctorFilter}
            onChange={(e) => dispatch(setSelectedDoctorFilter(e.target.value))}
            style={{ maxWidth: '280px' }}
          >
            <option value="">All Doctor Queues</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {(d.name || '').replace(/^Dr\.\s*/i, '')} ({d.specialization})
              </option>
            ))}
          </select>
        </div>

        {/* Status Tabs */}
        <div className="queue-filter-right">
          {[
            { key: 'all', label: 'All', count: queueItems.length },
            { key: 'waiting', label: 'Waiting', count: waitingCount },
            { key: 'in-consultation', label: 'In Room', count: consultingCount },
            { key: 'done', label: 'Done', count: doneCount },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`followup-tab-btn ${
                statusFilter === tab.key ? 'followup-tab-btn--active' : ''
              }`}
              onClick={() => dispatch(setQueueStatusFilter(tab.key))}
              style={{ padding: '7px 14px', fontSize: '13px' }}
            >
              <span>{tab.label}</span>
              <span className="followup-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Queue List View ────────────────────────────────────────── */}
      <div className="queue-list">
        {isLoading ? (
          <div className="queue-empty-box">
            <span className="queue-empty-icon">⏳</span>
            <h3 className="queue-empty-title">Loading Clinic Queue…</h3>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="queue-empty-box">
            <span className="queue-empty-icon">🪑</span>
            <h3 className="queue-empty-title">
              {searchQuery || selectedDoctorFilter || statusFilter !== 'all'
                ? 'No matching patients in queue'
                : 'Clinic Queue is Clear'}
            </h3>
            <p className="queue-empty-subtitle">
              {searchQuery || selectedDoctorFilter || statusFilter !== 'all'
                ? 'Try clearing the search or doctor filter to see all patients.'
                : 'Select an arriving patient above and click "Generate Token" to begin consultation check-in.'}
            </p>
          </div>
        ) : (
          visibleItems.map((item) => (
            <QueueEntryCard
              key={item.id}
              item={item}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={updatingId === item.id}
            />
          ))
        )}
      </div>

      {/* ── 5. Token Issued Modal ─────────────────────────────────────── */}
      <TokenGeneratedModal
        isOpen={isTokenModalOpen}
        onClose={() => dispatch(closeTokenModal())}
        tokenData={issuedTokenData}
      />

    </div>
  );
}
