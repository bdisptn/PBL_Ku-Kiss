<?php $aktif = 'laporan'; require __DIR__ . '/includes/header.php'; ?>
<h4>Laporan</h4>
<div class="table-responsive mt-2"><table class="table table-bordered tbl align-middle"><thead><tr><th>No.</th><th>Laporan Bulanan</th><th>Total Uang Keluar</th><th>Total Uang Masuk</th><th>Total Keuntungan</th><th>Aksi</th></tr></thead><tbody>
<?php foreach ($bulan_daftar as $i => $b): $in = $masuk[$b] ?? 0; $out = $keluar[$b] ?? 0; ?><tr><td><?= $i + 1 ?></td><td><?= e(bulan_label($b)) ?></td><td><?= rp($out) ?></td><td><?= rp($in) ?></td><td><?= rp($in - $out) ?></td><td><a class="btn btn-sm btn-success" href="laporan-detail.php?bulan=<?= e($b) ?>" title="Lihat dan cetak"><i class="bi bi-printer-fill"></i></a></td></tr><?php endforeach ?>
</tbody></table></div>
<div class="d-flex justify-content-between mt-4"><h5>Inputan Total Uang Keluar Bulan Ini</h5><a class="btn btn-info btn-sm text-white" href="pengeluaran-form.php"><i class="bi bi-plus-lg"></i> Tambah</a></div>
<div class="table-responsive mt-2"><table class="table table-bordered tbl align-middle"><thead><tr><th>No.</th><th>Tanggal</th><th>Keterangan</th><th>Harga</th><th>Aksi</th></tr></thead><tbody>
<?php foreach ($pengeluaran as $i => $x): ?><tr><td><?= $i + 1 ?></td><td><?= e($x['tanggal']) ?></td><td><?= e($x['keterangan']) ?></td><td><?= rp($x['nominal']) ?></td><td><?= aksi('pengeluaran-form.php?id=' . $x['id']) ?></td></tr><?php endforeach ?>
</tbody></table></div>
<?php require __DIR__ . '/includes/footer.php';