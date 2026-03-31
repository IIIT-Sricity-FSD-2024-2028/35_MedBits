/* ============================================================
   WALKIN.JS - Walk-in Registration page logic
   ============================================================ */

let allPatients = [];

document.addEventListener('DOMContentLoaded', async () => {
  renderShell('walkin');

  const data = await loadData();
  if (!data) {
    showToast('Failed to load data.', 'error');
    return;
  }

  allPatients = data.patients;
  renderRecentRegistrations(getRecentRegistrations(allPatients));

  const searchInput = document.getElementById('patient-search');
  const searchResults = document.getElementById('search-results');

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      searchResults.classList.add('hidden');
      return;
    }

    const matches = allPatients.filter(p =>
      p.phone.includes(query) ||
      p.patientId.toLowerCase().includes(query) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query)
    );

    if (!matches.length) {
      searchResults.innerHTML = '<div class="search-result-item"><div class="search-result-info"><span class="search-result-name">No patients found</span></div></div>';
    } else {
      searchResults.innerHTML = matches.map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <div class="search-result-info">
            <span class="search-result-name">${p.firstName} ${p.lastName}</span>
            <span class="search-result-meta">${p.age} ${p.gender[0]} &bull; ${p.phone}</span>
          </div>
          <span class="search-result-id">${p.patientId}</span>
        </div>
      `).join('');

      searchResults.querySelectorAll('.search-result-item[data-id]').forEach(item => {
        item.addEventListener('click', () => {
          const patient = allPatients.find(p => p.id === item.dataset.id);
          if (patient) fillForm(patient);
          searchResults.classList.add('hidden');
          searchInput.value = '';
        });
      });
    }

    searchResults.classList.remove('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.add('hidden');
    }
  });

  document.getElementById('register-btn').addEventListener('click', handleRegister);
  document.getElementById('close-success-modal').addEventListener('click', closeModal);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-book-appointment').addEventListener('click', () => {
    closeModal();
    navigateTo('appointments');
  });

  bindRegistrationModals();
});

function fillForm(patient) {
  document.getElementById('first-name').value = patient.firstName;
  document.getElementById('last-name').value = patient.lastName;
  document.getElementById('email').value = patient.email;
  document.getElementById('phone').value = patient.phone;
  document.getElementById('dob').value = patient.dob;
  document.getElementById('gender').value = patient.gender;
  document.getElementById('blood-group').value = patient.bloodGroup;
  document.getElementById('guardian').value = patient.guardian || '';

  setSelectedPatient(patient);
  showToast(`Loaded patient: ${patient.firstName} ${patient.lastName}`);
}

function handleRegister() {
  const fields = [
    { id: 'first-name', errId: 'err-first-name', rules: { required: true } },
    { id: 'last-name', errId: 'err-last-name', rules: { required: true } },
    { id: 'email', errId: 'err-email', rules: { required: true, email: true } },
    { id: 'phone', errId: 'err-phone', rules: { required: true, phone: true } },
    { id: 'dob', errId: 'err-dob', rules: { required: true, dob: true } },
    { id: 'gender', errId: 'err-gender', rules: { required: true } },
    { id: 'blood-group', errId: 'err-blood-group', rules: { required: true } }
  ];

  let valid = true;
  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const errEl = document.getElementById(f.errId);
    if (!validateField(input, errEl, f.rules)) valid = false;
  });

  if (!valid) {
    showToast('Please fix the errors before submitting.', 'error');
    return;
  }

  const newPatient = {
    id: 'P_NEW_' + Date.now(),
    patientId: 'S' + Math.floor(10000 + Math.random() * 90000),
    firstName: document.getElementById('first-name').value.trim(),
    lastName: document.getElementById('last-name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    dob: document.getElementById('dob').value.trim(),
    gender: document.getElementById('gender').value,
    bloodGroup: document.getElementById('blood-group').value,
    guardian: document.getElementById('guardian').value.trim(),
    age: calculateAge(document.getElementById('dob').value.trim())
  };

  setSelectedPatient(newPatient);
  saveRecentRegistration(newPatient);
  renderRecentRegistrations(getRecentRegistrations(allPatients));

  document.getElementById('modal-success-body').innerHTML = `
    <div class="modal-success-row"><span>Patient Name</span><span>${newPatient.firstName} ${newPatient.lastName}</span></div>
    <div class="modal-success-row"><span>Patient ID</span><span>${newPatient.patientId}</span></div>
    <div class="modal-success-row"><span>Age &amp; Gender</span><span>${newPatient.age} ${newPatient.gender}</span></div>
    <div class="modal-success-row"><span>Phone Number</span><span>${newPatient.phone}</span></div>
    <div class="modal-success-row"><span>Blood Group</span><span>${newPatient.bloodGroup}</span></div>
  `;
  document.getElementById('success-modal').classList.remove('hidden');

  clearForm();
}

function renderRecentRegistrations(registrations) {
  const container = document.getElementById('recent-registrations-list');
  if (!container) return;

  if (!registrations.length) {
    container.innerHTML = '<div class="empty-state"><p>No recent registrations</p></div>';
    return;
  }

  const visibleRegistrations = registrations.slice(0, 4);
  container.innerHTML = visibleRegistrations.map(patient => `
    <div class="recent-reg-entry">
      <div>
        <div class="recent-reg-name">${patient.firstName} ${patient.lastName}</div>
        <div class="recent-reg-meta">${patient.patientId} | ${patient.age} ${patient.gender} | ${patient.phone}</div>
      </div>
      <button class="btn btn-outline btn-sm" data-registration-view="${patient.patientId}">View details</button>
    </div>
  `).join('');

  bindRegistrationButtons(registrations);
}

function bindRegistrationButtons(registrations) {
  document.querySelectorAll('[data-registration-view]').forEach(button => {
    button.onclick = () => {
      const patient = registrations.find(item => item.patientId === button.dataset.registrationView);
      if (patient) openRegistrationDetail(patient);
    };
  });
}

function bindRegistrationModals() {
  const viewAllButton = document.getElementById('view-all-registrations-btn');
  const listModal = document.getElementById('registration-list-modal');
  const listContainer = document.getElementById('registration-list-modal-body');

  viewAllButton?.addEventListener('click', (event) => {
    event.preventDefault();
    const registrations = getRecentRegistrations(allPatients);

    listContainer.innerHTML = registrations.map(patient => `
      <div class="modal-reg-entry">
        <div>
          <div class="recent-reg-name">${patient.firstName} ${patient.lastName}</div>
          <div class="recent-reg-meta">${patient.patientId} | ${patient.age} ${patient.gender} | ${patient.phone}</div>
        </div>
        <button class="btn btn-outline btn-sm" data-modal-registration-view="${patient.patientId}">View details</button>
      </div>
    `).join('');

    listContainer.querySelectorAll('[data-modal-registration-view]').forEach(button => {
      button.onclick = () => {
        const patient = registrations.find(item => item.patientId === button.dataset.modalRegistrationView);
        if (patient) {
          listModal.classList.add('hidden');
          openRegistrationDetail(patient);
        }
      };
    });

    listModal.classList.remove('hidden');
  });

  document.querySelectorAll('[data-close-modal]').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById(button.dataset.closeModal).classList.add('hidden');
    });
  });
}

function openRegistrationDetail(patient) {
  const container = document.getElementById('registration-detail-body');
  const modal = document.getElementById('registration-detail-modal');

  container.innerHTML = `
    <div class="modal-success-row"><span>Patient Name</span><span>${patient.firstName} ${patient.lastName}</span></div>
    <div class="modal-success-row"><span>Patient ID</span><span>${patient.patientId}</span></div>
    <div class="modal-success-row"><span>Age &amp; Gender</span><span>${patient.age} ${patient.gender}</span></div>
    <div class="modal-success-row"><span>Email</span><span>${patient.email || '-'}</span></div>
    <div class="modal-success-row"><span>Phone Number</span><span>${patient.phone}</span></div>
    <div class="modal-success-row"><span>Blood Group</span><span>${patient.bloodGroup || '-'}</span></div>
    <div class="modal-success-row"><span>Guardian</span><span>${patient.guardian || '-'}</span></div>
  `;

  modal.classList.remove('hidden');
}

function clearForm() {
  ['first-name', 'last-name', 'email', 'phone', 'dob', 'guardian'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('gender').value = '';
  document.getElementById('blood-group').value = '';
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
  document.querySelectorAll('.input-field.error').forEach(el => el.classList.remove('error'));
}

function closeModal() {
  document.getElementById('success-modal').classList.add('hidden');
}

function calculateAge(dob) {
  if (!dob) return '';
  const [d, m, y] = dob.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
