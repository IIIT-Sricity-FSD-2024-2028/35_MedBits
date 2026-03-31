const DEFAULT_DOCTORS = [
    { id: 1, firstName: 'Alisha', lastName: 'Sharma', dob: '1985-05-12', email: 'alisha.sharma@medbits.com', gender: 'Female', contact: '9999999999', specialization: 'Cardiology', qualification: 'DM', department: 'Cardiology', experience: '168 months', experienceMonths: '168', availableDays: '6 day(s)/week', availableDaysCount: '6', timeSlots: '8:00 AM to 1:00 PM', slotDuration: '20 minutes', slotDurationMinutes: '20' },
    { id: 2, firstName: 'Elizabeth', lastName: 'O', dob: '1980-11-30', email: 'elizabeth.o@medbits.com', gender: 'Female', contact: '8888888888', specialization: 'Neurology', qualification: 'DM', department: 'Cardiology', experience: '216 months', experienceMonths: '216', availableDays: '5 day(s)/week', availableDaysCount: '5', timeSlots: '10:00 AM to 3:00 PM', slotDuration: '30 minutes', slotDurationMinutes: '30' },
    { id: 3, firstName: 'Ana', lastName: 'Mary', dob: '1990-08-07', email: 'ana.mary@medbits.com', gender: 'Female', contact: '7777777777', specialization: 'Nephrology', qualification: 'MD', department: 'Dermatology', experience: '108 months', experienceMonths: '108', availableDays: '5 day(s)/week', availableDaysCount: '5', timeSlots: '9:00 AM to 2:00 PM', slotDuration: '15 minutes', slotDurationMinutes: '15' },
    { id: 4, firstName: 'Sarah', lastName: 'Johnson', dob: '1989-10-23', email: 'doc112@gmail.com', gender: 'Female', contact: '9823165784', specialization: 'Dermatology', qualification: 'MD', department: 'Dermatology', experience: '132 months', experienceMonths: '132', availableDays: '5 day(s)/week', availableDaysCount: '5', timeSlots: '9:00 AM to 2:00 PM', slotDuration: '15 minutes', slotDurationMinutes: '15' },
    { id: 5, firstName: 'Sarah', lastName: 'Williams', dob: '1987-03-15', email: 'sarah.williams@medbits.com', gender: 'Female', contact: '6666666666', specialization: 'Cardiology', qualification: 'MBBS', department: 'FrontDesk', experience: '84 months', experienceMonths: '84', availableDays: '5 day(s)/week', availableDaysCount: '5', timeSlots: '9:00 AM to 5:00 PM', slotDuration: '15 minutes', slotDurationMinutes: '15' },
];

