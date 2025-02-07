require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const db = require('./client/src/connection/db-connection');

const app = express();

app.use(cors());
app.use(bodyParser.json());


// SECRET_KEY generation:
const secretKey = crypto.randomBytes(8).toString('hex');

const envFilePath = './.env';
const envContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf-8') : '';
const updatedContent = envContent.includes('SECRET_KEY=')
    ? envContent.replace(/SECRET_KEY=.*/, `SECRET_KEY=${secretKey}`)
    : `${envContent}\nSECRET_KEY=${secretKey}`.trim();

fs.writeFileSync(envFilePath, updatedContent, 'utf-8');


// Session creation:
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


// Middleware - Autentication:
const authenticateSession = (req, res, next) => {

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


// Auth controller functions:
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
    const getServiceProviderIdQuery = `SELECT id FROM service_provider WHERE user_id = ?`;
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
                    res.status(200).json(req.session.user);
                });
            });
        });
    } catch (error) {
        res.status(500).send('Internal server error');
        console.error(error);
    }
}


async function logout(req, res) {

    req.session.destroy((err) => {
        if (err) return res.status(500).send('Failed to log out');
        res.send('Logged out successfully');
    });
};





























// ERRO PRINCIPAL!!
async function getSession(req, res) {
    // Verifica se há uma sessão ativa com o usuário logado
    if (req.session && req.session.user) {
        // Se a sessão estiver ativa, retorna os dados do usuário
        res.json({ user: req.session.user });
    } else {
        // Se não houver sessão ativa, retorna erro 401
        res.status(401).json({ message: 'No active session' });
    }
}































