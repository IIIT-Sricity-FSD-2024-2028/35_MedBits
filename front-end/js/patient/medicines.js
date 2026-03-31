/* MEDBITS – medicines.js
   Pure logic. All HTML lives in medicines.html <template> tags.
*/

// Icon for each medicine category (used in product cards)
const MED_ICONS = {
  'Pain Relief':      '🩹',
  'Diabetes Care':    '🩺',
  'Cardiac Care':     '🫀',
  'Stomach Care':     '🫃',
  'Oral Care':        '🦷',
  'Respiratory':      '🌬️',
  'Sexual Health':    '💊',
  'Cold and Immunity':'🛡️',
  'Liver Care':       '🔬',
  'Elderly Care':     '🧓'
};

// ── CLONE a <template> by id ──────────────────────────────────────
function useTemplate(id) {
  return document.getElementById(id).content.cloneNode(true);
}

// ── PAGE INIT ─────────────────────────────────────────────────────

function renderMedicines() {
  updateCartBar();
  renderMedOrders();
  showMedCategory('Pain Relief');
}

// ── CATEGORY / SEARCH ─────────────────────────────────────────────

function showMedCategory(cat) {
  setText('medCategoryTitle', cat);
  renderMedProducts(DB.medicines.filter(m => m.category === cat));
}

function showAllMeds() {
  setText('medCategoryTitle', 'All Medicines');
  renderMedProducts(DB.medicines);
}

function searchMedicines(q) {
  const results = q
    ? DB.medicines.filter(m => m.name.toLowerCase().includes(q.toLowerCase()))
    : DB.medicines.filter(m => m.category === 'Pain Relief');
  setText('medCategoryTitle', q ? 'Results for "' + q + '"' : 'Pain Relief');
  renderMedProducts(results);
}

// ── PRODUCT CARDS ─────────────────────────────────────────────────

function renderMedProducts(meds) {
  const grid = document.getElementById('medProductGrid');
  grid.innerHTML = '';

  if (!meds.length) {
    const msg = document.createElement('p'); msg.className = 'text-muted'; msg.textContent = 'No medicines in this category.'; grid.appendChild(msg);
    return;
  }

  meds.forEach(m => {
    const frag = useTemplate('tpl-med-card');
    const card = frag.querySelector('.product-card');

    card.querySelector('.med-icon').textContent  = MED_ICONS[m.category] || '💊';
    card.querySelector('.med-name').textContent  = m.name;
    card.querySelector('.med-qty').textContent   = m.qty;
    card.querySelector('.med-price').textContent = '₹ ' + m.price.toFixed(2);

    const btn = card.querySelector('.med-btn');
    if (m.inCart) {
      btn.textContent  = 'Remove';
      btn.className    = 'btn-remove';
    } else {
      btn.textContent  = 'Add';
      btn.className    = 'btn-add';
    }
    btn.onclick = function() { toggleMedCart(m.id); };

    grid.appendChild(frag);
  });
}

function toggleMedCart(id) {
  const m = DB.medicines.find(x => x.id === id);
  m.inCart = !m.inCart;
  updateCartBar();
  showMedCategory(m.category);
}

// ── CART BAR ─────────────────────────────────────────────────────

function updateCartBar() {
  const items = DB.medicines.filter(m => m.inCart);
  const total = items.reduce((sum, m) => sum + m.price, 0);
  const bar   = document.getElementById('medCartBar');
  if (!bar) return;
  bar.classList.toggle('hidden', items.length === 0);
  setText('cartTotal', '₹ ' + total.toFixed(2));
  setText('cartCount', '(' + items.length + ' item' + (items.length !== 1 ? 's' : '') + ')');
}

