// 5. AKSI DAN FORM (tambah, edit, hapus, login, checkout, profil)
// ============================================================
function modal(t, b, ok) {
  $('#mt').textContent = t;
  $('#mb').innerHTML = b;
  $('#mok').style.display = ok ? '' : 'none';
  $('#mok').onclick = async () => {
    const button = $('#mok');
    button.disabled = true;
    try {
      if (ok && await ok() === false) return;
      bootstrap.Modal.getInstance($('#m')).hide();
      await render();
    } catch (error) {
      flash(error.message);
    } finally {
      button.disabled = false;
    }
  };
  bootstrap.Modal.getOrCreateInstance($('#m')).show();
}
const fld = (id, l, v = '', t = 'text') => `<label class="small mt-2">${l}</label><input id="${id}" type="${t}" class="form-control" value="${v}">`;
const val = id => $('#' + id).value;
function add(id, buy) { const c = cart.find(x => x.id == id); c ? c.qty++ : cart.push({ id, qty: 1, pick: true }); save('cart', cart); flash('Ditambahkan ke keranjang'); if (buy) location.hash = '#/keranjang'; }
function qty(id, d) { const c = cart.find(x => x.id == id); c.qty += d; if (c.qty < 1) cart = cart.filter(x => x.id != id); save('cart', cart); render(); }
function pick(id, v) { cart.find(x => x.id == id).pick = v; save('cart', cart); render(); }
const sub = () => cart.filter(c => c.pick).reduce((s, c) => s + prod(c.id).harga * c.qty, 0);
function toCheckout() { if (!cart.some(c => c.pick)) return flash('Pilih produk dulu'); if (!user) { flash('Silakan masuk dulu'); return location.hash = '#/login'; } location.hash = '#/checkout'; }
async function order() {
  const items = cart.filter(item => item.pick);
  const proofInput = $('#bk');
  if (!items.length) return flash('Pilih produk terlebih dahulu.');
  if (!proofInput?.files?.length) return flash('Unggah bukti pembayaran terlebih dahulu.');
  if (mode === 'Pengantaran' && deliveryArea === '__outside__') return flash('Layanan pengantaran belum tersedia untuk wilayah tersebut.');
  if (mode === 'Pengantaran' && !DELIVERY_AREAS.includes(deliveryArea)) return flash('Pilih wilayah pengantaran yang tersedia.');
  const streetAddress = mode === 'Pengantaran' ? deliveryAddress.trim() : '';
  if (mode === 'Pengantaran' && !streetAddress) return flash('Alamat pengantaran wajib diisi.');
  if (streetAddress.length > 900) return flash('Alamat pengantaran terlalu panjang.');
  const address = mode === 'Pengantaran' ? `Wilayah: ${deliveryArea}\n${streetAddress}` : '';
  const button = $('button[onclick="order()"]');
  if (button?.disabled) return;
  if (button) button.disabled = true;
  const form = new FormData();
  form.set('items', JSON.stringify(items.map(item => ({ id: item.id, quantity: item.qty }))));
  form.set('mode', mode === 'Pengantaran' ? 'delivery' : 'pickup');
  form.set('shipping_type', ship === 5000 ? 'standard' : 'economy');
  form.set('address', address);
  form.set('proof', proofInput.files[0]);
  try {
    const result = await api('order-create', { method: 'POST', body: form });
    cart = cart.filter(item => !item.pick);
    save('cart', cart);
    deliveryArea = '';
    deliveryAddress = '';
    bukti = false;
    ordersLoaded = false;
    customerNotificationItems = [];
    customerNotificationsLoaded = false;
    customerNotificationsRequest = null;
    adminDataLoaded = false;
    flash(result.message);
    location.hash = '#/pesanan/' + result.order_id;
  } catch (error) {
    flash(error.message);
    if (button) button.disabled = false;
  }
}
const CUSTOMER_FEEDBACK_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CUSTOMER_FEEDBACK_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
function previewCustomerFeedbackMedia(event) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;
  const isImage = CUSTOMER_FEEDBACK_IMAGE_TYPES.includes(file.type);
  const isVideo = CUSTOMER_FEEDBACK_VIDEO_TYPES.includes(file.type);
  const maxSize = isVideo ? 2 * 1024 * 1024 : 1024 * 1024;
  if ((!isImage && !isVideo) || file.size > maxSize) {
    input.value = '';
    return flash('Pilih foto JPG/PNG/WebP (maks. 1 MB) atau video MP4/WebM/MOV (maks. 2 MB).');
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (isVideo) {
      const preview = $('#' + input.id.replace('feedbackMedia-', 'feedbackMediaVideo-'));
      preview.src = reader.result;
      preview.hidden = false;
      preview.load();
      preview.load();
      const image = $('#' + input.id.replace('feedbackMedia-', 'feedbackMediaImage-'));
      image.hidden = true;
      image.removeAttribute('src');
    } else {
      const preview = $('#' + input.id.replace('feedbackMedia-', 'feedbackMediaImage-'));
      preview.src = reader.result;
      preview.hidden = false;
      const video = $('#' + input.id.replace('feedbackMedia-', 'feedbackMediaVideo-'));
      video.hidden = true;
      video.removeAttribute('src');
      video.load();
    }
  };
  reader.onerror = () => flash('File gagal dibaca. Coba pilih file lain.');
  reader.readAsDataURL(file);
}
function readCustomerFeedbackMedia(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File gagal dibaca. Coba pilih file lain.'));
    reader.readAsDataURL(file);
  });
}
async function saveCustomerFeedback(event, orderId) {
  event.preventDefault();
  const form = event.currentTarget;
  const comment = form.querySelector('textarea').value.trim();
  if (!comment) return flash('Tulis komentar terlebih dahulu.');
  const button = form.querySelector('[type="submit"]');
  const mediaInput = form.querySelector('input[type="file"]');
  const previousDraft = customerFeedbackDrafts[orderId];
  const previousMedia = typeof previousDraft === 'object' && previousDraft
    ? previousDraft.media || previousDraft.photo || ''
    : '';
  if (button) button.disabled = true;
  try {
    const file = mediaInput.files[0];
    if (file) {
      const isImage = CUSTOMER_FEEDBACK_IMAGE_TYPES.includes(file.type);
      const isVideo = CUSTOMER_FEEDBACK_VIDEO_TYPES.includes(file.type);
      const maxSize = isVideo ? 2 * 1024 * 1024 : 1024 * 1024;
      if ((!isImage && !isVideo) || file.size > maxSize) {
        return flash('Pilih foto JPG/PNG/WebP (maks. 1 MB) atau video MP4/WebM/MOV (maks. 2 MB).');
      }
    }
    const media = file ? await readCustomerFeedbackMedia(file) : previousMedia;
    customerFeedbackDrafts[orderId] = { comment, media };
    try {
      save('customerFeedbackDrafts', customerFeedbackDrafts);
    } catch (error) {
      customerFeedbackDrafts[orderId] = previousDraft;
      throw new Error('Draf tidak dapat disimpan di browser. Kosongkan ruang penyimpanan lalu coba lagi.');
    }
    flash('Draf komentar dan foto tersimpan di perangkat ini. Belum terkirim ke admin.');
  } catch (error) {
    flash(error.message);
  } finally {
    if (button) button.disabled = false;
  }
}
async function doLogin(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector('[type=submit]');
  button.disabled = true;
  try {
    const result = await api('login', { method: 'POST', body: { email: val('em'), password: val('pw') } });
    csrf = result.csrf;
    user = mapUser(result.user);
    customerNotificationItems = [];
    customerNotificationsLoaded = false;
    customerNotificationsRequest = null;
    adminDataLoaded = false;
    ordersLoaded = false;
    location.hash = user.role === 'admin' ? '#/admin/dashboard' : '#/';
    if (location.hash === (user.role === 'admin' ? '#/admin/dashboard' : '#/')) await render();
  } catch (error) {
    flash(error.message);
    button.disabled = false;  
  }
}
async function doRegister(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector('[type=submit]');
  button.disabled = true;
  try {
    const result = await api('register', { method: 'POST', body: {
      name: val('regNama'), email: val('regEmail'), password: val('regPw'), phone: val('regPhone')
    } });
    user = mapUser(result.user);
    csrf = result.csrf;
    customerNotificationItems = [];
    customerNotificationsLoaded = false;
    customerNotificationsRequest = null;
    ordersLoaded = false;
    flash('Pendaftaran berhasil.');
    location.hash = '#/';
  } catch (error) {
    flash(error.message);
    button.disabled = false;
  }
}
async function logout() {
  try {
    await api('logout', { method: 'POST', body: {} });
    csrf = '';
    user = null;
    orders = [];
    customerNotificationItems = [];
    customerNotificationsLoaded = false;
    customerNotificationsRequest = null;
    adminDataLoaded = false;
    ordersLoaded = false;
    await loadBootstrap();
    location.hash = '#/';
    await render();
  } catch (error) {
    flash(error.message);
  }
}