// User controller functions:
async function getUserCategories(req, res) {
    const queryAsync = util.promisify(db.query).bind(db);

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
        const checkSchedulingQuery = `
            SELECT * FROM solicitation
            WHERE (service_provider_id IN (SELECT id FROM service_provider WHERE user_id = ?)
            OR customer_id IN (SELECT id FROM customer WHERE user_id = ?))
            AND status NOT IN ('Concluído', 'Cancelado')`;

        db.query(checkSchedulingQuery, [id, id], (err, results) => {
            if (err) return handleError(err, 'Failed to check solicitation');

            if (results.length > 0) {
                return db.rollback(() => res.status(400).send('User still has active services'));
            }
            try {
                const deleteHasCategoryQuery = `
                    DELETE hc FROM has_category hc
                    JOIN service_provider sp ON hc.service_provider_id = sp.id
                    WHERE sp.user_id = ?`;
                db.query(deleteHasCategoryQuery, [id], (err) => {
                    if (err) return handleError(err, 'Failed to delete from has_category');
                    const deleteSchedulingQuery = `
                        DELETE FROM solicitation
                        WHERE service_provider_id IN (SELECT id FROM service_provider WHERE user_id = ?)
                        OR customer_id IN (SELECT id FROM customer WHERE user_id = ?)`;
                    db.query(deleteSchedulingQuery, [id, id], (err) => {
                        if (err) return handleError(err, 'Failed to delete from solicitation');

                        const deleteServiceProviderQuery = `DELETE FROM service_provider WHERE user_id = ?`;
                        db.query(deleteServiceProviderQuery, [id], (err) => {
                            if (err) return handleError(err, 'Failed to delete from service_provider');

                            const deleteCustomerQuery = `DELETE FROM customer WHERE user_id = ?`;
                            db.query(deleteCustomerQuery, [id], (err) => {
                                if (err) return handleError(err, 'Failed to delete from customer');

                                const deleteUserQuery = `DELETE FROM user WHERE id = ?`;
                                db.query(deleteUserQuery, [id], (err, result) => {
                                    if (err || result.affectedRows === 0) {
                                        return db.rollback(() =>
                                            res.status(err ? 500 : 404).send(err ? 'Failed to delete user' : 'User not found')
                                        );
                                    }

                                    db.commit((commitError) => {
                                        if (commitError) {
                                            return db.rollback(() => res.status(500).send('Failed to commit transaction'));
                                        }

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
        const customerQuery = 'SELECT * FROM customer WHERE user_id = ?';
        db.query(customerQuery, [userId], (err, customerResult) => {
            if (err) throw err;
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


// Service controller functions:
async function getServicesByCustomerId(req, res) {
    const { customer_id } = req.params;

    if (!customer_id) {
        return res.status(400).send('Customer ID is required');
    }

    const query = `
        SELECT s.*, c.category_name, sp.user_id AS provider_user_id, u.name AS provider_name, u.phone AS provider_phone
        FROM solicitation s
        LEFT JOIN category c ON s.category_id = c.id
        LEFT JOIN service_provider sp ON s.service_provider_id = sp.id
        LEFT JOIN user u ON sp.user_id = u.id
        WHERE s.customer_id = ?
    `;

    db.query(query, [customer_id], (err, result) => {
        if (err) {
            console.error('Erro do banco de dados:', err);
            return res.status(500).send('Erro no servidor');
        }

        res.json(result);
    });
}

// async function deleteServiceById(req, res) {
//     const { id } = req.params;

//     if (!id) {
//         return res.status(400).send('Service ID is required');
//     }

//     db.query('DELETE FROM services WHERE id = ?', [id], (err, result) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).send('Database error');
//         }

//         if (result.affectedRows === 0) {
//             return res.status(404).send('Service not found');
//         }

//         res.send('Service deleted successfully');
//     });
// }

async function cancelServiceById(req, res) {
    const { id } = req.params;

    db.query('UPDATE solicitation SET status = ? WHERE id = ?', ['Cancelado', id], (err, result) => {
        if (err) {
            console.error('Erro do banco de dados:', err);
            return res.status(500).send('Erro no servidor');
        }

        res.send('Serviço cancelado com sucesso');
    });
}

async function completeServiceById(req, res) {
    const { id } = req.params;

    db.query('UPDATE solicitation SET status = ? WHERE id = ?', ['Concluído', id], (err, result) => {
        if (err) {
            console.error('Erro do banco de dados:', err);
            return res.status(500).send('Erro no servidor');
        }

        res.send('Serviço concluído com sucesso');
    });
}

async function submitSolicitation(req, res) {
    const {
        category,
        state,
        city,
        service_title,
        description,
        date,
        period,
        customer_id
    } = req.body;

    // mapeamento dos nomes das categorias para seus Ids
    const categoryMap = {
        'Eletricista': 1,
        'Pintor': 2,
        'Faxineiro': 3,
        'Chaveiro': 4,
        'Pedreiro': 5,
        'Fotógrafo': 6
    };

    const category_id = categoryMap[category];

    if (!customer_id || !category_id || !date || !service_title || !description || !period) {
        res.status(400).json({ success: false, message: 'Dados insuficientes para criar a solicitação.' });
        return;
    }

    const checkCustomerQuery = 'SELECT id FROM customer WHERE user_id = ?';
    db.query(checkCustomerQuery, [customer_id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar o cliente:', err);
            res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
        } else if (results.length === 0) {
            res.status(400).json({ success: false, message: 'Cliente não encontrado.' });
        } else {

            const service_provider_id = null;
            const appointment_status = false;
            const status = 'Em busca';

            const insertQuery = `
                INSERT INTO solicitation (
                    service_provider_id, customer_id, service_date, category_id,
                    title, service_description, appointment_status, status, day_shift
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                insertQuery,
                [
                    service_provider_id,
                    results[0].id, // Id do cliente na tabela customer
                    date,
                    category_id,
                    service_title,
                    description,
                    appointment_status,
                    status,
                    period
                ],
                (err, insertResults) => {
                    if (err) {
                        console.error('Erro ao inserir a solicitação:', err);
                        res.status(500).json({ success: false, message: 'Erro ao inserir a solicitação.' });
                    } else {
                        res.json({ success: true, message: 'Solicitação inserida com sucesso!' });
                    }
                }
            );
        }
    });
};


// Routers
const authRouter = express.Router();
const userRouter = express.Router();
const servicesRouter = express.Router();

// Auth routes:
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.get('/get-session', getSession);

// User routes (Protecteds)
// userRouter.use(authenticateSession); precisa do session funcionando para isso funcionar
userRouter.get('/get-users', getUsers);
userRouter.get('/get-user/:id', getUserById);
userRouter.put('/update-user/:id', updateUser);
userRouter.delete('/delete-user/:id', deleteUser);
userRouter.post('/add-second-profile', addSecondProfile);
userRouter.get('/get-profile-type/:userId', getProfileType);
userRouter.post('/add-categories', addCategories);
userRouter.get('/get-categories/:id', getUserCategories);

// Service routes (Protecteds)
// servicesRouter.use(authenticateSession); precisa do session funcionando para isso funcionar
servicesRouter.get('/get-services/:customer_id', getServicesByCustomerId);
servicesRouter.put('/cancel-service/:id', cancelServiceById);
servicesRouter.put('/complete-service/:id', completeServiceById);
servicesRouter.post('/submitSolicitation', submitSolicitation);

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/services', servicesRouter);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
