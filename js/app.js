// 6. ROUTER: menentukan halaman dari alamat hash URL
// ============================================================
let renderSequence = 0;
async function render() {
  const sequence = ++renderSequence;
  const [r = '', a, b] = location.hash.slice(2).split('/');
  const root = $('#root');

  if (!appReady) {
    root.innerHTML = site('<div class="box3d p-5 text-center"><div class="spinner-border text-maroon" role="status"></div><p class="mt-3 mb-0">Memuat aplikasi...</p></div>');
    return;
  }
  if (r === 'admin') {
    if (!user || user.role !== 'admin') {
      root.innerHTML = site('<div class="box3d p-5 text-center">Halaman ini khusus admin. <a href="#/login" class="text-maroon">Login dulu</a></div>');
      return;
    }
    if (!adminDataLoaded) {
      root.innerHTML = site('<div class="box3d p-5 text-center"><div class="spinner-border text-maroon" role="status"></div><p class="mt-3 mb-0">Memuat data admin...</p></div>');
      try {
        await loadAdminData();
      } catch (error) {
        if (sequence === renderSequence) root.innerHTML = site(`<div class="box3d p-5 text-center">${error.message}<button class="btn btn-maroon d-block mx-auto mt-3" onclick="render()">Coba lagi</button></div>`);
        return;
      }
      if (sequence !== renderSequence) return;
    }
    const halamanAdmin = a === 'laporan' && b ? reportDetail(b) : (A[a] || A.dashboard)();
    root.innerHTML = adminLayout(a || 'dashboard', halamanAdmin);
    startAdminNotificationPolling();
    if (a === 'penjualan') filterAdminOrders();
    else if (a === 'bahan') filterIngredients();
    else if (adminSearchText) adminGlobalSearch(adminSearchText);
  } else {
    if (r === 'notifikasi' && user?.role === 'customer' && !customerNotificationsLoaded) {
      root.innerHTML = site('<div class="box3d p-5 text-center"><div class="spinner-border text-maroon" role="status"></div><p class="mt-3 mb-0">Memuat notifikasi...</p></div>');
      try {
        await loadCustomerNotifications();
      } catch (error) {
        if (sequence === renderSequence) root.innerHTML = site(`<div class="box3d p-5 text-center">${error.message}<button class="btn btn-maroon d-block mx-auto mt-3" onclick="render()">Coba lagi</button></div>`);
        return;
      }
      if (sequence !== renderSequence) return;
    }
    if ((r === 'riwayat' || r === 'pesanan' || r === 'feedback') && user && !ordersLoaded) {
      root.innerHTML = site('<div class="box3d p-5 text-center"><div class="spinner-border text-maroon" role="status"></div><p class="mt-3 mb-0">Memuat riwayat pesanan...</p></div>');
      try {
        await loadOrders();
      } catch (error) {
        if (sequence === renderSequence) root.innerHTML = site(`<div class="box3d p-5 text-center">${error.message}<button class="btn btn-maroon d-block mx-auto mt-3" onclick="render()">Coba lagi</button></div>`);
        return;
      }
      if (sequence !== renderSequence) return;
    }
    const page = r === 'pesanan' && !a ? P.riwayat : P[r || 'home'];
    root.innerHTML = site(page ? page(a) : P.home());
    if (user?.role === 'customer' && !customerNotificationsLoaded) {
      loadCustomerNotifications().then(() => {
        if (sequence === renderSequence) render();
      }).catch(error => {
        if (sequence === renderSequence) flash(`Notifikasi gagal dimuat: ${error.message}`);
      });
    }

    if (r === 'about' && $('#about')) {
      $('#about').scrollIntoView();
    }
  }

  chart();
}
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });
loadBootstrap().then(render).catch(error => {
  $('#root').innerHTML = `<div class="container py-5"><div class="box3d p-5 text-center"><h5 class="text-maroon">Aplikasi belum dapat dimuat</h5><p>${error.message}</p><button class="btn btn-maroon" onclick="location.reload()">Coba lagi</button></div></div>`;
});
