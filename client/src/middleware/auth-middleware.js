// Middleware for session authentication
const authenticateSession = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }
    next();
};

module.exports = authenticateSession();
