<?php
// =========================================
// API DE UPLOAD DE IMAGENS
// =========================================
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

// Verifica se está autenticado
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Não autorizado. Faça login primeiro.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$jogoSlug = $_POST['jogo'] ?? '';
$titulo = $_POST['titulo'] ?? '';

if (empty($jogoSlug)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'O campo "jogo" é obrigatório']);
    exit;
}

// Verifica se o jogo existe
$stmtJogo = $conn->prepare("SELECT id FROM jogos WHERE slug = ?");
$stmtJogo->bind_param('s', $jogoSlug);
$stmtJogo->execute();
if ($stmtJogo->get_result()->num_rows === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Jogo não encontrado']);
    exit;
}
$stmtJogo->close();

if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nenhuma imagem enviada ou erro no upload']);
    exit;
}

$file = $_FILES['imagem'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF.']);
    exit;
}

// Limite de 20MB
if ($file['size'] > 20 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Arquivo muito grande. Limite: 20MB.']);
    exit;
}

// Cria o diretório de uploads para o jogo
$uploadDir = __DIR__ . '/../uploads/' . $jogoSlug . '/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Gera nome único para o arquivo
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('img_') . '_' . time() . '.' . $ext;
$targetPath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Falha ao salvar o arquivo']);
    exit;
}

// Salva no banco de dados
$stmt = $conn->prepare("INSERT INTO imagens (jogo_slug, filename, titulo) VALUES (?, ?, ?)");
$tituloDb = !empty($titulo) ? $titulo : null;
$stmt->bind_param('sss', $jogoSlug, $filename, $tituloDb);
$stmt->execute();
$insertId = $stmt->insert_id;
$stmt->close();

echo json_encode([
    'success' => true,
    'message' => 'Imagem enviada com sucesso',
    'imagem' => [
        'id' => $insertId,
        'filename' => $filename,
        'titulo' => $tituloDb,
        'url' => 'uploads/' . $jogoSlug . '/' . $filename
    ]
]);
