// ============================================================
// 1. HELPER DAN DATA AWAL
// Data demo disimpan di localStorage. Nanti bagian ini bisa diganti API backend.
// ============================================================
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const rp = n => 'Rp ' + Number(n).toLocaleString('id-ID') + ',00';
const load = (k, d) => JSON.parse(localStorage.getItem(k) || 'null') || d, save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusod tempor incididunt ut labore et dolore magna aliqua. Quis ipsu msuspendisse';
const flash = m => { const d = document.createElement('div'); d.id = 'flash'; d.textContent = m; document.body.append(d); setTimeout(() => d.remove(), 1600); };
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const YM = new Date().toISOString().slice(0, 7);

let products = load('products', [
  { id: 1, kode: 'COO:MAT-001', nama: 'Cookies Varian Matcha', desc: L, harga: 15000, kat: 'Cookies', stok: 50, img: 'matcha.png' },
  { id: 2, kode: 'COO:BIS-001', nama: 'Cookies Varian Biscoff', desc: L, harga: 15000, kat: 'Cookies', stok: 2, img: 'biscoff.png' },
  { id: 3, kode: 'COO:RED-001', nama: 'Cookies Varian Red Velvet', desc: L, harga: 15000, kat: 'Cookies', stok: 4, img: 'redvelvet.png' },
  { id: 4, kode: 'COO:PIS-001', nama: 'Cookies Varian Pistachio', desc: L, harga: 15000, kat: 'Cookies', stok: 3, img: 'pistachio.png' },
  { id: 5, kode: 'COO:ORE-001', nama: 'Cookies Varian Oreo', desc: L, harga: 15000, kat: 'Cookies', stok: 100, img: 'oreo.jpg' }]);
// Menyesuaikan data produk demo yang mungkin sudah tersimpan di localStorage.
products = products.map(p => {
  if (p.id === 1) p.img = 'matcha.png';
  if (p.id === 2) {
    p.nama = 'Cookies Varian Biscoff';
    p.img = 'biscoff.png';
  }
  if (p.id === 3) p.img = 'redvelvet.png';
  if (p.id === 4) p.img = 'pistachio.png';
  return p;
});
save('products', products);

let cats = load('cats', [{ kode: 'COO:MAT-001', nama: 'Cookies' }, { kode: 'BRO:MAT-001', nama: 'Browniez' }]);
const seedO = [['2026-06', 85000], ['2026-07', 120000], ['2026-08', 95000], ['2026-09', 150000], ['2026-10', 85000]];
let orders = load('orders', seedO.map(([m, t], i) => ({ id: i + 1, nama: 'Marcello Artasda', telepon: '08231474411', items: [{ nama: 'Cookies Varian Matcha', qty: 3 }, { nama: 'Cookies Varian Oreo', qty: 1 }], total: t, alamat: 'Jl Pisang Kipas No 70', tgl: m + '-10 09:30:33', bukti: i < 3, status: 'Diproses' })));
let outs = load('outs', [['2026-06', 40000], ['2026-07', 50000], ['2026-08', 30000], ['2026-09', 60000], ['2026-10', 25000]].map(([bulan, jumlah], i) => ({ id: i + 1, bulan, jumlah })));
let cart = load('cart', []), user = load('user', null);
let q = '', mode = 'Pengantaran', ship = 5000, bukti = false;
const prod = id => products.find(p => p.id == id);
const go = id => location.hash = '#/produk/' + id;

