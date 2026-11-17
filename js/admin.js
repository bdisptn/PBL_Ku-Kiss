// 4. HALAMAN ADMIN (dashboard, produk, rekap batch, penjualan, laporan)
// ============================================================
const A = {
  dashboard: () => { const k = outs.filter(o => o.bulan == YM).reduce((s, o) => s + o.jumlah, 0), m = orders.filter(o => o.tgl.startsWith(YM) && o.payment_status === 'Lunas').reduce((s, o) => s + o.total, 0);
    return `<h4>Dashboard</h4><div class="row g-3 my-1">${[['Keluar', k, '#ff3b3b'], ['Masuk', m, '#00c9a7'], ['Keuntungan', m - k, '#17b8d6']].map(([t, v, c]) => `<div class="col-md-4"><div class="box3d stat" style="border-color:${c}"><span class="text-muted small">Total Uang ${t} Bulan Ini</span><b>${rp(v).replace(',00', '')}</b></div></div>`).join('')}</div>
    <div class="row g-3 my-1"><div class="col-12"><div class="box3d p-3"><div class="text-center small fw-medium mb-2">Diagram Uang Keuntungan Per Bulan</div><canvas id="ch" height="150"></canvas></div></div>
    </div>
    <h5 class="mt-4">Pencatatan Transaksi</h5>${sales()}`; },
  produk: () => `<div class="d-flex justify-content-between"><h4>Produk</h4><button class="btn btn-info btn-sm text-white" onclick="prodForm()">+ Tambah Produk</button></div>${tbl(['No.', 'Foto', 'Kode Produk', 'Nama Produk', 'Deskripsi', 'Harga', 'Aksi'], products.map((p, i) => `<tr><td>${i + 1}</td><td><img src="${productImage(p.img)}" alt="${p.nama}" style="width:60px;height:60px;object-fit:cover"></td><td>${p.kode}</td><td>${p.nama}</td><td>${p.desc.slice(0, 70)}</td><td>${rp(p.harga)}</td><td>${acts(`prodForm(${p.id})`, `del('products',${p.id})`)}</td></tr>`))}`,
  rekap: () => `<h4>Rekap Pesanan per Batch PO</h4><p class="text-muted">Menampilkan jumlah setiap produk dari pesanan yang sudah lunas.</p>
    ${batches.length ? batches.map(batch => {
      const rows = batchProductRecap.filter(item => item.batchId === batch.id)
        .map((item, index) => `<tr><td>${index + 1}</td><td>${batchHtml(item.nama)}</td><td>${item.jumlah}</td></tr>`);
      return `<section class="mt-4"><h5>${batchHtml(batch.nama)}</h5><p class="small text-muted mb-2">${batchHtml(batch.mulai)} – ${batchHtml(batch.selesai)}</p>
        ${rows.length ? tbl(['No.', 'Nama Produk', 'Jumlah Pesanan Lunas'], rows) : '<p class="text-muted">Belum ada pesanan lunas pada batch ini.</p>'}</section>`;
    }).join('') : '<p class="text-muted">Belum ada batch PO.</p>'}`,
  batch: () => {
    const today = new Date().toLocaleDateString('sv-SE');
    return `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><h4 class="mb-0">Batch PO</h4><button class="btn btn-info btn-sm text-white" onclick="batchForm()">+ Buat &amp; Buka Batch PO</button></div>
      <p class="text-muted mt-2">Pelanggan dapat checkout hanya selama tanggal batch yang berstatus dibuka. Menutup batch akan menghentikan pesanan baru.</p>
      ${tbl(['No.', 'Nama Batch', 'Tanggal Buka', 'Tanggal Tutup', 'Status', 'Aksi'], batches.map((batch, i) => {
        const status = batch.status === 'dibuka' && today < batch.mulai ? 'Dibuka (terjadwal)'
          : batch.status === 'dibuka' && today > batch.selesai ? 'Dibuka (tanggal lewat)'
            : batch.status === 'dibuka' ? 'Dibuka' : batch.status.charAt(0).toUpperCase() + batch.status.slice(1);
        const action = batch.status === 'dibuka'
          ? `<button class="btn btn-sm btn-danger" onclick="closeBatch(${batch.id})">Tutup Batch</button>`
          : '-';
        return `<tr><td>${i + 1}</td><td>${batchHtml(batch.nama)}</td><td>${batchHtml(batch.mulai)}</td><td>${batchHtml(batch.selesai)}</td><td>${batchHtml(status)}</td><td>${action}</td></tr>`;
      }))}`;
  },
  penjualan: () => `<h4>Penjualan</h4>${sales()}`,
  laporan: () => { const ms = [...new Set([...orders.map(o => o.tgl.slice(0, 7)), ...outs.map(o => o.bulan)])].sort();
    return `<h4>Laporan</h4>${tbl(['No.', 'Laporan Bulanan', 'Total Uang Keluar Bulan Ini', 'Total Uang Masuk Bulan Ini', 'Total Uang Keuntungan Bulan Ini', 'Aksi'], ms.map((m, i) => { const k = outs.filter(o => o.bulan == m).reduce((s, o) => s + o.jumlah, 0), n = orders.filter(o => o.tgl.startsWith(m) && o.payment_status === 'Lunas').reduce((s, o) => s + o.total, 0); return `<tr><td>${i + 1}</td><td>${BULAN[+m.slice(5) - 1]}</td><td>${rp(k)}</td><td>${rp(n)}</td><td>${rp(n - k)}</td><td><a class="btn btn-sm btn-success" href="#/admin/laporan/${m}" title="Lihat laporan bulanan"><i class="bi bi-download"></i></a></td></tr>`; }))}
    <div class="d-flex justify-content-between mt-4"><h5>Pengeluaran</h5><button class="btn btn-info btn-sm text-white" onclick="outForm()">+ Tambah Pengeluaran</button></div>${tbl(['No.', 'Tanggal', 'Keterangan', 'Jumlah', 'Aksi'], outs.map((o, i) => `<tr><td>${i + 1}</td><td>${o.tanggal}</td><td>${o.keterangan}</td><td>${rp(o.jumlah)}</td><td>${acts(`outForm(${o.id})`, `del('outs',${o.id})`)}</td></tr>`))}`; }
};

