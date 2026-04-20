<?php
include 'conexao.php';

$nome = $_POST['nome'];
$preco = $_POST['preco'];
$imagem = $_POST['imagem'];
$categoria = $_POST['categoria'];

$sql = "INSERT INTO produtos (nome, preco, imagem, categoria)
        VALUES ('$nome', '$preco', '$imagem', '$categoria')";

if ($conn->query($sql) === TRUE) {
    echo "Produto cadastrado com sucesso!";
} else {
    echo "Erro: " . $conn->error;
}
?>