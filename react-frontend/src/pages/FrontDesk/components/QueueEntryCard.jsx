/**
 * QueueEntryCard.jsx — Single Patient Queue Row
 * ==============================================================================
 * WHAT THIS COMPONENT DOES:
 *  1. Displays token number, patient identification, and assigned physician.
 *  2. Reflects real-time queue states:
 *     - 'waiting': Patient in waiting lounge.
 *     - 'in-consultation': Patient currently inside doctor's consultation room.
 *     - 'done': Consultation completed.
 *  3. Provides one-click status transitions ('Start Consultation' / 'Mark Completed').
 */

import React from 'react';

/**
 * @param {object} item               - The queue item
 * @param {function} onUpdateStatus   - Callback (queueId, nextStatus)
 * @param {boolean} isUpdating        - Whether update is currently in-flight
 */
export default function QueueEntryCard({ item, onUpdateStatus, isUpdating = false }) {
  const patientName = item.patient?.name || `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.trim() || item.userId;
  const doctorName = item.doctor?.name || item.doctorId || 'Doctor';
  const doctorSpec = item.doctor?.specialization || item.doctor?.department || 'Consultant';
  const phone = item.patient?.phone || item.patientPhone || '';
  const tokenNumber = item.tokenNumber || item.token || '—';
  const status = item.status || 'waiting';

  return (
    <div className={`queue-entry queue-entry--${status}`}>
      {/* ── Left: Token Number Pill + Patient Info ────────────────────── */}
      <div className="queue-entry-left">
        <div className="queue-entry-token-pill">
          <span className="queue-token-label">Token</span>
          <span className="queue-token-num">#{tokenNumber}</span>
        </div>

        <div className="queue-entry-info">
          <div className="queue-entry-name">
            <span>{patientName}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              ({item.userId})
            </span>
          </div>

          <div className="queue-entry-meta">
            <span><strong>Dr. {doctorName.replace(/^Dr\.\s*/i, '')}</strong></span>
            <span>{doctorSpec}</span>
            {phone && <span>📞 {phone}</span>}
          </div>
        </div>
      </div>

      {/* ── Right: Status Badge & Interactive Action ──────────────────── */}
      <div className="queue-entry-right">
        {/* Status Badge */}
        {status === 'waiting' && (
          <span className="queue-badge queue-badge--waiting">
            ⏳ Waiting
          </span>
        )}
        {status === 'in-consultation' && (
          <span className="queue-badge queue-badge--in-consultation">
            🩺 In Consultation
          </span>
        )}
        {status === 'done' && (
          <span className="queue-badge queue-badge--done">
            ✓ Completed
          </span>
        )}

        {/* Transition Buttons */}
        {status === 'waiting' && (
          <button
            type="button"
            className="queue-action-btn queue-action-btn--start"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(item.id, 'in-consultation')}
          >
            ▶ Call In
          </button>
        )}

        {status === 'in-consultation' && (
          <button
            type="button"
            className="queue-action-btn queue-action-btn--done"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(item.id, 'done')}
          >
            ✓ Mark Done
          </button>
        )}
      </div>
    </div>
  );
}
