// 2. KOMPONEN TAMPILAN PELANGGAN (navbar, footer, pencarian)
// ============================================================
const unreadCustomerNotificationCount = () =>
  customerNotificationItems.filter(item => !item.read_at).length;
const nav = () => `<nav class="navbar navbar-expand-lg bg-white nav-3d sticky-top"><div class="container">
<a class="navbar-brand brand" href="#/"><img src="img/logo.png" class="logo">KU-KISS</a>
<button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nv"><span class="navbar-toggler-icon"></span></button>
<div id="nv" class="collapse navbar-collapse"><ul class="navbar-nav ms-auto align-items-lg-center gap-lg-4">
${[['', 'house', 'Home'], ['menu', 'journal-text', 'Menu'], ['keranjang', 'cart-fill', 'Keranjang'], ['about', 'info-circle', 'About Us']].map(([h, i, t]) => `<li><a class="nav-link" href="#/${h}"><i class="bi bi-${i}"></i> ${t}</a></li>`).join('')}
${user?.role === 'customer' ? '<li><a class="nav-link" href="#/riwayat"><i class="bi bi-receipt"></i> Pesanan Saya</a></li>' : ''}
${user?.role === 'customer' ? `<li><a class="nav-link notification-link" href="#/notifikasi" title="Notifikasi" aria-label="Notifikasi, ${unreadCustomerNotificationCount()} belum dibaca">
  <span class="notification-bell"><i class="bi bi-bell"></i>${unreadCustomerNotificationCount() ? `<span class="notification-count">${unreadCustomerNotificationCount() > 99 ? '99+' : unreadCustomerNotificationCount()}</span>` : ''}</span>
