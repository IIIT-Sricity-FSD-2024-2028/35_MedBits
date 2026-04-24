(async () => {
  await loadComponents('profile', 'Profile');

  const editableFields = ['email', 'phone'];
  const editBtn = document.getElementById('editProfileBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const saveBtn = document.getElementById('saveProfileBtn');
  const editActions = document.getElementById('editActions');
  const photoBtn = document.getElementById('changePhotoBtn');
  const photoInput = document.getElementById('photoInput');
  const avatarEl = document.getElementById('profileAvatarLg');
  const profileName = document.getElementById('profileName');
  const profileRole = document.getElementById('profileRole');

  const defaultProfile = {
    name: 'Dr. Sarah Johnson',
    role: 'General Physician - MEDBITS Hospital',
    email: 'sarah.johnson@medbits.com',
    phone: '+91 98765 43210',
    initials: 'SJ'
  };

  function getProfile() {
    return { ...defaultProfile, ...JSON.parse(localStorage.getItem('doctorProfile') || '{}') };
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

    if (data.photo) {
      avatarEl.style.backgroundImage = `url(${data.photo})`;
      avatarEl.style.backgroundSize = 'cover';
      avatarEl.style.backgroundPosition = 'center';
      avatarEl.textContent = '';
    } else {
      avatarEl.style.backgroundImage = '';
      avatarEl.textContent = data.initials;
    }
  }

  function enableEditing(on) {
    editableFields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !on;
    });
    if (photoBtn) photoBtn.style.display = on ? 'flex' : 'none';
    editActions.style.display = on ? 'flex' : 'none';
    editBtn.style.display = on ? 'none' : '';
  }

  loadSaved();
  enableEditing(false);

  editBtn.addEventListener('click', () => enableEditing(true));
  cancelBtn.addEventListener('click', () => {
    loadSaved();
    enableEditing(false);
  });

  saveBtn.addEventListener('click', () => {
    const existing = getProfile();
    existing.email = document.getElementById('email').value;
    existing.phone = document.getElementById('phone').value;
    localStorage.setItem('doctorProfile', JSON.stringify(existing));
    enableEditing(false);
    showToast('Profile updated successfully!', 'success');
  });

  if (photoBtn && photoInput) {
    photoBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const existing = getProfile();
        existing.photo = e.target.result;
        localStorage.setItem('doctorProfile', JSON.stringify(existing));
        loadSaved();
        showToast('Profile photo updated!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }
})();
