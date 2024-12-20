require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
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

// Register route
app.post('/register', async (req, res) => {
    const { email, password, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path, userType } = req.body;

    // Validate userType
    if (userType !== 'service_provider' && userType !== 'customer') {
        return res.status(400).send('Invalid userType. Must be "service_provider" or "customer".');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            `INSERT INTO users (email, password, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path],
            (err, result) => {
                if (err) throw err;

                const userId = result.insertId;
                const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

                db.query(
                    `INSERT INTO ${tableName} (user_id) VALUES (?)`,
                    [userId],
                    (err) => {
                        if (err) throw err;
                        res.send('User registered successfully!');
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

// Login route
app.post('/login', (req, res) => {
    const { email, password, userType } = req.body;
    const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

    db.query(`SELECT * FROM users WHERE email = ?`, [email], async (err, result) => {
        if (err) throw err;

        if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
            return res.status(400).send('Invalid email or password');
        }

        const userId = result[0].id;
        req.session.user = { id: userId, email: email, userType };

        db.query(`SELECT * FROM ${tableName} WHERE user_id = ?`, [userId], (err, result) => {
            if (err) throw err;

            if (result.length === 0) {
                return res.status(400).send('User not registered as ' + userType);
            }

            res.send('Logged in successfully!');
        });
    });
});

// Middleware for session authentication
const authenticateSession = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    next();
};

// Get user details
app.get('/user', authenticateSession, (req, res) => {
    const { id } = req.session.user;

    db.query(`SELECT * FROM users WHERE id = ?`, [id], (err, result) => {
        if (err) throw err;

        if (result.length === 0) {
            return res.status(404).send('User not found');
        }
        res.json(result[0]);
    });
});

// Update user details
app.put('/user', authenticateSession, async (req, res) => {
    const { newEmail, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { id } = req.session.user;

    db.query(`UPDATE users SET email = ?, password = ? WHERE id = ?`, [newEmail, hashedPassword, id], (err, result) => {
        if (err) throw err;

        if (result.affectedRows === 0) {
            return res.status(404).send('User not found');
        }

        req.session.user.email = newEmail;
        res.send('User updated successfully');
    });
});

// Delete user
app.delete('/user', authenticateSession, (req, res) => {
    const { id, userType } = req.session.user;
    const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

    db.query(`DELETE FROM ${tableName} WHERE user_id = ?`, [id], (err, result) => {
        if (err) throw err;

        if (result.affectedRows === 0) {
            return res.status(404).send('User not found');
        }

        db.query(`DELETE FROM users WHERE id = ?`, [id], (err, result) => {
            if (err) throw err;

            req.session.destroy((err) => {
                if (err) throw err;
                res.send('User deleted and session destroyed');
            });
        });
    });
});

// Logout route
app.post('/logout', authenticateSession, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.send('Logged out successfully');
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