// Tampilan detail laporan untuk satu bulan
function reportDetail(bulan) {
  const namaBulan = BULAN[Number((bulan || YM).slice(5, 7)) - 1] || 'Laporan';
  const daftar = orders.filter(o => o.tgl.startsWith(bulan || YM) && o.payment_status === 'Lunas');
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
const sales = () => tbl(['No.', 'Pelanggan', 'Nomor Handphone', 'Item Dibeli', 'Total Belanja', 'Alamat', 'Tanggal Pemesanan', 'Pembayaran', 'Bukti', 'Status'], orders.map((o, i) => `<tr><td>${i + 1}</td><td>${o.nama}</td><td>${o.telepon || '-'}</td><td>${o.items.map(x => x.qty + 'x ' + x.nama).join('<br>')}</td><td>${rp(o.total)}</td><td>${o.alamat}</td><td>${o.tgl}</td><td>${o.payment_status === 'Menunggu Verifikasi' ? `<button class="btn btn-sm btn-success" onclick="orderPayment(${o.id},'approve')">Terima</button> <button class="btn btn-sm btn-danger" onclick="orderPayment(${o.id},'reject')">Tolak</button>` : o.payment_status}</td><td>${o.bukti ? `<button class="btn btn-sm btn-light border" onclick="showProof(${o.id})"><i class="bi bi-eye"></i> Lihat</button>` : '-'}</td><td>${o.payment_status === 'Lunas' && o.status !== 'Selesai' ? `<button class="btn btn-sm btn-${STC[ST.indexOf(o.status)] || 'secondary'}" onclick="nextStatus(${o.id})">${o.status}</button>` : o.status}</td></tr>`));
const batchHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const adminLayout = (r, c) => `<div class="admin-shell"><aside class="side"><div class="side-brand">Admin KU-KISS</div>${[['dashboard', 'house-door', 'Dashboard'], ['produk', 'tag', 'Produk'], ['rekap', 'clipboard-data', 'Rekap Pesanan'], ['batch', 'calendar-check', 'Batch PO'], ['penjualan', 'cash-stack', 'Penjualan'], ['laporan', 'envelope', 'Laporan']].map(([h, i, t]) => `<a class="${h == r ? 'on' : ''}" href="#/admin/${h}"><i class="bi bi-${i} me-2"></i>${t}</a>`).join('')}<a class="out" onclick="logout()">Keluar</a></aside>
<div class="admin-main"><div class="topbar"><div class="search"><i class="bi bi-search"></i><input placeholder="Cari Disini" oninput="$$('tbody tr').forEach(t=>t.hidden=!t.textContent.toLowerCase().includes(this.value.toLowerCase()))"></div><span>Hi, Selamat Datang Admin <i class="bi bi-person-circle avatar ms-2"></i></span></div><main class="admin-content"><div class="box3d admin-card">${c}</div></main></div></div>`;

// ============================================================
