/* ── lab-test.js ── */
(async () => {
  await loadComponents('lab-test', 'Lab Test Package Creation');

  const allTests = [
    { name: 'Complete Blood Count',  category: 'Hematology'  },
    { name: 'Lipid Profile',         category: 'Biochemistry' },
    { name: 'Liver Function Test',   category: 'Biochemistry' },
    { name: 'Thyroid Function Test', category: 'Endocrine'    },
    { name: 'HbA1c',                 category: 'Diabetes'     },
    { name: 'Vitamin D',             category: 'Vitamins'     },
    { name: 'Blood Glucose',         category: 'Diabetes'     },
    { name: 'Urine Analysis',        category: 'General'      },
  ];
  const selected = new Set();

  /* ── Storage ── */
  function getAssigned() {
    return JSON.parse(localStorage.getItem('labAssignments') || '[]');
  }
  function saveAssignment(entry) {
    const list = getAssigned();
    list.unshift(entry);
    localStorage.setItem('labAssignments', JSON.stringify(list));
  }

  function renderAssigned() {
    const list = getAssigned();
    const section = document.getElementById('assignedSection');
    const container = document.getElementById('assignedList');
    container.innerHTML = '';
    section.style.display = list.length > 0 ? '' : 'none';
    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'patient-row';
      row.innerHTML = `
        <div class="patient-left">
          <div class="avatar" style="background:var(--accent);">${item.initials}</div>
          <div>
            <div class="patient-name">${item.patient}</div>
            <div class="patient-meta">${item.packageName ? item.packageName + ' · ' : ''}${item.tests}</div>
          </div>
        </div>
        <div class="patient-right">
          <span class="badge badge-confirmed">Assigned</span>
          <span class="date-label">${item.date}</span>
        </div>`;
      container.appendChild(row);
    });
  }

  /* ── Render test grid ── */
  function renderTests(filter = '') {
    const grid = document.getElementById('testGrid');
    const filtered = allTests.filter(t =>
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase())
    );
    grid.innerHTML = filtered.map(t => `
      <div class="test-card ${selected.has(t.name) ? 'selected' : ''}" data-name="${t.name}">
        <div class="test-name">${t.name}</div>
        <div class="test-category">${t.category}</div>
      </div>`).join('');
    grid.querySelectorAll('.test-card').forEach(card => {
      card.addEventListener('click', () => {
        selected.has(card.dataset.name) ? selected.delete(card.dataset.name) : selected.add(card.dataset.name);
        updatePanel();
        renderTests(document.getElementById('testSearch').value);
      });
    });
  }

  function updatePanel() {
    document.getElementById('selectedCount').textContent = selected.size;
    const list = document.getElementById('selectedTestsList');
    list.innerHTML = [...selected].map(t => `
      <div class="prescription-item" style="font-size:.8rem;">
        <span>${t}</span>
        <button class="remove-btn" data-name="${t}">&times;</button>
      </div>`).join('');
    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selected.delete(btn.dataset.name);
        updatePanel();
        renderTests(document.getElementById('testSearch').value);
      });
    });
  }

  renderTests();
  renderAssigned();

  document.getElementById('testSearch').addEventListener('input', function () { renderTests(this.value); });

  document.getElementById('assignBtn').addEventListener('click', () => {
    const patSel = document.getElementById('patientSelect');
    if (!patSel.value) { showToast('Please select a patient.', 'error'); return; }
    if (selected.size === 0) { showToast('Please select at least one test.', 'error'); return; }

    const patText  = patSel.options[patSel.selectedIndex].text.replace(/^PAT-\d+ — /, '');
    const initials = patText.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const entry = {
      patient:     patText,
      initials,
      packageName: document.getElementById('packageName').value,
      tests:       [...selected].join(', '),
      date:        new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
    };

    saveAssignment(entry);
    renderAssigned();
    showToast(`${selected.size} test(s) assigned to ${patText}!`, 'success');
    selected.clear();
    updatePanel();
    renderTests();
    document.getElementById('packageName').value    = '';
    document.getElementById('packageRemarks').value = '';
  });
})();
