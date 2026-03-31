(async () => {
  await loadComponents('internal-referral', 'Internal Referral');

  const STATIC_REFERRALS = [
    {
      patient: 'Neil Verma',
      doctor: 'Dr. Anil Kumar - Cardiology',
      priority: 'Urgent',
      status: 'Pending',
      statusClass: 'badge-pending',
      date: 'Mar 5, 2026'
    },
    {
      patient: 'Alisha Verma',
      doctor: 'Dr. Meena Iyer - Endocrinology',
      priority: 'Routine',
      status: 'Accepted',
      statusClass: 'badge-confirmed',
      date: 'Feb 28, 2026'
    }
  ];

  const previousReferralsList = document.getElementById('previousReferralsList');
  const allReferralsList = document.getElementById('allReferralsList');
  const referralModal = document.getElementById('referralModal');
  const viewAllReferralsBtn = document.getElementById('viewAllReferralsBtn');
  const closeReferralModal = document.getElementById('closeReferralModal');

  function getSavedReferrals() {
    return JSON.parse(localStorage.getItem('referralHistory') || '[]');
  }

  function saveReferral(ref) {
    const list = getSavedReferrals();
    list.unshift(ref);
    localStorage.setItem('referralHistory', JSON.stringify(list));
  }

  function getAllReferrals() {
    return [...getSavedReferrals(), ...STATIC_REFERRALS];
  }

  function buildReferralRow(ref) {
    const initials = ref.patient.split(' ').filter(Boolean).map(word => word[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#5c7a60', '#3a7d44', '#7a5c60', '#5c6a7a', '#6a7a5c'];
    const color = colors[Math.abs(ref.patient.charCodeAt(0) % colors.length)];
    return `
      <div class="patient-row">
        <div class="patient-left">
          <div class="avatar" style="background:${color};">${initials}</div>
          <div>
            <div class="patient-name">${ref.patient}</div>
            <div class="patient-meta">Referred to ${ref.doctor} - ${ref.priority}</div>
          </div>
        </div>
        <div class="patient-right">
          <span class="badge ${ref.statusClass || 'badge-pending'}">${ref.status || 'Pending'}</span>
          <span class="date-label">${ref.date}</span>
        </div>
      </div>`;
  }

  function renderHistory() {
    const combined = getAllReferrals();
    previousReferralsList.innerHTML = combined.slice(0, 3).map(buildReferralRow).join('');
    allReferralsList.innerHTML = combined.map(buildReferralRow).join('');
  }

  function openReferralModal() {
    referralModal.classList.add('open');
  }

  function closeReferralModalPanel() {
    referralModal.classList.remove('open');
  }

  viewAllReferralsBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openReferralModal();
  });

  closeReferralModal.addEventListener('click', closeReferralModalPanel);
  referralModal.addEventListener('click', (event) => {
    if (event.target === referralModal) {
      closeReferralModalPanel();
    }
  });

  document.getElementById('sendReferralBtn').addEventListener('click', () => {
    const patient = document.getElementById('refPatient').value;
    const doctor = document.getElementById('refDoctor').value;
    const reason = document.getElementById('refReason').value;
    const priority = document.getElementById('refPriority').value;
    const date = document.getElementById('refDate').value;

    if (!patient || !doctor) {
      showToast('Please fill in required fields.', 'error');
      return;
    }

    const ref = {
      patient: patient.replace(/^PAT-\d+ - /, ''),
      doctor,
      reason,
      priority,
      status: 'Pending',
      statusClass: 'badge-pending',
      date: date
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    saveReferral(ref);
    renderHistory();
    showToast('Referral sent successfully!', 'success');

    ['refPatient', 'refDoctor', 'refReason', 'refNotes', 'refDate'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('refPriority').value = 'Routine';
  });

  renderHistory();
})();
