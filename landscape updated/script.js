'use strict';

// ════════════════════════════════════════════════════════════
//  AUTH SYSTEM — Login, Roles, User Management
// ════════════════════════════════════════════════════════════

// ── USER ACCOUNTS ────────────────────────────────────────────
let users = [
  { id: 1, fullName: 'Store Owner',   username: 'admin', password: 'owner123',  role: 'owner' },
  { id: 2, fullName: 'Staff Member',  username: 'staff', password: 'emp123',    role: 'employee' },
];
let nextUserId  = 3;
let currentUser = null;   // Set after login
let editingUserId = null;

// ── ROLE PERMISSIONS ─────────────────────────────────────────
const PERMISSIONS = {
  owner:    ['sales','receipts','items','inventory','users','settings','refund','addProduct','deleteProduct','editInventory'],
  employee: ['sales','receipts','inventory'],
};

function can(action) {
  if (!currentUser) return false;
  return PERMISSIONS[currentUser.role]?.includes(action) ?? false;
}

// ── LOGIN LOGIC ──────────────────────────────────────────────
let selectedLoginRole = 'owner';

document.querySelectorAll('.role-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLoginRole = btn.dataset.role;
    document.getElementById('login-role-icon').textContent = selectedLoginRole === 'owner' ? '👑' : '👤';
    document.getElementById('login-role-text').textContent = `Logging in as ${selectedLoginRole === 'owner' ? 'Owner' : 'Employee'}`;
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').style.display = 'none';
  };
});

// Toggle password visibility
document.getElementById('login-eye').onclick = () => {
  const inp = document.getElementById('login-password');
  const btn = document.getElementById('login-eye');
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
  else                         { inp.type = 'password'; btn.textContent = '👁';  }
};

// Allow Enter key in login fields
['login-username','login-password'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptLogin();
  });
});

document.getElementById('login-btn').onclick = attemptLogin;

function attemptLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl  = document.getElementById('login-error');

  // Animate button
  const btn = document.getElementById('login-btn');
  btn.classList.add('loading');
  document.getElementById('login-btn-text').textContent = 'Signing in…';

  setTimeout(() => {
    btn.classList.remove('loading');
    document.getElementById('login-btn-text').textContent = 'Sign In →';

    const user = users.find(u =>
      u.username === username &&
      u.password === password &&
      u.role     === selectedLoginRole
    );

    if (user) {
      errorEl.style.display = 'none';
      doLogin(user);
    } else {
      errorEl.style.display = '';
      // Reset error animation
      errorEl.style.animation = 'none';
      void errorEl.offsetWidth;
      errorEl.style.animation = '';
    }
  }, 600);
}

function doLogin(user) {
  currentUser = user;

  // Hide login, show app
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.animation = 'fadeOut 0.35s ease forwards';
  setTimeout(() => {
    loginScreen.style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    applyRoleUI();
    // Init POS
    renderProducts();
    renderCart();
    renderInvHistory();
  }, 340);
}

function applyRoleUI() {
  const isOwner = currentUser.role === 'owner';

  // Update top bar
  document.getElementById('top-owner-label').textContent =
    (isOwner ? '👑 ' : '👤 ') + currentUser.fullName;

  // Hide owner-only nav items for employees
  document.querySelectorAll('.snav-btn.owner-only').forEach(btn => {
    btn.classList.toggle('hidden', !isOwner);
  });

  // Mark items/settings nav as owner-only
  document.querySelectorAll('.snav-btn').forEach(btn => {
    const s = btn.dataset.screen;
    if (s === 'items' || s === 'settings') btn.classList.toggle('owner-only', true);
    if (!isOwner && (s === 'items' || s === 'settings')) btn.classList.add('hidden');
  });
}

// ── LOGOUT ───────────────────────────────────────────────────
function logoutCurrentUser() {
  if (!confirm('Are you sure you want to log out?')) return;
  currentUser = null;
  // Reset login form
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.role-btn[data-role="owner"]').classList.add('active');
  selectedLoginRole = 'owner';
  document.getElementById('login-role-icon').textContent = '👑';
  document.getElementById('login-role-text').textContent = 'Logging in as Owner';
  // Show login, hide app
  document.getElementById('app').style.display = 'none';
  const loginScreen = document.getElementById('login-screen');
  loginScreen.style.display = 'flex';
  loginScreen.style.animation = 'cardIn 0.4s ease';
}
document.getElementById('top-logout').onclick = logoutCurrentUser;

// ── ACCESS DENIED ─────────────────────────────────────────────
document.getElementById('access-denied-ok').onclick = () => {
  document.getElementById('access-denied').classList.remove('show');
};

function showAccessDenied() {
  document.getElementById('access-denied').classList.add('show');
}

// Fade out animation for login
const styleTag = document.createElement('style');
styleTag.textContent = `@keyframes fadeOut { to { opacity:0; transform:scale(1.04); } }`;
document.head.appendChild(styleTag);

