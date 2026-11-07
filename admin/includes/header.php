<?php
// Layout atas: sidebar + topbar. Variabel halaman: $aktif (menu aktif).
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/data_dummy.php';
$menu = ['index' => ['house-door', 'Dashboard'], 'produk' => ['tag', 'Produk'], 'kategori' => ['archive', 'Kategori'], 'stok' => ['box', 'Stok'], 'penjualan' => ['cash-stack', 'Penjualan'], 'laporan' => ['envelope', 'Laporan']];
?><!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin KU-KISS</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
<link href="../css/style.css" rel="stylesheet">
<style>@media print{.side,.topbar,.no-print{display:none!important}}</style></head><body>
<div class="d-flex"><aside class="side d-flex flex-column"><div class="side-brand">Admin KU-KISS</div>
<?php foreach ($menu as $file => [$ikon, $teks]): ?><a class="<?= ($aktif ?? '') === $file ? 'on' : '' ?>" href="<?= $file ?>.php"><i class="bi bi-<?= $ikon ?> me-2"></i><?= $teks ?></a><?php endforeach ?>
<a class="out mt-auto py-3" href="login.php">Logout</a></aside>
<div class="flex-grow-1"><div class="topbar d-flex justify-content-between align-items-center no-print">
<div class="search m-0 w-50"><i class="bi bi-search"></i><input id="cariGlobal" placeholder="Cari Disini"></div>
<span class="small">Hi, Selamat Datang Admin <i class="bi bi-person-circle avatar ms-2"></i></span></div>
<div class="p-4"><div class="box3d p-4">