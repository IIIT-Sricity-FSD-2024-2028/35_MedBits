/* MEDBITS – appointments.js
   Pure logic. All HTML lives in appointments.html <template> tags.
   JS clones templates, fills in data, and inserts into the page.
*/

let selectedDoctor = null;
let selectedSlot   = null;

const MORNING_SLOTS = ['10:01 AM', '10:11 AM', '10:21 AM', '10:31 AM'];
const EVENING_SLOTS = ['4:01 PM',  '4:11 PM',  '4:21 PM',  '4:31 PM'];

// ── HELPER: clone a <template> by id ─────────────────────────────
function useTemplate(id) {
  return document.getElementById(id).content.cloneNode(true);
}

// ── PAGE INIT ─────────────────────────────────────────────────────

function renderAppointments() {
  selectedDoctor = null;
  selectedSlot   = null;

  // Fill speciality dropdown from DB
  const specs = [...new Set(DB.doctors.map(d => d.speciality))];
  const sel   = document.getElementById('specSelect');
  sel.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = ''; blank.textContent = 'Choose a specialty…';
  sel.appendChild(blank);
  specs.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });

  // Hide the doctor section until a specialty is picked
  document.getElementById('doctorSection').style.display = 'none';

  refreshApptLists();
}

// ── APPOINTMENT LISTS ─────────────────────────────────────────────

function refreshApptLists() {
  const upcoming = DB.appointments.filter(a => a.status === 'upcoming');
  const past     = DB.appointments.filter(a => a.status === 'completed');
  fillApptList('upcomingList', upcoming, false);
  fillApptList('pastList',     past,     true);
}

function fillApptList(containerId, appts, isPast) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';   // clear first

  if (!appts.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.textContent = isPast ? '✅' : '📅';
    const msg = document.createElement('p');
    msg.textContent = isPast ? 'No past appointments' : 'No upcoming appointments';
    empty.appendChild(icon);
    empty.appendChild(msg);
    el.appendChild(empty);
    return;
  }

  appts.forEach(a => {
    // Clone the right template
    const frag = useTemplate(isPast ? 'tpl-appt-past' : 'tpl-appt-upcoming');
    const card = frag.querySelector('.list-item');

    // Fill text
    card.querySelector('.appt-doctor').textContent = a.doctor;
    card.querySelector('.appt-info').textContent   = a.speciality + ' · ' + formatDate(a.date) + ' at ' + a.time;

    // Wire buttons (upcoming only)
    if (!isPast) {
      card.dataset.id = a.id;
      card.querySelector('.appt-modify').onclick = function() { openModifyAppointment(a.id); };
      card.querySelector('.appt-cancel').onclick = function() { cancelAppointment(a.id); };
    }

    el.appendChild(frag);
  });
}

// ── FIND DOCTOR ───────────────────────────────────────────────────

function filterDoctors() {
  const spec    = document.getElementById('specSelect').value;
  const section = document.getElementById('doctorSection');

  if (!spec) { section.style.display = 'none'; return; }

  // Show the search bar
  document.getElementById('docSearchWrap').style.display = 'block';
  document.getElementById('docSearchLabel').textContent  = 'Search ' + spec + 's';

  // Load matching doctors
  fillDoctorList(DB.doctors.filter(d => d.speciality === spec));

  // Reset schedule panel to default text
  const panel = document.getElementById('schedulePanel');
  panel.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = 'Schedule Appointment';
  const p = document.createElement('p'); p.className = 'text-muted'; p.textContent = 'Click a doctor to see available slots.';
  panel.appendChild(h); panel.appendChild(p);

  section.style.display = 'block';
}

function searchDoctors(q) {
  const spec = document.getElementById('specSelect').value;
  if (!spec) return;
  const matches = DB.doctors.filter(d =>
    d.speciality === spec && d.name.toLowerCase().includes(q.toLowerCase())
  );
  fillDoctorList(matches);
}

function fillDoctorList(docs) {
  const list = document.getElementById('docList');
  list.innerHTML = '';

  if (!docs.length) {
    list.innerHTML = '';
    const msg = document.createElement('p');
    msg.className = 'text-muted'; msg.style.padding = '16px';
    msg.textContent = 'No doctors found.';
    list.appendChild(msg);
    return;
  }

  docs.forEach(d => {
    // Clone the doctor card template
    const frag = useTemplate('tpl-doc-card');
    const card = frag.querySelector('.doc-card');

    // Set the card id so selectDoctor can highlight it
    card.id = 'dcard-' + d.id;

    // Fill data
    card.querySelector('.doc-icon').textContent     = d.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️';
    card.querySelector('.doc-name').textContent     = d.name;
    card.querySelector('.doc-exp-qual').textContent = d.exp + ' · ' + d.qual;
    card.querySelector('.doc-hospital').textContent = d.hospital;
    card.querySelector('.doc-fee').textContent      = '₹ ' + d.fee;

    // Wire click: whole card and the Book button both call selectDoctor
    card.onclick = function() { selectDoctor(d.id); };
    const bookBtn = card.querySelector('.btn');
    bookBtn.onclick = function(e) { e.stopPropagation(); selectDoctor(d.id); };

    list.appendChild(frag);
  });
}

