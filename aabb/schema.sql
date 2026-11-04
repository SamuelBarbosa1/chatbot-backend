-- Criação da base de dados e tabela para o Chatbot / FAQ
CREATE DATABASE IF NOT EXISTS chatbot_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chatbot_db;

CREATE TABLE IF NOT EXISTS faq (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modulo VARCHAR(100) NOT NULL COMMENT 'Ex: Perfil e Acesso, Ingressos, Notificações',
  pergunta VARCHAR(255) NOT NULL,
  resposta TEXT NOT NULL,
  destaque BOOLEAN DEFAULT FALSE COMMENT '1 para destaque (chips rápidos), 0 normal',
  ativo BOOLEAN DEFAULT TRUE COMMENT '1 ativo, 0 desativado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para otimização de consultas
  INDEX idx_modulo (modulo),
  INDEX idx_destaque (destaque),
  INDEX idx_ativo (ativo),
  FULLTEXT idx_busca (pergunta, resposta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
