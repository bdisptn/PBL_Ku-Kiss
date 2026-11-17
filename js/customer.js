// 2. KOMPONEN TAMPILAN PELANGGAN (navbar, footer, pencarian)
// ============================================================
const nav = () => `<nav class="navbar navbar-expand-lg bg-white nav-3d sticky-top"><div class="container">
<a class="navbar-brand brand" href="#/"><img src="img/logo.png" class="logo">KU-KISS</a>
<button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nv"><span class="navbar-toggler-icon"></span></button>
<div id="nv" class="collapse navbar-collapse"><ul class="navbar-nav ms-auto align-items-lg-center gap-lg-4">
${[['', 'house', 'Home'], ['menu', 'journal-text', 'Menu'], ['keranjang', 'cart-fill', 'Keranjang'], ['about', 'info-circle', 'About Us']].map(([h, i, t]) => `<li><a class="nav-link" href="#/${h}"><i class="bi bi-${i}"></i> ${t}</a></li>`).join('')}
${user?.role === 'customer' ? '<li><a class="nav-link" href="#/riwayat"><i class="bi bi-receipt"></i> Pesanan Saya</a></li>' : ''}
<li><a href="${user ? '#/profil' : '#/login'}" class="text-decoration-none" title="Profil">${user?.foto ? `<img src="${productImage(user.foto)}" alt="Foto profil" class="nav-profile-avatar">` : '<i class="bi bi-person-circle avatar"></i>'}</a></li>
<li>${user ? `<button class="btn btn-sm btn-keluar" onclick="logout()"><i class="bi bi-box-arrow-left"></i> Keluar</button>` : `<a class="btn btn-sm btn-masuk" href="#/login"><i class="bi bi-box-arrow-in-right"></i> Masuk</a>`}</li>
</ul></div></div></nav>`;
const foot = () => `<footer class="py-4"><div class="container row mx-auto g-3"><div class="col-md-8"><div class="brand fs-5"><img src="img/logo.png" class="logo">KU- KISS</div>
<small class="text-muted d-block mt-2">${PICKUP_ADDRESS}</small></div>
<div class="col-md-4"><h6 class="text-maroon">Informasi</h6><div class="text-muted small lh-lg"><i class="bi bi-telephone"></i> 081234567890<br><i class="bi bi-envelope"></i> kukiss@yahoo.co.id<br><i class="bi bi-instagram"></i> kukissmaniez<br><i class="bi bi-facebook"></i> kukiss</div></div></div></footer>`;
const PICKUP_ADDRESS = 'Jl. Arumba No.13, Tunggulwulung, Kec. Lowokwaru, Kota Malang, Jawa Timur 65143';
const PICKUP_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PICKUP_ADDRESS)}`;
const pickupLocation = () => `<section class="pickup-location mt-3" aria-labelledby="pickupLocationTitle">
  <h6 id="pickupLocationTitle" class="text-maroon"><i class="bi bi-geo-alt-fill me-1"></i>Lokasi Pengambilan KU-KISS</h6>
  <p class="small mb-2">${PICKUP_ADDRESS}</p>
  <div class="pickup-map mb-2"><iframe src="https://maps.google.com/maps?q=${encodeURIComponent(PICKUP_ADDRESS)}&amp;output=embed" title="Peta lokasi pengambilan KU-KISS" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
  <a class="btn btn-outline-maroon btn-sm" href="${PICKUP_MAP_URL}" target="_blank" rel="noopener noreferrer"><i class="bi bi-map me-1"></i>Buka petunjuk arah di Google Maps</a>
