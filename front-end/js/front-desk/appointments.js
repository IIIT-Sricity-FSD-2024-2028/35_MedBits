/* ============================================================
   APPOINTMENTS.JS — Appointment Management multi-step flow
   ============================================================ */

let appData = null;
let allPatients = [];
let allDoctors = [];
let allSpecialties = [];
let selectedSpecialty = null;
let selectedDoctor = null;
let selectedSlot = null;
let selectedDate = null;
let currentDateOffset = 0;
let pendingCancelId = null;
let appointments = [];
let showAllConsultations = false;
let activeModifyId = null;

document.addEventListener('DOMContentLoaded', async () => {
  renderShell('appointments');

  appData = await loadData();
  if (!appData) {
    showToast('Failed to load data.', 'error');
    return;
  }

  allPatients = appData.patients;
  allDoctors = appData.doctors;
  allSpecialties = appData.specialties;
  appointments = [...appData.appointments];

  // Restore selected patient from session if any
  const savedPatient = getSelectedPatient();
  if (savedPatient) showSelectedPatient(savedPatient);

  // Render upcoming consultations
  renderUpcomingConsultations();
  setupConsultationToggle();

  // Patient search
  setupPatientSearch();

  // New Appointment button
  document.getElementById('new-appointment-btn').addEventListener('click', () => {
    goToStep('specialty');
    renderSpecialties(allSpecialties);
  });

  // Back buttons
  document.getElementById('back-to-patient-btn').addEventListener('click', () => goToStep('patient'));
  document.getElementById('back-to-specialty-btn').addEventListener('click', () => goToStep('specialty'));
  document.getElementById('back-to-doctor-btn').addEventListener('click', () => goToStep('doctor'));

  // Specialty search
  document.getElementById('specialty-search-input').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    const filtered = allSpecialties.filter(s => s.name.toLowerCase().includes(q));
    renderSpecialties(filtered);
  });

  // Doctor search
  document.getElementById('doctor-search-input').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    if (!selectedSpecialty) return;
    const docs = allDoctors.filter(d =>
      d.specialtyId === selectedSpecialty.id &&
      d.name.toLowerCase().includes(q)
    );
    renderDoctors(docs);
  });

  // Date navigation
  document.getElementById('prev-dates-btn').addEventListener('click', () => {
    if (currentDateOffset > 0) { currentDateOffset--; renderDateStrip(); }
  });
  document.getElementById('next-dates-btn').addEventListener('click', () => {
    currentDateOffset++;
    renderDateStrip();
  });

  // Confirm appointment
  document.getElementById('confirm-appointment-btn').addEventListener('click', confirmAppointment);

  // Modal close handlers
  document.getElementById('close-modify-modal').addEventListener('click', () => {
    document.getElementById('modify-modal').classList.add('hidden');
    activeModifyId = null;
  });
  document.getElementById('cancel-modify-btn').addEventListener('click', () => {
    document.getElementById('modify-modal').classList.add('hidden');
    activeModifyId = null;
  });
  document.getElementById('close-cancel-modal').addEventListener('click', () => {
    document.getElementById('cancel-modal').classList.add('hidden');
  });
  document.getElementById('abort-cancel-btn').addEventListener('click', () => {
    document.getElementById('cancel-modal').classList.add('hidden');
  });
  document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
    if (pendingCancelId) {
      appointments = appointments.filter(a => a.id !== pendingCancelId);
      renderUpcomingConsultations();
      document.getElementById('cancel-modal').classList.add('hidden');
      showToast('Appointment cancelled successfully.');
      pendingCancelId = null;
    }
  });
  document.getElementById('save-modify-btn').addEventListener('click', () => {
    saveModifiedAppointment();
  });
});

// --- Go to specific step ---
function goToStep(step) {
  document.querySelectorAll('.appt-step').forEach(el => el.classList.add('hidden'));
  document.getElementById(`step-${step}`).classList.remove('hidden');
}

