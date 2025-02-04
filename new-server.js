require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const db = require('./client/src/connection/db-connection');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const util = require('util');
const router = require('express').Router();

// generate-secret-key.js
const secretKey = crypto.randomBytes(8).toString('hex');

// Adiciona ou atualiza a chave no arquivo .env
const envFilePath = './.env';
const envContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf-8') : '';
const updatedContent = envContent.includes('SECRET_KEY=')
    ? envContent.replace(/SECRET_KEY=.*/, `SECRET_KEY=${secretKey}`)
    : `${envContent}\nSECRET_KEY=${secretKey}`.trim();

fs.writeFileSync(envFilePath, updatedContent, 'utf-8');
console.log('Generated SECRET_KEY:', secretKey);


// server.js
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


// auth-middleware.js
const authenticateSession = (req, res, next) => {
    /* Os dados da sessão estão sempre sendo desfeitos por um erro desconhecido. 
     Sendo assim, por questões para o desenvolvimento do projeto, aqui estará definido 
     para retornar sempre o score 200 */

    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    const userId = req.session.user.id;

    db.query('SELECT * FROM user WHERE id = ?', [userId], (err, result) => {
        if (err || result.length === 0) {
            req.session.destroy((error) => {
                if (error) console.error('Error destroying session:', error);
                return res.status(401).send('Session invalid, please log in again');
            });
        } else {
            next();
        }
    });
};


// auth-controller.js
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    cep: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().required(),
    neighborhood: Joi.string().required(),
    streetAddress: Joi.string().required(),
    complement: Joi.string().allow(''),
    avatarPath: Joi.string().allow(''),
    userType: Joi.string().valid('service_provider', 'customer').required(),
    categories: Joi.alternatives()
        .conditional('userType', {
            is: 'service_provider',
            then: Joi.array().min(1).required(),
            otherwise: Joi.forbidden()
        })
});

