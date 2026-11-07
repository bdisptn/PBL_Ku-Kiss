</div></div></div></div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Pencarian di topbar: menyaring baris tabel yang tampil (hanya tampilan).
document.getElementById('cariGlobal').addEventListener('input', function () {
  document.querySelectorAll('tbody tr').forEach(t => t.hidden = !t.textContent.toLowerCase().includes(this.value.toLowerCase()));
});
// Filter bulan (halaman Penjualan).
const fb = document.getElementById('filterBulan');
if (fb) fb.addEventListener('change', () => document.querySelectorAll('tbody tr[data-bulan]').forEach(t => t.hidden = fb.value && t.dataset.bulan !== fb.value));
// Modal bukti pembayaran.
document.querySelectorAll('.bukti').forEach(b => b.onclick = () => { document.getElementById('mi').src = b.dataset.src; new bootstrap.Modal('#mb').show(); });
</script>
<?= $js ?? '' ?>
</body></html>