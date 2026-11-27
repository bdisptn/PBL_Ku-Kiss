// 4. HALAMAN ADMIN (dashboard, produk, rekap batch, penjualan, laporan)
// ============================================================
let adminSearchText = '';

const pendingPaymentOrders = () => orders.filter(order =>
  order.payment_status === 'Menunggu Verifikasi' && order.status !== 'Dibatalkan');
const orderUnits = list => list.reduce((total, order) =>
  total + order.items.reduce((quantity, item) => quantity + item.qty, 0), 0);
const paidOrderIncome = list => list
  .filter(order => order.payment_status === 'Lunas')
  .reduce((total, order) => total + order.total, 0);
const orderBatch = order => {
  return batches.find(batch => batch.id === Number(order.batch_id)) || null;
};
const batchOrders = batch => orders.filter(order => orderBatch(order)?.id === batch.id);
const incomeForMonth = month => paidOrderIncome(orders.filter(order => order.tgl.startsWith(month)));
const expensesForMonth = month => outs
  .filter(expense => expense.bulan === month)
  .reduce((total, expense) => total + expense.jumlah, 0);
const reportMonths = () => [...new Set([YM, ...orders.map(order => order.tgl.slice(0, 7)), ...outs.map(expense => expense.bulan)])].sort().reverse();

const unreadAdminNotificationCount = () =>
  adminNotificationItems.filter(item => !item.read_at).length;
const unreadAdminOrderNotificationCount = () =>
  adminNotificationItems.filter(item =>
    !item.read_at && ['order_created', 'order_cancelled'].includes(item.type)
  ).length;
const unreadAdminFeedbackCount = () =>
  adminFeedbackItems.filter(item => item.notification_id && !item.read_at).length;

async function markAdminPageNotificationsRead(page) {
  const section = {
    penjualan: 'orders',
    feedback: 'feedback',
    notifikasi: 'notifications'
  }[page];
  if (!section) return;
  const hasUnread = section === 'orders' ? unreadAdminOrderNotificationCount() > 0
    : section === 'feedback' ? unreadAdminFeedbackCount() > 0
      : unreadAdminNotificationCount() > 0;
  if (!hasUnread) return;

  await api('notification-read-section', { method: 'POST', body: { section } });
  const types = section === 'orders' ? ['order_created', 'order_cancelled']
    : section === 'feedback' ? ['feedback'] : null;
  const readAt = new Date().toISOString();
  const readIds = new Set(adminNotificationItems
    .filter(item => !types || types.includes(item.type))
    .map(item => item.id));
  adminNotificationItems = adminNotificationItems.map(item =>
    readIds.has(item.id) ? { ...item, read_at: item.read_at || readAt } : item
  );
  if (section === 'feedback' || section === 'notifications') {
    adminFeedbackItems = adminFeedbackItems.map(item =>
      readIds.has(Number(item.notification_id))
        ? { ...item, read_at: item.read_at || readAt }
        : item
    );
  }
}

function syncAdminNotifications(data) {
  adminNotificationItems = (data.notifications || []).map(item => ({
    ...item,
    id: Number(item.id),
    order_id: item.order_id === null ? null : Number(item.order_id),
    feedback_id: item.feedback_id === null ? null : Number(item.feedback_id),
    createdAt: item.created_at,
    icon: item.type === 'feedback' ? 'bi-chat-left-text' : 'bi-receipt'
  }));
  adminFeedbackItems = data.feedback || [];
}

