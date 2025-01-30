const bcrypt = require('bcryptjs');
const db = require('../connection/db-connection');
const Joi = require('joi');

// Validação dos dados de entrada para o registro
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    cep: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    neighborhood: Joi.string().required(),
    street_address: Joi.string().required(),
    complement: Joi.string().allow(''),
    avatar_path: Joi.string().allow(''),
    userType: Joi.string().valid('service_provider', 'customer').required(),
    categories: Joi.array() // MELHORIA - fazer um if, ou algo assim para aplicar o .required() apenas para o service_provider
});

async function register(req, res) {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { email, password, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path, userType, categories } = req.body;

    console.log(`Categorias -- ${categories}`)

    try {
        db.query(`SELECT * FROM user WHERE email = ?`, [email], async (err, result) => {
            if (err) return res.status(500).send('Database error SELECT user');

            if (result.length > 0) {
                return res.status(400).send('This user is already registered');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                `INSERT INTO user (email, password, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path],
                (err, result) => {
                    if (err) return res.status(500).send('Database error INSERT user 1');

                    const userId = result.insertId;
                    const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

                    db.query(
                        `INSERT INTO ${tableName} (user_id) VALUES (?)`,
                        [userId],
                        (err) => {
                            if (err) return res.status(500).send('Database error INSERT user 2');
                            res.send('User registered successfully!');
                        }
                    );

                    // categories.forEach(category => {

                    //     console.log('TESTE AQUI BIZARRO!')

                    //     db.query('SELECT id FROM category WHERE category_name = ?', [category], async (err, result) => {
                    //         if (err) return res.status(500).send('Database error');

                    //         db.query(
                    //             'INSERT INTO has_category (service_provider_id, category_id) VALUES (?, ?)', [userId, result],
                    //             (err) => {
                    //                 if (err) return res.status(500).send('Database error');
                    //                 res.send('Category has been added to service provider')
                    //             }
                    //         )

                    //     })
                    // });

                }
            );
        });
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }
}

async function login(req, res) {
    const { email, password, userType } = req.body;

    if (req.session.user) {
        return res.status(400).send('You are already logged in');
    }

    const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

    try {
        db.query(`SELECT * FROM user WHERE email = ?`, [email], async (err, result) => {
            if (err) return res.status(500).send('Database error');

            if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
                return res.status(400).send('Invalid email or password');
            }

            const userId = result[0].id;

            db.query(`SELECT * FROM ${tableName} WHERE user_id = ?`, [userId], (err, userTypeResult) => {
                if (err) return res.status(500).send('Database error');

                if (userTypeResult.length === 0) {
                    return res.status(400).send('User not registered as ' + userType);
                }

                req.session.user = { id: userId, email: email, userType };
                req.session.save((err) => {
                    if (err) return res.status(500).send('Failed to save session');
                    res.status(200).send('Logged in successfully!');
                });
            });
        });
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }
}

async function logout(req, res) {
    if (!req.session.user) {
        return res.status(401).send('You are not logged in');
    }

    req.session.destroy((err) => {
        if (err) return res.status(500).send('Failed to log out');
        res.send('Logged out successfully');
    });
}

const getSession = (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'No active session' });
    }
};

module.exports = { register, login, logout, getSession };
