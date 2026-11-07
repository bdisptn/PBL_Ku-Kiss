<?php $aktif = 'penjualan'; require __DIR__ . '/includes/header.php';
$opsi = fn($nama, $daftar, $cur) => '<select name="' . $nama . '" class="form-select form-select-sm">' . implode('', array_map(fn($o) => '<option ' . ($o === $cur ? 'selected' : '') . '>' . e($o) . '</option>', $daftar)) . '</select>'; ?>
<div class="d-flex justify-content-between align-items-center flex-wrap gap-2"><h4>Penjualan</h4>
<select id="filterBulan" class="form-select form-select-sm w-auto"><option value="">Semua bulan</option><?php foreach ($bulan_daftar as $b): ?><option value="<?= e($b) ?>"><?= e(bulan_label($b)) ?></option><?php endforeach ?></select></div>
<div class="table-responsive mt-2"><table class="table table-bordered tbl align-middle"><thead><tr><th>No.</th><th>Pelanggan</th><th>Nomor Handphone</th><th>Item Dibeli</th><th>Total Belanja</th><th>Pengambilan</th><th>Tanggal Pemesanan</th><th>Bukti</th><th>Pembayaran</th><th>Status Pesanan</th></tr></thead><tbody>
<?php foreach ($pesanan as $i => $p): ?><tr data-bulan="<?= e(substr($p['tanggal'], 0, 7)) ?>"><td><?= $i + 1 ?></td><td><?= e($p['pelanggan']) ?></td><td><?= e($p['telp']) ?></td><td><?= implode('<br>', array_map('e', $p['item'])) ?></td><td><?= rp($p['total']) ?></td>
<td><?= e($p['pengambilan']) ?><?= $p['alamat'] ? '<br><small class="text-muted">' . e($p['alamat']) . '</small>' : '' ?></td><td><?= e($p['tanggal']) ?></td>
<td><?= $p['bukti'] ? '<button type="button" class="btn btn-sm btn-light border bukti" data-src="../img/' . e($p['bukti']) . '"><i class="bi bi-eye"></i> Lihat</button>' : '-' ?></td>
<!-- BACKEND: dua pilihan status ini nanti dikirim ke server saat berubah. -->
<td><?= $opsi('status_pembayaran', ['Belum Dibayar', 'Lunas'], $p['bayar']) ?></td><td><?= $opsi('status_pesanan', ['Diproses', 'Siap Diambil', 'Selesai'], $p['status']) ?></td></tr><?php endforeach ?>
</tbody></table></div>
<div class="modal fade" id="mb" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Bukti Pembayaran</h5><button class="btn-close" data-bs-dismiss="modal" aria-label="Tutup"></button></div><div class="modal-body text-center"><img id="mi" class="img-fluid" alt="Bukti pembayaran"></div></div></div></div>
<?php require __DIR__ . '/includes/footer.php';