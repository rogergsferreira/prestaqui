const mysql = require('mysql2');

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


module.exports = db;