<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

function record_login_attempt(string $identifier, bool $successful): void {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  if (!filter_var($ip, FILTER_VALIDATE_IP)) $ip = 'unknown';

  $stmt = db()->prepare(
    'INSERT INTO login_percobaan (identifier, ip, berhasil) VALUES (?, ?, ?)'
  );
  $stmt->bindValue(1, $identifier, PDO::PARAM_STR);
  $stmt->bindValue(2, $ip, PDO::PARAM_STR);
  $stmt->bindValue(3, $successful, PDO::PARAM_BOOL);
  $stmt->execute();
}

function product_list(): array {
  return db()->query(
    'SELECT p.id_produk AS id, p.kode_produk AS code, p.nama_produk AS name,
            p.deskripsi AS description, p.harga AS price,
            p.gambar AS image_path, c.id_kategori AS category_id,
            c.nama_kategori AS category_name
     FROM produk p LEFT JOIN kategori c ON c.id_kategori = p.id_kategori
     ORDER BY p.id_produk'
  )->fetchAll();
}

function category_list(): array {
  return db()->query(
    'SELECT id_kategori AS id, kode_kategori AS code, nama_kategori AS name
     FROM kategori ORDER BY nama_kategori'
  )->fetchAll();
}

function ingredient_list(): array {
  $items = db()->query(
    'SELECT id_bahan AS id, nama_bahan AS name, tersedia AS available
     FROM bahan_baku ORDER BY nama_bahan'
  )->fetchAll();
  foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    $item['available'] = filter_var($item['available'], FILTER_VALIDATE_BOOLEAN);
  }
  unset($item);
  return $items;
}

function delivery_area_list(): array {
  return db()->query(
    'SELECT id_wilayah AS id, nama_wilayah AS name, ongkir AS shipping_fee
     FROM wilayah_ongkir WHERE aktif = TRUE ORDER BY nama_wilayah'
  )->fetchAll();
}

function batch_list(): array {
  return db()->query(
    'SELECT id_batch AS id, nama_batch AS name, tanggal_buka AS start_date,
            tanggal_tutup AS end_date, status_batch AS status
     FROM batch_po ORDER BY tanggal_buka DESC, id_batch DESC'
  )->fetchAll();
}

function batch_product_recap(): array {
  return db()->query(
    "SELECT b.id_batch AS batch_id, p.id_produk AS product_id,
            p.nama_produk AS product_name, SUM(d.jumlah) AS quantity
     FROM pesanan o
     JOIN batch_po b ON b.id_batch = o.id_batch
     JOIN detail_pesanan d ON d.id_pesanan = o.id_pesanan
     JOIN produk p ON p.id_produk = d.id_produk
     WHERE o.status_pembayaran = 'Lunas'
     GROUP BY b.id_batch, p.id_produk, p.nama_produk
     ORDER BY b.id_batch DESC, p.nama_produk"
  )->fetchAll();
}

function order_list(?int $customerId): array {
  $sql = "SELECT o.id_pesanan AS id, o.metode_pengambilan AS fulfillment,
                 COALESCE(o.alamat_pengiriman, '') AS address,
                 o.total_harga - o.ongkir AS subtotal, o.ongkir AS shipping_fee,
                 o.total_harga AS total, o.bukti_pembayaran AS proof_path,
                 CASE o.status_pembayaran
                   WHEN 'Belum Dibayar' THEN 'Menunggu Verifikasi'
                   WHEN 'Ditolak' THEN 'Ditolak'
                   ELSE o.status_pembayaran
                 END AS payment_status,
                 o.status_pesanan AS status, o.tanggal_pesan AS created_at,
                 o.id_batch AS batch_id, b.nama_batch AS batch_name,
                 COALESCE(o.tanggal_ambil, b.tanggal_tutup) AS scheduled_date,
                 o.alasan_penolakan AS payment_reason,
                 o.alasan_pembatalan AS cancellation_reason,
                 CASE WHEN o.alasan_pembatalan IS NOT NULL THEN 'customer' ELSE '' END AS cancelled_by,
                 o.bukti_sebelum_path AS evidence_before_path,
                 o.bukti_sesudah_path AS evidence_after_path,
                 p.nama AS customer_name, p.email AS customer_email,
                 COALESCE(p.no_telp, '') AS customer_phone
          FROM pesanan o
          JOIN pelanggan p ON p.id_pelanggan = o.id_pelanggan
          JOIN batch_po b ON b.id_batch = o.id_batch";
  if ($customerId !== null) $sql .= ' WHERE o.id_pelanggan = :user_id';
  $sql .= ' ORDER BY o.tanggal_pesan DESC';
  $stmt = db()->prepare($sql);
  $stmt->execute($customerId === null ? [] : ['user_id' => $customerId]);
  $orders = $stmt->fetchAll();
  $itemsByOrder = [];
  if ($orders) {
    $ids = array_map(static fn($order) => (int)$order['id'], $orders);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $itemStmt = db()->prepare(
      "SELECT d.id_pesanan AS order_id, p.nama_produk AS product_name,
              d.jumlah AS quantity, d.subtotal / d.jumlah AS unit_price
       FROM detail_pesanan d JOIN produk p ON p.id_produk = d.id_produk
       WHERE d.id_pesanan IN ($placeholders) ORDER BY d.id_detail"
    );
    $itemStmt->execute($ids);
    foreach ($itemStmt->fetchAll() as $item) {
      $itemsByOrder[(int)$item['order_id']][] = [
        'name' => $item['product_name'],
        'quantity' => (int)$item['quantity'],
        'unit_price' => (int)$item['unit_price'],
      ];
    }
  }
  foreach ($orders as &$order) {
    $order['items'] = $itemsByOrder[(int)$order['id']] ?? [];
    $order['id'] = (int)$order['id'];
    $order['batch_id'] = (int)$order['batch_id'];
    $order['subtotal'] = (int)$order['subtotal'];
    $order['shipping_fee'] = (int)$order['shipping_fee'];
    $order['total'] = (int)$order['total'];
  }
  unset($order);
  return $orders;
}

function notification_list(array $user): array {
  $recipientColumn = $user['role'] === 'admin' ? 'id_admin' : 'id_pelanggan';
  $stmt = db()->prepare(
    'SELECT id_notifikasi AS id, jenis_notifikasi AS type, judul AS title,
            isi_pesan AS message, id_pesanan AS order_id, id_feedback AS feedback_id,
            dibuat_pada AS created_at, dibaca_pada AS read_at
     FROM notifikasi_aplikasi WHERE ' . $recipientColumn . ' = ?
     ORDER BY dibuat_pada DESC, id_notifikasi DESC LIMIT 100'
  );
  $stmt->execute([$user['id']]);
  $items = $stmt->fetchAll();
  foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    if ($item['order_id'] !== null) $item['order_id'] = (int)$item['order_id'];
    if ($item['feedback_id'] !== null) $item['feedback_id'] = (int)$item['feedback_id'];
  }
  unset($item);
  return $items;
}

