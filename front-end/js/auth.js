/* ============================================
   auth.js — Session management + Login/Signup
   FILE: front-end/js/auth.js
   LOADED BY: html/login.html  (via ../js/auth.js)
              html/signup.html (via ../js/auth.js)

   FIXES:
   1. _redirect() now uses window.location.replace() instead of
      window.location.href — replace() removes the login page from
      browser history so the Back button can't loop back to it.

   2. _redirect() paths corrected:
      login.html is at html/login.html
      dashboard  is at html/patient/dashboard.html
      So the path from login.html is just 'patient/dashboard.html'
      (NOT '../html/patient/dashboard.html' which was wrong)

   3. saveSession() now stores firstName + lastName separately
      so dashboard.js can read the real logged-in user's name.
   ============================================ */

const SESSION_KEY   = 'medbits_session';
const LOCAL_PAT_KEY = 'medbits_patients';

/* ── SEED USERS ── */
const SEED_USERS = {
  patients: [
    { id:'PAT002', firstName:'Ria', lastName:'Sharma',
      email:'ria@medbits.com', phone:'9473487399',
      password:'patient123', dob:'24/10/1990',
      gender:'Female', bloodGroup:'A+', guardian:'Ravi Sharma' }
  ],
  doctors: [
    { id:'DOC001', name:'Dr. S Madhuri',     email:'madhuri@medbits.com',  password:'doctor123', speciality:'Dermatologist', exp:'10 Years', qual:'MBBS, MD',      fee:850,  hospital:'MedBits, Sricity', gender:'female' },
    { id:'DOC002', name:'Dr. Sushil Datta',  email:'sushil@medbits.com',   password:'doctor123', speciality:'Dermatologist', exp:'7 Years',  qual:'MBBS, MD, DNB', fee:750,  hospital:'MedBits, Sricity', gender:'male'   },
    { id:'DOC003', name:'Dr. Ashwini Ray',   email:'ashwini@medbits.com',  password:'doctor123', speciality:'Dermatologist', exp:'11 Years', qual:'MBBS, MD',      fee:890,  hospital:'MedBits, Sricity', gender:'female' },
    { id:'DOC005', name:'Dr. Sarah Johnson', email:'sarah@medbits.com',    password:'doctor123', speciality:'Cardiologist',  exp:'15 Years', qual:'MBBS, MD, DM',  fee:900,  hospital:'MedBits, Sricity', gender:'female' },
    { id:'DOC008', name:'Dr. Ramesh Iyer',   email:'ramesh@medbits.com',   password:'doctor123', speciality:'Cardiologist',  exp:'12 Years', qual:'MBBS, MD, DM',  fee:950,  hospital:'MedBits, Sricity', gender:'male'   },
    { id:'DOC009', name:'Dr. Priya Menon',   email:'priya@medbits.com',    password:'doctor123', speciality:'Cardiologist',  exp:'8 Years',  qual:'MBBS, MD',      fee:875,  hospital:'MedBits, Sricity', gender:'female' },
    { id:'DOC004', name:'Dr. Paul Johnson',  email:'paul@medbits.com',     password:'doctor123', speciality:'Pediatrician',  exp:'10 Years', qual:'MBBS, MD',      fee:850,  hospital:'MedBits, Sricity', gender:'male'   },
    { id:'DOC010', name:'Dr. Kavita Sharma', email:'kavita@medbits.com',   password:'doctor123', speciality:'Pediatrician',  exp:'6 Years',  qual:'MBBS, MD',      fee:700,  hospital:'MedBits, Sricity', gender:'female' },
    { id:'DOC006', name:'Dr. Robert Wilson', email:'robert@medbits.com',   password:'doctor123', speciality:'Orthopedic',    exp:'14 Years', qual:'MBBS, MS',      fee:800,  hospital:'MedBits, Sricity', gender:'male'   },
    { id:'DOC011', name:'Dr. Anita Gupta',   email:'anita@medbits.com',    password:'doctor123', speciality:'Orthopedic',    exp:'9 Years',  qual:'MBBS, MS',      fee:780,  hospital:'MedBits, Sricity', gender:'female' }
  ],
  frontDesk: [{ id:'FD001', name:'Priya Nair', email:'frontdesk@medbits.com', password:'desk123'  }],
  superuser:  [{ id:'SU001', name:'Admin',      email:'admin@medbits.com',     password:'admin123' }]
};