// ============================================================
// 2. KOMPONEN TAMPILAN PELANGGAN (navbar, footer, pencarian)
// ============================================================
const nav = () => `<nav class="navbar navbar-expand-lg bg-white nav-3d sticky-top"><div class="container">
<a class="navbar-brand brand" href="#/"><img src="img/logo.png" class="logo">KU-KISS</a>
<button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#nv"><span class="navbar-toggler-icon"></span></button>
<div id="nv" class="collapse navbar-collapse"><ul class="navbar-nav ms-auto align-items-lg-center gap-lg-4">
${[['', 'house', 'Home'], ['menu', 'journal-text', 'Menu'], ['keranjang', 'cart-fill', 'Keranjang'], ['about', 'info-circle', 'About Us']].map(([h, i, t]) => `<li><a class="nav-link" href="#/${h}"><i class="bi bi-${i}"></i> ${t}</a></li>`).join('')}
<li><a href="${user ? '#/profil' : '#/login'}" class="text-decoration-none" title="Profil"><i class="bi bi-person-circle avatar"></i></a></li>
<li>${user ? `<button class="btn btn-sm btn-keluar" onclick="logout()"><i class="bi bi-box-arrow-left"></i> Keluar</button>` : `<a class="btn btn-sm btn-masuk" href="#/login"><i class="bi bi-box-arrow-in-right"></i> Masuk</a>`}</li>
</ul></div></div></nav>`;
const foot = () => `<footer class="py-4"><div class="container row mx-auto g-3"><div class="col-md-8"><div class="brand fs-5"><img src="img/logo.png" class="logo">KU- KISS</div>
<small class="text-muted d-block mt-2">Jl. Ki Mangun Sarkoro No.VI/3, Dusun Talun, Beji,<br>Kec. Boyolangu, Kabupaten Tulungagung, Jawa Timur 66233</small></div>
<div class="col-md-4"><h6 class="text-maroon">Informasi</h6><div class="text-muted small lh-lg"><i class="bi bi-telephone"></i> 081234567890<br><i class="bi bi-envelope"></i> kukiss@yahoo.co.id<br><i class="bi bi-instagram"></i> kukissmaniez<br><i class="bi bi-facebook"></i> kukiss</div></div></div></footer>`;
const site = c => `<div class="d-flex flex-column min-vh-100">${nav()}<main class="container py-4 flex-grow-1">${c}</main>${foot()}</div>`;
const searchBox = (ph, cls = 'mx-auto') => `<div class="search ${cls} mb-4"><i class="bi bi-search"></i><input placeholder="${ph}" value="${q}" onkeydown="if(event.key=='Enter'){q=this.value;location.hash='#/menu';render()}"></div>`;
const list = (ps, btn) => ps.map(p => `<div class="box3d ri hov d-flex align-items-center mb-4" onclick="go(${p.id})"><img class="ri-img" src="img/${p.img}"><div class="p-3 flex-grow-1"><h6>${p.nama}</h6><p class="text-muted small mb-2">${p.desc}</p><div class="fw-medium">${rp(p.harga)}</div></div>${btn ? `<button class="round-btn me-4" onclick="event.stopPropagation();add(${p.id})"><i class="bi bi-cart-fill"></i></button>` : ''}</div>`).join('');