window.DoctorStore = {
    key: 'medbits_doctors',
    getAll() {
        try {
            const raw = localStorage.getItem(this.key);
            if (raw) return JSON.parse(raw);
        } catch {}
        this.saveAll(DEFAULT_DOCTORS);
        return DEFAULT_DOCTORS;
    },
    saveAll(doctors) { try { localStorage.setItem(this.key, JSON.stringify(doctors)); } catch {} },
    getById(id) { return this.getAll().find(d => d.id === Number(id)) || null; },
    add(doctor) {
        const all = this.getAll();
        doctor.id = all.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        all.push(doctor);
        this.saveAll(all);
    },
    update(id, updates) {
        const all = this.getAll();
        const index = all.findIndex(d => d.id === Number(id));
        if (index < 0) return false;
        all[index] = { ...all[index], ...updates };
        this.saveAll(all);
        return true;
    },
    search(query) {
        const q = query.trim().toLowerCase();
        return !q ? this.getAll() : this.getAll().filter(d =>
            `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
            d.department.toLowerCase().includes(q) ||
            d.specialization.toLowerCase().includes(q) ||
            d.contact.includes(q)
        );
    },
    fullName: doctor => `${doctor.firstName} ${doctor.lastName}`,
};

const PAGES = ['page-view-doctor', 'page-view-all-doctor', 'page-add-doctor', 'page-edit-doctor'];
const DETAIL_FIELDS = {
    'detail-personal': [['firstName', 'First Name'], ['lastName', 'Last Name'], ['dob', 'Date of Birth'], ['email', 'E-Mail Id'], ['gender', 'Gender'], ['contact', 'Contact No']],
    'detail-employment': [['specialization', 'Specialization'], ['qualification', 'Qualification'], ['department', 'Department'], ['experience', 'Experience']],
    'detail-availability': [['availableDays', 'Available Days'], ['timeSlots', 'Time Slots'], ['slotDuration', 'Slot Duration']],
};
const FORM_FIELDS = ['firstName', 'lastName', 'specialization', 'qualification', 'department'];
const formState = { add: false, edit: false };
let currentDoctorId = null;
let editDoctorId = null;

const $ = id => document.getElementById(id);
const setInvalid = (el, invalid) => el && el.classList.toggle('invalid', invalid);
const removeEditDropdown = () => $('mb-search-dropdown')?.remove();
const formatTime = value => {
    if (!value) return '';
    const [h, m] = value.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const to24h = value => {
    if (!value || /^\d{2}:\d{2}$/.test(value)) return value || '';
    const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '';
    let [, h, m, meridiem] = match;
    h = Number(h);
    if (/PM/i.test(meridiem) && h !== 12) h += 12;
    if (/AM/i.test(meridiem) && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
};

function showToast(message, type = 'success') {
    const existing = $('mb-toast');
    if (existing) existing.remove();
    const toast = Object.assign(document.createElement('div'), { id: 'mb-toast', textContent: message });
    toast.style.background = type === 'success' ? '#0f766e' : '#dc2626';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

function navigateTo(pageId, doctorId = null) {
    PAGES.forEach(id => { const page = $(id); if (page) page.style.display = id === pageId ? '' : 'none'; });
    if (pageId === 'page-view-doctor') initViewPage();
    if (pageId === 'page-view-all-doctor' && doctorId != null) initDetailPage(doctorId);
    if (pageId === 'page-add-doctor') initManagedForm('add');
    if (pageId === 'page-edit-doctor') initManagedForm('edit', doctorId);
    lucide.createIcons();
}

function initViewPage() {
    renderDoctorRows(DoctorStore.getAll());
    const search = $('view-search-input');
    if (!search || search.dataset.bound) return;
    search.dataset.bound = 'true';
    search.addEventListener('input', () => renderDoctorRows(DoctorStore.search(search.value)));
}

function renderDoctorRows(doctors) {
    const tbody = $('doctors-tbody');
    if (!tbody) return;
    tbody.innerHTML = doctors.length ? doctors.map(d => `
        <tr>
            <td class="doctor-name">${DoctorStore.fullName(d)}</td>
            <td>${d.department}</td>
            <td>${d.specialization}</td>
            <td>${d.contact}</td>
            <td><button class="view-link" data-view-id="${d.id}">view all</button></td>
        </tr>
    `).join('') : '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:2rem;">No doctors found.</td></tr>';
}

function initDetailPage(id) {
    const doctor = DoctorStore.getById(id);
    if (!doctor) return;
    currentDoctorId = doctor.id;
    $('detail-title').textContent = `All Details of ${DoctorStore.fullName(doctor)}`;
    Object.entries(DETAIL_FIELDS).forEach(([gridId, fields]) => {
        $(gridId).innerHTML = fields.map(([key, label]) => `
            <div class="info-field">
                <label>${label}</label>
                <input type="text" value="${doctor[key] || '-'}" readonly>
            </div>
        `).join('');
    });
}

function clearInvalid(form) {
    form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function validateForm(form, start, end) {
    let valid = true;
    const checks = [
        ['firstName', value => /^[A-Za-z]+$/.test(value.trim())],
        ['lastName', value => /^[A-Za-z]+$/.test(value.trim())],
        ['specialization', value => /^[A-Za-z]+$/.test(value.trim())],
        ['qualification', value => /^[A-Za-z]+$/.test(value.trim())],
        ['department', value => /^[A-Za-z]+$/.test(value.trim())],
        ['dob', value => !!value],
        ['email', value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())],
        ['gender', value => !!value],
        ['contact', value => /^\d{10}$/.test(value.trim())],
        ['experience', value => value !== '' && Number(value) >= 0],
        ['availableDays', value => value !== '' && Number(value) >= 1 && Number(value) <= 7],
        ['slotDuration', value => value !== '' && Number(value) >= 5],
    ];
    checks.forEach(([name, rule]) => {
        const input = form.querySelector(`[name="${name}"]`);
        const ok = !!input && rule(input.value);
        setInvalid(input, !ok);
        if (!ok) valid = false;
    });
    const slotOk = start.value && end.value && start.value < end.value;
    setInvalid(start, !slotOk);
    setInvalid(end, !slotOk);
    return valid && slotOk;
}

function buildPayload(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    return {
        ...data,
        experienceMonths: data.experience,
        experience: `${data.experience} months`,
        availableDaysCount: data.availableDays,
        availableDays: `${data.availableDays} day(s)/week`,
        slotDurationMinutes: data.slotDuration,
        slotDuration: `${data.slotDuration} minutes`,
    };
}

function bindWordField(field) {
    field?.addEventListener('input', () => { field.value = field.value.replace(/\s/g, ''); });
    field?.addEventListener('keydown', event => { if (event.key === ' ') event.preventDefault(); });
}

function populateForm(form, doctor, start, end, hidden) {
    ['firstName', 'lastName', 'dob', 'email', 'gender', 'contact', 'specialization', 'qualification', 'department'].forEach(name => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input) input.value = doctor[name] || '';
    });
    form.querySelector('[name="experience"]').value = parseInt(doctor.experienceMonths || doctor.experience) || '';
    form.querySelector('[name="availableDays"]').value = parseInt(doctor.availableDaysCount || doctor.availableDays) || '';
    form.querySelector('[name="slotDuration"]').value = parseInt(doctor.slotDurationMinutes || doctor.slotDuration) || '';
    const [from = '', to = ''] = (doctor.timeSlots || '').split(' to ');
    start.value = to24h(from.trim());
    end.value = to24h(to.trim());
    hidden.value = start.value && end.value ? `${formatTime(start.value)} to ${formatTime(end.value)}` : '';
    editDoctorId = doctor.id;
}

function renderEditDropdown(doctors, searchBox, onPick) {
    removeEditDropdown();
    if (!doctors.length) return;
    const dropdown = Object.assign(document.createElement('ul'), { id: 'mb-search-dropdown' });
    doctors.forEach(doctor => {
        const item = Object.assign(document.createElement('li'), { textContent: DoctorStore.fullName(doctor) });
        item.addEventListener('mousedown', event => {
            event.preventDefault();
            onPick(doctor);
            removeEditDropdown();
        });
        dropdown.appendChild(item);
    });
    searchBox.appendChild(dropdown);
}

function wireForm(type) {
    if (formState[type]) return;
    formState[type] = true;
    const form = $(`${type}DoctorForm`);
    const start = $(`${type}-timeSlotStart`);
    const end = $(`${type}-timeSlotEnd`);
    const hidden = $(`${type}-timeSlots`);
    const search = $(`${type}-search-input`);
    const searchBox = search?.closest('.search-box');
    const syncTime = () => { hidden.value = start.value && end.value ? `${formatTime(start.value)} to ${formatTime(end.value)}` : ''; };

    FORM_FIELDS.forEach(name => bindWordField(form.querySelector(`[name="${name}"]`)));
    form.querySelector('[name="contact"]')?.addEventListener('input', event => {
        event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10);
    });
    [start, end].forEach(input => input?.addEventListener('change', syncTime));

    if (type === 'edit' && search && searchBox) {
        search.addEventListener('input', () => {
            renderEditDropdown(DoctorStore.search(search.value), searchBox, doctor => {
                populateForm(form, doctor, start, end, hidden);
                search.value = DoctorStore.fullName(doctor);
                showToast(`Loaded profile of ${DoctorStore.fullName(doctor)}`);
            });
        });
        search.addEventListener('blur', () => setTimeout(removeEditDropdown, 150));
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        clearInvalid(form);
        if (type === 'edit' && !editDoctorId) {
            showToast('Please search and select a doctor first.', 'error');
            search?.focus();
            return;
        }
        syncTime();
        if (!validateForm(form, start, end)) return showToast('Please fix the highlighted fields.', 'error');
        const payload = buildPayload(form);
        if (type === 'add') {
            DoctorStore.add(payload);
            form.reset();
            hidden.value = '';
            showToast('Doctor profile added successfully!');
        } else if (DoctorStore.update(editDoctorId, payload)) {
            showToast('Doctor profile updated successfully!');
        } else {
            return showToast('Update failed. Doctor not found.', 'error');
        }
        setTimeout(() => navigateTo('page-view-doctor'), 1500);
    });

    $(`${type}-cancel-btn`)?.addEventListener('click', () => {
        if (confirm('Discard changes and go back?')) navigateTo('page-view-doctor');
    });
}

function initManagedForm(type, preloadId) {
    wireForm(type);
    const form = $(`${type}DoctorForm`);
    const start = $(`${type}-timeSlotStart`);
    const end = $(`${type}-timeSlotEnd`);
    const hidden = $(`${type}-timeSlots`);
    const dob = $(`${type}-dob`);
    form.reset();
    hidden.value = '';
    if (dob) dob.max = new Date().toISOString().split('T')[0];
    if (type === 'edit') {
        editDoctorId = null;
        removeEditDropdown();
        const search = $('edit-search-input');
        if (search) search.value = '';
        const doctor = preloadId != null ? DoctorStore.getById(preloadId) : null;
        if (doctor) {
            populateForm(form, doctor, start, end, hidden);
            if (search) search.value = DoctorStore.fullName(doctor);
        }
    }
}

document.addEventListener('click', event => {
    const button = event.target.closest('[data-action], [data-view-id], #back-to-list-btn');
    if (!button) return;
    if (button.id === 'back-to-list-btn') return navigateTo('page-view-doctor');
    if (button.dataset.viewId) return navigateTo('page-view-all-doctor', currentDoctorId = Number(button.dataset.viewId));
    const page = { 'view-doctor': 'page-view-doctor', 'add-doctor': 'page-add-doctor', 'edit-doctor': 'page-edit-doctor' }[button.dataset.action];
    if (page) navigateTo(page, currentDoctorId);
});

document.addEventListener('DOMContentLoaded', () => navigateTo('page-view-doctor'));
