# KU-KISS — Frontend PBL

## Struktur file
- `index.html`: kerangka HTML dan pemanggilan Bootstrap, Bootstrap Icons, Chart.js, CSS, dan JavaScript.
- `css/style.css`: seluruh gaya visual website, termasuk tampilan responsif untuk layar kecil.
- `js/app.js`: data demo, navigasi halaman, halaman pelanggan, halaman admin, form, keranjang, checkout, dan laporan.
- `img/`: logo KU-KISS, foto produk Original, Double Choco, Matcha, Red Velvet, dan foto profil pembeli.

## Fitur yang tersedia
### Pelanggan
- Home, menu, detail produk, keranjang, checkout, status/progres pesanan, login, dan daftar.
- Ikon profil pada navbar membuka halaman profil.
- Profil dapat menyimpan nama, email, nomor handphone, password demo, dan foto profil di `localStorage`.

### Admin
- Dashboard ringkasan uang masuk/keluar dan grafik.
- Kelola produk, termasuk menambahkan foto, kategori, stok, dan status penjualan.
- Laporan bulanan serta halaman detail laporan yang dapat dicetak/disimpan sebagai PDF melalui dialog print browser.
- Tombol bukti pembayaran masih berupa contoh tampilan karena belum terhubung ke backend.

## Cara menjalankan
1. Ekstrak folder project.
2. Buka folder `ku-kiss` di Visual Studio Code.
3. Jalankan `index.html` menggunakan ekstensi Live Server atau buka langsung di browser.
4. Untuk masuk ke halaman admin demo, gunakan email yang mengandung kata `admin`, misalnya `admin@kukiss.test`.

## Catatan
- Data saat ini disimpan sementara di `localStorage`, belum menggunakan database/backend.
- Foto produk yang diunggah dari halaman admin demo diubah ukurannya dan disimpan di `localStorage` browser, sehingga hanya tersedia pada browser/perangkat tersebut.
- Foto logo, varian Original, Double Choco, Matcha, Red Velvet, dan profil pembeli sudah disesuaikan dengan gambar yang diberikan.
- Sebelum dipakai sebagai aplikasi nyata, autentikasi, penyimpanan bukti pembayaran, dan transaksi perlu dihubungkan ke backend serta divalidasi.


Revisi terbaru: tampilan detail produk diperbesar dan dibuat responsif, tombol Simpan Perubahan pada profil baru tampil setelah tombol Edit ditekan, serta produk Oreo diganti menjadi Cookies Varian Cookie Monster.
