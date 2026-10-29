<?php
// =========================================
// API DE LOGOUT
// =========================================
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

session_destroy();
echo json_encode(['success' => true, 'message' => 'Logout realizado']);