// Menampilkan gambar QRIS asli yang disediakan untuk pembayaran.
function showQris() {
  modal('Kode QRIS', '<div class="qris-modal-content"><img src="img/qris.png" alt="Kode QRIS KU-KISS"><p class="text-muted small mb-0 mt-2">Pindai kode QRIS menggunakan aplikasi pembayaran Anda.</p></div>');
}

// Mengaktifkan kolom edit untuk satu bagian profil.
function editProfileField(field) {
  const input = $('#profile' + field);
  const value = $('#profile' + field + 'Value');
  const button = document.querySelector(`.profile-edit-button[onclick="editProfileField('${field}')"]`);
  if (!input) return;
  input.hidden = false;
  if (value) value.hidden = true;
  if (button) button.hidden = true;
  const saveButton = $('#profileSaveButton');
  if (saveButton) saveButton.hidden = false;
  input.focus();
}

async function saveProfile(event) {
  event.preventDefault();
  const button = $('#profileSaveButton');
  button.disabled = true;
  try {
    const form = new FormData();
    form.set('name', $('#profileNama').value.trim());
    form.set('phone', $('#profileTelepon').value.trim());
    const result = await api('profile-save', { method: 'POST', body: form });
    user = mapUser(result.user);
    flash(result.message);
    await render();
  } catch (error) {
    flash(error.message);
    button.disabled = false;
  }
}

