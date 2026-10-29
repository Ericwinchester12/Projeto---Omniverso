<?php
// =========================================
// CONFIGURAÇÃO DO BANCO DE DADOS
// =========================================

$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';           // Senha padrão do XAMPP é vazia
$DB_NAME = getenv('DB_NAME') ?: 'omniverso';

// Conexão inicial (sem selecionar banco, para poder criá-lo)
$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS);

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => 'Falha na conexão: ' . $conn->connect_error]));
}

// Cria o banco de dados se não existir
$conn->query("CREATE DATABASE IF NOT EXISTS `$DB_NAME` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db($DB_NAME);

// =========================================
// CRIAÇÃO DAS TABELAS
// =========================================

// Tabela de administradores
$conn->query("
    CREATE TABLE IF NOT EXISTS `admins` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `username` VARCHAR(50) NOT NULL UNIQUE,
        `password` VARCHAR(255) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// Tabela de jogos (dimensões)
$conn->query("
    CREATE TABLE IF NOT EXISTS `jogos` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `slug` VARCHAR(50) NOT NULL UNIQUE,
        `nome` VARCHAR(100) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// Tabela de imagens
$conn->query("
    CREATE TABLE IF NOT EXISTS `imagens` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `jogo_slug` VARCHAR(50) NOT NULL,
        `filename` VARCHAR(255) NOT NULL,
        `titulo` VARCHAR(200) DEFAULT NULL,
        `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (`jogo_slug`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// =========================================
// ADMIN PADRÃO (usuário: admin / senha: admin123)
// Altere a senha abaixo antes de publicar!
// =========================================
$adminCheck = $conn->query("SELECT id FROM admins LIMIT 1");
if ($adminCheck->num_rows === 0) {
    $defaultUser = 'admin';
    $defaultPass = password_hash('admin123', PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
    $stmt->bind_param('ss', $defaultUser, $defaultPass);
    $stmt->execute();
    $stmt->close();
}

// Insere os jogos padrão se não existirem
$jogosCheck = $conn->query("SELECT id FROM jogos LIMIT 1");
if ($jogosCheck->num_rows === 0) {
    $conn->query("INSERT INTO jogos (slug, nome) VALUES ('rdr1', 'Red Dead Redemption 1')");
    $conn->query("INSERT INTO jogos (slug, nome) VALUES ('gtav', 'GTA V')");
}

// Inicia sessão se ainda não estiver ativa
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