// ============================================================
// 3. HALAMAN PELANGGAN (home, menu, produk, keranjang, checkout)
// ============================================================
const P = {
  home: () => searchBox('Cari Disini') + `<div class="row g-4 mb-4"><div class="col-lg-7"><div class="box3d h-100 d-flex align-items-center gap-4 p-4"><img src="img/matcha.jpg" class="hero-img"><div><h5>Best Cookies Varian Matcha</h5><p class="text-muted small">${L}</p><button class="btn btn-maroon w-100" onclick="go(1)">Beli Sekarang</button></div></div></div>
    <div class="col-lg-5"><div class="box3d h-100 p-4 text-center"><h5 class="mb-3">Cookies Terpopuler</h5><div class="d-flex justify-content-around">${[3, 4, 5].map(i => `<div class="small hov" onclick="go(${i})"><img class="pop mb-2" src="img/${prod(i).img}"><br>${prod(i).nama.replace('Varian ', 'Varian<br>')}</div>`).join('')}</div></div></div></div>
    <div class="pill mx-auto my-4">Catalog Menu</div><div class="d-flex gap-4 overflow-auto p-3">${products.map(p => `<div class="box3d cat hov"><img src="img/${p.img}"><h6 class="my-3">${p.nama}</h6><button class="btn btn-maroon btn-sm w-100" onclick="go(${p.id})">Beli Sekarang</button></div>`).join('')}</div>
    <div id="about" class="row g-4 mt-3"><div class="col-lg-8"><div class="box3d h-100 p-4"><h6>ABOUT US</h6><p class="text-muted small">${(L + ' ').repeat(5)}</p></div></div><div class="col-lg-4"><div class="box3d h-100 p-4 text-center"><img src="img/matcha.jpg" style="width:200px"></div></div></div>`,

  menu: () => searchBox('Cari Menu', 'ms-auto') + (list(products.filter(p => p.nama.toLowerCase().includes(q.toLowerCase()))) || '<p>Tidak ditemukan.</p>'),

  produk: id => { const p = prod(id); if (!p) return P.menu(); return `<div class="box3d ri d-flex flex-wrap mb-4"><img src="img/${p.img}" style="width:340px;max-width:100%;object-fit:cover"><div class="p-4 flex-grow-1" style="min-width:260px"><h4>${p.nama}</h4><p class="text-muted">${p.desc}</p><div class="fs-5 mb-3">${rp(p.harga)}</div>
    <div class="d-flex gap-3"><button class="round-btn" onclick="add(${p.id})"><i class="bi bi-cart-fill"></i></button><button class="btn btn-maroon flex-grow-1" onclick="add(${p.id},1)">Beli Sekarang</button></div></div></div>` + list(products.filter(x => x.id != id), 1); },

  keranjang: () => !cart.length ? `<div class="box3d p-5 text-center"><h5 class="text-maroon">Keranjang masih kosong</h5><a href="#/menu" class="btn btn-maroon mt-2">Lihat Menu</a></div>` :
    cart.map(c => { const p = prod(c.id); return `<div class="box3d p-4 mb-4 d-flex gap-3 align-items-center"><input type="checkbox" class="form-check-input mt-0" style="width:20px;height:20px" ${c.pick ? 'checked' : ''} onchange="pick(${c.id},this.checked)">
      <div class="flex-grow-1"><h6>${p.nama}</h6><p class="text-muted small mb-2">${p.desc}</p><div>${rp(p.harga)}</div></div><div class="text-center"><img src="img/${p.img}" style="width:110px;height:100px;object-fit:cover"><div class="stepper"><i class="bi bi-dash-circle" onclick="qty(${c.id},-1)"></i>${c.qty}<i class="bi bi-plus-circle" onclick="qty(${c.id},1)"></i></div></div></div>`; }).join('') +
    `<div class="bg-white p-4 rounded-3 box3d"><div class="d-flex justify-content-between mb-3"><span>Total Harga</span><span>${rp(sub())}</span></div><button class="btn btn-maroon w-100 py-2" onclick="toCheckout()">Pesan</button></div>`,

  checkout: () => { const items = cart.filter(c => c.pick); if (!items.length) return P.keranjang(); const ongkir = mode == 'Pengantaran' ? ship : 0;
    return `<div class="box3d p-4 mx-auto" style="max-width:640px"><h6>Ringkasan Pemesanan</h6>${items.map(c => { const p = prod(c.id); return `<div class="d-flex gap-3 align-items-center my-3"><img src="img/${p.img}" style="width:120px;height:110px;object-fit:cover"><div class="flex-grow-1"><h6>${p.nama}</h6><p class="text-muted small mb-0">${p.desc.slice(0, 90)}...</p></div><div class="text-end"><div class="fw-medium">${rp(p.harga)}</div><div class="stepper"><i class="bi bi-dash-circle" onclick="qty(${c.id},-1)"></i>${c.qty}<i class="bi bi-plus-circle" onclick="qty(${c.id},1)"></i></div></div></div>`; }).join('')}
    <div class="sec"><div class="d-flex justify-content-between mb-2"><span class="chip w-50">Total Pembayaran</span><span class="chip-m w-25">${rp(sub())}</span></div><div class="d-flex justify-content-between"><span class="chip w-50">Total Ongkos Kirim</span><span class="chip-m w-25">${rp(ongkir)}</span></div></div>
    <div class="sec"><div class="d-flex justify-content-center gap-3 mb-2">${['Pengantaran', 'Pick Up'].map(t => `<span class="tab ${t == mode ? 'on' : ''}" onclick="mode='${t}';render()">${t}</span>`).join('')}</div>
    ${mode == 'Pengantaran' ? `<div class="opt ${ship == 5000 ? 'on' : ''}" onclick="ship=5000;render()"><span>Standard</span><span>Rp 5.000,00</span></div><div class="opt ${ship == 3000 ? 'on' : ''}" onclick="ship=3000;render()"><span>Hemat</span><span>Rp 3.000,00</span></div><input id="alamat" class="form-control mt-2" placeholder="Alamat pengantaran">` : '<small class="text-muted">Ambil sendiri di lokasi KU-KISS sesuai jadwal PO.</small>'}</div>
    <div class="sec"><div class="d-flex justify-content-between mb-2"><span class="chip w-50">Detail Pembayaran</span><button class="btn btn-maroon btn-sm" onclick="modal('Kode QRIS','<div class=&quot;text-center p-4 border border-2 rounded&quot;>QRIS KU-KISS<br><small class=&quot;text-muted&quot;>(gambar QRIS asli menyusul)</small></div>')"><i class="bi bi-eye"></i> Lihat Kode Qris Disini</button></div><div class="d-flex align-items-center gap-2"><i class="bi bi-qr-code fs-4 text-maroon"></i><span class="chip px-5">Qris</span></div></div>
    <div class="sec"><span class="chip">Upload Bukti Pembayaran</span><input type="file" id="bk" class="d-none" accept="image/*" onchange="bukti=true;$('#bkl').textContent=this.files[0].name"><button class="btn btn-maroon w-100 mt-2" onclick="$('#bk').click()"><i class="bi bi-upload"></i> <span id="bkl">Upload Disini</span></button></div>
    <div class="d-flex justify-content-between my-3"><span>Total Harga</span><span>${rp(sub() + ongkir)}</span></div><button class="btn btn-maroon w-100 py-2" onclick="order()">Pesan</button></div>`; },

  login: () => `<div class="box3d mx-auto p-5" style="max-width:900px"><h2 class="text-center fw-semibold mb-4">Masuk</h2><form onsubmit="doLogin(event)" class="mx-auto" style="max-width:600px"><label class="fw-medium">Email</label><input id="em" type="email" class="form-control mb-3" placeholder="Masukkan Email" required>
    <label class="fw-medium">Password</label><div class="input-group mb-1"><input id="pw" type="password" class="form-control" placeholder="Masukkan Password" required><button type="button" class="btn btn-outline-secondary" onclick="$('#pw').type=$('#pw').type=='password'?'text':'password'"><i class="bi bi-eye"></i></button></div>
    <div class="text-end mb-3"><a href="#" class="text-maroon small text-decoration-none">Lupa Password ?</a></div><button class="btn btn-maroon w-100 py-2">Login</button>
    <p class="text-center small mt-3">Belum punya akun? <a href="#/daftar" class="text-maroon text-decoration-none">Daftar</a></p><p class="text-center text-muted small">Demo: email berisi "admin" masuk sebagai admin.</p></form></div>`,

  daftar: () => `<div class="box3d mx-auto p-5" style="max-width:900px"><h2 class="text-center fw-semibold mb-4">Daftar</h2><form onsubmit="event.preventDefault();flash('Akun dibuat (demo)');location.hash='#/login'" class="mx-auto" style="max-width:600px">
    ${[['Nama Lengkap', 'text'], ['Email', 'email'], ['Password', 'password']].map(([l, t]) => `<label class="fw-medium">${l}</label><input type="${t}" class="form-control mb-3" placeholder="Masukkan ${l}" required>`).join('')}
    <button class="btn btn-maroon w-100 py-2">Daftar</button><p class="text-center small mt-3">Sudah punya akun? <a href="#/login" class="text-maroon text-decoration-none">Masuk</a></p></form></div>`,

  // Halaman profil pelanggan: data disimpan sementara di localStorage.
  profil: () => {
    if (!user) return `<div class="box3d p-5 text-center"><h5>Silakan masuk terlebih dahulu.</h5><a href="#/login" class="btn btn-maroon mt-2">Masuk</a></div>`;
    const profil = load('profil', {
      nama: user.nama || user.email.split('@')[0],
      email: user.email,
      telepon: user.telepon || '',
      password: '',
      foto: ''
    });
    return `<div class="box3d profile-card">
      <div class="profile-heading"><img src="${profil.foto || 'img/profile.png'}" alt="Foto profil" class="profile-avatar"><h4>${profil.nama}</h4></div>
      <form class="profile-body" onsubmit="saveProfile(event)">
        <div class="profile-fields">
          <label>Nama Lengkap<input class="form-control" id="profileNama" value="${profil.nama}" required></label>
          <label>Email<input class="form-control" id="profileEmail" type="email" value="${profil.email}" required></label>
          <label>Nomor Handphone<input class="form-control" id="profileTelepon" type="tel" value="${profil.telepon}" placeholder="Masukkan nomor handphone"></label>
          <label>Password saat ini<input class="form-control" id="profilePassword" type="password" value="${profil.password}" placeholder="Masukkan password"></label>
        </div>
        <div class="profile-photo"><img id="profilePreview" src="${profil.foto || 'img/profile.png'}" alt="Foto profil"><label class="btn btn-sm btn-maroon">Ubah Foto<input id="profileFoto" type="file" accept="image/*" hidden onchange="previewProfilePhoto(event)"></label><button type="button" class="btn btn-sm btn-outline-danger" onclick="removeProfilePhoto()">Hapus Foto</button></div>
        <div class="text-end mt-4"><button class="btn btn-maroon" type="submit">Simpan Perubahan</button></div>
      </form>
    </div>`;
  }
};

