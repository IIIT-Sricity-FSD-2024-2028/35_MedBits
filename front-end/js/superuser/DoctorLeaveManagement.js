// ============================================================
// DATA STORE
// ============================================================
const leaveRequests = [
    // ── Pending ──────────────────────────────────────────────
    { id: 1,  name: 'Dr. Alisha Sharma',   dept: 'Cardiology',  startDate: '2025-03-09', endDate: '2025-03-11', type: 'Sick',      reason: 'Viral Fever',       status: 'pending',  dateRange: 'Mar 9 – Mar 11'   },
    { id: 2,  name: 'Dr. Elizabeth O',     dept: 'Cardiology',  startDate: '2025-10-25', endDate: '2025-10-27', type: 'Casual',    reason: 'Family Function',   status: 'pending',  dateRange: 'Oct 25 – Oct 27'  },
    { id: 3,  name: 'Dr. Ana Mary',        dept: 'Dermatology', startDate: '2025-05-09', endDate: '2025-05-10', type: 'Emergency', reason: 'Medical Emergency', status: 'pending',  dateRange: 'May 9 – May 10'   },
    { id: 4,  name: 'Mrs. Sarah Williams', dept: 'Front Desk',  startDate: '2025-04-10', endDate: '2025-04-13', type: 'Casual',    reason: 'Family Function',   status: 'pending',  dateRange: 'Apr 10 – Apr 13'  },
    { id: 5,  name: 'Dr. Raj Patel',       dept: 'Neurology',   startDate: '2025-06-15', endDate: '2025-06-16', type: 'Sick',      reason: 'Migraine',          status: 'pending',  dateRange: 'Jun 15 – Jun 16'  },
    { id: 6,  name: 'Dr. Priya Nair',      dept: 'Oncology',    startDate: '2025-07-20', endDate: '2025-07-25', type: 'Emergency', reason: 'Family Emergency',  status: 'pending',  dateRange: 'Jul 20 – Jul 25'  },
 
    // ── Already Approved ─────────────────────────────────────
    { id: 7,  name: 'Dr. Karan Mehta',    dept: 'Orthopedics', startDate: '2025-02-14', endDate: '2025-02-16', type: 'Sick',      reason: 'Back Pain',        status: 'approved', dateRange: 'Feb 14 – Feb 16', actionedOn: 'Feb 13, 2025, 10:30 AM' },
    { id: 8,  name: 'Dr. Sneha Rao',      dept: 'Pediatrics',  startDate: '2025-01-20', endDate: '2025-01-22', type: 'Casual',    reason: 'Personal Work',    status: 'approved', dateRange: 'Jan 20 – Jan 22', actionedOn: 'Jan 19, 2025, 09:15 AM' },
    { id: 9,  name: 'Dr. Arjun Verma',    dept: 'Neurology',   startDate: '2025-03-01', endDate: '2025-03-03', type: 'Emergency', reason: 'Family Emergency', status: 'approved', dateRange: 'Mar 1 – Mar 3',   actionedOn: 'Feb 28, 2025, 04:00 PM' },
 
    // ── Already Rejected ─────────────────────────────────────
    { id: 10, name: 'Dr. Meena Krishnan', dept: 'Dermatology', startDate: '2025-02-05', endDate: '2025-02-06', type: 'Sick',      reason: 'Flu',              status: 'rejected', dateRange: 'Feb 5 – Feb 6',   actionedOn: 'Feb 4, 2025, 11:45 AM'  },
    { id: 11, name: 'Dr. Rohit Saxena',   dept: 'Cardiology',  startDate: '2025-03-15', endDate: '2025-03-20', type: 'Casual',    reason: 'Vacation',         status: 'rejected', dateRange: 'Mar 15 – Mar 20', actionedOn: 'Mar 14, 2025, 02:30 PM' },
];
 
let activeFilter = null;
let currentViewAll = 'approved';
let toastTimer = null;
 
// ============================================================
// HELPERS
// ============================================================
 
function getTypeClass(type) {
    if (type === 'Sick')   return 'type-sick';
    if (type === 'Casual') return 'type-casual';
    return 'type-emergency';
}
 
function dateInRange(startDate, endDate, filterDate) {
    return new Date(filterDate) >= new Date(startDate) &&
           new Date(filterDate) <= new Date(endDate);
}
 
// ============================================================
// COUNTS
// ============================================================
 
function updateCounts() {
    const pending  = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
 
    animateCount('count-pending',  pending);
    animateCount('count-approved', approved);
    animateCount('count-rejected', rejected);
 
    const badge = document.getElementById('pending-badge');
    if (badge) badge.textContent = `${pending} pending`;
}
 
function animateCount(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
    el.classList.remove('count-pop');
    void el.offsetWidth;
    el.classList.add('count-pop');
}
 
// ============================================================
// RENDER PENDING TABLE (main page)
// ============================================================
 
