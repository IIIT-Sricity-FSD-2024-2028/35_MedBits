/**
 * FollowUpReferral.jsx — Front Desk Follow-Up & Referral Coordination Page
 * ==============================================================================
 * Central workspace for front desk personnel to:
 *  1. Track and coordinate consultation follow-up dates recommended by doctors.
 *  2. Review pending internal doctor-to-specialist referrals.
 *  3. Search quickly by 10-digit phone number, patient name, ID, or doctor.
 *  4. Launch the booking dialog to schedule appointments against live doctor slots.
 *  5. Automatically update referral statuses and notify staff on confirmation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import FollowUpSearchCard from './components/FollowUpSearchCard';
import ReferralCard from './components/ReferralCard';
import FollowUpCard from './components/FollowUpCard';
import FollowUpEmptyState from './components/FollowUpEmptyState';
import BookFollowUpModal from './components/BookFollowUpModal';
import './FollowUpReferral.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Fallback Seed Data (Safe offline demo fallback) ──────────────────────────
const SEED_FOLLOWUPS = [
  {
    id: 'FU_001',
    appointmentId: 'APT_PAST_001',
    patientId: 'PAT001',
    patientName: 'Ria Sharma',
    patientPhone: '9473487399',
    doctorId: 'DOC001',
    doctorName: 'Dr. S Madhuri',
    specialization: 'Dermatologist',
    consultationNote: 'Check healing of dermatitis rash. Taper topical steroid if improved.',
    followUpDate: '2026-10-22',
    date: '2026-10-08',
    isReferral: false,
  },
  {
    id: 'FU_002',
    appointmentId: 'APT_PAST_002',
    patientId: 'PAT002',
    patientName: 'Arun Menon',
    patientPhone: '9123456780',
    doctorId: 'DOC001',
    doctorName: 'Dr. S Madhuri',
    specialization: 'General',
    consultationNote: 'Review complete blood count (CBC) test results and evaluate energy levels.',
    followUpDate: '2026-10-25',
    date: '2026-10-10',
    tests: 'Complete Blood Count (CBC)',
    isReferral: false,
  },
];

const SEED_REFERRALS = [
  {
    id: 'REF_SEED_001',
    patientId: 'PAT001',
    patientName: 'Ria Sharma',
    patientPhone: '9473487399',
    fromDoctorId: 'DOC001',
    fromDoctorName: 'Dr. S Madhuri',
    fromSpecialization: 'Dermatologist',
    toDoctorId: 'DOC003',
    toDoctorName: 'Dr. Sarah Johnson',
    toSpecialization: 'Cardiologist',
    reason: 'Follow-up cardiac evaluation following dermato-cardiac symptom review.',
    urgency: 'Urgent',
    preferredDate: '2026-10-24',
    status: 'pending',
    isReferral: true,
  },
  {
    id: 'REF_SEED_002',
    patientId: 'PAT003',
    patientName: 'Farah Ali',
    patientPhone: '9988776655',
    fromDoctorId: 'DOC001',
    fromDoctorName: 'Dr. S Madhuri',
    fromSpecialization: 'Dermatologist',
    toDoctorId: 'DOC005',
    toDoctorName: 'Dr. Paul Johnson',
    toSpecialization: 'Pediatrician',
    reason: 'Pediatric allergic eczema evaluation and dietary advice.',
    urgency: 'Routine',
    preferredDate: '2026-10-28',
    status: 'pending',
    isReferral: true,
  },
];

export default function FollowUpReferral() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [followUps, setFollowUps] = useState(SEED_FOLLOWUPS);
  const [referrals, setReferrals] = useState(SEED_REFERRALS);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'referrals' | 'followups'

  // Booking modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForBooking, setSelectedItemForBooking] = useState(null);

  // Success alert message
  const [alertMessage, setAlertMessage] = useState(null);

  // ── Fetch live follow-ups and referrals from backend ──────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Follow-ups from GET /followups
      const fuRes = await fetch(`${API_BASE}/followups`, {
        headers: { role: 'frontdesk' },
      }).catch(() => null);

      if (fuRes && fuRes.ok) {
        const records = await fuRes.json();
        if (Array.isArray(records) && records.length > 0) {
          const mapped = records.map((r) => ({
            id: r.id,
            appointmentId: r.appointmentId || '',
            patientId: r.patientId,
            patientName: r.patientName || r.patientId,
            patientPhone: r.patientPhone || '',
            doctorId: r.doctorId,
            doctorName: r.doctorName || 'Doctor',
            specialization: r.specialization || '',
            consultationNote: r.consultationNote || 'Routine consultation follow-up.',
            followUpDate: r.followUpDate || r.followUp || r.date,
            date: r.date,
            tests: r.tests || '',
            isReferral: false,
          }));
          setFollowUps(mapped);
        }
      }

      // 2. Fetch Referrals from doctor referrals or localStorage cache
      let fetchedReferrals = [];

      // Check localStorage for referrals cached or created by doctors
      try {
        const cached = JSON.parse(localStorage.getItem('referralHistory') || '[]');
        if (Array.isArray(cached) && cached.length > 0) {
          fetchedReferrals = cached.filter((r) => r.status?.toLowerCase() === 'pending').map((r) => ({
            ...r,
            isReferral: true,
          }));
        }
      } catch (_) {}

      // Also try fetching from default doctor referrals endpoint
      try {
        const refRes = await fetch(`${API_BASE}/doctors/DOC001/referrals`, {
          headers: { role: 'doctor' },
        }).catch(() => null);

        if (refRes && refRes.ok) {
          const apiRefs = await refRes.json();
          if (Array.isArray(apiRefs)) {
            const pendingApiRefs = apiRefs
              .filter((r) => r.status?.toLowerCase() === 'pending')
              .map((r) => ({
                id: r.id,
                patientId: r.patientId,
                patientName: r.patientName || r.patientId,
                patientPhone: '',
                fromDoctorId: r.fromDoctorId,
                fromDoctorName: r.fromDoctorName || 'Dr. S Madhuri',
                fromSpecialization: r.fromSpecialization || '',
                toDoctorId: r.toDoctorId,
                toDoctorName: r.toDoctorName || r.toDoctorId,
                toSpecialization: r.toSpecialization || '',
                reason: r.reason || 'Referral appointment',
                urgency: r.urgency || 'Routine',
                preferredDate: r.preferredDate || '',
                status: r.status,
                isReferral: true,
              }));

            // Merge unique referrals by ID
            const seen = new Set(fetchedReferrals.map((r) => r.id));
            pendingApiRefs.forEach((r) => {
              if (!seen.has(r.id)) {
                fetchedReferrals.push(r);
                seen.add(r.id);
              }
            });
          }
        }
      } catch (_) {}

      if (fetchedReferrals.length > 0) {
        setReferrals(fetchedReferrals);
      }
    } catch {
      // Keep seeded fallback data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss alert after 6 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timer = setTimeout(() => setAlertMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [alertMessage]);

  // ── Open booking modal handler ────────────────────────────────────────────
  const handleOpenBookingModal = (item) => {
    setSelectedItemForBooking(item);
    setIsModalOpen(true);
  };

  // ── Successful booking callback ───────────────────────────────────────────
  const handleBookingSuccess = (createdAppointment, bookedItem) => {
    const pName = bookedItem.patientName || bookedItem.patientId || 'Patient';
    const docName = bookedItem.toDoctorName || bookedItem.doctorName || 'Doctor';

    setAlertMessage({
      type: 'success',
      text: `Appointment successfully booked for ${pName} with ${docName} on ${createdAppointment.date} at ${createdAppointment.slot}!`,
    });

    // Remove or update the booked item from state
    if (bookedItem.isReferral) {
      setReferrals((prev) => prev.filter((r) => r.id !== bookedItem.id));
    } else {
      setFollowUps((prev) => prev.filter((fu) => fu.id !== bookedItem.id));
    }
  };

  // ── Filtering Logic ───────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();

  const filterItem = (item) => {
    if (!q) return true;
    const combined = [
      item.patientName,
      item.patientPhone,
      item.patientId,
      item.doctorName,
      item.toDoctorName,
      item.fromDoctorName,
      item.specialization,
      item.toSpecialization,
      item.reason,
      item.consultationNote,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return combined.includes(q);
  };

  const filteredReferrals = referrals.filter(filterItem);
  const filteredFollowUps = followUps.filter(filterItem);

  const totalFilteredCount =
    activeTab === 'referrals'
      ? filteredReferrals.length
      : activeTab === 'followups'
      ? filteredFollowUps.length
      : filteredReferrals.length + filteredFollowUps.length;

  return (
    <AppShell pageTitle="Follow-Up & Referral Coordination">
      <div className="followup-page-container">

        {/* ── Success/Feedback Alert Banner ───────────────────────────────── */}
        {alertMessage && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '9px',
              background: alertMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: alertMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${alertMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>✓ {alertMessage.text}</span>
            <button
              type="button"
              onClick={() => setAlertMessage(null)}
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

        {/* ── Top Metric Statistics Strip ─────────────────────────────────── */}
        <div className="followup-stats-strip">
          <div className="followup-stat-box">
            <div className="followup-stat-icon followup-stat-icon--total">📋</div>
            <div className="followup-stat-content">
              <h4>Total Pending Tasks</h4>
              <p className="followup-stat-number">{referrals.length + followUps.length}</p>
            </div>
          </div>

          <div className="followup-stat-box">
            <div className="followup-stat-icon followup-stat-icon--referral">🔗</div>
            <div className="followup-stat-content">
              <h4>Pending Referrals</h4>
              <p className="followup-stat-number">{referrals.length}</p>
            </div>
          </div>

          <div className="followup-stat-box">
            <div className="followup-stat-icon followup-stat-icon--followup">🔄</div>
            <div className="followup-stat-content">
              <h4>Suggested Follow-Ups</h4>
              <p className="followup-stat-number">{followUps.length}</p>
            </div>
          </div>
        </div>

        {/* ── Search & Tab Filtering Card ─────────────────────────────────── */}
        <FollowUpSearchCard
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={referrals.length + followUps.length}
          referralCount={referrals.length}
          followUpCount={followUps.length}
        />

        {/* ── List Content ────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="followup-empty-container">
            <span className="followup-empty-icon">⏳</span>
            <h3 className="followup-empty-title">Loading Coordination Records…</h3>
          </div>
        ) : totalFilteredCount === 0 ? (
          <FollowUpEmptyState
            searchQuery={searchQuery}
            activeTab={activeTab}
            onClearSearch={() => setSearchQuery('')}
          />
        ) : (
          <div className="followup-list-container">
            {/* Show Referrals (if in 'all' or 'referrals' tab) */}
            {(activeTab === 'all' || activeTab === 'referrals') &&
              filteredReferrals.map((ref) => (
                <ReferralCard
                  key={ref.id}
                  referral={ref}
                  onBook={handleOpenBookingModal}
                />
              ))}

            {/* Show Follow-Ups (if in 'all' or 'followups' tab) */}
            {(activeTab === 'all' || activeTab === 'followups') &&
              filteredFollowUps.map((fu) => (
                <FollowUpCard
                  key={fu.id}
                  item={fu}
                  onBook={handleOpenBookingModal}
                />
              ))}
          </div>
        )}

        {/* ── Booking Modal ───────────────────────────────────────────────── */}
        <BookFollowUpModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          item={selectedItemForBooking}
          onSuccess={handleBookingSuccess}
        />

      </div>
    </AppShell>
  );
}
