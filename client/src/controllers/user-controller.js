const bcrypt = require('bcryptjs');
const db = require('../connection/db-connection');

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
    const { newEmail, newPassword, newName, newPhone, newCep, newState, newCity, newNeighborhood, newStreetAddress, newAvatarPath, newComplement } = req.body;

    if (!id) {
        return res.status(400).send('User ID is required');
    }

    const updates = [];
    const values = [];

    // Adicione os campos dinamicamente
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

    if (updates.length === 0) {
        return res.status(400).send('No fields to update');
    }

    values.push(id);

    db.query(`UPDATE user SET ${updates.join(', ')} WHERE id = ?`, values, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('User not found');
        }

        res.send('User updated successfully');
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

        db.query(`DELETE FROM service_provider WHERE user_id = ?`, [id], (err) => {
            if (err) {
                console.log(err);
                return db.rollback(() => res.status(500).send('Failed to delete related records'));
            }

            db.query(`DELETE FROM user WHERE id = ?`, [id], (err, result) => {
                if (err || result.affectedRows === 0) {
                    return db.rollback(() => res.status(err ? 500 : 404).send(err ? 'Failed to delete user' : 'User not found'));
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
}

module.exports = { getUsers, getUserById, updateUser, deleteUser };