function showCartInline() {
  const items = DB.medicines.filter(m => m.inCart);
  const total = items.reduce((sum, m) => sum + m.price, 0);
  const sec   = document.getElementById('cartCheckoutSection');
  const listEl = document.getElementById('cartItemsInline');

  listEl.innerHTML = '';
  items.forEach(m => {
    const frag = useTemplate('tpl-cart-item');
    frag.querySelector('.cart-item-name').textContent  = m.name;
    frag.querySelector('.cart-item-qty').textContent   = m.qty;
    frag.querySelector('.cart-item-price').textContent = '₹ ' + m.price.toFixed(2);
    listEl.appendChild(frag);
  });

  setText('cartInlineTotal', '₹ ' + total.toFixed(2));
  sec.style.display = 'block';
  sec.scrollIntoView({ behavior: 'smooth' });
}

function hideCart() {
  document.getElementById('cartCheckoutSection').style.display = 'none';
}

function placeOrder() {
  const items = DB.medicines.filter(m => m.inCart);
  if (!items.length) { showToast('Your cart is empty', 'error'); return; }

  const total = items.reduce((sum, m) => sum + m.price, 0);
  DB.medicineOrders.unshift({
    id:     'ORD' + Date.now().toString().slice(-6),
    date:   new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }),
    total:  Math.round(total),
    status: 'Processing',
    items:  items.map(m => m.name)
  });

  DB.medicines.forEach(m => m.inCart = false);
  hideCart();
  showToast('Order placed!', 'success');
  renderMedicines();
}

// ── ORDER HISTORY ─────────────────────────────────────────────────

function renderMedOrders() {
  const el = document.getElementById('medOrderList');
  if (!el) return;
  el.innerHTML = '';

  if (!DB.medicineOrders.length) {
    const empty = document.createElement('div'); empty.className = 'empty-state';
    const icon = document.createElement('div'); icon.className = 'empty-icon'; icon.textContent = '📦';
    const msg  = document.createElement('p');  msg.textContent = 'No orders yet';
    empty.appendChild(icon); empty.appendChild(msg); el.appendChild(empty);
    return;
  }

  DB.medicineOrders.forEach(o => {
    const frag = useTemplate('tpl-order-row');
    const row  = frag.querySelector('.order-item');

    row.querySelector('.order-id').textContent    = 'Order #' + o.id;
    row.querySelector('.order-info').textContent  = o.date + ' · ₹' + o.total;
    row.querySelector('.order-status').textContent = o.status;
    row.querySelector('.order-view').onclick   = function() { viewMedOrder(o.id); };
    row.querySelector('.order-delete').onclick = function() { deleteMedOrder(o.id); };

    el.appendChild(frag);
  });
}

function openAddMedOrder() {
  openModal(document.getElementById('tpl-addOrder').innerHTML);
}

function addMedOrder() {
  const id   = val('no-id').trim();
  const date = val('no-date').trim();
  if (!id || !date) { showToast('Fill all fields', 'error'); return; }
  DB.medicineOrders.unshift({ id, date, total: +val('no-total'), status: val('no-status'), items: [] });
  closeModal();
  showToast('Order added!', 'success');
  renderMedOrders();
}

function viewMedOrder(id) {
  const o = DB.medicineOrders.find(x => x.id === id);
  currentEditId = id;
  // Pre-fill the template fields before injecting into modal
  const tpl    = document.getElementById('tpl-viewOrder');
  const clone  = tpl.content.cloneNode(true);
  clone.querySelector('#vo-date').value   = o.date;
  clone.querySelector('#vo-total').value  = o.total;
  clone.querySelector('#vo-status').value = o.status;
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = '';
  modalContent.appendChild(clone);
  document.getElementById('modalOverlay').classList.add('open');
}

function updateMedOrder() {
  const o = DB.medicineOrders.find(x => x.id === currentEditId);
  o.date   = val('vo-date');
  o.total  = +val('vo-total');
  o.status = val('vo-status');
  closeModal();
  showToast('Order updated!', 'success');
  renderMedOrders();
}

function deleteMedOrder(id) {
  if (!confirm('Delete this order?')) return;
  DB.medicineOrders = DB.medicineOrders.filter(x => x.id !== id);
  showToast('Order deleted', 'info');
  renderMedOrders();
}
