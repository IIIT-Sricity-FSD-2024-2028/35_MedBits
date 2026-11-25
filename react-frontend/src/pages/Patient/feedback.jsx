/**
 * feedback.jsx — Patient Doctor Feedback & Reviews
 * ====================================================================
 * Location: src/pages/Patient/feedback.jsx
 *
 * Powered by Redux Toolkit (`patientFeedbackSlice` + `authSlice`).
 * Allows patients to review consulted doctors from completed appointments
 * and view previously submitted feedback.
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchPatientFeedback,
  submitPatientFeedback,
  setSelectedDoctorId,
  setSelectedRating,
  setFeedbackComment,
  setFeedbackStatusMessage,
  clearFeedbackStatus,
  selectCompletedAppointmentsForFeedback,
  selectUserFeedbackList,
  selectFeedbackSelectedDoctorId,
  selectFeedbackSelectedRating,
  selectFeedbackComment,
  selectFeedbackLoadStatus,
  selectIsSubmittingFeedback,
  selectFeedbackStatusMessage,
} from '../../store/slices/patient/patientFeedbackSlice';
import './feedback.css';

// Rating configuration options
const RATING_OPTIONS = [
  { value: 'Bad', label: 'Bad', colorClass: 'rating-bad', badgeClass: 'badge-red' },
  { value: 'Average', label: 'Average', colorClass: 'rating-avg', badgeClass: 'badge-orange' },
  { value: 'Good', label: 'Good', colorClass: 'rating-good', badgeClass: 'badge-green' },
  { value: 'Better', label: 'Better', colorClass: 'rating-better', badgeClass: 'badge-green' },
  { value: 'Excellent', label: 'Excellent', colorClass: 'rating-excellent', badgeClass: 'badge-green' },
];

/**
 * Helper to match rating value to its respective badge CSS class
 */
function getRatingBadgeClass(ratingValue) {
  const match = RATING_OPTIONS.find((opt) => opt.value === ratingValue);
  return match ? match.badgeClass : 'badge-blue';
}

/**
 * Extracts unique doctors from completed appointments who have not yet received feedback
 */
function getAvailableDoctors(appointments, feedbacks) {
  const reviewedDoctorIds = new Set(feedbacks.map((fb) => fb.doctorId));
  const seenDoctorIds = new Set();
  const doctorsList = [];

  appointments.forEach((apt) => {
    const doc = apt.doctor || {};
    const doctorId = doc.id || apt.doctorId;

    if (doctorId && !reviewedDoctorIds.has(doctorId) && !seenDoctorIds.has(doctorId)) {
      seenDoctorIds.add(doctorId);
      doctorsList.push({
        id: doctorId,
        name: doc.name || `Dr. ${doctorId}`,
        specialization: doc.specialization || 'Consultant Physician',
        branchId: apt.branchId || doc.branchId,
      });
    }
  });

  return doctorsList;
}