function notify_admins(
  PDO $pdo,
  ?int $orderId,
  ?int $feedbackId,
  string $type,
  string $title,
  string $message
): void {
  $stmt = $pdo->prepare(
    'INSERT INTO notifikasi_aplikasi
       (id_admin, id_pesanan, id_feedback, jenis_notifikasi, judul, isi_pesan)
     SELECT id_admin, ?, ?, ?, ?, ? FROM admin'
  );
  $stmt->execute([$orderId, $feedbackId, $type, $title, $message]);
}

function notify_customer(
  PDO $pdo,
  int $customerId,
  ?int $orderId,
  string $type,
  string $title,
  string $message
): void {
  $pdo->prepare(
    'INSERT INTO notifikasi_aplikasi
       (id_pelanggan, id_pesanan, jenis_notifikasi, judul, isi_pesan)
     VALUES (?, ?, ?, ?, ?)'
  )->execute([$customerId, $orderId, $type, $title, $message]);
}

function notify_customers(PDO $pdo, string $type, string $title, string $message): void {
  $pdo->prepare(
    'INSERT INTO notifikasi_aplikasi
       (id_pelanggan, jenis_notifikasi, judul, isi_pesan)
     SELECT id_pelanggan, ?, ?, ? FROM pelanggan'
  )->execute([$type, $title, $message]);
}

function admin_summary(array $admin): array {
  $orders = order_list(null);
  $expenses = db()->query(
    'SELECT id_pengeluaran AS id, id_bahan AS ingredient_id,
            tanggal_pengeluaran AS expense_date,
            COALESCE(keterangan, \'\') AS description, total_pengeluaran AS amount
     FROM pengeluaran ORDER BY tanggal_pengeluaran DESC, id_pengeluaran DESC'
  )->fetchAll();
  $products = product_list();
  $feedback = db()->prepare(
    'SELECT f.id_feedback AS id, COALESCE(p.nama, p.username) AS customer_name,
            f.id_pesanan AS order_id, f.pesan AS message,
            f.lampiran_path AS attachment_path, f.tanggal_feedback AS created_at,
            n.id_notifikasi AS notification_id, n.dibaca_pada AS read_at
     FROM feedback f
     JOIN pelanggan p ON p.id_pelanggan = f.id_pelanggan
     LEFT JOIN notifikasi_aplikasi n
       ON n.id_feedback = f.id_feedback AND n.id_admin = ?
     ORDER BY f.tanggal_feedback DESC, f.id_feedback DESC'
  );
  $feedback->execute([$admin['id']]);
  $feedback = $feedback->fetchAll();
  foreach ($feedback as &$item) {
    $path = $item['attachment_path'];
    $item['has_attachment'] = is_string($path) && $path !== '';
    $extension = $item['has_attachment'] ? strtolower(pathinfo($path, PATHINFO_EXTENSION)) : '';
    $item['attachment_type'] = in_array($extension, ['mp4', 'webm', 'mov'], true) ? 'video' : 'image';
    unset($item['attachment_path']);
    $item['id'] = (int)$item['id'];
    if ($item['order_id'] !== null) $item['order_id'] = (int)$item['order_id'];
    if ($item['notification_id'] !== null) $item['notification_id'] = (int)$item['notification_id'];
  }
  unset($item);
  foreach ($expenses as &$expense) {
    $expense['id'] = (int)$expense['id'];
    $expense['ingredient_id'] = $expense['ingredient_id'] === null ? null : (int)$expense['ingredient_id'];
    $expense['amount'] = (int)$expense['amount'];
  }
  unset($expense);
  return [
    'orders' => $orders,
    'expenses' => $expenses,
    'products' => $products,
    'categories' => category_list(),
    'ingredients' => ingredient_list(),
    'batches' => batch_list(),
    'batch_product_recap' => batch_product_recap(),
    'feedback' => $feedback,
    'notifications' => notification_list($admin),
  ];
}

function feedback_attachment(): ?string {
  if (!isset($_FILES['attachment']) || $_FILES['attachment']['error'] === UPLOAD_ERR_NO_FILE) return null;
  $file = $_FILES['attachment'];
  if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
    json_response(['error' => 'Lampiran gagal diunggah. Silakan coba lagi.'], 422);
  }
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
  $types = [
    'image/jpeg' => ['jpg', 1024 * 1024],
    'image/png' => ['png', 1024 * 1024],
    'image/webp' => ['webp', 1024 * 1024],
    'video/mp4' => ['mp4', 2 * 1024 * 1024],
    'video/webm' => ['webm', 2 * 1024 * 1024],
    'video/quicktime' => ['mov', 2 * 1024 * 1024],
  ];
  if (!isset($types[$mime]) || $file['size'] <= 0 || $file['size'] > $types[$mime][1]) {
    json_response(['error' => 'Pilih foto JPG/PNG/WebP (maks. 1 MB) atau video MP4/WebM/MOV (maks. 2 MB).'], 422);
  }
  if (str_starts_with($mime, 'image/')) {
    $image = @getimagesize($file['tmp_name']);
    if (!$image || $image['mime'] !== $mime) json_response(['error' => 'File foto tidak valid.'], 422);
  }
  $folder = 'storage/feedback';
  $directory = dirname(__DIR__) . '/' . $folder;
  if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
    error_log("KU-KISS: gagal membuat direktori upload $directory");
    json_response(['error' => 'Penyimpanan lampiran tidak tersedia.'], 500);
  }
  $name = bin2hex(random_bytes(20)) . '.' . $types[$mime][0];
  if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $name)) {
    error_log("KU-KISS: gagal menyimpan lampiran di $directory");
    json_response(['error' => 'Lampiran gagal disimpan.'], 500);
  }
  return $folder . '/' . $name;
}

function create_feedback(array $user): never {
  csrf_check();
  $data = $_POST ?: request_data();
  $message = valid_text($data['message'] ?? '', 'Pesan feedback', 2000);
  $orderId = null;
  if (isset($data['order_id']) && $data['order_id'] !== '' && $data['order_id'] !== null) {
    $orderId = positive_int($data['order_id'], 'ID pesanan');
    if ($orderId < 1) json_response(['error' => 'ID pesanan tidak valid.'], 422);
    $stmt = db()->prepare(
      'SELECT status_pesanan, bukti_sesudah_path
       FROM pesanan WHERE id_pesanan = ? AND id_pelanggan = ?'
    );
    $stmt->execute([$orderId, $user['id']]);
    $order = $stmt->fetch();
    if (!$order) json_response(['error' => 'Pesanan tidak ditemukan untuk akun ini.'], 404);
    if ($order['status_pesanan'] !== 'Selesai' || !$order['bukti_sesudah_path']) {
      throw new ApiException('Feedback pesanan dapat dikirim setelah pesanan selesai dan bukti pengiriman diunggah admin.', 409);
    }
  }
  $attachment = feedback_attachment();
  $pdo = db();
  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare(
      'INSERT INTO feedback (id_pelanggan, id_pesanan, pesan, lampiran_path)
       VALUES (?, ?, ?, ?) RETURNING id_feedback'
    );
    $stmt->execute([$user['id'], $orderId, $message, $attachment]);
    $feedbackId = (int)$stmt->fetchColumn();
    notify_admins(
      $pdo,
      $orderId,
      $feedbackId,
      'feedback',
      'Feedback pelanggan baru',
      'Feedback baru dari ' . ($user['name'] ?? 'pelanggan') . '.'
    );
    $pdo->commit();
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($attachment) remove_private_upload($attachment);
    throw $error;
  }
  json_response(['message' => 'Feedback berhasil dikirim ke admin.'], 201);
}

