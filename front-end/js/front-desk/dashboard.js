/* ============================================================
   DASHBOARD.JS - Dashboard page logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  renderShell('dashboard');

  const data = await loadData();
  if (!data) {
    showToast('Failed to load data. Please refresh.', 'error');
    return;
  }

  ensureQueueStore();
  const queueItems = getQueueItems();
  const activeQueueItems = queueItems.filter(item => item.status !== 'Completed');
  const waitingItems = queueItems.filter(item => item.status === 'Waiting').slice(0, 4);
  const consultItems = queueItems.filter(item => item.status === 'In Consultation').slice(0, 4);

  document.getElementById('stat-walkins').textContent = data.dashboard.walkInsToday;
  document.getElementById('stat-appointments').textContent = data.dashboard.appointmentsToday;
  document.getElementById('stat-queue').textContent = activeQueueItems.length;

  const waitingList = document.getElementById('queue-waiting-list');
  if (!waitingItems.length) {
    waitingList.innerHTML = '<div class="empty-state"><p>No patients waiting</p></div>';
  } else {
    waitingList.innerHTML = waitingItems.map(item => `
      <div class="queue-item">
        <div class="queue-item-token">${item.code}</div>
        <div class="queue-item-name">${item.patientName}</div>
      </div>
    `).join('');
  }

  const consultList = document.getElementById('queue-consulting-list');
  if (!consultItems.length) {
    consultList.innerHTML = '<div class="empty-state"><p>No active consultations</p></div>';
  } else {
    consultList.innerHTML = consultItems.map(item => `
      <div class="queue-item queue-item--consulting">
        <div class="queue-item-token">${item.code}</div>
        <div class="queue-item-name">${item.patientName}</div>
        <div class="queue-item-doctor">${item.doctorName}</div>
      </div>
    `).join('');
  }
});
