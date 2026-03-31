/* ── dashboard.js ── */
(async () => {
  await loadComponents('dashboard', 'Dashboard');
  // Update welcome banner with saved name if available
  const profile = getDoctorProfile();
  const bannerTitle = document.querySelector('.banner-title');
  if (bannerTitle) bannerTitle.textContent = `Welcome back, ${profile.name}!`;
})();
