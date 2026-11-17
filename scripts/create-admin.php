<?php
declare(strict_types=1);

$configPath = dirname(__DIR__) . '/config/config.php';
if (!is_file($configPath)) {
  fwrite(STDERR, "Konfigurasi tidak ditemukan. Buat config/config.php dengan pengaturan koneksi PostgreSQL.\n");
  exit(1);
}
$config = require $configPath;
$db = $config['database'];
if (($db['driver'] ?? null) !== 'pgsql') {
  fwrite(STDERR, "Database harus dikonfigurasi menggunakan PostgreSQL di config/config.php.\n");
  exit(1);
}
$dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $db['host'], $db['port'] ?? 5432, $db['name']);
$pdo = new PDO($dsn, $db['user'], $db['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$username = trim(readline('Username admin: '));
if ($username === '' || mb_strlen($username) > 50) {
  fwrite(STDERR, "Username wajib diisi (maksimal 50 karakter).\n");
  exit(1);
}
$name = trim(readline('Nama admin: '));
if ($name === '' || mb_strlen($name) > 100) {
  fwrite(STDERR, "Nama wajib diisi (maksimal 100 karakter).\n");
  exit(1);
}
$password = readline('Password admin (minimal 12 karakter): ');
if (strlen($password) < 12 || strlen($password) > 200) {
  fwrite(STDERR, "Password harus terdiri dari 12 sampai 200 karakter.\n");
  exit(1);
}
$stmt = $pdo->prepare('INSERT INTO admin (username, password, nama) VALUES (?, ?, ?)');
$stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $name]);
fwrite(STDOUT, "Akun admin berhasil dibuat.\n");
