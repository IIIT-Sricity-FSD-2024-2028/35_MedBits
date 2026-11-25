/**
 * slotManagementSlice.js — Doctor Slots & Leaves State (Redux Toolkit)
 * ====================================================================
 * Location: src/store/slices/doctor/slotManagementSlice.js
 *
 * Manages:
 *   - `selectedDate`       — YYYY-MM-DD shown in the daily slot grid
 *   - `allSlots`           — the doctor's slot template
 *   - `slotBlocks`         — slots blocked on the selected date
 *   - `unavailableDates`   — full days off
 *   - `bookedAppointments` — upcoming appointments on the selected date
 *   - `alert`              — { type: 'success' | 'error', text } | null
 *
 * API:
 *   GET    /doctors/:doctorId                       (slot template)
 *   GET    /doctors/:doctorId/slot-blocks?date=
 *   POST   /doctors/:doctorId/slot-blocks
 *   DELETE /doctors/:doctorId/slot-blocks/:blockId
 *   GET    /doctors/:doctorId/unavailable-dates
 *   POST   /doctors/:doctorId/unavailable-dates
 *   DELETE /doctors/:doctorId/unavailable-dates/:id
 *   GET    /appointments/doctor/:doctorId
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';
import { fetchListOrNull, getDoctorRequestUser, todayISO } from './doctorHelpers';

const DEFAULT_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00'];

function createInitialState() {
  return {
    selectedDate: todayISO(),
    allSlots: [],
    slotBlocks: [],
    unavailableDates: [],
    bookedAppointments: [],
    alert: null,
  };
}

/** Base path for the logged-in doctor's endpoints, plus the request identity. */
function doctorEndpoint(getState) {
  const user = getDoctorRequestUser(getState());
  return { user, base: `/doctors/${encodeURIComponent(user.id)}` };
}

export const fetchSlotTemplate = createAsyncThunk(
  'slotManagement/fetchTemplate',
  async (_, { getState }) => {
    const { user, base } = doctorEndpoint(getState);
    try {
      const doctor = await apiFetch(base, { user });
      if (Array.isArray(doctor?.slots) && doctor.slots.length > 0) return doctor.slots;
    } catch {
      // Fall back to the default template below.
    }
    return DEFAULT_SLOTS;
  }
);

export const fetchSlotDateData = createAsyncThunk(
  'slotManagement/fetchDateData',
  async (date, { getState }) => {
    const { user, base } = doctorEndpoint(getState);
    const [slotBlocks, appointments, unavailableDates] = await Promise.all([
      fetchListOrNull(`${base}/slot-blocks?date=${encodeURIComponent(date)}`, user),
      fetchListOrNull(`/appointments/doctor/${encodeURIComponent(user.id)}`, user),
      fetchListOrNull(`${base}/unavailable-dates`, user),
    ]);

    return {
      slotBlocks,
      unavailableDates,
      bookedAppointments: appointments
        ? appointments.filter((a) => a.date === date && a.status === 'upcoming')
        : null,
    };
  }
);

export const blockSlot = createAsyncThunk(
  'slotManagement/blockSlot',
  async ({ slot, reason }, { getState, rejectWithValue }) => {
    const { user, base } = doctorEndpoint(getState);
    const date = getState().slotManagement.selectedDate;
    try {
      const block = await apiFetch(`${base}/slot-blocks`, {
        user,
        method: 'POST',
        body: { date, slot, reason: reason.trim() || 'Unavailable' },
      });
      return { block, slot, date };
    } catch {
      return rejectWithValue('Action failed. Please verify the backend is active.');
    }
  }
);

export const unblockSlot = createAsyncThunk(
  'slotManagement/unblockSlot',
  async ({ slot, blockId }, { getState, rejectWithValue }) => {
    const { user, base } = doctorEndpoint(getState);
    try {
      await apiFetch(`${base}/slot-blocks/${encodeURIComponent(blockId || slot)}`, {
        user,
        method: 'DELETE',
      });
      return { slot };
    } catch {
      return rejectWithValue('Action failed. Please verify the backend is active.');
    }
  }
);

export const addUnavailableDate = createAsyncThunk(
  'slotManagement/addUnavailableDate',
  async (date, { getState, rejectWithValue }) => {
    const { user, base } = doctorEndpoint(getState);
    try {
      const entry = await apiFetch(`${base}/unavailable-dates`, {
        user,
        method: 'POST',
        body: { date },
      });
      return { entry, date };
    } catch {
      return rejectWithValue('Failed to mark date as unavailable.');
    }
  }
);

export const removeUnavailableDate = createAsyncThunk(
  'slotManagement/removeUnavailableDate',
  async ({ date, id }, { getState, rejectWithValue }) => {
    const { user, base } = doctorEndpoint(getState);
    try {
      await apiFetch(`${base}/unavailable-dates/${encodeURIComponent(id || date)}`, {
        user,
        method: 'DELETE',
      });
      return { date };
    } catch {
      return rejectWithValue('Failed to restore date.');
    }
  }
);

function setError(state, action) {
  state.alert = { type: 'error', text: action.payload };
}

function clearAlert(state) {
  state.alert = null;
}

const slotManagementSlice = createSlice({
  name: 'slotManagement',
  initialState: createInitialState,
  reducers: {
    setSelectedDate(state, action) {
      state.selectedDate = action.payload;
    },
    clearSlotAlert: clearAlert,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSlotTemplate.fulfilled, (state, action) => {
        state.allSlots = action.payload;
      })
      .addCase(fetchSlotDateData.fulfilled, (state, action) => {
        const { slotBlocks, unavailableDates, bookedAppointments } = action.payload;
        if (slotBlocks) state.slotBlocks = slotBlocks;
        if (unavailableDates) state.unavailableDates = unavailableDates;
        if (bookedAppointments) state.bookedAppointments = bookedAppointments;
      })
      .addCase(blockSlot.pending, clearAlert)
      .addCase(blockSlot.fulfilled, (state, action) => {
        const { block, slot, date } = action.payload;
        state.slotBlocks.push(block);
        state.alert = { type: 'success', text: `Slot ${slot} blocked for ${date}.` };
      })
      .addCase(blockSlot.rejected, setError)
      .addCase(unblockSlot.pending, clearAlert)
      .addCase(unblockSlot.fulfilled, (state, action) => {
        const { slot } = action.payload;
        state.slotBlocks = state.slotBlocks.filter((b) => b.slot !== slot);
        state.alert = { type: 'success', text: `Slot ${slot} unblocked successfully.` };
      })
      .addCase(unblockSlot.rejected, setError)
      .addCase(addUnavailableDate.pending, clearAlert)
      .addCase(addUnavailableDate.fulfilled, (state, action) => {
        const { entry, date } = action.payload;
        state.unavailableDates.push(entry);
        state.alert = { type: 'success', text: `Date ${date} marked as full day off.` };
      })
      .addCase(addUnavailableDate.rejected, setError)
      .addCase(removeUnavailableDate.pending, clearAlert)
      .addCase(removeUnavailableDate.fulfilled, (state, action) => {
        const { date } = action.payload;
        state.unavailableDates = state.unavailableDates.filter((u) => u.date !== date);
        state.alert = {
          type: 'success',
          text: `Date ${date} restored to regular working status.`,
        };
      })
      .addCase(removeUnavailableDate.rejected, setError)
      .addCase(logout, () => createInitialState());
  },
});

export const { setSelectedDate, clearSlotAlert } = slotManagementSlice.actions;

export const selectSlotManagement = (state) => state.slotManagement;

export default slotManagementSlice.reducer;
