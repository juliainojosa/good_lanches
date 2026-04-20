<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

include 'conexao.php';

// Verifica se veio via POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["erro" => "Método não permitido"]);
    exit;
}

$nome      = trim($_POST['nome']      ?? '');
$preco     = trim($_POST['preco']     ?? '');
$imagem    = trim($_POST['imagem']    ?? '');
$categoria = trim($_POST['categoria'] ?? '');
$descricao = trim($_POST['descricao'] ?? '');

if (!$nome || !$preco || !$categoria) {
    http_response_code(400);
    echo json_encode(["erro" => "Campos obrigatórios: nome, preco, categoria"]);
    exit;
}

$stmt = $conn->prepare(
    "INSERT INTO cardapio (categoria, nome, descricao, preco, imagem, ativo)
     VALUES (?, ?, ?, ?, ?, 1)"
);
$stmt->bind_param("sssds", $categoria, $nome, $descricao, $preco, $imagem);

if ($stmt->execute()) {
    echo json_encode(["ok" => true, "id" => $stmt->insert_id]);
} else {
    http_response_code(500);
    echo json_encode(["erro" => $stmt->error]);
}

$stmt->close();
?>