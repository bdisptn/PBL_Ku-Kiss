-- ============================================================
-- Data dummy PELANGGAN untuk percobaan. Jalankan SETELAH 001_create_tables.sql
-- (tidak harus setelah 001_seed.sql). Semua data fiktif.
--
-- Semua akun memakai password yang sama:  password123
-- Login pelanggan bisa memakai username ATAU email.
-- Aman dijalankan berulang: akun yang sudah ada dilewati.
-- ============================================================

INSERT INTO pelanggan (username, email, password, nama, no_telp, alamat) VALUES
    ('sinta_dewi',   'sinta.dewi@example.com',   '$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', 'Sinta Dewi',     '081234567890', 'Jl. Mawar No. 5, Malang'),
    ('rama_pratama', 'rama.pratama@example.com', '$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', 'Rama Pratama',   '085712345678', 'Jl. Melati No. 12, Malang'),
    ('dina_lestari', 'dina.lestari@example.com', '$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', 'Dina Lestari',   '082198765432', 'Jl. Kenanga No. 8, Malang'),
    ('budi_santoso', 'budi.santoso@example.com', '$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', 'Budi Santoso',   '081355501234', 'Jl. Kamboja No. 21, Malang'),
    ('ayu_wulandari','ayu.wulandari@example.com','$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', 'Ayu Wulandari',  '087855509876', 'Jl. Anggrek No. 3, Batu'),
    ('fajar_nugroho','fajar.nugroho@example.com','$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', 'Fajar Nugroho',  '089655502468', 'Jl. Dahlia No. 17, Malang'),
    ('maya_putri',   'maya.putri@example.com',   '$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', 'Maya Putri',     '081955507531', 'Jl. Flamboyan No. 9, Malang'),
    ('akun_baru',    'akun.baru@example.com',    '$2y$10$JksmIPydPisyk/VKdSH8NOIx0UT8A8ZhXNG8E9fRvyJZPbRIHGARK', NULL,             NULL,           NULL)
ON CONFLICT DO NOTHING;

-- Catatan: 'akun_baru' sengaja belum punya nama, nomor HP, dan alamat,
-- untuk menguji alur pelanggan yang baru mendaftar lalu melengkapi data saat checkout.
