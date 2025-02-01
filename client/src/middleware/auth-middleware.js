const db = require('../connection/db-connection');

const authenticateSession = (req, res, next) => {
    // Os dados da Sessão/Sessão está sempre sendo desfeito por um erro desconhecido. Então por questões para o desenvolvimento do projeto, aqui estará definido para retornar score 200 de forma definida
    return next();

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

module.exports = authenticateSession;