// ============================================================
// 4. HALAMAN ADMIN (dashboard, produk, kategori, stok, penjualan, laporan)
// ============================================================
const A = {
  dashboard: () => { const k = outs.filter(o => o.bulan == YM).reduce((s, o) => s + o.jumlah, 0), m = orders.filter(o => o.tgl.startsWith(YM)).reduce((s, o) => s + o.total, 0);
    return `<h4>Dashboard</h4><div class="row g-3 my-1">${[['Keluar', k, '#ff3b3b'], ['Masuk', m, '#00c9a7'], ['Keuntungan', m - k, '#17b8d6']].map(([t, v, c]) => `<div class="col-md-4"><div class="box3d stat" style="border-color:${c}"><span class="text-muted small">Total Uang ${t} Bulan Ini</span><b>${rp(v).replace(',00', '')}</b></div></div>`).join('')}</div>
    <div class="row g-3 my-1"><div class="col-lg-8"><div class="box3d p-3"><div class="text-center small fw-medium mb-2">Diagram Uang Keuntungan Per Bulan</div><canvas id="ch" height="150"></canvas></div></div>
    <div class="col-lg-4"><div class="box3d p-3 h-100"><div class="small text-danger mb-2"><i class="bi bi-exclamation-triangle"></i> Produk Yang Perlu Di Restock</div>${products.filter(p => p.stok <= 5).map(p => `<div class="restock"><div>${p.nama}<br>${p.kode}</div><span>Sisa ${p.stok} pcs</span></div>`).join('') || '<small class="text-muted">Semua stok aman.</small>'}</div></div></div>
    <h5 class="mt-4">Pencatatan Transaksi</h5>${sales()}`; },
  produk: () => `<div class="d-flex justify-content-between"><h4>Produk</h4><button class="btn btn-info btn-sm text-white" onclick="prodForm()">+ Tambah Produk</button></div>${tbl(['No.', 'Kode Produk', 'Nama Produk', 'Deskripsi', 'Harga', 'Aksi'], products.map((p, i) => `<tr><td>${i + 1}</td><td>${p.kode}</td><td>${p.nama}</td><td>${p.desc.slice(0, 70)}</td><td>${rp(p.harga)}</td><td>${acts(`prodForm(${p.id})`, `del('products',${p.id})`)}</td></tr>`))}`,
  kategori: () => `<div class="d-flex justify-content-between"><h4>Kategori</h4><button class="btn btn-info btn-sm text-white" onclick="catForm()">+ Tambah Kategori</button></div>${tbl(['No.', 'ID Kategori', 'Nama Produk', 'Aksi'], cats.map((c, i) => `<tr><td>${i + 1}</td><td>${c.kode}</td><td>${c.nama}</td><td>${acts(`catForm(${i})`, `delCat(${i})`)}</td></tr>`))}`,
  stok: () => `<h4>Stock</h4>${tbl(['No.', 'Kode Produk', 'Nama Produk', 'Stock', 'Aksi'], products.map((p, i) => `<tr><td>${i + 1}</td><td>${p.kode}</td><td>${p.nama}</td><td>${p.stok}</td><td><button class="btn btn-sm btn-warning text-white" onclick="stokForm(${p.id})"><i class="bi bi-pencil-fill"></i></button></td></tr>`))}`,
  penjualan: () => `<h4>Penjualan</h4>${sales()}`,
  laporan: () => { const ms = [...new Set([...orders.map(o => o.tgl.slice(0, 7)), ...outs.map(o => o.bulan)])].sort();
    return `<h4>Laporan</h4>${tbl(['No.', 'Laporan Bulanan', 'Total Uang Keluar Bulan Ini', 'Total Uang Masuk Bulan Ini', 'Total Uang Keuntungan Bulan Ini', 'Aksi'], ms.map((m, i) => { const k = outs.filter(o => o.bulan == m).reduce((s, o) => s + o.jumlah, 0), n = orders.filter(o => o.tgl.startsWith(m)).reduce((s, o) => s + o.total, 0); return `<tr><td>${i + 1}</td><td>${BULAN[+m.slice(5) - 1]}</td><td>${rp(k)}</td><td>${rp(n)}</td><td>${rp(n - k)}</td><td><a class="btn btn-sm btn-success" href="#/admin/laporan/${m}" title="Lihat laporan bulanan"><i class="bi bi-download"></i></a></td></tr>`; }))}
    <div class="d-flex justify-content-between mt-4"><h5>Inputan Total Uang Keluar Bulan Ini</h5><button class="btn btn-info btn-sm text-white" onclick="outForm()">+ Tambah Pengeluaran</button></div>${tbl(['No.', 'Bulan', 'Harga', 'Aksi'], outs.map((o, i) => `<tr><td>${i + 1}</td><td>${o.bulan}</td><td>${rp(o.jumlah)}</td><td>${acts(`outForm(${o.id})`, `del('outs',${o.id})`)}</td></tr>`))}`; }
};

