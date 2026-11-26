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
- Admin dapat mengelola produk, batch PO, dan pesanan; melihat ringkasan pemasukan, pembayaran yang menunggu verifikasi, serta pengeluaran bulan ini; melihat laporan pemasukan/pengeluaran bulanan; dan melihat pemasukan lunas pada daftar Batch PO.
- Dashboard admin menyediakan notifikasi pesanan/feedback, daftar pesanan, alasan penolakan pembayaran, bukti foto sebelum/sesudah pengiriman, halaman feedback, pencarian bahan baku, dan laporan. Form bahan baku hanya memuat nama serta status tersedia/tidak tersedia.
- Data akun, katalog, pesanan, dan laporan tersimpan melalui API PHP ke database; keranjang dan status baca notifikasi disimpan di browser. Data bahan baku serta alasan penolakan yang belum dikirim/diterima oleh API tetap lokal di browser admin. Unggah bukti, pengiriman feedback, daftar feedback admin, dan pembatalan pelanggan memerlukan endpoint backend; frontend menampilkan kegagalan API dan tidak menganggap data lokal sebagai berhasil terkirim.
- Pemasukan pada daftar Batch PO diestimasi berdasarkan kecocokan tanggal pesanan dengan rentang tanggal batch; API saat ini belum mengirimkan relasi batch pada data pesanan, sehingga laporan historis memerlukan integrasi backend agar akurat. Status bahan baku hanya menandai ketersediaan dan tidak mengubah stok saat catatan pengeluaran dibuat.

### Integrasi backend untuk revisi frontend
Bagian ini adalah kontrak yang diharapkan frontend; perubahan endpoint/database dikerjakan terpisah di backend.
- `admin-data` perlu mengirim `feedback` (array berisi `id`, `customer_name`, `order_id`, `message`, dan `created_at`) agar notifikasi serta rekap feedback admin terisi.
- `orders`/`admin-data.orders` perlu mengirim `scheduled_date` atau `cancellation_deadline` untuk menampilkan batas pembatalan H-3. Frontend menolak pembatalan tanpa jadwal, tetapi backend tetap wajib memvalidasi H-3 secara otoritatif pada endpoint `order-cancel` (`POST` JSON `{ "id": <order_id> }`).
- `feedback-create` menerima `POST` multipart (`message`, opsional `order_id` dan `attachment`) untuk form feedback per pesanan, atau `POST` JSON (`message`, opsional `order_id`) untuk feedback umum.
- `order-evidence-save` menerima `POST` multipart (`order_id`, `stage` bernilai `before`/`after`, dan `image`). Respons `admin-data.orders` perlu mengembalikan `evidence_before_path`/`evidence_after_path`; `order-evidence` (`GET` dengan `id` dan `stage`) perlu menyajikan gambar yang diizinkan untuk dilihat pelanggan terkait.
- Agar alasan penolakan tersedia konsisten untuk pelanggan, respons `orders` dan `admin-data.orders` perlu mengirim `payment_reason` atau `rejection_reason`; penyimpanan lokal admin hanya berlaku pada browser yang melakukan penolakan.

## Persyaratan
- PHP 8.1 atau lebih baru dengan ekstensi PDO PostgreSQL (`pdo_pgsql`), `fileinfo`, dan `mbstring`.
- PostgreSQL 13 atau lebih baru.
- Koneksi internet untuk Bootstrap, Bootstrap Icons, Google Fonts, dan Chart.js CDN.

## Skema database
Backend menggunakan skema PostgreSQL KU-KISS yang sudah ada: `admin`, `pelanggan`, `kategori`, `produk`, `batch_po`, `pesanan`, `detail_pesanan`, `pengeluaran`, `login_percobaan`, dan `notifikasi`. `database/schema.sql` membuat tabel yang belum ada, memperbarui batasan status pembayaran/pesanan, serta menghapus kolom stok produk yang sudah tidak digunakan.

### Setup lokal melalui pgAdmin (Windows)
Jalankan pgAdmin dan hubungkan ke server PostgreSQL lokal. Buka **Query Tool** pada database `postgres`, jalankan perintah pertama, lalu jalankan perintah kedua secara terpisah. Ganti password contoh dengan password kuat dan simpan karena akan dipakai di konfigurasi aplikasi:
   ```sql
   CREATE ROLE kukiss_app LOGIN PASSWORD 'GANTI_DENGAN_PASSWORD_KUAT';
   ```
   ```sql
   CREATE DATABASE "Ku_Kiss" OWNER kukiss_app ENCODING 'UTF8' TEMPLATE template0;
   ```

Salin template konfigurasi, lalu buka `config/config.php` dan isi `password` dengan password role `kukiss_app` yang baru dibuat:
   ```powershell
   Copy-Item config/config.example.php config/config.php
   ```

Di pgAdmin, klik kanan database `Ku_Kiss` → **Query Tool**, lalu buka dan jalankan `database/schema.sql`. Setelah selesai, buka dan jalankan `database/seed.sql` pada Query Tool yang sama. Jangan jalankan file skema pada database `postgres`.

`config/config.php` bersifat lokal dan tidak dilacak Git; jangan commit kredensial database. Untuk membuat akun admin, jalankan `php scripts/create-admin.php` dari folder proyek, lalu ikuti prompt. Password admin minimal 12 karakter.

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
