-- ============================================================
-- DDL Database MANIS (Ku-Kiss) - PostgreSQL
-- Management & Automasi Notifikasi Informasi Pemesanan
-- ============================================================

-- Hapus tabel lama jika ingin membuat ulang (hilangkan komentar bila perlu)
-- DROP TABLE IF EXISTS pengeluaran, notifikasi, detail_pesanan, pesanan,
--                      batch_po, produk, pelanggan, admin CASCADE;

-- ------------------------------------------------------------
-- 1. ADMIN
-- ------------------------------------------------------------
CREATE TABLE admin (
    id_admin    SERIAL       PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,          -- simpan dalam bentuk hash
    nama        VARCHAR(100) NOT NULL
);

-- ------------------------------------------------------------
-- 2. PELANGGAN
-- ------------------------------------------------------------
-- Pelanggan wajib membuat akun (username, email, password) sebelum memesan.
-- Kolom nama, no_telp, dan alamat dilengkapi saat checkout pertama.
CREATE TABLE pelanggan (
    id_pelanggan SERIAL       PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(100) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,          -- simpan dalam bentuk hash
    nama         VARCHAR(100),
    no_telp      VARCHAR(20),
    alamat       TEXT
);

-- ------------------------------------------------------------
-- 3. PRODUK
-- ------------------------------------------------------------
CREATE TABLE produk (
    id_produk    SERIAL         PRIMARY KEY,
    nama_produk  VARCHAR(100)   NOT NULL,
    deskripsi    TEXT,
    harga        NUMERIC(10,2)  NOT NULL CHECK (harga >= 0),
    gambar       VARCHAR(255),
    stok         INTEGER        NOT NULL DEFAULT 0 CHECK (stok >= 0)
);

-- ------------------------------------------------------------
-- 4. BATCH_PO (periode Pre-Order)
-- ------------------------------------------------------------
CREATE TABLE batch_po (
    id_batch       SERIAL       PRIMARY KEY,
    id_admin       INTEGER      NOT NULL
                   REFERENCES admin (id_admin)
                   ON UPDATE CASCADE ON DELETE RESTRICT,
    nama_batch     VARCHAR(100) NOT NULL,
    tanggal_buka   DATE         NOT NULL,
    tanggal_tutup  DATE         NOT NULL,
    status_batch   VARCHAR(20)  NOT NULL DEFAULT 'dibuka'
                   CHECK (status_batch IN ('dibuka', 'ditutup', 'diproduksi', 'selesai')),
    CHECK (tanggal_tutup >= tanggal_buka)
);

-- ------------------------------------------------------------
-- 5. PESANAN
-- ------------------------------------------------------------
CREATE TABLE pesanan (
    id_pesanan         SERIAL        PRIMARY KEY,
    kode_pesanan       VARCHAR(20)   NOT NULL UNIQUE,
    id_pelanggan       INTEGER       NOT NULL
                       REFERENCES pelanggan (id_pelanggan)
                       ON UPDATE CASCADE ON DELETE RESTRICT,
    id_admin           INTEGER                       -- admin yang memproses (boleh kosong saat pesanan baru masuk)
                       REFERENCES admin (id_admin)
                       ON UPDATE CASCADE ON DELETE SET NULL,
    id_batch           INTEGER       NOT NULL
                       REFERENCES batch_po (id_batch)
                       ON UPDATE CASCADE ON DELETE RESTRICT,
    tanggal_pesan      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metode_pengambilan VARCHAR(20)   NOT NULL DEFAULT 'pickup'
                       CHECK (metode_pengambilan IN ('pickup', 'delivery')),
    tanggal_ambil      DATE,
    status_pesanan     VARCHAR(20)   NOT NULL DEFAULT 'Sedang Dikerjakan'
                       CHECK (status_pesanan IN ('Sedang Dikerjakan', 'Siap Diambil', 'Selesai')),
    status_pembayaran  VARCHAR(20)   NOT NULL DEFAULT 'Belum Lunas'
                       CHECK (status_pembayaran IN ('Belum Lunas', 'Lunas')),
    metode_pembayaran  VARCHAR(20)
                       CHECK (metode_pembayaran IN ('Tunai', 'QRIS', 'Transfer')),
    total_harga        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_harga >= 0)
);

