<?php
// =========================================
// API DE LOGIN
// =========================================
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Usuário e senha são obrigatórios']);
    exit;
}

$stmt = $conn->prepare("SELECT id, username, password FROM admins WHERE username = ?");
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Credenciais inválidas']);
    exit;
}

$admin = $result->fetch_assoc();

if (!password_verify($password, $admin['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Credenciais inválidas']);
    exit;
}

$_SESSION['admin_id'] = $admin['id'];
$_SESSION['admin_user'] = $admin['username'];

echo json_encode(['success' => true, 'message' => 'Login realizado com sucesso']);
$stmt->close();
