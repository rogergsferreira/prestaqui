require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./client/src/routes/auth-routes');
const userRoutes = require('./client/src/routes/user-routes');
const servicesRoutes = require('./client/src/routes/services-routes');
const authenticateSession = require('./client/src/middleware/auth-middleware');

const app = express();

// Configuração do middleware CORS
app.use(cors({
    origin: process.env.CLIENT_URL, // URL do cliente permitida
    credentials: true, // Permitir cookies de sessão
}));

// Configuração do middleware para análise do corpo da requisição
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração do middleware de sessão
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false, // Evita salvar sessões não modificadas
    cookie: {
        maxAge: 1800000, // Tempo de expiração da sessão (30 minutos)
        httpOnly: true, // Torna o cookie inacessível via JavaScript do cliente
        secure: process.env.NODE_ENV === 'production', // Apenas HTTPS em produção
    },
}));

// Rotas protegidas e públicas
app.use('/api/auth/', authRoutes); // Rotas de autenticação
app.use('/api/user/', authenticateSession, userRoutes); // Rotas de usuários autenticados
app.use('/api/services/', authenticateSession, servicesRoutes); // Rotas de serviços autenticados

// Endpoint básico para verificar o status do servidor
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
