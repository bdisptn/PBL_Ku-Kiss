<?php $aktif = 'stok'; require __DIR__ . '/includes/header.php'; ?>
<h4>Stok</h4>
<div class="table-responsive mt-2"><table class="table table-bordered tbl align-middle"><thead><tr><th>No.</th><th>Kode Produk</th><th>Nama Produk</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>
<?php foreach ($produk as $i => $p): ?><tr><td><?= $i + 1 ?></td><td><?= e($p['kode']) ?></td><td><?= e($p['nama']) ?></td><td><?= (int)$p['stok'] ?><?= $p['stok'] <= $batas_stok ? ' <span class="badge text-bg-danger">Restock</span>' : '' ?></td><td><a class="btn btn-sm btn-warning text-white" href="stok-form.php?id=<?= $p['id'] ?>" title="Edit stok"><i class="bi bi-pencil-fill"></i></a></td></tr><?php endforeach ?>
</tbody></table></div><small class="text-muted">Menampilkan 1 sampai <?= count($produk) ?> dari <?= count($produk) ?> Data</small>
<?php require __DIR__ . '/includes/footer.php';