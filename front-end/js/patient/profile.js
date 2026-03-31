/* MEDBITS – profile.js */

// Show the patient's info on the profile page
function renderProfile() {
  const p = DB.patient;

  // Banner at the top
  setText('profileInitials', p.firstName[0] + p.lastName[0]);
  setText('profileName', p.firstName + ' ' + p.lastName);
  setText('profileId',   'Patient ID: ' + p.id);

  // Read-only input fields
  setValue('pf-firstName', p.firstName);
  setValue('pf-lastName',  p.lastName);
  setValue('pf-dob',       p.dob);
  setValue('pf-gender',    p.gender);
  setValue('pf-blood',     p.bloodGroup);
  setValue('pf-phone',     p.phone);
  setValue('pf-email',     p.email);
  setValue('pf-guardian',  p.guardian);
}

// Open the edit modal pre-filled with current data
function openEditProfile() {
  const p = DB.patient;
  setValue('ef-fn',     p.firstName);
  setValue('ef-ln',     p.lastName);
  setValue('ef-dob',    p.dob);
  setValue('ef-gender', p.gender);
  setValue('ef-bg',     p.bloodGroup);
  setValue('ef-ph',     p.phone);
  setValue('ef-em',     p.email);
  setValue('ef-gn',     p.guardian);
  openModal(document.getElementById('tpl-editProfile').innerHTML);
}

// Save edited data back to DB and refresh the page
function saveProfile() {
  DB.patient.firstName  = val('ef-fn');
  DB.patient.lastName   = val('ef-ln');
  DB.patient.dob        = val('ef-dob');
  DB.patient.gender     = val('ef-gender');
  DB.patient.bloodGroup = val('ef-bg');
  DB.patient.phone      = val('ef-ph');
  DB.patient.email      = val('ef-em');
  DB.patient.guardian   = val('ef-gn');
  closeModal();
  showToast('Profile updated', 'success');
  updateTopbarUser();
  renderProfile();
}

// Helper: set a form input value by id
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
