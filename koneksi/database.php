<?php
// Koneksi ke PostgreSQL memakai PDO.
// Cara pakai di halaman lain: $pdo = db();
// Data login diambil dari koneksi/kredensial.php (salinan dari kredensial.example.php).

final class BackendConfigurationException extends RuntimeException
{
}

final class DatabaseConnectionException extends RuntimeException
{
}

if (!file_exists(__DIR__ . '/kredensial.php')) {
    throw new BackendConfigurationException(
        'File koneksi/kredensial.php belum dibuat. Salin koneksi/kredensial.example.php dan isi kredensial PostgreSQL.'
    );
}
require_once __DIR__ . '/kredensial.php';

function db(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', DB_HOST, DB_PORT, DB_NAME);
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            error_log('Koneksi database gagal: ' . $e->getMessage());
            throw new DatabaseConnectionException('Tidak dapat terhubung ke database.', 0, $e);
        }
    }

    return $pdo;
}
