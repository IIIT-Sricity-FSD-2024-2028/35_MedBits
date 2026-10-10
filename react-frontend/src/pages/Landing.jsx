/**
 * Landing.jsx — MedBits Public Landing Page
 * ====================================================================
 * Replaces the static front-end/html/landing.html page in React.
 * Displays the core value propositions: Hero banner, Stats, Services,
 * About MedBits, Patient Testimonials, and quick navigation to login.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_ROUTES } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine user dashboard target route if already authenticated
  const dashboardPath = user ? (ROLE_ROUTES[user.role] || '/doctor/dashboard') : '/login';

  return (
    <div className="landing-page-root">

      {/* ── SECTION 1: TOP NAVIGATION BAR ───────────────────────────── */}
      <nav className="landing-nav" aria-label="Main Navigation">
        <div className="landing-nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="landing-brand-icon">✚</div>
          <div className="landing-brand-name">MedBits</div>
        </div>

        {/* Anchor jump links for landing sections */}
        <div className="landing-nav-links">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#testimonials">Reviews</a>
          <a href="#contact">Contact</a>
        </div>

        {/* Dynamic CTA buttons: changes if already logged in */}
        <div className="landing-nav-cta">
          {user ? (
            <button
              className="btn-filled-nav"
              onClick={() => navigate(dashboardPath)}
              title={`Logged in as ${user.name}`}
            >
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button
                className="btn-outline-nav"
                onClick={() => navigate('/login')}
              >
                Log In
              </button>
              <button
                className="btn-filled-nav"
                onClick={() => navigate('/login')}
              >
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── SECTION 2: HERO BANNER & STATS ───────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span /> Trusted by 50,000+ patients across India
          </div>

          <h1>
            Book Doctor Appointments <em>Easily &amp; Quickly</em>
          </h1>

          <p>
            Find top-rated doctors, schedule visits, order medicines and access
            all your health records — all in one unified, clinical platform.
          </p>

          <div className="hero-btns">
            <button
              className="btn-hero-primary"
              onClick={() => navigate(user ? dashboardPath : '/login')}
            >
              {user ? 'Open Your Dashboard' : 'Get Started Free'}
            </button>

            <button
              className="btn-hero-secondary"
              onClick={() => navigate(user ? dashboardPath : '/login')}
            >
              Sign In →
            </button>
          </div>

          {/* Quick metric highlights */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-num">500+</div>
              <div className="stat-lbl">Verified Doctors</div>
            </div>
            <div className="hero-stat">
              <div className="stat-num">50K+</div>
              <div className="stat-lbl">Happy Patients</div>
            </div>
            <div className="hero-stat">
              <div className="stat-num">4.9★</div>
              <div className="stat-lbl">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TRUST & ACCREDITATION BAR ────────────────────── */}
      <div className="trust-bar">
        <div className="trust-item">
          <span className="trust-icon">🛡️</span>
          <span>100% Secure Health Records</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">⏱️</span>
          <span>Instant Appointment Confirmation</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">🧪</span>
          <span>NABL Accredited Diagnostics</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">🏥</span>
          <span>Integrated Hospital Network</span>
        </div>
      </div>

      {/* ── SECTION 4: CORE HEALTH SERVICES ──────────────────────────── */}
      <section className="services-section" id="services">
        <div className="section-badge">Our Services</div>
        <h2 className="section-title">Health Services For You</h2>
        <p className="section-sub">
          Everything you need for your healthcare journey in one place
        </p>

        <div className="services-grid">
          <div className="service-card" onClick={() => navigate('/login')}>
            <div className="svc-icon svc-blue">📅</div>
            <h3>Book Appointment</h3>
            <p>
              Schedule doctor appointments easily at your preferred time and date
              with instant confirmation.
            </p>
          </div>

          <div className="service-card" onClick={() => navigate('/login')}>
            <div className="svc-icon svc-green">🏥</div>
            <h3>Smart Consultation</h3>
            <p>
              In-person consultations with e-prescriptions and complete digital
              care plans.
            </p>
          </div>

          <div className="service-card" onClick={() => navigate('/login')}>
            <div className="svc-icon svc-purple">💊</div>
            <h3>Order Medicines</h3>
            <p>
              Get trusted medicines delivered quickly with secure and easy
              checkout at best prices.
            </p>
          </div>

          <div className="service-card" onClick={() => navigate('/login')}>
            <div className="svc-icon svc-orange">🧪</div>
            <h3>Lab Tests</h3>
            <p>
              Schedule diagnostic tests at home or lab with precise and timely
              digital reports.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: ABOUT MEDBITS & CLINICAL EXCELLENCE ──────────── */}
      <section className="about-section" id="about">
        <div className="about-visual">
          <div className="about-banner">🩺</div>
          <div className="about-badge">
            <div className="about-badge-icon">✓</div>
            <div className="about-badge-text">
              <strong>20+ Specialties</strong>
              <span>Trusted Multi-Specialty Care</span>
            </div>
          </div>
        </div>

        <div className="about-text">
          <div className="section-badge">Why MedBits</div>
          <h2>Compassionate Care with Digital Convenience</h2>
          <p className="about-body">
            Our platform connects patients with trusted doctors, streamlines
            appointments, provides digital prescriptions and accurate diagnostic
            services — all in one seamless experience.
          </p>

          <div className="about-points">
            <div className="about-point">
              Verified and experienced doctors across 20+ specialties
            </div>
            <div className="about-point">
              Instant appointment confirmation and queue tracking
            </div>
            <div className="about-point">
              Secure medical records and e-prescriptions anytime
            </div>
            <div className="about-point">
              24/7 dedicated patient support and clinical assistance
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: PATIENT REVIEWS & TESTIMONIALS ───────────────── */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-badge">Patient Reviews</div>
        <h2 className="section-title">What Our Patients Say</h2>
        <p className="section-sub">Real experiences from real patients across our branches</p>

        <div className="test-grid">
          <div className="test-card">
            <div>
              <div className="test-stars">★★★★★</div>
              <p>
                "Booking, consultation and reports — everything felt seamless. The
                best healthcare portal I have used!"
              </p>
            </div>
            <div className="test-author">
              <div className="test-avatar">RS</div>
              <div>
                <div className="test-name">Rakesh Sharma</div>
                <div className="test-role">Software Engineer, Chennai</div>
              </div>
            </div>
          </div>

          <div className="test-card">
            <div>
              <div className="test-stars">★★★★★</div>
              <p>
                "Very reliable service — booked tests, consulted my doctor, and kept
                all records in one place. Highly recommend!"
              </p>
            </div>
            <div className="test-author">
              <div className="test-avatar">SM</div>
              <div>
                <div className="test-name">Samyuktha M</div>
                <div className="test-role">Teacher, Hyderabad</div>
              </div>
            </div>
          </div>

          <div className="test-card">
            <div>
              <div className="test-stars">★★★★★</div>
              <p>
                "Excellent experience — appointments were easy, consultation was
                clear, and digital records were instantly accessible."
              </p>
            </div>
            <div className="test-author">
              <div className="test-avatar">KV</div>
              <div>
                <div className="test-name">Kishore V</div>
                <div className="test-role">Business Owner, Bangalore</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: CALL-TO-ACTION STRIP ─────────────────────────── */}
      <section className="cta-strip">
        <h2>Ready to take control of your health? Start your journey today.</h2>
        <button
          className="btn-cta-white"
          onClick={() => navigate(user ? dashboardPath : '/login')}
        >
          {user ? 'Open Dashboard →' : 'Create Free Account →'}
        </button>
      </section>

      {/* ── SECTION 8: FOOTER ────────────────────────────────────────── */}
      <footer className="landing-footer" id="contact">
        <div className="footer-brand">
          <div className="footer-brand-icon">✚</div>
          <div className="footer-brand-name">MedBits</div>
        </div>

        <div className="footer-links">
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#testimonials">Reviews</a>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('MedBits complies with HIPAA and local data privacy standards.'); }}>Privacy Policy</a>
          <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: Standard healthcare portal terms apply.'); }}>Terms of Service</a>
        </div>

        <div className="footer-social">
          <div className="social-btn" title="LinkedIn">in</div>
          <div className="social-btn" title="Facebook">f</div>
          <div className="social-btn" title="Twitter / X">tw</div>
        </div>

        <div className="footer-copy">
          © 2026 MedBits Healthcare Pvt. Ltd. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