-- ------------------------------------------------------------
-- 6. DETAIL_PESANAN
-- ------------------------------------------------------------
CREATE TABLE detail_pesanan (
    id_detail   SERIAL        PRIMARY KEY,
    id_pesanan  INTEGER       NOT NULL
                REFERENCES pesanan (id_pesanan)
                ON UPDATE CASCADE ON DELETE CASCADE,
    id_produk   INTEGER       NOT NULL
                REFERENCES produk (id_produk)
                ON UPDATE CASCADE ON DELETE RESTRICT,
    jumlah      INTEGER       NOT NULL CHECK (jumlah > 0),
    subtotal    NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

-- ------------------------------------------------------------
-- 7. NOTIFIKASI
-- ------------------------------------------------------------
CREATE TABLE notifikasi (
    id_notifikasi    SERIAL       PRIMARY KEY,
    id_pesanan       INTEGER      NOT NULL
                     REFERENCES pesanan (id_pesanan)
                     ON UPDATE CASCADE ON DELETE CASCADE,
    jenis_notifikasi VARCHAR(30)  NOT NULL,        -- contoh: pesanan_dikonfirmasi, pesanan_siap_diambil
    isi_pesan        TEXT         NOT NULL,
    status_kirim     VARCHAR(20)  NOT NULL DEFAULT 'menunggu'
                     CHECK (status_kirim IN ('menunggu', 'terkirim', 'gagal')),
    waktu_kirim      TIMESTAMP
);

-- ------------------------------------------------------------
-- 8. PENGELUARAN (total biaya bahan baku per batch PO)
--    Relasi dibuat 1:N agar satu batch bisa punya beberapa catatan
--    pengeluaran. Jika ingin 1:1, aktifkan constraint UNIQUE di bawah.
-- ------------------------------------------------------------
CREATE TABLE pengeluaran (
    id_pengeluaran      SERIAL        PRIMARY KEY,
    id_batch            INTEGER       NOT NULL
                        REFERENCES batch_po (id_batch)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    keterangan          VARCHAR(150),
    total_pengeluaran   NUMERIC(12,2) NOT NULL CHECK (total_pengeluaran >= 0),
    tanggal_pengeluaran DATE          NOT NULL DEFAULT CURRENT_DATE
    -- , UNIQUE (id_batch)   -- aktifkan untuk relasi 1:1
);

-- ------------------------------------------------------------
-- INDEKS untuk mempercepat pencarian
-- ------------------------------------------------------------
CREATE INDEX idx_pesanan_pelanggan        ON pesanan (id_pelanggan);
CREATE INDEX idx_pesanan_batch            ON pesanan (id_batch);
CREATE INDEX idx_pesanan_status_pembayaran ON pesanan (status_pembayaran);
CREATE INDEX idx_detail_pesanan_pesanan   ON detail_pesanan (id_pesanan);
CREATE INDEX idx_detail_pesanan_produk    ON detail_pesanan (id_produk);
CREATE INDEX idx_notifikasi_pesanan       ON notifikasi (id_pesanan);
CREATE INDEX idx_pengeluaran_batch        ON pengeluaran (id_batch);

-- ------------------------------------------------------------
-- CONTOH QUERY: laba kasar per batch PO
-- ------------------------------------------------------------
-- Pemasukan dan pengeluaran dihitung di subquery terpisah agar tidak
-- terjadi penggandaan angka saat di-JOIN.
--
-- SELECT b.id_batch, b.nama_batch,
--        COALESCE(m.pemasukan, 0)   AS total_pemasukan,
--        COALESCE(k.pengeluaran, 0) AS total_pengeluaran,
--        COALESCE(m.pemasukan, 0) - COALESCE(k.pengeluaran, 0) AS laba_kasar
-- FROM batch_po b
-- LEFT JOIN (SELECT id_batch, SUM(total_harga) AS pemasukan
--            FROM pesanan GROUP BY id_batch) m ON m.id_batch = b.id_batch
-- LEFT JOIN (SELECT id_batch, SUM(total_pengeluaran) AS pengeluaran
--            FROM pengeluaran GROUP BY id_batch) k ON k.id_batch = b.id_batch;