export default function PatientFeedback() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const userId = user?.id;

  const completedAppointments = useSelector(selectCompletedAppointmentsForFeedback);
  const userFeedbackList = useSelector(selectUserFeedbackList);
  const selectedDoctorId = useSelector(selectFeedbackSelectedDoctorId);
  const selectedRating = useSelector(selectFeedbackSelectedRating);
  const comment = useSelector(selectFeedbackComment);
  const loadStatus = useSelector(selectFeedbackLoadStatus);
  const isSubmitting = useSelector(selectIsSubmittingFeedback);
  const statusMessage = useSelector(selectFeedbackStatusMessage);

  const isLoading = Boolean(userId) && loadStatus === 'loading';

  // Doctors available for review
  const availableDoctors = getAvailableDoctors(completedAppointments, userFeedbackList);
  const activeDoctorId = selectedDoctorId || availableDoctors[0]?.id || '';

  // Initial load & cleanup
  useEffect(() => {
    if (userId) {
      dispatch(fetchPatientFeedback(userId));
    }
    return () => {
      dispatch(clearFeedbackStatus());
    };
  }, [dispatch, userId]);

  /**
   * Submits patient review to backend POST /feedback
   */
  function handleSubmitFeedback(e) {
    e.preventDefault();

    if (!activeDoctorId) {
      dispatch(
        setFeedbackStatusMessage({
          type: 'error',
          text: 'Please select a consulted doctor from your completed appointments.',
        })
      );
      return;
    }

    if (!selectedRating) {
      dispatch(
        setFeedbackStatusMessage({
          type: 'error',
          text: 'Please select a rating for your consultation experience.',
        })
      );
      return;
    }

    if (!comment.trim()) {
      dispatch(
        setFeedbackStatusMessage({
          type: 'error',
          text: 'Please write your feedback comment before submitting.',
        })
      );
      return;
    }

    const chosenDoctor = availableDoctors.find((d) => d.id === activeDoctorId);
    dispatch(
      submitPatientFeedback({
        doctorId: activeDoctorId,
        rating: selectedRating,
        comment,
        branchId: chosenDoctor?.branchId,
      })
    );
  }

  return (
    <div className="feedback-container">
      {/* Hero banner */}
      <div className="feedback-banner">
        <div className="feedback-banner-left">
          <div className="feedback-banner-icon">💬</div>
          <div>
            <h2>Doctor Feedback & Ratings</h2>
            <p>
              Share your clinical experience and help us maintain high-quality care across all departments.
            </p>
          </div>
        </div>
      </div>

      {/* Alert notification message */}
      {statusMessage && (
        <div className={`feedback-alert ${statusMessage.type}`}>
          <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Feedback form */}
      <div className="feedback-card">
        <div className="feedback-card-header">
          <div>
            <h3 className="feedback-card-title">Share Your Experience</h3>
            <p className="feedback-card-subtitle">
              Rate your recent consultation with our medical specialists
            </p>
          </div>
        </div>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '24px 0' }}>
            Loading consultation records...
          </p>
        ) : (
          <form onSubmit={handleSubmitFeedback}>
            {/* Doctor selection */}
            <div className="feedback-form-group">
              <label htmlFor="fb-doctor-select">
                <span>Select Consulted Doctor</span>
                {availableDoctors.length > 0 && (
                  <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '500' }}>
                    {availableDoctors.length} visit{availableDoctors.length > 1 ? 's' : ''} available
                  </span>
                )}
              </label>

              {availableDoctors.length === 0 ? (
                <div className="feedback-alert info" style={{ marginTop: '4px' }}>
                  <span>ℹ️</span>
                  <span>
                    No completed consultations available for feedback. Complete a scheduled visit first, or you may have already reviewed all your consulted doctors.
                  </span>
                </div>
              ) : (
                <select
                  id="fb-doctor-select"
                  value={activeDoctorId}
                  onChange={(e) => dispatch(setSelectedDoctorId(e.target.value))}
                  required
                >
                  {availableDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialization}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Rating selection */}
            <div className="feedback-form-group">
              <label>
                <span>Rate Your Experience</span>
                {selectedRating && (
                  <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: '600' }}>
                    Selected: {selectedRating}
                  </span>
                )}
              </label>

              <div className="rating-row" role="group" aria-label="Consultation rating options">
                {RATING_OPTIONS.map((option) => {
                  const isSelected = selectedRating === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`rating-btn ${option.colorClass} ${isSelected ? 'selected' : ''}`}
                      onClick={() => dispatch(setSelectedRating(option.value))}
                      aria-pressed={isSelected}
                    >
                      <span>{option.label}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div className="feedback-form-group">
              <label htmlFor="fb-comment-text">
                <span>Your Feedback & Observations</span>
                <span className="feedback-char-count">{comment.length} / 500 characters</span>
              </label>
              <textarea
                id="fb-comment-text"
                placeholder="Share details about the doctor's communication, diagnosis, attentiveness, and care..."
                value={comment}
                onChange={(e) => dispatch(setFeedbackComment(e.target.value))}
                maxLength={500}
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn-submit-feedback"
              disabled={isSubmitting || availableDoctors.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span>⏳</span>
                  <span>Submitting Feedback...</span>
                </>
              ) : (
                <>
                  <span>✉️</span>
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Past feedback history */}
      <div className="feedback-card">
        <div className="feedback-card-header">
          <div>
            <h3 className="feedback-card-title">Your Past Feedback</h3>
            <p className="feedback-card-subtitle">
              A historical log of your submitted reviews and ratings
            </p>
          </div>
          {userFeedbackList.length > 0 && (
            <span className="badge badge-blue">
              {userFeedbackList.length} Review{userFeedbackList.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '24px 0' }}>
            Loading past reviews...
          </p>
        ) : userFeedbackList.length === 0 ? (
          <div className="feedback-empty-state">
            <div className="feedback-empty-icon">📝</div>
            <div className="feedback-empty-title">No Feedback Yet</div>
            <p className="feedback-empty-text">
              You haven&apos;t submitted any doctor feedback yet. Completed consultations will allow you to share your clinical experience above.
            </p>
          </div>
        ) : (
          <div className="feedback-list">
            {userFeedbackList.map((fb) => {
              const doctorName = fb.doctor?.name || `Doctor (ID: ${fb.doctorId})`;
              const doctorSpec = fb.doctor?.specialization || fb.doctor?.department || 'Medical Specialist';
              const doctorInitial = doctorName.replace(/^Dr\.\s*/i, '').charAt(0) || 'D';
              const badgeClass = getRatingBadgeClass(fb.rating);

              return (
                <div key={fb.id || `${fb.userId}-${fb.doctorId}`} className="fb-card">
                  <div className="fb-card-main">
                    <div className="fb-doctor-header">
                      <div className="fb-doctor-avatar">{doctorInitial}</div>
                      <div>
                        <div className="fb-doctor">{doctorName}</div>
                        <div className="fb-date">
                          <span>🩺 {doctorSpec}</span>
                          {fb.branch?.name && <span>• 🏥 {fb.branch.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="fb-comment">
                      &ldquo;{fb.comment}&rdquo;
                    </div>
                  </div>

                  <div className="fb-badge-group">
                    <span className={`badge ${badgeClass}`}>
                      {fb.rating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
