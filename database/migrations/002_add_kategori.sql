-- ============================================================
-- Migration 002: Tambah tabel kategori + update tabel produk
-- Jalankan SETELAH 001_create_tables.sql
-- ============================================================

-- 1. Tabel KATEGORI
CREATE TABLE IF NOT EXISTS kategori (
    id_kategori   SERIAL       PRIMARY KEY,
    kode_kategori VARCHAR(20)  NOT NULL UNIQUE,   -- contoh: COO:MAT-001
    nama_kategori VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Tambah kolom ke tabel PRODUK (jika belum ada)
ALTER TABLE produk
    ADD COLUMN IF NOT EXISTS kode_produk VARCHAR(30) UNIQUE,
    ADD COLUMN IF NOT EXISTS id_kategori INTEGER
        REFERENCES kategori (id_kategori)
        ON UPDATE CASCADE ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_produk_kategori ON produk (id_kategori);
