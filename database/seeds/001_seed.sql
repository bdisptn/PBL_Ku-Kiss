-- ============================================================
-- Data awal MANIS. Jalankan setelah seluruh migration (001 dan 002).
--
-- Akun admin awal:
--   username : admin
--   password : admin123
-- WAJIB diganti sebelum website dipakai sungguhan
-- (buat hash baru dengan: php -r "echo password_hash('PASSWORD_BARU', PASSWORD_DEFAULT);")
-- ============================================================

INSERT INTO admin (username, password, nama) VALUES
    ('admin', '$2y$10$HefG0YPKT5Sx8iQgb6iL4OEjNlDdBxCIQ8/zwxThP2vvutD7GPQTa', 'Pemilik Ku-Kiss')
ON CONFLICT (username) DO NOTHING;

-- Contoh produk (gambar bisa diunggah lewat halaman admin)
INSERT INTO produk (kode_produk, nama_produk, deskripsi, harga, stok, id_kategori)
SELECT p.kode, p.nama, p.deskripsi, p.harga, p.stok, k.id_kategori
FROM (VALUES
    ('COO:CHO-001', 'Cookies Cokelat',   'Cookies renyah dengan potongan cokelat.', 15000, 50, 'Cookies'),
    ('COO:KEJ-001', 'Cookies Keju',      'Cookies gurih dengan taburan keju.',      17000, 40, 'Cookies'),
    ('BRO:PAN-001', 'Brownies Panggang', 'Brownies lembut dengan topping kacang.',  20000, 30, 'Browniez')
) AS p(kode, nama, deskripsi, harga, stok, kategori)
JOIN kategori k ON k.nama_kategori = p.kategori;

-- Contoh batch PO yang langsung terbuka selama 7 hari
INSERT INTO batch_po (id_admin, nama_batch, tanggal_buka, tanggal_tutup, status_batch)
SELECT id_admin, 'PO Contoh', CURRENT_DATE, CURRENT_DATE + 7, 'dibuka'
FROM admin WHERE username = 'admin';
