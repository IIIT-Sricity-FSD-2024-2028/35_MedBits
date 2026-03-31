/* ============================================================
   QUEUE.JS — Queue Management page logic
   ============================================================ */

let queueItems = [];
let allPatients = [];
let allSpecialties = [];
let tokenCounters = {};

document.addEventListener('DOMContentLoaded', async () => {
  renderShell('queue');

  const data = await loadData();
  if (!data) {
    showToast('Failed to load data.', 'error');
    return;
  }

  ensureQueueStore();
  queueItems = [...getQueueItems()];
  allPatients = data.patients;
  allSpecialties = data.specialties;
  initializeTokenCounters();

  // Populate patient dropdown
  const patientSelect = document.getElementById('patient-select');
  allPatients.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `PAT-00${allPatients.indexOf(p) + 1} ${p.firstName} ${p.lastName}`;
    patientSelect.appendChild(opt);
  });

  // Populate specialty dropdown
  const specSelect = document.getElementById('specialty-select');
  allSpecialties.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    specSelect.appendChild(opt);
  });

  specSelect.addEventListener('change', renderQueue);

  // Render queue
  renderQueue();

  // Generate token button
  document.getElementById('generate-token-btn').addEventListener('click', generateToken);

  // Close token modal
  document.getElementById('close-token-modal').addEventListener('click', () => {
    document.getElementById('token-modal').classList.add('hidden');
  });
});

// --- Render Queue List ---
function renderQueue() {
  const container = document.getElementById('waiting-list-container');
  const countBadge = document.getElementById('queue-count');
  const selectedSpecialtyId = document.getElementById('specialty-select').value;
  const selectedSpecialty = allSpecialties.find(s => s.id === selectedSpecialtyId);
  const visibleQueueItems = selectedSpecialty
    ? queueItems.filter(item => item.specialty === selectedSpecialty.name)
    : queueItems;

  countBadge.textContent = `${visibleQueueItems.length} patient${visibleQueueItems.length !== 1 ? 's' : ''}`;

  if (!visibleQueueItems.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <circle cx="23" cy="15" r="4"/>
        </svg>
        <p>${selectedSpecialty ? `No patients in ${selectedSpecialty.name} queue` : 'No patients in queue'}</p>
      </div>`;
    return;
  }

  // Status order: In Consultation first, then Confirmed, Waiting, Pending
  const order = { 'In Consultation': 0, 'Confirmed': 1, 'Waiting': 2, 'Pending': 3 };
  const sorted = [...visibleQueueItems].sort((a, b) => (order[a.status] ?? 4) - (order[b.status] ?? 4));

  container.innerHTML = sorted.map(item => {
    const statusClass = item.status.toLowerCase().replace(' ', '-');
    const badgeClass = getBadgeClass(item.status);

    return `
      <div class="queue-entry queue-entry--${statusClass}">
        <div class="queue-entry-info">
          <span class="queue-entry-name">${item.patientName}</span>
          <div class="queue-entry-meta">
            <span>${item.age}</span>
            <span>${item.gender}</span>
            <span>${item.specialty}</span>
            ${item.doctorName ? `<span>${item.doctorName}</span>` : ''}
          </div>
        </div>
        <div class="queue-entry-right">
          ${item.time ? `<span class="queue-entry-time">${item.time}</span>` : ''}
          <span class="badge ${badgeClass}">${item.status}</span>
          <span class="queue-entry-token">${item.code}</span>
        </div>
      </div>
    `;
  }).join('');
}

function getBadgeClass(status) {
  switch (status) {
    case 'In Consultation': return 'badge-info';
    case 'Confirmed': return 'badge-success';
    case 'Waiting': return 'badge-purple';
    case 'Pending': return 'badge-warning';
    default: return 'badge-purple';
  }
}

function initializeTokenCounters() {
  tokenCounters = {};

  queueItems.forEach(item => {
    const match = item.code.match(/^([A-Z]{2})-(\d+)$/);
    if (!match) return;

    const [, prefix, num] = match;
    const nextValue = Number(num) + 1;
    tokenCounters[prefix] = Math.max(tokenCounters[prefix] || 1, nextValue);
  });
}

// --- Generate Token ---
function generateToken() {
  const patientId = document.getElementById('patient-select').value;
  const specialtyId = document.getElementById('specialty-select').value;

  if (!patientId) {
    showToast('Please select a patient.', 'error');
    return;
  }
  if (!specialtyId) {
    showToast('Please select a speciality.', 'error');
    return;
  }

  const patient = allPatients.find(p => p.id === patientId);
  const specialty = allSpecialties.find(s => s.id === specialtyId);

  // Generate token code
  const prefix = specialty.name.substring(0, 2).toUpperCase();
  if (!tokenCounters[prefix]) tokenCounters[prefix] = 1;
  const num = String(tokenCounters[prefix]++).padStart(3, '0');
  const tokenCode = `${prefix}-${num}`;

  // Add to queue
  const newEntry = {
    token: `T-NEW-${Date.now()}`,
    code: tokenCode,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    age: patient.age,
    gender: patient.gender,
    specialty: specialty.name,
    doctorName: '',
    time: '',
    status: 'Waiting'
  };

  queueItems.unshift(newEntry);
  saveQueue(queueItems);
  renderQueue();
  renderNotifications();

  // Show token modal
  document.getElementById('token-display').textContent = tokenCode;
  document.getElementById('token-modal-details').innerHTML = `
    <strong>${patient.firstName} ${patient.lastName}</strong><br/>
    ${specialty.name}
  `;
  document.getElementById('token-modal').classList.remove('hidden');

  // Reset selects
  document.getElementById('patient-select').value = '';
  document.getElementById('specialty-select').value = '';
}
