INSERT INTO kategori (kode_kategori, nama_kategori) VALUES
  ('COO', 'Cookies'),
  ('BRO', 'Browniez')
ON CONFLICT (kode_kategori) DO NOTHING;

INSERT INTO wilayah_ongkir (nama_wilayah, ongkir) VALUES
  ('Tunggulwulung', 0),
  ('Dinoyo', 3000),
  ('Jatimulyo', 3000),
  ('Ketawanggede', 3000),
  ('Merjosari', 5000),
  ('Mojolangu', 5000),
  ('Tlogomas', 5000),
  ('Lowokwaru', 5000),
  ('Oro-Oro Dowo', 5000),
  ('Klojen', 5000)
ON CONFLICT (nama_wilayah) DO UPDATE
SET ongkir = EXCLUDED.ongkir, aktif = TRUE;

INSERT INTO produk (kode_produk, nama_produk, deskripsi, harga, id_kategori, gambar) VALUES
  ('COO-MAT-001', 'Cookies Varian Matcha Cookies', 'Perpaduan rasa manis dan sedikit hint pahit khas matcha premium, berpadu sempurna dengan topping almond dan white chocolate di setiap gigitannya.', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'matcha.png'),
  ('COO-ORI-001', 'Cookies Varian Original', 'Classic soft-baked cookies dengan taburan choco chips melimpah, menghasilkan tekstur renyah di luar namun lumer dan lembut di dalam.', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'biscoff.png'),
  ('COO-RED-001', 'Cookies Varian Red Velvet', 'Kue bercita rasa khas red velvet yang manis dan gurih, diperkaya dengan potongan white chocolate untuk sensasi rasa yang mewah.', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'redvelvet.png'),
  ('COO-DBC-001', 'Cookies Varian Double Choco', 'Adonan cokelat pekat yang lembut berpadu dengan lelehan choco chips melimpah, menghadirkan sensasi rasa cokelat ganda yang intens di setiap gigitan.', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'pistachio.png'),
  ('COO-MON-001', 'Cookies Varian Cookie Monster', 'Soft-baked cookies dengan perpaduan gurihnya selai kacang dan oat, dilengkapi taburan choco chips serta permen cokelat warna-warni yang renyah dan meriah.', 15000, (SELECT id_kategori FROM kategori WHERE kode_kategori = 'COO'), 'cookie-monster.png')
ON CONFLICT (kode_produk) DO NOTHING;