// Tampilan detail laporan untuk satu bulan, sesuai rancangan Figma.
function reportDetail(bulan) {
  const namaBulan = BULAN[Number((bulan || YM).slice(5, 7)) - 1] || 'Laporan';
  const daftar = orders.filter(o => o.tgl.startsWith(bulan || YM));
  const masuk = daftar.reduce((total, o) => total + o.total, 0);
  const keluar = outs.filter(o => o.bulan === (bulan || YM)).reduce((total, o) => total + o.jumlah, 0);
  return `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <h4>Laporan Bulan ${namaBulan}</h4>
      <button class="btn btn-maroon btn-sm" onclick="window.print()"><i class="bi bi-download me-1"></i>Download / Cetak</button>
    </div>
    ${tbl(['No.', 'Pelanggan', 'Item Dibeli', 'Total Belanja'], daftar.map((o, i) => `<tr><td>${i + 1}</td><td>${o.nama}</td><td>${o.items.map(item => item.qty + 'x ' + item.nama).join('<br>')}</td><td>${rp(o.total)}</td></tr>`))}
    <div class="table-responsive"><table class="table table-bordered tbl"><tbody>
      <tr><th colspan="3" class="report-total">Total Uang Masuk Bulan Ini</th><td>${rp(masuk)}</td></tr>
      <tr><th colspan="3" class="report-total">Total Uang Keluar Bulan Ini</th><td>${rp(keluar)}</td></tr>
      <tr><th colspan="3" class="report-total">Total Uang Keuntungan Bulan Ini</th><td>${rp(masuk - keluar)}</td></tr>
    </tbody></table></div>
    <a href="#/admin/laporan" class="btn btn-outline-secondary btn-sm mt-2"><i class="bi bi-arrow-left me-1"></i>Kembali ke Laporan</a>`;
}