function insertCategories(userId, categories, res) {
    const getServiceProviderIdQuery = `SELECT id FROM service_provider WHERE user_id = ?`; // get service_provider ID
    db.query(getServiceProviderIdQuery, [userId], (err, spResult) => {
        if (err) return res.status(500).send('Erro ao obter o ID do prestador de serviço');

        const serviceProviderId = spResult[0].id;
        const categoryValues = [];
        let errorOccurred = false;

        categories.forEach((categoryName, index) => {
            const getCategoryIdQuery = `SELECT id FROM category WHERE category_name = ?`;
            db.query(getCategoryIdQuery, [categoryName], (err, categoryResult) => {
                if (err || categoryResult.length === 0) {
                    errorOccurred = true;
                    return res.status(400).send(`Categoria não encontrada: ${categoryName}`);
                }

                const categoryId = categoryResult[0].id;
                categoryValues.push([serviceProviderId, categoryId]);

                if (categoryValues.length === categories.length && !errorOccurred) {
                    const insertHasCategoryQuery = `INSERT INTO has_category (service_provider_id, category_id) VALUES ?`;
                    db.query(insertHasCategoryQuery, [categoryValues], (err) => {
                        if (err) return res.status(500).send('Erro ao inserir categorias');
                        res.send('Usuário registrado com sucesso!');
                    });
                }
            });
        });
    });
}

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
        streetAddress,
        complement,
        avatarPath,
        userType,
        categories
    } = req.body;

    try {
        db.query(`SELECT * FROM user WHERE email = ?`, [email], async (err, result) => {
            if (err) return res.status(500).send('Erro no banco de dados');

            if (result.length > 0) {
                return res.status(400).send('Este usuário já está registrado');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                `INSERT INTO user (email, password, name, phone, cep, state, city, neighborhood, street_address, complement, avatar_path)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [email, hashedPassword, name, phone, cep, state, city, neighborhood, streetAddress, complement, avatarPath],
                (err, result) => {
                    if (err) return res.status(500).send('Erro ao registrar o usuário');

                    const userId = result.insertId;
                    const tableName = userType === 'service_provider' ? 'service_provider' : 'customer';

                    db.query(
                        `INSERT INTO ${tableName} (user_id) VALUES (?)`,
                        [userId],
                        (err) => {
                            if (err) return res.status(500).send('Erro ao registrar o tipo de usuário');

                            if (userType === 'service_provider' && categories && categories.length > 0) {
                                // Inserir categorias na tabela has_category
                                insertCategories(userId, categories, res);
                            } else {
                                res.send('Usuário registrado com sucesso!');
                            }
                        }
                    );
                }
            );
        });
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }
};

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
                    res.status(200).json(req.session.user); // res.status(200).send('Logged in successfully!');
                });
            });

            // req.session.user = { id: userId, email: email, userType: userType };

        });
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }

    req.session.save((err) => {
        if (err) return res.status(500).send('Failed to save session');
        res.status(200).send('Logged in successfully!');
    });

};

async function logout(req, res) {

    req.session.destroy((err) => {
        if (err) return res.status(500).send('Failed to log out');
        res.send('Logged out successfully');
    });
};

const getSession = (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'No active session' });
    }
};


// user-controller.js
const queryAsync = util.promisify(db.query).bind(db);
// facilita muito o uso de Promises com funções de callback no Node.js

async function getUserCategories(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send('User ID is required');
    }

    try {
        const spResult = await queryAsync(`SELECT id FROM service_provider WHERE user_id = ?`, [id]);
        if (spResult.length === 0) {
            return res.status(400).send('User is not a service provider');
        }
        const serviceProviderId = spResult[0].id;

        const categoriesResult = await queryAsync(`
            SELECT c.category_name
            FROM has_category hc
            JOIN category c ON hc.category_id = c.id
            WHERE hc.service_provider_id = ?
        `, [serviceProviderId]);

        const categories = categoriesResult.map(row => row.category_name);
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching user categories:', error);
        res.status(500).send('Internal server error');
    }
}

// Obtém todos os usuários
async function getUsers(req, res) {
    db.query(`SELECT * FROM user`, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.length === 0) {
            return res.status(404).send('No users found');
        }

        res.json(result);
    });
}

// Obtém um usuário específico por ID
async function getUserById(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send('User ID is required');
    }

    db.query(`SELECT * FROM user WHERE id = ?`, [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.length === 0) {
            return res.status(404).send('User not found');
        }

        res.json(result[0]);
    });
}

// Atualiza os dados de um usuário
async function updateUser(req, res) {
    const { id } = req.params;
    const {
        newEmail,
        newPassword,
        newName,
        newPhone,
        newCep,
        newState,
        newCity,
        newNeighborhood,
        newStreetAddress,
        newAvatarPath,
        newComplement,
        categories
    } = req.body;

    if (!id) {
        return res.status(400).send('User ID is required');
    }

    const updates = [];
    const values = [];

    if (newEmail) updates.push('email = ?'), values.push(newEmail);
    if (newPassword) updates.push('password = ?'), values.push(await bcrypt.hash(newPassword, 10));
    if (newName) updates.push('name = ?'), values.push(newName);
    if (newPhone) updates.push('phone = ?'), values.push(newPhone);
    if (newCep) updates.push('cep = ?'), values.push(newCep);
    if (newState) updates.push('state = ?'), values.push(newState);
    if (newCity) updates.push('city = ?'), values.push(newCity);
    if (newNeighborhood) updates.push('neighborhood = ?'), values.push(newNeighborhood);
    if (newStreetAddress) updates.push('street_address = ?'), values.push(newStreetAddress);
    if (newAvatarPath) updates.push('avatar_path = ?'), values.push(newAvatarPath);
    if (newComplement) updates.push('complement = ?'), values.push(newComplement);

    values.push(id);

    db.beginTransaction(async (transactionError) => {
        if (transactionError) {
            console.error('Transaction error:', transactionError);
            return res.status(500).send('Failed to start transaction');
        }

        try {
            if (updates.length > 0) {
                const updateQuery = `UPDATE user SET ${updates.join(', ')} WHERE id = ?`;
                await queryAsync(updateQuery, values);
            }

            if (categories) {
                const spResult = await queryAsync(`SELECT id FROM service_provider WHERE user_id = ?`, [id]);
                if (spResult.length === 0) {
                    throw new Error('User is not a service provider');
                }
                const serviceProviderId = spResult[0].id;

                await queryAsync(`DELETE FROM has_category WHERE service_provider_id = ?`, [serviceProviderId]);

                const categoryValues = [];
                for (const categoryName of categories) {
                    const categoryResult = await queryAsync(`SELECT id FROM category WHERE category_name = ?`, [categoryName]);
                    if (categoryResult.length === 0) {
                        throw new Error(`Categoria não encontrada: ${categoryName}`);
                    }

                    const categoryId = categoryResult[0].id;
                    categoryValues.push([serviceProviderId, categoryId]);
                }

                if (categoryValues.length > 0) {
                    await queryAsync(`INSERT INTO has_category (service_provider_id, category_id) VALUES ?`, [categoryValues]);
                }
            }

            db.commit((commitError) => {
                if (commitError) {
                    db.rollback(() => {
                        res.status(500).send('Failed to commit transaction');
                    });
                } else {
                    res.send('User updated successfully');
                }
            });
        } catch (error) {
            db.rollback(() => {
                console.error('Error updating user:', error);
                res.status(500).send(error.message);
            });
        }
    });
}

// Exclui um usuário e suas dependências
async function deleteUser(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send('User ID is required');
    }

    db.beginTransaction((transactionError) => {
        if (transactionError) {
            console.error('Transaction error:', transactionError);
            return res.status(500).send('Failed to start transaction');
        }

        const handleError = (error, message) => {
            console.error(message, error);
            return db.rollback(() => res.status(500).send(message));
        };

        // verificar se há agendamentos não concluídos ou não cancelados
        const checkSchedulingQuery = `
            SELECT * FROM solicitation
            WHERE (service_provider_id IN (SELECT id FROM service_provider WHERE user_id = ?)
            OR customer_id IN (SELECT id FROM customer WHERE user_id = ?))
            AND status NOT IN ('Concluído', 'Cancelado')`;

        db.query(checkSchedulingQuery, [id, id], (err, results) => {
            if (err) return handleError(err, 'Failed to check solicitation');

            if (results.length > 0) {
                // existem agendamentos ativos, cancelar exclusão
                return db.rollback(() => res.status(400).send('User still has active services'));
            }

            // exclusão em cascata
            try {
                // excluir registros de 'has_category' relacionados ao 'service_provider' do usuário
                const deleteHasCategoryQuery = `
                    DELETE hc FROM has_category hc
                    JOIN service_provider sp ON hc.service_provider_id = sp.id
                    WHERE sp.user_id = ?`;
                db.query(deleteHasCategoryQuery, [id], (err) => {
                    if (err) return handleError(err, 'Failed to delete from has_category');

                    // excluir registros de 'solicitation' onde o usuário é um 'service_provider' ou 'customer'
                    const deleteSchedulingQuery = `
                        DELETE FROM solicitation
                        WHERE service_provider_id IN (SELECT id FROM service_provider WHERE user_id = ?)
                        OR customer_id IN (SELECT id FROM customer WHERE user_id = ?)`;
                    db.query(deleteSchedulingQuery, [id, id], (err) => {
                        if (err) return handleError(err, 'Failed to delete from solicitation');

                        // excluir 'service_provider' associado ao usuário
                        const deleteServiceProviderQuery = `DELETE FROM service_provider WHERE user_id = ?`;
                        db.query(deleteServiceProviderQuery, [id], (err) => {
                            if (err) return handleError(err, 'Failed to delete from service_provider');

                            // excluir 'customer' associado ao usuário
                            const deleteCustomerQuery = `DELETE FROM customer WHERE user_id = ?`;
                            db.query(deleteCustomerQuery, [id], (err) => {
                                if (err) return handleError(err, 'Failed to delete from customer');

                                // excluir o usuário da tabela 'user'
                                const deleteUserQuery = `DELETE FROM user WHERE id = ?`;
                                db.query(deleteUserQuery, [id], (err, result) => {
                                    if (err || result.affectedRows === 0) {
                                        return db.rollback(() =>
                                            res.status(err ? 500 : 404).send(err ? 'Failed to delete user' : 'User not found')
                                        );
                                    }

                                    // afirmação do commit
                                    db.commit((commitError) => {
                                        if (commitError) {
                                            return db.rollback(() => res.status(500).send('Failed to commit transaction'));
                                        }

                                        // destroí a sessão se o usuário excluído for o usuário logado
                                        if (req.session.user && req.session.user.id === parseInt(id)) {
                                            req.session.destroy(() => res.send('User deleted and session destroyed'));
                                        } else {
                                            res.send('User deleted successfully');
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            } catch (error) {
                return handleError(error, 'Error during deletion process');
            }
        });
    });
}


const addSecondProfile = async (req, res) => {
    const { userId, userType } = req.body;
    const newUserType = userType === 'customer' ? 'service_provider' : 'customer';

    try {
        const existingProfileQuery = `SELECT * FROM ${newUserType} WHERE user_id = ?`;
        db.query(existingProfileQuery, [userId], (err, result) => {
            if (err) throw err;

            if (result.length === 0) {
                const insertQuery = `INSERT INTO ${newUserType} (user_id) VALUES (?)`;
                db.query(insertQuery, [userId], (err) => {
                    if (err) throw err;

                    res.status(200).send({ message: 'Second profile created successfully' });
                });
            } else {
                res.status(400).send({ message: 'User already has this profile type' });
            }
        });
    } catch (error) {
        console.error('Error creating second profile:', error);
        res.status(500).send('Internal server error');
    }
};

const getProfileType = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).send('User ID is required');
    }

    try {
        // verificar se é customer
        const customerQuery = 'SELECT * FROM customer WHERE user_id = ?';
        db.query(customerQuery, [userId], (err, customerResult) => {
            if (err) throw err;

            // verificar se é service_provider
            const providerQuery = 'SELECT * FROM service_provider WHERE user_id = ?';
            db.query(providerQuery, [userId], (providerErr, providerResult) => {
                if (providerErr) throw providerErr;

                if (customerResult.length > 0 && providerResult.length > 0) {
                    res.send('customer_service_provider');
                } else if (customerResult.length > 0) {
                    res.send('customer');
                } else if (providerResult.length > 0) {
                    res.send('service_provider');
                } else {
                    res.status(404).send('User type not found');
                }
            });
        });
    } catch (error) {
        console.error('Error checking profile type:', error);
        res.status(500).send('Internal server error');
    }
};

async function addCategories(req, res) {
    const { userId, categories } = req.body;

    if (!userId || !categories || !Array.isArray(categories) || categories.length === 0) {
        return res.status(400).send({ success: false, message: 'Dados inválidos' });
    }

    try {
        // get ID do prestador de serviço
        const getServiceProviderIdQuery = `SELECT id FROM service_provider WHERE user_id = ?`;
        db.query(getServiceProviderIdQuery, [userId], (err, spResult) => {
            if (err) {
                console.error('Erro ao obter ID do prestador de serviço:', err);
                return res.status(500).send({ success: false, message: 'Erro no servidor' });
            }

            if (spResult.length === 0) {
                return res.status(400).send({ success: false, message: 'Prestador de serviço não encontrado' });
            }

            const serviceProviderId = spResult[0].id;
            const categoryValues = [];
            let errorOccurred = false;
            let pendingQueries = categories.length;

            categories.forEach((categoryName) => {
                // get ID da categoria
                const getCategoryIdQuery = `SELECT id FROM category WHERE category_name = ?`;
                db.query(getCategoryIdQuery, [categoryName], (err, categoryResult) => {
                    if (err || categoryResult.length === 0) {
                        errorOccurred = true;
                        console.error(`Categoria não encontrada ou erro: ${categoryName}`, err);
                        return res.status(400).send({ success: false, message: `Categoria não encontrada: ${categoryName}` });
                    }

                    const categoryId = categoryResult[0].id;
                    categoryValues.push([serviceProviderId, categoryId]);

                    pendingQueries -= 1;

                    if (pendingQueries === 0 && !errorOccurred) {
                        const insertHasCategoryQuery = `INSERT INTO has_category (service_provider_id, category_id) VALUES ?`;
                        db.query(insertHasCategoryQuery, [categoryValues], (err) => {
                            if (err) {
                                console.error('Erro ao inserir categorias:', err);
                                return res.status(500).send({ success: false, message: 'Erro ao inserir categorias' });
                            }
                            return res.status(200).send({ success: true, message: 'Categorias registradas com sucesso' });
                        });
                    }
                });
            });
        });

    } catch (error) {
        console.error('Erro ao registrar categorias:', error);
        return res.status(500).send({ success: false, message: 'Erro no servidor' });
    }
}


// services-controller.js
// obtém todos os serviços de um cliente específico
async function getServicesByCustomerId(req, res) {
    const { customer_id } = req.params;

    if (!customer_id) {
        return res.status(400).send('Customer ID is required');
    }

    db.query('SELECT * FROM services WHERE customer_id = ?', [customer_id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.length === 0) {
            return res.status(404).send('No services found for this customer');
        }

        res.json(result);
    });
}

// Exclui um serviço específico
async function deleteServiceById(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send('Service ID is required');
    }

    db.query('DELETE FROM services WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Service not found');
        }

        res.send('Service deleted successfully');
    });
}

// auth-routes.js
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/get-session', authController.getSession);


// services-routes.js
router.get('/get-services/:customer_id', servicesController.getServicesByCustomerId);
router.delete('/delete-service/:id', servicesController.deleteServiceById);

// user-routes.js
router.get('/get-users', userController.getUsers);
router.get('/get-user/:id', userController.getUserById);
router.put('/update-user/:id', userController.updateUser);
router.delete('/delete-user/:id', userController.deleteUser);
router.post('/add-second-profile', userController.addSecondProfile);
router.get('/get-profile-type/:userId', userController.getProfileType);
router.post('/add-categories', userController.addCategories);
router.get('/get-categories/:id', userController.getUserCategories);


// server.js
app.use('/api/user/', authenticateSession, userRoutes);
app.use('/api/auth/', authRoutes);
app.use('/api/services/', authenticateSession, servicesRoutes);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
