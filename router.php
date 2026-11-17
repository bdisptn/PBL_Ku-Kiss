<?php
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (preg_match('#^/(config|storage|database|scripts|admin/includes)(/|$)#i', $path)) {
  http_response_code(404);
  exit;
}
if ($path === '/api' || $path === '/api/') {
  require __DIR__ . '/api/index.php';
  return true;
}
if ($path === '/api/index.php' || preg_match('#^/admin/[^/]+\.php$#i', $path)) return false;
$file = __DIR__ . $path;
if (pathinfo($path, PATHINFO_EXTENSION) === 'php') {
  http_response_code(404);
  return true;
}
if ($path !== '/' && is_file($file)) return false;
if ($path !== '/' && pathinfo($path, PATHINFO_EXTENSION) !== '') {
  http_response_code(404);
  return true;
}
readfile(__DIR__ . '/index.html');
return true;
