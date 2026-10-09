/**
 * StatCard.jsx — Universal Metric Display Component
 * ===================================================
 * WHAT THIS COMPONENT DOES:
 *  Displays a single key performance indicator (KPI) or metric. It shows a label,
 *  a large numeric value, an optional colored icon, and an optional "delta"
 *  or status text badge at the bottom (e.g. "Scheduled today", "Awaiting results").
 *
 * WHY IT IS REUSABLE ACROSS ALL DASHBOARDS:
 *  - Nearly every dashboard has a top grid of metrics:
 *    * Doctor: "Today's Appointments", "Pending Lab Tests"
 *    * Lab Tech: "Pending Requests", "Completed Reports"
 *    * Front Desk: "Walk-Ins today", "Patients in Queue"
 *  - By exporting both `StatCard` and a wrapper `StatGrid`, we can easily
 *    render rows of responsive metric boxes anywhere.
 *
 * PROPS EXPLANATION:
 *  @param {string} label       — The title of the metric (e.g. "Pending Lab Tests")
 *  @param {string|number} value— The main large number to display
 *  @param {string} delta       — Optional subtext (e.g. "3 awaiting results")
 *  @param {string} deltaType   — Determines color scheme: 'positive' | 'warning' | 'danger' | 'info'
 *  @param {ReactNode} icon     — Optional emoji or SVG icon to show in the top right
 */

import React from 'react';
import './StatCard.css';

export default function StatCard({
  label,
  value,
  delta,
  deltaType = 'info',
  icon
}) {
  return (
    <div className="stat-card">

      {/* TOP ROW: Label and Icon */}
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        
        {/* Render icon box with dynamic color scheme based on deltaType */}
        {icon && (
          <div className={`stat-card-icon stat-icon--${deltaType}`}>
            {icon}
          </div>
        )}
      </div>

      {/* MIDDLE ROW: Primary Numeric Value */}
      <div className="stat-card-value">{value ?? '—'}</div>

      {/* BOTTOM ROW: Optional Subtext / Delta Indicator */}
      {delta && (
        <div className={`stat-card-delta stat-delta--${deltaType}`}>
          {delta}
        </div>
      )}

    </div>
  );
}

/**
 * StatGrid — Universal Grid Wrapper for StatCards
 * Automatically handles responsive columns (auto-fit).
 */
export function StatGrid({ children }) {
  return <div className="stat-grid-container">{children}</div>;
}
