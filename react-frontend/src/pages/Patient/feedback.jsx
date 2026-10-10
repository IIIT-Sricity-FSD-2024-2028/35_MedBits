/**
 * feedback.jsx — Patient Doctor Feedback & Reviews
 * ====================================================================
 * Location: src/pages/Patient/feedback.jsx
 *
 * OVERVIEW:
 *  Allows patients to provide structured feedback and ratings for doctors
 *  with whom they have completed consultations. It also displays a history
 *  of all feedback previously submitted by the patient.
 *
 * BACKEND INTEGRATION:
 *  - GET  /appointments/completed/:userId  -> Retrieves completed visits
 *  - GET  /feedback/user/:userId           -> Retrieves submitted feedbacks
 *  - POST /feedback                        -> Submits new review for a doctor
 *
 * WORKFLOW & BUSINESS RULES:
 *  1. Only completed consultations qualify for doctor reviews.
 *  2. A patient can submit feedback for each doctor only once (enforced
 *     both locally in the doctor selector and on the backend service).
 *  3. After submission, form inputs reset and the user's feedback list
 *     reloads automatically.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/layout/AppShell';
import './feedback.css';

// Base URL for backend API (uses Vite environment variable or defaults to port 3000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Rating configuration mapping:
 * Associates each rating level with custom styling classes and visual star cues.
 */
const RATING_OPTIONS = [
  { value: 'Bad', label: 'Bad', colorClass: 'rating-bad', badgeClass: 'badge-red', stars: '★☆☆☆☆' },
  { value: 'Average', label: 'Average', colorClass: 'rating-avg', badgeClass: 'badge-orange', stars: '★★☆☆☆' },
  { value: 'Good', label: 'Good', colorClass: 'rating-good', badgeClass: 'badge-green', stars: '★★★☆☆' },
  { value: 'Better', label: 'Better', colorClass: 'rating-better', badgeClass: 'badge-green', stars: '★★★★☆' },
  { value: 'Excellent', label: 'Excellent', colorClass: 'rating-excellent', badgeClass: 'badge-green', stars: '★★★★★' },
];

/**
 * Helper to match rating value to its respective badge CSS class
 * @param {string} ratingValue - Rating text string
 * @returns {string} badge CSS class
 */
function getRatingBadgeClass(ratingValue) {
  const match = RATING_OPTIONS.find((opt) => opt.value === ratingValue);
  return match ? match.badgeClass : 'badge-blue';
}

