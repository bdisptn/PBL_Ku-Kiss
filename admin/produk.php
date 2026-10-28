<?php
require_once '../db.php';
require_once 'auth.php';
check_admin_login();

// 1. Tambah Produk Baru
if (isset($_POST['tambah_produk'])) {
    $nama = trim($_POST['nama_produk']);
    $deskripsi = trim($_POST['deskripsi']);
    $harga = $_POST['harga'];
    $stok = $_POST['stok'];
    $id_admin = $_SESSION['admin_id'];

    // Handle Upload Gambar
    $gambar = 'default.jpg';
    if (!empty($_FILES['gambar']['name'])) {
        $ext = pathinfo($_FILES['gambar']['name'], PATHINFO_EXTENSION);
        $gambar = time() . '_' . uniqid() . '.' . $ext;
        move_uploaded_file($_FILES['gambar']['tmp_name'], '../uploads/' . $gambar);
    }

    $stmt = $pdo->prepare("INSERT INTO produk (nama_produk, deskripsi, harga, stok, gambar, id_admin) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nama, $deskripsi, $harga, $stok, $gambar, $id_admin]);
    header("Location: produk.php");
    exit();
}

// 2. Hapus Produk
if (isset($_GET['hapus'])) {
    $id = $_GET['hapus'];
    $stmt = $pdo->prepare("DELETE FROM produk WHERE id_produk = ?");
    $stmt->execute([$id]);
    header("Location: produk.php");
    exit();
}

// 3. Ambil Semua Data Produk (Read)
$stmt = $pdo->query("SELECT * FROM produk ORDER BY id_produk DESC");
$produk_list = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kelola Produk - MANIS Ku-Kiss</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="flex min-h-screen">
        <!-- Sidebar Navigation -->
        <div class="w-64 bg-amber-900 text-white p-6">
            <h1 class="text-xl font-bold mb-8">Ku-Kiss Admin</h1>
            <nav class="space-y-4">
                <a href="produk.php" class="block py-2 px-4 bg-amber-800 rounded font-semibold">Kelola Produk</a>
                <a href="logout.php" class="block py-2 px-4 text-red-300 hover:bg-amber-800 rounded">Logout</a>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-8">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Manajemen Katalog Produk</h2>

            <!-- Form Tambah Produk -->
            <div class="bg-white p-6 rounded-lg shadow-sm border mb-8">
                <h3 class="text-lg font-bold mb-4 text-gray-700">Tambah Produk Baru</h3>
                <form action="" method="POST" enctype="multipart/form-data" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold mb-1">Nama Produk</label>
                        <input type="text" name="nama_produk" required class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Harga (Rp)</label>
                        <input type="number" step="0.01" name="harga" required class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Stok</label>
                        <input type="number" name="stok" required class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Foto Produk</label>
                        <input type="file" name="gambar" accept="image/*" class="w-full p-1 border rounded">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-semibold mb-1">Deskripsi Produk</label>
                        <textarea name="deskripsi" rows="3" class="w-full p-2 border rounded"></textarea>
                    </div>
                    <div class="md:col-span-2">
                        <button type="submit" name="tambah_produk" class="bg-amber-600 text-white px-6 py-2 rounded font-bold hover:bg-amber-700">Simpan Produk</button>
                    </div>
                </form>
            </div>

            <!-- Tabel Daftar Produk -->
            <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-amber-100 text-amber-900">
                        <tr>
                            <th class="p-4 border-b">Gambar</th>
                            <th class="p-4 border-b">Nama Produk</th>
                            <th class="p-4 border-b">Harga</th>
                            <th class="p-4 border-b">Stok</th>
                            <th class="p-4 border-b">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (count($produk_list) > 0): ?>
                            <?php foreach ($produk_list as $item): ?>
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-4">
                                    <img src="../uploads/<?= htmlspecialchars($item['gambar']) ?>" class="w-16 h-16 object-cover rounded" alt="Produk" onerror="this.src='https://via.placeholder.com/64'">
                                </td>
                                <td class="p-4 font-semibold"><?= htmlspecialchars($item['nama_produk']) ?></td>
                                <td class="p-4">Rp <?= number_format($item['harga'], 0, ',', '.') ?></td>
                                <td class="p-4"><?= $item['stok'] ?></td>
                                <td class="p-4 space-x-2">
                                    <a href="?hapus=<?= $item['id_produk'] ?>" onclick="return confirm('Yakin ingin menghapus produk ini?')" class="text-red-600 hover:underline">Hapus</a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="5" class="p-4 text-center text-gray-500">Belum ada produk yang ditambahkan.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>