INSERT INTO kategori (kode_kategori, nama_kategori) VALUES
  ('COO', 'Cookies'),
  ('BRO', 'Browniez')
ON CONFLICT (kode_kategori) DO NOTHING;

INSERT INTO produk (kode_produk, nama_produk, deskripsi, harga, id_kategori, gambar) VALUES
  ('COO-MAT-001', 'Cookies Varian Matcha', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusod tempor incididunt ut labore et dolore magna aliqua. Quis ipsu msuspendisse', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'matcha.png'),
  ('COO-ORI-001', 'Cookies Varian Original', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusod tempor incididunt ut labore et dolore magna aliqua. Quis ipsu msuspendisse', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'biscoff.png'),
  ('COO-RED-001', 'Cookies Varian Red Velvet', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusod tempor incididunt ut labore et dolore magna aliqua. Quis ipsu msuspendisse', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'redvelvet.png'),
  ('COO-DBC-001', 'Cookies Varian Double Choco', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusod tempor incididunt ut labore et dolore magna aliqua. Quis ipsu msuspendisse', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'pistachio.png'),
  ('COO-MON-001', 'Cookies Varian Cookie Monster', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusod tempor incididunt ut labore et dolore magna aliqua. Quis ipsu msuspendisse', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'cookie-monster.png')
ON CONFLICT (kode_produk) DO NOTHING;
