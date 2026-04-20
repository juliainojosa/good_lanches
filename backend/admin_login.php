<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// ── Credenciais do admin (altere aqui) ──────────────────────
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', 'goodlanches2025');
// ────────────────────────────────────────────────────────────

$dados   = json_decode(file_get_contents("php://input"), true);
$usuario = trim($dados['usuario'] ?? '');
$senha   = trim($dados['senha']   ?? '');

if ($usuario === ADMIN_USER && $senha === ADMIN_PASS) {
    echo json_encode(["ok" => true]);
} else {
    http_response_code(401);
    echo json_encode(["erro" => "Credenciais inválidas"]);
}
?>