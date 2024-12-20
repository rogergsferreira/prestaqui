CREATE DATABASE prestaqui;
USE prestaqui;
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_phone VARCHAR(14) NOT NULL,
    user_cep VARCHAR(9) NOT NULL,
    user_state VARCHAR(50) NOT NULL,
    user_city VARCHAR(100) NOT NULL,
    user_neighborhood VARCHAR(100) NOT NULL,
    user_street_address VARCHAR(255) NOT NULL,
    user_avatar_path VARCHAR(500)
);
CREATE TABLE service_provider (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user(id)
);
CREATE TABLE customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user(id)
);
CREATE TABLE category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name ENUM(
        'Eletricista',
        'Pintor',
        'Faxineiro',
        'Chaveiro',
        'Pedreiro',
        'Fotógrafo'
    ) NOT NULL
);
CREATE TABLE has_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_provider_id INT NOT NULL REFERENCES service_provider(id),
    category_id INT NOT NULL REFERENCES category(id)
);
CREATE TABLE scheduling (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_provider_id INT NOT NULL REFERENCES service_provider(id),
    customer_id INT NOT NULL REFERENCES customer(id),
    category_id INT NOT NULL REFERENCES category(id),
    title VARCHAR(30) NOT NULL,
    service_description VARCHAR(255) NOT NULL,
    date_time DATETIME NOT NULL,
    start_time TIME NOT NULL,
    ending_time TIME NOT NULL,
    day_shift ENUM('Manhã', 'Tarde', 'Noite') NOT NULL,
    status_ ENUM(
        'Em andamento',
        'Aguardando validação',
        'Concluído',
        'Cancelado'
    ) NOT NULL
);