// --- Patient Search ---
function setupPatientSearch() {
  const input = document.getElementById('appt-patient-search');
  const results = document.getElementById('appt-search-results');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.classList.add('hidden'); return; }

    const matches = allPatients.filter(p =>
      p.phone.includes(q) ||
      p.patientId.toLowerCase().includes(q) ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    );

    if (!matches.length) {
      results.innerHTML = `
        <div class="search-result-item search-result-item-empty">
          <div class="search-result-info">
            <span class="search-result-name">No patients found</span>
            <span class="search-result-meta">Try a phone number, patient ID, or full name.</span>
          </div>
        </div>
      `;
    } else {
      results.innerHTML = matches.map(p => `
        <div class="search-result-item" data-id="${p.id}">
          <div class="search-result-info">
            <span class="search-result-name">${p.firstName} ${p.lastName}</span>
            <span class="search-result-meta">${p.age} ${p.gender[0]} | ${p.phone}</span>
          </div>
          <span class="search-result-id">${p.patientId}</span>
        </div>
      `).join('');
      results.querySelectorAll('.search-result-item[data-id]').forEach(item => {
        item.addEventListener('click', () => {
          const patient = allPatients.find(p => p.id === item.dataset.id);
          if (patient) {
            setSelectedPatient(patient);
            showSelectedPatient(patient);
            results.classList.add('hidden');
            input.value = '';
          }
        });
      });
    }
    results.classList.remove('hidden');
  });

  document.addEventListener('click', e => {
    if (!results.contains(e.target) && e.target !== input) results.classList.add('hidden');
  });
}

function showSelectedPatient(patient) {
  const badge = document.getElementById('selected-patient-badge');
  document.getElementById('selected-patient-name').textContent =
    `${patient.firstName} ${patient.lastName} — ${patient.patientId}`;
  badge.classList.remove('hidden');

  document.getElementById('clear-patient-btn').onclick = () => {
    setSelectedPatient(null);
    badge.classList.add('hidden');
  };
}

// --- Render Upcoming Consultations ---
function renderUpcomingConsultations() {
  const container = document.getElementById('upcoming-consultations');
  const toggleBtn = document.getElementById('toggle-consultations-btn');
  if (!appointments.length) {
    container.innerHTML = '<div class="empty-state"><p>No upcoming consultations</p></div>';
    toggleBtn.classList.add('hidden');
    return;
  }

  const visibleAppointments = showAllConsultations ? appointments : appointments.slice(0, 5);
  toggleBtn.classList.toggle('hidden', appointments.length <= 5);
  toggleBtn.textContent = showAllConsultations ? 'Show Less' : 'View All';

  container.innerHTML = visibleAppointments.map(a => `
    <div class="consultation-item">
      <div class="consultation-info">
        <span class="consultation-patient">${a.patientName} - ${a.patientAge}${a.patientGender}</span>
        <span class="consultation-meta">${formatAppointmentDate(a.date)} | ${a.doctorName} | ${a.time}</span>
      </div>
      <div class="consultation-actions">
        <button class="btn btn-modify btn-sm modify-btn" data-id="${a.id}">Modify</button>
        <button class="btn btn-danger btn-sm cancel-btn" data-id="${a.id}">Cancel</button>
      </div>
    </div>
  `).join('');

  // Bind modify/cancel
  container.querySelectorAll('.modify-btn').forEach(btn => {
    btn.addEventListener('click', () => openModifyModal(btn.dataset.id));
  });
  container.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => openCancelModal(btn.dataset.id));
  });
}

function setupConsultationToggle() {
  const toggleBtn = document.getElementById('toggle-consultations-btn');
  if (!toggleBtn) return;
  toggleBtn.addEventListener('click', () => {
    showAllConsultations = !showAllConsultations;
    renderUpcomingConsultations();
  });
}

// --- Render Specialties ---
function renderSpecialties(specs) {
  const grid = document.getElementById('specialty-grid');
  if (!specs.length) {
    grid.innerHTML = '<div class="empty-state"><p>No specialties found</p></div>';
    return;
  }
  grid.innerHTML = specs.map(s => `
    <div class="specialty-card" data-id="${s.id}" data-name="${s.name}">
      <div class="specialty-icon">${getSpecialtyIcon(s.icon)}</div>
      <span class="specialty-name">${s.name}</span>
    </div>
  `).join('');

  grid.querySelectorAll('.specialty-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedSpecialty = allSpecialties.find(s => s.id === card.dataset.id);
      setSelectedSpecialty(selectedSpecialty);
      document.getElementById('selected-specialty-label').textContent = selectedSpecialty.name;
      const docs = allDoctors.filter(d => d.specialtyId === selectedSpecialty.id);
      renderDoctors(docs);
      goToStep('doctor');
    });
  });
}

