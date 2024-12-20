CREATE DATABASE `prestaqui`;
USE `prestaqui`;
CREATE TABLE `users` (
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
    `avatar_path` VARCHAR(500)
);
CREATE TABLE `service_provider` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
CREATE TABLE `customer` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
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
    `service_description` VARCHAR(255) NOT NULL,
    `date_time` DATETIME NOT NULL,
    `start_time` TIME NOT NULL,
    `ending_time` TIME NOT NULL,
    `day_shift` ENUM('Manhã', 'Tarde', 'Noite') NOT NULL,
    `status` ENUM(
        'Em andamento',
        'Aguardando validação',
        'Concluído',
        'Cancelado'
    ) NOT NULL,
    FOREIGN KEY (`service_provider_id`) REFERENCES `service_provider`(`id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`)
);
-- Índices para melhorar performance em consultas
CREATE INDEX idx_service_provider_id ON `scheduling`(`service_provider_id`);
CREATE INDEX idx_customer_id ON `scheduling`(`customer_id`);
CREATE INDEX idx_category_id ON `has_category`(`category_id`);
CREATE INDEX idx_user_id_service_provider ON `service_provider`(`user_id`);
CREATE INDEX idx_user_id_customer ON `customer`(`user_id`);