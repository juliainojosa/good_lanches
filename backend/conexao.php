<?php
$host = "localhost";
$user = "root";
$pass = "";       // senha padrão XAMPP (vazia)
$db   = "goodlanches";

$conn = new mysqli($host, $user, $pass, $db);
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["erro" => "Erro de conexão: " . $conn->connect_error]));
}
?>