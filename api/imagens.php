<?php
// =========================================
// API - LISTAR IMAGENS DE UM JOGO
// =========================================
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

$jogoSlug = $_GET['jogo'] ?? '';

if (empty($jogoSlug)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Parâmetro "jogo" é obrigatório']);
    exit;
}

// Busca o nome do jogo
$stmtJogo = $conn->prepare("SELECT nome FROM jogos WHERE slug = ?");
$stmtJogo->bind_param('s', $jogoSlug);
$stmtJogo->execute();
$resultJogo = $stmtJogo->get_result();

if ($resultJogo->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Jogo não encontrado']);
    exit;
}

$jogo = $resultJogo->fetch_assoc();
$stmtJogo->close();

// Busca as imagens do jogo
$stmt = $conn->prepare("SELECT id, filename, titulo, uploaded_at FROM imagens WHERE jogo_slug = ? ORDER BY uploaded_at DESC");
$stmt->bind_param('s', $jogoSlug);
$stmt->execute();
$result = $stmt->get_result();

$imagens = [];
while ($row = $result->fetch_assoc()) {
    $row['url'] = 'uploads/' . $jogoSlug . '/' . $row['filename'];
    $imagens[] = $row;
}
$stmt->close();

echo json_encode([
    'success' => true,
    'jogo' => [
        'slug' => $jogoSlug,
        'nome' => $jogo['nome']
    ],
    'imagens' => $imagens,
    'total' => count($imagens)
]);
