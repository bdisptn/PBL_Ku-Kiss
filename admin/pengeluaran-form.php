<?php
$aktif = 'laporan'; require __DIR__ . '/includes/header.php';
$id = (int)($_GET['id'] ?? 0); $o = ['tanggal' => '', 'keterangan' => '', 'nominal' => ''];
foreach ($pengeluaran as $x) if ($x['id'] === $id) $o = $x;
?>
<h4><?= $id ? 'Edit' : 'Tambah' ?> Total Uang Keluar</h4>
<!-- BACKEND: sambungkan action/method ke proses simpan pengeluaran. -->
<form action="laporan.php" method="post">
<label class="small mt-2">Tanggal</label><input name="tanggal" type="date" class="form-control" value="<?= e($o['tanggal']) ?>">
<label class="small mt-2">Keterangan</label><input name="keterangan" class="form-control" value="<?= e($o['keterangan']) ?>" placeholder="Bahan baku, kemasan, ...">
<label class="small mt-2">Harga</label><input name="nominal" type="number" min="0" class="form-control" value="<?= e($o['nominal']) ?>" placeholder="Masukkan Harga">
<div class="text-end mt-3"><a href="laporan.php" class="btn btn-outline-secondary">Batal</a> <button class="btn btn-maroon">Simpan</button></div></form>
<?php require __DIR__ . '/includes/footer.php';