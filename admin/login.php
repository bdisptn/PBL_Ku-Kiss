<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Login Admin | KU-KISS</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
<link href="../css/style.css" rel="stylesheet"></head><body>
<main class="container py-5"><section class="auth-card box3d">
<div class="auth-brand"><img src="../img/logo.png" alt="Logo KU-KISS" class="auth-illustration"><h2>KU-KISS</h2></div>
<div class="auth-form-wrap"><h1 class="auth-title">Login Admin</h1>
<!-- BACKEND: action diarahkan ke proses login; sementara hanya pindah ke dashboard. -->
<form action="index.php" class="auth-form">
<label for="u" class="fw-medium">Username</label><input id="u" class="form-control auth-input" placeholder="Masukkan Username">
<label for="p" class="fw-medium mt-3">Password</label><input id="p" type="password" class="form-control auth-input" placeholder="Masukkan Password">
<button class="btn btn-maroon auth-submit mt-3" type="submit">Login</button></form></div></section></main></body></html>