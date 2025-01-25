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
    `provider_name` VARCHAR(255) NOT NULL,
    `provider_number` VARCHAR(20) NOT NULL, -- Número do prestador de serviço ex. wa.me/+5551999999999
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
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- N
    `service_provider_id` INT DEFAULT -1, -- P
    `customer_id` INT NOT NULL, -- C
    `service_date` DATE NOT NULL, -- C
    `category_id` INT NOT NULL, -- C
    `title` VARCHAR(30) NOT NULL, -- C
    `service_description` VARCHAR(255) NOT NULL, -- C
    `appointment_status` BOOLEAN NOT NULL DEFAULT FALSE, -- N
    `status` ENUM(
        'Agendado',
        'Em andamento',
        'Concluído',
        'Cancelado',
        'Em busca'
    ) NOT NULL DEFAULT 'Em busca', -- N
    FOREIGN KEY (`service_provider_id`) REFERENCES `service_provider`(`id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`)
);