-- ============================================================
-- Data awal MANIS. Jalankan SETELAH migrations/001_create_tables.sql
--
-- Akun admin awal:
--   username : admin
--   password : admin123
-- WAJIB diganti sebelum website dipakai sungguhan
-- (buat hash baru dengan: php -r "echo password_hash('PASSWORD_BARU', PASSWORD_DEFAULT);")
-- ============================================================

INSERT INTO admin (username, password, nama) VALUES
    ('admin', '$2y$10$r7EvjUbGxkDG1fQi3W3kGeKdtpJAfGM0QZyy4YFTolErZbfCNbHp2', 'Pemilik Ku-Kiss')
ON CONFLICT (username) DO NOTHING;

-- Contoh produk (gambar bisa diunggah lewat halaman admin)
INSERT INTO produk (nama_produk, deskripsi, harga, stok) VALUES
    ('Cookies Cokelat',   'Cookies renyah dengan potongan cokelat.', 15000, 50),
    ('Cookies Keju',      'Cookies gurih dengan taburan keju.',      17000, 40),
    ('Brownies Panggang', 'Brownies lembut dengan topping kacang.',  20000, 30);

-- Contoh batch PO yang langsung terbuka selama 7 hari
INSERT INTO batch_po (id_admin, nama_batch, tanggal_buka, tanggal_tutup, status_batch)
SELECT id_admin, 'PO Contoh', CURRENT_DATE, CURRENT_DATE + 7, 'dibuka'
FROM admin WHERE username = 'admin';
