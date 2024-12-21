const bcrypt = require('bcryptjs');
const db = require('../database/db-connection')
async function getUser(req, res) {
    const { id } = req.session.user;

    db.query(`SELECT * FROM users WHERE id = ?`, [id], (err, result) => {
        if (err) throw err;

        if (result.length === 0) {
            return res.status(404).send('User not found');
        }
        res.json(result[0]);
    });
};

async function updateUser(req, res) {
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
};

async function deleteUser(req, res) {
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
};

module.exports = { getUser, updateUser, deleteUser };
