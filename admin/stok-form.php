<?php
$aktif = 'stok'; require __DIR__ . '/includes/header.php';
$id = (int)($_GET['id'] ?? 0); $p = $produk[0];
foreach ($produk as $x) if ($x['id'] === $id) $p = $x;
?>
<h4>Edit Stok</h4>
<!-- BACKEND: sambungkan action/method ke proses simpan stok. -->
<form action="stok.php" method="post">
<label class="small mt-2">Kode Produk</label><input class="form-control" value="<?= e($p['kode']) ?>" disabled>
<label class="small mt-2">Nama Produk</label><input class="form-control" value="<?= e($p['nama']) ?>" disabled>
<label class="small mt-2">Stok</label><input name="stok" type="number" min="0" class="form-control" value="<?= (int)$p['stok'] ?>">
<div class="text-end mt-3"><a href="stok.php" class="btn btn-outline-secondary">Batal</a> <button class="btn btn-maroon">Simpan</button></div></form>
<?php require __DIR__ . '/includes/footer.php';