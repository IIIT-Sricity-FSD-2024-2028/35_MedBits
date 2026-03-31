(async () => {
  await loadComponents('consultation-notes', 'Consultation Notes');

  const listView = document.getElementById('listView');
  const noteDetailView = document.getElementById('noteDetailView');
  const searchInput = document.getElementById('searchInput');
  const patientSearchResults = document.getElementById('patientSearchResults');
  const selectedPatientChip = document.getElementById('selectedPatientChip');

  const PATIENTS = [
    { id: 'PAT-001', name: 'Alisha Verma', age: '32', gender: 'Female', initials: 'AV' },
    { id: 'PAT-002', name: 'Neil Verma', age: '45', gender: 'Male', initials: 'NV' },
    { id: 'PAT-003', name: 'Dev Patel', age: '36', gender: 'Male', initials: 'DP' },
    { id: 'PAT-004', name: 'Ria Sharma', age: '19', gender: 'Female', initials: 'RS' }
  ];

  let selectedPatient = null;
  let currentPatient = null;

  function getSavedNotes() {
    return JSON.parse(localStorage.getItem('consultationNotes') || '[]');
  }

  function saveNote(note) {
    const notes = getSavedNotes();
    const idx = notes.findIndex(n => n.id === note.id);
    if (idx > -1) notes[idx] = note; else notes.unshift(note);
    localStorage.setItem('consultationNotes', JSON.stringify(notes));
  }

  function toInputDate(ddmmyyyy) {
    const [d, m, y] = (ddmmyyyy || '').split('/');
    return y && m && d ? `${y}-${m}-${d}` : '';
  }

  function fromInputDate(yyyymmdd) {
    if (!yyyymmdd) return '';
    const [y, m, d] = yyyymmdd.split('-');
    return `${d}/${m}/${y}`;
  }

  function addPrescriptionItem(container, text) {
    const div = document.createElement('div');
    div.className = 'prescription-item';
    div.innerHTML = `<span>${text}</span><button class="remove-btn" title="Remove">&times;</button>`;
    div.querySelector('.remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
  }

  function renderSavedNotes() {
    const saved = getSavedNotes();
    const container = document.getElementById('savedNotesList');
    const savedCard = document.getElementById('savedNotesCard');
    container.innerHTML = '';
    savedCard.style.display = saved.length > 0 ? '' : 'none';

    saved.forEach(note => {
      const row = document.createElement('div');
      row.className = 'patient-row';
      row.dataset.patient = note.name;
      row.dataset.patientId = note.id;
      const initials = note.initials || note.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      row.innerHTML = `
        <div class="patient-left">
          <div class="avatar" style="background:var(--accent);">${initials}</div>
          <div>
            <div class="patient-name">${note.name} <span class="meta-inline">${note.age || ''} | ${note.gender || ''}</span></div>
            <div class="patient-meta">${note.notes ? note.notes.slice(0, 80) + (note.notes.length > 80 ? '...' : '') : ''}</div>
          </div>
        </div>
        <div class="patient-right">
          <span class="date-label">${note.displayDate || ''}</span>
          <button class="btn-view saved-view-btn" data-id="${note.id}">View</button>
        </div>`;
      row.querySelector('.saved-view-btn').addEventListener('click', () => showDetail({ ...note, date: note.rawDate }));
      container.appendChild(row);
    });
  }

  function setSelectedPatient(patient) {
    selectedPatient = patient;
    searchInput.value = patient ? `${patient.id} - ${patient.name}` : '';
    selectedPatientChip.textContent = patient ? `${patient.id} - ${patient.name}` : 'No patient selected';
    document.querySelectorAll('#recordsList .patient-row').forEach(row => {
      row.classList.toggle('is-selected', patient && row.dataset.patientId === patient.id);
    });
    patientSearchResults.classList.remove('open');
  }

  function renderPatientSearch(query = '') {
    const normalized = query.trim().toLowerCase();
    const matches = PATIENTS.filter(patient => (`${patient.id} ${patient.name}`).toLowerCase().includes(normalized));
    patientSearchResults.innerHTML = '';

    if (!normalized) {
      patientSearchResults.classList.remove('open');
      return;
    }

    if (!matches.length) {
      patientSearchResults.innerHTML = '<button type="button" class="patient-search-option empty" disabled>No matching patient found</button>';
      patientSearchResults.classList.add('open');
      return;
    }

    matches.forEach(patient => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'patient-search-option';
      btn.innerHTML = `<strong>${patient.id}</strong><span>${patient.name}</span>`;
      btn.addEventListener('click', () => setSelectedPatient(patient));
      patientSearchResults.appendChild(btn);
    });
    patientSearchResults.classList.add('open');
  }

  function showDetail(data) {
    currentPatient = data;
    document.getElementById('detailAvatar').textContent = data.initials || (data.name ? data.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?');
    document.getElementById('detailName').textContent = data.name || 'New Patient';
    document.getElementById('detailMeta').textContent = (data.age && data.gender) ? `${data.age} | ${data.gender}` : '';
    document.getElementById('noteDate').value = data.date ? toInputDate(data.date) : '';
    document.getElementById('noteText').value = data.notes || '';
    document.getElementById('followUpDate').value = '';

    const medList = document.getElementById('medicineList');
    medList.innerHTML = '';
    (data.meds || '').split('|').filter(Boolean).forEach(m => addPrescriptionItem(medList, m));

    const labList = document.getElementById('labList');
    labList.innerHTML = '';
    (data.labs || '').split('|').filter(Boolean).forEach(l => addPrescriptionItem(labList, l));

    listView.style.display = 'none';
    noteDetailView.style.display = 'block';
  }

  function showList() {
    noteDetailView.style.display = 'none';
    listView.style.display = 'block';
    renderSavedNotes();
  }

  document.querySelectorAll('#recordsList .view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const patient = PATIENTS.find(item => item.id === btn.dataset.id);
      if (patient) setSelectedPatient(patient);
      showDetail(btn.dataset);
    });
  });

  document.getElementById('createNoteBtn').addEventListener('click', () => {
    if (!selectedPatient) {
      showToast('Search and select a patient first.', 'error');
      searchInput.focus();
      searchInput.classList.add('input-error');
      setTimeout(() => searchInput.classList.remove('input-error'), 1500);
      return;
    }

    showDetail({
      id: selectedPatient.id,
      name: selectedPatient.name,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      initials: selectedPatient.initials
    });
  });

  document.getElementById('backBtn').addEventListener('click', showList);
  document.getElementById('cancelNoteBtn').addEventListener('click', showList);

  document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const dateVal = document.getElementById('noteDate').value;
    const notesText = document.getElementById('noteText').value;
    const meds = [...document.querySelectorAll('#medicineList .prescription-item span')].map(s => s.textContent).join('|');
    const labs = [...document.querySelectorAll('#labList .prescription-item span')].map(s => s.textContent).join('|');

    const note = {
      id: currentPatient?.id || Date.now().toString(),
      name: currentPatient?.name || document.getElementById('detailName').textContent,
      age: currentPatient?.age || '',
      gender: currentPatient?.gender || '',
      initials: currentPatient?.initials || '',
      notes: notesText,
      meds,
      labs,
      rawDate: fromInputDate(dateVal),
      displayDate: dateVal ? new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
    };
    saveNote(note);
    showToast('Consultation note saved!', 'success');
    showList();
  });

  document.getElementById('addMedBtn').addEventListener('click', () => {
    const n = prompt('Medicine name and dosage:');
    if (n) addPrescriptionItem(document.getElementById('medicineList'), n);
  });

  document.getElementById('addLabBtn').addEventListener('click', () => {
    const n = prompt('Lab test name:');
    if (n) addPrescriptionItem(document.getElementById('labList'), n);
  });

  searchInput.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    renderPatientSearch(this.value);
    if (selectedPatient && `${selectedPatient.id} - ${selectedPatient.name}`.toLowerCase() !== q.trim()) {
      selectedPatient = null;
      selectedPatientChip.textContent = 'No patient selected';
      document.querySelectorAll('#recordsList .patient-row').forEach(row => row.classList.remove('is-selected'));
    }
    document.querySelectorAll('#recordsList .patient-row, #savedNotesList .patient-row').forEach(r => {
      r.style.display = (r.dataset.patient || '').toLowerCase().includes(q) ? '' : 'none';
    });
  });

  searchInput.addEventListener('focus', () => renderPatientSearch(searchInput.value));
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.patient-search-shell')) {
      patientSearchResults.classList.remove('open');
    }
  });

  renderSavedNotes();
})();
