const db = require('../connection/db-connection');

const authenticateSession = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    const userId = req.session.user.id;

    // Verificar se o usuário ainda existe no banco de dados
    db.query('SELECT * FROM user WHERE id = ?', [userId], (err, result) => {
        if (err || result.length === 0) {
            // Destroi a sessão se o usuário não existir no banco de dados
            req.session.destroy((error) => {
                if (error) {
                    console.error('Error destroying session:', error);
                }
                return res.status(401).send('Session invalid, please log in again');
            });
        } else {
            next(); // Prossegue se a sessão e o usuário forem válidos
        }
    });
};

module.exports = authenticateSession;
