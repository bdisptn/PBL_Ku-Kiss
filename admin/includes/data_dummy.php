<?php
// DATA CONTOH untuk tampilan. BACKEND: ganti isi file ini dengan hasil query/API,
// pertahankan nama kunci array agar markup halaman tidak perlu diubah.
$kategori = [
  ['id' => 1, 'kode' => 'COO', 'nama' => 'Cookies'],
  ['id' => 2, 'kode' => 'BRO', 'nama' => 'Browniez'],
];
$produk = [
  ['id' => 1, 'kode' => 'COO-MAT-001', 'nama' => 'Cookies Varian Matcha', 'kategori' => 'Cookies', 'deskripsi' => 'Cookies matcha dengan white chocolate.', 'harga' => 15000, 'stok' => 50, 'gambar' => 'matcha.png'],
  ['id' => 2, 'kode' => 'COO-ORI-001', 'nama' => 'Cookies Varian Original', 'kategori' => 'Cookies', 'deskripsi' => 'Cookies choco chip klasik.', 'harga' => 15000, 'stok' => 2, 'gambar' => 'biscoff.png'],
  ['id' => 3, 'kode' => 'COO-RED-001', 'nama' => 'Cookies Varian Red Velvet', 'kategori' => 'Cookies', 'deskripsi' => 'Cookies red velvet dengan white chocolate.', 'harga' => 15000, 'stok' => 4, 'gambar' => 'redvelvet.png'],
  ['id' => 4, 'kode' => 'COO-DBC-001', 'nama' => 'Cookies Varian Double Choco', 'kategori' => 'Cookies', 'deskripsi' => 'Cookies double chocolate.', 'harga' => 15000, 'stok' => 3, 'gambar' => 'pistachio.png'],
  ['id' => 5, 'kode' => 'COO-MON-001', 'nama' => 'Cookies Varian Cookie Monster', 'kategori' => 'Cookies', 'deskripsi' => 'Cookies biru dengan potongan cookie.', 'harga' => 15000, 'stok' => 100, 'gambar' => 'cookie-monster.png'],
];
$batas_stok = 5;
$pesanan = [
  ['id' => 1, 'pelanggan' => 'Marcello Artasda', 'telp' => '081234474411', 'item' => ['3x Cookies Varian Matcha', '1x Cookies Varian Red Velvet'], 'total' => 65000, 'pengambilan' => 'Pengantaran', 'alamat' => 'Jl Pisang Kipas No 70', 'tanggal' => '2026-11-05 09:30:33', 'bukti' => 'logo.png', 'bayar' => 'Lunas', 'status' => 'Diproses'],
  ['id' => 2, 'pelanggan' => 'Naila Putri', 'telp' => '081200000002', 'item' => ['2x Cookies Varian Original'], 'total' => 30000, 'pengambilan' => 'Pick Up', 'alamat' => '', 'tanggal' => '2026-11-04 14:10:00', 'bukti' => null, 'bayar' => 'Belum Dibayar', 'status' => 'Diproses'],
  ['id' => 3, 'pelanggan' => 'Budi Septian', 'telp' => '081200000003', 'item' => ['5x Cookies Varian Cookie Monster'], 'total' => 75000, 'pengambilan' => 'Pick Up', 'alamat' => '', 'tanggal' => '2026-10-20 10:00:00', 'bukti' => 'logo.png', 'bayar' => 'Lunas', 'status' => 'Selesai'],
  ['id' => 4, 'pelanggan' => 'Aisya Noor', 'telp' => '081200000004', 'item' => ['4x Cookies Varian Double Choco'], 'total' => 65000, 'pengambilan' => 'Pengantaran', 'alamat' => 'Jl Soekarno Hatta 9', 'tanggal' => '2026-10-12 16:45:10', 'bukti' => 'logo.png', 'bayar' => 'Lunas', 'status' => 'Siap Diambil'],
];
$pengeluaran = [
  ['id' => 1, 'tanggal' => '2026-11-02', 'keterangan' => 'Bahan baku', 'nominal' => 30000],
  ['id' => 2, 'tanggal' => '2026-10-05', 'keterangan' => 'Kemasan', 'nominal' => 25000],
];
// Angka dashboard/laporan dihitung dari data contoh di atas (hanya pesanan Lunas).
$bulan_ini = '2026-11';
$masuk = $keluar = [];
foreach ($pesanan as $p) if ($p['bayar'] === 'Lunas') { $b = substr($p['tanggal'], 0, 7); $masuk[$b] = ($masuk[$b] ?? 0) + $p['total']; }
foreach ($pengeluaran as $x) { $b = substr($x['tanggal'], 0, 7); $keluar[$b] = ($keluar[$b] ?? 0) + $x['nominal']; }
$bulan_daftar = array_unique(array_merge(array_keys($masuk), array_keys($keluar))); rsort($bulan_daftar);