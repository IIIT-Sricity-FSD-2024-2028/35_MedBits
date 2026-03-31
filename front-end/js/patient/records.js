/* MEDBITS – records.js
   Pure logic. HTML templates live in records.html.
*/

// ── HELPER ───────────────────────────────────────────────────────
function useTemplate(id) {
  return document.getElementById(id).content.cloneNode(true);
}

// ── PAGE INIT ─────────────────────────────────────────────────────

function renderMedicalRecords() {
  const recs     = DB.medicalRecords;
  const consults = recs.filter(r => r.type === 'Consultation').length;
  const labs     = recs.filter(r => r.type === 'Lab Report').length;

  // Update the 3 stat numbers
  setText('stat-total',    recs.length);
  setText('stat-consults', consults);
  setText('stat-labs',     labs);

  // Render each record card using the template
  const list = document.getElementById('recList');
  list.innerHTML = '';
  recs.forEach(r => list.appendChild(buildRecCard(r)));
}

// ── RECORD CARD ───────────────────────────────────────────────────

function buildRecCard(r) {
  const frag = useTemplate('tpl-rec-card');
  const card = frag.querySelector('.rec-card');

  card.id = 'rcard-' + r.id;

  // Fill in all the text fields
  card.querySelector('.rec-title').textContent        = r.title;
  card.querySelector('.rec-meta-doc').textContent     = r.doctor + ' – ' + r.dept;
  card.querySelector('.rec-meta-date').textContent    = formatDate(r.date);
  card.querySelector('.rec-prescription').textContent = r.prescription;
  card.querySelector('.rec-notes').textContent        = r.notes;

  // Set badge colour based on type
  const badge = card.querySelector('.rec-badge');
  badge.textContent = r.type;
  badge.classList.add(r.type === 'Consultation' ? 'badge-teal' : 'badge-orange');

  // Wire action buttons
  card.querySelector('.btn-followup').onclick = function() { openFollowUp(r.id); };
  card.querySelector('.btn-edit').onclick     = function() { openEditRecord(r.id); };
  card.querySelector('.btn-delete').onclick   = function() { deleteRecord(r.id); };

  return frag;
}

// ── ADD RECORD ────────────────────────────────────────────────────

function openAddRecord() {
  clearRecForm();
  // Make sure the button says "Add Record"
  openModal(document.getElementById('tpl-recForm').innerHTML);
  const btn = document.getElementById('rec-submit-btn');
  if (btn) { btn.textContent = 'Add Record'; btn.onclick = addRecord; }
}

function addRecord() {
  const title = val('rf-title').trim();
  if (!title) { showToast('Enter a title', 'error'); return; }

  DB.medicalRecords.unshift({
    id:           'REC' + Date.now(),
    title,
    type:         val('rf-type'),
    date:         val('rf-date'),
    doctor:       val('rf-doc')   || 'Unknown',
    dept:         val('rf-dept')  || 'General',
    prescription: val('rf-presc') || 'N/A',
    notes:        val('rf-notes') || ''
  });

  closeModal();
  showToast('Record added!', 'success');
  renderMedicalRecords();
}

// ── EDIT RECORD ───────────────────────────────────────────────────

function openEditRecord(id) {
  const r = DB.medicalRecords.find(x => x.id === id);
  currentEditId = id;
  fillRecForm(r);
  openModal(document.getElementById('tpl-recForm').innerHTML);
  // The modal now has a fresh clone, so re-fill from the data
  fillRecForm(r);
  const btn = document.getElementById('rec-submit-btn');
  if (btn) { btn.textContent = 'Save Changes'; btn.onclick = saveRecord; }
}

function saveRecord() {
  const r = DB.medicalRecords.find(x => x.id === currentEditId);
  r.title        = val('rf-title');
  r.type         = val('rf-type');
  r.date         = val('rf-date');
  r.doctor       = val('rf-doc');
  r.dept         = val('rf-dept');
  r.prescription = val('rf-presc');
  r.notes        = val('rf-notes');
  closeModal();
  showToast('Record updated!', 'success');
  renderMedicalRecords();
}

function deleteRecord(id) {
  if (!confirm('Delete this record?')) return;
  DB.medicalRecords = DB.medicalRecords.filter(x => x.id !== id);
  showToast('Record deleted', 'info');
  renderMedicalRecords();
}

// ── FOLLOW-UP ─────────────────────────────────────────────────────

function openFollowUp(id) {
  const r = DB.medicalRecords.find((x) => x.id === id);

  // 1. Open modal first
  openModal(document.getElementById("tpl-followUp").innerHTML);

  // 2. Then access elements inside modal
  const modal = document.getElementById("modalContent");

  modal.querySelector("#fu-label").textContent =
    "For: " + r.title + " with " + r.doctor;

  const dateInput = modal.querySelector("#fu-date");
  dateInput.value = "";
  dateInput.min = today();

  modal.querySelector("#fu-id").value = id;
}

function bookFollowUp() {
  const id   = val('fu-id');
  const date = val('fu-date');
  if (!date) { showToast('Select a date', 'error'); return; }

  const r = DB.medicalRecords.find(x => x.id === id);
  DB.appointments.push({
    id: 'APT' + Date.now(), doctor: r.doctor, speciality: r.dept,
    date, time: '10:00 AM', fee: 850, status: 'upcoming'
  });
  closeModal();
  showToast('Follow-up booked!', 'success');
}

// ── FORM HELPERS ─────────────────────────────────────────────────

function clearRecForm() {
  ['rf-title','rf-doc','rf-dept','rf-presc','rf-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const dateEl = document.getElementById('rf-date');
  if (dateEl) dateEl.value = today();
}

function fillRecForm(r) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('rf-title',  r.title);
  set('rf-type',   r.type);
  set('rf-date',   r.date);
  set('rf-doc',    r.doctor);
  set('rf-dept',   r.dept);
  set('rf-presc',  r.prescription);
  set('rf-notes',  r.notes);
}
