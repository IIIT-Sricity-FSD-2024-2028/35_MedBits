/**
 * SlotManagement.jsx — Doctor Slot Availability & Leaves Master Page
 * =========================================================================
 * Location: src/pages/doctor/SlotManagement.jsx
 *
 * Integrates:
 *  - DailySlotManager (Interactive slot grid per selected date)
 *  - UnavailableDatesManager (Full day off & leaves management)
 *  - WeeklyOverviewCard (Weekly OPD scheduling snapshot)
 *
 * API Integration:
 *  - GET /doctors/:doctorId (Loads template slots)
 *  - GET/POST/DELETE /doctors/:doctorId/slot-blocks (Individual time blocks)
 *  - GET/POST/DELETE /doctors/:doctorId/unavailable-dates (Full day off)
 *  - GET /appointments/doctor/:doctorId (Patient appointments for selected date)
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchSlotTemplate,
  fetchSlotDateData,
  fetchWeeklyAvailability,
  blockSlot,
  unblockSlot,
  addUnavailableDate,
  removeUnavailableDate,
  setSelectedDate,
  clearSlotAlert,
  selectSlotManagement,
} from '../../store/slices/doctor/slotManagementSlice';

import DailySlotManager from './slots/DailySlotManager';
import UnavailableDatesManager from './slots/UnavailableDatesManager';
import WeeklyOverviewCard from './slots/WeeklyOverviewCard';
import './slots/slots.css';


export default function SlotManagement() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const {
    selectedDate,
    allSlots,
    slotBlocks,
    unavailableDates,
    bookedAppointments,
    weeklyAvailability,
    alert: alertMessage,
  } = useSelector(selectSlotManagement);

  const userId = user?.id;

  // 1. Load the doctor's base slot template
  useEffect(() => {
    dispatch(fetchSlotTemplate());
    return () => {
      dispatch(clearSlotAlert());
    };
  }, [dispatch, userId]);

  // 2. Load slot blocks, leaves & appointments for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    dispatch(fetchSlotDateData(selectedDate));
    dispatch(fetchWeeklyAvailability());
  }, [dispatch, userId, selectedDate]);

  // ── HANDLERS ──────────────────────────────────────────────────────────

  // Toggle blocking or unblocking an individual slot
  const handleToggleSlotBlock = (slot, isCurrentlyBlocked, blockId) => {
    if (isCurrentlyBlocked) {
      dispatch(unblockSlot({ slot, blockId }));
      return;
    }

    // BLOCK: ask the doctor for an optional reason first
    const reason = window.prompt(
      `Reason for blocking slot ${slot} (e.g. Surgery / Academic Session):`,
      'Doctor Unavailable'
    );
    if (reason === null) return; // Doctor clicked Cancel on prompt

    dispatch(blockSlot({ slot, reason }));
  };

  // Add whole day off (leave)
  const handleAddUnavailableDate = (date) => dispatch(addUnavailableDate(date));

  // Remove whole day off
  const handleRemoveUnavailableDate = (date, id) => dispatch(removeUnavailableDate({ date, id }));

  const isCurrentDateUnavailable = unavailableDates.some((u) => u.date === selectedDate);

  return (
      <div className="slots-page-container">

        {/* Status notification banner */}
        {alertMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              background: alertMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: alertMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${alertMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {alertMessage.type === 'success' ? '✓' : '⚠️'} {alertMessage.text}
          </div>
        )}

        {/* 1. Daily slot grid */}
        <DailySlotManager
          selectedDate={selectedDate}
          onDateChange={(date) => dispatch(setSelectedDate(date))}
          allSlots={allSlots}
          slotBlocks={slotBlocks}
          bookedAppointments={bookedAppointments}
          isDateUnavailable={isCurrentDateUnavailable}
          onToggleSlotBlock={handleToggleSlotBlock}
        />

        {/* 2. Whole day off manager */}
        <UnavailableDatesManager
          unavailableDates={unavailableDates}
          onAddUnavailableDate={handleAddUnavailableDate}
          onRemoveUnavailableDate={handleRemoveUnavailableDate}
        />

        {/* 3. 7-day schedule summary */}
        <WeeklyOverviewCard
          days={weeklyAvailability}
          selectedDate={selectedDate}
          totalSlotsCount={allSlots.length}
          onSelectDate={(date) => dispatch(setSelectedDate(date))}
        />

      </div>
  );
}
