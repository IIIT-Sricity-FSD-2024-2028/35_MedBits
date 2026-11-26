/**
 * FollowUpReferral.jsx — Front Desk Follow-Up & Referral Coordination Page
 * ==============================================================================
 * Powered by Redux Toolkit (`followUpReferralSlice` + `authSlice`).
 * Central workspace for front desk personnel to:
 *  1. Track and coordinate consultation follow-up dates recommended by doctors.
 *  2. Review pending internal doctor-to-specialist referrals across all doctors.
 *  3. Search quickly by 10-digit phone number, patient name, ID, or doctor.
 *  4. Launch the booking dialog to schedule appointments against live doctor slots.
 *  5. Update referral statuses and notify staff on confirmation.
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchFollowUpsAndReferrals,
  setFollowUpSearchQuery,
  setFollowUpActiveTab,
  openFollowUpBookingModal,
  closeFollowUpBookingModal,
  clearFollowUpAlert,
  selectFollowUpReferralState,
} from '../../store/slices/frontdesk/followUpReferralSlice';
import FollowUpSearchCard from './components/FollowUpSearchCard';
import ReferralCard from './components/ReferralCard';
import FollowUpCard from './components/FollowUpCard';
import FollowUpEmptyState from './components/FollowUpEmptyState';
import BookFollowUpModal from './components/BookFollowUpModal';
import './FollowUpReferral.css';

export default function FollowUpReferral() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const {
    followUps,
    referrals,
    searchQuery,
    activeTab,
    status,
    alertMessage,
    isModalOpen,
    selectedItemForBooking,
  } = useSelector(selectFollowUpReferralState);

  const isLoading = status === 'loading';
  const userId = user?.id;

  useEffect(() => {
    dispatch(fetchFollowUpsAndReferrals());
    return () => {
      dispatch(clearFollowUpAlert());
    };
  }, [dispatch, userId]);

  // Auto-dismiss alert after 6 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timer = setTimeout(() => dispatch(clearFollowUpAlert()), 6000);
    return () => clearTimeout(timer);
  }, [alertMessage, dispatch]);

  // Filtering logic
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
          <span>{alertMessage.type === 'success' ? '✓' : '⚠️'} {alertMessage.text}</span>
          <button
            type="button"
            onClick={() => dispatch(clearFollowUpAlert())}
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
        onSearchChange={(val) => dispatch(setFollowUpSearchQuery(val))}
        activeTab={activeTab}
        onTabChange={(tab) => dispatch(setFollowUpActiveTab(tab))}
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
          onClearSearch={() => dispatch(setFollowUpSearchQuery(''))}
        />
      ) : (
        <div className="followup-list-container">
          {(activeTab === 'all' || activeTab === 'referrals') &&
            filteredReferrals.map((ref) => (
              <ReferralCard
                key={ref.id}
                referral={ref}
                onBook={(item) => dispatch(openFollowUpBookingModal(item))}
              />
            ))}

          {(activeTab === 'all' || activeTab === 'followups') &&
            filteredFollowUps.map((fu) => (
              <FollowUpCard
                key={fu.id}
                item={fu}
                onBook={(item) => dispatch(openFollowUpBookingModal(item))}
              />
            ))}
        </div>
      )}

      {/* ── Booking Modal ───────────────────────────────────────────────── */}
      {isModalOpen && selectedItemForBooking && (
        <BookFollowUpModal
          key={selectedItemForBooking.id || 'followup-booking'}
          isOpen={isModalOpen}
          onClose={() => dispatch(closeFollowUpBookingModal())}
          item={selectedItemForBooking}
        />
      )}

    </div>
  );
}
