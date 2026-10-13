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

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';

import DailySlotManager from './slots/DailySlotManager';
import UnavailableDatesManager from './slots/UnavailableDatesManager';
import WeeklyOverviewCard from './slots/WeeklyOverviewCard';
import './slots/slots.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SlotManagement() {
  const { user } = useAuth();

  // Selected date defaults to today in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Data stores
  const [allSlots, setAllSlots] = useState([]);
  const [slotBlocks, setSlotBlocks] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);

  const doctorId = user?.doctorId || (user?.id === 'DOCTOR_001' ? 'DOC001' : user?.id) || 'DOC001';

  // 1. Fetch Doctor profile to load base slot template
  const loadDoctorProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/doctors/${encodeURIComponent(doctorId)}`, {
        headers: { role: 'doctor' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.slots) && data.slots.length > 0) {
          setAllSlots(data.slots);
          return;
        }
      }
    } catch {
      // Graceful error fallback
    }
    setAllSlots(['10:00', '10:30', '11:00', '11:30', '12:00']);
  }, [doctorId]);

  // 2. Fetch slot blocks & appointments for selected date
  const loadDateSpecificData = useCallback(async (date) => {
    if (!date) return;
    try {
      const [blocksRes, apptsRes, unavailRes] = await Promise.all([
        fetch(
          `${API_BASE}/doctors/${encodeURIComponent(doctorId)}/slot-blocks?date=${encodeURIComponent(date)}`,
          { headers: { role: 'doctor' } }
        ),
        fetch(
          `${API_BASE}/appointments/doctor/${encodeURIComponent(doctorId)}`,
          { headers: { role: 'doctor' } }
        ),
        fetch(
          `${API_BASE}/doctors/${encodeURIComponent(doctorId)}/unavailable-dates`,
          { headers: { role: 'doctor' } }
        ),
      ]);

      if (blocksRes.ok) {
        const blocksData = await blocksRes.json();
        setSlotBlocks(Array.isArray(blocksData) ? blocksData : []);
      }

      if (unavailRes.ok) {
        const unavailData = await unavailRes.json();
        setUnavailableDates(Array.isArray(unavailData) ? unavailData : []);
      }

      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        const activeAppts = Array.isArray(apptsData)
          ? apptsData.filter((a) => a.date === date && a.status === 'upcoming')
          : [];
        setBookedAppointments(activeAppts);
      }
    } catch {
      // Graceful error fallback
    }
  }, [user?.id]);

  useEffect(() => {
    loadDoctorProfile();
  }, [loadDoctorProfile]);

  useEffect(() => {
    loadDateSpecificData(selectedDate);
  }, [loadDateSpecificData, selectedDate]);

  // ── HANDLERS ──────────────────────────────────────────────────────────

  // Toggle blocking or unblocking an individual slot
  const handleToggleSlotBlock = async (slot, isCurrentlyBlocked, blockId) => {
    setAlertMessage(null);
    try {
      if (isCurrentlyBlocked) {
        // UNBLOCK: Call DELETE
        const targetId = blockId || slot;
        const res = await fetch(
          `${API_BASE}/doctors/${encodeURIComponent(doctorId)}/slot-blocks/${encodeURIComponent(targetId)}`,
          {
            method: 'DELETE',
            headers: { role: 'doctor' },
          }
        );

        if (res.ok) {
          setSlotBlocks((prev) => prev.filter((b) => b.slot !== slot));
          setAlertMessage({ type: 'success', text: `Slot ${slot} unblocked successfully.` });
        } else {
          throw new Error('Failed to unblock');
        }
      } else {
        // BLOCK: Prompt doctor for optional reason and call POST
        const reason = window.prompt(
          `Reason for blocking slot ${slot} (e.g. Surgery / Academic Session):`,
          'Doctor Unavailable'
        );

        if (reason === null) return; // Doctor clicked Cancel on prompt

        const res = await fetch(
          `${API_BASE}/doctors/${encodeURIComponent(doctorId)}/slot-blocks`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              role: 'doctor',
            },
            body: JSON.stringify({
              date: selectedDate,
              slot,
              reason: reason.trim() || 'Unavailable',
            }),
          }
        );

        if (res.ok) {
          const newBlock = await res.json();
          setSlotBlocks((prev) => [...prev, newBlock]);
          setAlertMessage({ type: 'success', text: `Slot ${slot} blocked for ${selectedDate}.` });
        } else {
          throw new Error('Failed to block');
        }
      }
    } catch {
      setAlertMessage({ type: 'error', text: 'Action failed. Please verify the backend is active.' });
    }
  };

  // Add whole day off (leave)
  const handleAddUnavailableDate = async (date) => {
    setAlertMessage(null);
    try {
      const res = await fetch(
        `${API_BASE}/doctors/${encodeURIComponent(doctorId)}/unavailable-dates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            role: 'doctor',
          },
          body: JSON.stringify({ date }),
        }
      );

      if (res.ok) {
        const newUnavail = await res.json();
        setUnavailableDates((prev) => [...prev, newUnavail]);
        setAlertMessage({ type: 'success', text: `Date ${date} marked as full day off.` });
      } else {
        throw new Error('Failed to add unavailable date');
      }
    } catch {
      setAlertMessage({ type: 'error', text: 'Failed to mark date as unavailable.' });
    }
  };

  // Remove whole day off
  const handleRemoveUnavailableDate = async (date, id) => {
    setAlertMessage(null);
    try {
      const targetParam = id || date;
      const res = await fetch(
        `${API_BASE}/doctors/${encodeURIComponent(doctorId)}/unavailable-dates/${encodeURIComponent(targetParam)}`,
        {
          method: 'DELETE',
          headers: { role: 'doctor' },
        }
      );

      if (res.ok) {
        setUnavailableDates((prev) => prev.filter((item) => item.date !== date));
        setAlertMessage({ type: 'success', text: `Date ${date} restored to regular working status.` });
      } else {
        throw new Error('Failed to remove date');
      }
    } catch {
      setAlertMessage({ type: 'error', text: 'Failed to restore date.' });
    }
  };

  const isCurrentDateUnavailable = unavailableDates.some((u) => u.date === selectedDate);

  return (
    <AppShell pageTitle="Slot Management">
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
          onDateChange={setSelectedDate}
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
        <WeeklyOverviewCard totalSlotsCount={allSlots.length} />

      </div>
    </AppShell>
  );
}
