/**
 * WeeklyOverviewCard.jsx — 7-Day Weekly OPD Capacity Snapshot
 * =========================================================================
 * Location: src/pages/doctor/slots/WeeklyOverviewCard.jsx
 *
 * Renders an at-a-glance weekly summary showing active working slots for
 * each day of the week (Monday through Sunday).
 */

import React from 'react';
import './slots.css';

export default function WeeklyOverviewCard({ totalSlotsCount = 0 }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="slot-card">
      <div className="slot-card-header">
        <h3 className="slot-card-title">Weekly Availability Overview</h3>
      </div>

      <div className="week-grid">
        {days.map((day) => {
          const isWeekend = day === 'Sun';
          return (
            <div key={day} className={`day-card ${isWeekend ? 'weekend' : ''}`}>
              <div className="day-name">{day}</div>
              <div className="day-slots">
                {isWeekend ? 'Off Duty' : `${totalSlotsCount} slots`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
