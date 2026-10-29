<?php
require_once __DIR__ . '/../koneksi/database.php';
require_once __DIR__ . '/../includes/upload.php';
require_once 'auth.php';
check_admin_login();

$pdo   = db();
$pesan = '';

// ── 1. Tambah Produk ────────────────────────────────────────
if (isset($_POST['tambah_produk'])) {
    $nama      = trim($_POST['nama_produk']);
    $deskripsi = trim($_POST['deskripsi']);
    $harga     = (float) $_POST['harga'];
    $stok      = (int)   $_POST['stok'];

    $gambar = 'default.jpg';
    if (!empty($_FILES['gambar']['name'])) {
        $hasil = upload_gambar_produk($_FILES['gambar']);
        if ($hasil['ok']) {
            $gambar = $hasil['nama_file'];
        } else {
            $pesan = $hasil['pesan'];
        }
    }

    if ($pesan === '') {
        $stmt = $pdo->prepare(
            'INSERT INTO produk (nama_produk, deskripsi, harga, stok, gambar) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$nama, $deskripsi, $harga, $stok, $gambar]);
        $pesan = 'sukses:Produk berhasil ditambahkan.';
    }
}

// ── 2. Edit Produk ───────────────────────────────────────────
if (isset($_POST['edit_produk'])) {
    $id        = (int) $_POST['id_produk'];
    $nama      = trim($_POST['nama_produk']);
    $deskripsi = trim($_POST['deskripsi']);
    $harga     = (float) $_POST['harga'];
    $stok      = (int)   $_POST['stok'];

    // Gambar baru opsional
    $stmt_lama = $pdo->prepare('SELECT gambar FROM produk WHERE id_produk = ?');
    $stmt_lama->execute([$id]);
    $gambar = $stmt_lama->fetchColumn() ?: 'default.jpg';

    if (!empty($_FILES['gambar']['name'])) {
        $hasil = upload_gambar_produk($_FILES['gambar']);
        if ($hasil['ok']) {
            $gambar = $hasil['nama_file'];
        } else {
            $pesan = $hasil['pesan'];
        }
    }

    if ($pesan === '') {
        $stmt = $pdo->prepare(
            'UPDATE produk SET nama_produk=?, deskripsi=?, harga=?, stok=?, gambar=? WHERE id_produk=?'
        );
        $stmt->execute([$nama, $deskripsi, $harga, $stok, $gambar, $id]);
        $pesan = 'sukses:Produk berhasil diperbarui.';
    }
}

// ── 3. Hapus Produk ──────────────────────────────────────────
if (isset($_GET['hapus'])) {
    $id   = (int) $_GET['hapus'];
    $stmt = $pdo->prepare('DELETE FROM produk WHERE id_produk = ?');
    $stmt->execute([$id]);
    header('Location: produk.php?msg=hapus');
    exit();
}

// ── 4. Ambil semua produk ────────────────────────────────────
$produk_list = $pdo->query('SELECT * FROM produk ORDER BY id_produk DESC')->fetchAll();

// Pesan dari redirect hapus
if (isset($_GET['msg']) && $_GET['msg'] === 'hapus') {
    $pesan = 'sukses:Produk berhasil dihapus.';
}

// Produk yang sedang diedit (isi form edit)
$edit = null;
if (isset($_GET['edit'])) {
    $stmt = $pdo->prepare('SELECT * FROM produk WHERE id_produk = ?');
    $stmt->execute([(int) $_GET['edit']]);
    $edit = $stmt->fetch();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kelola Produk — Ku-Kiss Admin</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <link href="../assets/css/style.css" rel="stylesheet">
</head>
<body>
<div class="d-flex">

  <!-- Sidebar -->
  <aside class="side d-flex flex-column">
    <div class="side-brand"><i class="bi bi-cookie me-2"></i>Ku-Kiss Admin</div>
    <a href="produk.php" class="on"><i class="bi bi-tag me-2"></i>Produk</a>
    <a href="#" class="out mt-auto py-3" onclick="if(confirm('Yakin logout?'))location.href='logout.php'">Logout</a>
  </aside>

  <!-- Konten utama -->
  <div class="flex-grow-1">
    <div class="topbar">
      <span class="fw-medium">Manajemen Produk</span>
      <span class="small text-muted">Hi, <?= htmlspecialchars($_SESSION['admin_nama']) ?> <i class="bi bi-person-circle ms-1"></i></span>
    </div>

    <div class="p-4">
      <?php if ($pesan): ?>
        <?php [$tipe, $isi] = explode(':', $pesan, 2); ?>
        <div class="alert alert-<?= $tipe === 'sukses' ? 'success' : 'danger' ?> alert-dismissible fade show" role="alert">
          <?= htmlspecialchars($isi) ?>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      <?php endif; ?>

      <!-- Form Tambah / Edit Produk -->
      <div class="box3d p-4 mb-4">
        <h5 class="mb-4"><?= $edit ? 'Edit Produk' : 'Tambah Produk Baru' ?></h5>
        <form method="POST" enctype="multipart/form-data" class="row g-3">
          <?php if ($edit): ?>
            <input type="hidden" name="id_produk" value="<?= $edit['id_produk'] ?>">
          <?php endif; ?>

          <div class="col-md-6">
            <label class="form-label fw-medium">Nama Produk</label>
            <input type="text" name="nama_produk" class="form-control" value="<?= htmlspecialchars($edit['nama_produk'] ?? '') ?>" required>
          </div>
          <div class="col-md-3">
            <label class="form-label fw-medium">Harga (Rp)</label>
            <input type="number" step="0.01" min="0" name="harga" class="form-control" value="<?= $edit['harga'] ?? '' ?>" required>
          </div>
          <div class="col-md-3">
            <label class="form-label fw-medium">Stok</label>
            <input type="number" min="0" name="stok" class="form-control" value="<?= $edit['stok'] ?? 0 ?>" required>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-medium">Foto Produk <?= $edit ? '(kosongkan jika tidak diubah)' : '' ?></label>
            <input type="file" name="gambar" accept="image/*" class="form-control">
          </div>
          <div class="col-md-6">
            <label class="form-label fw-medium">Deskripsi</label>
            <textarea name="deskripsi" rows="2" class="form-control"><?= htmlspecialchars($edit['deskripsi'] ?? '') ?></textarea>
          </div>
          <div class="col-12 d-flex gap-2">
            <button type="submit" name="<?= $edit ? 'edit_produk' : 'tambah_produk' ?>" class="btn btn-maroon px-4">
              <i class="bi bi-check-lg me-1"></i><?= $edit ? 'Simpan Perubahan' : 'Tambah Produk' ?>
            </button>
            <?php if ($edit): ?>
              <a href="produk.php" class="btn btn-outline-secondary">Batal</a>
            <?php endif; ?>
          </div>
        </form>
      </div>

      <!-- Tabel Produk -->
      <div class="box3d overflow-hidden">
        <table class="table table-bordered tbl align-middle mb-0">
          <thead>
            <tr>
              <th>No</th><th>Gambar</th><th>Nama Produk</th><th>Harga</th><th>Stok</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <?php if ($produk_list): ?>
              <?php foreach ($produk_list as $i => $p): ?>
              <tr>
                <td><?= $i + 1 ?></td>
                <td>
                  <img src="../public/uploads/products/<?= htmlspecialchars($p['gambar']) ?>"
                       class="rounded" style="width:56px;height:56px;object-fit:cover"
                       onerror="this.src='https://placehold.co/56x56/fdf9f4/6b2a2c?text=No+img'" alt="">
                </td>
                <td class="fw-medium"><?= htmlspecialchars($p['nama_produk']) ?></td>
                <td>Rp <?= number_format($p['harga'], 0, ',', '.') ?></td>
                <td><?= $p['stok'] ?></td>
                <td>
                  <a href="?edit=<?= $p['id_produk'] ?>" class="btn btn-sm btn-warning text-white"><i class="bi bi-pencil-fill"></i></a>
                  <a href="?hapus=<?= $p['id_produk'] ?>" class="btn btn-sm btn-danger"
                     onclick="return confirm('Hapus produk ini?')"><i class="bi bi-trash-fill"></i></a>
                </td>
              </tr>
              <?php endforeach; ?>
            <?php else: ?>
              <tr><td colspan="6" class="text-center text-muted py-4">Belum ada produk.</td></tr>
            <?php endif; ?>
          </tbody>
        </table>
      </div>

    </div><!-- /p-4 -->
  </div><!-- /flex-grow-1 -->
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>