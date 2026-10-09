/**
 * WelcomeCard.jsx — Universal Welcome & Hero Banner Component
 * =============================================================
 * WHAT THIS COMPONENT DOES:
 *  This component displays the primary header banner at the top of the main
 *  content area across all 6 dashboards (Doctor, Patient, Front Desk,
 *  Lab Tech, Branch Admin, and Super Admin).
 *
 * WHY IT IS REUSABLE ACROSS ALL DASHBOARDS:
 *  - Every actor dashboard requires a greeting/welcome message when logged in.
 *  - It dynamically accepts an eyebrow tag (e.g. "DOCTOR PORTAL"), a title,
 *    an optional subtitle, and an array of summary stat chips (e.g. "Today's Appts").
 *
 * PROPS EXPLANATION:
 *  @param {string} eyebrow   — Small uppercase badge above title (e.g. "MEDBITS PATIENT PORTAL")
 *  @param {string} title     — Main greeting line (e.g. "Welcome back, Dr. Sarah Johnson!")
 *  @param {string} subtitle  — Secondary subtitle or context line under the title
 *  @param {Array}  stats     — Optional array of stat chip objects: [{ label: string, value: string|number }]
 */

import React from 'react';
import './WelcomeCard.css';

export default function WelcomeCard({
  eyebrow = '',
  title = 'Welcome Back!',
  subtitle = '',
  stats = []
}) {
  return (
    <div className="welcome-card">

      {/* LEFT SECTION: Greeting text, eyebrow tag, and subtitle */}
      <div className="welcome-text-section">
        {/* Render eyebrow tag only if provided */}
        {eyebrow && <div className="welcome-eyebrow">{eyebrow}</div>}

        {/* Main Title / Greeting */}
        <h1 className="welcome-title">{title}</h1>

        {/* Render subtitle description only if provided */}
        {subtitle && <p className="welcome-subtitle">{subtitle}</p>}
      </div>

      {/* RIGHT SECTION: Quick stat counters (e.g. 12 Doctors, 5 Pending Labs) */}
      {stats && stats.length > 0 && (
        <div className="welcome-stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="welcome-stat-chip">
              {/* Stat numerical value or fallback dash */}
              <div className="welcome-stat-value">{stat.value ?? '—'}</div>

              {/* Stat text label */}
              <div className="welcome-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