</section>`;
const site = c => `<div class="d-flex flex-column min-vh-100">${nav()}<main class="container py-4 flex-grow-1">${c}</main>${foot()}</div>`;
const searchBox = (ph, cls = 'mx-auto') => `<div class="search ${cls} mb-4"><i class="bi bi-search"></i><input placeholder="${ph}" value="${q}" onkeydown="if(event.key=='Enter'){q=this.value;location.hash='#/menu';render()}"></div>`;
const list = (ps, btn) => ps.map(p => `<div class="box3d ri hov d-flex align-items-center mb-4" onclick="go(${p.id})"><img class="ri-img" src="${productImage(p.img)}" alt="${p.nama}"><div class="p-3 flex-grow-1"><h6>${p.nama}</h6><p class="text-muted small mb-2">${p.desc}</p><div class="fw-medium">${rp(p.harga)}</div></div>${btn ? `<button class="round-btn me-4" onclick="event.stopPropagation();add(${p.id})"><i class="bi bi-cart-fill"></i></button>` : ''}</div>`).join('');

// ============================================================
// 3. HALAMAN PELANGGAN (home, menu, produk, keranjang, checkout)
// ============================================================
const P = {
  home: () => searchBox('Cari Disini') + `<div class="row g-4 mb-4"><div class="col-lg-7"><div class="box3d h-100 d-flex align-items-center gap-4 p-4"><img src="img/matcha.jpg" class="hero-img"><div><h5>Best Cookies Varian Matcha</h5><p class="text-muted small">${L}</p><button class="btn btn-maroon w-100" onclick="go(1)">Beli Sekarang</button></div></div></div>
    <div class="col-lg-5"><div class="box3d h-100 p-4 text-center"><h5 class="mb-3">Cookies Terpopuler</h5><div class="popular-list">${[3, 4, 5].map(i => `<button type="button" class="popular-card hov" onclick="go(${i})" aria-label="Lihat ${prod(i).nama}"><img class="pop mb-2" src="${productImage(prod(i).img)}" alt="${prod(i).nama}"><span class="popular-name">${prod(i).nama}</span></button>`).join('')}</div></div></div></div>
    <div class="pill mx-auto my-4">Catalog Menu</div><div class="d-flex gap-4 overflow-auto p-3 catalog-row">${products.map(p => `<div class="box3d cat hov"><img src="${productImage(p.img)}" alt="${p.nama}"><h6 class="my-3 cat-name">${p.nama}</h6><button class="btn btn-maroon btn-sm w-100" onclick="go(${p.id})">Beli Sekarang</button></div>`).join('')}</div>
    <div id="about" class="row g-4 mt-3"><div class="col-lg-8"><div class="box3d h-100 p-4"><h6>ABOUT US</h6><p class="text-muted small">${(L + ' ').repeat(5)}</p></div></div><div class="col-lg-4"><div class="box3d h-100 p-4 text-center"><img src="img/matcha.jpg" style="width:200px"></div></div></div>`,

  menu: () => searchBox('Cari Menu', 'ms-auto') + (list(products.filter(p => p.nama.toLowerCase().includes(q.toLowerCase()))) || '<p>Tidak ditemukan.</p>'),

  produk: id => { const p = prod(id); if (!p) return P.menu(); return `<div class="box3d ri product-detail d-flex flex-wrap mb-4"><div class="product-detail-image"><img src="${productImage(p.img)}" alt="${p.nama}"></div><div class="p-4 flex-grow-1 product-detail-info" style="min-width:260px"><h4>${p.nama}</h4><p class="text-muted">${p.desc}</p><div class="fs-5 mb-3">${rp(p.harga)}</div>
    <div class="d-flex gap-3"><button class="round-btn" onclick="add(${p.id})"><i class="bi bi-cart-fill"></i></button><button class="btn btn-maroon flex-grow-1" onclick="add(${p.id},1)">Beli Sekarang</button></div></div></div>` + list(products.filter(x => x.id != id), 1); },

  keranjang: () => !cart.length ? `<div class="box3d p-5 text-center"><h5 class="text-maroon">Keranjang masih kosong</h5><a href="#/menu" class="btn btn-maroon mt-2">Lihat Menu</a></div>` :
    cart.map(c => { const p = prod(c.id); return `<div class="box3d p-4 mb-4 d-flex gap-3 align-items-center"><input type="checkbox" class="form-check-input mt-0" style="width:20px;height:20px" ${c.pick ? 'checked' : ''} onchange="pick(${c.id},this.checked)">
      <div class="flex-grow-1"><h6>${p.nama}</h6><p class="text-muted small mb-2">${p.desc}</p><div>${rp(p.harga)}</div></div><div class="text-center"><img src="${productImage(p.img)}" alt="${p.nama}" style="width:110px;height:100px;object-fit:cover"><div class="stepper"><i class="bi bi-dash-circle" onclick="qty(${c.id},-1)"></i>${c.qty}<i class="bi bi-plus-circle" onclick="qty(${c.id},1)"></i></div></div></div>`; }).join('') +
    `<div class="bg-white p-4 rounded-3 box3d"><div class="d-flex justify-content-between mb-3"><span>Total Harga</span><span>${rp(sub())}</span></div><button class="btn btn-maroon w-100 py-2" onclick="toCheckout()">Pesan</button></div>`,

  checkout: () => { const items = cart.filter(c => c.pick); if (!items.length) return P.keranjang(); const ongkir = mode == 'Pengantaran' ? ship : 0;
    return `<div class="box3d p-4 mx-auto" style="max-width:640px"><h6>Ringkasan Pemesanan</h6>${items.map(c => { const p = prod(c.id); return `<div class="d-flex gap-3 align-items-center my-3"><img src="${productImage(p.img)}" alt="${p.nama}" style="width:120px;height:110px;object-fit:cover"><div class="flex-grow-1"><h6>${p.nama}</h6><p class="text-muted small mb-0">${p.desc.slice(0, 90)}...</p></div><div class="text-end"><div class="fw-medium">${rp(p.harga)}</div><div class="stepper"><i class="bi bi-dash-circle" onclick="qty(${c.id},-1)"></i>${c.qty}<i class="bi bi-plus-circle" onclick="qty(${c.id},1)"></i></div></div></div>`; }).join('')}
    <div class="sec"><div class="d-flex justify-content-between mb-2"><span class="chip w-50">Total Pembayaran</span><span class="chip-m w-25">${rp(sub())}</span></div><div class="d-flex justify-content-between"><span class="chip w-50">Total Ongkos Kirim</span><span class="chip-m w-25">${rp(ongkir)}</span></div></div>
    <div class="sec"><div class="d-flex justify-content-center gap-3 mb-2">${['Pengantaran', 'Pick Up'].map(t => `<span class="tab ${t == mode ? 'on' : ''}" onclick="mode='${t}';render()">${t}</span>`).join('')}</div>
    ${mode == 'Pengantaran' ? `<div class="opt ${ship == 5000 ? 'on' : ''}" onclick="ship=5000;render()"><span>Standard</span><span>Rp 5.000,00</span></div><div class="opt ${ship == 3000 ? 'on' : ''}" onclick="ship=3000;render()"><span>Hemat</span><span>Rp 3.000,00</span></div><input id="alamat" class="form-control mt-2" placeholder="Alamat pengantaran">` : `<small class="text-muted">Ambil sendiri di lokasi KU-KISS sesuai jadwal PO.</small>${pickupLocation()}`}</div>
    <div class="sec"><div class="d-flex justify-content-between align-items-center gap-2 mb-2"><span class="chip">Detail Pembayaran</span><button type="button" class="btn btn-maroon btn-sm" onclick="showQris()"><i class="bi bi-eye"></i> Lihat Kode QRIS Disini</button></div><div class="d-flex align-items-center gap-2"><i class="bi bi-qr-code fs-4 text-maroon"></i><span class="chip px-5">QRIS</span></div></div>
    <div class="sec"><span class="chip">Upload Bukti Pembayaran</span><input type="file" id="bk" class="d-none" accept="image/*" onchange="bukti=true;$('#bkl').textContent=this.files[0].name"><button class="btn btn-maroon w-100 mt-2" onclick="$('#bk').click()"><i class="bi bi-upload"></i> <span id="bkl">Upload Disini</span></button></div>
    <div class="d-flex justify-content-between my-3"><span>Total Harga</span><span>${rp(sub() + ongkir)}</span></div><button class="btn btn-maroon w-100 py-2" onclick="order()">Pesan</button></div>`; },

  pesanan: id => {
    if (!user) return `<div class="box3d p-5 text-center"><h5>Masuk untuk melihat detail pesanan.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>`;
    const pesanan = orders.find(item => String(item.id) === String(id));
    if (!pesanan) return `<div class="box3d p-5 text-center"><h5 class="text-maroon">Pesanan tidak ditemukan</h5><a href="#/menu" class="btn btn-maroon mt-2">Kembali ke Menu</a></div>`;

    const statusIndex = pesanan.status === 'Dibatalkan' ? -1 : Math.max(0, ST.indexOf(pesanan.status));
    const ongkir = Number(pesanan.ongkir || 0);
    const subtotal = Number(pesanan.subtotal ?? (pesanan.total - ongkir));
    const delivery = pesanan.alamat !== 'Pick Up';
    const statusLabel = delivery && pesanan.status === 'Siap Diambil' ? 'Siap Diantar' : pesanan.status;
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
      ${pesanan.payment_status ? `<div class="alert ${pesanan.payment_status === 'Lunas' ? 'alert-success' : pesanan.payment_status === 'Ditolak' ? 'alert-danger' : 'alert-warning'}">Pembayaran: <strong>${pesanan.payment_status}</strong></div>` : ''}
      ${pesanan.status === 'Dibatalkan' ? '<div class="alert alert-danger">Pesanan dibatalkan. Bukti Pembayaran tidak dapat diverifikasi.</div>' : ''}
      <ol class="order-progress" aria-label="Progres pesanan">
        ${tahap.map((label, index) => `<li class="${index <= statusIndex ? 'is-active' : ''} ${index < statusIndex ? 'is-complete' : ''}">
          <span class="order-progress-number">${index < statusIndex ? '<i class="bi bi-check-lg"></i>' : index + 1}</span>
          <span class="order-progress-label">${label}</span>
        </li>`).join('')}
      </ol>
      <div class="order-summary box3d">
        <div class="order-items">
          ${pesanan.items.map(item => `<div class="order-item"><span>${item.nama}</span><span class="order-quantity">${item.qty}x</span><span class="order-item-price">${rp(Number(item.harga || 0) * item.qty)}</span></div>`).join('')}
        </div>
        <div class="order-totals">
          <div><span>Total Harga</span><span>${rp(subtotal)}</span></div>
          <div><span>Ongkos Kirim</span><span>${rp(ongkir)}</span></div>
          <div class="order-grand-total"><span>Total Pembayaran</span><span>${rp(pesanan.total)}</span></div>
        </div>
      </div>
      ${delivery ? '' : `<div class="box3d p-3 p-md-4 mt-3">${pickupLocation()}</div>`}
      <div class="order-aftercare">
        <span class="text-muted small">Status: <strong>${statusLabel}</strong> · Pesanan #${pesanan.id}</span>
        <a href="#/menu" class="btn btn-outline-maroon btn-sm">Kembali ke Menu</a>
      </div>
    </section>`;
  },

  riwayat: () => !user ? `<div class="box3d p-5 text-center"><h5>Masuk untuk melihat riwayat pesanan.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>` :
    `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h4>Riwayat Pesanan</h4><a href="#/menu" class="btn btn-outline-maroon btn-sm">Belanja lagi</a></div>
    ${orders.length ? orders.map(order => `<article class="box3d p-3 p-md-4 mb-3">
      <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        <div><strong>Pesanan #${order.id}</strong><div class="text-muted small">${order.tgl}</div></div>
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
