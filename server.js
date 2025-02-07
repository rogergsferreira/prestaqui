require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./client/src/db/db-connection');
const authRoutes = require('./client/src/routes/auth-routes');
const userRoutes = require('./client/src/routes/user-routes');
const serviceRoutes = require('./client/src/routes/service-routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth/', authRoutes);
app.use('/api/user/', userRoutes);
app.use('/api/services/', serviceRoutes);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});