function cancel_order(array $user): never {
  csrf_check();
  $data = request_data();
  $id = positive_int($data['id'] ?? null, 'ID pesanan');
  if ($id < 1) throw new ApiException('ID pesanan tidak valid.', 422);
  $reason = valid_text($data['reason'] ?? '', 'Alasan pembatalan', 300);
  $pdo = db();
  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare(
      'SELECT o.status_pesanan AS status, COALESCE(o.tanggal_ambil, b.tanggal_tutup) AS scheduled_date
       FROM pesanan o JOIN batch_po b ON b.id_batch = o.id_batch
       WHERE o.id_pesanan = ? AND o.id_pelanggan = ? FOR UPDATE OF o'
    );
    $stmt->execute([$id, $user['id']]);
    $order = $stmt->fetch();
    if (!$order) throw new ApiException('Pesanan tidak ditemukan.', 404);
    if (in_array($order['status'], ['Selesai', 'Dibatalkan'], true)) {
      throw new ApiException('Pesanan ini tidak dapat dibatalkan.', 409);
    }
    $scheduledDate = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$order['scheduled_date']);
    if (!$scheduledDate) throw new ApiException('Jadwal pesanan belum tersedia. Hubungi admin untuk bantuan.', 409);
    $deadlineDate = $scheduledDate->modify('-3 days');
    if (new DateTimeImmutable('today') > $deadlineDate) {
      throw new ApiException('Batas pembatalan H-3 telah terlewati.', 409);
    }
    $pdo->prepare(
      "UPDATE pesanan SET status_pesanan = 'Dibatalkan', alasan_pembatalan = ?
       WHERE id_pesanan = ?"
    )->execute([$reason, $id]);
    notify_admins($pdo, $id, null, 'order_cancelled', 'Pesanan dibatalkan pelanggan', 'Pesanan #' . $id . ' dibatalkan: ' . $reason);
    $pdo->commit();
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $error;
  }
  json_response(['message' => 'Pesanan berhasil dibatalkan.']);
}

function save_order_evidence(): never {
  csrf_check();
  $id = positive_int($_POST['order_id'] ?? null, 'ID pesanan');
  $stage = $_POST['stage'] ?? '';
  if ($id < 1 || !in_array($stage, ['before', 'after'], true)) {
    throw new ApiException('Pesanan atau tahap bukti tidak valid.', 422);
  }
  $path = uploaded_image('image', 'storage/evidence', true, 1024 * 1024, 'Foto bukti wajib diunggah.');
  $column = $stage === 'before' ? 'bukti_sebelum_path' : 'bukti_sesudah_path';
  $stmt = db()->prepare('SELECT ' . $column . ' FROM pesanan WHERE id_pesanan = ?');
  $stmt->execute([$id]);
  $oldPath = $stmt->fetchColumn();
  if ($oldPath === false) {
    remove_private_upload($path);
    throw new ApiException('Pesanan tidak ditemukan.', 404);
  }
  try {
    db()->prepare('UPDATE pesanan SET ' . $column . ' = ? WHERE id_pesanan = ?')->execute([$path, $id]);
  } catch (Throwable $error) {
    remove_private_upload($path);
    throw $error;
  }
  if (is_string($oldPath) && $oldPath !== $path) remove_private_upload($oldPath);
  json_response(['message' => 'Bukti foto berhasil diunggah.']);
}

function order_evidence(array $user): never {
  $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
  $stage = $_GET['stage'] ?? '';
  if (!$id || !in_array($stage, ['before', 'after'], true)) {
    json_response(['error' => 'Pesanan atau tahap bukti tidak valid.'], 422);
  }
  $column = $stage === 'before' ? 'bukti_sebelum_path' : 'bukti_sesudah_path';
  $stmt = db()->prepare(
    'SELECT id_pelanggan, ' . $column . ' AS image_path FROM pesanan WHERE id_pesanan = ?'
  );
  $stmt->execute([$id]);
  $order = $stmt->fetch();
  if (!$order || ($user['role'] !== 'admin' && (int)$order['id_pelanggan'] !== (int)$user['id'])) {
    json_response(['error' => 'Bukti pesanan tidak ditemukan.'], 404);
  }
  $path = (string)$order['image_path'];
  if (!preg_match('#^storage/evidence/[a-f0-9]{40}\.(jpg|png|webp)$#', $path)) {
    json_response(['error' => 'Bukti pesanan tidak tersedia.'], 404);
  }
  $file = dirname(__DIR__) . '/' . $path;
  if (!is_file($file)) json_response(['error' => 'File bukti pesanan tidak tersedia.'], 404);
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);
  if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
    error_log("KU-KISS: tipe bukti pesanan tidak valid untuk pesanan $id");
    json_response(['error' => 'File bukti pesanan tidak valid.'], 500);
  }
  header('Content-Type: ' . $mime);
  header('Content-Disposition: inline; filename="bukti-pesanan-' . (int)$id . '"');
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: private, no-store');
  readfile($file);
  exit;
}

function feedback_attachment_view(): never {
  $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
  if (!$id) json_response(['error' => 'ID feedback tidak valid.'], 422);
  $stmt = db()->prepare('SELECT lampiran_path FROM feedback WHERE id_feedback = ?');
  $stmt->execute([$id]);
  $path = $stmt->fetchColumn();
  if (!is_string($path) || !preg_match('#^storage/feedback/[a-f0-9]{40}\.(jpg|png|webp|mp4|webm|mov)$#', $path)) {
    json_response(['error' => 'Lampiran feedback tidak ditemukan.'], 404);
  }
  $file = dirname(__DIR__) . '/' . $path;
  if (!is_file($file)) json_response(['error' => 'File lampiran tidak tersedia.'], 404);
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);
  if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'], true)) {
    error_log("KU-KISS: tipe lampiran feedback tidak valid untuk feedback $id");
    json_response(['error' => 'File lampiran tidak valid.'], 500);
  }
  header('Content-Type: ' . $mime);
  header('Content-Disposition: inline; filename="feedback-' . (int)$id . '"');
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: private, no-store');
  readfile($file);
  exit;
}

