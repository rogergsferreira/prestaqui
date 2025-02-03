require('dotenv').config();
const express = require('express'); 
const mysql = require('mysql2'); 
const bodyParser = require('body-parser'); 
const cors = require('cors'); 

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the MySQL database!');
});

// Conexão com o banco de dados
db.connect(error => {
    if (error) {
        console.error('Error connecting to the database: ' + error.stack);
        return;
    }
    console.log('Connected to the database with ID ' + db.threadId);
});


// Endpoint para obter todos os usuários (GET)
app.get('/usuarios', (req, res) => {
    connection.query('SELECT * FROM usuarios', (error, results) => {
        if (error) {
            res.status(500).send('Erro ao obter usuários.'); // Responde com um erro se a consulta falhar
            return;
        }
        res.json(results); // Responde com os resultados da consulta em formato JSON
    });
});

// Endpoint para obter um usuário por ID (GET)
app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params; // Obtém o ID do usuário dos parâmetros da URL
    connection.query('SELECT * FROM usuarios WHERE id = ?', [id], (error, results) => {
        if (error) {
            res.status(500).send('Erro ao obter usuário.'); // Responde com um erro se a consulta falhar
            return;
        }
        res.json(results[0]); // Responde com o usuário encontrado em formato JSON
    });
});

// Endpoint para atualizar um usuário (PUT)
app.put('/usuarios/:id', (req, res) => {
    const { id } = req.params; // Obtém o ID do usuário dos parâmetros da URL
    const { nome, email, senha } = req.body; // Obtém os novos dados do usuário do corpo da requisição
    const sql = 'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?'; // SQL para atualizar um usuário
    connection.query(sql, [nome, email, senha, id], (error, results) => {
        if (error) {
            res.status(500).send('Erro ao atualizar usuário.'); // Responde com um erro se a atualização falhar
            return;
        }
        res.send('Usuário atualizado com sucesso.'); // Responde com sucesso se a atualização for bem-sucedida
    });
});

// Endpoint para deletar um usuário (DELETE)
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params; // Obtém o ID do usuário dos parâmetros da URL
    connection.query('DELETE FROM usuarios WHERE id = ?', [id], (error, results) => {
        if (error) {
            res.status(500).send('Erro ao deletar usuário.'); // Responde com um erro se a deleção falhar
            return;
        }
        res.send('Usuário deletado com sucesso.'); // Responde com sucesso se a deleção for bem-sucedida
    });
});

// Iniciar o servidor
const PORT = 3000; // Define a porta em que o servidor será executado
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`); // Confirma que o servidor está rodando
});