async function saveProfilePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    event.target.value = '';
    return flash('Pilih gambar JPG, PNG, atau WebP dengan ukuran maksimal 8 MB.');
  }
  const form = new FormData();
  form.set('name', user.nama);
  form.set('phone', user.telepon);
  form.set('photo', file);
  try {
    const result = await api('profile-save', { method: 'POST', body: form });
    user = mapUser(result.user);
    flash(result.message);
    await render();
  } catch (error) {
    flash(error.message);
  }
}

async function removeProfilePhoto() {
  try {
    const result = await api('profile-photo-delete', { method: 'POST', body: {} });
    user = mapUser(result.user);
    flash(result.message);
    await render();
  } catch (error) {
    flash(error.message);
  }
}

function changePasswordDialog() {
  modal('Ubah Password', fld('currentPassword', 'Password saat ini', '', 'password') +
    fld('newPassword', 'Password baru (minimal 10 karakter)', '', 'password') +
    fld('confirmPassword', 'Ulangi password baru', '', 'password'),
  async () => {
    const nextPassword = val('newPassword');
    if (nextPassword !== val('confirmPassword')) {
      flash('Konfirmasi password baru tidak sama.');
      return false;
    }
    const result = await api('password-change', { method: 'POST', body: {
      current_password: val('currentPassword'), new_password: nextPassword
    } });
    csrf = result.csrf;
    flash(result.message);
  });
}

function showProof(id) {
  modal('Bukti Pembayaran', `<div class="text-center"><img src="${API_URL}?action=proof&id=${encodeURIComponent(id)}" alt="Bukti pembayaran pesanan ${id}" class="img-fluid rounded"></div>`);
}

async function del(kind, id) {
  if (!confirm('Hapus data ini?')) return;
  const actions = { products: 'product-delete', outs: 'expense-delete' };
  try {
    await api(actions[kind], { method: 'POST', body: { id } });
    adminDataLoaded = false;
    await loadAdminData();
    await render();
  } catch (error) {
    flash(error.message);
  }
}

function prodForm(id) {
  const p = id ? prod(id) : { kode: '', nama: '', desc: '', category_id: cats[0]?.id || '', harga: '', img: '' };
  const categoryOptions = cats.map(category => `<option value="${category.id}" ${Number(p.category_id) === category.id ? 'selected' : ''}>${category.nama}</option>`).join('');
  modal(id ? 'Edit Produk' : 'Tambah Produk',
    fld('f1', 'Kode Produk', p.kode) + fld('f2', 'Nama Produk', p.nama) + fld('f3', 'Deskripsi', p.desc) +
    fld('f4', 'Harga', p.harga, 'number') +
    `<label for="fCategory" class="small mt-2">Kategori</label><select id="fCategory" class="form-select" required>${categoryOptions}</select>
    <label for="f6" class="small mt-2">Foto Produk</label><input id="f6" type="file" class="form-control" accept="image/jpeg,image/png,image/webp" onchange="previewProductPhoto(event)">
    <small id="productPhotoStatus" class="form-text">JPG, PNG, atau WebP (maks. 8 MB).</small>
    <div><img id="productPhotoPreview" src="${productImage(p.img)}" alt="Pratinjau foto produk" class="mt-2" style="width:90px;height:90px;object-fit:cover" ${p.img ? '' : 'hidden'}></div>`,
    async () => {
      const form = new FormData();
      form.set('id', id || 0);
      form.set('code', val('f1'));
      form.set('name', val('f2'));
      form.set('description', val('f3'));
      form.set('price', val('f4'));
      form.set('category_id', val('fCategory'));
      if ($('#f6').files[0]) form.set('image', $('#f6').files[0]);
      await api('product-save', { method: 'POST', body: form });
      adminDataLoaded = false;
      await loadAdminData();
    });
}