// --- Render Doctors ---
function renderDoctors(docs) {
  const grid = document.getElementById('doctor-grid');
  if (!docs.length) {
    grid.innerHTML = '<div class="empty-state"><p>No doctors found</p></div>';
    return;
  }
  grid.innerHTML = docs.map(d => `
    <div class="doctor-card" data-id="${d.id}">
      <div class="doctor-info">
        <span class="doctor-name">${d.name}</span>
        <span class="doctor-specialty">${d.specialty}</span>
      </div>
      <button class="btn btn-primary btn-sm">Select Slot</button>
    </div>
  `).join('');

  grid.querySelectorAll('.doctor-card').forEach(card => {
    card.querySelector('button').addEventListener('click', () => {
      selectedDoctor = allDoctors.find(d => d.id === card.dataset.id);
      setSelectedDoctor(selectedDoctor);
      document.getElementById('slot-doctor-name').textContent = selectedDoctor.name;
      document.getElementById('slot-doctor-spec').textContent = selectedDoctor.specialty;
      currentDateOffset = 0;
      renderDateStrip();
      renderSlots();
      goToStep('slot');
    });
  });
}

// --- Render Date Strip ---
function renderDateStrip() {
  const strip = document.getElementById('date-strip');
  const today = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const visibleDays = 7;
  const startOffset = currentDateOffset;

  let html = '';
  for (let i = 0; i < visibleDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + startOffset + i);
    const dayName = days[d.getDay()];
    const dayNum = d.getDate();
    const month = months[d.getMonth()];
    const dateStr = d.toISOString().split('T')[0];
    const isSelected = dateStr === selectedDate;
    html += `
      <div class="date-chip ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
        <span class="date-day-name">${dayName}</span>
        <span class="date-day-num">${dayNum}</span>
        <span class="date-month">${month}</span>
      </div>
    `;
  }
  strip.innerHTML = html;

  strip.querySelectorAll('.date-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedDate = chip.dataset.date;
      renderDateStrip();
      renderSlots();
    });
  });

  // Auto-select first if none selected
  if (!selectedDate) {
    const firstChip = strip.querySelector('.date-chip');
    if (firstChip) {
      selectedDate = firstChip.dataset.date;
      firstChip.classList.add('selected');
      renderSlots();
    }
  }
}

