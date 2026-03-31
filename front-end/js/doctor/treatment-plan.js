/* treatment-plan.js */
(async () => {
  await loadComponents('treatment-plan', 'Treatment Plan');

  const patientSelect = document.getElementById('patientSelect');
  const savePlanBtn = document.getElementById('savePlanBtn');
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  const historyModal = document.getElementById('historyModal');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyList = document.getElementById('historyList');
  const historyTitle = document.getElementById('historyModalTitle');
  const errorBanner = document.getElementById('planErrorBanner');
  const formFieldIds = ['medicines', 'tests', 'lifestyle', 'diet', 'duration'];

  function showFormError(message) {
    if (!errorBanner) return;
    errorBanner.textContent = message;
    errorBanner.classList.add('show');
  }

  function clearFormError() {
    if (!errorBanner) return;
    errorBanner.textContent = '';
    errorBanner.classList.remove('show');
  }

  function setFieldError(field, shouldHighlight) {
    if (!field) return;
    field.classList.toggle('field-error', shouldHighlight);
  }

  function clearFieldErrors() {
    setFieldError(patientSelect, false);
    formFieldIds.forEach(id => setFieldError(document.getElementById(id), false));
  }

  function collectPlanValues() {
    return {
      medicines: document.getElementById('medicines').value.trim(),
      tests: document.getElementById('tests').value.trim(),
      lifestyle: document.getElementById('lifestyle').value.trim(),
      diet: document.getElementById('diet').value.trim(),
      duration: document.getElementById('duration').value.trim(),
    };
  }

  function validatePlan(patientId, plan) {
    if (!patientId) {
      setFieldError(patientSelect, true);
      return 'Please select a patient before saving the treatment plan.';
    }

    const hasAnyContent = Object.values(plan).some(Boolean);
    if (!hasAnyContent) {
      formFieldIds.forEach(id => setFieldError(document.getElementById(id), true));
      return 'Enter at least one treatment detail before saving.';
    }

    if (plan.duration && plan.duration.length < 3) {
      setFieldError(document.getElementById('duration'), true);
      return 'Treatment duration looks too short. Use a value like "2 weeks" or "1 month".';
    }

    return '';
  }

  function getAllPlans() {
    try {
      return JSON.parse(localStorage.getItem('treatmentPlans') || '{}');
    } catch (error) {
      throw new Error('Saved treatment plan data is corrupted. Clear the stored plans and try again.');
    }
  }

  function savePlan(patientId, plan) {
    const all = getAllPlans();
    if (!all[patientId]) all[patientId] = [];
    all[patientId].unshift(plan);

    try {
      localStorage.setItem('treatmentPlans', JSON.stringify(all));
    } catch (error) {
      throw new Error('Unable to save the treatment plan right now. Browser storage may be unavailable.');
    }
  }

  function getPatientPlans(patientId) {
    return getAllPlans()[patientId] || [];
  }

  function clearFormFields() {
    formFieldIds.forEach(id => {
      document.getElementById(id).value = '';
    });
  }

  savePlanBtn.addEventListener('click', () => {
    clearFormError();
    clearFieldErrors();

    const patientId = patientSelect.value;
    const planValues = collectPlanValues();
    const validationError = validatePlan(patientId, planValues);

    if (validationError) {
      showFormError(validationError);
      showToast(validationError, 'error');
      return;
    }

    const plan = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...planValues,
    };

    try {
      savePlan(patientId, plan);
      clearFormFields();
      showToast('Treatment plan saved successfully!', 'success');
    } catch (error) {
      showFormError(error.message);
      showToast(error.message, 'error');
    }
  });

  viewHistoryBtn.addEventListener('click', () => {
    clearFormError();
    clearFieldErrors();

    const patientId = patientSelect.value;
    const patientName = patientSelect.options[patientSelect.selectedIndex]?.text || 'Patient';

    if (!patientId) {
      const message = 'Please select a patient first.';
      setFieldError(patientSelect, true);
      showFormError(message);
      showToast(message, 'error');
      return;
    }

    try {
      const plans = getPatientPlans(patientId);
      historyTitle.textContent = `Treatment History - ${patientName}`;
      historyList.innerHTML = '';

      if (plans.length === 0) {
        historyList.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem;text-align:center;padding:20px 0;">No treatment plans saved yet for this patient.</p>';
      } else {
        plans.forEach((plan, index) => {
          const card = document.createElement('div');
          card.style.cssText = 'border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:16px;margin-bottom:14px;';
          card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <span style="font-weight:700;font-size:.875rem;">Plan #${plans.length - index}</span>
              <span style="font-size:.78rem;color:var(--text-muted);">${plan.date || 'Unknown date'}</span>
            </div>
            ${plan.medicines ? `<div class="hist-row"><strong>Medicines:</strong> ${plan.medicines}</div>` : ''}
            ${plan.tests ? `<div class="hist-row"><strong>Tests:</strong> ${plan.tests}</div>` : ''}
            ${plan.lifestyle ? `<div class="hist-row"><strong>Lifestyle:</strong> ${plan.lifestyle}</div>` : ''}
            ${plan.diet ? `<div class="hist-row"><strong>Diet:</strong> ${plan.diet}</div>` : ''}
            ${plan.duration ? `<div class="hist-row"><strong>Duration:</strong> ${plan.duration}</div>` : ''}`;
          historyList.appendChild(card);
        });
      }

      historyModal.classList.add('open');
    } catch (error) {
      showFormError(error.message);
      showToast(error.message, 'error');
    }
  });

  closeHistoryBtn.addEventListener('click', () => historyModal.classList.remove('open'));
  historyModal.addEventListener('click', event => {
    if (event.target === historyModal) historyModal.classList.remove('open');
  });

  [patientSelect, ...formFieldIds.map(id => document.getElementById(id))].forEach(field => {
    if (!field) return;

    const clearCurrentFieldError = () => {
      setFieldError(field, false);
      clearFormError();
    };

    field.addEventListener('input', clearCurrentFieldError);
    field.addEventListener('change', clearCurrentFieldError);
  });
})();
