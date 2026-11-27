/**
 * LeaveRequest.jsx — Lab Technician Leave Request & History Page
 * ==============================================================================
 * A concise, clean React component providing complete leave management:
 *  - Apply for Leave: Form with date picker (min: today), leave type, and reason.
 *  - My Leave History: Live list of requests with filter tabs (All/Pending/Approved/Rejected).
 *  - Real-time feedback alerts on submission and error handling.
 * ==============================================================================
 */

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchLabTechLeaveRequests,
  submitLabTechLeaveRequest,
  setStatusFilter,
  updateLeaveFormField,
  clearLeaveFeedback,
  selectLabTechLeaveRequests,
  selectLabTechLeaveStatusFilter,
  selectLabTechLeaveFormData,
  selectLabTechLeaveLoading,
  selectLabTechLeaveSubmitting,
  selectLabTechLeaveFeedback,
} from '../../store/slices/labTech/labTechLeaveRequestSlice';
import './LeaveRequest.css';

// Status badge styling and label mapping
const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'lvr-badge--pending' },
  approved: { label: 'Approved', cls: 'lvr-badge--approved' },
  rejected: { label: 'Rejected', cls: 'lvr-badge--rejected' },
};

export default function LeaveRequest() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);

  // ── Redux State ────────────────────────────────────────────────────────────
  const requests = useSelector(selectLabTechLeaveRequests);
  const statusFilter = useSelector(selectLabTechLeaveStatusFilter);
  const formData = useSelector(selectLabTechLeaveFormData);
  const loading = useSelector(selectLabTechLeaveLoading);
  const submitting = useSelector(selectLabTechLeaveSubmitting);
  const feedback = useSelector(selectLabTechLeaveFeedback);

  // Today's date string (YYYY-MM-DD) for min date validation
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // ── 1. Fetch Leave Requests from Backend ───────────────────────────────────
  useEffect(() => {
    dispatch(fetchLabTechLeaveRequests());
  }, [dispatch, user?.userId, user?.id]);

  // ── 2. Handle Leave Application Submit ─────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.reason.trim()) {
      return;
    }
    dispatch(submitLabTechLeaveRequest(formData));
  };

  // ── 3. Filtered Requests & Counts ──────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter((r) => r.status?.toLowerCase() === statusFilter);
  }, [requests, statusFilter]);

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((r) => r.status?.toLowerCase() === 'pending').length,
    approved: requests.filter((r) => r.status?.toLowerCase() === 'approved').length,
    rejected: requests.filter((r) => r.status?.toLowerCase() === 'rejected').length,
  }), [requests]);

  return (
      <div className="lvr-page">

        {/* ── Optional Feedback Message ───────────────────────────────────── */}
        {feedback && (
          <div className={`lvr-alert lvr-alert--${feedback.type}`}>
            <span>{feedback.type === 'success' ? '✓' : '⚠️'} {feedback.message}</span>
            <button className="lvr-alert-close" onClick={() => dispatch(clearLeaveFeedback())}>✕</button>
          </div>
        )}

        <div className="lvr-layout">

          {/* ── Left Column: Apply for Leave Form ─────────────────────────── */}
          <div className="lvr-card lvr-form-card">
            <h2 className="lvr-card-title">Apply for Leave</h2>
            <p className="lvr-card-subtitle">Submit a new leave request for administrator review.</p>

            <form onSubmit={handleSubmit} className="lvr-form">
              <div className="lvr-field">
                <label className="lvr-label required" htmlFor="lvrDate">Leave Date</label>
                <input
                  id="lvrDate"
                  type="date"
                  className="lvr-input"
                  min={todayStr}
                  value={formData.date}
                  onChange={(e) => dispatch(updateLeaveFormField({ field: 'date', value: e.target.value }))}
                  required
                />
              </div>

              <div className="lvr-field">
                <label className="lvr-label required" htmlFor="lvrType">Leave Type</label>
                <select
                  id="lvrType"
                  className="lvr-select"
                  value={formData.type}
                  onChange={(e) => dispatch(updateLeaveFormField({ field: 'type', value: e.target.value }))}
                  required
                >
                  <option value="Casual">Casual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Emergency">Emergency Leave</option>
                  <option value="Annual">Annual / Vacation Leave</option>
                </select>
              </div>

              <div className="lvr-field">
                <label className="lvr-label required" htmlFor="lvrReason">Reason</label>
                <textarea
                  id="lvrReason"
                  className="lvr-textarea"
                  rows={4}
                  placeholder="Specify reason for leave..."
                  value={formData.reason}
                  onChange={(e) => dispatch(updateLeaveFormField({ field: 'reason', value: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="lvr-btn-submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </form>
          </div>

          {/* ── Right Column: Leave History & Status Tabs ─────────────────── */}
          <div className="lvr-card lvr-history-card">
            <div className="lvr-history-header">
              <div>
                <h2 className="lvr-card-title">My Leave History</h2>
                <span className="lvr-count-text">
                  {requests.length} total request{requests.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Status Filter Tabs */}
              <div className="lvr-tabs">
                {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                  <button
                    key={tab}
                    className={`lvr-tab ${statusFilter === tab ? 'lvr-tab--active' : ''}`}
                    onClick={() => dispatch(setStatusFilter(tab))}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab] || 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Table of requests */}
            <div className="lvr-table-wrapper">
              <table className="lvr-table">
                <thead>
                  <tr>
                    <th>Leave Date</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    <th>Actioned On</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="lvr-table-loading">Loading leave requests...</td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="lvr-table-empty">
                        <div className="lvr-empty-state">
                          <span className="lvr-empty-icon">📅</span>
                          <p>No leave requests found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const badge = STATUS_MAP[req.status?.toLowerCase()] || {
                        label: req.status || 'Pending',
                        cls: 'lvr-badge--pending',
                      };
                      const appliedDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—';

                      return (
                        <tr key={req.id}>
                          <td><strong>{req.date}</strong></td>
                          <td>{req.type || 'Casual'}</td>
                          <td className="lvr-cell-reason" title={req.reason}>{req.reason || '—'}</td>
                          <td>
                            <span className={`lvr-badge ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="lvr-cell-muted">{appliedDate}</td>
                          <td className="lvr-cell-muted">{req.actionedOn || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
  );
}