/* ── SESSION HELPERS ── */
function saveSession(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function getSession()      { try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; } catch(e) { return null; } }
function clearSession()    { localStorage.removeItem(SESSION_KEY); }

/* ── AUTH GUARD (call at top of every protected page) ── */
function requireAuth(role) {
  const user = getSession();
  if (!user || (role && user.role !== role)) {
    // Calculate how far up to go to reach html/login.html
    const parts  = window.location.pathname.split('/').filter(Boolean);
    // Remove the filename, count directory segments inside front-end/html/
    const depth  = parts.length;
    const prefix = depth >= 4 ? '../../' : (depth >= 3 ? '../' : '');
    window.location.replace(prefix + 'html/login.html');
    return null;
  }
  return user;
}

/* ── LOGIN ── */
function handleLogin(email, password) {
  const localPats = JSON.parse(localStorage.getItem(LOCAL_PAT_KEY) || '[]');
  const allPats   = [...SEED_USERS.patients, ...localPats];

  const pat = allPats.find(p =>
    (p.email === email || p.phone === email) && p.password === password
  );
  if (pat) {
    saveSession({
      id:        pat.id,
      name:      pat.firstName + ' ' + pat.lastName,
      firstName: pat.firstName,   // stored separately so dashboard can read just first name
      lastName:  pat.lastName,
      role:      'patient',
      email:     pat.email
    });
    _redirect('patient/dashboard.html');
    return;
  }

  const doc = SEED_USERS.doctors.find(d => d.email === email && d.password === password);
  if (doc) {
    const firstName = doc.name.replace('Dr. ', '').split(' ')[0];
    saveSession({ id:doc.id, name:doc.name, firstName, lastName:'', role:'doctor', email:doc.email });
    _redirect('doctor/dashboard.html');
    return;
  }

  const fd = SEED_USERS.frontDesk.find(f => f.email === email && f.password === password);
  if (fd) {
    saveSession({ id:fd.id, name:fd.name, firstName:fd.name, lastName:'', role:'frontdesk', email:fd.email });
    _redirect('front-desk/dashboard.html');
    return;
  }

  const su = SEED_USERS.superuser.find(s => s.email === email && s.password === password);
  if (su) {
    saveSession({ id:su.id, name:su.name, firstName:su.name, lastName:'', role:'superuser', email:su.email });
    _redirect('superuser/dashboard.html');
    return;
  }

  return 'Invalid email / phone or password. Try: ria@medbits.com / patient123';
}

/* ── SIGNUP ── */
function handleSignup(form) {
  const pats    = JSON.parse(localStorage.getItem(LOCAL_PAT_KEY) || '[]');
  const allPats = [...SEED_USERS.patients, ...pats];

  if (allPats.find(p => p.email === form.email))
    return 'An account with this email already exists.';

  const np = { id: 'PAT' + Date.now(), ...form };
  pats.push(np);
  localStorage.setItem(LOCAL_PAT_KEY, JSON.stringify(pats));

  saveSession({
    id:        np.id,
    name:      np.firstName + ' ' + np.lastName,
    firstName: np.firstName,
    lastName:  np.lastName,
    role:      'patient',
    email:     np.email
  });

  _redirect('patient/dashboard.html');
}

/* ── INTERNAL REDIRECT ──
   Both login.html and signup.html live at html/login.html, html/signup.html.
   All role dashboards live at html/<role>/dashboard.html.
   So the relative path is always just '<role>/dashboard.html'.

   Using location.replace() so login/signup pages are NOT kept
   in browser history — pressing Back after login won't return
   to the form.
*/
function _redirect(relativePath) {
  window.location.replace(relativePath);
}

/* Expose seed doctors for the patient portal data layer */
function getSeedDoctors() { return SEED_USERS.doctors; }