// Called by Browse-by-Specialty chips
function selectSpeciality(spec) {
  document.getElementById('specSelect').value = spec;

  // Highlight the clicked chip
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active-cat'));
  const chip = document.querySelector('.cat-card[data-spec="' + spec + '"]');
  if (chip) chip.classList.add('active-cat');

  filterDoctors();
  document.getElementById('doctorSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Called when a doctor card is clicked
function selectDoctor(id) {
  selectedDoctor = DB.doctors.find(d => d.id === id);
  if (!selectedDoctor) return;

  selectedSlot = null;

  // Highlight selected card
  document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('dcard-' + id);
  if (card) card.classList.add('selected');

  // Clone and fill the schedule panel template
  const frag  = useTemplate('tpl-schedule-panel');
  const panel = document.getElementById('schedulePanel');
  panel.innerHTML = '';

  const d    = selectedDoctor;
  const icon = d.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️';

  frag.querySelector('.sched-icon').textContent  = icon;
  frag.querySelector('.sched-name').textContent  = d.name;
  frag.querySelector('.sched-spec').textContent  = d.speciality + ' · ' + d.exp;
  frag.querySelector('.sched-fee').textContent   = '₹ ' + d.fee;
  frag.querySelector('#schedDate').min           = today();

  // Build slot buttons from template
  fillSlots(frag.querySelector('#morningSlots'), MORNING_SLOTS, '');
  fillSlots(frag.querySelector('#eveningSlots'), EVENING_SLOTS, '');

  panel.appendChild(frag);
}

// Fill a slot-grid element with slot buttons
function fillSlots(container, slots, activeTime) {
  slots.forEach(t => {
    const frag = useTemplate('tpl-slot-btn');
    const btn  = frag.querySelector('.slot-btn');
    btn.textContent = t;
    if (t === activeTime) btn.classList.add('selected');
    btn.onclick = function() { selectSlot(btn, t); };
    container.appendChild(frag);
  });
}

function selectSlot(btn, time) {
  // Clear all slot selections inside the schedule panel
  document.querySelectorAll('#schedulePanel .slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedSlot = time;
}

function confirmAppointment() {
  const dateEl = document.getElementById('schedDate');
  const date   = dateEl ? dateEl.value : '';

  if (!selectedDoctor) { showToast('Please select a doctor', 'error');  return; }
  if (!date)           { showToast('Please select a date', 'error');    return; }
  if (!selectedSlot)   { showToast('Please pick a time slot', 'error'); return; }

  DB.appointments.push({
    id: 'APT' + Date.now(),
    doctor: selectedDoctor.name, speciality: selectedDoctor.speciality,
    date, time: selectedSlot, fee: selectedDoctor.fee, status: 'upcoming'
  });

  // Reset everything
  selectedDoctor = null;
  selectedSlot   = null;
  document.getElementById('doctorSection').style.display = 'none';
  document.getElementById('specSelect').value = '';
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active-cat'));

  showToast('Appointment booked!', 'success');
  refreshApptLists();
}

// ── ADD / MODIFY / CANCEL ─────────────────────────────────────────

function openAddAppointment() {
  // Clone template into modal
  const frag = useTemplate('tpl-addAppt');

  // Fill the speciality dropdown inside the template
  const specs = [...new Set(DB.doctors.map(d => d.speciality))];
  const sel   = frag.querySelector('#na-spec');
  specs.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });

  // Set the min date
  frag.querySelector('#na-date').min = today();

  // Put it in the modal
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = '';
  modalContent.appendChild(frag);
  document.getElementById('modalOverlay').classList.add('open');
}

function addAppointment() {
  const doctor = val('na-doc').trim();
  const date   = val('na-date');
  const time   = val('na-time').trim();

  if (!doctor) { showToast('Enter doctor name', 'error'); return; }
  if (!date)   { showToast('Select a date', 'error');     return; }
  if (!time)   { showToast('Enter a time', 'error');      return; }

  DB.appointments.push({
    id: 'APT' + Date.now(), doctor,
    speciality: val('na-spec'), date, time,
    fee: +val('na-fee'), status: 'upcoming'
  });

  closeModal();
  showToast('Appointment added!', 'success');
  refreshApptLists();
}

function openModifyAppointment(id) {
  const a = DB.appointments.find(x => x.id === id);
  if (!a) return;
  currentEditId = id;
  selectedSlot  = a.time;

  // Clone template
  const frag = useTemplate('tpl-modifyAppt');

  // Fill static info
  frag.querySelector('#mod-doctor').textContent = a.doctor;
  frag.querySelector('#mod-spec').textContent   = a.speciality;
  frag.querySelector('#mod-date').value         = a.date;
  frag.querySelector('#mod-date').min           = today();
  frag.querySelector('#mod-fee').textContent    = '₹ ' + a.fee;

  // Fill slot buttons with the current time pre-selected
  fillSlots(frag.querySelector('#mod-morning'), MORNING_SLOTS, a.time);
  fillSlots(frag.querySelector('#mod-evening'), EVENING_SLOTS, a.time);

  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = '';
  modalContent.appendChild(frag);
  document.getElementById('modalOverlay').classList.add('open');
}

function saveModifyAppointment() {
  const date = val('mod-date');
  if (!date)         { showToast('Select a date', 'error');    return; }
  if (!selectedSlot) { showToast('Pick a time slot', 'error'); return; }

  const a = DB.appointments.find(x => x.id === currentEditId);
  if (a) { a.date = date; a.time = selectedSlot; }

  closeModal();
  showToast('Appointment rescheduled!', 'success');
  refreshApptLists();
}

function cancelAppointment(id) {
  if (!confirm('Cancel this appointment?')) return;
  DB.appointments = DB.appointments.filter(a => a.id !== id);
  showToast('Appointment cancelled', 'info');
  refreshApptLists();
}
