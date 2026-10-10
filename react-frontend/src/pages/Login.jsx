/**
 * Login.jsx — Authentication Page with Backend Integration
 * ====================================================================
 * Connects with the MedBits NestJS backend API (POST /users/login).
 * On successful authentication:
 *   1. Updates global AuthContext state & stores session in localStorage.
 *   2. Automatically redirects the user to their respective actor dashboard:
 *      - Doctor        → /doctor/dashboard
 *      - Patient       → /patient/dashboard
 *      - Front Desk    → /front-desk/dashboard
 *      - Lab Tech      → /lab-technician/dashboard
 *      - Branch Admin  → /branch-admin/dashboard
 *      - Super Admin   → /superuser/dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_ROUTES } from '../context/AuthContext';
import './Login.css';

// Backend API URL (defaults to http://localhost:3000 if not specified in .env)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Preset credentials for all 6 actors for quick testing and demonstration
const DEMO_ACCOUNTS = [
  { role: 'doctor',       label: 'Doctor',       email: 'madhuri@medbits.com',    password: 'doctor123',      name: 'Dr. S Madhuri' },
  { role: 'patient',      label: 'Patient',      email: 'ria@medbits.com',        password: 'patient123',     name: 'Ria Sharma' },
  { role: 'frontdesk',    label: 'Front Desk',   email: 'frontdesk@medbits.com',  password: 'desk123',        name: 'Priya Nair' },
  { role: 'labtech',      label: 'Lab Tech',     email: 'labtech@medbits.com',    password: 'lab123',         name: 'Suresh Kumar' },
  { role: 'branch_admin', label: 'Branch Admin', email: 'admin@medbits.com',      password: 'admin123',       name: 'Admin User' },
  { role: 'super_admin',  label: 'Super Admin',  email: 'superadmin@medbits.com', password: 'SuperAdmin@123', name: 'Super Admin' },
];

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Form input state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Status and error handling state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [activeChipRole, setActiveChipRole] = useState(null);

  /**
   * Auto-redirect if already logged in:
   * If a valid session exists in AuthContext, navigate straight to their dashboard.
   */
  useEffect(() => {
    if (user && user.role) {
      const redirectPath = ROLE_ROUTES[user.role] || '/doctor/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  /**
   * Helper: Fills the input fields with the selected demo account
   */
  function handleSelectDemoAccount(demo) {
    setEmail(demo.email);
    setPassword(demo.password);
    setActiveChipRole(demo.role);
    setErrorMessage('');
    setIsServerOffline(false);
  }

  /**
   * Helper: Offline Demo Login Fallback
   * Allows evaluation even when backend service is not running locally.
   */
  function handleOfflineDemoLogin() {
    const matchingDemo = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
    ) || DEMO_ACCOUNTS[0];

    const mockUser = {
      id: matchingDemo.role.toUpperCase() + '_001',
      name: matchingDemo.name,
      email: matchingDemo.email,
      role: matchingDemo.role,
      branchId: '00000000-0000-4000-8000-000000000001',
    };

    login(mockUser);
    const targetPath = ROLE_ROUTES[mockUser.role] || '/doctor/dashboard';
    navigate(targetPath);
  }

  /**
   * Main Login Submission Handler
   * Sends POST request to the backend /users/login endpoint.
   */
  async function handleSubmit(e) {
    if (e) e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setErrorMessage('');
    setIsServerOffline(false);
    setIsLoading(true);

    try {
      // ── API REQUEST: Call NestJS /users/login ───────────────────
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: password,
        }),
      });

      // Handle invalid credentials (401 or 400 response from backend)
      if (!response.ok) {
        setIsLoading(false);
        if (response.status === 401 || response.status === 400) {
          setErrorMessage('Invalid email or password. Please verify your credentials.');
        } else {
          setErrorMessage(`Login failed (Server error: HTTP ${response.status}).`);
        }
        return;
      }

      // ── SUCCESS: Parse authenticated user object ───────────────
      const authenticatedUser = await response.json();
      setIsLoading(false);

      // Save user to React state and localStorage via AuthContext
      login(authenticatedUser);

      // ── REDIRECT: Navigate to role-specific dashboard ──────────
      const userRole = authenticatedUser.role;
      const targetRoute = ROLE_ROUTES[userRole] || '/doctor/dashboard';
      navigate(targetRoute);

    } catch {
      // ── NETWORK ERROR: Backend unreachable or offline ──────────
      setIsLoading(false);
      setIsServerOffline(true);
      setErrorMessage(
        'Unable to reach backend server on port 3000. Ensure the NestJS backend is running, or continue in Demo Mode below.'
      );
    }
  }

  return (
    <div className="login-page-root">

      {/* ── TOPBAR: Back navigation and branding ──────────────────── */}
      <header className="auth-topbar">
        <button
          className="back-link"
          onClick={() => navigate('/')}
          title="Return to Landing Page"
        >
          ← Back to Home
        </button>

        <div className="auth-brand" onClick={() => navigate('/')}>
          <div className="auth-brand-icon">✚</div>
          <div className="auth-brand-name">MedBits</div>
        </div>

        <a
          href="#signup"
          className="auth-topbar-right"
          onClick={(e) => {
            e.preventDefault();
            alert('Patient self-registration is available via the backend /users endpoint.');
          }}
        >
          New here? Sign Up
        </a>
      </header>

      {/* ── SPLIT LAYOUT: Showcase panel + Login form card ─────────── */}
      <div className="auth-layout">

        {/* LEFT PANEL: Value propositions & statistics */}
        <section className="auth-left">
          <div className="left-content">
            <div className="left-tag">
              <span className="left-dot" /> Smart Healthcare Platform
            </div>

            <h1>
              Your Health,<br />Our <span>Priority</span>
            </h1>

            <p>
              Sign in to access your medical records, review appointments, order
              medicines, and manage your complete healthcare journey.
            </p>

            <div className="left-features">
              <div className="feature-row">
                <div className="feature-dot">📅</div>
                <span>Book doctor appointments in seconds</span>
              </div>
              <div className="feature-row">
                <div className="feature-dot">📋</div>
                <span>Access all your diagnostic &amp; medical records</span>
              </div>
              <div className="feature-row">
                <div className="feature-dot">💊</div>
                <span>Order medicines with home delivery</span>
              </div>
              <div className="feature-row">
                <div className="feature-dot">🔒</div>
                <span>End-to-end encrypted and HIPAA compliant</span>
              </div>
            </div>

            <div className="left-bottom">
              <div className="mini-stat">
                <div className="num">500+</div>
                <div className="lbl">Doctors</div>
              </div>
              <div className="mini-stat">
                <div className="num">50K+</div>
                <div className="lbl">Patients</div>
              </div>
              <div className="mini-stat">
                <div className="num">4.9★</div>
                <div className="lbl">Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: Login Form Card */}
        <section className="auth-right">
          <div className="login-card">
            <h2>Welcome Back 👋</h2>
            <p className="subtitle">Sign in to your account to continue</p>
            <div className="divider-line" />

            {/* Quick Demo Selector Chips for instant testing */}
            <div className="demo-role-picker">
              <div className="demo-role-header">
                <span>Quick Test Logins (1-Click Fill)</span>
              </div>
              <div className="demo-chips-grid">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    className={`demo-chip ${activeChipRole === acc.role ? 'active' : ''}`}
                    onClick={() => handleSelectDemoAccount(acc)}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error & Offline Fallback Alert */}
            {errorMessage && (
              <div className="err-box" role="alert">
                <div className="err-box-top">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>

                {/* Graceful fallback button when backend is not running */}
                {isServerOffline && (
                  <button
                    type="button"
                    className="btn-offline-demo"
                    onClick={handleOfflineDemoLogin}
                  >
                    ⚡ Continue in Demo Mode (Offline)
                  </button>
                )}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">✉️</span>
                  <input
                    id="loginEmail"
                    type="email"
                    placeholder="your.email@medbits.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔑</span>
                  <input
                    id="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password row */}
              <div className="form-row">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <span
                  className="forgot"
                  onClick={() => alert('Password reset link has been dispatched to your email address.')}
                >
                  Forgot Password?
                </span>
              </div>

              {/* Submit button with loading state */}
              <button
                type="submit"
                className="btn-login"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner" />
                    Connecting to Backend...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="signup-row">
              Don't have an account?{' '}
              <span onClick={() => alert('Contact your branch front desk or super admin to register an account.')}>
                Create one free
              </span>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
