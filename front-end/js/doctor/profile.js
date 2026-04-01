(async () => {
  await loadComponents('profile', 'Profile');

  const editableFields = ['email', 'phone'];
  const editBtn = document.getElementById('editProfileBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const saveBtn = document.getElementById('saveProfileBtn');
  const editActions = document.getElementById('editActions');
  const avatarEl = document.getElementById('profileAvatarLg');
  const profileName = document.getElementById('profileName');
  const profileRole = document.getElementById('profileRole');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');

  const defaultProfile = {
    name: 'Dr. Sarah Johnson',
    role: 'General Physician - MEDBITS Hospital',
    email: 'sarah.johnson@medbits.com',
    phone: '9384751206',
    initials: 'SJ'
  };

  function getProfile() {
    const savedProfile = JSON.parse(localStorage.getItem('doctorProfile') || '{}');
    const mergedProfile = { ...defaultProfile, ...savedProfile };

    if (mergedProfile.photo) {
      delete mergedProfile.photo;
    }

    const normalizedPhone = getNormalizedPhone(mergedProfile.phone || '');
    mergedProfile.phone = normalizedPhone.length === 10 ? normalizedPhone : defaultProfile.phone;

    return mergedProfile;
  }

  function loadSaved() {
    const data = getProfile();
    document.getElementById('email').value = data.email;
    document.getElementById('phone').value = data.phone;
    profileName.textContent = data.name;
    profileRole.textContent = data.role;

    const topName = document.getElementById('userNameTop');
    const topRole = document.getElementById('userRoleTop');
    if (topName) topName.textContent = data.name;
    if (topRole) topRole.textContent = data.role;

    avatarEl.style.backgroundImage = '';
    avatarEl.textContent = data.initials;
  }

  function enableEditing(on) {
    editableFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    });
    editActions.style.display = on ? 'flex' : 'none';
    editBtn.style.display = on ? 'none' : '';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getNormalizedPhone(phone) {
    return phone.replace(/\D/g, '');
  }

  loadSaved();
  enableEditing(false);

  const existingProfile = JSON.parse(localStorage.getItem('doctorProfile') || '{}');
  if (existingProfile.photo || (existingProfile.phone && getNormalizedPhone(existingProfile.phone).length !== 10)) {
    const sanitizedProfile = getProfile();
    localStorage.setItem('doctorProfile', JSON.stringify(sanitizedProfile));
  }

  phoneInput.addEventListener('input', () => {
    phoneInput.value = getNormalizedPhone(phoneInput.value).slice(0, 10);
  });

  editBtn.addEventListener('click', () => enableEditing(true));
  cancelBtn.addEventListener('click', () => {
    loadSaved();
    enableEditing(false);
  });

  saveBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const phoneDigits = getNormalizedPhone(phoneInput.value);

    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    if (phoneDigits.length !== 10) {
      showToast('Phone number must be exactly 10 digits.', 'error');
      phoneInput.focus();
      return;
    }

    const existing = getProfile();
    existing.email = email;
    existing.phone = phoneDigits;
    localStorage.setItem('doctorProfile', JSON.stringify(existing));
    enableEditing(false);
    showToast('Profile updated successfully!', 'success');
  });
})();
