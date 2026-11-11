
CREATE DATABASE IF NOT EXISTS minecraft_cadastro
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE minecraft_cadastro;

CREATE TABLE IF NOT EXISTS jogadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    nickname VARCHAR(16) NOT NULL UNIQUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE USER IF NOT EXISTS 'minecraftuser'@'localhost'
IDENTIFIED BY 'Minecraft@123';

GRANT SELECT, INSERT, UPDATE, DELETE
ON minecraft_cadastro.jogadores
TO 'minecraftuser'@'localhost';
