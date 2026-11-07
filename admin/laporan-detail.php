<?php
$aktif = 'laporan'; require __DIR__ . '/includes/header.php';
$bulan = preg_match('/^\d{4}-\d{2}$/', $_GET['bulan'] ?? '') ? $_GET['bulan'] : $bulan_ini;
$daftar = array_filter($pesanan, fn($p) => $p['bayar'] === 'Lunas' && substr($p['tanggal'], 0, 7) === $bulan);
$in = $masuk[$bulan] ?? 0; $out = $keluar[$bulan] ?? 0;
?>
<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h4>Laporan Bulan <?= e(bulan_label($bulan)) ?></h4><button class="btn btn-maroon btn-sm no-print" onclick="window.print()"><i class="bi bi-download me-1"></i>Download / Cetak</button></div>
<div class="table-responsive"><table class="table table-bordered tbl align-middle"><thead><tr><th>No.</th><th>Pelanggan</th><th>Item Dibeli</th><th>Total Belanja</th></tr></thead><tbody>
<?php $n = 0; foreach ($daftar as $p): ?><tr><td><?= ++$n ?></td><td><?= e($p['pelanggan']) ?></td><td><?= implode('<br>', array_map('e', $p['item'])) ?></td><td><?= rp($p['total']) ?></td></tr><?php endforeach ?>
<?php if (!$n): ?><tr><td colspan="4" class="text-center text-muted">Belum ada transaksi lunas.</td></tr><?php endif ?></tbody>
<tfoot><tr><th colspan="3">Total Uang Masuk Bulan Ini</th><td><?= rp($in) ?></td></tr><tr><th colspan="3">Total Uang Keluar Bulan Ini</th><td><?= rp($out) ?></td></tr><tr><th colspan="3">Total Uang Keuntungan Bulan Ini</th><td><?= rp($in - $out) ?></td></tr></tfoot></table></div>
<a href="laporan.php" class="btn btn-outline-secondary btn-sm no-print"><i class="bi bi-arrow-left me-1"></i>Kembali ke Laporan</a>
<?php require __DIR__ . '/includes/footer.php';