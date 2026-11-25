// ============================================================
// 1. HELPER DAN STATE APLIKASI
// ============================================================
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const toggleAuthPassword = (id, button) => { const input = document.getElementById(id); if (!input) return; input.type = input.type === 'password' ? 'text' : 'password'; button.innerHTML = input.type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>'; button.setAttribute('aria-label', input.type === 'password' ? 'Tampilkan password' : 'Sembunyikan password'); };
const rp = n => 'Rp ' + Number(n).toLocaleString('id-ID') + ',00';
const load = (k, d) => JSON.parse(localStorage.getItem(k) || 'null') || d, save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);
const EMPTY_PRODUCT_IMAGE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="#f3f1ef"/></svg>');
const productImage = image => image ? (image.startsWith('data:image/') || image.includes('/') ? image : `img/${image}`) : EMPTY_PRODUCT_IMAGE;
const API_URL = 'api/index.php';
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusod tempor incididunt ut labore et dolore magna aliqua. Quis ipsu msuspendisse';
const flash = m => {
  const old = document.querySelector('#flash');
  if (old) old.remove();
  const d = document.createElement('div');
  d.id = 'flash';
  d.innerHTML = `<span>${m}</span><button type="button" aria-label="Tutup notifikasi" onclick="this.parentElement.remove()">&times;</button>`;
  document.body.append(d);
  setTimeout(() => d.remove(), 2800);
};
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YM = new Date().toLocaleDateString('sv-SE').slice(0, 7);

let products = [], cats = [], orders = [], outs = [], batches = [], batchProductRecap = [];
let cart = load('cart', []), user = null, csrf = '', appReady = false, adminDataLoaded = false, ordersLoaded = false;
let q = '', mode = 'Pengantaran', ship = 5000, bukti = false;
let deliveryArea = '', deliveryAddress = '';
let customerNotificationItems = [];
let customerNotificationsLoaded = false;
let customerNotificationsRequest = null;
let notificationRead = new Set(load('customerNotificationRead', []));
let customerFeedbackDrafts = load('customerFeedbackDrafts', {});
const prod = id => products.find(p => p.id == id);
const go = id => location.hash = '#/produk/' + id;

async function api(action, options = {}) {
  const headers = new Headers(options.headers || {});
  if (csrf && options.method && options.method !== 'GET') headers.set('X-CSRF-Token', csrf);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}?action=${encodeURIComponent(action)}${options.query || ''}`, {
    ...options,
    headers,
    credentials: 'same-origin',
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body
  });
  const data = response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : {};
  if (!response.ok) throw new Error(data.error || 'Permintaan gagal. Silakan coba lagi.');
  return data;
}

const mapUser = value => value ? ({ ...value, nama: value.name, telepon: value.phone, foto: value.photo_path || '' }) : null;
const mapProduct = value => ({
  id: Number(value.id), kode: value.code, nama: value.name, desc: value.description || '',
  harga: Number(value.price), kat: value.category_name || '', category_id: Number(value.category_id || 0),
  img: value.image_path || ''
});
const mapOrder = value => ({
  ...value,
  id: Number(value.id),
  nama: value.customer_name || '',
  telepon: value.customer_phone || '',
  payment_reason: value.payment_reason || value.rejection_reason || '',
  items: (value.items || []).map(item => ({ nama: item.name, qty: Number(item.quantity), harga: Number(item.unit_price) })),
  subtotal: Number(value.subtotal),
  ongkir: Number(value.shipping_fee),
  total: Number(value.total),
  alamat: value.fulfillment === 'pickup' ? 'Pick Up' : value.address,
  tgl: value.created_at,
  bukti: Boolean(value.proof_path)
});

async function loadBootstrap() {
  const data = await api('bootstrap');
  csrf = data.csrf;
  user = mapUser(data.user);
  products = data.products.map(mapProduct);
  cats = data.categories.map(value => ({ id: Number(value.id), kode: value.code, nama: value.name }));
  cart = cart.filter(item => products.some(product => product.id === Number(item.id)));
  save('cart', cart);
  appReady = true;
}

async function loadOrders() {
  const data = await api('orders');
  orders = data.orders.map(mapOrder);
  ordersLoaded = true;
}

async function loadAdminData() {
  const data = await api('admin-data');
  orders = data.orders.map(mapOrder);
  products = data.products.map(mapProduct);
  cats = data.categories.map(value => ({ id: Number(value.id), kode: value.code, nama: value.name }));
  outs = data.expenses.map(value => ({
    id: Number(value.id), bulan: value.expense_date.slice(0, 7), tanggal: value.expense_date,
    keterangan: value.description, jumlah: Number(value.amount)
  }));
  batches = data.batches.map(value => ({
    id: Number(value.id), nama: value.name, mulai: value.start_date,
    selesai: value.end_date, status: value.status
  }));
  batchProductRecap = data.batch_product_recap.map(value => ({
    batchId: Number(value.batch_id), productId: Number(value.product_id),
    nama: value.product_name, jumlah: Number(value.quantity)
  }));
  adminDataLoaded = true;
}

// ============================================================
