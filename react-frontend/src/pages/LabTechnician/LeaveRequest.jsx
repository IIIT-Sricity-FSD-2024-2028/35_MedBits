/**
 * LeaveRequest.jsx — Lab Technician Leave Request & History Page
 * ==============================================================================
 * A concise, clean React component providing complete leave management:
 *  - Apply for Leave: Form with date picker (min: today), leave type, and reason.
 *  - My Leave History: Live list of requests with filter tabs (All/Pending/Approved/Rejected).
 *  - Real-time feedback alerts on submission and error handling.
 * ==============================================================================
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import './LeaveRequest.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Status badge styling and label mapping
const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'lvr-badge--pending' },
  approved: { label: 'Approved', cls: 'lvr-badge--approved' },
  rejected: { label: 'Rejected', cls: 'lvr-badge--rejected' },
};

// Initial form state
const INITIAL_FORM = {
  date: '',
  type: 'Casual',
  reason: '',
};

export default function LeaveRequest() {
  const { user } = useAuth();
  const techId = user?.userId || user?.id || 'LABTECH_001';

  // ── State ──────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Today's date string (YYYY-MM-DD) for min date validation
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // ── 1. Fetch Leave Requests from Backend ───────────────────────────────────
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/leave-requests`, {
        headers: { role: 'labtech', 'x-user-id': techId },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter requests specifically belonging to this technician
        const myRequests = (Array.isArray(data) ? data : []).filter(
          (r) => r.doctorId === techId
        );
        // Sort newest first
        myRequests.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        setRequests(myRequests);
      }
    } catch (_) {
      setFeedback({ type: 'error', message: 'Failed to load leave requests.' });
    }
    setLoading(false);
  }, [techId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ── 2. Handle Leave Application Submit ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.reason.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: 'labtech',
          'x-user-id': techId,
        },
        body: JSON.stringify({
          doctorId: techId,
          date: formData.date,
          type: formData.type,
          reason: formData.reason.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to submit leave request');
      }

      setFeedback({ type: 'success', message: 'Leave request submitted successfully!' });
      setFormData(INITIAL_FORM);
      await loadRequests();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error submitting leave request.' });
    } finally {
      setSubmitting(false);
    }
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
    <AppShell pageTitle="Leave Request">
      <div className="lvr-page">

        {/* ── Optional Feedback Message ───────────────────────────────────── */}
        {feedback && (
          <div className={`lvr-alert lvr-alert--${feedback.type}`}>
            <span>{feedback.type === 'success' ? '✓' : '⚠️'} {feedback.message}</span>
            <button className="lvr-alert-close" onClick={() => setFeedback(null)}>✕</button>
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
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="lvr-field">
                <label className="lvr-label required" htmlFor="lvrType">Leave Type</label>
                <select
                  id="lvrType"
                  className="lvr-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                    onClick={() => setStatusFilter(tab)}
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
    </AppShell>
  );
}