export default function PatientFeedback() {
  const { user } = useAuth();
  const userId = user?.id;

  // ── 1. COMPONENT STATE ──────────────────────────────────────────────
  // Backend data state
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [userFeedbackList, setUserFeedbackList] = useState([]);

  // Form input state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [comment, setComment] = useState('');

  // UI status and loader indicators
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // ── 2. DATA FETCHING FUNCTION ───────────────────────────────────────
  /**
   * Fetches completed appointments and past user feedback concurrently.
   * @param {string} id - Active patient user ID
   */
  async function fetchPatientFeedbackData(id) {
    if (!id) return;

    const headers = {
      role: 'patient',
      'x-user-id': id,
    };

    // Parallel fetch for optimal load times
    const [aptRes, feedbackRes] = await Promise.all([
      fetch(`${API_BASE_URL}/appointments/completed/${encodeURIComponent(id)}`, { headers }),
      fetch(`${API_BASE_URL}/feedback/user/${encodeURIComponent(id)}`, { headers }),
    ]);

    if (!aptRes.ok) {
      throw new Error('Failed to load completed appointments from server.');
    }
    if (!feedbackRes.ok) {
      throw new Error('Failed to load past feedback from server.');
    }

    const appointmentsData = await aptRes.json();
    const feedbackData = await feedbackRes.json();

    setCompletedAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
    setUserFeedbackList(Array.isArray(feedbackData) ? feedbackData : []);
  }

  // ── 3. DATA FETCHING EFFECT ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setStatusMessage(null);

      try {
        await fetchPatientFeedbackData(userId);
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching feedback data:', err);
          setStatusMessage({
            type: 'error',
            text: err.message || 'Unable to load feedback data from the backend server.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // ── 4. FILTERING: Available doctors for new feedback ───────────────
  /**
   * Filters completed appointments to find doctors whom the patient
   * has consulted with but NOT yet reviewed.
   * Deduplicates by doctor ID so each doctor appears only once in the dropdown.
   */
  const availableDoctors = useMemo(() => {
    // Set of doctor IDs for which feedback has already been submitted
    const reviewedDoctorIds = new Set(userFeedbackList.map((fb) => fb.doctorId));

    // Deduplication tracker
    const seenDoctorIds = new Set();
    const doctorsList = [];

    completedAppointments.forEach((apt) => {
      const doc = apt.doctor || {};
      const doctorId = doc.id || apt.doctorId;

      if (!doctorId) return;

      // Only include doctors who haven't received feedback yet and haven't been added to list
      if (!reviewedDoctorIds.has(doctorId) && !seenDoctorIds.has(doctorId)) {
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
  }, [completedAppointments, userFeedbackList]);

  // Determine active doctor ID from selection or default to first available
  const activeDoctorId = useMemo(() => {
    if (selectedDoctorId && availableDoctors.some((d) => d.id === selectedDoctorId)) {
      return selectedDoctorId;
    }
    return availableDoctors[0]?.id || '';
  }, [selectedDoctorId, availableDoctors]);

  // ── 5. FORM SUBMISSION: Link to backend POST /feedback ──────────────
  /**
   * Validates form fields and submits patient review to the backend.
   */
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    // Client-side validation checks
    if (!activeDoctorId) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a consulted doctor from your completed appointments.',
      });
      return;
    }

    if (!selectedRating) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a rating for your consultation experience.',
      });
      return;
    }

    if (!comment.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please write your feedback comment before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    // Find selected doctor object to include optional hospital branch identifier
    const chosenDoctor = availableDoctors.find((d) => d.id === activeDoctorId);

    const payload = {
      userId,
      doctorId: activeDoctorId,
      rating: selectedRating,
      comment: comment.trim(),
      ...(chosenDoctor?.branchId ? { branchId: chosenDoctor.branchId } : {}),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: 'patient',
          'x-user-id': userId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Unable to submit feedback to backend.');
      }

      // Successful submission: reset input fields
      setComment('');
      setSelectedRating('');
      setSelectedDoctorId('');
      setStatusMessage({
        type: 'success',
        text: 'Thank you! Your feedback has been submitted successfully.',
      });

      // Reload updated lists from backend
      await fetchPatientFeedbackData(userId);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred while submitting feedback.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 6. RENDER UI ────────────────────────────────────────────────────
  return (
    <AppShell pageTitle="Doctor Feedback">
      <div className="feedback-container">

        {/* ── HERO BANNER ────────────────────────────────────────────── */}
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

        {/* Dynamic status alert notification */}
        {statusMessage && (
          <div className={`feedback-alert ${statusMessage.type}`}>
            <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* ── SHARE YOUR EXPERIENCE (FEEDBACK FORM) ──────────────────── */}
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

              {/* 1. Doctor Selection Dropdown */}
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
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
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

              {/* 2. Interactive Rating Buttons */}
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
                        onClick={() => setSelectedRating(option.value)}
                        aria-pressed={isSelected}
                      >
                        <span>{option.label}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Feedback Comments */}
              <div className="feedback-form-group">
                <label htmlFor="fb-comment-text">
                  <span>Your Feedback & Observations</span>
                  <span className="feedback-char-count">{comment.length} / 500 characters</span>
                </label>
                <textarea
                  id="fb-comment-text"
                  placeholder="Share details about the doctor's communication, diagnosis, attentiveness, and care..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  required
                />
              </div>

              {/* 4. Submission Button */}
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

        {/* ── YOUR PAST FEEDBACK LIST ────────────────────────────────── */}
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
    </AppShell>
  );
}
