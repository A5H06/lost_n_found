const express = require('express');
const cors    = require('cors');
const path    = require('path');
const session = require('express-session');

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({
    secret:            process.env.SESSION_SECRET || 'lostfound_secret_key',
    resave:            false,
    saveUninitialized: false,
    cookie:            { maxAge: 8 * 60 * 60 * 1000 }
}));

function requireAuth(req, res, next) {
    if (req.session && req.session.loggedIn) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

const authRoute  = require('./routes/auth');
const usersRoute = require('./routes/users');
const lostRoute  = require('./routes/lost');
const foundRoute = require('./routes/found');
const claimsRoute = require('./routes/claims');

app.use('/auth',   authRoute);
app.use('/users',  requireAuth, usersRoute);
app.use('/lost',   requireAuth, lostRoute);
app.use('/found',  requireAuth, foundRoute);
app.use('/claims', requireAuth, claimsRoute);

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