// ── USER MANAGEMENT ───────────────────────────────────────────
function renderUsers() {
  const list = document.getElementById('users-list');
  list.innerHTML = '';
  users.forEach(u => {
    const row = document.createElement('div');
    row.className = 'user-row';
    row.innerHTML = `
      <div class="user-avatar ${u.role}">${u.role === 'owner' ? '👑' : '👤'}</div>
      <div class="user-row-info">
        <div class="user-row-name">${u.fullName}</div>
        <div class="user-row-username">@${u.username}</div>
        <span class="user-role-badge ${u.role === 'owner' ? 'badge-owner' : 'badge-employee'}">
          ${u.role === 'owner' ? '👑 Owner' : '👤 Employee'}
        </span>
      </div>
      <button class="btn-edit-user" data-uid="${u.id}">✏ Edit</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('.btn-edit-user').forEach(btn => {
    btn.onclick = () => openUserEditModal(+btn.dataset.uid);
  });
}

document.getElementById('btn-add-user').onclick = () => {
  editingUserId = null;
  document.getElementById('user-modal-title').textContent = 'Add User';
  document.getElementById('u-fullname').value  = '';
  document.getElementById('u-username').value  = '';
  document.getElementById('u-password').value  = '';
  document.getElementById('u-role').value      = 'employee';
  document.getElementById('u-delete-btn').style.display = 'none';
  openModal('user-modal');
  setTimeout(() => document.getElementById('u-fullname').focus(), 150);
};

function openUserEditModal(uid) {
  editingUserId = uid;
  const u = users.find(x => x.id === uid);
  document.getElementById('user-modal-title').textContent = 'Edit User';
  document.getElementById('u-fullname').value  = u.fullName;
  document.getElementById('u-username').value  = u.username;
  document.getElementById('u-password').value  = u.password;
  document.getElementById('u-role').value      = u.role;
  // Prevent deleting yourself
  document.getElementById('u-delete-btn').style.display = (u.id === currentUser.id) ? 'none' : '';
  openModal('user-modal');
}

document.getElementById('user-modal-close').onclick = () => closeModal('user-modal');
document.getElementById('u-cancel-btn').onclick     = () => closeModal('user-modal');

document.getElementById('u-save-btn').onclick = () => {
  const fullName = document.getElementById('u-fullname').value.trim();
  const username = document.getElementById('u-username').value.trim();
  const password = document.getElementById('u-password').value.trim();
  const role     = document.getElementById('u-role').value;

  if (!fullName || !username || !password) { showToast('⚠ All fields are required'); return; }

  if (editingUserId === null) {
    if (users.find(u => u.username === username)) { showToast('⚠ Username already taken'); return; }
    users.push({ id: nextUserId++, fullName, username, password, role });
    showToast('✅ User added!');
  } else {
    const dup = users.find(u => u.username === username && u.id !== editingUserId);
    if (dup) { showToast('⚠ Username already taken'); return; }
    users = users.map(u => u.id === editingUserId ? { ...u, fullName, username, password, role } : u);
    // Update current user display if editing self
    if (currentUser.id === editingUserId) {
      currentUser = { ...currentUser, fullName, username, password, role };
      applyRoleUI();
    }
    showToast('✏ User updated!');
  }
  closeModal('user-modal');
  renderUsers();
};

document.getElementById('u-delete-btn').onclick = () => {
  const u = users.find(x => x.id === editingUserId);
  if (!u || !confirm(`Delete user "${u.fullName}"?`)) return;
  users = users.filter(x => x.id !== editingUserId);
  closeModal('user-modal');
  renderUsers();
  showToast('🗑 User deleted');
};


// ── DATA ──────────────────────────────────────────────────────
let products = [
  { id: 1,  name: '212 VIP Black 85ML',       price: 150, gender: 'male' },
  { id: 2,  name: 'Acqua Di Gio 85ML',        price: 150, gender: 'male' },
  { id: 3,  name: 'Baccarat Rouge 540 85ML',  price: 150, gender: 'female' },
  { id: 4,  name: 'Bombshell 85ML',           price: 150, gender: 'female' },
  { id: 5,  name: 'Burberry Blush 85ML',      price: 150, gender: 'female' },
  { id: 6,  name: 'Bvlgari Amethyste 85ML',   price: 150, gender: 'female' },
  { id: 7,  name: 'Bvlgari Extreme 85ML',     price: 150, gender: 'male' },
  { id: 8,  name: 'CK One 85ML',              price: 150, gender: 'male' },
  { id: 9,  name: 'Cloud Ariana Grande 85ML', price: 150, gender: 'female' },
  { id: 10, name: 'Cool Water 85ML',          price: 150, gender: 'male' },
  { id: 11, name: 'D&G Light Blue 85ML',      price: 150, gender: 'male' },
  { id: 12, name: "Eclat D'Aperge 85ML",      price: 150, gender: 'female' },
  { id: 13, name: 'Ferrari Black 85ML',       price: 150, gender: 'male' },
  { id: 14, name: 'French Riviera 85ML',      price: 150, gender: 'female' },
  { id: 15, name: 'Good Girl 85ML',           price: 150, gender: 'female' },
  { id: 16, name: 'Hugo Boss 85ML',           price: 150, gender: 'male' },
  { id: 17, name: 'Incanto Shine 85ML',       price: 150, gender: 'female' },
  { id: 18, name: 'Lacoste Black 85ML',       price: 150, gender: 'male' },
  { id: 19, name: 'Lacoste Red 85ML',         price: 150, gender: 'male' },
  { id: 20, name: 'Meow Katy Perry 85ML',     price: 150, gender: 'female' },
  { id: 21, name: 'Montblanc 85ML',           price: 150, gender: 'male' },
  { id: 22, name: 'Polo Blue 85ML',           price: 150, gender: 'male' },
  { id: 23, name: 'Polo Sport 85ML',          price: 150, gender: 'male' },
  { id: 24, name: 'Ralph Lauren 85ML',        price: 150, gender: 'female' },
  { id: 25, name: 'Sauvage Dior 85ML',        price: 150, gender: 'male' },
  { id: 26, name: 'Valaya 85ML',              price: 150, gender: 'female' },
  { id: 27, name: 'Miss Dior 85ML',           price: 150, gender: 'female' },
  { id: 28, name: 'Chanel No.5 85ML',         price: 150, gender: 'female' },
  { id: 29, name: 'Bleu de Chanel 85ML',      price: 150, gender: 'male' },
  { id: 30, name: 'Versace Eros 85ML',        price: 150, gender: 'male' },
];

let receipts = [
  { id: '#1-0004', date: '2025-11-29', time: '7:00 PM', total: 150, items: [{ name: '[R] Valaya 85ML', qty: 1, price: 150 }], payment: 'Cash', pos: 'POS 1', refunded: false },
  { id: '#1-0003', date: '2025-11-23', time: '5:46 AM', total: 150, items: [{ name: '[R] CK One 85ML', qty: 1, price: 150 }], payment: 'Cash', pos: 'POS 1', refunded: false },
  { id: '#2-0001', date: '2025-11-17', time: '7:23 PM', total: 150, items: [{ name: '[R] Valaya 85ML', qty: 1, price: 150 }], payment: 'Cash', pos: 'POS 2', refunded: false },
  { id: '#1-0002', date: '2025-11-15', time: '10:51 PM', total: 150, items: [{ name: '[R] Sauvage Dior 85ML', qty: 1, price: 150 }], payment: 'Cash', pos: 'POS 1', refundOf: '#1-0001' },
  { id: '#1-0001', date: '2025-11-15', time: '10:50 PM', total: 150, items: [{ name: '[R] Sauvage Dior 85ML', qty: 1, price: 150 }], payment: 'Cash', pos: 'POS 1', refunded: true },
];

let cart            = [];
let currentScreen   = 'sales';
let selectedReceipt = null;
let editingProductId = null;
let activePayment   = 'Cash';
let activeGenderFilter = 'all';
let activeHistoryFilter = 'all';
let currentPage     = 0;
const ITEMS_PER_PAGE = 24;  // 5 cols × 4 rows in landscape
let receiptCounter  = { pos2: 1 };
let nextProductId   = 31;

// ── HELPERS ──────────────────────────────────────────────────
const php = n => '₱' + parseFloat(n).toFixed(2);
const $   = id => document.getElementById(id);
const el  = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
function pad(n, len = 4) { return String(n).padStart(len, '0'); }
function formatDateLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function nowDate() { return new Date().toISOString().split('T')[0]; }
function nowTime() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

// ── CLOCK ────────────────────────────────────────────────────
function updateClock() {
  $('clock').innerHTML = new Date().toLocaleString('en-PH', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}
updateClock();
setInterval(updateClock, 1000);

// ── SCREEN NAV ───────────────────────────────────────────────
function switchScreen(name) {
  if (!name) return;

  // Permission check
  const restricted = { items: 'addProduct', settings: 'settings', users: 'users' };
  if (restricted[name] && !can(restricted[name])) {
    showAccessDenied();
    return;
  }

  currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const t = $('screen-' + name);
  if (t) t.classList.add('active');
  document.querySelectorAll('.snav-btn').forEach(b => b.classList.toggle('active', b.dataset.screen === name));
  const titles = { sales: 'Sales', receipts: 'Receipts', items: 'Items', inventory: 'Inventory', users: 'User Management', history: 'History', settings: 'Settings' };
  $('screen-title').textContent = titles[name] || name;
  if (name === 'sales')     renderProducts();
  if (name === 'receipts')  renderReceipts();
  if (name === 'items')     renderItems();
  if (name === 'inventory') { renderInvTable(); renderInvHistory(); }
  if (name === 'users')     renderUsers();
  if (name === 'history')   renderHistory();
}

document.querySelectorAll('.snav-btn').forEach(btn => {
  btn.onclick = () => switchScreen(btn.dataset.screen);
});

$('search-toggle').onclick = () => {
  if (currentScreen === 'sales')    $('product-search').focus();
  if (currentScreen === 'receipts') $('receipt-search').focus();
  if (currentScreen === 'inventory') $('inv-search').focus();
  if (currentScreen === 'history')  $('hist-search').focus();
};

// ── CART ─────────────────────────────────────────────────────
function cartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

function addToCart(p) {
  const ex = cart.find(i => i.id === p.id);
  if (ex) ex.qty++;
  else cart.push({ ...p, qty: 1 });
  renderCart();
  renderProducts();
}
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  renderCart();
  renderProducts();
}
function clearCart() { cart = []; renderCart(); renderProducts(); }

function renderCart() {
  const total = cartTotal();
  $('ticket-count').textContent = cart.length;
  $('ticket-total').textContent = php(total);
  $('btn-charge').disabled = total === 0;

  const empty    = $('cart-empty');
  const itemsEl  = $('cart-items');
  const btnClear = $('btn-clear');

  if (cart.length === 0) {
    empty.style.display = '';
    itemsEl.innerHTML   = '';
    btnClear.style.display = 'none';
    return;
  }
  empty.style.display    = 'none';
  btnClear.style.display = '';
  itemsEl.innerHTML = '';

  cart.forEach(item => {
    const row = el('div', 'cart-item');
    row.innerHTML = `
      <span class="cart-item-name">${item.name}</span>
      <div class="cart-qty-controls">
        <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
      </div>
      <span class="cart-item-price">${php(item.price * item.qty)}</span>`;
    itemsEl.appendChild(row);
  });
  itemsEl.querySelectorAll('.qty-minus').forEach(b => b.onclick = () => changeQty(+b.dataset.id, -1));
  itemsEl.querySelectorAll('.qty-plus').forEach(b  => b.onclick = () => changeQty(+b.dataset.id, +1));
}

$('btn-clear').onclick = clearCart;

// ── PRODUCTS ─────────────────────────────────────────────────
function getFilteredProducts() {
  const q = ($('product-search').value || '').toLowerCase();
  const g = activeGenderFilter;
  return products.filter(p =>
    p.name.toLowerCase().includes(q) && (g === 'all' || p.gender === g)
  );
}

function renderProducts() {
  const filtered   = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  if (currentPage < 0)           currentPage = 0;

  const pageItems = filtered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const grid = $('product-grid');
  grid.innerHTML = '';

  if (pageItems.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#aaa">No products found</div>';
  } else {
    pageItems.forEach(p => {
      const inCart = cart.find(i => i.id === p.id);
      const btn = el('button', 'product-btn' + (p.gender === 'female' ? ' female' : ''));
      btn.innerHTML = `[R] ${p.name}` + (inCart ? `<span class="product-badge">${inCart.qty}</span>` : '');
      btn.title   = php(p.price);
      btn.onclick = () => addToCart(p);
      grid.appendChild(btn);
    });
  }

  $('btn-prev-page').disabled = currentPage === 0;
  $('btn-next-page').disabled = currentPage >= totalPages - 1;
  const ind = $('page-indicators');
  ind.innerHTML = '';
  for (let i = 0; i < totalPages; i++) {
    const dot = el('button', 'page-dot' + (i === currentPage ? ' active' : ''), String(i + 1));
    dot.onclick = () => { currentPage = i; renderProducts(); };
    ind.appendChild(dot);
  }
}

$('product-search').oninput = () => { currentPage = 0; renderProducts(); };
$('btn-prev-page').onclick  = () => { currentPage--; renderProducts(); };
$('btn-next-page').onclick  = () => { currentPage++; renderProducts(); };

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeGenderFilter = btn.dataset.gender;
    currentPage = 0;
    renderProducts();
  };
});

// ── CHARGE ───────────────────────────────────────────────────
$('btn-charge').onclick = () => {
  if (cartTotal() === 0) return;
  $('charge-amount').textContent = php(cartTotal());
  $('cash-input').value = cartTotal().toFixed(2);
  updateChange(); validateCharge();
  openModal('charge-modal');
};
$('cancel-charge').onclick = () => closeModal('charge-modal');

document.querySelectorAll('.pay-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activePayment = btn.dataset.pay;
    $('cash-section').style.display = activePayment === 'Cash' ? '' : 'none';
    validateCharge();
  };
});
$('cash-input').oninput = () => { updateChange(); validateCharge(); };

function updateChange() {
  const received = parseFloat($('cash-input').value) || 0;
  const total    = cartTotal();
  const el2      = $('change-display');
  if (received >= total)  { el2.textContent = 'Change: ' + php(received - total); el2.style.color = '#4CAF50'; }
  else if (received > 0)  { el2.textContent = 'Short: '  + php(total - received); el2.style.color = '#e53935'; }
  else                      el2.textContent = '';
}
function validateCharge() {
  $('confirm-charge').disabled = activePayment === 'Cash' && (parseFloat($('cash-input').value) || 0) < cartTotal();
}

$('confirm-charge').onclick = () => {
  receiptCounter.pos2++;
  const r = {
    id: `#2-${pad(receiptCounter.pos2)}`, date: nowDate(), time: nowTime(),
    total: cartTotal(), items: cart.map(i => ({ name: `[R] ${i.name}`, qty: i.qty, price: i.price })),
    payment: activePayment, pos: 'POS 2', refunded: false,
  };
  receipts.unshift(r);

  // ── Deduct sold quantities from inventory ──
  cart.forEach(cartItem => {
    const invItem = inventory.find(inv => inv.name === cartItem.name);
    if (invItem) {
      const oldQty = invItem.qty;
      const newQty = Math.max(0, invItem.qty - cartItem.qty);
      inventory = inventory.map(inv =>
        inv.id === invItem.id ? { ...inv, qty: newQty } : inv
      );
      addInvHistory('sub', `Sale: ${invItem.name} −${cartItem.qty} (${oldQty}→${newQty}) [${r.id}]`);
    }
  });

  clearCart();
  closeModal('charge-modal');
  renderHistory();
  showToast('✓ Payment Successful!');
};

// ── RECEIPTS ─────────────────────────────────────────────────
function renderReceipts() {
  const q    = ($('receipt-search').value || '').toLowerCase();
  const list = $('receipt-list');
  list.innerHTML = '';

  const filtered = receipts.filter(r =>
    r.id.toLowerCase().includes(q) || r.items.some(i => i.name.toLowerCase().includes(q))
  );
  const groups = {};
  filtered.forEach(r => {
    const label = formatDateLabel(r.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  });
  if (Object.keys(groups).length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#aaa">No receipts found</div>';
    return;
  }
  Object.entries(groups).forEach(([date, recs]) => {
    list.appendChild(el('div', 'receipt-date-header', date));
    recs.forEach(r => {
      const row = el('div', 'receipt-row' + (selectedReceipt?.id === r.id ? ' selected' : ''));
      row.innerHTML = `
        <span class="receipt-icon">💵</span>
        <div class="receipt-row-info">
          <div class="receipt-row-amount">${php(r.total)}</div>
          <div class="receipt-row-time">${r.time}</div>
          ${r.refundOf ? `<div class="receipt-row-refund">Refund ${r.refundOf}</div>` : ''}
        </div>
        <div class="receipt-row-id">${r.id}</div>`;
      row.onclick = () => showReceiptDetail(r);
      list.appendChild(row);
    });
  });
}
$('receipt-search').oninput = renderReceipts;

function showReceiptDetail(receipt) {
  selectedReceipt = receipt;
  $('receipt-placeholder').style.display = 'none';
  const inner = $('receipt-detail-inner');
  inner.style.display = 'flex';
  $('detail-id').textContent = receipt.id;
  $('btn-refund').style.display = (!receipt.refunded && !receipt.refundOf) ? '' : 'none';

  $('receipt-detail-body').innerHTML = `
    <div class="detail-amount">${php(receipt.total)}</div>
    <div class="detail-label">Total</div>
    <div class="detail-meta">Employee: Owner</div>
    <div class="detail-meta">POS: ${receipt.pos}</div>
    <hr class="detail-divider" />
    ${receipt.items.map(item => `
      <div class="detail-item">
        <div><div class="detail-item-name">${item.name}</div>
          <div class="detail-item-sub">${item.qty} × ${php(item.price)}</div></div>
        <div class="detail-item-price">${php(item.price * item.qty)}</div>
      </div>`).join('')}
    <hr class="detail-divider" />
    <div class="detail-total-row"><span>Total</span><span>${php(receipt.total)}</span></div>
    <div class="detail-cash-row"><span>${receipt.payment}</span><span>${php(receipt.total)}</span></div>
    <div class="detail-footer">
      <span>${receipt.date}, ${receipt.time}</span><span>${receipt.id}</span>
    </div>
    ${receipt.refunded ? '<div class="refunded-badge">⚠ This receipt has been refunded</div>' : ''}
    ${receipt.refundOf ? `<div class="refunded-badge" style="background:#fff8e1;color:#f57c00">↩ Refund of ${receipt.refundOf}</div>` : ''}`;
  renderReceipts();
}

$('btn-close-detail').onclick = () => {
  $('receipt-detail-inner').style.display = 'none';
  $('receipt-placeholder').style.display  = '';
  selectedReceipt = null;
  renderReceipts();
};

// ── REFUND ───────────────────────────────────────────────────
$('btn-refund').onclick = () => {
  if (!selectedReceipt) return;
  if (!can('refund')) { showAccessDenied(); return; }
  $('refund-text').textContent = `Refund ${php(selectedReceipt.total)} for ${selectedReceipt.id}?`;
  openModal('refund-modal');
};
$('cancel-refund').onclick = () => closeModal('refund-modal');
$('confirm-refund').onclick = () => {
  const orig = selectedReceipt;
  receipts = receipts.map(r => r.id === orig.id ? { ...r, refunded: true } : r);
  receiptCounter.pos2++;
  const refund = {
    id: `#2-${pad(receiptCounter.pos2)}`, date: nowDate(), time: nowTime(),
    total: orig.total, items: orig.items, payment: orig.payment, pos: 'POS 2', refundOf: orig.id,
  };
  receipts.unshift(refund);

  // ── Restore refunded quantities back into inventory ──
  orig.items.forEach(refundItem => {
    const cleanName = refundItem.name.replace(/^\[R\] /, '');
    const invItem = inventory.find(inv => inv.name === cleanName);
    if (invItem) {
      const oldQty = invItem.qty;
      const newQty = invItem.qty + refundItem.qty;
      inventory = inventory.map(inv =>
        inv.id === invItem.id ? { ...inv, qty: newQty } : inv
      );
      addInvHistory('add', `Refund: ${invItem.name} +${refundItem.qty} (${oldQty}→${newQty}) [${orig.id}]`);
    }
  });

  closeModal('refund-modal');
  showReceiptDetail(refund);
  renderHistory();
  showToast('↩ Refund Processed');
};

// ── ITEMS ────────────────────────────────────────────────────
function renderItems() {
  const list = $('items-list');
  list.innerHTML = '';
  $('items-count').textContent = products.length + ' items';
  products.forEach(p => {
    const row = el('div', 'item-row');
    row.innerHTML = `
      <div class="item-dot ${p.gender}"></div>
      <div class="item-row-info">
        <div class="item-row-name">[R] ${p.name}</div>
        <div class="item-row-gender">${p.gender}</div>
      </div>
      <span class="item-row-price">${php(p.price)}</span>
      <button class="btn-edit-item" data-id="${p.id}">✏ Edit</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll('.btn-edit-item').forEach(btn =>
    btn.onclick = () => openEditModal(+btn.dataset.id)
  );
}

function openEditModal(id) {
  editingProductId = id;
  const p = products.find(x => x.id === id);
  $('edit-modal-title').textContent = 'Edit Product';
  $('edit-name').value  = p.name;
  $('edit-price').value = p.price;
  setGenderToggle(p.gender);
  $('delete-product').style.display = '';
  openModal('edit-modal');
}
$('btn-add-product').onclick = () => {
  editingProductId = null;
  $('edit-modal-title').textContent = 'Add Product';
  $('edit-name').value  = '';
  $('edit-price').value = '150';
  setGenderToggle('male');
  $('delete-product').style.display = 'none';
  openModal('edit-modal');
};
function setGenderToggle(g) {
  document.querySelectorAll('.gtoggle').forEach(b => b.classList.toggle('active', b.dataset.g === g));
}
document.querySelectorAll('.gtoggle').forEach(btn => btn.onclick = () => setGenderToggle(btn.dataset.g));
function getSelectedGender() { return document.querySelector('.gtoggle.active')?.dataset.g || 'male'; }

$('cancel-edit').onclick     = () => closeModal('edit-modal');
$('cancel-edit-btn').onclick = () => closeModal('edit-modal');

$('save-product').onclick = () => {
  const name  = $('edit-name').value.trim();
  const price = parseFloat($('edit-price').value) || 0;
  const gender = getSelectedGender();
  if (!name) { $('edit-name').focus(); return; }
  if (editingProductId !== null) {
    products = products.map(p => p.id === editingProductId ? { ...p, name, price, gender } : p);
  } else {
    products.push({ id: nextProductId++, name, price, gender });
  }
  closeModal('edit-modal');
  renderItems();
  showToast(editingProductId !== null ? '✏ Product updated!' : '✅ Product added!');
};
$('delete-product').onclick = () => {
  if (editingProductId === null) return;
  products = products.filter(p => p.id !== editingProductId);
  cart     = cart.filter(i => i.id !== editingProductId);
  closeModal('edit-modal');
  renderCart();
  renderItems();
  showToast('🗑 Product deleted');
};

// ── MODAL HELPERS ────────────────────────────────────────────
function openModal(id) {
  const el2 = $(id);
  el2.classList.add('open');
}
function closeModal(id) { $(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.onclick = e => { if (e.target === overlay) closeModal(overlay.id); };
});

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2400);
}

// ════════════════════════════════════════════════════════════
//  INVENTORY MODULE
// ════════════════════════════════════════════════════════════

let inventory = [
  { id:'PRD-001', name:'212 VIP Black 85ML',       category:'Perfume',    qty:24, min:5  },
  { id:'PRD-002', name:'Acqua Di Gio 85ML',        category:'Cologne',    qty:7,  min:5  },
  { id:'PRD-003', name:'Baccarat Rouge 540 85ML',  category:'Perfume',    qty:5,  min:5  },
  { id:'PRD-004', name:'Bombshell 85ML',           category:'Perfume',    qty:0,  min:4  },
  { id:'PRD-005', name:'Burberry Blush 85ML',      category:'Perfume',    qty:15, min:6  },
  { id:'PRD-006', name:'Bvlgari Amethyste 85ML',   category:'Cologne',    qty:3,  min:5  },
  { id:'PRD-007', name:'Bvlgari Extreme 85ML',     category:'Cologne',    qty:20, min:5  },
  { id:'PRD-008', name:'CK One 85ML',              category:'Body Spray', qty:8,  min:6  },
  { id:'PRD-009', name:'Cloud Ariana Grande 85ML', category:'Perfume',    qty:4,  min:4  },
  { id:'PRD-010', name:'Cool Water 85ML',          category:'Cologne',    qty:0,  min:5  },
  { id:'PRD-011', name:'D&G Light Blue 85ML',      category:'Cologne',    qty:12, min:5  },
  { id:'PRD-012', name:"Eclat D'Aperge 85ML",      category:'Perfume',    qty:6,  min:5  },
  { id:'PRD-013', name:'Ferrari Black 85ML',       category:'Cologne',    qty:30, min:8  },
  { id:'PRD-014', name:'French Riviera 85ML',      category:'Perfume',    qty:2,  min:4  },
  { id:'PRD-015', name:'Good Girl 85ML',           category:'Perfume',    qty:10, min:6  },
  { id:'PRD-016', name:'Hugo Boss 85ML',           category:'Cologne',    qty:5,  min:5  },
  { id:'PRD-017', name:'Incanto Shine 85ML',       category:'Perfume',    qty:0,  min:3  },
  { id:'PRD-018', name:'Lacoste Black 85ML',       category:'Cologne',    qty:18, min:6  },
  { id:'PRD-019', name:'Lacoste Red 85ML',         category:'Cologne',    qty:7,  min:5  },
  { id:'PRD-020', name:'Meow Katy Perry 85ML',     category:'Perfume',    qty:3,  min:3  },
  { id:'PRD-021', name:'Montblanc 85ML',           category:'Cologne',    qty:22, min:7  },
  { id:'PRD-022', name:'Polo Blue 85ML',           category:'Cologne',    qty:9,  min:6  },
  { id:'PRD-023', name:'Polo Sport 85ML',          category:'Body Spray', qty:4,  min:5  },
  { id:'PRD-024', name:'Ralph Lauren 85ML',        category:'Perfume',    qty:14, min:6  },
  { id:'PRD-025', name:'Sauvage Dior 85ML',        category:'Cologne',    qty:35, min:10 },
  { id:'PRD-026', name:'Valaya 85ML',              category:'Perfume',    qty:1,  min:4  },
  { id:'PRD-027', name:'Miss Dior 85ML',           category:'Perfume',    qty:11, min:5  },
  { id:'PRD-028', name:'Chanel No.5 85ML',         category:'Perfume',    qty:6,  min:5  },
  { id:'PRD-029', name:'Bleu de Chanel 85ML',      category:'Cologne',    qty:0,  min:4  },
  { id:'PRD-030', name:'Versace Eros 85ML',        category:'Cologne',    qty:8,  min:7  },
];

let invHistory      = [];
let invEditingId    = null;
let invAdjustId     = null;
let invFilterStatus = 'all';
let invNextNum      = 31;

// ── STATUS LOGIC ─────────────────────────────────────────────
function getStockStatus(qty, min) {
  if (qty === 0)                   return 'Out of Stock';
  if (qty <= min)                  return 'Need Restock';
  if (qty <= Math.ceil(min * 1.5)) return 'Low Stock';
  return 'In Stock';
}
const statusBadgeClass = s => ({ 'In Stock':'inv-badge-ok','Low Stock':'inv-badge-low','Need Restock':'inv-badge-restock','Out of Stock':'inv-badge-out' })[s] || '';
const statusIcon       = s => ({ 'In Stock':'✅','Low Stock':'⚠️','Need Restock':'🔄','Out of Stock':'❌' })[s] || '';
const qtyColorClass    = s => ({ 'In Stock':'inv-qty-ok','Low Stock':'inv-qty-low','Need Restock':'inv-qty-restock','Out of Stock':'inv-qty-out' })[s] || '';

function updateInvSummary() {
  const c = { 'In Stock':0,'Low Stock':0,'Need Restock':0,'Out of Stock':0 };
  inventory.forEach(p => c[getStockStatus(p.qty, p.min)]++);
  $('inv-sum-total').textContent   = inventory.length;
  $('inv-sum-ok').textContent      = c['In Stock'];
  $('inv-sum-low').textContent     = c['Low Stock'];
  $('inv-sum-restock').textContent = c['Need Restock'];
  $('inv-sum-out').textContent     = c['Out of Stock'];
  const bad = c['Low Stock'] + c['Need Restock'] + c['Out of Stock'];
  const banner = $('inv-alert');
  if (bad > 0) {
    const parts = [];
    if (c['Out of Stock'])  parts.push(c['Out of Stock']  + ' out of stock');
    if (c['Need Restock'])  parts.push(c['Need Restock']  + ' need restock');
    if (c['Low Stock'])     parts.push(c['Low Stock']     + ' low stock');
    $('inv-alert-text').textContent = '⚠ Alert: ' + parts.join(', ') + '!';
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}
$('inv-alert-close').onclick = () => $('inv-alert').style.display = 'none';

function renderInvTable() {
  const q    = ($('inv-search').value || '').toLowerCase();
  const tbody = $('inv-tbody');
  const empty = $('inv-empty');
  tbody.innerHTML = '';
  const data = inventory.filter(p => {
    const s = getStockStatus(p.qty, p.min);
    return (p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        && (invFilterStatus === 'all' || s === invFilterStatus);
  });
  if (data.length === 0) { empty.style.display = ''; return; }
  empty.style.display = 'none';
  data.forEach(p => {
    const s = getStockStatus(p.qty, p.min);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="inv-prod-id">${p.id}</span></td>
      <td><span class="inv-prod-name">${p.name}</span></td>
      <td><span class="inv-cat-badge">${p.category}</span></td>
      <td class="inv-qty-cell ${qtyColorClass(s)}">${p.qty}</td>
      <td class="inv-min-cell">${p.min}</td>
      <td><span class="inv-badge ${statusBadgeClass(s)}">${statusIcon(s)} ${s}</span></td>
      <td><div class="inv-row-actions">
        <button class="btn-inv-adjust" data-id="${p.id}">± Qty</button>
        <button class="btn-inv-edit"   data-id="${p.id}">✏ Edit</button>
      </div></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.btn-inv-edit').forEach(b    => b.onclick = () => openInvEditModal(b.dataset.id));
  tbody.querySelectorAll('.btn-inv-adjust').forEach(b  => b.onclick = () => openInvAdjustModal(b.dataset.id));
  updateInvSummary();
}

$('inv-search').oninput = renderInvTable;
document.querySelectorAll('.inv-chip').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.inv-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    invFilterStatus = btn.dataset.istatus;
    renderInvTable();
  };
});

// ── INV ADD/EDIT ──────────────────────────────────────────────
$('btn-inv-add').onclick = () => {
  invEditingId = null;
  $('inv-modal-title').textContent = 'Add Inventory Item';
  $('inv-f-id').value       = 'PRD-' + String(invNextNum).padStart(3, '0');
  $('inv-f-id').disabled    = false;
  $('inv-f-name').value     = '';
  $('inv-f-category').value = 'Perfume';
  $('inv-f-qty').value      = '';
  $('inv-f-min').value      = '';
  $('inv-delete-btn').style.display = 'none';
  updateInvStatusPreview();
  openModal('inv-modal');
  setTimeout(() => $('inv-f-name').focus(), 150);
};
function openInvEditModal(id) {
  invEditingId = id;
  const p = inventory.find(x => x.id === id);
  $('inv-modal-title').textContent = 'Edit Inventory Item';
  $('inv-f-id').value       = p.id;
  $('inv-f-id').disabled    = true;
  $('inv-f-name').value     = p.name;
  $('inv-f-category').value = p.category;
  $('inv-f-qty').value      = p.qty;
  $('inv-f-min').value      = p.min;
  $('inv-delete-btn').style.display = '';
  updateInvStatusPreview();
  openModal('inv-modal');
}
function updateInvStatusPreview() {
  const qty = parseInt($('inv-f-qty').value);
  const min = parseInt($('inv-f-min').value);
  const el2 = $('inv-status-preview');
  if (isNaN(qty) || isNaN(min) || min < 1) {
    el2.textContent = '— enter qty & min level';
    el2.style.cssText = 'background:#f5f5f5;color:#999;border-color:#e0e0e0';
    return;
  }
  const s = getStockStatus(qty, min);
  const map = { 'In Stock':['#e8f5e9','#2e7d32'],'Low Stock':['#fff3e0','#e65100'],'Need Restock':['#e3f2fd','#1565c0'],'Out of Stock':['#ffebee','#c62828'] };
  const [bg, color] = map[s];
  el2.textContent = statusIcon(s) + ' ' + s;
  el2.style.cssText = `background:${bg};color:${color};border-color:${color}40`;
}
$('inv-f-qty').oninput = updateInvStatusPreview;
$('inv-f-min').oninput = updateInvStatusPreview;
$('inv-modal-close').onclick = () => closeModal('inv-modal');
$('inv-cancel-btn').onclick  = () => closeModal('inv-modal');
$('inv-save-btn').onclick = () => {
  const id  = $('inv-f-id').value.trim();
  const name= $('inv-f-name').value.trim();
  const cat = $('inv-f-category').value;
  const qty = parseInt($('inv-f-qty').value);
  const min = parseInt($('inv-f-min').value);
  if (!id || !name)           { showToast('⚠ Fill in ID and Name'); return; }
  if (isNaN(qty) || qty < 0)  { showToast('⚠ Enter valid quantity'); return; }
  if (isNaN(min) || min < 1)  { showToast('⚠ Min stock must be ≥ 1'); return; }
  if (invEditingId === null) {
    if (inventory.find(p => p.id === id)) { showToast('⚠ Product ID already exists'); return; }
    inventory.push({ id, name, category: cat, qty, min });
    invNextNum++;
    addInvHistory('edit', `Added: ${name} (${id}), qty ${qty}`);
    showToast('✅ Item added!');
  } else {
    const old = inventory.find(p => p.id === invEditingId);
    inventory = inventory.map(p => p.id === invEditingId ? { ...p, name, category: cat, qty, min } : p);
    addInvHistory('edit', `Edited: ${name} — qty ${old.qty}→${qty}`);
    showToast('✏ Item updated!');
  }
  closeModal('inv-modal');
  renderInvTable();
  renderInvHistory();
};
$('inv-delete-btn').onclick = () => {
  const p = inventory.find(x => x.id === invEditingId);
  if (!p || !confirm(`Delete "${p.name}"?`)) return;
  inventory = inventory.filter(x => x.id !== invEditingId);
  addInvHistory('sub', `Deleted: ${p.name} (${p.id})`);
  closeModal('inv-modal');
  renderInvTable();
  renderInvHistory();
  showToast('🗑 Item deleted');
};

// ── ADJUST ───────────────────────────────────────────────────
function openInvAdjustModal(id) {
  invAdjustId = id;
  const p = inventory.find(x => x.id === id);
  $('inv-adjust-name').textContent    = p.name;
  $('inv-adjust-current').textContent = `Current: ${p.qty} units  |  Min: ${p.min}`;
  $('inv-adj-qty').value              = 1;
  openModal('inv-adjust-modal');
}
$('inv-adjust-close').onclick = () => closeModal('inv-adjust-modal');
$('inv-adj-cancel').onclick   = () => closeModal('inv-adjust-modal');
$('inv-adj-minus').onclick    = () => { const v = parseInt($('inv-adj-qty').value)||1; $('inv-adj-qty').value = Math.max(1, v-1); };
$('inv-adj-plus').onclick     = () => { $('inv-adj-qty').value = (parseInt($('inv-adj-qty').value)||1) + 1; };
$('inv-adj-sub').onclick = () => doInvAdjust(-1);
$('inv-adj-add').onclick = () => doInvAdjust(+1);
function doInvAdjust(dir) {
  const p      = inventory.find(x => x.id === invAdjustId);
  const amount = parseInt($('inv-adj-qty').value) || 1;
  const reason = $('inv-adj-reason').value;
  const oldQty = p.qty;
  const newQty = Math.max(0, p.qty + dir * amount);
  inventory    = inventory.map(x => x.id === invAdjustId ? { ...x, qty: newQty } : x);
  addInvHistory(dir > 0 ? 'add' : 'sub', `${p.name}: ${dir>0?'+':'−'}${amount} (${reason}). ${oldQty}→${newQty}`);
  closeModal('inv-adjust-modal');
  renderInvTable();
  renderInvHistory();
  showToast(`${dir>0?'➕':'➖'} ${p.name} → ${newQty} units`);
}

// ── HISTORY ──────────────────────────────────────────────────
function addInvHistory(type, desc) {
  const t = new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  invHistory.unshift({ type, desc, time: t, date: nowDate() });
  if (invHistory.length > 80) invHistory.pop();
  renderHistory();
}
function renderInvHistory() {
  const list = $('inv-history-list');
  if (invHistory.length === 0) {
    list.innerHTML = '<div class="inv-history-empty">No changes recorded yet.</div>';
    return;
  }
  list.innerHTML = invHistory.map(h => `
    <div class="inv-history-item">
      <div class="inv-hist-dot ${h.type}"></div>
      <div class="inv-hist-desc">${h.desc}</div>
      <div class="inv-hist-time">${h.time}</div>
    </div>`).join('');
}
$('inv-history-toggle').onclick = () => {
  const body = $('inv-history-body');
  const btn  = $('inv-history-toggle');
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  btn.textContent    = hidden ? 'Hide ▲' : 'Show ▼';
};

function getHistoryEvents() {
  const receiptEvents = receipts.map(r => {
    const isRefund = !!r.refundOf;
    const itemsText = r.items.map(i => `${i.qty}x ${i.name}`).join(', ');
    return {
      id: r.id,
      type: isRefund ? 'refund' : 'sale',
      date: r.date,
      time: r.time,
      title: isRefund ? `Refund ${r.id}` : `Sale ${r.id}`,
      sub: `${r.pos} • ${r.payment}${isRefund ? ` • Refund of ${r.refundOf}` : ''}`,
      items: itemsText,
      amount: r.total,
      badge: isRefund ? 'Refund' : 'Sale',
      receipt: r,
      search: `${r.id} ${r.pos} ${r.payment} ${itemsText} ${isRefund ? r.refundOf : ''}`.toLowerCase(),
    };
  });

  const stockEvents = invHistory.map((h, index) => {
    const productName = getStockHistoryProductName(h.desc);
    return {
      id: `stock-${index}`,
      type: 'stock',
      stockType: h.type,
      date: h.date || nowDate(),
      time: h.time,
      title: stockHistoryTitle(h),
      sub: h.desc,
      items: productName ? `Product: ${productName}` : '',
      amount: null,
      badge: stockHistoryBadge(h.type),
      stockSearch: productName,
      search: `${h.desc} ${h.time} ${h.type}`.toLowerCase(),
    };
  });

  return [...receiptEvents, ...stockEvents].sort((a, b) => historyTimeValue(b) - historyTimeValue(a));
}

function historyTimeValue(entry) {
  const value = new Date(`${entry.date} ${entry.time}`).getTime();
  return Number.isNaN(value) ? 0 : value;
}

function stockHistoryTitle(h) {
  if (h.desc.startsWith('Sale:')) return 'Stock deducted from sale';
  if (h.desc.startsWith('Refund:')) return 'Stock restored from refund';
  if (h.desc.startsWith('Added:')) return 'Inventory item added';
  if (h.desc.startsWith('Edited:')) return 'Inventory item edited';
  if (h.desc.startsWith('Deleted:')) return 'Inventory item deleted';
  return h.type === 'add' ? 'Stock added' : h.type === 'sub' ? 'Stock subtracted' : 'Stock changed';
}

function stockHistoryBadge(type) {
  return type === 'add' ? 'Stock +' : type === 'sub' ? 'Stock −' : 'Stock Edit';
}

function getStockHistoryProductName(desc) {
  return desc
    .replace(/^(Sale|Refund|Added|Edited|Deleted):\s*/, '')
    .split(/:|\(|\[|—|\s[+−-]\d/)[0]
    .trim();
}

function renderHistory() {
  const timeline = $('hist-timeline');
  if (!timeline) return;

  const q = ($('hist-search').value || '').trim().toLowerCase();
  const events = getHistoryEvents();
  const filtered = events.filter(e =>
    (activeHistoryFilter === 'all' || e.type === activeHistoryFilter) &&
    (!q || e.search.includes(q))
  );

  const sales = receipts.filter(r => !r.refundOf);
  const refunds = receipts.filter(r => r.refundOf);
  $('hist-sum-sales').textContent = php(sales.reduce((sum, r) => sum + r.total, 0));
  $('hist-sum-txn').textContent = receipts.length;
  $('hist-sum-refunds').textContent = refunds.length;
  $('hist-sum-inv').textContent = invHistory.length;

  document.querySelectorAll('.hist-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.htype === activeHistoryFilter);
  });
  document.querySelectorAll('.hist-card[data-htype]').forEach(card => {
    card.classList.toggle('active', card.dataset.htype === activeHistoryFilter);
  });

  if (filtered.length === 0) {
    timeline.innerHTML = '<div class="hist-empty">No history found.</div>';
    return;
  }

  let lastDate = '';
  timeline.innerHTML = filtered.map(entry => {
    const dateHeader = entry.date !== lastDate ? `<div class="hist-date-header">${formatDateLabel(entry.date)}</div>` : '';
    lastDate = entry.date;
    const dotClass = entry.type === 'stock' ? 'hist-dot-stock' : entry.type === 'refund' ? 'hist-dot-refund' : 'hist-dot-sale';
    const badgeClass = entry.type === 'stock'
      ? (entry.stockType === 'add' ? 'hbadge-stock-add' : entry.stockType === 'sub' ? 'hbadge-stock-sub' : 'hbadge-stock-edit')
      : `hbadge-${entry.type}`;
    const icon = entry.type === 'stock' ? '📦' : entry.type === 'refund' ? '↩️' : '💰';
    const amount = entry.amount === null ? '' : `<div class="hist-entry-amt">${entry.type === 'refund' ? '-' : ''}${php(entry.amount)}</div>`;
    return `${dateHeader}
      <button class="hist-entry" type="button" data-hid="${escapeHtml(entry.id)}">
        <div class="hist-entry-dot ${dotClass}">${icon}</div>
        <div class="hist-entry-main">
          <div class="hist-entry-title">${escapeHtml(entry.title)}</div>
          <div class="hist-entry-sub">${escapeHtml(entry.sub)}</div>
          ${entry.items ? `<div class="hist-entry-items">${escapeHtml(entry.items)}</div>` : ''}
        </div>
        <div class="hist-entry-right">
          ${amount}
          <div class="hist-entry-time">${escapeHtml(entry.time)}</div>
          <span class="hist-entry-badge ${badgeClass}">${escapeHtml(entry.badge)}</span>
        </div>
      </button>`;
  }).join('');

  timeline.querySelectorAll('.hist-entry').forEach(row => {
    row.onclick = () => openHistoryEntry(row.dataset.hid, events);
  });
}

function openHistoryEntry(id, events) {
  const entry = events.find(e => e.id === id);
  if (!entry) return;

  if (entry.receipt) {
    switchScreen('receipts');
    showReceiptDetail(entry.receipt);
    return;
  }

  switchScreen('inventory');
  if (entry.stockSearch) {
    $('inv-search').value = entry.stockSearch;
    renderInvTable();
  }
}

$('hist-search').oninput = renderHistory;
document.querySelectorAll('.hist-chip').forEach(btn => {
  btn.onclick = () => {
    activeHistoryFilter = btn.dataset.htype;
    renderHistory();
  };
});
[
  ['.hist-card--sales', 'sale'],
  ['.hist-card--txn', 'all'],
  ['.hist-card--refund', 'refund'],
  ['.hist-card--inv', 'stock'],
].forEach(([selector, filter]) => {
  const card = document.querySelector(selector);
  if (!card) return;
  card.dataset.htype = filter;
  card.onclick = () => {
    activeHistoryFilter = filter;
    renderHistory();
  };
});

// ── INIT ─────────────────────────────────────────────────────
renderProducts();
renderCart();
renderInvHistory();
renderHistory();