function adminNotificationPanel() {
  const items = adminNotificationItems.slice(0, 10);
  return `<div class="admin-notifications-heading"><strong>Notifikasi terbaru</strong><div class="d-flex gap-2">
      <button type="button" class="btn btn-link btn-sm p-0" onclick="refreshAdminNotifications()">Perbarui</button>
      ${unreadAdminNotificationCount() ? '<button type="button" class="btn btn-link btn-sm p-0" onclick="markAllAdminNotificationsRead()">Tandai dibaca</button>' : ''}
    </div></div>
    ${items.length ? `<div class="admin-notification-list">${items.map(item => {
      const unread = !item.read_at;
      const destination = item.feedback_id ? '#/admin/feedback' : '#/admin/penjualan';
      return `<a class="admin-notification-item ${unread ? 'is-unread' : ''}" href="${destination}" onclick="openAdminNotification(${item.id},'${destination}');return false">
        <span class="admin-notification-dot" aria-hidden="true"></span><span class="admin-notification-copy">
          <strong>${batchHtml(item.title)}</strong><span>${batchHtml(item.message)}</span>
          <small>${batchHtml(item.createdAt ? formatDateTime(item.createdAt) : 'Waktu tidak tersedia')} · ${unread ? 'Belum dibaca' : 'Sudah dibaca'}</small>
        </span></a>`;
    }).join('')}</div>` : '<p class="text-muted small mb-0">Belum ada notifikasi admin.</p>'}`;
}

async function openAdminNotification(id, destination) {
  try {
    await api('notification-read', { method: 'POST', body: { id } });
    adminDataLoaded = false;
    await loadAdminData();
    location.hash = destination;
  } catch (error) {
    flash(`Notifikasi gagal diperbarui: ${error.message}`);
  }
}

async function markAdminNotificationRead(id) {
  try {
    await api('notification-read', { method: 'POST', body: { id } });
    adminDataLoaded = false;
    await loadAdminData();
    await render();
  } catch (error) {
    flash(`Notifikasi gagal diperbarui: ${error.message}`);
  }
}

async function markAllAdminNotificationsRead() {
  try {
    await api('notification-read-all', { method: 'POST', body: {} });
    adminDataLoaded = false;
    await loadAdminData();
    await render();
  } catch (error) {
    flash(`Notifikasi gagal diperbarui: ${error.message}`);
  }
}

async function refreshAdminNotifications() {
  adminDataLoaded = false;
  try {
    await loadAdminData();
    await render();
  } catch (error) {
    flash(`Notifikasi gagal diperbarui: ${error.message}`);
  }
}

let adminNotificationTimer = null;
let adminNotificationRefreshInFlight = false;
function startAdminNotificationPolling() {
  if (adminNotificationTimer) return;
  adminNotificationTimer = setInterval(async () => {
    if (user?.role !== 'admin' || !adminDataLoaded || adminNotificationRefreshInFlight) return;
    adminNotificationRefreshInFlight = true;
    adminDataLoaded = false;
    try {
      await loadAdminData();
      if (location.hash.startsWith('#/admin/')) {
        const page = location.hash.slice(2).split('/')[1];
        await markAdminPageNotificationsRead(page);
        await render();
      }
    } catch (error) {
      flash(`Notifikasi admin gagal diperbarui: ${error.message}`);
    } finally {
      adminNotificationRefreshInFlight = false;
    }
  }, 30000);
}

