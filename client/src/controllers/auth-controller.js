const db = require('../db/db-connection');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

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
    categories: Joi.alternatives()
        .conditional('userType', {
            is: 'service_provider',
            then: Joi.array().min(1).required(),
            otherwise: Joi.forbidden()
        })
});

// Função para inserir categorias para o prestador de serviço
async function insertCategories(userId, categories, res) {
    const getServiceProviderIdQuery = `SELECT id FROM service_provider WHERE user_id = ?`;
    db.query(getServiceProviderIdQuery, [userId], (err, spResult) => {
        if (err) return res.status(500).send('Erro ao obter o ID do prestador de serviço');
        if (!spResult.length) return res.status(400).send('Prestador de serviço não encontrado');

        const serviceProviderId = spResult[0].id;
        const categoryPromises = categories.map(categoryName => {
            return new Promise((resolve, reject) => {
                const getCategoryIdQuery = `SELECT id FROM category WHERE category_name = ?`;
                db.query(getCategoryIdQuery, [categoryName], (err, categoryResult) => {
                    if (err || categoryResult.length === 0) {
                        return reject(`Categoria não encontrada: ${categoryName}`);
                    }
                    resolve([serviceProviderId, categoryResult[0].id]);
                });
            });
        });

        Promise.all(categoryPromises)
            .then(categoryValues => {
                const insertHasCategoryQuery = `INSERT INTO has_category (service_provider_id, category_id) VALUES ?`;
                db.query(insertHasCategoryQuery, [categoryValues], (err) => {
                    if (err) return res.status(500).send('Erro ao inserir categorias');
                    res.send('Usuário registrado com sucesso!');
                });
            })
            .catch(error => res.status(400).send(error));
    });
}

// Função de registro de usuário
async function register(req, res) {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const {
        email,
        password,
        name,
        phone,
        cep,
        state,
        city,
        neighborhood,
        street_address,
        complement,
        avatar_path,
        userType,
        categories
    } = req.body;

    try {
        db.query(`SELECT * FROM user WHERE email = ?`, [email], async (err, result) => {
            if (err) return res.status(500).send('Erro no banco de dados');
            if (result.length > 0) return res.status(400).send('Este usuário já está registrado');

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                `INSERT INTO user (email, password, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path],
                (err, result) => {
                    if (err) return res.status(500).send('Erro ao registrar o usuário');

                    const userId = result.insertId;
                    const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

                    db.query(`INSERT INTO ${tableName} (user_id) VALUES (?)`, [userId], (err) => {
                        if (err) return res.status(500).send('Erro ao registrar o tipo de usuário');

                        if (userType === 'service_provider' && categories.length > 0) {
                            insertCategories(userId, categories, res);
                        } else {
                            res.send('Usuário registrado com sucesso!');
                        }
                    });
                }
            );
        });
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }
}

// Função de login
async function login(req, res) {
    const { email, password, userType } = req.body;
    const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

    try {
        db.query(`SELECT * FROM user WHERE email = ?`, [email], async (err, result) => {
            if (err) return res.status(500).send('Erro no banco de dados');
            if (result.length === 0 || !(await bcrypt.compare(password, result[0].password))) {
                return res.status(400).send('Email ou senha inválidos');
            }

            const userId = result[0].id;
            db.query(`SELECT * FROM ${tableName} WHERE user_id = ?`, [userId], (err, userTypeResult) => {
                if (err) return res.status(500).send('Erro no banco de dados');
                if (userTypeResult.length === 0) return res.status(400).send('Usuário não registrado como ' + userType);

                res.status(200).json({ message: 'Login realizado com sucesso!', userId });
            });
        });
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }
}

module.exports = { register, login, insertCategories };
