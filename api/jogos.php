<?php
// =========================================
// API - LISTAR JOGOS
// =========================================
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

$result = $conn->query("SELECT slug, nome FROM jogos ORDER BY nome ASC");

$jogos = [];
while ($row = $result->fetch_assoc()) {
    $jogos[] = $row;
}

echo json_encode(['success' => true, 'jogos' => $jogos]);
