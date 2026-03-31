/* MEDBITS – feedback.js
   Pure logic. HTML templates live in feedback.html.
*/

const RATING_COLOURS = {
  Bad: 'badge-red', Average: 'badge-orange',
  Good: 'badge-green', Better: 'badge-green', Excellent: 'badge-green'
};

// ── PAGE INIT ─────────────────────────────────────────────────────

function renderFeedback() {
  // Fill the doctor dropdown from completed appointments
  const completed = DB.appointments.filter(a => a.status === 'completed');
  const select = document.getElementById('fbDoctor');
  if (select) {
    select.innerHTML = '';
    completed.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.doctor;
      opt.textContent = a.doctor + ' – ' + a.speciality;
      select.appendChild(opt);
    });
    const other = document.createElement('option');
    other.value = 'Other'; other.textContent = 'Other…';
    select.appendChild(other);
  }

  renderFbList();
}

// ── FEEDBACK LIST ─────────────────────────────────────────────────

function renderFbList() {
  const list = document.getElementById('fbList');
  if (!list) return;
  list.innerHTML = '';

  if (!DB.feedback.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state';
    empty.innerHTML = ''; 
    const icon = document.createElement('div'); icon.className = 'empty-icon'; icon.textContent = '💬';
    const msg  = document.createElement('p');  msg.textContent = 'No feedback yet';
    empty.appendChild(icon); empty.appendChild(msg); list.appendChild(empty);
    return;
  }

  DB.feedback.forEach(f => {
    const frag = document.getElementById('tpl-fb-card').content.cloneNode(true);
    const card = frag.querySelector('.fb-card');

    card.id = 'fbcard-' + f.id;

    card.querySelector('.fb-doctor').textContent  = f.doctor;
    card.querySelector('.fb-date').textContent    = f.date;
    card.querySelector('.fb-comment').textContent = f.comment;

    const badge = card.querySelector('.fb-badge');
    badge.textContent = f.rating;
    badge.classList.add(RATING_COLOURS[f.rating] || 'badge-blue');

    card.querySelector('.fb-edit').onclick   = function() { editFeedback(f.id); };
    card.querySelector('.fb-delete').onclick = function() { deleteFeedback(f.id); };

    list.appendChild(frag);
  });
}

// ── SUBMIT ────────────────────────────────────────────────────────

function selectRating(btn, rating) {
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  window._rating = rating;
}

function submitFeedback() {
  const doctor  = val('fbDoctor');
  const comment = val('fbComment').trim();
  const rating  = window._rating;

  if (!rating)  { showToast('Please select a rating', 'error'); return; }
  if (!comment) { showToast('Please write your feedback', 'error'); return; }

  DB.feedback.unshift({
    id:      'FB' + Date.now(), doctor,
    date:    new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }),
    rating,  comment
  });

  window._rating = '';
  document.getElementById('fbComment').value = '';
  document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
  showToast('Feedback submitted!', 'success');
  renderFbList();
}

// ── EDIT / DELETE ─────────────────────────────────────────────────

function editFeedback(id) {
  const f = DB.feedback.find((x) => x.id === id);
  currentEditId = id;

  // 1. Open modal FIRST
  openModal(document.getElementById("tpl-editFeedback").innerHTML);

  // 2. THEN set values
  setTimeout(() => {
    document.getElementById("ef-rating").value = f.rating;
    document.getElementById("ef-comment").value = f.comment;
  }, 0);
}

function saveFeedback() {
  const f = DB.feedback.find(x => x.id === currentEditId);
  f.rating  = val('ef-rating');
  f.comment = val('ef-comment');
  closeModal();
  showToast('Feedback updated', 'success');
  renderFbList();
}

function deleteFeedback(id) {
  if (!confirm('Delete this feedback?')) return;
  DB.feedback = DB.feedback.filter(x => x.id !== id);
  showToast('Feedback deleted', 'info');
  renderFbList();
}