function mark_notification_read(array $user, bool $all = false): never {
  csrf_check();
  $column = $user['role'] === 'admin' ? 'id_admin' : 'id_pelanggan';
  if ($all) {
    db()->prepare(
      'UPDATE notifikasi_aplikasi SET dibaca_pada = CURRENT_TIMESTAMP
       WHERE ' . $column . ' = ? AND dibaca_pada IS NULL'
    )->execute([$user['id']]);
    json_response(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
  }
  $data = request_data();
  $id = positive_int($data['id'] ?? null, 'ID notifikasi');
  if ($id < 1) throw new ApiException('ID notifikasi tidak valid.', 422);
  $stmt = db()->prepare(
    'UPDATE notifikasi_aplikasi SET dibaca_pada = COALESCE(dibaca_pada, CURRENT_TIMESTAMP)
     WHERE id_notifikasi = ? AND ' . $column . ' = ?'
  );
  $stmt->execute([$id, $user['id']]);
  if ($stmt->rowCount() < 1) throw new ApiException('Notifikasi tidak ditemukan.', 404);
  json_response(['message' => 'Notifikasi ditandai sudah dibaca.']);
}

function mark_admin_section_notifications_read(array $admin): never {
  csrf_check();
  $section = request_data()['section'] ?? '';
  $typesBySection = [
    'orders' => ['order_created', 'order_cancelled'],
    'feedback' => ['feedback'],
  ];
  if ($section === 'notifications') {
    $stmt = db()->prepare(
      'UPDATE notifikasi_aplikasi SET dibaca_pada = CURRENT_TIMESTAMP
       WHERE id_admin = ? AND dibaca_pada IS NULL'
    );
    $stmt->execute([$admin['id']]);
  } elseif (isset($typesBySection[$section])) {
    $types = $typesBySection[$section];
    $placeholders = implode(', ', array_fill(0, count($types), '?'));
    $stmt = db()->prepare(
      'UPDATE notifikasi_aplikasi SET dibaca_pada = CURRENT_TIMESTAMP
       WHERE id_admin = ? AND dibaca_pada IS NULL
         AND jenis_notifikasi IN (' . $placeholders . ')'
    );
    $stmt->execute([$admin['id'], ...$types]);
  } else {
    throw new ApiException('Bagian notifikasi tidak valid.', 422);
  }
  json_response(['message' => 'Notifikasi pada halaman ini ditandai sudah dibaca.', 'updated' => $stmt->rowCount()]);
}

function order_create(array $user): never {
  csrf_check();
  $rawItems = json_decode((string)($_POST['items'] ?? ''), true);
  if (!is_array($rawItems) || count($rawItems) < 1 || count($rawItems) > 50) {
    json_response(['error' => 'Keranjang tidak valid.'], 422);
  }
  $validatedItems = [];
  $seen = [];
  foreach ($rawItems as $item) {
    if (!is_array($item)) json_response(['error' => 'Item pesanan tidak valid.'], 422);
    $productId = positive_int($item['id'] ?? null, 'Produk');
    $quantity = positive_int($item['quantity'] ?? null, 'Jumlah', 100);
    if ($productId < 1 || $quantity < 1 || isset($seen[$productId])) {
      json_response(['error' => 'Item atau jumlah pesanan tidak valid.'], 422);
    }
    $seen[$productId] = true;
    $validatedItems[] = ['id' => $productId, 'quantity' => $quantity];
  }
  $mode = $_POST['mode'] ?? '';
  if (!in_array($mode, ['delivery', 'pickup'], true)) json_response(['error' => 'Metode pengambilan tidak valid.'], 422);
  $shipping = 0;
  $districtId = null;
  $address = '';
  if ($mode === 'delivery') {
    $districtId = positive_int($_POST['district_id'] ?? null, 'Wilayah');
    if ($districtId < 1) json_response(['error' => 'Pilih wilayah pengantaran yang tersedia.'], 422);
    $districtStmt = db()->prepare(
      'SELECT nama_wilayah AS name, ongkir AS shipping_fee
       FROM wilayah_ongkir WHERE id_wilayah = ? AND aktif = TRUE'
    );
    $districtStmt->execute([$districtId]);
    $district = $districtStmt->fetch();
    if (!$district) json_response(['error' => 'Wilayah pengantaran tidak tersedia. Muat ulang halaman lalu pilih wilayah lain.'], 409);
    $shipping = (int)$district['shipping_fee'];
    $streetAddress = valid_text($_POST['address'] ?? '', 'Alamat', 900);
    $address = $district['name'] . "\n" . $streetAddress;
  }
  $proofPath = uploaded_image('proof', 'storage/payments', true);
  $pdo = db();
  $pdo->beginTransaction();
  try {
    $items = [];
    $subtotal = 0;
    foreach ($validatedItems as $item) {
      $productId = $item['id'];
      $quantity = $item['quantity'];
      $stmt = $pdo->prepare(
        'SELECT id_produk AS id, nama_produk AS name, harga AS price
         FROM produk WHERE id_produk = ? FOR UPDATE'
      );
      $stmt->execute([$productId]);
      $product = $stmt->fetch();
      if (!$product) throw new ApiException('Salah satu produk sudah tidak tersedia.', 409);
      $items[] = ['product' => $product, 'quantity' => $quantity];
      $subtotal += (int)$product['price'] * $quantity;
    }

    $batchStmt = $pdo->query(
      "SELECT id_batch FROM batch_po
       WHERE status_batch = 'dibuka' AND tanggal_buka <= CURRENT_DATE AND tanggal_tutup >= CURRENT_DATE
       ORDER BY tanggal_buka DESC, id_batch DESC
       LIMIT 1 FOR UPDATE"
    );
    $batchId = $batchStmt->fetchColumn();
    if (!$batchId) throw new ApiException('Pemesanan sedang tidak dibuka. Silakan coba lagi saat ada batch PO yang aktif.', 409);

    $orderCode = 'K' . date('ymdHis') . strtoupper(bin2hex(random_bytes(3)));
    $stmt = $pdo->prepare(
      'INSERT INTO pesanan
         (kode_pesanan, id_pelanggan, id_admin, id_batch, id_wilayah, metode_pengambilan,
          status_pesanan, status_pembayaran, metode_pembayaran, total_harga,
          alamat_pengiriman, ongkir, bukti_pembayaran)
       VALUES (?, ?, NULL, ?, ?, ?, \'Diproses\', \'Belum Dibayar\', \'QRIS\', ?, ?, ?, ?)
       RETURNING id_pesanan'
    );
    $stmt->execute([$orderCode, $user['id'], $batchId, $districtId, $mode, $subtotal + $shipping, $address, $shipping, $proofPath]);
    $orderId = (int)$stmt->fetchColumn();
    $insertItem = $pdo->prepare('INSERT INTO detail_pesanan (id_pesanan, id_produk, jumlah, subtotal) VALUES (?, ?, ?, ?)');
    foreach ($items as $item) {
      $product = $item['product'];
      $quantity = $item['quantity'];
      $insertItem->execute([$orderId, $product['id'], $quantity, (int)$product['price'] * $quantity]);
    }
    notify_admins($pdo, $orderId, null, 'order_created', 'Pesanan baru', 'Pesanan #' . $orderId . ' menunggu verifikasi pembayaran.');
    $pdo->commit();
    json_response(['message' => 'Pesanan berhasil dibuat dan menunggu verifikasi pembayaran.', 'order_id' => $orderId], 201);
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($proofPath) {
      $fullPath = dirname(__DIR__) . '/' . $proofPath;
      if (is_file($fullPath) && !unlink($fullPath)) error_log("KU-KISS: gagal membersihkan bukti $proofPath");
    }
    throw $error;
  }
}

function save_product(): never {
  csrf_check();
  $id = positive_int($_POST['id'] ?? 0, 'ID produk');
  $code = valid_text($_POST['code'] ?? '', 'Kode produk', 30);
  $name = valid_text($_POST['name'] ?? '', 'Nama produk', 100);
  $description = valid_text($_POST['description'] ?? '', 'Deskripsi', 2000, false);
  $price = positive_int($_POST['price'] ?? null, 'Harga');
  $categoryId = positive_int($_POST['category_id'] ?? null, 'Kategori');
  if ($price < 1 || $categoryId < 1) json_response(['error' => 'Harga dan kategori harus diisi dengan benar.'], 422);

  $pdo = db();
  $existing = null;
  if ($id > 0) {
    $stmt = $pdo->prepare('SELECT gambar AS image_path FROM produk WHERE id_produk = ?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) json_response(['error' => 'Produk tidak ditemukan.'], 404);
  }
  $imagePath = uploaded_image('image', 'public/uploads/products') ?? ($existing['image_path'] ?? null);
  try {
    if ($id > 0) {
      $stmt = $pdo->prepare(
        'UPDATE produk SET kode_produk = ?, nama_produk = ?, deskripsi = ?, harga = ?,
                           id_kategori = ?, gambar = ? WHERE id_produk = ?'
      );
      $stmt->execute([$code, $name, $description, $price, $categoryId, $imagePath, $id]);
    } else {
      $stmt = $pdo->prepare(
        'INSERT INTO produk (kode_produk, nama_produk, deskripsi, harga, id_kategori, gambar)
         VALUES (?, ?, ?, ?, ?, ?)'
      );
      $stmt->execute([$code, $name, $description, $price, $categoryId, $imagePath]);
    }
  } catch (Throwable $error) {
    if ($imagePath && $imagePath !== ($existing['image_path'] ?? null)) remove_public_upload($imagePath);
    throw $error;
  }
  if ($existing && $imagePath !== $existing['image_path']) remove_public_upload($existing['image_path']);
  json_response(['message' => 'Produk berhasil disimpan.']);
}

function save_category(): never {
  csrf_check();
  $data = request_data();
  $id = positive_int($data['id'] ?? 0, 'ID kategori');
  $name = valid_text($data['name'] ?? '', 'Nama kategori', 100);
  $code = strtoupper(valid_text($data['code'] ?? '', 'Kode kategori', 20));
  if ($id > 0) {
    $stmt = db()->prepare('UPDATE kategori SET kode_kategori = ?, nama_kategori = ? WHERE id_kategori = ?');
    $stmt->execute([$code, $name, $id]);
  } else {
    $stmt = db()->prepare('INSERT INTO kategori (kode_kategori, nama_kategori) VALUES (?, ?)');
    $stmt->execute([$code, $name]);
  }
  json_response(['message' => 'Kategori berhasil disimpan.']);
}

function save_expense(): never {
  csrf_check();
  $data = request_data();
  $id = positive_int($data['id'] ?? 0, 'ID pengeluaran');
  $date = valid_text($data['expense_date'] ?? '', 'Tanggal', 10);
  $parsed = DateTime::createFromFormat('!Y-m-d', $date);
  if (!$parsed || $parsed->format('Y-m-d') !== $date) json_response(['error' => 'Tanggal pengeluaran tidak valid.'], 422);
  $ingredientId = positive_int($data['ingredient_id'] ?? null, 'Bahan baku');
  if ($ingredientId < 1) json_response(['error' => 'Pilih bahan baku yang terdaftar.'], 422);
  $ingredientStmt = db()->prepare('SELECT nama_bahan FROM bahan_baku WHERE id_bahan = ?');
  $ingredientStmt->execute([$ingredientId]);
  $description = $ingredientStmt->fetchColumn();
  if (!is_string($description)) throw new ApiException('Bahan baku tidak ditemukan.', 404);
  $amount = positive_int($data['amount'] ?? null, 'Jumlah');
  if ($amount < 1) json_response(['error' => 'Jumlah pengeluaran harus lebih dari nol.'], 422);
  if ($id > 0) {
    $stmt = db()->prepare(
      'UPDATE pengeluaran SET id_bahan = ?, tanggal_pengeluaran = ?, keterangan = ?, total_pengeluaran = ?
       WHERE id_pengeluaran = ?'
    );
    $stmt->execute([$ingredientId, $date, $description, $amount, $id]);
    if ($stmt->rowCount() < 1) {
      $exists = db()->prepare('SELECT 1 FROM pengeluaran WHERE id_pengeluaran = ?');
      $exists->execute([$id]);
      if (!$exists->fetchColumn()) throw new ApiException('Catatan pengeluaran tidak ditemukan.', 404);
    }
  } else {
    $batchId = db()->query(
      "SELECT id_batch FROM batch_po ORDER BY
         CASE status_batch WHEN 'dibuka' THEN 0 ELSE 1 END,
         tanggal_buka DESC, id_batch DESC LIMIT 1"
    )->fetchColumn();
    if (!$batchId) json_response(['error' => 'Buat batch PO terlebih dahulu sebelum mencatat pengeluaran.'], 409);
    $stmt = db()->prepare(
      'INSERT INTO pengeluaran (id_batch, id_bahan, tanggal_pengeluaran, keterangan, total_pengeluaran)
       VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$batchId, $ingredientId, $date, $description, $amount]);
  }
  json_response(['message' => 'Pengeluaran berhasil disimpan.']);
}

function create_batch(array $admin): never {
  csrf_check();
  $data = request_data();
  $name = valid_text($data['name'] ?? '', 'Nama batch', 100);
  $startDate = valid_text($data['start_date'] ?? '', 'Tanggal buka', 10);
  $endDate = valid_text($data['end_date'] ?? '', 'Tanggal tutup', 10);
  $start = DateTimeImmutable::createFromFormat('!Y-m-d', $startDate);
  $end = DateTimeImmutable::createFromFormat('!Y-m-d', $endDate);
  $today = new DateTimeImmutable('today');
  if (!$start || $start->format('Y-m-d') !== $startDate || !$end || $end->format('Y-m-d') !== $endDate) {
    throw new ApiException('Tanggal batch tidak valid.', 422);
  }
  if ($start < $today || $end < $start) {
    throw new ApiException('Tanggal buka tidak boleh sebelum hari ini dan tanggal tutup tidak boleh sebelum tanggal buka.', 422);
  }

  $pdo = db();
  $pdo->beginTransaction();
  try {
    $pdo->exec('LOCK TABLE batch_po IN SHARE ROW EXCLUSIVE MODE');
    $overlap = $pdo->prepare(
      "SELECT 1 FROM batch_po
       WHERE status_batch = 'dibuka' AND tanggal_buka <= ? AND tanggal_tutup >= ?
       LIMIT 1"
    );
    $overlap->execute([$endDate, $startDate]);
    if ($overlap->fetchColumn()) {
      throw new ApiException('Jadwal batch ini bertabrakan dengan batch lain yang masih dibuka.', 409);
    }

    $stmt = $pdo->prepare(
      "INSERT INTO batch_po (id_admin, nama_batch, tanggal_buka, tanggal_tutup, status_batch)
       VALUES (?, ?, ?, ?, 'dibuka')"
    );
    $stmt->execute([$admin['id'], $name, $startDate, $endDate]);
    notify_customers(
      $pdo,
      'batch_opened',
      'Batch PO dibuka',
      'Batch "' . $name . '" dibuka pada ' . $startDate . ' sampai ' . $endDate . '.'
    );
    $pdo->commit();
  } catch (PDOException $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    if ($error->getCode() === '23505') {
      throw new ApiException('Nama batch sudah digunakan. Pilih nama lain.', 409);
    }
    throw $error;
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $error;
  }

  json_response(['message' => 'Batch PO berhasil dibuat dan dibuka.']);
}

function close_batch(): never {
  csrf_check();
  $data = request_data();
  $id = positive_int($data['id'] ?? null, 'ID batch');
  if ($id < 1) throw new ApiException('ID batch tidak valid.', 422);

  $pdo = db();
  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare(
      "SELECT nama_batch AS name, tanggal_buka AS start_date, tanggal_tutup AS end_date
       FROM batch_po WHERE id_batch = ? AND status_batch = 'dibuka'
       FOR UPDATE"
    );
    $stmt->execute([$id]);
    $batch = $stmt->fetch();
    if (!$batch) {
      $exists = $pdo->prepare('SELECT 1 FROM batch_po WHERE id_batch = ?');
      $exists->execute([$id]);
      if (!$exists->fetchColumn()) throw new ApiException('Batch PO tidak ditemukan.', 404);
      throw new ApiException('Batch PO ini sudah ditutup atau tidak dapat ditutup.', 409);
    }
    $pdo->prepare(
      "UPDATE batch_po SET status_batch = 'ditutup'
       WHERE id_batch = ?"
    )->execute([$id]);
    notify_customers(
      $pdo,
      'batch_closed',
      'Batch PO ditutup',
      'Batch "' . $batch['name'] . '" ditutup. Periode batch: ' . $batch['start_date'] . ' sampai ' . $batch['end_date'] . '.'
    );
    $pdo->commit();
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $error;
  }
  json_response(['message' => 'Batch PO berhasil ditutup.']);
}

function delete_record(string $resource): never {
  csrf_check();
  $data = request_data();
  $id = positive_int($data['id'] ?? null, 'ID');
  if ($id < 1) json_response(['error' => 'ID tidak valid.'], 422);
  $table = match ($resource) {
    'product' => ['produk', 'id_produk'],
    'category' => ['kategori', 'id_kategori'],
    'expense' => ['pengeluaran', 'id_pengeluaran'],
    'ingredient' => ['bahan_baku', 'id_bahan'],
    default => json_response(['error' => 'Aksi tidak ditemukan.'], 404),
  };
  [$tableName, $idColumn] = $table;
  $stmt = db()->prepare("DELETE FROM $tableName WHERE $idColumn = ?");
  $stmt->execute([$id]);
  if ($stmt->rowCount() < 1) json_response(['error' => 'Data tidak ditemukan.'], 404);
  json_response(['message' => 'Data berhasil dihapus.']);
}

function save_ingredient(): never {
  csrf_check();
  $data = request_data();
  $id = positive_int($data['id'] ?? 0, 'ID bahan baku');
  $name = valid_text($data['name'] ?? '', 'Nama bahan baku', 100);
  $available = $data['available'] ?? null;
  if (!is_bool($available)) json_response(['error' => 'Status ketersediaan bahan baku tidak valid.'], 422);

  if ($id > 0) {
    $stmt = db()->prepare(
      'UPDATE bahan_baku SET nama_bahan = ?, tersedia = ? WHERE id_bahan = ?'
    );
    $stmt->bindValue(1, $name, PDO::PARAM_STR);
    $stmt->bindValue(2, $available, PDO::PARAM_BOOL);
    $stmt->bindValue(3, $id, PDO::PARAM_INT);
    $stmt->execute();
    if ($stmt->rowCount() < 1) {
      $exists = db()->prepare('SELECT 1 FROM bahan_baku WHERE id_bahan = ?');
      $exists->execute([$id]);
      if (!$exists->fetchColumn()) throw new ApiException('Bahan baku tidak ditemukan.', 404);
    }
  } else {
    $stmt = db()->prepare(
      'INSERT INTO bahan_baku (nama_bahan, tersedia) VALUES (?, ?)'
    );
    $stmt->bindValue(1, $name, PDO::PARAM_STR);
    $stmt->bindValue(2, $available, PDO::PARAM_BOOL);
    $stmt->execute();
  }
  json_response(['message' => 'Bahan baku berhasil disimpan.']);
}

function update_order(string $action, array $user): never {
  csrf_check();
  $data = request_data();
  $id = positive_int($data['id'] ?? null, 'ID pesanan');
  $pdo = db();
  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare(
      'SELECT id_pesanan AS id, id_pelanggan AS customer_id,
              status_pembayaran AS payment_status,
              status_pesanan AS status
       FROM pesanan WHERE id_pesanan = ? FOR UPDATE'
    );
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) throw new ApiException('Pesanan tidak ditemukan.', 404);

    if ($action === 'payment') {
      if ($order['status'] === 'Dibatalkan' && $order['payment_status'] === 'Belum Dibayar') {
        throw new ApiException('Pesanan sudah dibatalkan dan tidak perlu diverifikasi lagi.', 409);
      }
      if ($order['payment_status'] !== 'Belum Dibayar') throw new ApiException('Status pembayaran sudah diproses.', 409);
      $decision = $data['decision'] ?? '';
      if (!in_array($decision, ['approve', 'reject'], true)) throw new ApiException('Keputusan pembayaran tidak valid.', 422);
      if ($decision === 'approve') {
        $pdo->prepare('UPDATE pesanan SET status_pembayaran = \'Lunas\', alasan_penolakan = NULL, id_admin = ? WHERE id_pesanan = ?')
          ->execute([$user['id'], $id]);
        notify_customer($pdo, (int)$order['customer_id'], $id, 'payment_approved', 'Pembayaran diverifikasi', 'Pembayaran pesanan #' . $id . ' telah diverifikasi.');
      } else {
        $reason = valid_text($data['reason'] ?? '', 'Alasan penolakan', 300);
        $pdo->prepare(
          'UPDATE pesanan SET status_pembayaran = \'Ditolak\', status_pesanan = \'Dibatalkan\',
                              alasan_penolakan = ?, id_admin = ? WHERE id_pesanan = ?'
        )->execute([$reason, $user['id'], $id]);
        notify_customer($pdo, (int)$order['customer_id'], $id, 'payment_rejected', 'Pembayaran ditolak', 'Pembayaran pesanan #' . $id . ' ditolak: ' . $reason);
      }
    } else {
      if ($order['payment_status'] !== 'Lunas') throw new ApiException('Status pesanan hanya bisa diubah setelah pembayaran diverifikasi.', 409);
      $next = ['Diproses' => 'Siap Diambil', 'Siap Diambil' => 'Selesai'];
      if (!isset($next[$order['status']]) || $data['status'] !== $next[$order['status']]) {
        throw new ApiException('Perubahan status pesanan tidak valid.', 422);
      }
      $pdo->prepare('UPDATE pesanan SET status_pesanan = ?, id_admin = ? WHERE id_pesanan = ?')
        ->execute([$data['status'], $user['id'], $id]);
      notify_customer($pdo, (int)$order['customer_id'], $id, 'order_status', 'Status pesanan diperbarui', 'Status pesanan #' . $id . ' sekarang: ' . $data['status'] . '.');
    }
    $pdo->commit();
  } catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    throw $error;
  }
  json_response(['message' => 'Pesanan berhasil diperbarui.']);
}

