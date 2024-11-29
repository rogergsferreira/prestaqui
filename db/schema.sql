CREATE DATABASE PrestAquiDB;
USE PrestAquiDB;
CREATE TABLE Customer (
    id INT PRIMARY KEY,
    name_ VARCHAR(255) NOT NULL,
    phone VARCHAR(14) NOT NULL,
    cep VARCHAR(8) NOT NULL,
    state_ VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address_ VARCHAR(100) NOT NULL,
    neighbornhood VARCHAR(100) NOT NULL,
    avatar_path BLOB,
    description_ TEXT
);
CREATE TABLE ServiceProvider (
    id INT PRIMARY KEY,
    name_ VARCHAR(255) NOT NULL,
    phone VARCHAR(14) NOT NULL,
    cep VARCHAR(8) NOT NULL,
    state_ VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address_ VARCHAR(100) NOT NULL,
    neighbornhood VARCHAR(100) NOT NULL,
    profile_ VARCHAR(255) NOT NULL,
    description_ TEXT
);
CREATE TABLE Categories (
    id INT PRIMARY KEY,
    name_ ENUM(
        'Eletricista',
        'Pintor',
        'Faxineiro',
        'Chaveiro',
        'Maquiador',
        'Fotógrafo'
    ) NOT NULL
);
CREATE TABLE ProviderCategory (
    id INT PRIMARY KEY,
    category_id INT NOT NULL,
    service_provider_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES Categories(id),
    FOREIGN KEY (service_provider_id) REFERENCES ServiceProvider(id)
);
CREATE TABLE Availability (
    id INT PRIMARY KEY,
    service_provider_id INT NOT NULL,
    start_time TIME NOT NULL,
    ending_time TIME NOT NULL,
    shift_code ENUM('1', '2', '3') NOT NULL,
    duration INT NOT NULL,
    intervale INT NOT NULL,
    FOREIGN KEY (service_provider_id) REFERENCES ServiceProvider(id)
);
CREATE TABLE Scheduling (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    service_provider_id INT NOT NULL,
    category_id INT NOT NULL,
    availability_id INT NOT NULL,
    dt DATETIME NOT NULL,
    status_ ENUM(
        'Pendente',
        'Concluído',
        'Cancelado',
        'Aguardando validaçao'
    ) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES Customer(id),
    FOREIGN KEY (service_provider_id) REFERENCES ServiceProvider(id),
    FOREIGN KEY (category_id) REFERENCES Categories(id),
    FOREIGN KEY (availability_id) REFERENCES Availability(id)
);