const acts = (e, d) => `<button class="btn btn-sm btn-warning text-white" onclick="${e}"><i class="bi bi-pencil-fill"></i></button> <button class="btn btn-sm btn-danger" onclick="${d}"><i class="bi bi-trash-fill"></i></button>`;
const pager = n => `<div class="d-flex justify-content-between small my-2"><span>Menampilkan 1 sampai ${n} dari ${n} Data</span><div class="pg"><span>Sebelumnya</span><b>1</b><span>Selanjutnya</span></div></div>`;
const tbl = (h, rows) => `<div class="table-responsive mt-2"><table class="table table-bordered tbl align-middle"><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>${pager(rows.length)}`;
const ST = ['Diproses', 'Siap Diambil', 'Selesai'], STC = ['primary', 'warning', 'success'];
const sales = () => tbl(['No.', 'Pelanggan', 'Nomor Handphone', 'Item Dibeli', 'Total Belanja', 'Alamat', 'Tanggal Pemesanan', 'Bukti', 'Status'], orders.map((o, i) => `<tr><td>${i + 1}</td><td>${o.nama}</td><td>${o.telepon || '-'}</td><td>${o.items.map(x => x.qty + 'x ' + x.nama).join('<br>')}</td><td>${rp(o.total)}</td><td>${o.alamat}</td><td>${o.tgl}</td><td>${o.bukti ? '<button class="btn btn-sm btn-light border" onclick="showProof()"><i class="bi bi-eye"></i> Lihat</button>' : '-'}</td><td><button class="btn btn-sm btn-${STC[ST.indexOf(o.status)]}" onclick="nextStatus(${o.id})">${o.status}</button></td></tr>`));
const adminLayout = (r, c) => `<div class="d-flex"><aside class="side d-flex flex-column"><div class="side-brand">Admin KU-KISS</div>${[['dashboard', 'house-door', 'Dashboard'], ['produk', 'tag', 'Produk'], ['kategori', 'archive', 'Kategori'], ['stok', 'box', 'Stok'], ['penjualan', 'cash-stack', 'Penjualan'], ['laporan', 'envelope', 'Laporan']].map(([h, i, t]) => `<a class="${h == r ? 'on' : ''}" href="#/admin/${h}"><i class="bi bi-${i} me-2"></i>${t}</a>`).join('')}<a class="out mt-auto py-3" onclick="logout()">Logout</a></aside>
<div class="flex-grow-1"><div class="topbar d-flex justify-content-between align-items-center"><div class="search m-0 w-50"><i class="bi bi-search"></i><input placeholder="Cari Disini" oninput="$$('tbody tr').forEach(t=>t.hidden=!t.textContent.toLowerCase().includes(this.value.toLowerCase()))"></div><span class="small">Hi, Selamat Datang Admin <i class="bi bi-person-circle avatar ms-2"></i></span></div><div class="p-4"><div class="box3d p-4">${c}</div></div></div></div>`;

