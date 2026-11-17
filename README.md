# KU-KISS

Aplikasi pemesanan cookies dengan frontend JavaScript, backend PHP, dan database PostgreSQL.

## Struktur frontend
- `index.html`: kerangka halaman dan urutan pemuatan skrip.
- `css/style.css`: gaya komponen serta layout responsif pelanggan/admin.
- `js/state.js`: state aplikasi, helper, komunikasi API, dan pemetaan data backend.
- `js/customer.js`: navbar, footer, dan halaman pelanggan.
- `js/admin.js`: halaman dashboard, penjualan, rekap produk per batch PO, dan laporan admin.
- `js/actions.js`: aksi form, keranjang, pesanan, profil, dan pengelolaan admin.
- `js/app.js`: entry point, router hash, pemuatan data halaman, dan render.
- `img/`: logo dan aset gambar produk.

Skrip frontend saat ini menggunakan skrip browser klasik, bukan ES modules. Pertahankan urutan pemuatan di `index.html`: `state.js` → `customer.js` → `admin.js` → `actions.js` → `app.js`, karena beberapa handler HTML menggunakan fungsi global.

## Fitur
- Pelanggan dapat mendaftar/login, melihat katalog, berbelanja, mengunggah bukti pembayaran, serta melihat riwayat dan progres pesanan.
- Admin dapat mengelola produk dan batch PO, serta melihat rekap produk per batch, pesanan, pengeluaran, dan laporan.
- Data akun, katalog, pesanan, dan laporan disimpan melalui API PHP ke database; keranjang disimpan di browser.

## Persyaratan
- PHP 8.1 atau lebih baru dengan ekstensi PDO PostgreSQL (`pdo_pgsql`), `fileinfo`, dan `mbstring`.
- PostgreSQL 13 atau lebih baru.
- Koneksi internet untuk Bootstrap, Bootstrap Icons, Google Fonts, dan Chart.js CDN.

## Skema database
Backend menggunakan skema PostgreSQL KU-KISS yang sudah ada: `admin`, `pelanggan`, `kategori`, `produk`, `batch_po`, `pesanan`, `detail_pesanan`, `pengeluaran`, `login_percobaan`, dan `notifikasi`. `database/schema.sql` membuat tabel yang belum ada, memperbarui batasan status pembayaran/pesanan, serta menghapus kolom stok produk yang sudah tidak digunakan.

Untuk menyiapkan database baru, buat role dan database PostgreSQL. Ganti password contoh dengan password kuat:
   ```sql
   CREATE ROLE kukiss_app LOGIN PASSWORD 'GANTI_DENGAN_PASSWORD_KUAT';
   CREATE DATABASE "Ku_Kiss" OWNER kukiss_app ENCODING 'UTF8' TEMPLATE template0;
   ```
Buat `config/config.php` berisi pengaturan koneksi PostgreSQL (`driver`, `host`, `port`, `name`, `user`, dan `password`). File ini bersifat lokal dan tidak dilacak Git; jangan commit kredensial database. Buat tabel dan katalog awal:
   ```powershell
   psql -h 127.0.0.1 -U kukiss_app -d "Ku_Kiss" -f database/schema.sql
   psql -h 127.0.0.1 -U kukiss_app -d "Ku_Kiss" -f database/seed.sql
   ```
Buat akun admin dari terminal menggunakan `php scripts/create-admin.php`, lalu ikuti prompt. Password admin minimal 12 karakter.

Checkout hanya tersedia jika ada batch dengan status `dibuka` yang tanggal bukanya dan tanggal tutupnya mencakup hari ini. Admin dapat membuka menu **Batch PO** di halaman admin, pilih **Buat & Buka Batch PO**, lalu isi nama batch dan tanggalnya. Batch yang jadwalnya bertabrakan dengan batch lain yang masih dibuka akan ditolak. Tombol **Tutup Batch** menghentikan pesanan baru untuk batch tersebut; pesanan yang sudah masuk tetap tersimpan. Jika perlu, batch juga dapat dibuat langsung melalui pgAdmin dengan menyesuaikan username admin:
   ```sql
   INSERT INTO batch_po (id_admin, nama_batch, tanggal_buka, tanggal_tutup, status_batch)
   SELECT id_admin, 'PO Website ' || to_char(CURRENT_DATE, 'YYYY-MM-DD'),
          CURRENT_DATE, CURRENT_DATE + 30, 'dibuka'
   FROM admin
   WHERE username = 'admin';
   ```
Login admin menggunakan username; pelanggan menggunakan email.

## Menjalankan aplikasi lokal
1. Jalankan `php -S 127.0.0.1:8000 router.php` dari folder proyek.
2. Buka `http://127.0.0.1:8000`. Jangan membuka `index.html` langsung atau memakai server statis saja.

## Konfigurasi produksi
- Gunakan akun database khusus aplikasi dengan hak akses minimum, bukan akun root.
- Sajikan aplikasi melalui HTTPS dan lindungi `config/` serta `storage/` di web server.
- Jadwalkan backup database, `storage/`, dan `public/uploads/`.
- Siapkan SMTP dan kebijakan verifikasi email/reset password sebelum membuka pendaftaran ke publik.
