<?php
$aktif = 'kategori'; require __DIR__ . '/includes/header.php';
$id = (int)($_GET['id'] ?? 0); $k = ['kode' => '', 'nama' => ''];
foreach ($kategori as $x) if ($x['id'] === $id) $k = $x;
?>
<h4><?= $id ? 'Edit' : 'Tambah' ?> Kategori</h4>
<!-- BACKEND: sambungkan action/method ke proses simpan. -->
<form action="kategori.php" method="post">
<label class="small mt-2">ID Kategori</label><input name="kode" class="form-control" value="<?= e($k['kode']) ?>" placeholder="Masukkan ID Kategori">
<label class="small mt-2">Nama Kategori</label><input name="nama" class="form-control" value="<?= e($k['nama']) ?>" placeholder="Masukkan Nama Kategori">
<div class="text-end mt-3"><a href="kategori.php" class="btn btn-outline-secondary">Batal</a> <button class="btn btn-maroon">Simpan</button></div></form>
<?php require __DIR__ . '/includes/footer.php';