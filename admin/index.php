<?php
$aktif = 'index';
require __DIR__ . '/includes/header.php';
$kartu = [['Keluar', $k, '#ff3b3b'], ['Masuk', $m, '#00c9a7'], ['Keuntungan', $m - $k, '#17b8d6']];
$restock = array_filter($produk, fn($p) => $p['stok'] <= $batas_stok);
$untung = []; for ($i = 1; $i <= 12; $i++) { $b = sprintf('2026-%02d', $i); $untung[] = ($masuk[$b] ?? 0) - ($keluar[$b] ?? 0); }
$labels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
$js = '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script><script>new Chart(document.getElementById("ch"),{type:"line",data:{labels:' . json_encode($labels) . ',datasets:[{data:' . json_encode($untung) . ',borderColor:"#0a8f4e",backgroundColor:"rgba(10,143,78,.15)",fill:true,tension:.4}]},options:{plugins:{legend:{display:false}}}})</script>';
?>
<h4>Dashboard</h4>
<div class="row g-3 my-1"><?php foreach ($kartu as [$t, $v, $c]): ?>
<div class="col-md-4"><div class="box3d stat" style="border-color:<?= $c ?>"><span class="text-muted small">Total Uang <?= $t ?> Bulan Ini</span><b><?= e(str_replace(',00', '', rp($v))) ?></b></div></div><?php endforeach ?></div>
<div class="row g-3 my-1"><div class="col-lg-8"><div class="box3d p-3"><div class="text-center small fw-medium mb-2">Diagram Uang Keuntungan Per Bulan</div><canvas id="ch" height="150"></canvas></div></div>
<div class="col-lg-4"><div class="box3d p-3 h-100"><div class="small text-danger mb-2"><i class="bi bi-exclamation-triangle"></i> Produk Yang Perlu Di Restock</div>
<?php foreach ($restock as $p): ?><div class="restock"><div><?= e($p['nama']) ?><br><?= e($p['kode']) ?></div><span>Sisa <?= (int)$p['stok'] ?> pcs</span></div><?php endforeach ?>
<?php if (!$restock): ?><small class="text-muted">Semua stok aman.</small><?php endif ?></div></div></div>
<h5 class="mt-4">Pencatatan Transaksi</h5>
<div class="table-responsive mt-2"><table class="table table-bordered tbl align-middle"><thead><tr><th>No.</th><th>Pelanggan</th><th>Item Dibeli</th><th>Total Belanja</th><th>Tanggal Pesanan</th><th>Pembayaran</th><th>Status</th></tr></thead><tbody>
<?php foreach ($pesanan as $i => $p): ?><tr><td><?= $i + 1 ?></td><td><?= e($p['pelanggan']) ?></td><td><?= implode('<br>', array_map('e', $p['item'])) ?></td><td><?= rp($p['total']) ?></td><td><?= e($p['tanggal']) ?></td><td><?= e($p['bayar']) ?></td><td><?= e($p['status']) ?></td></tr><?php endforeach ?>
</tbody></table></div>
<?php require __DIR__ . '/includes/footer.php';