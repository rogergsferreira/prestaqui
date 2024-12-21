async function register(req, res) {
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
}

async function login(req, res) {
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
};

async function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.send('Logged out successfully');
    });
}

module.exports = { register, login, logout };
