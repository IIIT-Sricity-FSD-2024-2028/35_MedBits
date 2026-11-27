/**
 * TestRequests.jsx — Lab Technician Test Requests Management
 * ==============================================================================
 * A concise, clean React component providing complete test request lifecycle:
 *  - Live search across patient, doctor, test, and request ID.
 *  - Status filter tabs (All, Pending, In Progress, Rejected, Completed).
 *  - One-click Accept (PATCH /lab-requests/:id/accept).
 *  - Reject with technician reason modal (PATCH /lab-requests/:id/reject).
 *  - Full Request Details dialog with clinical notes and prescriptions.
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchTestRequests,
  acceptTestRequest,
  rejectTestRequest,
  fetchTestRequestReport,
  clearTestRequestsError,
  clearTestRequestsActionMessage,
  clearSelectedTestRequestReport,
  selectTestRequests,
  selectTestRequestsLoading,
  selectTestRequestActionLoadingId,
  selectTestRequestsError,
  selectTestRequestsActionMessage,
  selectSelectedTestRequestReportRequest,
  selectSelectedTestRequestReport,
  selectTestRequestReportLoading,
  selectTestRequestReportError,
} from '../../store/slices/labTech/testRequestsSlice';
import {
  getScheduledDate,
  getRequestStatusDate,
  formatLabDate,
  compareByScheduledDateDesc,
  compareByCompletedDateDesc,
} from '../../store/slices/labTech/labTechHelpers';
import LabReportDetailModal from './components/LabReportDetailModal';
import './TestRequests.css';


// Status badge styling and label mapping
const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'tr-badge--pending' },
  in_progress: { label: 'In Progress', cls: 'tr-badge--in-progress' },
  accepted: { label: 'In Progress', cls: 'tr-badge--in-progress' },
  draft_report: { label: 'In Progress', cls: 'tr-badge--in-progress' },
  completed: { label: 'Completed', cls: 'tr-badge--completed' },
  rejected: { label: 'Rejected', cls: 'tr-badge--rejected' },
};

export default function TestRequests() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const requests = useSelector(selectTestRequests);
  const loading = useSelector(selectTestRequestsLoading);
  const actionLoadingId = useSelector(selectTestRequestActionLoadingId);
  const error = useSelector(selectTestRequestsError);
  const actionMessage = useSelector(selectTestRequestsActionMessage);
  const selectedReportRequest = useSelector(
    selectSelectedTestRequestReportRequest
  );
  const selectedReport = useSelector(selectSelectedTestRequestReport);
  const reportLoading = useSelector(selectTestRequestReportLoading);
  const reportError = useSelector(selectTestRequestReportError);

  // ── Local UI State ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailItem, setDetailItem] = useState(null);
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ── 1. Fetch Requests via Redux ────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchTestRequests());
    return () => {
      dispatch(clearSelectedTestRequestReport());
    };
  }, [dispatch, user?.id, user?.userId]);

  // ── 2. Accept Test Action ──────────────────────────────────────────────────
  const handleAccept = async (id) => {
    try {
      await dispatch(acceptTestRequest(id)).unwrap();
      setDetailItem(null);
    } catch {
      // Error surfaced via Redux error state
    }
  };

  // ── 3. Reject Test Action ──────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectItem) return;
    try {
      await dispatch(
        rejectTestRequest({
          id: rejectItem.id,
          reason: rejectReason,
        })
      ).unwrap();
      setRejectItem(null);
      setRejectReason('');
      setDetailItem(null);
    } catch {
      // Error surfaced via Redux error state
    }
  };

  // ── 4. Search, Filter, and Date Ordering ───────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = requests.filter((r) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'in_progress') {
          if (r.status !== 'in_progress' && r.status !== 'accepted' && r.status !== 'draft_report') return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      if (q && !`${r.id} ${r.patientName} ${r.testName} ${r.doctorName}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const comparator =
      statusFilter === 'completed'
        ? compareByCompletedDateDesc
        : compareByScheduledDateDesc;
    return [...list].sort(comparator);
  }, [requests, search, statusFilter]);

  const dateColumnHeader = useMemo(() => {
    switch (statusFilter) {
      case 'pending':
        return 'Scheduled Date';
      case 'in_progress':
        return 'Accepted Date';
      case 'rejected':
        return 'Rejected Date';
      case 'completed':
        return 'Completed Date';
      default:
        return 'Date';
    }
  }, [statusFilter]);

  // Dynamic counts for status tabs
  const getTabCount = (tab) => {
    if (tab === 'all') return requests.length;
    if (tab === 'in_progress') {
      return requests.filter((r) => r.status === 'in_progress' || r.status === 'accepted' || r.status === 'draft_report').length;
    }
    return requests.filter((r) => r.status === tab).length;
  };

  return (
      <div className="tr-page-container">

        {/* ── Error / Action Feedback Banner ───────────────────────────────── */}
        {error && (
          <div className="tr-alert-banner tr-alert-banner--error">
            <span>⚠️ {error}</span>
            <button
              type="button"
              className="tr-alert-close"
              onClick={() => dispatch(clearTestRequestsError())}
            >
              ✕
            </button>
          </div>
        )}
        {!error && actionMessage && (
          <div className="tr-alert-banner tr-alert-banner--success">
            <span>✓ {actionMessage}</span>
            <button
              type="button"
              className="tr-alert-close"
              onClick={() => dispatch(clearTestRequestsActionMessage())}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Search Bar & Filter Tabs Strip ──────────────────────────────── */}
        <div className="tr-card">
          <div className="tr-toolbar">
            <div className="tr-search-box">
              <span className="tr-search-icon">🔍</span>
              <input
                className="tr-search-input"
                placeholder="Search patient, doctor, test, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="tr-filter-group">
              {['all', 'pending', 'in_progress', 'rejected', 'completed'].map((tab) => (
                <button
                  key={tab}
                  className={`tr-filter-btn ${statusFilter === tab ? 'tr-filter-btn--active' : ''}`}
                  onClick={() => setStatusFilter(tab)}
                >
                  <span>{tab === 'in_progress' ? 'In Progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                  <span className="tr-filter-count">{getTabCount(tab)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Requests Table ──────────────────────────────────────────────── */}
        <div className="tr-card">
          <div className="tr-table-wrapper">
            <table className="tr-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test Name</th>
                  <th>Prescribed By</th>
                  <th>{dateColumnHeader}</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>Loading requests…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>No matching requests found.</td></tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.patientName || r.patientId}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{r.patientId}</div>
                      </td>
                      <td style={{ color: '#0d9488', fontWeight: 600 }}>{r.testName}</td>
                      <td>{r.doctorName ? `Dr. ${r.doctorName.replace(/^Dr\.\s*/i, '')}` : 'Attending Physician'}</td>
                      <td>
                        <div>{formatLabDate(getRequestStatusDate(r))}</div>
                        {r.status === 'completed' && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            Scheduled: {formatLabDate(getScheduledDate(r))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`tr-badge ${STATUS_MAP[r.status]?.cls || ''}`}>
                          {STATUS_MAP[r.status]?.label || r.status}
                        </span>
                      </td>
                      <td className="tr-actions-cell">
                        {r.status === 'pending' && (
                          <>
                            <button
                              className="tr-btn tr-btn--accept"
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleAccept(r.id)}
                            >
                              {actionLoadingId === r.id ? 'Processing…' : 'Accept'}
                            </button>
                            <button
                              className="tr-btn tr-btn--reject"
                              disabled={actionLoadingId === r.id}
                              onClick={() => { setRejectItem(r); setRejectReason(''); }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === 'completed' && (
                          <button
                            className="tr-btn tr-btn--accept"
                            onClick={() => dispatch(fetchTestRequestReport(r))}
                          >
                            View Report
                          </button>
                        )}
                        <button className="tr-btn tr-btn--detail" onClick={() => setDetailItem(r)}>Details</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Request Details Modal ────────────────────────────────────────── */}
        {detailItem && (
          <div className="tr-modal-backdrop" onClick={() => setDetailItem(null)}>
            <div className="tr-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="tr-modal-header">
                <h3 className="tr-modal-title">Request Details (#{detailItem.id})</h3>
                <button className="tr-modal-close-btn" onClick={() => setDetailItem(null)}>✕</button>
              </div>

              <div className="tr-modal-body">
                <div className="tr-detail-grid">
                  {[
                    ['Patient', `${detailItem.patientName || detailItem.patientId} (${detailItem.patientId})`],
                    ['Doctor', `Dr. ${detailItem.doctorName || 'Doctor'}`],
                    ['Test', detailItem.testName],
                    ['Scheduled Date', formatLabDate(getScheduledDate(detailItem))],
                    ...(detailItem.acceptedAt ? [['Accepted Date', formatLabDate(detailItem.acceptedAt)]] : []),
                    ...(detailItem.rejectedAt ? [['Rejected Date', formatLabDate(detailItem.rejectedAt)]] : []),
                    ...(detailItem.completedAt ? [['Completed Date', formatLabDate(detailItem.completedAt)]] : []),
                    ['Consultation Notes', detailItem.consultationNote || 'None provided'],
                    ['Prescriptions', detailItem.prescriptionMedicines || 'None prescribed'],
                  ].map(([label, val]) => (
                    <div key={label} className={`tr-detail-item ${label === 'Consultation Notes' || label === 'Prescriptions' ? 'tr-detail-item--full' : ''}`}>
                      <span className="tr-detail-label">{label}</span>
                      <span className="tr-detail-value">{val}</span>
                    </div>
                  ))}

                  {detailItem.rejectionReason && (
                    <div className="tr-detail-item tr-detail-item--full" style={{ background: '#fef2f2' }}>
                      <span className="tr-detail-label" style={{ color: '#dc2626' }}>Rejection Reason</span>
                      <span className="tr-detail-value">{detailItem.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="tr-modal-footer">
                <button className="tr-btn tr-btn--detail" onClick={() => setDetailItem(null)}>Close</button>
                {detailItem.status === 'pending' && (
                  <button
                    className="tr-btn tr-btn--accept"
                    disabled={actionLoadingId === detailItem.id}
                    onClick={() => handleAccept(detailItem.id)}
                  >
                    {actionLoadingId === detailItem.id ? 'Processing…' : 'Accept Test'}
                  </button>
                )}
                {(detailItem.status === 'in_progress' || detailItem.status === 'accepted' || detailItem.status === 'draft_report') && (
                  <button
                    className="tr-btn tr-btn--accept"
                    onClick={() => {
                      setDetailItem(null);
                      navigate(`/lab-technician/lab-reports?reqId=${detailItem.id}`);
                    }}
                  >
                    Report in Lab Reports →
                  </button>
                )}
                {detailItem.status === 'completed' && (
                  <button
                    className="tr-btn tr-btn--accept"
                    onClick={() => {
                      const targetRequest = detailItem;
                      setDetailItem(null);
                      dispatch(fetchTestRequestReport(targetRequest));
                    }}
                  >
                    View Submitted Report →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Reject Reason Confirmation Modal ─────────────────────────────── */}
        {rejectItem && (
          <div className="tr-modal-backdrop" onClick={() => setRejectItem(null)}>
            <div className="tr-modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
              <div className="tr-modal-header">
                <h3 className="tr-modal-title" style={{ color: '#dc2626' }}>Reject #{rejectItem.id}</h3>
                <button className="tr-modal-close-btn" onClick={() => setRejectItem(null)}>✕</button>
              </div>

              <div className="tr-modal-body">
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b' }}>
                  Provide reason for rejecting {rejectItem.testName}:
                </p>
                <textarea
                  className="tr-textarea"
                  placeholder="e.g. Sample hemolyzed, quantity insufficient..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="tr-modal-footer">
                <button className="tr-btn tr-btn--detail" disabled={actionLoadingId === rejectItem.id} onClick={() => setRejectItem(null)}>Cancel</button>
                <button
                  className="tr-btn tr-btn--reject"
                  style={{ background: '#dc2626', color: '#fff' }}
                  disabled={actionLoadingId === rejectItem.id}
                  onClick={handleReject}
                >
                  {actionLoadingId === rejectItem.id ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Shared Submitted Lab Report Modal ─────────────────────────────── */}
        <LabReportDetailModal
          isOpen={Boolean(selectedReportRequest)}
          report={selectedReport}
          request={selectedReportRequest}
          loading={reportLoading}
          error={reportError}
          onClose={() => dispatch(clearSelectedTestRequestReport())}
        />

      </div>
  );
}