// --- Render Time Slots ---
function renderSlots() {
  const morning = ['10:00 AM','10:20 AM','10:40 AM','11:00 AM','11:20 AM','11:40 AM'];
  const afternoon = ['02:00 PM','02:20 PM','02:40 PM','03:00 PM','03:20 PM','03:40 PM'];
  const evening = ['04:00 PM','04:20 PM','04:40 PM','05:00 PM','05:20 PM','05:40 PM'];

  function renderSlotGroup(slots, containerId) {
    const el = document.getElementById(containerId);
    el.innerHTML = slots.map(t => {
      const isBooked = Math.random() < 0.15;
      const isSel = t === selectedSlot;
      return `<button class="slot-btn ${isSel ? 'selected' : ''} ${isBooked ? 'booked' : ''}" 
              data-time="${t}" ${isBooked ? 'disabled' : ''}>${t}</button>`;
    }).join('');
    el.querySelectorAll('.slot-btn:not(.booked)').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedSlot = btn.dataset.time;
        document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  renderSlotGroup(morning, 'slots-morning');
  renderSlotGroup(afternoon, 'slots-afternoon');
  renderSlotGroup(evening, 'slots-evening');
}

// --- Confirm Appointment ---
function confirmAppointment() {
  if (!selectedSlot) {
    showToast('Please select a time slot.', 'error');
    return;
  }
  const patient = getSelectedPatient();
  if (!patient) {
    showToast('Please select a patient first.', 'error');
    goToStep('patient');
    return;
  }

  const newAppt = {
    id: 'A_NEW_' + Date.now(),
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientAge: patient.age,
    patientGender: patient.gender[0],
    doctorId: selectedDoctor.id,
    doctorName: selectedDoctor.name,
    specialty: selectedDoctor.specialty,
    date: selectedDate,
    time: selectedSlot,
    status: 'Confirmed'
  };

  appointments.unshift(newAppt);
  selectedSlot = null;
  selectedDate = null;

  goToStep('patient');
  renderUpcomingConsultations();
  showToast(`Appointment booked: ${selectedDoctor.name} at ${newAppt.time}`);
}

// --- Modify Modal ---
function openModifyModal(id) {
  const appt = appointments.find(a => a.id === id);
  if (!appt) return;
  activeModifyId = id;
  document.getElementById('modify-modal-body').innerHTML = `
    <div class="modify-modal-content">
      <div class="modify-hero">
        <div class="modify-hero-copy">
          <span class="badge badge-purple">Confirmed</span>
          <h3>${appt.patientName}</h3>
          <p>${appt.patientAge} years, ${expandGender(appt.patientGender)}, ${appt.specialty}</p>
        </div>
        <div class="modify-hero-meta">
          <span>Doctor</span>
          <strong>${appt.doctorName}</strong>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Patient</label>
          <input class="input-field" value="${appt.patientName}" readonly/>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Doctor</label>
          <input class="input-field" value="${appt.doctorName}" readonly/>
        </div>
        <div class="form-group">
          <label class="form-label" for="modify-date">Date</label>
          <input class="input-field" id="modify-date" type="date" value="${appt.date}" />
        </div>
        <div class="form-group">
          <label class="form-label" for="modify-time">Time</label>
          <input class="input-field" id="modify-time" type="time" value="${convertTo24Hour(appt.time)}" />
        </div>
      </div>

      <div class="modify-preview">
        <span class="modify-preview-label">Updated visit summary</span>
        <div id="modify-preview-text">${formatAppointmentDate(appt.date)} at ${appt.time}</div>
      </div>
    </div>
  `;
  const dateInput = document.getElementById('modify-date');
  const timeInput = document.getElementById('modify-time');
  [dateInput, timeInput].forEach(input => {
    input.addEventListener('input', updateModifyPreview);
  });
  updateModifyPreview();
  document.getElementById('modify-modal').classList.remove('hidden');
}

function updateModifyPreview() {
  const preview = document.getElementById('modify-preview-text');
  const dateInput = document.getElementById('modify-date');
  const timeInput = document.getElementById('modify-time');
  if (!preview || !dateInput || !timeInput) return;

  const formattedDate = dateInput.value ? formatAppointmentDate(dateInput.value) : 'Select a date';
  const formattedTime = timeInput.value ? convertTo12Hour(timeInput.value) : 'Select a time';
  preview.textContent = `${formattedDate} at ${formattedTime}`;
}

function saveModifiedAppointment() {
  if (!activeModifyId) return;
  const dateInput = document.getElementById('modify-date');
  const timeInput = document.getElementById('modify-time');
  const newDate = dateInput?.value;
  const newTime = timeInput?.value;

  if (!newDate || !newTime) {
    showToast('Please select both date and time.', 'error');
    return;
  }

  const appt = appointments.find(item => item.id === activeModifyId);
  if (!appt) return;

  appt.date = newDate;
  appt.time = convertTo12Hour(newTime);

  renderUpcomingConsultations();
  document.getElementById('modify-modal').classList.add('hidden');
  activeModifyId = null;
  showToast('Appointment updated successfully.');
}

// --- Cancel Modal ---
function openCancelModal(id) {
  const appt = appointments.find(a => a.id === id);
  if (!appt) return;
  pendingCancelId = id;
  document.getElementById('cancel-modal-body').innerHTML = `
    <strong>${appt.patientName}</strong><br/>
    ${appt.doctorName} — ${appt.time}
  `;
  document.getElementById('cancel-modal').classList.remove('hidden');
}

function formatAppointmentDate(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function convertTo24Hour(time12) {
  const match = time12?.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return '';
  let [, hours, minutes, period] = match;
  let hourNum = Number(hours);
  if (period.toUpperCase() === 'PM' && hourNum !== 12) hourNum += 12;
  if (period.toUpperCase() === 'AM' && hourNum === 12) hourNum = 0;
  return `${String(hourNum).padStart(2, '0')}:${minutes}`;
}

function convertTo12Hour(time24) {
  const match = time24?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return time24 || '';
  let [, hours, minutes] = match;
  let hourNum = Number(hours);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  hourNum = hourNum % 12 || 12;
  return `${String(hourNum).padStart(2, '0')}:${minutes} ${period}`;
}

function expandGender(genderShort) {
  if (genderShort === 'M') return 'Male';
  if (genderShort === 'F') return 'Female';
  return genderShort || '';
}