</a></li>` : ''}
<li><a href="${user ? '#/profil' : '#/login'}" class="text-decoration-none" title="Profil">${user?.foto ? `<img src="${productImage(user.foto)}" alt="Foto profil" class="nav-profile-avatar">` : '<i class="bi bi-person-circle avatar"></i>'}</a></li>
<li>${user ? `<button class="btn btn-sm btn-keluar" onclick="logout()"><i class="bi bi-box-arrow-left"></i> Keluar</button>` : `<a class="btn btn-sm btn-masuk" href="#/login"><i class="bi bi-box-arrow-in-right"></i> Masuk</a>`}</li>
</ul></div></div></nav>`;
const foot = () => `<footer class="py-4"><div class="container row mx-auto g-3"><div class="col-md-8"><div class="brand fs-5"><img src="img/logo.png" class="logo">KU- KISS</div>
<small class="text-muted d-block mt-2">${PICKUP_ADDRESS}</small></div>
<div class="col-md-4"><h6 class="text-maroon">Informasi</h6><div class="text-muted small lh-lg"><i class="bi bi-telephone"></i> 0816 5442 005<br><i class="bi bi-envelope"></i> kukiss@gmail.com<br><i class="bi bi-instagram"></i> houseof.kukiss<br><i class="bi bi-facebook"></i> kukiss.official</div></div></div></footer>`;
const PICKUP_ADDRESS = 'Jl. Arumba No.13, Tunggulwulung, Kec. Lowokwaru, Kota Malang, Jawa Timur 65143';
const PICKUP_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PICKUP_ADDRESS)}`;
function orderCancellationEligibility(order) {
  const scheduledValue = order.cancellation_deadline || order.scheduled_date;
  if (!scheduledValue) return { available: false, allowed: false, deadline: null };
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(scheduledValue);
  const normalized = /^\d{4}-\d{2}-\d{2} \d/.test(scheduledValue)
    ? scheduledValue.replace(' ', 'T')
    : scheduledValue;
  const scheduledDate = new Date(normalized);
  if (!Number.isFinite(scheduledDate.getTime())) return { available: false, allowed: false, deadline: null };
  const deadline = order.cancellation_deadline
    ? scheduledDate
    : new Date(scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  if (!order.cancellation_deadline && isDateOnly) deadline.setHours(23, 59, 59, 999);
  const active = !['Selesai', 'Dibatalkan'].includes(order.status);
  return { available: true, allowed: active && Date.now() <= deadline.getTime(), deadline };
}

const customerOrderEvidenceUrl = (id, stage) =>
  `${API_URL}?action=order-evidence&id=${encodeURIComponent(id)}&stage=${encodeURIComponent(stage)}`;

function loadCustomerNotifications() {
  if (customerNotificationsLoaded) return Promise.resolve();
  if (customerNotificationsRequest) return customerNotificationsRequest;
  customerNotificationsRequest = api('notifications').then(data => {
    customerNotificationItems = (data.notifications || []).map(item => ({
      ...item,
      id: Number(item.order_id || 0),
      notificationId: Number(item.id),
      createdAt: item.created_at,
      icon: item.type === 'payment_rejected' ? 'bi-exclamation-circle'
        : item.type === 'order_cancelled' ? 'bi-x-circle'
          : item.type.startsWith('batch_') ? 'bi-calendar-check' : 'bi-receipt'
    }));
    customerNotificationsLoaded = true;
  }).finally(() => {
    customerNotificationsRequest = null;
  });
  return customerNotificationsRequest;
}
let customerNotificationTimer = null;
let customerNotificationRefreshInFlight = false;
function startCustomerNotificationPolling() {
  if (customerNotificationTimer) return;
  customerNotificationTimer = setInterval(async () => {
    if (user?.role !== 'customer' || customerNotificationRefreshInFlight) return;
    customerNotificationRefreshInFlight = true;
    customerNotificationsLoaded = false;
    try {
      await loadCustomerNotifications();
      if (user?.role === 'customer') await render();
    } catch (error) {
      flash(`Notifikasi gagal diperbarui: ${error.message}`);
    } finally {
      customerNotificationRefreshInFlight = false;
    }
  }, 30000);
}
async function openCustomerNotification(notificationId, orderId) {
  try {
    await api('notification-read', { method: 'POST', body: { id: notificationId } });
    customerNotificationsLoaded = false;
    await loadCustomerNotifications();
    location.hash = orderId ? `#/pesanan/${encodeURIComponent(orderId)}` : '#/menu';
  } catch (error) {
    flash(`Notifikasi gagal diperbarui: ${error.message}`);
  }
}
async function markNotificationsRead() {
  try {
    await api('notification-read-all', { method: 'POST', body: {} });
    customerNotificationsLoaded = false;
    await loadCustomerNotifications();
    await render();
  } catch (error) {
    flash(`Notifikasi gagal diperbarui: ${error.message}`);
  }
}
async function refreshCustomerNotifications() {
  customerNotificationsLoaded = false;
  try {
    await loadCustomerNotifications();
    await render();
  } catch (error) {
    flash(`Notifikasi gagal dimuat: ${error.message}`);
  }
}
const pickupLocation = () => `<section class="pickup-location mt-3" aria-labelledby="pickupLocationTitle">
  <h6 id="pickupLocationTitle" class="text-maroon"><i class="bi bi-geo-alt-fill me-1"></i>Lokasi Pengambilan KU-KISS</h6>
  <p class="small mb-2">${PICKUP_ADDRESS}</p>
  <div class="pickup-map mb-2"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(PICKUP_ADDRESS)}&amp;output=embed" title="Peta lokasi pengambilan KU-KISS" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
  <a class="btn btn-outline-maroon btn-sm" href="${PICKUP_MAP_URL}" target="_blank" rel="noopener noreferrer"><i class="bi bi-map me-1"></i>Buka petunjuk arah di Google Maps</a>
</section>`;
const fulfillmentOptions = () => `<div class="fulfillment-options" role="group" aria-label="Pilih metode pengambilan">
  <button type="button" class="fulfillment-option ${mode === 'Pengantaran' ? 'is-selected' : ''}" aria-pressed="${mode === 'Pengantaran'}" onclick="mode='Pengantaran';render()">
    <i class="bi bi-truck"></i><span>Pengantaran</span>
  </button>
  <button type="button" class="fulfillment-option ${mode === 'Pick Up' ? 'is-selected' : ''}" aria-pressed="${mode === 'Pick Up'}" onclick="mode='Pick Up';render()">
    <i class="bi bi-shop"></i><span>Pick Up</span>
  </button>
</div>`;
const site = c => `<div class="d-flex flex-column min-vh-100">${nav()}<main class="container py-4 flex-grow-1">${c}</main>${foot()}</div>`;
const searchBox = (ph, cls = 'mx-auto') => `<div class="search ${cls} mb-4"><i class="bi bi-search"></i><input placeholder="${ph}" value="${q}" onkeydown="if(event.key=='Enter'){q=this.value;location.hash='#/menu';render()}"></div>`;
const list = (ps, btn) => ps.map(p => `<div class="box3d ri hov d-flex align-items-center mb-4" onclick="go(${p.id})"><img class="ri-img" src="${productImage(p.img)}" alt="${p.nama}"><div class="p-3 flex-grow-1 align-self-start"><h6>${p.nama}</h6><p class="text-muted small mb-2">${p.desc}</p><div class="fw-medium">${rp(p.harga)}</div></div>${btn ? `<button class="round-btn me-4" onclick="event.stopPropagation();add(${p.id})"><i class="bi bi-cart-fill"></i></button>` : ''}</div>`).join('');

// ============================================================
// 3. HALAMAN PELANGGAN (home, menu, produk, keranjang, checkout)
// ============================================================
const goToBestSellerBrownies = () => {
  const brownie = products.find(product => /brownie/i.test(product.nama) || /brownie/i.test(product.kat));
  if (brownie) go(brownie.id);
  else location.hash = '#/menu';
};

