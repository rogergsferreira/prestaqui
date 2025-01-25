require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./client/src/routes/auth-routes');
const userRoutes = require('./client/src/routes/user-routes');
const authenticateSession = require('./client/src/middleware/auth-middleware');
const servicesRoutes = require('./client/src/routes/services-routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    expires: 150000
}));

app.use('/api/user/', authenticateSession, userRoutes);
app.use('/api/auth/', authRoutes);
app.use('/api/services/', authenticateSession, servicesRoutes);

app.get('/user', authenticateSession, (req, res) => {
    res.json(req.session.user);
});


app.listen(3000, () => {
    console.log('Server running on port 3000');
});
