<?php
declare(strict_types=1);

$configPath = dirname(__DIR__) . '/config/config.php';
if (!is_file($configPath)) {
  http_response_code(503);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'Konfigurasi database belum dibuat. Buat config/config.php dengan pengaturan koneksi PostgreSQL.']);
  exit;
}

$config = require $configPath;
if (
  !is_array($config)
  || !isset($config['database'])
  || ($config['database']['driver'] ?? null) !== 'pgsql'
) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['error' => 'Konfigurasi database PostgreSQL tidak valid. Periksa config/config.php.']);
  exit;
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');

final class ApiException extends RuntimeException {
  public function __construct(string $message, public readonly int $status) {
    parent::__construct($message);
  }
}

function db(): PDO {
  static $pdo;
  global $config;
  if (!$pdo) {
    $db = $config['database'];
    $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $db['host'], $db['port'] ?? 5432, $db['name']);
    $pdo = new PDO($dsn, $db['user'], $db['password'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  }
  return $pdo;
}

function json_response(array $data, int $status = 200): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function request_data(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') return [];
  $data = json_decode($raw, true);
  if (!is_array($data)) json_response(['error' => 'Format data tidak valid.'], 400);
  return $data;
}

function csrf_check(): void {
  $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  $saved = $_SESSION['csrf'] ?? '';
  if (!is_string($sent) || $saved === '' || !hash_equals($saved, $sent)) {
    json_response(['error' => 'Sesi keamanan tidak berlaku. Muat ulang halaman lalu coba lagi.'], 419);
  }
}

function current_user(): ?array {
  return $_SESSION['user'] ?? null;
}

function require_user(): array {
  $user = current_user();
  if (!$user) json_response(['error' => 'Silakan masuk terlebih dahulu.'], 401);
  return $user;
}

function require_customer(): array {
  $user = require_user();
  if ($user['role'] !== 'customer') json_response(['error' => 'Akun admin tidak dapat membuat pesanan pelanggan.'], 403);
  return $user;
}

function require_admin(): array {
  $user = require_user();
  if ($user['role'] !== 'admin') json_response(['error' => 'Akses hanya untuk admin.'], 403);
  return $user;
}

function valid_text(mixed $value, string $label, int $max, bool $required = true): string {
  if (!is_string($value)) $value = '';
  $value = trim($value);
  if ($required && $value === '') json_response(['error' => "$label wajib diisi."], 422);
  if (mb_strlen($value) > $max) json_response(['error' => "$label maksimal $max karakter."], 422);
  return $value;
}

function positive_int(mixed $value, string $label, int $max = 1000000000): int {
  $validated = filter_var($value, FILTER_VALIDATE_INT);
  if ($validated === false || $validated < 0 || $validated > $max) {
    json_response(['error' => "$label tidak valid."], 422);
  }
  return $validated;
}

function uploaded_image(
  string $field,
  string $folder,
  bool $required = false,
  int $maxBytes = 8 * 1024 * 1024,
  string $requiredMessage = 'Bukti pembayaran wajib diunggah.'
): ?string {
  if (!isset($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
    if ($required) json_response(['error' => $requiredMessage], 422);
    return null;
  }

  $file = $_FILES[$field];
  if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
    json_response(['error' => 'Gambar gagal diunggah. Silakan coba lagi.'], 422);
  }
  if ($file['size'] <= 0 || $file['size'] > $maxBytes) {
    json_response(['error' => 'Ukuran gambar maksimal ' . (int)ceil($maxBytes / 1024 / 1024) . ' MB.'], 422);
  }

  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
  $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
  $image = @getimagesize($file['tmp_name']);
  if (!isset($extensions[$mime]) || !$image || $image['mime'] !== $mime) {
    json_response(['error' => 'Gunakan gambar JPG, PNG, atau WebP yang valid.'], 422);
  }

  $root = dirname(__DIR__);
  $directory = $root . '/' . $folder;
  if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
    error_log("KU-KISS: gagal membuat direktori upload $directory");
    json_response(['error' => 'Penyimpanan gambar tidak tersedia.'], 500);
  }
  $name = bin2hex(random_bytes(20)) . '.' . $extensions[$mime];
  if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $name)) {
    error_log("KU-KISS: gagal menyimpan upload di $directory");
    json_response(['error' => 'Gambar gagal disimpan.'], 500);
  }
  return $folder . '/' . $name;
}

function remove_public_upload(?string $path): void {
  if (!$path || !preg_match('#^public/uploads/(products|profiles|feedback|evidence)/[a-f0-9]{40}\.(jpg|png|webp|mp4|webm|mov)$#', $path)) return;
  $file = dirname(__DIR__) . '/' . $path;
  if (is_file($file) && !unlink($file)) error_log("KU-KISS: gagal menghapus gambar $path");
}

function remove_private_upload(?string $path): void {
  if (!$path || !preg_match('#^storage/(feedback|evidence)/[a-f0-9]{40}\.(jpg|png|webp|mp4|webm|mov)$#', $path)) return;
  $file = dirname(__DIR__) . '/' . $path;
  if (is_file($file) && !unlink($file)) error_log("KU-KISS: gagal menghapus file $path");
}

function user_record(int $id, string $role): ?array {
  if ($role === 'admin') {
    $stmt = db()->prepare(
      'SELECT id_admin AS id, nama AS name, username AS email,
              \'\' AS phone, \'admin\' AS role, NULL AS photo_path
       FROM admin WHERE id_admin = ?'
    );
  } else {
    $stmt = db()->prepare(
      'SELECT id_pelanggan AS id, COALESCE(nama, username) AS name,
              email, COALESCE(no_telp, \'\') AS phone, \'customer\' AS role,
              foto AS photo_path
       FROM pelanggan WHERE id_pelanggan = ?'
    );
  }
  $stmt->execute([$id]);
  return $stmt->fetch() ?: null;
}

$secureCookie = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
ini_set('session.use_strict_mode', '1');
session_set_cookie_params([
  'httponly' => true,
  'secure' => $secureCookie,
  'samesite' => 'Lax',
  'path' => '/',
]);
session_start();
if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
