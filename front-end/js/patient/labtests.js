/* MEDBITS – labtests.js
   Pure logic. All HTML lives in labtests.html <template> tags.
*/

// ── HELPER ───────────────────────────────────────────────────────
function useTemplate(id) {
  return document.getElementById(id).content.cloneNode(true);
}

// ── PAGE INIT ─────────────────────────────────────────────────────

function renderLabTests() {
  updateLabCartBar();
  showLabCategory('Full Body Check Up');
  renderTopTests();
  renderLabOrders();
}

// ── CATEGORY / SEARCH ─────────────────────────────────────────────

function showLabCategory(cat) {
  const tests = DB.labTests.filter(t => t.category === cat);
  setText('labCategoryTitle', cat + ' (' + tests.length + ')');
  renderLabProducts(tests);
}

function showAllLab() {
  setText('labCategoryTitle', 'All Tests (' + DB.labTests.length + ')');
  renderLabProducts(DB.labTests);
}

function searchLabTests(q) {
  if (!q) { showLabCategory('Full Body Check Up'); return; }
  const results = DB.labTests.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  setText('labCategoryTitle', 'Results for "' + q + '"');
  renderLabProducts(results);
}

// ── PRODUCT CARDS ─────────────────────────────────────────────────

function renderLabProducts(tests) {
  fillLabGrid(document.getElementById('labProductGrid'), tests);
}

function renderTopTests() {
  fillLabGrid(document.getElementById('topLabGrid'), DB.labTests.slice(0, 4));
}

// Fill any product grid element with lab test cards
function fillLabGrid(grid, tests) {
  if (!grid) return;
  grid.innerHTML = '';

  if (!tests.length) {
    const msg = document.createElement('p'); msg.className = 'text-muted'; msg.textContent = 'No tests in this category.'; grid.appendChild(msg);
    return;
  }

  tests.forEach(t => {
    const frag = useTemplate('tpl-lab-card');
    const card = frag.querySelector('.product-card');

    card.querySelector('.lab-name').textContent  = t.name;
    card.querySelector('.lab-price').textContent = '₹ ' + t.price;

    // Show "N tests included" if available, else hide
    const subEl = card.querySelector('.lab-tests');
    if (t.tests) { subEl.textContent = t.tests + ' tests included'; }
    else         { subEl.remove(); }

    const btn = card.querySelector('.lab-btn');
    if (t.inCart) {
      btn.textContent = 'Remove';
      btn.className   = 'btn-remove';
    }
    btn.onclick = function() { toggleLabCart(t.id); };

    grid.appendChild(frag);
  });
}

function toggleLabCart(id) {
  const t = DB.labTests.find(x => x.id === id);
  t.inCart = !t.inCart;
  updateLabCartBar();
  showLabCategory(t.category);
  renderTopTests();
}

// ── CART BAR ─────────────────────────────────────────────────────

function updateLabCartBar() {
  const items = DB.labTests.filter(t => t.inCart);
  const total = items.reduce((sum, t) => sum + t.price, 0);
  const bar   = document.getElementById('labCartBar');
  if (!bar) return;
  bar.classList.toggle('hidden', items.length === 0);
  setText('labCartTotal', '₹ ' + total.toFixed(2));
  setText('labCartCount', '(' + items.length + ' item' + (items.length !== 1 ? 's' : '') + ')');
}

function checkoutLab() {
  const items = DB.labTests.filter(t => t.inCart);
  const total = items.reduce((sum, t) => sum + t.price, 0);

  // Clone the cart modal template
  const tpl   = document.getElementById('tpl-labCart');
  const clone = tpl.content.cloneNode(true);

  // Fill cart items inside the cloned template
  const itemsEl = clone.querySelector('#labCartItems');
  items.forEach(t => {
    const row = useTemplate('tpl-lab-cart-item');
    row.querySelector('.lab-ci-name').textContent  = t.name;
    row.querySelector('.lab-ci-cat').textContent   = t.category;
    row.querySelector('.lab-ci-price').textContent = '₹' + t.price;
    itemsEl.appendChild(row);
  });

  clone.querySelector('#labCartModalTotal').textContent = '₹ ' + total.toFixed(2);

  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = '';
  modalContent.appendChild(clone);
  document.getElementById('modalOverlay').classList.add('open');
}

function placeLabOrder() {
  DB.labTests.filter(t => t.inCart).forEach(t => {
    DB.labOrders.unshift({ id: 'LBORD' + Date.now(), test: t.name, date: today(), status: 'pending' });
    t.inCart = false;
  });
  closeModal();
  showToast('Lab tests booked!', 'success');
  renderLabTests();
}

// ── LAB ORDERS ────────────────────────────────────────────────────

function renderLabOrders() {
  const el = document.getElementById('labOrderList');
  if (!el) return;
  el.innerHTML = '';

  if (!DB.labOrders.length) {
    const msg = document.createElement('p'); msg.className = 'text-muted'; msg.textContent = 'No lab orders yet.'; el.appendChild(msg);
    return;
  }

  DB.labOrders.forEach(o => {
    const frag = useTemplate('tpl-lab-order-row');
    const row  = frag.querySelector('.order-item');

    row.querySelector('.lab-order-test').textContent = o.test;
    row.querySelector('.lab-order-date').textContent = formatDate(o.date);

    const badge = row.querySelector('.lab-order-badge');
    if (o.status === 'completed') {
      badge.textContent = 'Completed';
      badge.classList.add('badge-green');
    } else {
      badge.textContent = 'Pending';
      badge.classList.add('badge-orange');
    }

    row.querySelector('.lab-order-delete').onclick = function() { deleteLabOrder(o.id); };
    el.appendChild(frag);
  });
}

function openAddLabTest() {
  openModal(document.getElementById('tpl-addLabTest').innerHTML);
}

function addLabTest() {
  const name = val('alt-name').trim();
  if (!name) { showToast('Enter test name', 'error'); return; }
  DB.labTests.push({
    id: 'LAB' + Date.now(), name,
    category: val('alt-cat'),
    price:    +val('alt-price'),
    tests:    +val('alt-tests') || null,
    inCart:   false
  });
  closeModal();
  showToast('Lab test added!', 'success');
  renderLabTests();
}

function deleteLabOrder(id) {
  if (!confirm('Delete this order?')) return;
  DB.labOrders = DB.labOrders.filter(x => x.id !== id);
  showToast('Order deleted', 'info');
  renderLabOrders();
}
