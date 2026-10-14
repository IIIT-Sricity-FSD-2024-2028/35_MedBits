/**
 * RegistrationSuccessCard.jsx — Walk-in Registration Confirmation Receipt
 * =========================================================================
 * Displays a prominent green confirmation card with the patient's generated
 * Registration ID and User ID, allowing front-desk staff to dismiss or
 * proceed to register another patient.
 *
 * PROPS:
 *  @param {object} successInfo - Registered patient details:
 *                                { name, registrationId, patientId, phone, bloodGroup }
 *  @param {function} onDismiss - Callback to dismiss the card
 *  @param {function} onRegisterAnother - Callback to reset form for another patient
 *  @param {function} onReturnToDashboard - Callback to navigate back to dashboard
 */

import React from 'react';

export default function RegistrationSuccessCard({
  successInfo,
  onDismiss,
  onRegisterAnother,
  onReturnToDashboard,
}) {
  if (!successInfo) return null;

  return (
    <div
      role="status"
      style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>✅</span>
          <div>
            <h3 style={{ margin: 0, color: '#166534', fontSize: '16px', fontWeight: 700 }}>
              Walk-in Patient Successfully Registered!
            </h3>
            <p style={{ margin: '2px 0 0', color: '#15803d', fontSize: '13px' }}>
              Patient record created and walk-in token generated in the system.
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              color: '#15803d',
              cursor: 'pointer',
              padding: '4px',
            }}
            title="Dismiss message"
          >
            ✕
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          background: '#ffffff',
          border: '1px solid #dcfce7',
          borderRadius: '6px',
          padding: '12px 16px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Patient Name
          </span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {successInfo.name}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Registration ID
          </span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
            {successInfo.registrationId}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Patient User ID
          </span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>
            {successInfo.patientId}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Phone / Blood Group
          </span>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
            {successInfo.phone} ({successInfo.bloodGroup})
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        {onReturnToDashboard && (
          <button
            type="button"
            onClick={onReturnToDashboard}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Return to Dashboard
          </button>
        )}
        {onRegisterAnother && (
          <button
            type="button"
            onClick={onRegisterAnother}
            style={{
              background: '#ffffff',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Register Another Patient
          </button>
        )}
      </div>
    </div>
  );
}
