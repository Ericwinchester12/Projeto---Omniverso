<?php
// =========================================
// API - EXCLUIR IMAGEM
// =========================================
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

// Verifica se está autenticado
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$imagemId = $input['id'] ?? 0;

if (empty($imagemId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID da imagem é obrigatório']);
    exit;
}

// Busca a imagem no banco
$stmt = $conn->prepare("SELECT id, jogo_slug, filename FROM imagens WHERE id = ?");
$stmt->bind_param('i', $imagemId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Imagem não encontrada']);
    exit;
}

$imagem = $result->fetch_assoc();
$stmt->close();

// Remove o arquivo físico
$filePath = __DIR__ . '/../uploads/' . $imagem['jogo_slug'] . '/' . $imagem['filename'];
if (file_exists($filePath)) {
    unlink($filePath);
}

// Remove do banco de dados
$stmtDel = $conn->prepare("DELETE FROM imagens WHERE id = ?");
$stmtDel->bind_param('i', $imagemId);
$stmtDel->execute();
$stmtDel->close();

echo json_encode(['success' => true, 'message' => 'Imagem excluída com sucesso']);
