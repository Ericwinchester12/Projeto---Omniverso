<?php
// =========================================
// API - VERIFICAR SESSÃO
// =========================================
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

if (isset($_SESSION['admin_id'])) {
    echo json_encode(['loggedIn' => true, 'username' => $_SESSION['admin_user']]);
} else {
    echo json_encode(['loggedIn' => false]);
}
