/**
 * LeaveManagement.jsx — Branch Admin Leave Requests Management Page
 * =========================================================================
 * Enables Branch Admins to inspect, approve, or reject leave requests submitted
 * by doctors and lab technicians assigned to their hospital branch.
 *
 * KEY FEATURES:
 *  1. Live Data Loading: Connects to GET /leave-requests with branch-scoped headers.
 *  2. Real-Time KPIs: Total requests, Pending review, Approved, and Rejected metrics.
 *  3. Search & Filter: Filter by status (All, Pending, Approved, Rejected) and search
 *     across staff names, departments, reasons, and dates via DataTable.
 *  4. Decision Safeguards: Confirm modal with conflict error handling (e.g., booked
 *     doctor appointments prevent leave approval and display the backend's message).
 *  5. Reusable Components: AppShell, ContentCard, StatCard, DataTable, StatusBadge,
 *     Modal, and AlertBanner.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import StatCard, { StatGrid } from '../../components/dashboard/StatCard';
import DataTable from '../../components/dashboard/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import AlertBanner from '../../components/dashboard/AlertBanner';
import { API_BASE_URL, getAuthHeaders, formatDate, getInitials } from './utils/staffHelpers';
import './LeaveManagement.css';

export default function LeaveManagement() {
  const { user } = useAuth();

  // State
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Confirmation Decision Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    request: null,
    action: null, // 'approved' | 'rejected'
  });
  const [isActioning, setIsActioning] = useState(false);

  // Request Details Modal State
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    request: null,
  });

  // ── 1. FETCH LEAVE REQUESTS FROM BACKEND ─────────────────────────────────
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests`, {
        headers: getAuthHeaders(user),
      });

      if (!res.ok) {
        throw new Error(`Failed to load leave requests (HTTP ${res.status})`);
      }

      const data = await res.json();
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Unable to Load Leave Requests',
        message: err.message || 'Error connecting to backend server on port 3000.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function initialFetch() {
      try {
        const res = await fetch(`${API_BASE_URL}/leave-requests`, {
          headers: getAuthHeaders(user),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLeaveRequests(Array.isArray(data) ? data : []);
          }
        } else {
          throw new Error(`Failed to load leave requests (HTTP ${res.status})`);
        }
      } catch (err) {
        if (isMounted) {
          setAlert({
            type: 'error',
            title: 'Unable to Load Leave Requests',
            message: err.message || 'Error connecting to backend server on port 3000.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initialFetch();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // ── 2. DERIVED METRICS FOR KPI CARDS ─────────────────────────────────────
  const totalRequests = leaveRequests.length;
  const pendingCount = useMemo(
    () => leaveRequests.filter((r) => r.status === 'pending').length,
    [leaveRequests]
  );
  const approvedCount = useMemo(
    () => leaveRequests.filter((r) => r.status === 'approved').length,
    [leaveRequests]
  );
  const rejectedCount = useMemo(
    () => leaveRequests.filter((r) => r.status === 'rejected').length,
    [leaveRequests]
  );

  // ── 3. FILTERED REQUESTS FOR TABLE ───────────────────────────────────────
  const filteredRequests = useMemo(() => {
    if (!statusFilter) return leaveRequests;
    return leaveRequests.filter((r) => r.status === statusFilter);
  }, [leaveRequests, statusFilter]);

  // ── 4. HANDLE APPROVE / REJECT DECISION ──────────────────────────────────
  const handleOpenConfirm = (request, action) => {
    setConfirmModal({
      isOpen: true,
      request,
      action,
    });
  };

  const handleConfirmDecision = async () => {
    const { request, action } = confirmModal;
    if (!request || !action) return;

    setIsActioning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/leave-requests/${request.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(user),
        body: JSON.stringify({ status: action }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Capture backend error (e.g. Doctor appointment conflict or validation failure)
        const errorMsg = data.message || `Failed to update leave request (HTTP ${res.status})`;
        throw new Error(errorMsg);
      }

      setAlert({
        type: 'success',
        title: action === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected',
        message: `Leave request for ${request.name || 'staff member'} on ${
          request.dateRange || formatDate(request.date)
        } has been ${action} successfully.`,
      });

      setConfirmModal({ isOpen: false, request: null, action: null });
      // Close details modal if it was open for this request
      if (detailsModal.isOpen && detailsModal.request?.id === request.id) {
        setDetailsModal({ isOpen: false, request: null });
      }
      // Refresh list to update table and KPIs
      await loadRequests();
    } catch (err) {
      // Display the actual backend error message to the Branch Admin
      setAlert({
        type: 'error',
        title: action === 'approved' ? 'Approval Prevented' : 'Rejection Failed',
        message: err.message,
      });
      setConfirmModal({ isOpen: false, request: null, action: null });
    } finally {
      setIsActioning(false);
    }
  };

  // ── 5. DATA TABLE COLUMNS DEFINITION ─────────────────────────────────────
  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (_, r) => (
        <div
          className="lm-staff-cell"
          onClick={() => setDetailsModal({ isOpen: true, request: r })}
          title="Click to view full leave request details"
        >
          <div className="lm-avatar" aria-hidden="true">
            {getInitials(r.name)}
          </div>
          <div>
            <div className="lm-staff-name">{r.name || 'Unknown Staff'}</div>
            <div className="lm-staff-id">{r.doctorId || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'dept',
      header: 'Department / Role',
      render: (val) => <span className="lm-dept-pill">{val || 'Medical Staff'}</span>,
    },
    {
      key: 'date',
      header: 'Leave Date',
      render: (_, r) => (
        <span className="lm-date-text">{r.dateRange || formatDate(r.date)}</span>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (val) => {
        const typeNormalized = (val || 'casual').toLowerCase();
        const tagClass = `lm-type-tag lm-type-${
          ['casual', 'emergency', 'sick'].includes(typeNormalized)
            ? typeNormalized
            : 'default'
        }`;
        return <span className={tagClass}>{val || 'Casual'}</span>;
      },
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (val, r) => (
        <span
          className="lm-reason-text"
          title={val}
          onClick={() => setDetailsModal({ isOpen: true, request: r })}
        >
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt',
      header: 'Submitted On',
      render: (val) => <span className="lm-submitted-date">{formatDate(val)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, r) => {
        if (r.status === 'pending') {
          return (
            <div className="lm-action-group">
              <button
                type="button"
                className="lm-btn-action lm-btn-approve"
                onClick={() => handleOpenConfirm(r, 'approved')}
                title="Approve Leave Request"
              >
                <span>✓</span> Approve
              </button>
              <button
                type="button"
                className="lm-btn-action lm-btn-reject"
                onClick={() => handleOpenConfirm(r, 'rejected')}
                title="Reject Leave Request"
              >
                <span>✕</span> Reject
              </button>
            </div>
          );
        }
        return (
          <div className="lm-actioned-box">
            <span className="lm-actioned-note">
              {r.actionedOn ? `Decided ${r.actionedOn}` : 'Resolved'}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell pageTitle="Leave Management">
      <div className="leave-mgmt-page">

        {/* ── NOTIFICATION ALERT BANNER ───────────────────────────────────── */}
        {alert && (
          <AlertBanner
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onDismiss={() => setAlert(null)}
          />
        )}

        {/* ── 1. PAGE HEADER ──────────────────────────────────────────────── */}
        <div className="lm-page-header">
          <div>
            <h1 className="lm-page-h1">Leave Management</h1>
            <p className="lm-page-sub">
              Review, approve, or reject doctor and laboratory technician leave requests for your branch
            </p>
          </div>
          <button
            type="button"
            className="lm-refresh-btn"
            onClick={loadRequests}
            title="Refresh leave requests"
          >
            <span>🔄</span> Refresh
          </button>
        </div>

        {/* ── 2. METRIC STAT CARDS ────────────────────────────────────────── */}
        <StatGrid>
          <StatCard
            label="Total Requests"
            value={totalRequests}
            delta="Branch leave submissions"
            deltaType="info"
            icon="📋"
          />
          <StatCard
            label="Pending Review"
            value={pendingCount}
            delta={
              pendingCount > 0
                ? `${pendingCount} awaiting admin action`
                : 'All requests resolved'
            }
            deltaType={pendingCount > 0 ? 'warning' : 'positive'}
            icon="⏳"
          />
          <StatCard
            label="Approved Leaves"
            value={approvedCount}
            delta={
              totalRequests > 0
                ? `${Math.round((approvedCount / totalRequests) * 100)}% approval rate`
                : 'Scheduled leaves granted'
            }
            deltaType="positive"
            icon="✅"
          />
          <StatCard
            label="Rejected Requests"
            value={rejectedCount}
            delta="Declined applications"
            deltaType={rejectedCount > 0 ? 'danger' : 'info'}
            icon="❌"
          />
        </StatGrid>

        {/* ── 3. SEARCHABLE DATA TABLE IN CONTENT CARD ────────────────────── */}
        <ContentCard
          title="Leave Requests Roster"
          subtitle={`Showing ${filteredRequests.length} of ${leaveRequests.length} leave requests`}
          action={
            <select
              className="lm-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by leave status"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          }
        >
          {isLoading ? (
            <div className="lm-loading-state">Loading branch leave requests…</div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRequests}
              searchPlaceholder="Search by staff name, department, leave type, date, or reason…"
              emptyMessage={
                leaveRequests.length === 0
                  ? 'No leave requests submitted yet for this branch.'
                  : 'No leave requests match your search or filter.'
              }
            />
          )}
        </ContentCard>

        {/* ── 4. CONFIRMATION MODAL FOR APPROVE / REJECT ──────────────────── */}
        {confirmModal.isOpen && confirmModal.request && (
          <Modal
            isOpen={confirmModal.isOpen}
            onClose={() => !isActioning && setConfirmModal({ isOpen: false, request: null, action: null })}
            title={confirmModal.action === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
            subtitle={
              confirmModal.action === 'approved'
                ? 'Review staff details and confirm schedule unavailability'
                : 'Confirm decline of this staff leave request'
            }
            maxWidth="520px"
            footer={
              <div className="lm-modal-footer">
                <button
                  type="button"
                  className="lm-footer-btn lm-footer-btn-outline"
                  onClick={() => setConfirmModal({ isOpen: false, request: null, action: null })}
                  disabled={isActioning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`lm-footer-btn ${
                    confirmModal.action === 'approved'
                      ? 'lm-confirm-approve-btn'
                      : 'lm-confirm-reject-btn'
                  }`}
                  onClick={handleConfirmDecision}
                  disabled={isActioning}
                >
                  {isActioning
                    ? 'Processing…'
                    : confirmModal.action === 'approved'
                    ? '✓ Confirm Approval'
                    : '✕ Confirm Rejection'}
                </button>
              </div>
            }
          >
            <div className="lm-modal-summary">
              <div className="lm-modal-row">
                <span className="lm-modal-key">Staff Member:</span>
                <span className="lm-modal-val">{confirmModal.request.name || 'Unknown'}</span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Department:</span>
                <span className="lm-modal-val">{confirmModal.request.dept || 'Medical Staff'}</span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Leave Date:</span>
                <span className="lm-modal-val">
                  {confirmModal.request.dateRange || formatDate(confirmModal.request.date)}
                </span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Leave Type:</span>
                <span className="lm-modal-val">{confirmModal.request.type || 'Casual'}</span>
              </div>
              <div className="lm-modal-reason-box">
                <span className="lm-modal-key">Reason for Leave:</span>
                <div className="lm-modal-reason-val">
                  {confirmModal.request.reason || 'No detailed reason provided.'}
                </div>
              </div>
            </div>

            {confirmModal.action === 'approved' ? (
              <div className="lm-modal-notice lm-notice-warning">
                <strong>Schedule Impact Notice:</strong> Approving this leave will mark the requested date as unavailable in the staff member&apos;s schedule. If existing booked appointments conflict with this date, approval will be prevented by the system.
              </div>
            ) : (
              <div className="lm-modal-notice lm-notice-danger">
                <strong>Rejection Notice:</strong> The staff member will be notified that this leave request was rejected. This action can be reviewed in the decision history.
              </div>
            )}
          </Modal>
        )}

        {/* ── 5. VIEW DETAILS MODAL ────────────────────────────────────────── */}
        {detailsModal.isOpen && detailsModal.request && (
          <Modal
            isOpen={detailsModal.isOpen}
            onClose={() => setDetailsModal({ isOpen: false, request: null })}
            title="Leave Request Details"
            subtitle={`Reference ID: ${detailsModal.request.id}`}
            maxWidth="520px"
            footer={
              <div className="lm-modal-footer">
                {detailsModal.request.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="lm-footer-btn lm-confirm-approve-btn"
                      onClick={() => {
                        const target = detailsModal.request;
                        setDetailsModal({ isOpen: false, request: null });
                        handleOpenConfirm(target, 'approved');
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      className="lm-footer-btn lm-confirm-reject-btn"
                      onClick={() => {
                        const target = detailsModal.request;
                        setDetailsModal({ isOpen: false, request: null });
                        handleOpenConfirm(target, 'rejected');
                      }}
                    >
                      ✕ Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="lm-footer-btn lm-footer-btn-outline"
                  onClick={() => setDetailsModal({ isOpen: false, request: null })}
                >
                  Close
                </button>
              </div>
            }
          >
            <div className="lm-modal-summary">
              <div className="lm-modal-row">
                <span className="lm-modal-key">Staff Name:</span>
                <span className="lm-modal-val">{detailsModal.request.name || 'Unknown'}</span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Employee / Doctor ID:</span>
                <span className="lm-modal-val">{detailsModal.request.doctorId || '—'}</span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Department:</span>
                <span className="lm-modal-val">{detailsModal.request.dept || 'Medical Staff'}</span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Requested Date:</span>
                <span className="lm-modal-val">
                  {detailsModal.request.dateRange || formatDate(detailsModal.request.date)}
                </span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Leave Type:</span>
                <span className="lm-modal-val">{detailsModal.request.type || 'Casual'}</span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Current Status:</span>
                <span className="lm-modal-val">
                  <StatusBadge status={detailsModal.request.status} />
                </span>
              </div>
              <div className="lm-modal-row">
                <span className="lm-modal-key">Submission Date:</span>
                <span className="lm-modal-val">{formatDate(detailsModal.request.createdAt)}</span>
              </div>
              {detailsModal.request.actionedOn && (
                <div className="lm-modal-row">
                  <span className="lm-modal-key">Actioned On:</span>
                  <span className="lm-modal-val">{detailsModal.request.actionedOn}</span>
                </div>
              )}
              <div className="lm-modal-reason-box">
                <span className="lm-modal-key">Detailed Reason:</span>
                <div className="lm-modal-reason-val">
                  {detailsModal.request.reason || 'No detailed reason provided.'}
                </div>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </AppShell>
  );
}
