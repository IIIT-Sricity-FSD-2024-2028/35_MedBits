/**
 * FollowUpEmptyState.jsx — Friendly Empty State Message
 * ==============================================================================
 * Displayed when:
 *  - Search query yields zero matches
 *  - Selected category (Referrals or Follow-Ups) currently has no pending items
 */

import React from 'react';

/**
 * @param {string} searchQuery       - Current search query
 * @param {string} activeTab         - Current category tab
 * @param {function} onClearSearch   - Clear search callback
 */
export default function FollowUpEmptyState({ searchQuery, activeTab, onClearSearch }) {
  let title = 'No pending follow-ups or referrals';
  let subtitle = 'All doctor referrals and suggested consultation follow-ups have been coordinated.';

  if (searchQuery) {
    title = `No matches found for "${searchQuery}"`;
    subtitle = 'Please verify the 10-digit phone number, patient ID, patient name, or doctor name and try again.';
  } else if (activeTab === 'referrals') {
    title = 'No pending doctor referrals';
    subtitle = 'There are currently no internal referrals awaiting appointment scheduling.';
  } else if (activeTab === 'followups') {
    title = 'No pending consultation follow-ups';
    subtitle = 'All follow-up consultations recommended by doctors are up to date.';
  }

  return (
    <div className="followup-empty-container">
      <span className="followup-empty-icon">{searchQuery ? '🔎' : '✨'}</span>
      <h3 className="followup-empty-title">{title}</h3>
      <p className="followup-empty-subtitle">{subtitle}</p>
      {searchQuery && (
        <button
          type="button"
          className="followup-clear-btn"
          style={{ marginTop: '8px' }}
          onClick={onClearSearch}
        >
          Reset Search Filter
        </button>
      )}
    </div>
  );
}
