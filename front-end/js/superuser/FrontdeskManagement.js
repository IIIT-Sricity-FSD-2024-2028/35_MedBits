(function () {
    const DEFAULT_STAFF = [
        { id: 1, firstName: 'Ananya', lastName: 'Sharma', dob: '1996-03-14', email: 'ananya.sharma@medbits.com', gender: 'Female', contact: '9999999999', reportingManagerId: 'AH101', languageCount: 2, languages: ['English', 'Hindi'], dateJoining: '2021-06-01', counter: '1', shiftStart: '08:00', shiftEnd: '16:00' },
        { id: 2, firstName: 'Elizabeth', lastName: 'O', dob: '1991-07-22', email: 'elizabeth.o@medbits.com', gender: 'Female', contact: '8888888888', reportingManagerId: 'AH102', languageCount: 3, languages: ['English', 'French', 'Spanish'], dateJoining: '2019-09-15', counter: '2', shiftStart: '09:00', shiftEnd: '17:00' },
        { id: 3, firstName: 'Ana', lastName: 'Mary', dob: '1993-11-05', email: 'ana.mary@medbits.com', gender: 'Female', contact: '7777777777', reportingManagerId: 'AH103', languageCount: 2, languages: ['English', 'Malayalam'], dateJoining: '2020-02-10', counter: '3', shiftStart: '10:00', shiftEnd: '18:00' },
        { id: 4, firstName: 'Sarah', lastName: 'Williams', dob: '1995-08-30', email: 'sarah.williams@medbits.com', gender: 'Female', contact: '6666666666', reportingManagerId: 'AH104', languageCount: 1, languages: ['English'], dateJoining: '2022-01-03', counter: '4', shiftStart: '07:00', shiftEnd: '15:00' },
    ];

    const formState = { add: false, edit: false };
    let currentViewAllId = null;
    let editCurrentStaffId = null;

    const $ = id => document.getElementById(id);
    const fullName = member => `${member.firstName} ${member.lastName}`;
    const formatTime12 = value => {
        if (!value) return '';
        const [h, m] = value.split(':').map(Number);
        return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
    };
    const formatDate = value => {
        if (!value) return '-';
        const [y, m, d] = value.split('-');
        return y && m && d ? `${d}/${m}/${y}` : value;
    };
    const setInvalid = (el, invalid) => el && el.classList.toggle('invalid', invalid);
    const clearInvalid = form => form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    const bindSingleWord = el => {
        el?.addEventListener('input', () => { el.value = el.value.replace(/\s/g, ''); });
        el?.addEventListener('keydown', e => { if (e.key === ' ') e.preventDefault(); });
    };
    const bindDigits = (el, max) => el?.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, max); });
    const today = () => new Date().toISOString().split('T')[0];

    window.StaffStore = {
        key: 'medbits_staff',
        getAll() {
            try {
                const raw = localStorage.getItem(this.key);
                if (raw) return JSON.parse(raw);
            } catch {}
            this.saveAll(DEFAULT_STAFF);
            return DEFAULT_STAFF;
        },
        saveAll(staff) { try { localStorage.setItem(this.key, JSON.stringify(staff)); } catch {} },
        getById(id) { return this.getAll().find(s => s.id === Number(id)) || null; },
        add(member) {
            const all = this.getAll();
            member.id = all.reduce((max, item) => Math.max(max, item.id), 0) + 1;
            all.push(member);
            this.saveAll(all);
        },
        update(id, updates) {
            const all = this.getAll();
            const index = all.findIndex(s => s.id === Number(id));
            if (index < 0) return false;
            all[index] = { ...all[index], ...updates };
            this.saveAll(all);
            return true;
        },
        delete(id) {
            const all = this.getAll();
            const filtered = all.filter(s => s.id !== Number(id));
            if (filtered.length === all.length) return false;
            this.saveAll(filtered);
            return true;
        },
        search(query) {
            const q = query.trim().toLowerCase();
            return !q ? this.getAll() : this.getAll().filter(s =>
                fullName(s).toLowerCase().includes(q) ||
                s.contact.includes(q) ||
                (s.languages || []).some(l => l.toLowerCase().includes(q))
            );
        },
        fullName,
        formatShift: member => `${formatTime12(member.shiftStart)} - ${formatTime12(member.shiftEnd)}`,
    };

    function showToast(message, type = 'success') {
        const existing = $('mb-toast');
        if (existing) existing.remove();
        const toast = Object.assign(document.createElement('div'), { id: 'mb-toast', textContent: message });
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: type === 'success' ? '#0f766e' : '#dc2626',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            zIndex: '9999',
            transition: 'opacity 0.4s',
        });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2800);
    }

    function showPage(name) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        $(`page-${name}`)?.classList.add('active');
        if (name === 'view') renderStaffTable(StaffStore.getAll());
        if (name === 'edit') initForm('edit');
        document.querySelector('.content').scrollTop = 0;
        lucide.createIcons();
    }

    function field(label, value) {
        return `<div class="info-group"><label>${label}</label><div class="info-value">${value || '-'}</div></div>`;
    }

    function renderStaffTable(members) {
        const tbody = $('staffTableBody');
        if (!tbody) return;
        tbody.innerHTML = members.length ? members.map(m => `
            <tr>
                <td class="staff-name">${StaffStore.fullName(m)}</td>
                <td>Counter ${m.counter}</td>
                <td>${(m.languages || []).join(', ') || '-'}</td>
                <td>${m.contact}</td>
                <td class="view-all">
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.35rem;">
                        <button class="delete-btn" onclick="deleteStaff(${m.id})">Delete</button>
                        <a href="javascript:void(0)" onclick="openViewAll(${m.id})">view all</a>
                    </div>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:2rem;">No staff members found.</td></tr>';
    }

    function renderViewAll(id) {
        const member = StaffStore.getById(id);
        if (!member) {
            $('profileTitle').textContent = 'Staff member not found';
            ['personalGrid', 'professionalGrid', 'availabilityGrid'].forEach(id => $(id).innerHTML = '');
            return;
        }
        $('profileTitle').textContent = `All Details of ${StaffStore.fullName(member)}`;
        $('personalGrid').innerHTML = [
            field('First Name', member.firstName),
            field('Last Name', member.lastName),
            field('Date of Birth', formatDate(member.dob)),
            field('E-Mail Id', member.email),
            field('Gender', member.gender),
            field('Contact No', member.contact),
        ].join('');
        $('professionalGrid').innerHTML = [
            field('Reporting Manager ID', member.reportingManagerId),
            field('Language Proficiency', (member.languages || []).length ? member.languages.map((l, i) => `Language ${i + 1}: ${l}`).join(' | ') : '-'),
            field('Date of Joining', formatDate(member.dateJoining)),
        ].join('');
        $('availabilityGrid').innerHTML = [
            field('Counter Number', `Counter ${member.counter}`),
            field('Current Shift', StaffStore.formatShift(member)),
        ].join('');
    }

    function buildLangBoxes(prefix, count, existing = []) {
        const boxes = $(`${prefix}_languageBoxes`);
        const hidden = $(`${prefix}_languageCountHidden`);
        boxes.innerHTML = '';
        hidden.value = count;
        for (let i = 1; i <= count; i += 1) {
            const input = Object.assign(document.createElement('input'), {
                type: 'text',
                name: `${prefix}_language_${i}`,
                placeholder: `Language ${i}`,
                className: 'language-box',
                value: existing[i - 1] || '',
            });
            bindSingleWord(input);
            boxes.appendChild(input);
        }
    }

    function collectLanguages(prefix) {
        const count = parseInt($(`${prefix}_languageCountHidden`).value, 10);
        const values = [];
        for (let i = 1; i <= count; i += 1) {
            const box = document.querySelector(`[name="${prefix}_language_${i}"]`);
            if (box) values.push(box.value.trim());
        }
        return { count, values };
    }

    function validateForm(prefix) {
        let valid = true;
        ['firstName', 'lastName', 'reportingManagerId'].forEach(name => {
            const el = $(`${prefix}_${name}`);
            const ok = !!el?.value.trim() && /^[A-Za-z0-9]+$/.test(el.value.trim());
            setInvalid(el, !ok);
            if (!ok) valid = false;
        });
        const checks = [
            ['dob', v => !!v],
            ['email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
            ['gender', v => !!v],
            ['contact', v => /^\d{10}$/.test(v.trim())],
            ['dateJoining', v => !!v],
            ['counter', v => v !== '' && parseInt(v, 10) >= 1],
        ];
        checks.forEach(([name, rule]) => {
            const el = $(`${prefix}_${name}`);
            const ok = !!el && rule(el.value);
            setInvalid(el, !ok);
            if (!ok) valid = false;
        });
        const countInput = $(`${prefix}_languageCount`);
        const count = parseInt($(`${prefix}_languageCountHidden`).value, 10);
        if (!count || count < 1 || count > 3) {
            setInvalid(countInput, true);
            valid = false;
        } else {
            setInvalid(countInput, false);
            for (let i = 1; i <= count; i += 1) {
                const box = document.querySelector(`[name="${prefix}_language_${i}"]`);
                const ok = !!box?.value.trim();
                setInvalid(box, !ok);
                if (!ok) valid = false;
            }
        }
        const start = $(`${prefix}_shiftStart`);
        const end = $(`${prefix}_shiftEnd`);
        const shiftOk = !!start?.value && !!end?.value && start.value < end.value;
        setInvalid(start, !shiftOk);
        setInvalid(end, !shiftOk);
        return valid && shiftOk;
    }

    function buildMember(prefix) {
        const { count, values } = collectLanguages(prefix);
        return {
            firstName: $(`${prefix}_firstName`).value.trim(),
            lastName: $(`${prefix}_lastName`).value.trim(),
            dob: $(`${prefix}_dob`).value,
            email: $(`${prefix}_email`).value.trim(),
            gender: $(`${prefix}_gender`).value,
            contact: $(`${prefix}_contact`).value.trim(),
            reportingManagerId: $(`${prefix}_reportingManagerId`).value.trim(),
            languageCount: count,
            languages: values,
            dateJoining: $(`${prefix}_dateJoining`).value,
            counter: $(`${prefix}_counter`).value.trim(),
            shiftStart: $(`${prefix}_shiftStart`).value,
            shiftEnd: $(`${prefix}_shiftEnd`).value,
        };
    }

    function populateEditForm(member) {
        ['firstName', 'lastName', 'dob', 'email', 'gender', 'contact', 'reportingManagerId', 'dateJoining', 'counter', 'shiftStart', 'shiftEnd'].forEach(name => {
            $(`edit_${name}`).value = member[name] || '';
        });
        const count = member.languageCount || (member.languages || []).length || 1;
        $('edit_languageCount').value = count;
        buildLangBoxes('edit', count, member.languages || []);
        editCurrentStaffId = member.id;
    }

    function removeDropdown() {
        $('mb-dropdown')?.remove();
    }

    function buildDropdown(members) {
        removeDropdown();
        if (!members.length) return;
        const searchBox = $('editSearchInput').closest('.search-box');
        searchBox.style.position = 'relative';
        const dropdown = Object.assign(document.createElement('ul'), { id: 'mb-dropdown' });
        Object.assign(dropdown.style, {
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: '0',
            right: '0',
            background: 'white',
            border: '2px solid #000',
            borderRadius: '0.5rem',
            listStyle: 'none',
            margin: '0',
            padding: '0.25rem 0',
            zIndex: '100',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: '200px',
            overflowY: 'auto',
        });
        members.forEach(member => {
            const li = Object.assign(document.createElement('li'), { textContent: StaffStore.fullName(member) });
            Object.assign(li.style, {
                padding: '0.65rem 1rem',
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#000',
                borderBottom: '1px solid #f3f4f6',
            });
            li.addEventListener('mouseenter', () => { li.style.background = '#f0fdfb'; });
            li.addEventListener('mouseleave', () => { li.style.background = 'white'; });
            li.addEventListener('mousedown', event => {
                event.preventDefault();
                populateEditForm(member);
                $('editSearchInput').value = StaffStore.fullName(member);
                removeDropdown();
                showToast(`Loaded profile of ${StaffStore.fullName(member)}`);
            });
            dropdown.appendChild(li);
        });
        searchBox.appendChild(dropdown);
    }

    function initForm(type) {
        if (formState[type]) return;
        formState[type] = true;
        const prefix = type === 'add' ? 'add' : 'edit';
        const form = $(`${type === 'add' ? 'addStaffForm' : 'editStaffForm'}`);
        $(`${prefix}_dob`).max = today();
        $(`${prefix}_dateJoining`).max = today();
        [`${prefix}_firstName`, `${prefix}_lastName`, `${prefix}_reportingManagerId`].forEach(id => bindSingleWord($(id)));
        bindDigits($(`${prefix}_contact`), 10);

        $(`${prefix}_generateLangBtn`).addEventListener('click', () => {
            const count = parseInt($(`${prefix}_languageCount`).value, 10);
            if (!count || count < 1 || count > 3) {
                $(`${prefix}_languageCount`).classList.add('invalid');
                return showToast('Enter a number between 1 and 3.', 'error');
            }
            $(`${prefix}_languageCount`).classList.remove('invalid');
            buildLangBoxes(prefix, count);
        });

        if (type === 'edit') {
            const search = $('editSearchInput');
            search.addEventListener('input', () => {
                const q = search.value.trim();
                if (!q) return removeDropdown();
                buildDropdown(StaffStore.search(q));
            });
            search.addEventListener('blur', () => setTimeout(removeDropdown, 150));
        }

        form.addEventListener('submit', event => {
            event.preventDefault();
            clearInvalid(form);
            if (type === 'edit' && !editCurrentStaffId) {
                showToast('Please search and select a staff member first.', 'error');
                return $('editSearchInput').focus();
            }
            if (!validateForm(prefix)) return showToast('Please fix the highlighted fields.', 'error');
            const payload = buildMember(prefix);
            if (type === 'add') {
                StaffStore.add(payload);
                form.reset();
                $(`${prefix}_languageBoxes`).innerHTML = '';
                $(`${prefix}_languageCountHidden`).value = '';
                showToast('Staff profile added successfully!');
            } else if (StaffStore.update(editCurrentStaffId, payload)) {
                showToast('Staff profile updated successfully!');
            } else {
                return showToast('Update failed. Staff not found.', 'error');
            }
            setTimeout(() => showPage('view'), 1500);
        });

        $(`${prefix === 'add' ? 'add' : 'edit'}_cancelBtn`)?.addEventListener('click', () => {
            if (confirm('Discard changes and go back?')) showPage('view');
        });
    }

    function initViewPage() {
        renderStaffTable(StaffStore.getAll());
        const search = $('viewSearchInput');
        if (!search || search.dataset.bound) return;
        search.dataset.bound = 'true';
        search.addEventListener('input', () => renderStaffTable(StaffStore.search(search.value)));
    }

    window.showPage = showPage;
    window.goEditFromView = function () {
        showPage('edit');
        const member = currentViewAllId ? StaffStore.getById(currentViewAllId) : null;
        if (member) {
            populateEditForm(member);
            $('editSearchInput').value = StaffStore.fullName(member);
        }
    };
    window.openViewAll = function (id) {
        currentViewAllId = id;
        renderViewAll(id);
        showPage('viewall');
    };
    window.deleteStaff = function (id) {
        const member = StaffStore.getById(id);
        if (!member || !confirm(`Delete ${StaffStore.fullName(member)}? This cannot be undone.`)) return;
        StaffStore.delete(id);
        showToast(`${StaffStore.fullName(member)} deleted successfully.`);
        renderStaffTable(StaffStore.getAll());
    };
    window.formatTime12 = formatTime12;

    document.addEventListener('DOMContentLoaded', () => {
        initViewPage();
        initForm('add');
        $('add_dob').max = today();
        $('add_dateJoining').max = today();
        lucide.createIcons();
    });
})();
