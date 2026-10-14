/**
 * TokenGeneratedModal.jsx — Token Generation Success Dialog
 * ==============================================================================
 * WHAT THIS COMPONENT DOES:
 *  Displays an issued clinic token receipt with:
 *   - Prominent large token number
 *   - Patient name & ID
 *   - Attending doctor & room guidance
 *   - Print token option and Done button
 */

import React from 'react';
import Modal from '../../../components/common/Modal';

/**
 * @param {boolean} isOpen       - Whether modal is visible
 * @param {function} onClose     - Dismiss handler
 * @param {object} tokenData     - Newly issued token data payload
 */
export default function TokenGeneratedModal({ isOpen, onClose, tokenData }) {
  if (!tokenData) return null;

  const patientName = tokenData.patient?.name
    || `${tokenData.patient?.firstName || ''} ${tokenData.patient?.lastName || ''}`.trim()
    || tokenData.userId;
  const doctorName = tokenData.doctor?.name || tokenData.doctorId || 'Consultation Doctor';
  const tokenNumber = tokenData.tokenNumber || tokenData.token || '1';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinic Token Issued"
      maxWidth="460px"
      footer={
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
          <button
            type="button"
            className="followup-clear-btn"
            onClick={handlePrint}
          >
            🖨️ Print Slip
          </button>
          <button
            type="button"
            className="queue-token-btn"
            onClick={onClose}
          >
            ✓ Done
          </button>
        </div>
      }
    >
      <div className="token-modal-content">
        <div className="token-modal-badge-icon">
          ✓
        </div>

        <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
          Token Generated Successfully!
        </h3>
        <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
          Please advise the patient to wait in the clinic lounge until called.
        </p>

        <div className="token-display-box">
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Queue Token
          </span>
          <h1 className="token-display-number">#{tokenNumber}</h1>
        </div>

        <div className="token-modal-details">
          <div>Patient: <strong>{patientName}</strong> ({tokenData.userId})</div>
          <div>Attending: <strong>Dr. {doctorName.replace(/^Dr\.\s*/i, '')}</strong></div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#94a3b8' }}>
            Issued on {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
