<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Fungsi untuk mengecek akses admin
function check_admin_login() {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header("Location: login.php");
        exit();
    }
}