function update_profile(array $user): never {
  csrf_check();
  $data = $_POST ?: request_data();
  $name = valid_text($data['name'] ?? '', 'Nama', 100);
  if ($user['role'] === 'admin') {
    db()->prepare('UPDATE admin SET nama = ? WHERE id_admin = ?')->execute([$name, $user['id']]);
    $_SESSION['user'] = user_record((int)$user['id'], 'admin');
    json_response(['user' => $_SESSION['user'], 'message' => 'Profil berhasil disimpan.']);
  }
  $phone = valid_text($data['phone'] ?? '', 'Nomor handphone', 20, false);
  $photoPath = uploaded_image('photo', 'public/uploads/profiles');
  $existing = user_record((int)$user['id'], 'customer');
  $nextPhoto = $photoPath ?? $existing['photo_path'];
  try {
    db()->prepare('UPDATE pelanggan SET nama = ?, no_telp = ?, foto = ? WHERE id_pelanggan = ?')
      ->execute([$name, $phone, $nextPhoto, $user['id']]);
  } catch (Throwable $error) {
    if ($photoPath) remove_public_upload($photoPath);
    throw $error;
  }
  if ($photoPath && $existing['photo_path'] !== $photoPath) remove_public_upload($existing['photo_path']);
  $_SESSION['user'] = user_record((int)$user['id'], 'customer');
  json_response(['user' => $_SESSION['user'], 'message' => 'Profil berhasil disimpan.']);
}

