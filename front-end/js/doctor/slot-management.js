(async () => {
  await loadComponents('slot-management', 'Slot Management');

  const DEFAULT_SLOTS = [
    { time: '09:00 AM', status: 'available' },
    { time: '10:00 AM', status: 'available' },
    { time: '11:00 AM', status: 'available' },
    { time: '12:00 PM', status: 'available' },
    { time: '02:00 PM', status: 'available' },
    { time: '03:00 PM', status: 'available' },
    { time: '04:00 PM', status: 'available' },
    { time: '05:00 PM', status: 'available' }
  ];

  function getSlotKey(dateStr) { return `slots_${dateStr}`; }
  function loadSlots(dateStr) {
    const saved = localStorage.getItem(getSlotKey(dateStr));
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_SLOTS));
  }
  function persistSlots(dateStr, slots) {
    localStorage.setItem(getSlotKey(dateStr), JSON.stringify(slots));
  }

  let currentDate = null;
  let currentSlots = JSON.parse(JSON.stringify(DEFAULT_SLOTS));

  function renderSlots() {
    const grid = document.getElementById('slotGrid');
    const hasActiveDate = Boolean(currentDate);
    grid.classList.toggle('is-disabled', !hasActiveDate);
    grid.innerHTML = currentSlots.map((s, i) => `
      <div class="slot-item ${s.status}" data-index="${i}">
        <div class="slot-time">${s.time}</div>
        <div class="slot-status">${s.status.charAt(0).toUpperCase() + s.status.slice(1)}</div>
      </div>`).join('');

    grid.querySelectorAll('.slot-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = Number(item.dataset.index);
        if (!hasActiveDate || currentSlots[idx].status === 'booked') return;
        const nextStatus = currentSlots[idx].status === 'unavailable' ? 'available' : 'unavailable';
        currentSlots[idx].status = nextStatus;
        renderSlots();
      });
    });
  }

  document.getElementById('slotDate').addEventListener('change', function () {
    const val = this.value;
    if (!val) {
      currentDate = null;
      currentSlots = JSON.parse(JSON.stringify(DEFAULT_SLOTS));
      document.getElementById('slotDateLabel').textContent = 'Choose a date to start managing availability.';
      document.getElementById('saveSlotBtn').style.display = 'none';
      renderSlots();
      return;
    }

    currentDate = val;
    currentSlots = loadSlots(val);
    const d = new Date(`${val}T00:00:00`);
    document.getElementById('slotDateLabel').textContent = d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    document.getElementById('saveSlotBtn').style.display = '';
    renderSlots();
  });

  document.getElementById('saveSlotBtn').addEventListener('click', () => {
    if (!currentDate) return;
    persistSlots(currentDate, currentSlots);
    showToast('Slot changes saved!', 'success');
  });

  function loadUnavailableDates() {
    return JSON.parse(localStorage.getItem('unavailableDates') || '[]');
  }

  function renderUnavailableTags() {
    const list = loadUnavailableDates();
    const container = document.getElementById('unavailableList');
    container.innerHTML = '';
    list.forEach(d => {
      const tag = document.createElement('span');
      tag.className = 'unavail-tag';
      tag.innerHTML = `${d} <button data-date="${d}">&times;</button>`;
      tag.querySelector('button').addEventListener('click', () => {
        const updated = loadUnavailableDates().filter(x => x !== d);
        localStorage.setItem('unavailableDates', JSON.stringify(updated));
        renderUnavailableTags();
      });
      container.appendChild(tag);
    });
  }

  document.getElementById('markUnavailableBtn').addEventListener('click', () => {
    const val = document.getElementById('unavailableDate').value;
    if (!val) {
      showToast('Please select a date.', 'error');
      return;
    }
    const d = new Date(`${val}T00:00:00`);
    const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const list = loadUnavailableDates();
    if (list.includes(label)) {
      showToast('Date already marked.', 'info');
      return;
    }
    list.push(label);
    localStorage.setItem('unavailableDates', JSON.stringify(list));
    renderUnavailableTags();
    document.getElementById('unavailableDate').value = '';
    showToast(`${label} marked unavailable.`, 'success');
  });

  renderUnavailableTags();
  renderSlots();
})();
