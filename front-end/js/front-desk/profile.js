/* ============================================================
   PROFILE.JS — Profile page logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  renderShell('profile');

  const data = await loadData();
  if (!data) {
    showToast('Failed to load data.', 'error');
    return;
  }

  const staff = data.staff;

  // --- Populate Profile Header ---
  const initials = staff.name.split(' ').map(n => n[0]).join('').substring(0, 2);
  document.getElementById('profile-avatar').textContent = initials;
  document.getElementById('profile-name').textContent = staff.name;
  document.getElementById('profile-age').textContent = `${staff.age}${staff.gender}`;
  document.getElementById('profile-role').textContent = staff.role;
  document.getElementById('profile-empid').textContent = `EmpID : ${staff.id}`;
  document.getElementById('profile-dept').textContent = staff.department;

  // --- Employment Details ---
  document.getElementById('joining-date').textContent = staff.joiningDate;
  document.getElementById('reporting-manager').textContent = staff.reportingManager;

  // --- Contact Details ---
  document.getElementById('profile-email').textContent = staff.email;
  document.getElementById('profile-phone').textContent = staff.phone;

  // --- Shift Details ---
  document.getElementById('shift-name').textContent = staff.shift;
  document.getElementById('shift-time').textContent = staff.shiftTime;
  document.getElementById('shift-counter').textContent = staff.counter;

  // --- System Access ---
  document.getElementById('authorized-modules').textContent = staff.authorizedModules.join(', ');
  document.getElementById('last-login').textContent = staff.lastLogin;

  // --- Languages ---
  const langList = document.getElementById('language-list');
  langList.innerHTML = staff.languages.map(lang => `
    <div class="language-chip">
      <div class="language-name">${lang.name}</div>
      <div class="language-level">${lang.level}</div>
    </div>
  `).join('');
});