// ============================================================
// 5. AKSI DAN FORM (tambah, edit, hapus, login, checkout, profil)
// ============================================================
function modal(t, b, ok) { $('#mt').textContent = t; $('#mb').innerHTML = b; $('#mok').style.display = ok ? '' : 'none'; $('#mok').onclick = () => { ok(); bootstrap.Modal.getInstance($('#m')).hide(); render(); }; bootstrap.Modal.getOrCreateInstance($('#m')).show(); }
const fld = (id, l, v = '', t = 'text') => `<label class="small mt-2">${l}</label><input id="${id}" type="${t}" class="form-control" value="${v}">`;
const val = id => $('#' + id).value;
function add(id, buy) { const c = cart.find(x => x.id == id); c ? c.qty++ : cart.push({ id, qty: 1, pick: true }); save('cart', cart); flash('Ditambahkan ke keranjang'); if (buy) location.hash = '#/keranjang'; }
function qty(id, d) { const c = cart.find(x => x.id == id); c.qty += d; if (c.qty < 1) cart = cart.filter(x => x.id != id); save('cart', cart); render(); }
function pick(id, v) { cart.find(x => x.id == id).pick = v; save('cart', cart); render(); }
const sub = () => cart.filter(c => c.pick).reduce((s, c) => s + prod(c.id).harga * c.qty, 0);
function toCheckout() { if (!cart.some(c => c.pick)) return flash('Pilih produk dulu'); if (!user) { flash('Silakan masuk dulu'); return location.hash = '#/login'; } location.hash = '#/checkout'; }
function order() { const ongkir = mode == 'Pengantaran' ? ship : 0, al = mode == 'Pengantaran' ? (val('alamat') || '') : 'Pick Up'; if (mode == 'Pengantaran' && !al) return flash('Isi alamat dulu');
  const its = cart.filter(c => c.pick); const profilPelanggan = load('profil', {});
  orders.push({ id: Date.now(), nama: profilPelanggan.nama || user.nama || user.email.split('@')[0], telepon: profilPelanggan.telepon || user.telepon || '-', items: its.map(c => ({ nama: prod(c.id).nama, qty: c.qty })), total: sub() + ongkir, alamat: al, tgl: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 8), bukti, status: 'Diproses' });
  save('orders', orders); cart = cart.filter(c => !c.pick); save('cart', cart); bukti = false; flash('Pesanan berhasil dibuat!'); location.hash = '#/'; }
function doLogin(e) { e.preventDefault(); user = { email: val('em'), role: val('em').includes('admin') ? 'admin' : 'customer' }; save('user', user); location.hash = user.role == 'admin' ? '#/admin/dashboard' : '#/'; }
function logout() { user = null; save('user', null); location.hash = '#/'; render(); }

// Menyimpan perubahan data profil pelanggan.
function saveProfile(event) {
  event.preventDefault();
  const profil = load('profil', {});
  profil.nama = $('#profileNama').value.trim();
  profil.email = $('#profileEmail').value.trim();
  profil.telepon = $('#profileTelepon').value.trim();
  profil.password = $('#profilePassword').value;
  profil.foto = profil.foto || '';
  save('profil', profil);
  user.nama = profil.nama;
  user.email = profil.email;
  user.telepon = profil.telepon;
  save('user', user);
  flash('Profil berhasil disimpan');
  render();
}

// Menampilkan pratinjau foto profil yang dipilih.
function previewProfilePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const profil = load('profil', {});
    profil.foto = reader.result;
    save('profil', profil);
    const preview = $('#profilePreview');
    if (preview) preview.src = reader.result;
    const avatar = $('.profile-avatar');
    if (avatar) avatar.src = reader.result;
  };
  reader.readAsDataURL(file);
}

// Mengembalikan foto profil ke gambar profil default.
function removeProfilePhoto() {
  const profil = load('profil', {});
  profil.foto = '';
  save('profil', profil);
  render();
}

