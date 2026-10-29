<?php
session_start();
require_once __DIR__ . '/../koneksi/database.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username !== '' && $password !== '') {
        $pdo  = db();
        $stmt = $pdo->prepare('SELECT * FROM admin WHERE username = ?');
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if ($admin && password_verify($password, $admin['password'])) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_id']        = $admin['id_admin'];
            $_SESSION['admin_nama']      = $admin['nama'];

            header('Location: produk.php');
            exit();
        } else {
            $error = 'Username atau password salah!';
        }
    } else {
        $error = 'Silakan isi semua kolom!';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Admin — Ku-Kiss</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Poppins', sans-serif; background: #fdf9f4; }
    .card-login { max-width: 420px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.12); }
    .btn-maroon { background: #6b2a2c; color: #fff; border: 0; }
    .btn-maroon:hover { background: #561f21; color: #fff; }
  </style>
</head>
<body class="d-flex align-items-center justify-content-center min-vh-100">
  <div class="card card-login p-5 w-100 mx-3">
    <h4 class="text-center fw-semibold mb-1" style="color:#6b2a2c">Ku-Kiss</h4>
    <p class="text-center text-muted small mb-4">Panel Admin</p>

    <?php if ($error): ?>
      <div class="alert alert-danger py-2 small"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>

    <form method="POST">
      <label class="form-label fw-medium">Username</label>
      <input type="text" name="username" class="form-control mb-3" placeholder="Masukkan username" required autofocus>

      <label class="form-label fw-medium">Password</label>
      <input type="password" name="password" class="form-control mb-4" placeholder="Masukkan password" required>

      <button type="submit" class="btn btn-maroon w-100 py-2 fw-medium">Masuk</button>
    </form>
  </div>
</body>
</html>