function change_password(array $user): never {
  csrf_check();
  $data = request_data();
  $current = $data['current_password'] ?? '';
  $next = $data['new_password'] ?? '';
  if (!is_string($current) || !is_string($next) || strlen($current) > 200 || strlen($next) < 10 || strlen($next) > 200) {
    json_response(['error' => 'Password baru harus terdiri dari 10 sampai 200 karakter.'], 422);
  }
  $table = $user['role'] === 'admin' ? 'admin' : 'pelanggan';
  $idColumn = $user['role'] === 'admin' ? 'id_admin' : 'id_pelanggan';
  $stmt = db()->prepare("SELECT password FROM $table WHERE $idColumn = ?");
  $stmt->execute([$user['id']]);
  $hash = $stmt->fetchColumn();
  if (!$hash || !password_verify($current, $hash)) json_response(['error' => 'Password saat ini tidak sesuai.'], 422);
  db()->prepare("UPDATE $table SET password = ? WHERE $idColumn = ?")
    ->execute([password_hash($next, PASSWORD_DEFAULT), $user['id']]);
  session_regenerate_id(true);
  $_SESSION['csrf'] = bin2hex(random_bytes(32));
  json_response(['csrf' => $_SESSION['csrf'], 'message' => 'Password berhasil diperbarui.']);
}

