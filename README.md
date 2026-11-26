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
- Dashboard admin menyediakan notifikasi pesanan masuk, pembatalan, dan kritik/saran; daftar pesanan, alasan penolakan pembayaran, bukti foto sebelum/sesudah pengiriman, halaman feedback beserta lampiran, pengelolaan bahan baku, dan laporan. Bahan baku serta catatan pengeluaran tersimpan di database; pengeluaran menyimpan relasi bahan baku dan snapshot namanya.
- Data akun, katalog, pesanan, feedback, lampiran privat, bahan baku, pengeluaran, serta status baca notifikasi tersimpan melalui API PHP ke database. Notifikasi in-app dibatasi pada aplikasi (tanpa Web Push/WhatsApp); keranjang dan draf feedback tetap disimpan di browser.
- Pemasukan Batch PO dihitung dari relasi batch pada pesanan, bukan perkiraan tanggal. Status bahan baku menandai ketersediaan dan tidak mengubah jumlah stok otomatis saat pengeluaran dibuat.
- Ongkir pengantaran ditentukan berdasarkan wilayah yang dipilih, dengan tarif tersimpan di tabel `wilayah_ongkir`; backend memakai tarif database saat menghitung total pesanan.

- `admin-data` mengirim feedback, notifikasi, bahan baku, pengeluaran, dan relasi batch pesanan untuk tampilan admin. Feedback umum menerima JSON; feedback per pesanan dapat menyertakan lampiran multipart. Lampiran feedback hanya dapat diambil admin melalui endpoint terautentikasi.
- `ingredient-save` dan `ingredient-delete` mengelola bahan baku di database. `expense-save` memerlukan `ingredient_id`; nama bahan pada catatan pengeluaran disimpan sebagai snapshot, dan relasi bahan dapat dilepas saat bahan dihapus.
- Notifikasi pelanggan/admin disimpan di `notifikasi_aplikasi`; endpoint `notifications`, `notification-read`, `notification-read-all`, dan `notification-read-section` mengambil serta memperbarui status bacanya. Membuka halaman Pesanan/Feedback admin otomatis menandai notifikasi terkait sudah dibaca tanpa mengubah status pesanan; membuka halaman Notifikasi menandai semua notifikasi sebagai dibaca. Semua pelanggan menerima notifikasi ketika batch PO dibuka atau ditutup; notifikasi batch dapat dibuka untuk menuju menu, dan membuka halaman Notifikasi pelanggan juga menandainya sudah dibaca.
- `orders` dan `admin-data.orders` mengirim `scheduled_date`, yang memakai tanggal pengambilan pesanan jika tersedia atau tanggal tutup batch PO. Endpoint `order-cancel` memvalidasi batas H-3 di server.
- Bukti sebelum/sesudah pesanan disimpan lewat `order-evidence-save` dan hanya dapat dilihat admin atau pelanggan pemilik pesanan melalui `order-evidence`.
- Alasan penolakan pembayaran disimpan pada pesanan dan dikirim sebagai `payment_reason` pada respons API.
- Alasan pembatalan pelanggan wajib dipilih atau ditulis, disimpan pada pesanan, dan ditampilkan kepada admin serta pelanggan.
- Jalankan ulang `database/schema.sql` setelah pembaruan untuk menambahkan tabel bahan baku/notifikasi, relasi bahan pada pengeluaran, serta kolom/indeks yang diperlukan pada database yang sudah ada.
- Untuk menambahkan tabel tarif ongkir dan mengisi tarif awal, jalankan `database/schema.sql` lalu `database/seed.sql`. Perubahan nominal selanjutnya dapat dilakukan pada tabel `wilayah_ongkir`.

## Persyaratan
- PHP 8.1 atau lebih baru dengan ekstensi PDO PostgreSQL (`pdo_pgsql`), `fileinfo`, dan `mbstring`.
- PostgreSQL 13 atau lebih baru.
- Koneksi internet untuk Bootstrap, Bootstrap Icons, Google Fonts, dan Chart.js CDN.

## Skema database
Backend menggunakan skema PostgreSQL KU-KISS: `admin`, `pelanggan`, `kategori`, `produk`, `batch_po`, `wilayah_ongkir`, `pesanan`, `detail_pesanan`, `feedback`, `bahan_baku`, `pengeluaran`, `notifikasi_aplikasi`, `login_percobaan`, dan `notifikasi`. `database/schema.sql` membuat tabel yang belum ada, memperbarui batasan status pembayaran/pesanan, serta menghapus kolom stok produk yang sudah tidak digunakan.

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
