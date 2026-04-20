<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

include 'conexao.php';

$sql    = "SELECT * FROM cardapio WHERE ativo = 1 ORDER BY categoria, id";
$result = $conn->query($sql);

$produtos = [];
while ($row = $result->fetch_assoc()) {
    $produtos[] = $row;
}

echo json_encode($produtos);
?>