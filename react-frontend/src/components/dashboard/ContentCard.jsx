/**
 * ContentCard.jsx — Universal Section Wrapper Component
 * =======================================================
 * WHAT THIS COMPONENT DOES:
 *  Acts as a standard container for different sections of the dashboard.
 *  It provides a consistent white card with a subtle border, shadow, and
 *  a formatted header area containing a title and optional action button.
 *
 * WHY IT IS REUSABLE ACROSS ALL DASHBOARDS:
 *  - Every dashboard needs containers to group related content (e.g.,
 *    "Today's Appointments", "Branch Details", "Recent Test Requests").
 *  - By wrapping any child content inside <ContentCard>, we guarantee
 *    uniform spacing, styling, and header alignment across the entire app.
 *
 * PROPS EXPLANATION:
 *  @param {string} title       — The main heading for the card (e.g., "Queue Status")
 *  @param {string} subtitle    — Optional sub-text beneath the title
 *  @param {ReactNode} action   — Optional UI element in the top-right corner
 *                                (usually a "View All" link or "Refresh" button)
 *  @param {ReactNode} children — The actual content inside the card (tables, lists, grids)
 *  @param {string} className   — Optional CSS class for overriding/extending styles
 */

import React from 'react';
import './ContentCard.css';

export default function ContentCard({
  title,
  subtitle,
  action,
  children,
  className = ''
}) {
  return (
    <div className={`content-card ${className}`}>

      {/* RENDER HEADER ONLY IF Title OR Action EXISTS */}
      {(title || action) && (
        <div className="content-card-header">

          {/* Left Side: Titles */}
          <div className="content-card-title-group">
            {/* Main Section Title */}
            {title && <h3 className="content-card-title">{title}</h3>}

            {/* Optional Subtitle Context */}
            {subtitle && <p className="content-card-sub">{subtitle}</p>}
          </div>

          {/* Right Side: Optional Action (like a View All link) */}
          {action && (
            <div className="content-card-action">
              {action}
            </div>
          )}

        </div>
      )}

      {/* RENDER MAIN CARD BODY */}
      <div className="content-card-body">
        {/* Everything passed between <ContentCard> ... </ContentCard> goes here */}
        {children}
      </div>

    </div>
  );
}
