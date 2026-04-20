<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

include 'conexao.php';

$dados     = json_decode(file_get_contents("php://input"), true);
$id        = intval($dados['id']        ?? 0);
$nome      = trim($dados['nome']        ?? '');
$preco     = floatval($dados['preco']   ?? 0);
$categoria = trim($dados['categoria']   ?? '');
$imagem    = trim($dados['imagem']      ?? '');
$descricao = trim($dados['descricao']   ?? '');

if (!$id || !$nome || !$categoria || !$preco) {
    http_response_code(400);
    echo json_encode(["erro" => "Dados incompletos"]);
    exit;
}

$stmt = $conn->prepare(
    "UPDATE cardapio SET nome=?, preco=?, categoria=?, imagem=?, descricao=? WHERE id=?"
);
$stmt->bind_param("sdsssi", $nome, $preco, $categoria, $imagem, $descricao, $id);

if ($stmt->execute()) {
    echo json_encode(["ok" => true]);
} else {
    http_response_code(500);
    echo json_encode(["erro" => $stmt->error]);
}

$stmt->close();
?>