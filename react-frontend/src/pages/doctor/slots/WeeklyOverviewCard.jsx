/**
 * WeeklyOverviewCard.jsx — 7-Day Weekly OPD Capacity Snapshot
 * =========================================================================
 * Location: src/pages/doctor/slots/WeeklyOverviewCard.jsx
 *
 * Shows the week (Mon–Sun) that contains the selected date. Each day shows
 * how many slots are still open after blocked slots and full days off,
 * using GET /doctors/:doctorId/weekly-availability.
 *
 * PROPS:
 *  - days: [{ date, dayName, totalSlots, blockedSlots, availableSlots, isUnavailable }]
 *  - selectedDate: YYYY-MM-DD currently shown in the daily slot grid
 *  - totalSlotsCount: template size, used only if `days` could not be loaded
 *  - onSelectDate: (date) => void — opens that day in the daily slot grid
 */

import React from 'react';
import './slots.css';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatShortDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function WeeklyOverviewCard({
  days = [],
  selectedDate,
  totalSlotsCount = 0,
  onSelectDate,
}) {
  const hasWeekData = days.length === 7;

  return (
    <div className="slot-card">
      <div className="slot-card-header">
        <h3 className="slot-card-title">Weekly Availability Overview</h3>
        {hasWeekData && (
          <span className="week-range">
            {formatShortDate(days[0].date)} – {formatShortDate(days[6].date)}
          </span>
        )}
      </div>

      <div className="week-grid">
        {hasWeekData
          ? days.map((day) => {
              const isSelected = day.date === selectedDate;
              const classes = [
                'day-card',
                'day-card--clickable',
                day.isUnavailable ? 'day-off' : '',
                isSelected ? 'day-selected' : '',
              ].join(' ');

              return (
                <button
                  key={day.date}
                  type="button"
                  className={classes}
                  onClick={() => onSelectDate?.(day.date)}
                  title={`Open ${day.date} in the slot grid`}
                >
                  <div className="day-name">{day.dayName}</div>
                  <div className="day-date">{formatShortDate(day.date)}</div>
                  <div className="day-slots">
                    {day.isUnavailable
                      ? 'Day Off'
                      : `${day.availableSlots} / ${day.totalSlots} slots`}
                  </div>
                  {!day.isUnavailable && day.blockedSlots > 0 && (
                    <div className="day-blocked">{day.blockedSlots} blocked</div>
                  )}
                </button>
              );
            })
          : DAY_NAMES.map((dayName) => (
              // Fallback when the weekly endpoint is unreachable: template only.
              <div key={dayName} className="day-card">
                <div className="day-name">{dayName}</div>
                <div className="day-slots">{totalSlotsCount} slots</div>
              </div>
            ))}
      </div>
    </div>
  );
}