function delete_profile_photo(array $user): never {
  csrf_check();
  if ($user['role'] !== 'customer') json_response(['error' => 'Foto profil hanya tersedia untuk akun pelanggan.'], 403);
  $existing = user_record((int)$user['id'], 'customer');
  db()->prepare('UPDATE pelanggan SET foto = NULL WHERE id_pelanggan = ?')->execute([$user['id']]);
  remove_public_upload($existing['photo_path']);
  $_SESSION['user'] = user_record((int)$user['id'], 'customer');
  json_response(['user' => $_SESSION['user'], 'message' => 'Foto profil berhasil dihapus.']);
}

function payment_proof(array $user): never {
  $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
  if (!$id) json_response(['error' => 'ID pesanan tidak valid.'], 422);
  $stmt = db()->prepare('SELECT id_pelanggan, bukti_pembayaran FROM pesanan WHERE id_pesanan = ?');
  $stmt->execute([$id]);
  $order = $stmt->fetch();
  if (!$order || ($user['role'] !== 'admin' && (int)$order['id_pelanggan'] !== (int)$user['id'])) {
    json_response(['error' => 'Bukti pembayaran tidak ditemukan.'], 404);
  }
  $path = dirname(__DIR__) . '/' . $order['bukti_pembayaran'];
  if (!is_file($path)) json_response(['error' => 'File bukti pembayaran tidak tersedia.'], 404);
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path);
  if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
    error_log("KU-KISS: tipe bukti pembayaran tidak valid untuk pesanan $id");
    json_response(['error' => 'File bukti pembayaran tidak valid.'], 500);
  }
  header('Content-Type: ' . $mime);
  header('Content-Disposition: inline; filename="bukti-pembayaran-' . (int)$id . '"');
  header('X-Content-Type-Options: nosniff');
  header('Cache-Control: private, no-store');
  readfile($path);
  exit;
}

