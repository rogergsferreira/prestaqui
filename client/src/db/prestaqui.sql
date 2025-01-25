CREATE DATABASE `prestaqui`;
USE `prestaqui`;
CREATE TABLE `user` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `cep` VARCHAR(10) NOT NULL,
    `state` VARCHAR(50) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `neighborhood` VARCHAR(100) NOT NULL,
    `street_address` VARCHAR(255) NOT NULL,
    `avatar_path` VARCHAR(500),
    `complement` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE `service_provider` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
CREATE TABLE `customer` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
CREATE TABLE `category` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(255) NOT NULL UNIQUE
);
INSERT INTO `category` (`category_name`)
VALUES ('Eletricista'),
    ('Pintor'),
    ('Faxineiro'),
    ('Chaveiro'),
    ('Pedreiro'),
    ('Fotógrafo');
CREATE TABLE `has_category` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_provider_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    FOREIGN KEY (`service_provider_id`) REFERENCES `service_provider`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`)
);
CREATE TABLE `scheduling` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_provider_id` INT NOT NULL,
    `customer_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `title` VARCHAR(30) NOT NULL,
    `whatsapp_link` VARCHAR(20) NOT NULL, -- wa.me/+5551999999999
    `service_description` VARCHAR(255) NOT NULL,
    `status` ENUM(
        'Agendado',
        'Em andamento',
        'Concluído',
        'Cancelado'
    ) NOT NULL,
    FOREIGN KEY (`service_provider_id`) REFERENCES `service_provider`(`id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`)
);

-- cria a tabela `services`, que armazena os serviços adicionados pelos clientes.
-- são necessárias essas colunas para obtenção dos dados
CREATE TABLE `services` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `provider_name` VARCHAR(255) NOT NULL,
    `service_date` DATE NOT NULL,
    `status` VARCHAR(9) NOT NULL DEFAULT 'Em busca', -- Verificar se é necessário
    `provider_category` VARCHAR(255) NOT NULL,
    `whatsapp_link` VARCHAR(20) NOT NULL, -- wa.me/+5551999999999
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`)
);
-- a tabela `services` é criada para armazenar propostas de serviços adicionadas pelos clientes.
-- dessa forma, os prestadores de serviços podem visualizar essas propostas e escolher quais serviços desejam atender.


-- Índices para melhorar performance em consultas
/* CREATE INDEX idx_service_provider_id ON `scheduling`(`service_provider_id`);
 CREATE INDEX idx_customer_id ON `scheduling`(`customer_id`);
 CREATE INDEX idx_category_id ON `has_category`(`category_id`);
 CREATE INDEX idx_user_id_service_provider ON `service_provider`(`user_id`);
 CREATE INDEX idx_user_id_customer ON `customer`(`user_id`); */