function previewProductPhoto(event) {
  const input = event.target;
  const file = input.files[0];
  const status = $('#productPhotoStatus');
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    input.value = '';
    status.textContent = 'Pilih foto berformat JPG, PNG, atau WebP.';
    flash('Format foto tidak didukung.');
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    input.value = '';
    status.textContent = 'Ukuran foto maksimal 8 MB.';
    flash('Ukuran foto maksimal 8 MB.');
    return;
  }
  const preview = $('#productPhotoPreview');
  preview.src = URL.createObjectURL(file);
  preview.hidden = false;
  status.textContent = 'Foto siap diunggah.';
}
function batchForm() {
  const dateInput = date => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 10);
  };
  const today = dateInput(new Date());
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  modal('Buat Batch PO',
    `<label for="batchName" class="small mt-2">Nama Batch</label><input id="batchName" type="text" maxlength="100" class="form-control" required>
     <label for="batchStart" class="small mt-2">Tanggal Buka</label><input id="batchStart" type="date" min="${today}" value="${today}" class="form-control" required>
     <label for="batchEnd" class="small mt-2">Tanggal Tutup</label><input id="batchEnd" type="date" min="${today}" value="${dateInput(endDate)}" class="form-control" required>`,
    async () => {
      const name = val('batchName').trim();
      const startDate = val('batchStart');
      const endDateValue = val('batchEnd');
      if (!name || !startDate || !endDateValue) {
        flash('Nama dan tanggal batch wajib diisi.');
        return false;
      }
      if (startDate < today || endDateValue < startDate) {
        flash('Tanggal buka tidak boleh sebelum hari ini dan tanggal tutup tidak boleh sebelum tanggal buka.');
        return false;
      }
      const result = await api('batch-create', { method: 'POST', body: {
        name, start_date: startDate, end_date: endDateValue
      } });
      flash(result.message);
      adminDataLoaded = false;
      await loadAdminData();
    });
}
async function closeBatch(id) {
  const batch = batches.find(value => value.id === id);
  if (!batch || !confirm(`Tutup batch "${batch.nama}"? Pelanggan tidak dapat membuat pesanan baru melalui batch ini.`)) return;
  try {
    const result = await api('batch-close', { method: 'POST', body: { id } });
    flash(result.message);
    adminDataLoaded = false;
    await loadAdminData();
    await render();
  } catch (error) {
    flash(error.message);
  }
}
function outForm(id) {
  const expense = outs.find(value => value.id === id);
  modal(expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran',
    fld('f1', 'Tanggal', expense?.tanggal || new Date().toLocaleDateString('sv-SE'), 'date') +
    fld('f2', 'Keterangan', expense?.keterangan || '') +
    fld('f3', 'Jumlah (Rp)', expense?.jumlah || '', 'number'),
    async () => {
      await api('expense-save', { method: 'POST', body: {
        id: expense?.id || 0, expense_date: val('f1'), description: val('f2'), amount: val('f3')
      } });
      adminDataLoaded = false;
      await loadAdminData();
    });
}
async function orderPayment(id, decision) {
  try {
    const result = await api('order-payment', { method: 'POST', body: { id, decision } });
    flash(result.message);
    adminDataLoaded = false;
    await loadAdminData();
    await render();
  } catch (error) {
    flash(error.message);
  }
}
async function nextStatus(id) {
  const order = orders.find(value => value.id === id);
  const next = ST[ST.indexOf(order.status) + 1];
  if (!next) return;
  try {
    const result = await api('order-status', { method: 'POST', body: { id, status: next } });
    flash(result.message);
    adminDataLoaded = false;
    await loadAdminData();
    await render();
  } catch (error) {
    flash(error.message);
  }
}
let chartDashboard = null;
function chart() {
  const canvas = $('#ch');
  if (!canvas) {
    if (chartDashboard) { chartDashboard.destroy(); chartDashboard = null; }
    return;
  }
  if (chartDashboard) chartDashboard.destroy();
  const year = Number(YM.slice(0, 4));
  const values = BULAN.map((_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    const income = orders.filter(order => order.tgl.startsWith(month) && order.payment_status === 'Lunas')
      .reduce((sum, order) => sum + order.total, 0);
    const expenses = outs.filter(expense => expense.bulan === month).reduce((sum, expense) => sum + expense.jumlah, 0);
    return income - expenses;
  });
  chartDashboard = new Chart(canvas, {
    type: 'line',
    data: { labels: BULAN, datasets: [{ data: values, borderColor: '#0a8f4e', backgroundColor: 'rgba(10,143,78,.15)', fill: true, tension: .4 }] },
    options: { plugins: { legend: { display: false } } }
  });
}

// ============================================================