const A = {
  dashboard: () => {
    const pending = pendingPaymentOrders();
    const expenses = expensesForMonth(YM);
    const stats = [
      ['Pemasukan bulan ini', rp(incomeForMonth(YM)), '#00a884', 'Dari pesanan lunas'],
      ['Menunggu verifikasi', pending.length, '#ef9d22', 'Bukti pembayaran perlu diperiksa'],
      ['Pengeluaran bulan ini', rp(expenses), '#e15b64', 'Berdasarkan catatan pengeluaran']
    ];
    return `<div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4 class="mb-1">Dashboard Admin</h4><p class="text-muted mb-0">Ringkasan pesanan dan operasional KU-KISS.</p></div><a href="#/admin/penjualan" class="btn btn-outline-maroon btn-sm"><i class="bi bi-receipt me-1"></i>Kelola pesanan</a></div>
      <div class="row g-3 my-2">${stats.map(([title, value, color, note]) => `<div class="col-md-4"><div class="box3d stat h-100" style="border-color:${color}"><span class="text-muted small">${title}</span><b>${value}</b><small class="text-muted">${note}</small></div></div>`).join('')}</div>
      <div class="row g-3 mt-1"><div class="col-12"><section class="box3d p-3"><h5>Tren keuntungan</h5><canvas id="ch" height="150"></canvas><a href="#/admin/laporan" class="btn btn-outline-maroon btn-sm mt-2">Buka laporan pemasukan dan pengeluaran</a></section></div></div>
      <h5 class="mt-4">Pesanan terbaru</h5>${sales({ limit: 5 })}`;
  },
  produk: () => `<div class="d-flex justify-content-between"><h4>Produk</h4><button class="btn btn-info btn-sm text-white" onclick="prodForm()">+ Tambah Produk</button></div>${tbl(['No.', 'Foto', 'Kode Produk', 'Nama Produk', 'Deskripsi', 'Harga', 'Aksi'], products.map((p, i) => `<tr><td>${i + 1}</td><td><img class="admin-product-thumbnail" src="${productImage(p.img)}" alt="${p.nama}"></td><td>${p.kode}</td><td>${p.nama}</td><td>${p.desc.slice(0, 70)}</td><td>${rp(p.harga)}</td><td>${acts(`prodForm(${p.id})`, `del('products',${p.id})`)}</td></tr>`))}`,
  rekap: () => {
    const rows = [];
    batches.forEach((batch, batchIndex) => {
      const productsInBatch = batchProductRecap.filter(item => item.batchId === batch.id);
      const rowSpan = Math.max(productsInBatch.length, 1);
      const groupColor = batchIndex % 2 === 0 ? 'admin-recap-group-odd' : 'admin-recap-group-even';
      const batchCells = `<td rowspan="${rowSpan}" class="admin-row-number align-middle">${batchIndex + 1}</td><td rowspan="${rowSpan}" class="align-middle">${batchHtml(batch.nama)}</td><td rowspan="${rowSpan}" class="align-middle">${batchHtml(batch.mulai)}</td><td rowspan="${rowSpan}" class="align-middle">${batchHtml(batch.selesai)}</td>`;
      if (!productsInBatch.length) {
        rows.push(`<tr class="${groupColor}">${batchCells}<td colspan="2" class="text-muted align-middle">Belum ada pesanan lunas</td></tr>`);
        return;
      }
      productsInBatch.forEach((item, index) => rows.push(
        `<tr class="${groupColor}">${index === 0 ? batchCells : ''}<td class="align-middle">${batchHtml(item.nama)}</td><td class="align-middle">${item.jumlah}</td></tr>`
      ));
    });
    return `<div><h4 class="mb-1">Rekap Pesanan per Batch PO</h4><p class="text-muted mb-0">Menampilkan jumlah setiap produk dari pesanan yang sudah lunas.</p></div>
      ${tbl(['No.', 'Nama Batch', 'Tanggal Buka', 'Tanggal Tutup', 'Nama Produk', 'Jumlah Pesanan Lunas'], rows, 'admin-recap-table')}`;
  },
  batch: () => {
    const today = new Date().toLocaleDateString('sv-SE');
    return `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><h4 class="mb-0">Batch PO</h4><button class="btn btn-info btn-sm text-white" onclick="batchForm()">+ Buat &amp; Buka Batch PO</button></div>
      <p class="text-muted mt-2">Pelanggan dapat checkout hanya selama tanggal batch yang berstatus dibuka. Pemasukan dihitung dari pesanan lunas yang terhubung langsung ke batch.</p>
      ${tbl(['No.', 'Nama Batch', 'Tanggal Buka', 'Tanggal Tutup', 'Pemasukan', 'Status', 'Aksi'], batches.map((batch, i) => {
        const status = batch.status === 'dibuka' && today < batch.mulai ? 'Dibuka (terjadwal)'
          : batch.status === 'dibuka' && today > batch.selesai ? 'Dibuka (tanggal lewat)'
            : batch.status === 'dibuka' ? 'Dibuka' : batch.status.charAt(0).toUpperCase() + batch.status.slice(1);
        const action = batch.status === 'dibuka'
          ? `<button class="btn btn-sm btn-danger" onclick="closeBatch(${batch.id})">Tutup Batch</button>`
          : '-';
        const income = paidOrderIncome(batchOrders(batch));
        return `<tr><td>${i + 1}</td><td>${batchHtml(batch.nama)}</td><td>${batchHtml(batch.mulai)}</td><td>${batchHtml(batch.selesai)}</td><td>${rp(income)}</td><td>${batchHtml(status)}</td><td>${action}</td></tr>`;
      }))}`;
  },
  bahan: () => ingredientsPage(),
  feedback: () => {
    const rows = adminFeedbackItems.map((feedback, index) => {
      const id = Number(feedback.id);
      const unread = Boolean(feedback.notification_id && !feedback.read_at);
      const readStatus = feedback.notification_id
        ? (unread ? 'Belum dibaca' : 'Sudah dibaca')
        : 'Data lama';
      const attachment = feedback.has_attachment
        ? `<button class="btn btn-sm btn-outline-primary" onclick="viewFeedbackAttachment(${id},'${feedback.attachment_type}')">Lihat lampiran</button>`
        : '-';
      return `<tr><td>${index + 1}</td><td>${batchHtml(feedback.customer_name || feedback.name || 'Pelanggan')}</td>
        <td>${feedback.order_id ? `#${batchHtml(feedback.order_id)}` : '-'}</td><td>${batchHtml(feedback.message || feedback.content || feedback.komentar || '')}</td>
        <td>${attachment}</td><td>${batchHtml(formatDateTime(feedback.created_at))}</td><td><span class="badge ${unread ? 'text-bg-warning' : feedback.notification_id ? 'text-bg-success' : 'text-bg-secondary'}">${readStatus}</span></td>
        <td>${unread ? `<button class="btn btn-sm btn-outline-maroon" onclick="markAdminNotificationRead(${feedback.notification_id})">Tandai dibaca</button>` : '-'}</td></tr>`;
    });
    return `<h4>Feedback Pelanggan</h4><p class="text-muted">Kritik, saran, dan masukan dari pelanggan.</p>
      ${rows.length ? tbl(['No.', 'Pelanggan', 'Pesanan', 'Feedback', 'Lampiran', 'Waktu', 'Status', 'Aksi'], rows) : '<div class="alert alert-info">Belum ada feedback yang diterima.</div>'}`;
  },
  notifikasi: () => `<div class="admin-notifications-page"><div class="mb-3"><h4 class="mb-1">Notifikasi Admin</h4><p class="text-muted mb-0">Pemberitahuan pesanan, pembatalan, dan feedback terbaru.</p></div>${adminNotificationPanel()}</div>`,
  penjualan: () => `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><h4 class="mb-1">Daftar Pesanan</h4><p class="text-muted mb-0">Verifikasi pembayaran, pantau status, dan dokumentasikan pesanan.</p></div><select id="orderStatusFilter" class="form-select form-select-sm admin-filter" onchange="filterAdminOrders()"><option value="">Semua pembayaran</option><option value="Menunggu Verifikasi">Menunggu verifikasi</option><option value="Lunas">Lunas</option><option value="Ditolak">Ditolak</option><option value="Dibatalkan">Dibatalkan</option></select></div>${sales()}`,
  laporan: () => {
    const months = reportMonths();
    const monthRows = months.map((month, index) => {
      const income = incomeForMonth(month);
      const expenses = expensesForMonth(month);
      return `<tr><td>${index + 1}</td><td>${BULAN[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}</td><td>${rp(expenses)}</td><td>${rp(income)}</td><td>${rp(income - expenses)}</td><td><a class="btn btn-sm btn-success" href="#/admin/laporan/${month}" title="Lihat detail bulan"><i class="bi bi-eye"></i></a></td></tr>`;
    });
    const expenseRows = outs.map((expense, index) => `<tr><td>${index + 1}</td><td>${batchHtml(expense.tanggal)}</td><td>${batchHtml(expense.keterangan)}</td><td>${rp(expense.jumlah)}</td><td>${acts(`outForm(${expense.id})`, `del('outs',${expense.id})`)}</td></tr>`);
    return `<h4>Laporan Pemasukan dan Pengeluaran</h4><p class="text-muted">Pemasukan dihitung dari pesanan lunas. Total keuntungan merupakan pemasukan dikurangi pengeluaran.</p>
      <section class="mt-4"><h5>Ringkasan bulanan</h5>${tbl(['No.', 'Periode', 'Total uang keluar', 'Total uang masuk', 'Total keuntungan', 'Detail'], monthRows)}</section>
      <section class="mt-4"><div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><h5 class="mb-1">Catatan pengeluaran</h5><p class="text-muted small mb-0">Pengeluaran bahan hanya dapat dicatat dari bahan baku yang sudah terdaftar.</p></div><button class="btn btn-info btn-sm text-white" onclick="outForm()"><i class="bi bi-plus-lg"></i> Tambah pengeluaran</button></div>
      ${expenseRows.length ? tbl(['No.', 'Tanggal', 'Bahan baku', 'Jumlah', 'Aksi'], expenseRows) : '<div class="box3d p-3 mt-2 text-muted">Belum ada catatan pengeluaran.</div>'}</section>`;
  }
};

// Tampilan detail laporan untuk satu bulan
function reportDetail(bulan) {
  const periode = /^\d{4}-\d{2}$/.test(bulan || '') ? bulan : YM;
  const namaBulan = BULAN[Number(periode.slice(5, 7)) - 1] || 'Laporan';
  const daftar = orders.filter(order => order.tgl.startsWith(periode));
  const lunas = daftar.filter(order => order.payment_status === 'Lunas');
  const masuk = paidOrderIncome(lunas);
  const keluar = expensesForMonth(periode);
  return `<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div><h4>Laporan Pemasukan ${namaBulan} ${periode.slice(0, 4)}</h4><p class="text-muted mb-0">Pesanan lunas: ${lunas.length} · Belum lunas: ${daftar.filter(order => order.payment_status !== 'Lunas').length} · Produk diproduksi: ${orderUnits(lunas)}</p></div>
      <button class="btn btn-maroon btn-sm" onclick="window.print()"><i class="bi bi-download me-1"></i>Download / Cetak</button>
    </div>
    ${tbl(['No.', 'Tanggal pesanan', 'Pelanggan', 'Item Dibeli', 'Pembayaran', 'Total'], daftar.map((order, index) => `<tr><td>${index + 1}</td><td>${formatDateTime(order.tgl)}</td><td>${batchHtml(order.nama)}</td><td>${order.items.map(item => `${item.qty}x ${batchHtml(item.nama)}`).join('<br>')}</td><td>${batchHtml(order.payment_status)}</td><td>${order.payment_status === 'Lunas' ? rp(order.total) : '<span class="text-muted">Belum masuk pemasukan</span>'}</td></tr>`))}
    <div class="table-responsive mt-3"><table class="table table-bordered tbl"><tbody>
      <tr><th class="report-total">Total uang masuk</th><td>${rp(masuk)}</td></tr>
      <tr><th class="report-total">Total uang keluar</th><td>${rp(keluar)}</td></tr>
      <tr><th class="report-total">Total keuntungan</th><td>${rp(masuk - keluar)}</td></tr>
    </tbody></table></div>
    <a href="#/admin/laporan" class="btn btn-outline-secondary btn-sm mt-2"><i class="bi bi-arrow-left me-1"></i>Kembali ke Laporan</a>`;
}

const acts = (e, d) => `<button class="btn btn-sm btn-warning text-white" onclick="${e}"><i class="bi bi-pencil-fill"></i></button> <button class="btn btn-sm btn-danger" onclick="${d}"><i class="bi bi-trash-fill"></i></button>`;
const pager = n => `<div class="d-flex justify-content-between small my-2"><span class="pager-count" data-total="${n}">Menampilkan ${n ? 1 : 0} sampai ${n} dari ${n} Data</span><div class="pg"><span>Sebelumnya</span><b>1</b><span>Selanjutnya</span></div></div>`;
const tbl = (h, rows, tableClass = '') => `<div class="table-responsive mt-2"><table class="table table-bordered table-striped tbl align-middle ${tableClass}"><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>${pager(rows.length)}`;
const ST = ['Diproses', 'Siap Diambil', 'Selesai'], STC = ['primary', 'warning', 'success'];
const sales = ({ limit } = {}) => {
  const list = limit ? orders.slice(0, limit) : orders;
  const rows = list.map((order, index) => {
    const reason = order.payment_reason || '';
    const proof = order.bukti ? `<button class="btn btn-sm btn-light border" onclick="showProof(${order.id})">Pembayaran</button>` : '<span class="text-muted">-</span>';
    const hasEvidence = stage => Boolean(stage === 'before' ? order.evidence_before_path : order.evidence_after_path);
    const stageEvidence = stage => hasEvidence(stage)
      ? `<button class="btn btn-sm btn-outline-success" onclick="viewOrderEvidence(${order.id},'${stage}')"><i class="bi bi-image"></i> Lihat</button>`
      : '<span class="text-muted">Belum ada</span>';
    const customerCancelled = order.status === 'Dibatalkan' && order.payment_status === 'Menunggu Verifikasi';
    const payment = customerCancelled
      ? '<span class="badge text-bg-danger">Dibatalkan</span>'
      : order.payment_status === 'Menunggu Verifikasi'
      ? `<button class="btn btn-sm btn-success" onclick="orderPayment(${order.id},'approve')">Terima</button> <button class="btn btn-sm btn-danger" onclick="orderPayment(${order.id},'reject')">Tolak</button>`
      : `<span class="badge ${order.payment_status === 'Lunas' ? 'text-bg-success' : order.payment_status === 'Ditolak' ? 'text-bg-danger' : 'text-bg-warning'}">${batchHtml(order.payment_status)}</span>${reason ? `<button type="button" class="order-reason-link order-payment-reason-link" onclick="showPaymentReason(${order.id})"><i class="bi bi-info-circle"></i><span>Lihat alasan<br>pembayaran</span></button>` : ''}`;
    const status = order.payment_status === 'Lunas' && !['Selesai', 'Dibatalkan'].includes(order.status)
      ? `<span class="badge text-bg-${STC[ST.indexOf(order.status)] || 'secondary'}">${batchHtml(order.status)}</span><button class="btn btn-sm btn-outline-maroon d-block mt-1" onclick="nextStatus(${order.id})">Lanjutkan</button>`
      : `<span class="badge ${order.status === 'Dibatalkan' ? 'text-bg-danger' : 'text-bg-secondary'}">${batchHtml(order.status)}</span>`;
    const paymentFilter = customerCancelled ? 'Dibatalkan' : order.payment_status;
    return `<tr data-payment-status="${batchHtml(paymentFilter)}"><td>${index + 1}</td><td><strong>#${order.id}</strong><br>${batchHtml(order.nama)}<small class="d-block text-muted">${batchHtml(order.telepon || '-')}</small></td>
      <td>${order.items.map(item => `${item.qty}x ${batchHtml(item.nama)}`).join('<br>')}</td><td>${rp(order.total)}</td><td class="order-address-cell">${batchHtml(String(order.alamat || '-').replace(/^Wilayah:\s*/i, ''))}</td><td>${formatDateTime(order.tgl)}</td>
      <td>${payment}</td><td>${proof}</td><td>${status}${order.cancellation_reason ? `<button type="button" class="order-reason-link" onclick="showCancellationReason(${order.id})"><i class="bi bi-info-circle"></i><span>Lihat alasan<br>pembatalan</span></button>` : ''}</td><td>${stageEvidence('before')}<div class="mt-1"><button class="btn btn-sm btn-outline-maroon" onclick="uploadOrderEvidence(${order.id},'before')">Unggah foto</button></div></td>
      <td>${stageEvidence('after')}<div class="mt-1"><button class="btn btn-sm btn-outline-maroon" onclick="uploadOrderEvidence(${order.id},'after')">Unggah foto</button></div></td></tr>`;
  });
  return rows.length
    ? tbl(['No.', 'Pelanggan', 'Produk', 'Total', 'Alamat', 'Tanggal', 'Pembayaran', 'Bukti bayar', 'Status pesanan', 'Bukti sebelum dikirim', 'Bukti setelah dikirim'], rows, 'admin-orders-table')
    : '<div class="box3d p-4 mt-3 text-center text-muted">Belum ada pesanan pelanggan.</div>';
};
function showCancellationReason(id) {
  const reason = orders.find(order => order.id === Number(id))?.cancellation_reason;
  if (!reason) return flash('Alasan pembatalan tidak tersedia.');
  modal('Alasan Pembatalan', `<div class="order-reason-card">
    <span class="badge text-bg-secondary mb-2"><i class="bi bi-info-circle me-1"></i>Catatan pelanggan</span>
    <strong class="d-block mb-1">Alasan pembatalan pesanan</strong>
    <p>${batchHtml(reason)}</p>
  </div>`);
}
function viewFeedbackAttachment(id, type) {
  const url = `${API_URL}?action=feedback-attachment&id=${encodeURIComponent(id)}`;
  const content = type === 'video'
    ? `<video src="${url}" class="img-fluid rounded" controls playsinline></video>`
    : `<img src="${url}" class="img-fluid rounded" alt="Lampiran feedback">`;
  modal('Lampiran Feedback', `<div class="text-center">${content}</div>`);
}
const batchHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const adminLayout = (r, c) => `<div class="admin-shell"><aside class="side"><div class="side-brand">Admin KU-KISS</div>${[['dashboard', 'house-door', 'Dashboard'], ['produk', 'tag', 'Produk'], ['rekap', 'clipboard-data', 'Rekap Pesanan'], ['batch', 'calendar-check', 'Batch PO'], ['bahan', 'boxes', 'Bahan Baku'], ['penjualan', 'cash-stack', 'Pesanan'], ['feedback', 'chat-left-text', 'Feedback'], ['laporan', 'graph-up-arrow', 'Laporan pemasukan']].map(([href, icon, title]) => `<a class="${href === r ? 'on' : ''}" href="#/admin/${href}"><i class="bi bi-${icon} me-2"></i>${title}${href === 'penjualan' && unreadAdminOrderNotificationCount() ? `<span class="badge text-bg-danger ms-2">${unreadAdminOrderNotificationCount()}</span>` : ''}${href === 'feedback' && unreadAdminFeedbackCount() ? `<span class="badge text-bg-warning ms-2">${unreadAdminFeedbackCount()}</span>` : ''}</a>`).join('')}<a class="out" onclick="logout()">Keluar</a></aside>
<div class="admin-main"><div class="topbar"><div class="search"><i class="bi bi-search"></i><input placeholder="Cari pesanan atau bahan baku" value="${batchHtml(adminSearchText)}" oninput="adminGlobalSearch(this.value)"></div><span>Hi, Selamat Datang Admin <img src="${user?.foto ? productImage(user.foto) : EMPTY_PROFILE_IMAGE}" alt="Foto profil admin" class="admin-profile-avatar ms-2"></span></div><main class="admin-content"><div class="box3d admin-card">${c}</div></main></div></div>`;

function filterAdminOrders() {
  const status = $('#orderStatusFilter')?.value || '';
  const query = adminSearchText.trim().toLowerCase();
  $$('.tbl tbody tr[data-payment-status]').forEach(row => {
    row.hidden = (status && row.dataset.paymentStatus !== status) || (query && !row.textContent.toLowerCase().includes(query));
  });
  updateTableCounts();
}

function filterIngredients() {
  const filter = $('#ingredientStatusFilter')?.value || '';
  const query = adminSearchText.trim().toLowerCase();
  $$('#ingredientTable tbody tr[data-ingredient-name]').forEach(row => {
    row.hidden = (filter && row.dataset.ingredientStatus !== filter) || (query && !row.dataset.ingredientName.includes(query));
  });
  updateTableCounts();
}

function updateTableCounts() {
  $$('.admin-card .tbl').forEach(table => {
    const countLabel = table.parentElement.nextElementSibling?.querySelector('.pager-count');
    if (!countLabel) return;
    const rows = [...table.querySelectorAll('tbody tr')];
    const visible = rows.filter(row => !row.hidden).length;
    const total = Number(countLabel.dataset.total);
    countLabel.textContent = `Menampilkan ${visible ? 1 : 0} sampai ${visible} dari ${total} Data`;
  });
}

function adminGlobalSearch(value) {
  adminSearchText = value;
  const page = location.hash.slice(2).split('/')[1];
  if (page === 'penjualan') return filterAdminOrders();
  if (page === 'bahan') return filterIngredients();
  const query = value.trim().toLowerCase();
  $$('.admin-card tbody tr').forEach(row => { row.hidden = query && !row.textContent.toLowerCase().includes(query); });
  updateTableCounts();
}

function ingredientStatus(ingredient) {
  const available = typeof ingredient.available === 'boolean'
    ? ingredient.available
    : Number(ingredient.quantity) > 0;
  return available ? 'tersedia' : 'tidak-tersedia';
}

function ingredientsPage() {
  const rows = ingredients.map((ingredient, index) => {
    const status = ingredientStatus(ingredient);
    const badge = status === 'tersedia' ? 'text-bg-success' : 'text-bg-danger';
    return `<tr data-ingredient-name="${batchHtml(ingredient.name.toLowerCase())}" data-ingredient-status="${status}">
      <td>${index + 1}</td><td>${batchHtml(ingredient.name)}</td>
      <td><span class="badge ${badge}">${status === 'tersedia' ? 'Tersedia' : 'Tidak tersedia'}</span></td>
      <td><button class="btn btn-sm btn-outline-primary" onclick="ingredientForm(${ingredient.id})">Edit</button> <button class="btn btn-sm btn-outline-danger" onclick="deleteIngredient(${ingredient.id})">Hapus</button></td></tr>`;
  });
  return `<div class="d-flex justify-content-between align-items-start flex-wrap gap-2"><div><h4 class="mb-1">Bahan Baku</h4><p class="text-muted mb-0">Kelola nama bahan baku dan ketersediaannya.</p></div><button class="btn btn-maroon btn-sm" onclick="ingredientForm()"><i class="bi bi-plus-lg me-1"></i>Tambah bahan</button></div>
    <div class="d-flex flex-wrap gap-2 mt-3"><select id="ingredientStatusFilter" class="form-select form-select-sm admin-filter" onchange="filterIngredients()"><option value="">Semua ketersediaan</option><option value="tersedia">Tersedia</option><option value="tidak-tersedia">Tidak tersedia</option></select></div>
    <div id="ingredientTable">${rows.length ? tbl(['No.', 'Nama bahan', 'Status', 'Aksi'], rows) : '<div class="box3d p-4 mt-3 text-center text-muted">Belum ada bahan baku. Tambahkan bahan pertama untuk mulai mencatat stok.</div>'}</div>`;
}

// ============================================================
