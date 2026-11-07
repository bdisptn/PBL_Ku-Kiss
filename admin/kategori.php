<?php $aktif = 'kategori'; require __DIR__ . '/includes/header.php'; ?>
<div class="d-flex justify-content-between"><h4>Kategori</h4><a class="btn btn-info btn-sm text-white" href="kategori-form.php"><i class="bi bi-plus-lg"></i> Tambah Kategori</a></div>
<div class="table-responsive mt-2"><table class="table table-bordered tbl align-middle"><thead><tr><th>No.</th><th>ID Kategori</th><th>Nama Kategori</th><th>Aksi</th></tr></thead><tbody>
<?php foreach ($kategori as $i => $k): ?><tr><td><?= $i + 1 ?></td><td><?= e($k['kode']) ?></td><td><?= e($k['nama']) ?></td><td><?= aksi('kategori-form.php?id=' . $k['id']) ?></td></tr><?php endforeach ?>
</tbody></table></div><small class="text-muted">Menampilkan 1 sampai <?= count($kategori) ?> dari <?= count($kategori) ?> Data</small>
<?php require __DIR__ . '/includes/footer.php';