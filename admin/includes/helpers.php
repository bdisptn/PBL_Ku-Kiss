<?php
// Fungsi tampilan saja (format teks). Tidak ada akses database/session.
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function rp($n) { return 'Rp ' . number_format((float)$n, 0, ',', '.') . ',00'; }
function bulan_label($ym) {
  $b = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  [$y, $m] = explode('-', $ym); return $b[(int)$m - 1] . ' ' . $y;
}
// Tombol aksi tabel. BACKEND: hapus nanti diganti form POST ke server.
function aksi($editUrl) {
  return '<a class="btn btn-sm btn-warning text-white" href="' . e($editUrl) . '" title="Edit"><i class="bi bi-pencil-fill"></i></a> '
       . '<button type="button" class="btn btn-sm btn-danger" title="Hapus" onclick="confirm(\'Hapus data ini?\')"><i class="bi bi-trash-fill"></i></button>';
}