function renderTable() {
    const tbody      = document.getElementById('leave-table-body');
    const emptyState = document.getElementById('empty-state');
    if (!tbody) return;
 
    let rows = leaveRequests.filter(r => r.status === 'pending');
    if (activeFilter) {
        rows = rows.filter(r => dateInRange(r.startDate, r.endDate, activeFilter));
    }
 
    if (rows.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        lucide.createIcons();
        return;
    }
 
    if (emptyState) emptyState.style.display = 'none';
    tbody.innerHTML = rows.map(r => `
        <tr id="row-${r.id}">
            <td class="doctor-name">${r.name}</td>
            <td>${r.dept}</td>
            <td><span style="font-family:'DM Mono',monospace;font-size:0.8rem">${r.dateRange}</span></td>
            <td><span class="type-badge ${getTypeClass(r.type)}">${r.type}</span></td>
            <td>${r.reason}</td>
            <td class="actions">
                <button class="btn btn-approve" onclick="handleAction(${r.id}, 'approved')">✓ Approve</button>
                <button class="btn btn-reject"  onclick="handleAction(${r.id}, 'rejected')">✕ Reject</button>
            </td>
        </tr>
    `).join('');
 
    lucide.createIcons();
}
 
// ============================================================
// APPROVE / REJECT
// ============================================================
 
function handleAction(id, action) {
    const req = leaveRequests.find(r => r.id === id);
    if (!req) return;
 
    // Show toast immediately
    showToast(req.name, action);
 
    const row = document.getElementById(`row-${id}`);
    if (row) {
        row.style.transition = 'opacity 0.35s, transform 0.35s';
        row.style.opacity    = '0';
        row.style.transform  = 'translateX(30px)';
    }
 
    // Update data after animation
    setTimeout(() => {
        req.status     = action;
        req.actionedOn = new Date().toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        updateCounts();
        renderTable();
    }, 350);
}
 
// ============================================================
// TOAST
// ============================================================
 
function showToast(name, action) {
    const toast = document.getElementById('toast');
    const msg   = document.getElementById('toast-msg');
    const icon  = document.getElementById('toast-icon');
    if (!toast || !msg || !icon) return;
 
    clearTimeout(toastTimer);
    toast.className = 'toast';
 
    if (action === 'approved') {
        toast.classList.add('toast-approve');
        icon.setAttribute('data-lucide', 'check-circle');
        msg.textContent = `${name}'s leave approved`;
    } else {
        toast.classList.add('toast-reject');
        icon.setAttribute('data-lucide', 'x-circle');
        msg.textContent = `${name}'s leave rejected`;
    }
 
    lucide.createIcons();
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
 
// ============================================================
// DATE FILTER
// ============================================================
 
function applyDateFilter() {
    const val = document.getElementById('date-filter').value;
    if (!val) { clearFilter(); return; }
 
    activeFilter = val;
    const label = new Date(val).toLocaleDateString('en-US', {
        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
    });
 
    const info = document.getElementById('filter-info');
    if (info) { info.textContent = `Showing: ${label}`; info.style.display = 'inline-flex'; }
 
    renderTable();
}
 
function clearFilter() {
    activeFilter = null;
    const d = document.getElementById('date-filter');
    const i = document.getElementById('filter-info');
    if (d) d.value = '';
    if (i) i.style.display = 'none';
    renderTable();
}
 
// ============================================================
// PAGE NAVIGATION
// ============================================================
 
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
 
    if (name === 'main') {
        document.getElementById('page-main').classList.add('active');
        const h = document.getElementById('header-page-title');
        if (h) h.textContent = 'Staff Leave Management';
        renderTable();
    }
}
 
function showViewAll(type) {
    currentViewAll = type;
 
    // Switch visible page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-viewall').classList.add('active');
 
    // Update headings
    const titleEl  = document.getElementById('viewall-title');
    const pillEl   = document.getElementById('viewall-pill');
    const emptyMsg = document.getElementById('viewall-empty-msg');
    const headerH2 = document.getElementById('header-page-title');
 
    if (type === 'approved') {
        if (titleEl)  titleEl.textContent  = 'Approved Leave Requests';
        if (pillEl)   { pillEl.textContent = 'Approved'; pillEl.className = 'status-pill pill-approved'; }
        if (emptyMsg) emptyMsg.textContent = 'No approved requests yet';
        if (headerH2) headerH2.textContent = 'Approved Leave Requests';
    } else {
        if (titleEl)  titleEl.textContent  = 'Rejected Leave Requests';
        if (pillEl)   { pillEl.textContent = 'Rejected'; pillEl.className = 'status-pill pill-rejected'; }
        if (emptyMsg) emptyMsg.textContent = 'No rejected requests yet';
        if (headerH2) headerH2.textContent = 'Rejected Leave Requests';
    }
 
    renderViewAll(type);
}
 
// ============================================================
// RENDER VIEW-ALL TABLE
// ============================================================
 
function renderViewAll(type) {
    const tbody = document.getElementById('viewall-table-body');
    const empty = document.getElementById('viewall-empty');
    if (!tbody) return;
 
    const rows = leaveRequests.filter(r => r.status === type);
 
    if (rows.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        lucide.createIcons();
        return;
    }
 
    if (empty) empty.style.display = 'none';
 
    tbody.innerHTML = rows.map(r => `
        <tr>
            <td class="doctor-name">${r.name}</td>
            <td>${r.dept}</td>
            <td><span style="font-family:'DM Mono',monospace;font-size:0.8rem">${r.dateRange}</span></td>
            <td><span class="type-badge ${getTypeClass(r.type)}">${r.type}</span></td>
            <td>${r.reason}</td>
            <td style="font-size:0.78rem;color:var(--text-muted)">${r.actionedOn || '—'}</td>
        </tr>
    `).join('');
 
    lucide.createIcons();
}
 
// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    updateCounts();
    renderTable();
});
 