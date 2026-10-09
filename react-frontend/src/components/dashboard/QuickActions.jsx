/**
 * QuickActions.jsx — Universal Quick Actions Component
 * ====================================================
 * WHAT THIS COMPONENT DOES:
 *  Provides a standardized panel for primary shortcut action buttons across all 6 dashboards.
 *  It enables users (Doctors, Patients, Front Desk, Lab Techs, Branch Admins, Super Admins)
 *  to trigger frequent workflows in 1 click (e.g. "Book Appointment", "New Consultation Note",
 *  "Register Walk-in", "Create Branch").
 *
 * WHY IT IS REUSABLE ACROSS ALL DASHBOARDS:
 *  - Every single dashboard in MedBits features a "Quick Actions" section in its main content area.
 *  - Supports two display variants via the `variant` prop:
 *      1) 'grid' — Colored card tiles (ideal for Patient, Front Desk, Branch Admin)
 *      2) 'list' — Stacked outline buttons (ideal for Doctor, Lab Tech)
 *
 * PROPS EXPLANATION:
 *  @param {string} title    — Section title (defaults to "Quick Actions")
 *  @param {Array}  actions  — Array of action objects:
 *                              [{ label: string, icon: ReactNode|string, onClick?: func, href?: string, color?: string }]
 *  @param {'grid'|'list'} variant — Display mode ('grid' for card grid, 'list' for outline button list)
 */

import React from 'react';
import './QuickActions.css';

export default function QuickActions({
  title = 'Quick Actions',
  actions = [],
  variant = 'grid'
}) {
  return (
    <div className="quick-actions-card">

      {/* Section Header Title */}
      <div className="quick-actions-title">{title}</div>

      {/* Action Items Container (styled dynamically as grid or list) */}
      <div className={`quick-actions-container quick-actions-${variant}`}>
        {actions.map((action, index) => {
          // Determine whether to render an <a> anchor link or a <button> element
          const ElementTag = action.href ? 'a' : 'button';

          return (
            <ElementTag
              key={index}
              href={action.href}
              onClick={action.onClick}
              className={`qa-item qa-item-${variant}`}
              style={action.color ? { '--qa-accent-color': action.color } : {}}
            >
              {/* Optional Icon (Emoji or SVG icon element) */}
              {action.icon && <span className="qa-icon">{action.icon}</span>}

              {/* Action Text Label */}
              <span className="qa-label">{action.label}</span>
            </ElementTag>
          );
        })}
      </div>

    </div>
  );
}