// Bukti pembayaran masih berupa tampilan demo karena belum terhubung backend.
function showProof() {
  modal('Bukti Pembayaran', '<div class="text-center p-4"><i class="bi bi-receipt text-maroon" style="font-size:4rem"></i><p class="mt-3 mb-0">Bukti pembayaran contoh.</p><small class="text-muted">File bukti asli akan ditampilkan setelah backend terhubung.</small></div>');
}
const persist = () => { save('products', products); save('cats', cats); save('outs', outs); save('orders', orders); };
function del(k, id) { if (!confirm('Hapus data ini?')) return; if (k == 'products') products = products.filter(x => x.id != id); else outs = outs.filter(x => x.id != id); persist(); render(); }
function delCat(i) { if (confirm('Hapus kategori?')) { cats.splice(i, 1); persist(); render(); } }
function prodForm(id) { const p = id ? prod(id) : { kode: '', nama: '', desc: '', harga: '', kat: 'Cookies', stok: 0 };
  modal(id ? 'Edit Produk' : 'Tambah Produk', fld('f1', 'Kode Produk', p.kode) + fld('f2', 'Nama Produk', p.nama) + fld('f3', 'Deskripsi', p.desc) + fld('f4', 'Harga', p.harga, 'number') + fld('f5', 'Stok', p.stok, 'number'),
    () => { const d = { kode: val('f1'), nama: val('f2'), desc: val('f3'), harga: +val('f4'), stok: +val('f5') }; id ? Object.assign(p, d) : products.push({ id: Date.now(), kat: 'Cookies', img: 'logo.png', ...d }); persist(); }); }
function catForm(i) { const c = cats[i]; modal(c ? 'Edit Kategori' : 'Tambah Kategori', fld('f1', 'Nama Kategori', c ? c.nama : ''), () => { const n = val('f1'); c ? c.nama = n : cats.push({ kode: n.slice(0, 3).toUpperCase() + ':MAT-00' + (cats.length + 1), nama: n }); persist(); }); }
function stokForm(id) { const p = prod(id); modal('Edit Stok: ' + p.nama, fld('f1', 'Stok', p.stok, 'number'), () => { p.stok = +val('f1'); persist(); }); }
function outForm(id) { const o = outs.find(x => x.id == id); modal(o ? 'Edit Pengeluaran' : 'Tambah Pengeluaran', fld('f1', 'Bulan', o ? o.bulan : YM, 'month') + fld('f2', 'Jumlah (Rp)', o ? o.jumlah : '', 'number'), () => { const d = { bulan: val('f1'), jumlah: +val('f2') }; o ? Object.assign(o, d) : outs.push({ id: Date.now(), ...d }); persist(); }); }
function nextStatus(id) { const o = orders.find(x => x.id == id); o.status = ST[(ST.indexOf(o.status) + 1) % 3]; persist(); render(); }
let chartDashboard = null;
function chart() { const c = $('#ch'); if (!c) { if (chartDashboard) { chartDashboard.destroy(); chartDashboard = null; } return; }
  if (chartDashboard) chartDashboard.destroy(); const d = BULAN.slice(0, 10).map((_, i) => { const m = '2026-' + String(i + 1).padStart(2, '0'); return orders.filter(o => o.tgl.startsWith(m)).reduce((s, o) => s + o.total, 0) - outs.filter(o => o.bulan == m).reduce((s, o) => s + o.jumlah, 0); });
  chartDashboard = new Chart(c, { type: 'line', data: { labels: BULAN.slice(0, 10), datasets: [{ data: d, borderColor: '#0a8f4e', backgroundColor: 'rgba(10,143,78,.15)', fill: true, tension: .4 }] }, options: { plugins: { legend: { display: false } } } }); }

// ============================================================
// 6. ROUTER: menentukan halaman dari alamat hash URL
// ============================================================
function render() {
  const [r = '', a, b] = location.hash.slice(2).split('/');
  const root = $('#root');

  if (r === 'admin') {
    const halamanAdmin = a === 'laporan' && b
      ? reportDetail(b)
      : (A[a] || A.dashboard)();

    root.innerHTML = user && user.role === 'admin'
      ? adminLayout(a || 'dashboard', halamanAdmin)
      : site(`<div class="box3d p-5 text-center">Halaman ini khusus admin. <a href="#/login" class="text-maroon">Login dulu</a></div>`);
  } else {
    const halaman = P[r || 'home'];
    root.innerHTML = site(halaman ? halaman(a) : P.home());

    if (r === 'about' && $('#about')) {
      $('#about').scrollIntoView();
    }
  }

  chart();
}
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });
render();