const P = {
  home: () => searchBox('Cari Disini') + `<div class="row g-4 mb-4"><div class="col-lg-7"><div class="box3d h-100 d-flex align-items-center gap-4 p-4"><img src="img/brownies.png" class="hero-img"><div><h5>Best Seller Brownies</h5><p class="text-muted small">Cokelat pekat yang kaya dan sedikit pahit berpadu dengan tekstur fudgy yang lembut dan lumer, seperti pelukan hangat dalam setiap gigitan. Dipanggang segar dengan penuh cinta, brownies ini siap jadi si manis favorit yang bikin kamu susah bilang cukup di setiap batch Open PO.</p><button class="btn btn-maroon w-100" onclick="goToBestSellerBrownies()">Beli Sekarang</button></div></div></div>
    <div class="col-lg-5"><div class="box3d h-100 p-4 text-center"><h5 class="mb-3">Cookies Terpopuler</h5><div class="popular-list">${[3, 4, 5].map(i => `<button type="button" class="popular-card hov" onclick="go(${i})" aria-label="Lihat ${prod(i).nama}"><img class="pop mb-2" src="${productImage(prod(i).img)}" alt="${prod(i).nama}"><span class="popular-name">${prod(i).nama}</span></button>`).join('')}</div></div></div></div>
    <div class="pill mx-auto my-4">Catalog Menu</div><div class="d-flex gap-4 overflow-auto p-3 catalog-row">${products.map(p => `<div class="box3d cat hov"><img src="${productImage(p.img)}" alt="${p.nama}"><h6 class="my-3 cat-name">${p.nama}</h6><button class="btn btn-maroon btn-sm w-100" onclick="go(${p.id})">Beli Sekarang</button></div>`).join('')}</div>
    <div id="about" class="row g-4 mt-3"><div class="col-lg-8"><div class="box3d h-100 p-4"><h6>ABOUT US</h6><p class="text-muted small">KuKiss lahir dari kecintaan terhadap camilan manis berkualitas. Kami menghadirkan beragam varian soft-baked cookies buatan rumah dengan tekstur renyah di luar dan lembut lumer di dalam, karena kami percaya cookies premium tidak harus menguras kantong. Setiap varian dibuat dengan bahan-bahan pilihan dan resep yang diracik dengan teliti, agar setiap gigitan menghadirkan rasa yang konsisten dan berkesan. Untuk menjaga kesegaran dan cita rasa terbaik, KuKiss dijalankan dengan sistem Open Pre-Order (PO), di mana setiap pesanan dipanggang segar langsung dari oven sehingga tiba di tangan Anda dalam kondisi paling nikmat. Cocok untuk menemani hari-hari Anda, menjadi hadiah istimewa, atau melengkapi momen berkumpul bersama orang tersayang.</p></div></div><div class="col-lg-4"><div class="box3d h-100 p-4 text-center"><img src="img/brownies.png" style="width:200px"></div></div></div>`,
    // Penjelasan about us

  menu: () => searchBox('Cari Menu', 'ms-auto') + (list(products.filter(p => p.nama.toLowerCase().includes(q.toLowerCase()))) || '<p>Tidak ditemukan.</p>'),

  produk: id => { const p = prod(id); if (!p) return P.menu(); return `<div class="box3d ri product-detail d-flex flex-wrap mb-4"><div class="product-detail-image"><img src="${productImage(p.img)}" alt="${p.nama}"></div><div class="p-4 flex-grow-1 product-detail-info" style="min-width:260px"><h4>${p.nama}</h4><p class="text-muted">${p.desc}</p><div class="fs-5 mb-3">${rp(p.harga)}</div>
    <div class="d-flex gap-3"><button class="round-btn" onclick="add(${p.id})"><i class="bi bi-cart-fill"></i></button><button class="btn btn-maroon flex-grow-1" onclick="add(${p.id},1)">Beli Sekarang</button></div></div></div>` + list(products.filter(x => x.id != id), 1); },

  keranjang: () => !cart.length ? `<div class="box3d p-5 text-center"><h5 class="text-maroon">Keranjang masih kosong</h5><a href="#/menu" class="btn btn-maroon mt-2">Lihat Menu</a></div>` :
    cart.map(c => { const p = prod(c.id); return `<div class="box3d p-4 mb-4 d-flex gap-3 align-items-center"><input type="checkbox" class="form-check-input mt-0" style="width:20px;height:20px" ${c.pick ? 'checked' : ''} onchange="pick(${c.id},this.checked)">
      <div class="flex-grow-1"><h6>${p.nama}</h6><p class="text-muted small mb-2">${p.desc}</p><div>${rp(p.harga)}</div></div><div class="text-center"><img src="${productImage(p.img)}" alt="${p.nama}" style="width:110px;height:100px;object-fit:cover"><div class="stepper"><i class="bi bi-dash-circle" onclick="qty(${c.id},-1)"></i>${c.qty}<i class="bi bi-plus-circle" onclick="qty(${c.id},1)"></i></div></div></div>`; }).join('') +
    `<div class="bg-white p-4 rounded-3 box3d"><div class="d-flex justify-content-between mb-3"><span>Total Harga</span><span>${rp(sub())}</span></div><button class="btn btn-maroon w-100 py-2" onclick="toCheckout()">Pesan</button></div>`,

  checkout: () => {
    const items = cart.filter(c => c.pick);
    if (!items.length) return P.keranjang();
    const selectedArea = deliveryAreas.find(area => String(area.id) === String(deliveryArea));
    const ongkir = mode === 'Pengantaran' ? selectedArea?.shipping_fee || 0 : 0;
    const areaOptions = deliveryAreas.map(area =>
      `<option value="${area.id}" ${String(deliveryArea) === String(area.id) ? 'selected' : ''}>${escapeHTML(area.name)}</option>`
    ).join('');
    return `<div class="box3d p-4 mx-auto checkout-card">
      <h5 class="text-maroon">Checkout</h5><h6>Ringkasan Pemesanan</h6>
      ${items.map(c => {
        const p = prod(c.id);
        return `<div class="d-flex gap-3 align-items-center my-3">
          <img src="${productImage(p.img)}" alt="${escapeHTML(p.nama)}" class="checkout-product-image">
          <div class="flex-grow-1"><h6>${escapeHTML(p.nama)}</h6><p class="text-muted small mb-0">${escapeHTML(p.desc.slice(0, 90))}${p.desc.length > 90 ? '...' : ''}</p></div>
          <div class="text-end"><div class="fw-medium">${rp(p.harga)}</div><div class="stepper"><i class="bi bi-dash-circle" onclick="qty(${c.id},-1)"></i>${c.qty}<i class="bi bi-plus-circle" onclick="qty(${c.id},1)"></i></div></div>
        </div>`;
      }).join('')}
      <div class="sec">
        <div class="d-flex justify-content-between mb-2"><span class="chip">Subtotal</span><span class="chip-m">${rp(sub())}</span></div>
        <div class="d-flex justify-content-between"><span class="chip">Ongkos Kirim</span><span class="chip-m">${rp(ongkir)}</span></div>
      </div>
      <div class="sec">
        <h6 class="text-maroon">Metode pengambilan</h6>${fulfillmentOptions()}
        ${mode === 'Pengantaran' ? `
          <label for="deliveryArea" class="form-label fw-medium delivery-area-label">Wilayah pengantaran</label>
          <select id="deliveryArea" class="form-select mb-2" onchange="deliveryArea=this.value;render()" required>
            <option value="">Pilih wilayah</option>${areaOptions}
            <option value="__outside__" ${deliveryArea === '__outside__' ? 'selected' : ''}>Di luar wilayah layanan</option>
          </select>
          ${deliveryAreas.length ? '' : '<div class="alert alert-warning py-2">Tarif wilayah belum tersedia. Silakan hubungi admin.</div>'}
          ${deliveryArea === '__outside__' ? '<div class="alert alert-warning py-2">Layanan pengantaran belum tersedia untuk wilayah tersebut. Pilih Pick Up atau wilayah layanan.</div>' : ''}
          <label for="alamat" class="form-label fw-medium mt-2">Alamat lengkap</label>
          <textarea id="alamat" class="form-control" rows="3" maxlength="900" placeholder="Nama jalan, nomor rumah, RT/RW, dan patokan" oninput="deliveryAddress=this.value">${escapeHTML(deliveryAddress)}</textarea>
          <div class="alert alert-info py-2 mt-3 mb-0"><strong class="checkout-shipping-fee">Ongkir: ${selectedArea ? rp(ongkir) : 'Pilih wilayah untuk melihat tarif'}</strong>${selectedArea ? `<br><small>Tarif wilayah ${escapeHTML(selectedArea.name)}.</small>` : ''}</div>` : `<small class="text-muted">Ambil sendiri di lokasi KU-KISS sesuai jadwal PO.</small>${pickupLocation()}`}
      </div>
      <div class="sec">
        <div class="d-flex justify-content-between align-items-center gap-2 mb-2"><span class="chip">Detail Pembayaran</span><button type="button" class="btn btn-maroon btn-sm" onclick="showQris()"><i class="bi bi-eye"></i> Lihat Kode QRIS</button></div>
        <div class="d-flex align-items-center gap-2"><i class="bi bi-qr-code fs-4 text-maroon"></i><span class="chip px-5">QRIS</span></div>
      </div>
      <div class="sec"><label for="bk" class="chip">Upload Bukti Pembayaran</label><input type="file" id="bk" class="form-control mt-2" accept="image/jpeg,image/png,image/webp" onchange="bukti=true;$('#bkl').textContent=this.files[0].name"><small class="form-text text-muted">Format JPG, PNG, atau WebP.</small></div>
      <div class="d-flex justify-content-between my-3 fw-semibold"><span>Total Pembayaran</span><span>${rp(sub() + ongkir)}</span></div>
      <button class="btn btn-maroon w-100 py-2" onclick="order()" ${mode === 'Pengantaran' && !selectedArea ? 'disabled' : ''}>Buat Pesanan</button>
    </div>`;
  },

  pesanan: id => {
    if (!user) return `<div class="box3d p-5 text-center"><h5>Masuk untuk melihat detail pesanan.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>`;
    const pesanan = orders.find(item => String(item.id) === String(id));
    if (!pesanan) return `<div class="box3d p-5 text-center"><h5 class="text-maroon">Pesanan tidak ditemukan</h5><a href="#/menu" class="btn btn-maroon mt-2">Kembali ke Menu</a></div>`;

    const statusIndex = pesanan.status === 'Dibatalkan' ? -1 : Math.max(0, ST.indexOf(pesanan.status));
    const ongkir = Number(pesanan.ongkir || 0);
    const subtotal = Number(pesanan.subtotal ?? (pesanan.total - ongkir));
    const delivery = pesanan.alamat !== 'Pick Up';
    const statusLabel = delivery && pesanan.status === 'Siap Diambil' ? 'Siap Diantar' : pesanan.status;
    const cancellation = orderCancellationEligibility(pesanan);
    const canOfferCancellation = !['Selesai', 'Dibatalkan'].includes(pesanan.status);
    const cancellationControl = !canOfferCancellation ? ''
      : !cancellation.available
        ? '<div class="alert alert-info mt-3 mb-0">Tanggal atau jadwal pengantaran/pengambilan belum tersedia. Pembatalan belum dapat dihitung; silakan hubungi admin.</div>'
        : cancellation.allowed
          ? `<div class="order-cancel-panel"><p class="small text-muted mb-2">Pembatalan hanya dapat dilakukan paling lambat H-3 sebelum jadwal pesanan (${formatDateTime(cancellation.deadline)}).</p><button type="button" class="btn btn-outline-danger btn-sm" onclick="cancelCustomerOrder(${pesanan.id})"><i class="bi bi-x-circle me-1"></i>Batalkan pesanan</button></div>`
          : `<div class="order-cancel-panel"><button type="button" class="btn btn-outline-secondary btn-sm" disabled><i class="bi bi-lock me-1"></i>Batas pembatalan terlewati</button><p class="small text-muted mt-2 mb-0">Pembatalan hanya dapat dilakukan sampai H-3 sebelum jadwal (${formatDateTime(cancellation.deadline)}).</p></div>`;
    const feedbackDraft = customerFeedbackDrafts[pesanan.id];
    const feedbackComment = typeof feedbackDraft === 'string' ? feedbackDraft : feedbackDraft?.comment || '';
    const feedbackMedia = typeof feedbackDraft === 'object' && feedbackDraft
      ? feedbackDraft.media || feedbackDraft.photo || ''
      : '';
    const feedbackIsVideo = feedbackMedia.startsWith('data:video/');
    const tahap = [
      'Makanan sedang disiapkan',
      delivery ? 'Pesanan siap diantar' : 'Pesanan siap diambil',
      'Makanan telah diterima pembeli'
    ];

    return `<section class="order-page">
      <div class="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
        <h4 class="mb-0">Detail Pesanan #${pesanan.id}</h4>
        <a href="#/riwayat" class="btn btn-outline-maroon btn-sm"><i class="bi bi-arrow-left"></i> Riwayat Pesanan</a>
      </div>
      ${pesanan.payment_status === 'Ditolak'
        ? `<div class="payment-rejection-reason customer-payment-rejection"><span class="badge text-bg-danger mb-2"><i class="bi bi-exclamation-circle me-1"></i>Pembayaran ditolak</span><strong class="d-block mb-1">Alasan</strong><p class="mb-0">${escapeHTML(pesanan.payment_reason || 'Alasan penolakan belum tersedia. Silakan hubungi admin.')}</p></div>`
        : pesanan.payment_status ? `<div class="alert ${pesanan.payment_status === 'Lunas' ? 'alert-success' : 'alert-warning'}">Pembayaran: <strong>${escapeHTML(pesanan.payment_status)}</strong></div>` : ''}
      ${pesanan.status === 'Dibatalkan' ? `<div class="alert alert-danger">Pesanan dibatalkan. Periksa status pembayaran untuk informasi lebih lanjut.${pesanan.cancellation_reason ? `<br><strong>Alasan:</strong> ${escapeHTML(pesanan.cancellation_reason)}` : ''}</div>` : ''}
      <ol class="order-progress" aria-label="Progres pesanan">
        ${tahap.map((label, index) => `<li class="${index <= statusIndex ? 'is-active' : ''} ${index < statusIndex ? 'is-complete' : ''}">
          <span class="order-progress-number">${index < statusIndex ? '<i class="bi bi-check-lg"></i>' : index + 1}</span>
          <span class="order-progress-label">${label}</span>
        </li>`).join('')}
      </ol>
      <div class="order-summary box3d">
        <div class="order-items">
          ${pesanan.items.map(item => `<div class="order-item"><span>${escapeHTML(item.nama)}</span><span class="order-quantity">${item.qty}x</span><span class="order-item-price">${rp(Number(item.harga || 0) * item.qty)}</span></div>`).join('')}
        </div>
        <div class="order-totals">
          <div><span>Total Harga</span><span>${rp(subtotal)}</span></div>
          <div><span>Ongkos Kirim</span><span>${rp(ongkir)}</span></div>
          <div class="order-grand-total"><span>Total Pembayaran</span><span>${rp(pesanan.total)}</span></div>
        </div>
      </div>
      ${delivery
        ? `<div class="order-delivery-address box3d"><h6 class="text-maroon">Alamat Pengantaran</h6><p class="mb-0">${escapeHTML(String(pesanan.alamat || 'Alamat belum tersedia.').replace(/^Wilayah:\s*/i, ''))}</p></div>`
        : `<div class="box3d p-3 p-md-4 mt-3">${pickupLocation()}</div>`}
      ${(pesanan.evidence_before_path || pesanan.evidence_after_path) ? `<section class="box3d order-shipping-evidence mt-3"><h6 class="text-maroon">Bukti proses pesanan</h6><div class="order-evidence-gallery">
        ${pesanan.evidence_before_path ? `<figure class="order-evidence-card"><figcaption>Pesanan disiapkan</figcaption><img class="order-shipping-evidence-image" src="${customerOrderEvidenceUrl(pesanan.id, 'before')}" alt="Bukti pesanan ${pesanan.id} sebelum dikirim" loading="lazy"></figure>` : ''}
        ${pesanan.evidence_after_path ? `<figure class="order-evidence-card"><figcaption>Pesanan selesai dikirim</figcaption><img class="order-shipping-evidence-image" src="${customerOrderEvidenceUrl(pesanan.id, 'after')}" alt="Bukti pesanan ${pesanan.id} setelah dikirim" loading="lazy"></figure>` : ''}
      </div></section>` : ''}
      ${cancellationControl}
      <form class="box3d customer-feedback mt-3" onsubmit="saveCustomerFeedback(event, '${escapeHTML(pesanan.id)}')">
        <h6 class="text-maroon"><i class="bi bi-chat-left-text me-1"></i>Kritik, saran, atau komplain</h6>
        <label for="feedback-${escapeHTML(pesanan.id)}" class="form-label small">Ceritakan tanggapan Anda mengenai pesanan ini.</label>
        <textarea id="feedback-${escapeHTML(pesanan.id)}" class="form-control" rows="4" maxlength="2000" placeholder="Tulis komentar..." required>${escapeHTML(feedbackComment)}</textarea>
        <label for="feedbackMedia-${escapeHTML(pesanan.id)}" class="form-label small mt-3">Foto atau video pendukung (opsional)</label>
        <input id="feedbackMedia-${escapeHTML(pesanan.id)}" class="form-control" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onchange="previewCustomerFeedbackMedia(event)" aria-describedby="feedbackMediaHelp-${escapeHTML(pesanan.id)}">
        <small id="feedbackMediaHelp-${escapeHTML(pesanan.id)}" class="form-text text-muted">Foto JPG/PNG/WebP maks. 1 MB; video MP4/WebM/MOV maks. 2 MB.</small>
        <img id="feedbackMediaImage-${escapeHTML(pesanan.id)}" class="customer-feedback-preview" src="${feedbackIsVideo ? '' : escapeHTML(feedbackMedia)}" alt="Pratinjau foto pendukung" ${feedbackMedia && !feedbackIsVideo ? '' : 'hidden'}>
        <video id="feedbackMediaVideo-${escapeHTML(pesanan.id)}" class="customer-feedback-preview" src="${feedbackIsVideo ? escapeHTML(feedbackMedia) : ''}" controls playsinline ${feedbackIsVideo ? '' : 'hidden'}></video>
        <div class="customer-feedback-note">Masukan akan dikirim ke admin setelah berhasil tersimpan.</div>
        <button type="submit" class="btn btn-outline-maroon btn-sm mt-2">Kirim feedback</button>
      </form>
      <div class="order-aftercare">
        <span class="text-muted small">Status: <strong>${statusLabel}</strong> · Pesanan #${pesanan.id}</span>
        <a href="#/menu" class="btn btn-outline-maroon btn-sm">Kembali ke Menu</a>
      </div>
    </section>`;
  },

  notifikasi: () => !user || user.role !== 'customer'
    ? `<div class="box3d p-5 text-center"><h5>Masuk sebagai pelanggan untuk melihat notifikasi.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>`
    : `<section class="customer-notifications-page">
        <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">
          <div><h4 class="mb-1">Notifikasi</h4><p class="text-muted small mb-0">Pembaruan status pembayaran dan pesanan Anda.</p></div>
          <div class="d-flex gap-2 flex-wrap">
            <button type="button" class="btn btn-outline-maroon btn-sm" onclick="refreshCustomerNotifications()"><i class="bi bi-arrow-clockwise"></i> Perbarui</button>
            ${unreadCustomerNotificationCount() ? '<button type="button" class="btn btn-outline-maroon btn-sm" onclick="markNotificationsRead()">Tandai semua dibaca</button>' : ''}
          </div>
        </div>
        ${customerNotificationItems.length ? `<div class="notification-list">
          ${customerNotificationItems.map(item => {
            const destination = item.id ? `#/pesanan/${encodeURIComponent(item.id)}` : '#/menu';
            const content = `<span class="notification-item-icon"><i class="bi ${item.icon}"></i></span>
              <span class="customer-notification-copy">
                <strong>${escapeHTML(item.title)}</strong>
                <span>${escapeHTML(item.message)}</span>
                <small>${item.id ? `Pesanan #${escapeHTML(item.id)} · ` : ''}${escapeHTML(formatDateTime(item.createdAt))}</small>
              </span>
              <i class="bi bi-chevron-right notification-chevron" aria-hidden="true"></i>`;
                const classes = `customer-notification-item box3d ${item.read_at ? '' : 'is-unread'}`;
                return `<a class="${classes}" href="${destination}" onclick="openCustomerNotification(${item.notificationId},${item.id});return false">${content}</a>`;
          }).join('')}
        </div>` : '<div class="box3d p-4 text-center text-muted">Belum ada pembaruan pesanan.</div>'}
        <div class="notification-integrations box3d mt-4">
              <p class="mb-0"><i class="bi bi-info-circle me-1"></i>Notifikasi tersimpan di akun Anda dan ditampilkan di aplikasi ini.</p>
        </div>
      </section>`,

  feedback: () => !user || user.role !== 'customer'
    ? `<div class="box3d p-5 text-center"><h5>Masuk sebagai pelanggan untuk mengirim feedback.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>`
    : `<section class="box3d customer-feedback-page p-4 p-md-5">
        <div class="mb-4"><h4 class="text-maroon">Kritik, Saran, dan Masukan</h4><p class="text-muted mb-0">Bantu kami meningkatkan layanan KU-KISS.</p></div>
        <form onsubmit="saveFeedback(event)">
          <label for="feedbackOrder" class="form-label">Pesanan terkait <span class="text-muted">(opsional)</span></label>
          <select id="feedbackOrder" class="form-select mb-3"><option value="">Masukan umum</option>${orders.map(order => `<option value="${order.id}">Pesanan #${order.id} · ${formatDateTime(order.tgl)}</option>`).join('')}</select>
          <label for="feedbackMessage" class="form-label">Pesan</label>
          <textarea id="feedbackMessage" class="form-control" rows="6" maxlength="2000" placeholder="Tuliskan kritik, saran, atau masukan..." required></textarea>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mt-3"><small class="text-muted">Maksimal 2.000 karakter.</small><button type="submit" class="btn btn-maroon"><i class="bi bi-send me-1"></i>Kirim feedback</button></div>
        </form>
      </section>`,

  riwayat: () => !user ? `<div class="box3d p-5 text-center"><h5>Masuk untuk melihat riwayat pesanan.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>` :
    `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h4>Riwayat Pesanan</h4><a href="#/menu" class="btn btn-outline-maroon btn-sm">Belanja lagi</a></div>
    ${orders.length ? orders.map(order => `<article class="box3d p-3 p-md-4 mb-3">
      <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        <div><strong>Pesanan #${order.id}</strong><div class="text-muted small">${formatDateTime(order.tgl)}</div></div>
        <span class="badge ${order.payment_status === 'Lunas' ? 'text-bg-success' : order.payment_status === 'Ditolak' ? 'text-bg-danger' : 'text-bg-warning'}">${order.payment_status || order.status}</span>
      </div>
      <div class="my-3">${order.items.map(item => `<div class="d-flex justify-content-between gap-2"><span>${item.nama} × ${item.qty}</span><span>${rp(item.harga * item.qty)}</span></div>`).join('')}</div>
      <div class="d-flex justify-content-between align-items-center border-top pt-3 gap-2 flex-wrap">
        <strong>Total ${rp(order.total)}</strong><a href="#/pesanan/${order.id}" class="btn btn-maroon btn-sm">Lihat progres pesanan</a>
      </div>
    </article>`).join('') : '<div class="box3d p-5 text-center text-muted">Belum ada pesanan.</div>'}`,

  login: () => `<section class="auth-card box3d">
    <div class="auth-brand">
      <img src="img/logo.png" alt="Logo cookies KU-KISS" class="auth-illustration">
      <h2>KU-KISS</h2>
    </div>
    <div class="auth-form-wrap">
      <h1 class="auth-title">Masuk</h1>
      <form onsubmit="doLogin(event)" class="auth-form">
        <label for="em" class="fw-medium">Email atau Username</label>
        <input id="em" type="text" class="form-control auth-input" placeholder="Masukkan Email atau Username" autocomplete="username" required>
        <label for="pw" class="fw-medium mt-3">Password</label>
        <div class="input-group auth-password">
          <input id="pw" type="password" class="form-control auth-input" placeholder="Masukkan Password" autocomplete="current-password" required>
          <button type="button" class="btn auth-eye" aria-label="Tampilkan password" onclick="toggleAuthPassword('pw', this)"><i class="bi bi-eye"></i></button>
        </div>
        <button class="btn btn-maroon auth-submit mt-3" type="submit">Login</button>
        <p class="text-center auth-switch">Belum punya akun? <a href="#/daftar" class="text-maroon text-decoration-none">Daftar</a></p>
      </form>
    </div>
  </section>`,

  daftar: () => `<section class="auth-card box3d">
    <div class="auth-brand">
      <img src="img/logo.png" alt="Logo cookies KU-KISS" class="auth-illustration">
      <h2>KU-KISS</h2>
    </div>
    <div class="auth-form-wrap">
      <h1 class="auth-title">Daftar</h1>
      <form onsubmit="doRegister(event)" class="auth-form auth-register-form">
        <label for="regNama" class="fw-medium">Nama Lengkap</label>
        <input id="regNama" type="text" class="form-control auth-input" placeholder="Masukkan Nama Lengkap" autocomplete="name" required>
        <label for="regEmail" class="fw-medium mt-3">Email</label>
        <input id="regEmail" type="email" class="form-control auth-input" placeholder="Masukkan Email" autocomplete="email" required>
        <label for="regPw" class="fw-medium mt-3">Password</label>
        <div class="input-group auth-password">
          <input id="regPw" type="password" minlength="10" class="form-control auth-input" placeholder="Masukkan Password (min. 10 karakter)" autocomplete="new-password" required>
          <button type="button" class="btn auth-eye" aria-label="Tampilkan password" onclick="toggleAuthPassword('regPw', this)"><i class="bi bi-eye"></i></button>
        </div>
        <label for="regPhone" class="fw-medium mt-3">Nomor Handphone</label>
        <input id="regPhone" type="tel" class="form-control auth-input" placeholder="Masukkan Nomor Handphone" autocomplete="tel" required>
        <button class="btn btn-maroon auth-submit mt-3" type="submit">Daftar</button>
        <p class="text-center auth-switch">Sudah punya akun? <a href="#/login" class="text-maroon text-decoration-none">Masuk</a></p>
      </form>
    </div>
  </section>`,

  profil: () => {
    if (!user) return `<div class="box3d p-5 text-center"><h5>Silakan masuk terlebih dahulu.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>`;
    return `<div class="box3d profile-card">
      <div class="profile-heading"><img src="${user.foto ? productImage(user.foto) : 'img/profile.png'}" alt="Foto profil" class="profile-avatar"><h4>${user.nama}</h4></div>
      <form class="profile-body" onsubmit="saveProfile(event)">
        <div class="profile-fields">
          <div class="profile-edit-row">
            <span class="profile-edit-label">Nama Lengkap</span>
            <span class="profile-edit-value" id="profileNamaValue">${user.nama || '-'}</span>
            <input class="form-control profile-edit-input" id="profileNama" value="${user.nama || ''}" required hidden>
            <button type="button" class="btn btn-sm btn-outline-maroon profile-edit-button" onclick="editProfileField('Nama')">Edit</button>
          </div>
          <div class="profile-edit-row">
            <span class="profile-edit-label">Email</span>
            <span class="profile-edit-value">${user.email}</span>
          </div>
          <div class="profile-edit-row">
            <span class="profile-edit-label">Nomor Handphone</span>
            <span class="profile-edit-value" id="profileTeleponValue">${user.telepon || '-'}</span>
            <input class="form-control profile-edit-input" id="profileTelepon" type="tel" value="${user.telepon || ''}" placeholder="Masukkan nomor handphone" hidden>
            <button type="button" class="btn btn-sm btn-outline-maroon profile-edit-button" onclick="editProfileField('Telepon')">Edit</button>
          </div>
        </div>
        <div class="profile-photo"><img id="profilePreview" src="${user.foto ? productImage(user.foto) : 'img/profile.png'}" alt="Foto profil"><label class="btn btn-sm btn-maroon">Ubah Foto<input id="profileFoto" type="file" accept="image/jpeg,image/png,image/webp" hidden onchange="saveProfilePhoto(event)"></label>${user.foto ? '<button type="button" class="btn btn-sm btn-outline-danger" onclick="removeProfilePhoto()">Hapus Foto</button>' : ''}</div>
        <div class="text-end mt-4"><button id="profileSaveButton" class="btn btn-maroon" type="submit" hidden>Simpan Perubahan</button></div>
      </form>
      <div class="text-end px-3 pb-3"><button class="btn btn-outline-maroon btn-sm" type="button" onclick="changePasswordDialog()">Ubah Password</button></div>
    </div>`;
  }
};

// ============================================================
