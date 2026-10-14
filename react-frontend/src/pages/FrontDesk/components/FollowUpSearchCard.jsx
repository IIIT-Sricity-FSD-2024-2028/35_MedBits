/**
 * FollowUpSearchCard.jsx — Search and Category Filter Controls
 * ==============================================================================
 * Provides the front desk team with:
 *  1. Live search input supporting:
 *     - 10-digit patient contact number
 *     - Patient full name or User ID
 *     - Doctor name or ID
 *  2. Segmented category filter tabs with dynamic counter badges:
 *     - All Tasks
 *     - Referrals
 *     - Follow-Ups
 *  3. Clear button for instantaneous filter reset
 */

import React from 'react';

/**
 * @param {string} searchQuery       - Current search query string
 * @param {function} onSearchChange  - Handler for search query change
 * @param {string} activeTab         - Current filter tab: 'all' | 'referrals' | 'followups'
 * @param {function} onTabChange     - Handler for tab switch
 * @param {number} totalCount        - Total count of combined records
 * @param {number} referralCount     - Count of pending referrals
 * @param {number} followUpCount     - Count of suggested follow-ups
 */
export default function FollowUpSearchCard({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  totalCount = 0,
  referralCount = 0,
  followUpCount = 0,
}) {
  return (
    <div className="followup-filter-card">
      {/* ── Search Input Row ─────────────────────────────────────────────── */}
      <div className="followup-search-row">
        <div className="followup-search-input-wrapper">
          <span className="followup-search-icon">🔍</span>
          <input
            type="text"
            className="followup-search-input"
            placeholder="Search by patient phone (10 digits), name, patient ID, or doctor…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            className="followup-clear-btn"
            onClick={() => onSearchChange('')}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* ── Category Filter Tabs ─────────────────────────────────────────── */}
      <div className="followup-tabs">
        <button
          type="button"
          className={`followup-tab-btn ${activeTab === 'all' ? 'followup-tab-btn--active' : ''}`}
          onClick={() => onTabChange('all')}
        >
          All Tasks
          <span className="followup-tab-count">{totalCount}</span>
        </button>

        <button
          type="button"
          className={`followup-tab-btn ${activeTab === 'referrals' ? 'followup-tab-btn--active' : ''}`}
          onClick={() => onTabChange('referrals')}
        >
          🔗 Referrals
          <span className="followup-tab-count">{referralCount}</span>
        </button>

        <button
          type="button"
          className={`followup-tab-btn ${activeTab === 'followups' ? 'followup-tab-btn--active' : ''}`}
          onClick={() => onTabChange('followups')}
        >
          🔄 Follow-Ups
          <span className="followup-tab-count">{followUpCount}</span>
        </button>
      </div>
    </div>
  );
}
