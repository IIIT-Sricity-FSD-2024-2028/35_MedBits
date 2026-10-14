/**
 * DailySlotManager.jsx — Interactive Daily OPD Slot Grid
 * =========================================================================
 * Location: src/pages/doctor/slots/DailySlotManager.jsx
 *
 * FEATURES:
 *  - Date picker to inspect availability for any specific day.
 *  - Interactive slot grid with 3 visual states:
 *      1. Available (Green) -> Click to block with optional reason.
 *      2. Patient Booked (Amber) -> Reserved by patient; cannot be blocked.
 *      3. Blocked (Red) -> Click to unblock.
 *  - Explanatory color legend.
 */

import React from 'react';
import './slots.css';

export default function DailySlotManager({
  selectedDate,
  onDateChange,
  allSlots = [],
  slotBlocks = [],
  bookedAppointments = [],
  isDateUnavailable,
  onToggleSlotBlock,
}) {
  // Map of booked slots for O(1) lookup
  const bookedSlotMap = new Map(bookedAppointments.map((a) => [a.slot, a]));

  return (
    <div className="slot-card">
      <div className="slot-card-header">
        <h3 className="slot-card-title">Manage Daily Time Slots</h3>
      </div>

      {/* Date Picker Row */}
      <div className="slot-date-row">
        <div className="slot-date-group">
          <label htmlFor="slot-date-select" className="slot-date-label">
            Select Date
          </label>
          <input
            id="slot-date-select"
            type="date"
            className="slot-date-input"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>
      </div>

      {isDateUnavailable ? (
        <div className="slot-unavail-notice">
          🏖️ This entire date is marked as <strong>Unavailable / Leave</strong>. No slots can be booked by patients.
        </div>
      ) : (
        <>
          {/* Interactive Slots Grid */}
          <div className="slot-grid">
            {allSlots.map((slot) => {
              const appointment = bookedSlotMap.get(slot);
              const block = slotBlocks.find((b) => b.slot === slot);
              const isBooked = Boolean(appointment);
              const isBlocked = Boolean(block);

              let slotClass = 'available';
              let statusLabel = 'Available';

              if (isBooked) {
                slotClass = 'patient-booked';
                statusLabel = 'Booked';
              } else if (isBlocked) {
                slotClass = 'blocked';
                statusLabel = 'Blocked';
              }

              return (
                <div
                  key={slot}
                  className={`slot-item ${slotClass}`}
                  onClick={() => {
                    if (!isBooked) {
                      onToggleSlotBlock(slot, isBlocked, block?.id);
                    }
                  }}
                  title={
                    isBooked
                      ? `Booked by patient`
                      : isBlocked
                      ? `Blocked: ${block?.reason || 'Click to unblock'}`
                      : 'Click to block this slot'
                  }
                >
                  <div className="slot-time">{slot}</div>
                  <div className="slot-status">{statusLabel}</div>
                  {isBooked && (
                    <div
                      className="slot-patient-label"
                      title={appointment.patientName || appointment.userId}
                    >
                      👤 {appointment.patientName || appointment.userId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="slot-legend">
            <div className="legend-item">
              <div className="legend-dot available" />
              Available (Click to block)
            </div>
            <div className="legend-item">
              <div className="legend-dot booked" />
              Patient Booked
            </div>
            <div className="legend-item">
              <div className="legend-dot blocked" />
              Blocked (Click to unblock)
            </div>
          </div>
        </>
      )}
    </div>
  );
}
