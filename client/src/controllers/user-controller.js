const bcrypt = require('bcryptjs');
const db = require('../connection/db-connection');
const util = require('util');

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
            SELECT * FROM scheduling
            WHERE (service_provider_id IN (SELECT id FROM service_provider WHERE user_id = ?)
            OR customer_id IN (SELECT id FROM customer WHERE user_id = ?))
            AND status NOT IN ('Concluído', 'Cancelado')`;

        db.query(checkSchedulingQuery, [id, id], (err, results) => {
            if (err) return handleError(err, 'Failed to check scheduling');

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

                    // excluir registros de 'scheduling' onde o usuário é um 'service_provider' ou 'customer'
                    const deleteSchedulingQuery = `
                        DELETE FROM scheduling
                        WHERE service_provider_id IN (SELECT id FROM service_provider WHERE user_id = ?)
                        OR customer_id IN (SELECT id FROM customer WHERE user_id = ?)`;
                    db.query(deleteSchedulingQuery, [id, id], (err) => {
                        if (err) return handleError(err, 'Failed to delete from scheduling');

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

module.exports = { getUsers, getUserById, updateUser, deleteUser, addSecondProfile, getProfileType, addCategories, getUserCategories };
