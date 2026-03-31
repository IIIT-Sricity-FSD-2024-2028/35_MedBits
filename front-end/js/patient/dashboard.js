/* ============================================
   dashboard.js — Patient dashboard logic
   FILE: front-end/js/patient/dashboard.js

   getSession() is now in utils.js (loaded before this file),
   so it is always available here — no conditional typeof check needed.
   ============================================ */

function renderDashboard() {
  // updateTopbarUser() reads getSession() from utils.js
  updateTopbarUser();

  // Get the logged-in user's first name from the session.
  // getSession() is defined in utils.js which is loaded first.
  const session   = getSession();
  const firstName = (session && session.firstName)
                    ? session.firstName
                    : (DB.patient ? DB.patient.firstName : 'there');

  // Fill welcome name in the hero banner
  setText('welcomeName', firstName);

  // Fill the 3 stat pills
  const upcoming = DB.appointments.filter(a => a.status === 'upcoming');
  setText('upcomingCount', upcoming.length);
  setText('labCount',      DB.labOrders.length);
  setText('recordCount',   DB.medicalRecords.length);

  // Fill upcoming appointments list
  fillDashList('upcomingList',
    upcoming.length
      ? upcoming.map(a => ({
          title: a.doctor,
          sub:   a.speciality + ' · ' + formatDate(a.date) + ' at ' + a.time
        }))
      : [{ title: '', sub: 'No upcoming appointments' }]
  );

  // Fill recent lab tests list
  fillDashList('labOrdersList',
    DB.labOrders.length
      ? DB.labOrders.map(o => ({
          title:  o.test,
          sub:    formatDate(o.date) + ' · ' + (o.status === 'completed' ? 'Download Report' : 'In progress'),
          badge:  o.status === 'completed' ? 'Done' : 'Pending',
          colour: o.status === 'completed' ? 'badge-green' : 'badge-orange'
        }))
      : [{ title: '', sub: 'No lab orders yet' }]
  );
}

// Fill a dark dash-card list from the tpl-dash-item template
function fillDashList(containerId, rows) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';

  rows.forEach(row => {
    const tpl = document.getElementById('tpl-dash-item');
    if (!tpl) return;
    const frag = tpl.content.cloneNode(true);
    const item = frag.querySelector('.dash-item');

    item.querySelector('.dash-item-title').textContent = row.title;
    item.querySelector('.dash-item-sub').textContent   = row.sub;

    if (row.badge) {
      const badge       = document.createElement('span');
      badge.className   = 'badge ' + row.colour;
      badge.textContent = row.badge;
      item.appendChild(badge);
    }

    el.appendChild(frag);
  });
}