$action = $_GET['action'] ?? '';
try {
  if ($action === 'proof') payment_proof(require_user());
  if ($action === 'bootstrap' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = current_user();
    if ($user) {
      $user = user_record((int)$user['id'], $user['role']);
      if (!$user) {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
      } else {
        $_SESSION['user'] = $user;
      }
    }
    json_response([
      'csrf' => $_SESSION['csrf'],
      'user' => $user,
      'products' => product_list(),
      'categories' => category_list(),
      'delivery_areas' => delivery_area_list(),
    ]);
  }

  if ($action === 'register' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $data = request_data();
    $name = valid_text($data['name'] ?? '', 'Nama', 100);
    $email = strtolower(valid_text($data['email'] ?? '', 'Email', 100));
    $password = $data['password'] ?? '';
    $phone = valid_text($data['phone'] ?? '', 'Nomor handphone', 20);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(['error' => 'Format email tidak valid.'], 422);
    if (!is_string($password) || strlen($password) < 10 || strlen($password) > 200) {
      json_response(['error' => 'Password harus terdiri dari 10 sampai 200 karakter.'], 422);
    }
    $baseUsername = substr(preg_replace('/[^a-z0-9._-]/i', '', strstr($email, '@', true)) ?: 'pelanggan', 0, 40);
    $username = $baseUsername;
    $suffix = 1;
    $usernameCheck = db()->prepare('SELECT 1 FROM pelanggan WHERE username = ?');
    while (true) {
      $usernameCheck->execute([$username]);
      if (!$usernameCheck->fetchColumn()) break;
      $username = $baseUsername . '-' . $suffix++;
    }

    $stmt = db()->prepare(
      'INSERT INTO pelanggan (username, email, password, nama, no_telp)
       VALUES (?, ?, ?, ?, ?) RETURNING id_pelanggan'
    );
    try {
      $stmt->execute([$username, $email, password_hash($password, PASSWORD_DEFAULT), $name, $phone]);
    } catch (PDOException $error) {
      if ($error->getCode() === '23505') json_response(['error' => 'Email sudah terdaftar.'], 409);
      throw $error;
    }
    $userId = (int)$stmt->fetchColumn();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    $_SESSION['user'] = user_record($userId, 'customer');
    json_response(['user' => $_SESSION['user'], 'csrf' => $_SESSION['csrf']], 201);
  }

  if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $data = request_data();
    $identifier = valid_text($data['email'] ?? '', 'Email atau username', 100);
    $password = $data['password'] ?? '';
    if (!is_string($password) || $password === '' || strlen($password) > 200) {
      record_login_attempt($identifier, false);
      json_response(['error' => 'Email atau password salah.'], 401);
    }
    $stmt = db()->prepare('SELECT id_pelanggan AS id, password FROM pelanggan WHERE lower(email) = lower(?)');
    $stmt->execute([$identifier]);
    $account = $stmt->fetch();
    $role = 'customer';
    if (!$account) {
      $stmt = db()->prepare('SELECT id_admin AS id, password FROM admin WHERE username = ?');
      $stmt->execute([$identifier]);
      $account = $stmt->fetch();
      $role = 'admin';
    }
    if (!$account) {
      $stmt = db()->prepare('SELECT id_pelanggan AS id, password FROM pelanggan WHERE lower(username) = lower(?)');
      $stmt->execute([$identifier]);
      $account = $stmt->fetch();
      $role = 'customer';
    }
    $authenticated = $account && password_verify($password, $account['password']);
    record_login_attempt($identifier, (bool)$authenticated);
    if (!$authenticated) {
      json_response(['error' => 'Email atau password salah.'], 401);
    }
    if (password_needs_rehash($account['password'], PASSWORD_DEFAULT)) {
      $table = $role === 'admin' ? 'admin' : 'pelanggan';
      $idColumn = $role === 'admin' ? 'id_admin' : 'id_pelanggan';
      db()->prepare("UPDATE $table SET password = ? WHERE $idColumn = ?")
        ->execute([password_hash($password, PASSWORD_DEFAULT), $account['id']]);
    }
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    $_SESSION['user'] = user_record((int)$account['id'], $role);
    json_response(['user' => $_SESSION['user'], 'csrf' => $_SESSION['csrf']]);
  }

  if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
      $params = session_get_cookie_params();
      setcookie(session_name(), '', time() - 42000, $params['path'], '', $params['secure'], $params['httponly']);
    }
    session_destroy();
    json_response(['message' => 'Anda sudah keluar.']);
  }

  if ($action === 'orders' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = require_user();
    json_response(['orders' => order_list($user['role'] === 'admin' ? null : (int)$user['id'])]);
  }
  if ($action === 'notifications' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(['notifications' => notification_list(require_user())]);
  }
  if ($action === 'notification-read' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    mark_notification_read(require_user());
  }
  if ($action === 'notification-read-all' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    mark_notification_read(require_user(), true);
  }
  if ($action === 'notification-read-section' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    mark_admin_section_notifications_read(require_admin());
  }
  if ($action === 'order-evidence' && $_SERVER['REQUEST_METHOD'] === 'GET') order_evidence(require_user());
  if ($action === 'feedback-create' && $_SERVER['REQUEST_METHOD'] === 'POST') create_feedback(require_customer());
  if ($action === 'order-cancel' && $_SERVER['REQUEST_METHOD'] === 'POST') cancel_order(require_customer());
  if ($action === 'order-create' && $_SERVER['REQUEST_METHOD'] === 'POST') order_create(require_customer());
  if ($action === 'profile-save' && $_SERVER['REQUEST_METHOD'] === 'POST') update_profile(require_user());
  if ($action === 'profile-photo-delete' && $_SERVER['REQUEST_METHOD'] === 'POST') delete_profile_photo(require_user());
  if ($action === 'password-change' && $_SERVER['REQUEST_METHOD'] === 'POST') change_password(require_user());

  if (str_starts_with($action, 'admin-') || in_array($action, ['product-save', 'category-save', 'expense-save', 'batch-create', 'batch-close', 'product-delete', 'category-delete', 'expense-delete', 'order-payment', 'order-status', 'order-evidence-save', 'ingredient-save', 'ingredient-delete', 'feedback-attachment'], true)) {
    require_admin();
  }
  if ($action === 'admin-data' && $_SERVER['REQUEST_METHOD'] === 'GET') json_response(admin_summary(require_admin()));
  if ($action === 'batch-create' && $_SERVER['REQUEST_METHOD'] === 'POST') create_batch(require_admin());
  if ($action === 'batch-close' && $_SERVER['REQUEST_METHOD'] === 'POST') close_batch();
  if ($action === 'product-save' && $_SERVER['REQUEST_METHOD'] === 'POST') save_product();
  if ($action === 'product-delete' && $_SERVER['REQUEST_METHOD'] === 'POST') delete_record('product');
  if ($action === 'category-save' && $_SERVER['REQUEST_METHOD'] === 'POST') save_category();
  if ($action === 'category-delete' && $_SERVER['REQUEST_METHOD'] === 'POST') delete_record('category');
  if ($action === 'expense-save' && $_SERVER['REQUEST_METHOD'] === 'POST') save_expense();
  if ($action === 'expense-delete' && $_SERVER['REQUEST_METHOD'] === 'POST') delete_record('expense');
  if ($action === 'ingredient-save' && $_SERVER['REQUEST_METHOD'] === 'POST') save_ingredient();
  if ($action === 'ingredient-delete' && $_SERVER['REQUEST_METHOD'] === 'POST') delete_record('ingredient');
  if ($action === 'order-payment' && $_SERVER['REQUEST_METHOD'] === 'POST') update_order('payment', require_admin());
  if ($action === 'order-status' && $_SERVER['REQUEST_METHOD'] === 'POST') update_order('status', require_admin());
  if ($action === 'order-evidence-save' && $_SERVER['REQUEST_METHOD'] === 'POST') save_order_evidence();
  if ($action === 'feedback-attachment' && $_SERVER['REQUEST_METHOD'] === 'GET') feedback_attachment_view();

  json_response(['error' => 'Aksi tidak ditemukan.'], 404);
} catch (ApiException $error) {
  json_response(['error' => $error->getMessage()], $error->status);
} catch (PDOException $error) {
  error_log('KU-KISS database error: ' . $error->getMessage());
  $status = in_array($error->getCode(), ['23503', '23505'], true) ? 409 : 500;
  $message = $status === 409
    ? 'Data tidak dapat disimpan karena kode/email duplikat atau masih digunakan.'
    : 'Terjadi kesalahan pada database. Periksa konfigurasi dan log server.';
  json_response(['error' => $message], $status);
} catch (Throwable $error) {
  error_log('KU-KISS API error: ' . $error);
  json_response(['error' => 'Terjadi kesalahan pada server. Coba lagi atau periksa log server.'], 500);
}
