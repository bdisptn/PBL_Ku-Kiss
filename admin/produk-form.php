<?php
$aktif = 'produk'; require __DIR__ . '/includes/header.php';
$id = (int)($_GET['id'] ?? 0); $p = ['kode' => '', 'nama' => '', 'kategori' => '', 'deskripsi' => '', 'harga' => '', 'gambar' => ''];
foreach ($produk as $x) if ($x['id'] === $id) $p = $x;
?>
<h4><?= $id ? 'Edit' : 'Tambah' ?> Produk</h4>
<!-- BACKEND: action dan method diarahkan ke proses simpan; field name sudah disiapkan. -->
<form action="produk.php" method="post" enctype="multipart/form-data">
<label class="small mt-2">Kode Produk</label><input name="kode" class="form-control" value="<?= e($p['kode']) ?>" placeholder="Masukkan Kode Produk">
<label class="small mt-2">Nama Produk</label><input name="nama" class="form-control" value="<?= e($p['nama']) ?>" placeholder="Masukkan Nama Produk">
<label class="small mt-2">Kategori</label><select name="kategori" class="form-select"><option value="">Pilih kategori</option><?php foreach ($kategori as $k): ?><option <?= $k['nama'] === $p['kategori'] ? 'selected' : '' ?>><?= e($k['nama']) ?></option><?php endforeach ?></select>
<label class="small mt-2">Deskripsi</label><textarea name="deskripsi" class="form-control" rows="3" placeholder="Masukkan Deskripsi"><?= e($p['deskripsi']) ?></textarea>
<label class="small mt-2">Harga</label><input name="harga" type="number" min="0" class="form-control" value="<?= e($p['harga']) ?>" placeholder="Masukkan Harga">
<div class="mt-3">
<label for="gambar" class="small">Foto Produk</label>
<input id="gambar" name="gambar" type="file" accept="image/*" class="form-control">
<div class="form-text">Pilih foto produk dari perangkat Anda.</div>
<?php if ($p['gambar']): ?><img src="../img/<?= e($p['gambar']) ?>" alt="Foto <?= e($p['nama']) ?>" style="width:90px" class="mt-2"><?php endif ?>
</div>
<div class="text-end mt-3"><a href="produk.php" class="btn btn-outline-secondary">Batal</a> <button class="btn btn-maroon">Simpan</button></div></form>
<?php require __DIR__ . '/includes/footer.php';