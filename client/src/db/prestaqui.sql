CREATE DATABASE `prestaqui`;
USE `prestaqui`;
-- Creating the `user` table
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
-- Creating the `category` table
CREATE TABLE `category` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(255) NOT NULL UNIQUE
);
-- Inserting categories into the `category` table
INSERT INTO `category` (`category_name`)
VALUES ('Eletricista'),
    ('Pintor'),
    ('Faxineiro'),
    ('Chaveiro'),
    ('Pedreiro'),
    ('Fotógrafo');
-- Creating the `service_provider` table first
CREATE TABLE `service_provider` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
-- Creating the `has_category` table after `service_provider`
CREATE TABLE `has_category` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_provider_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    FOREIGN KEY (`service_provider_id`) REFERENCES `service_provider`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`)
);
-- Creating the `customer` table
CREATE TABLE `customer` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
);
-- Creating the `solicitation` table
CREATE TABLE `solicitation` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `service_provider_id` INT DEFAULT -1,
    `customer_id` INT NOT NULL,
    `service_date` DATE NOT NULL,
    `category_id` INT NOT NULL,
    `title` VARCHAR(30) NOT NULL,
    `service_description` VARCHAR(255) NOT NULL,
    `appointment_status` BOOLEAN NOT NULL DEFAULT FALSE,
    `status` ENUM(
        'Em busca',
        'Agendado',
        'Em andamento',
        'Concluído',
        'Cancelado'
    ) NOT NULL DEFAULT 'Em busca',
    `day_shift` ENUM('Manhã', 'Tarde', 'Noite') NOT NULL,
    FOREIGN KEY (`service_provider_id`) REFERENCES `service_provider`(`id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`)
);