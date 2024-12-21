require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const authRoutes = require('./client/src/routes/auth-routes');
const userRoutes = require('./client/src/routes/user-routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
}));

const db = mysql.createConnection({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'prestaqui'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the MySQL database!');
});

app.use('api/auth/', authRoutes); // localhost:3000/api/auth/register or /login
app.use('api/user/', userRoutes); // localhost:3000/api/user/getUser or updateUser or deleteUser

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

