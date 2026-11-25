/**
 * patientFeedbackSlice.js — Patient Doctor Feedback State (Redux Toolkit)
 * ========================================================================
 * Location: src/store/slices/patient/patientFeedbackSlice.js
 *
 * Manages state for the Patient Feedback page:
 *   - Data: `completedAppointments`, `userFeedbackList`
 *   - Form state: `selectedDoctorId`, `selectedRating`, `comment`
 *   - Async/UI state: `status`, `isSubmitting`, `statusMessage`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch } from '../../../api/apiClient';
import { logout } from '../authSlice';

const initialState = {
  completedAppointments: [],
  userFeedbackList: [],
  selectedDoctorId: '',
  selectedRating: '',
  comment: '',
  status: 'idle',
  isSubmitting: false,
  statusMessage: null,
};

export const fetchPatientFeedback = createAsyncThunk(
  'patientFeedback/fetchFeedback',
  async (patientId, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    const targetId = patientId || user?.id;

    if (!targetId) {
      return { appointments: [], feedback: [] };
    }

    const requestUser = { ...user, role: user?.role || 'patient' };

    try {
      const [appointmentsData, feedbackData] = await Promise.all([
        apiFetch(`/appointments/completed/${encodeURIComponent(targetId)}`, {
          user: requestUser,
        }),
        apiFetch(`/feedback/user/${encodeURIComponent(targetId)}`, {
          user: requestUser,
        }),
      ]);

      return {
        appointments: Array.isArray(appointmentsData) ? appointmentsData : [],
        feedback: Array.isArray(feedbackData) ? feedbackData : [],
      };
    } catch {
      return rejectWithValue('Failed to load feedback records from the server.');
    }
  }
);

export const submitPatientFeedback = createAsyncThunk(
  'patientFeedback/submitFeedback',
  async ({ doctorId, rating, comment, branchId }, { getState, dispatch, rejectWithValue }) => {
    const user = getState().auth.user;
    const userId = user?.id;

    if (!userId) {
      return rejectWithValue('User session is missing.');
    }

    const payload = {
      userId,
      doctorId,
      rating,
      comment: comment.trim(),
      ...(branchId ? { branchId } : {}),
    };

    try {
      await apiFetch('/feedback', {
        user: { ...user, role: user?.role || 'patient' },
        method: 'POST',
        body: payload,
      });

      await dispatch(fetchPatientFeedback(userId));
      return { submitted: true };
    } catch (err) {
      const raw = err?.message || '';
      const detail = raw.includes(': ') ? raw.split(': ').slice(1).join(': ') : raw;
      return rejectWithValue(detail || 'Unable to submit feedback to backend.');
    }
  }
);

const patientFeedbackSlice = createSlice({
  name: 'patientFeedback',
  initialState,
  reducers: {
    setSelectedDoctorId(state, action) {
      state.selectedDoctorId = action.payload;
    },
    setSelectedRating(state, action) {
      state.selectedRating = action.payload;
    },
    setFeedbackComment(state, action) {
      state.comment = action.payload;
    },
    setFeedbackStatusMessage(state, action) {
      state.statusMessage = action.payload;
    },
    clearFeedbackStatus(state) {
      state.statusMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPatientFeedback.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPatientFeedback.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.completedAppointments = action.payload.appointments;
        state.userFeedbackList = action.payload.feedback;
      })
      .addCase(fetchPatientFeedback.rejected, (state, action) => {
        state.status = 'failed';
        state.statusMessage = {
          type: 'error',
          text: action.payload || 'Unable to load feedback data.',
        };
      })
      .addCase(submitPatientFeedback.pending, (state) => {
        state.isSubmitting = true;
        state.statusMessage = null;
      })
      .addCase(submitPatientFeedback.fulfilled, (state) => {
        state.isSubmitting = false;
        state.comment = '';
        state.selectedRating = '';
        state.selectedDoctorId = '';
        state.statusMessage = {
          type: 'success',
          text: 'Thank you! Your feedback has been submitted successfully.',
        };
      })
      .addCase(submitPatientFeedback.rejected, (state, action) => {
        state.isSubmitting = false;
        state.statusMessage = {
          type: 'error',
          text: action.payload || 'An error occurred while submitting feedback.',
        };
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setSelectedDoctorId,
  setSelectedRating,
  setFeedbackComment,
  setFeedbackStatusMessage,
  clearFeedbackStatus,
} = patientFeedbackSlice.actions;

export const selectCompletedAppointmentsForFeedback = (state) =>
  state.patientFeedback.completedAppointments;
export const selectUserFeedbackList = (state) => state.patientFeedback.userFeedbackList;
export const selectFeedbackSelectedDoctorId = (state) => state.patientFeedback.selectedDoctorId;
export const selectFeedbackSelectedRating = (state) => state.patientFeedback.selectedRating;
export const selectFeedbackComment = (state) => state.patientFeedback.comment;
export const selectFeedbackLoadStatus = (state) => state.patientFeedback.status;
export const selectIsSubmittingFeedback = (state) => state.patientFeedback.isSubmitting;
export const selectFeedbackStatusMessage = (state) => state.patientFeedback.statusMessage;

export default patientFeedbackSlice.reducer;
