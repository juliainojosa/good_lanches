<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

include 'conexao.php';

$dados = json_decode(file_get_contents("php://input"), true);
$id    = intval($dados['id'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(["erro" => "ID inválido"]);
    exit;
}

$conn->query("UPDATE cardapio SET ativo = NOT ativo WHERE id = $id");

$result = $conn->query("SELECT ativo FROM cardapio WHERE id = $id");
$row    = $result->fetch_assoc();

echo json_encode(["ok" => true, "ativo" => (bool)$row['ativo']]);
?>