/**
 * InternalReferral.jsx — Doctor Internal Referral Management
 * ============================================================
 * Allows a doctor to:
 *  1. Browse all doctors and create referrals for patients
 *  2. View all sent referrals and their current status
 *  3. View referrals received from other doctors
 *
 * API Endpoints used:
 *  GET  /doctors                         — list all doctors
 *  GET  /doctors/:id/referrals           — all referrals for logged-in doctor
 *  POST /doctors/:id/referrals           — create a new referral
 *  PUT  /doctors/:id/referrals/:rid/status — update referral status
 *
 * Backend is NestJS; auth via `role: 'doctor'` header.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import ContentCard from '../../components/dashboard/ContentCard';
import './referral/referral.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const URGENCY_OPTIONS = ['Routine', 'Urgent', 'Emergency'];

const URGENCY_COLORS = {
  Routine: { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  Urgent: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  Emergency: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

const STATUS_COLORS = {
  pending: { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Pending' },
  accepted: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Accepted' },
  completed: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', label: 'Completed' },
};

export default function InternalReferral() {
  const { user } = useAuth();

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'sent' | 'received'

  // ── Data ──────────────────────────────────────────────────────────────────
  const [doctors, setDoctors] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // ── New Referral Form ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    patientId: '',
    patientName: '',
    toDoctorId: '',
    reason: '',
    urgency: 'Routine',
    preferredDate: '',
    appointmentId: '',
  });

  // ── Doctor Search Filter ──────────────────────────────────────────────────
  const [doctorSearch, setDoctorSearch] = useState('');

  // ── Fetch All Data ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [docRes, refRes] = await Promise.all([
        fetch(`${API_BASE}/doctors`, { headers: { role: 'doctor' } }),
        fetch(`${API_BASE}/doctors/${encodeURIComponent(user.id)}/referrals`, {
          headers: { role: 'doctor' },
        }),
      ]);

      if (docRes.ok) {
        const docData = await docRes.json();
        // Exclude self from doctor list
        setDoctors(Array.isArray(docData) ? docData.filter((d) => d.id !== user.id && d.userId !== user.id) : []);
      }
      if (refRes.ok) {
        const refData = await refRes.json();
        setReferrals(Array.isArray(refData) ? refData : []);
      }
    } catch {
      // graceful fallback
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Form Helpers ──────────────────────────────────────────────────────────
  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId.trim() || !form.toDoctorId) {
      setAlert({ type: 'error', text: 'Patient ID and target doctor are required.' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const res = await fetch(
        `${API_BASE}/doctors/${encodeURIComponent(user.id)}/referrals`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', role: 'doctor' },
          body: JSON.stringify({
            patientId: form.patientId.trim(),
            patientName: form.patientName.trim() || form.patientId.trim(),
            toDoctorId: form.toDoctorId,
            reason: form.reason.trim(),
            urgency: form.urgency,
            preferredDate: form.preferredDate,
            appointmentId: form.appointmentId.trim() || undefined,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create referral');
      }

      const saved = await res.json();
      setReferrals((prev) => [saved, ...prev]);
      setAlert({ type: 'success', text: 'Referral created successfully!' });
      setForm({ patientId: '', patientName: '', toDoctorId: '', reason: '', urgency: 'Routine', preferredDate: '', appointmentId: '' });
      setActiveTab('sent');
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Failed to create referral.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status Update ─────────────────────────────────────────────────────────
  const handleStatusUpdate = async (referralId, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE}/doctors/${encodeURIComponent(user.id)}/referrals/${referralId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', role: 'doctor' },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setReferrals((prev) => prev.map((r) => (r.id === referralId ? updated : r)));
      }
    } catch {
      // silent
    }
  };

  // ── Derived Lists ─────────────────────────────────────────────────────────
  const myId = user?.id;
  const sentReferrals = referrals.filter((r) => r.fromDoctorId === myId);
  const receivedReferrals = referrals.filter((r) => r.toDoctorId === myId);

  const filteredDoctors = doctors.filter((d) => {
    const q = doctorSearch.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.department?.toLowerCase().includes(q)
    );
  });

  const selectedDoctor = doctors.find((d) => d.id === form.toDoctorId || d.userId === form.toDoctorId);

  return (
    <AppShell pageTitle="Internal Referral">
      <div className="referral-page">

        {/* Alert Banner */}
        {alert && (
          <div className={`referral-alert referral-alert--${alert.type}`}>
            {alert.type === 'success' ? '✓' : '⚠'} {alert.text}
          </div>
        )}

        {/* ── Tab Navigation ──────────────────────────────────────────────── */}
        <div className="referral-tabs">
          {[
            { key: 'new', label: '＋ New Referral' },
            { key: 'sent', label: `Sent (${sentReferrals.length})` },
            { key: 'received', label: `Received (${receivedReferrals.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`referral-tab ${activeTab === tab.key ? 'referral-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: NEW REFERRAL FORM
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'new' && (
          <div className="referral-new-layout">

            {/* ── Left: Doctor Browser ─────────────────────────────────── */}
            <ContentCard
              title="Select Referring Doctor"
              subtitle="Choose the specialist to refer your patient to"
            >
              <div className="referral-doctor-search">
                <input
                  className="referral-search-input"
                  placeholder="Search by name or specialization…"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                />
              </div>

              <div className="referral-doctor-list">
                {loading ? (
                  <div className="referral-empty">Loading doctors…</div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="referral-empty">No doctors found</div>
                ) : (
                  filteredDoctors.map((doc) => {
                    const docId = doc.userId || doc.id;
                    const isSelected = form.toDoctorId === docId;
                    return (
                      <div
                        key={doc.id}
                        className={`referral-doctor-card ${isSelected ? 'referral-doctor-card--selected' : ''}`}
                        onClick={() => handleFormChange('toDoctorId', docId)}
                      >
                        <div className="referral-doctor-avatar">
                          {doc.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="referral-doctor-info">
                          <p className="referral-doctor-name">{doc.name}</p>
                          <p className="referral-doctor-spec">{doc.specialization}</p>
                          {doc.department && (
                            <p className="referral-doctor-dept">{doc.department}</p>
                          )}
                          {doc.consultationFee > 0 && (
                            <p className="referral-doctor-fee">₹{doc.consultationFee} consultation fee</p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="referral-doctor-check">✓</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ContentCard>

            {/* ── Right: Referral Form ─────────────────────────────────── */}
            <ContentCard
              title="Referral Details"
              subtitle="Provide patient information and referral reason"
            >
              {selectedDoctor && (
                <div className="referral-selected-doctor">
                  <span className="referral-selected-label">Referring to:</span>
                  <span className="referral-selected-name">
                    {selectedDoctor.name} — {selectedDoctor.specialization}
                  </span>
                </div>
              )}

              <form className="referral-form" onSubmit={handleSubmit}>
                <div className="referral-form-row">
                  <div className="referral-field">
                    <label className="referral-label">Patient ID *</label>
                    <input
                      className="referral-input"
                      placeholder="e.g. PAT001"
                      value={form.patientId}
                      onChange={(e) => handleFormChange('patientId', e.target.value)}
                      required
                    />
                  </div>
                  <div className="referral-field">
                    <label className="referral-label">Patient Name</label>
                    <input
                      className="referral-input"
                      placeholder="Full name (optional)"
                      value={form.patientName}
                      onChange={(e) => handleFormChange('patientName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="referral-form-row">
                  <div className="referral-field">
                    <label className="referral-label">Urgency</label>
                    <div className="referral-urgency-group">
                      {URGENCY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`referral-urgency-btn ${form.urgency === opt ? 'referral-urgency-btn--active' : ''}`}
                          style={form.urgency === opt ? {
                            background: URGENCY_COLORS[opt].bg,
                            color: URGENCY_COLORS[opt].color,
                            borderColor: URGENCY_COLORS[opt].border,
                          } : {}}
                          onClick={() => handleFormChange('urgency', opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="referral-field">
                    <label className="referral-label">Preferred Date</label>
                    <input
                      type="date"
                      className="referral-input"
                      value={form.preferredDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleFormChange('preferredDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="referral-field referral-field--full">
                  <label className="referral-label">Referral Reason *</label>
                  <textarea
                    className="referral-textarea"
                    placeholder="Describe the clinical reason for this referral, relevant findings, and any specific concerns to address…"
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <div className="referral-field referral-field--full">
                  <label className="referral-label">Appointment ID (optional)</label>
                  <input
                    className="referral-input"
                    placeholder="e.g. APT1234567890 — link to an existing appointment"
                    value={form.appointmentId}
                    onChange={(e) => handleFormChange('appointmentId', e.target.value)}
                  />
                </div>

                <div className="referral-form-actions">
                  <button
                    type="button"
                    className="referral-btn referral-btn--ghost"
                    onClick={() => setForm({ patientId: '', patientName: '', toDoctorId: '', reason: '', urgency: 'Routine', preferredDate: '', appointmentId: '' })}
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="referral-btn referral-btn--primary"
                    disabled={submitting || !form.toDoctorId}
                  >
                    {submitting ? 'Sending…' : '📤 Send Referral'}
                  </button>
                </div>
              </form>
            </ContentCard>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: SENT REFERRALS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sent' && (
          <ContentCard
            title="Sent Referrals"
            subtitle={`${sentReferrals.length} referral(s) sent by you`}
          >
            {loading ? (
              <div className="referral-empty">Loading…</div>
            ) : sentReferrals.length === 0 ? (
              <div className="referral-empty">
                <span className="referral-empty-icon">📤</span>
                <p>You haven't sent any referrals yet.</p>
              </div>
            ) : (
              <div className="referral-cards-list">
                {sentReferrals.map((ref) => (
                  <ReferralCard
                    key={ref.id}
                    referral={ref}
                    direction="sent"
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </ContentCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: RECEIVED REFERRALS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'received' && (
          <ContentCard
            title="Received Referrals"
            subtitle={`${receivedReferrals.length} referral(s) sent to you`}
          >
            {loading ? (
              <div className="referral-empty">Loading…</div>
            ) : receivedReferrals.length === 0 ? (
              <div className="referral-empty">
                <span className="referral-empty-icon">📥</span>
                <p>No referrals received yet.</p>
              </div>
            ) : (
              <div className="referral-cards-list">
                {receivedReferrals.map((ref) => (
                  <ReferralCard
                    key={ref.id}
                    referral={ref}
                    direction="received"
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </ContentCard>
        )}

      </div>
    </AppShell>
  );
}

// ── Sub-component: Referral Card ─────────────────────────────────────────────
function ReferralCard({ referral: ref, direction, onStatusUpdate }) {
  const urgencyStyle = URGENCY_COLORS[ref.urgency] || URGENCY_COLORS.Routine;
  const statusStyle = STATUS_COLORS[ref.status] || STATUS_COLORS.pending;
  const createdDate = ref.createdAt
    ? new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="referral-item">
      <div className="referral-item-header">
        <div className="referral-item-meta">
          <span className="referral-item-id">{ref.id}</span>
          <span
            className="referral-badge"
            style={{ background: urgencyStyle.bg, color: urgencyStyle.color, borderColor: urgencyStyle.border }}
          >
            {ref.urgency}
          </span>
          <span
            className="referral-badge"
            style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}
          >
            {statusStyle.label}
          </span>
        </div>
        <span className="referral-item-date">{createdDate}</span>
      </div>

      <div className="referral-item-body">
        <div className="referral-item-grid">
          <div>
            <p className="referral-item-label">Patient</p>
            <p className="referral-item-value">{ref.patientName || ref.patientId}</p>
          </div>
          <div>
            <p className="referral-item-label">{direction === 'sent' ? 'Referring To' : 'Referred By'}</p>
            <p className="referral-item-value">
              {direction === 'sent' ? ref.toDoctorName : ref.fromDoctorName}
            </p>
            <p className="referral-item-spec">
              {direction === 'sent' ? ref.toSpecialization : ref.fromSpecialization}
            </p>
          </div>
          <div>
            <p className="referral-item-label">Preferred Date</p>
            <p className="referral-item-value">{ref.preferredDate || '—'}</p>
          </div>
        </div>

        {ref.reason && (
          <div className="referral-item-reason">
            <p className="referral-item-label">Clinical Reason</p>
            <p className="referral-item-reason-text">{ref.reason}</p>
          </div>
        )}
      </div>

      {/* Status Actions — received doctor can accept/complete */}
      {direction === 'received' && ref.status !== 'completed' && (
        <div className="referral-item-actions">
          {ref.status === 'pending' && (
            <button
              className="referral-action-btn referral-action-btn--accept"
              onClick={() => onStatusUpdate(ref.id, 'accepted')}
            >
              ✓ Accept
            </button>
          )}
          {(ref.status === 'pending' || ref.status === 'accepted') && (
            <button
              className="referral-action-btn referral-action-btn--complete"
              onClick={() => onStatusUpdate(ref.id, 'completed')}
            >
              ✔ Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
