(async () => {
  await loadComponents('internal-referral', 'Internal Referral');

  function getDoctorSession() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (_) {
      return {};
    }
  }

  const session = getDoctorSession();
  const currentDoctorId = session.doctorId || (session.id === 'DOCTOR_001' ? 'DOC001' : session.id) || 'DOC001';
  const currentDoctorName = session.name || 'Dr. S Madhuri';
  const API_BASE = 'http://localhost:3000';

  function isMyDoctorId(id) {
    if (!id) return false;
    if (id === currentDoctorId) return true;
    if ((currentDoctorId === 'DOC001' || currentDoctorId === 'DOCTOR_001') && (id === 'DOC001' || id === 'DOCTOR_001')) return true;
    return false;
  }

  function normalizeReferral(ref) {
    const pName = ref.patient || ref.patientName || ref.patientId || 'Patient';
    const toDoc = ref.doctor || ref.toDoctorName || ref.toDoctorId || 'Doctor';
    const fromDoc = ref.fromDoctorName || ref.fromDoctorId || 'Doctor';
    const priority = ref.priority || ref.urgency || 'Routine';
    const status = ref.status || 'Pending';
    const statusClass = status.toLowerCase() === 'accepted' ? 'badge-confirmed' : (status.toLowerCase() === 'completed' ? 'badge-confirmed' : 'badge-pending');
    const date = ref.preferredDate || (ref.createdAt ? new Date(ref.createdAt).toLocaleDateString('en-CA') : ref.date) || new Date().toLocaleDateString('en-CA');
    return {
      ...ref,
      id: ref.id || `REF${Date.now()}`,
      patient: pName,
      patientName: pName,
      patientId: ref.patientId,
      doctor: toDoc,
      toDoctorName: toDoc,
      doctorId: ref.toDoctorId || ref.doctorId,
      toDoctorId: ref.toDoctorId || ref.doctorId,
      fromDoctorId: ref.fromDoctorId,
      fromDoctorName: fromDoc,
      priority,
      urgency: priority,
      status,
      statusClass,
      date,
    };
  }

  async function loadDoctors() {
    try {
      const response = await fetch(`${API_BASE}/doctors`, {
        headers: { role: 'doctor' },
      });
      if (!response.ok) return;
      const doctors = await response.json();
      const doctorSelect = document.getElementById('refDoctor');
      if (Array.isArray(doctors) && doctors.length > 0) {
        doctorSelect.innerHTML = '<option value="">- Select -</option>';
        doctors.forEach(doc => {
          if (isMyDoctorId(doc.id) || isMyDoctorId(doc.userId)) return;
          const opt = document.createElement('option');
          opt.value = doc.id;
          opt.textContent = `${doc.name} - ${doc.specialization}`;
          doctorSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('Could not load live doctors list, keeping existing options', e);
    }
  }

  async function loadPatients() {
    try {
      const response = await fetch(`${API_BASE}/patients`, {
        headers: { role: 'doctor' },
      });
      if (!response.ok) return;
      const patients = await response.json();
      const patientSelect = document.getElementById('refPatient');
      if (Array.isArray(patients) && patients.length > 0) {
        patientSelect.innerHTML = '<option value="">- Select Patient -</option>';
        patients.forEach(p => {
          const pId = p.userId || p.id;
          const pName = p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || pId;
          const opt = document.createElement('option');
          opt.value = pId;
          opt.textContent = `${pId} - ${pName}`;
          patientSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('Could not load live patients list, keeping existing options', e);
    }
  }

  async function loadServerReferrals() {
    try {
      const response = await fetch(`${API_BASE}/doctors/${encodeURIComponent(currentDoctorId)}/referrals`, {
        headers: { role: 'doctor' },
      });
      if (!response.ok) return;
      const serverReferrals = await response.json();
      if (Array.isArray(serverReferrals) && serverReferrals.length > 0) {
        const local = getSavedReferrals();
        const localIds = new Set(local.map(r => r.id));
        const merged = [...local];
        serverReferrals.forEach(sr => {
          if (!localIds.has(sr.id)) {
            merged.push(normalizeReferral(sr));
            localIds.add(sr.id);
          }
        });
        localStorage.setItem('referralHistory', JSON.stringify(merged));
        renderHistory();
      }
    } catch (e) {
      console.warn('Could not sync referrals from server', e);
    }
  }

  await Promise.allSettled([loadDoctors(), loadPatients()]);
  await loadServerReferrals();

  const previousReferralsList = document.getElementById('previousReferralsList');
  const allReferralsList = document.getElementById('allReferralsList');
  const referralModal = document.getElementById('referralModal');
  const viewAllReferralsBtn = document.getElementById('viewAllReferralsBtn');
  const closeReferralModal = document.getElementById('closeReferralModal');

  const incomingReferralsList = document.getElementById('incomingReferralsList');
  const allIncomingList = document.getElementById('allIncomingList');
  const incomingModal = document.getElementById('incomingModal');
  const viewAllIncomingBtn = document.getElementById('viewAllIncomingBtn');
  const closeIncomingModal = document.getElementById('closeIncomingModal');

  function getSavedReferrals() {
    try {
      const list = JSON.parse(localStorage.getItem('referralHistory') || '[]');
      return Array.isArray(list) ? list.map(normalizeReferral) : [];
    } catch (_) {
      return [];
    }
  }

  function saveReferral(ref) {
    const list = getSavedReferrals();
    list.unshift(normalizeReferral(ref));
    localStorage.setItem('referralHistory', JSON.stringify(list));
  }

  function getAllReferrals() {
    return getSavedReferrals();
  }

  function buildReferralRow(ref) {
    const initials = (ref.patient || 'P').split(' ').filter(Boolean).map(word => word[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#5c7a60', '#3a7d44', '#7a5c60', '#5c6a7a', '#6a7a5c'];
    const color = colors[Math.abs((ref.patient || 'P').charCodeAt(0) % colors.length)];
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

  function buildIncomingRow(ref) {
    const initials = (ref.patient || 'P').split(' ').filter(Boolean).map(word => word[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#5c7a60', '#3a7d44', '#7a5c60', '#5c6a7a', '#6a7a5c'];
    const color = colors[Math.abs((ref.patient || 'P').charCodeAt(0) % colors.length)];
    const fromDoctor = ref.fromDoctorName || 'Another Doctor';
    return `
      <div class="patient-row">
        <div class="patient-left">
          <div class="avatar" style="background:${color};">${initials}</div>
          <div>
            <div class="patient-name">${ref.patient}</div>
            <div class="patient-meta">Referred by ${fromDoctor} - ${ref.priority}</div>
          </div>
        </div>
        <div class="patient-right">
          <span class="badge ${ref.statusClass || 'badge-pending'}">${ref.status || 'Pending'}</span>
          <span class="date-label">${ref.date}</span>
        </div>
      </div>`;
  }

  function renderHistory() {
    const all = getAllReferrals();
    
    const outgoing = all.filter(ref => isMyDoctorId(ref.fromDoctorId));
    if (outgoing.length === 0) {
      previousReferralsList.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem;padding:20px 0;text-align:center;">No previous referrals</p>';
      allReferralsList.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem;padding:20px 0;text-align:center;">No previous referrals</p>';
    } else {
      previousReferralsList.innerHTML = outgoing.slice(0, 3).map(buildReferralRow).join('');
      allReferralsList.innerHTML = outgoing.map(buildReferralRow).join('');
    }

    const incoming = all.filter(ref => isMyDoctorId(ref.toDoctorId || ref.doctorId));
    if (incoming.length === 0) {
      incomingReferralsList.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem;padding:20px 0;text-align:center;">No incoming referrals</p>';
      allIncomingList.innerHTML = '<p style="color:var(--text-muted);font-size:.875rem;padding:20px 0;text-align:center;">No incoming referrals</p>';
    } else {
      incomingReferralsList.innerHTML = incoming.slice(0, 3).map(buildIncomingRow).join('');
      allIncomingList.innerHTML = incoming.map(buildIncomingRow).join('');
    }
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

  viewAllIncomingBtn.addEventListener('click', (event) => {
    event.preventDefault();
    incomingModal.classList.add('open');
  });

  closeIncomingModal.addEventListener('click', () => {
    incomingModal.classList.remove('open');
  });

  incomingModal.addEventListener('click', (event) => {
    if (event.target === incomingModal) {
      incomingModal.classList.remove('open');
    }
  });

  document.getElementById('sendReferralBtn').addEventListener('click', async () => {
    const patientEl = document.getElementById('refPatient');
    const doctorEl = document.getElementById('refDoctor');
    const patientId = patientEl.value;
    const doctorId = doctorEl.value;
    const patientName = patientEl.options[patientEl.selectedIndex]?.text.replace(/^[A-Z0-9_-]+ - /, '') || patientId;
    const doctorName = doctorEl.options[doctorEl.selectedIndex]?.text || doctorId;
    const reason = document.getElementById('refReason').value.trim();
    const priority = document.getElementById('refPriority').value;
    const date = document.getElementById('refDate').value;

    if (!patientId || !doctorId) {
      showToast('Please select both a patient and a doctor.', 'error');
      return;
    }
    if (!reason) {
      showToast('Please provide a reason for referral.', 'error');
      return;
    }

    const payload = {
      patientId,
      patientName,
      toDoctorId: doctorId,
      reason,
      urgency: priority,
      preferredDate: date || undefined,
    };

    let saved = null;
    try {
      const response = await fetch(`${API_BASE}/doctors/${encodeURIComponent(currentDoctorId)}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          role: 'doctor',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        saved = await response.json();
      }
    } catch (e) {
      console.warn('Could not post referral to server, saving locally', e);
    }

    const ref = normalizeReferral(saved || {
      id: `REF${Date.now()}`,
      patientId,
      patient: patientName,
      patientName,
      doctorId,
      toDoctorId: doctorId,
      doctor: doctorName,
      toDoctorName: doctorName,
      fromDoctorId: currentDoctorId,
      fromDoctorName: currentDoctorName,
      reason,
      priority,
      urgency: priority,
      status: 'Pending',
      statusClass: 'badge-pending',
      date: date
        ? new Date(date).toLocaleDateString('en-CA')
        : new Date().toLocaleDateString('en-CA'),
    });

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
