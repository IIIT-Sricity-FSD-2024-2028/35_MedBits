/**
 * Unauthorized.jsx — 403 Forbidden Page
 * ====================================================================
 * Displayed when an authenticated user attempts to access a portal route
 * restricted to a different role (e.g. a patient attempting /superuser routes).
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_ROUTES } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userDashboard = user ? (ROLE_ROUTES[user.role] || '/') : '/login';

  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      minHeight: '100vh',
      fontFamily: 'DM Sans, sans-serif',
      background: '#f8fafc',
      padding: '24px',
    }}>
      <div style={{
        background: '#ffffff',
        padding: '48px 40px',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
        textAlign: 'center',
        maxWidth: '460px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: '#fee2e2',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: '28px',
          margin: '0 auto 16px',
        }}>
          🚫
        </div>

        <h1 style={{
          fontFamily: 'Sora, sans-serif',
          fontSize: '26px',
          fontWeight: 800,
          color: '#0f172a',
          marginBottom: '8px',
        }}>
          403 — Access Denied
        </h1>

        <p style={{
          color: '#64748b',
          fontSize: '14.5px',
          lineHeight: 1.6,
          marginBottom: '28px',
        }}>
          You do not have administrative privileges or permissions to access this page.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate(userDashboard)}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '11px 22px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'Sora, sans-serif',
            }}
          >
            Go to Your Dashboard
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              padding: '11px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
