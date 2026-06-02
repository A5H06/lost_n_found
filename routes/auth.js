const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const db      = require('../db');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// ================= REGISTER =================

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existing.length) {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        const hashed = hashPassword(password);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashed]
        );
        req.session.loggedIn = true;
        req.session.username = name;
        req.session.userId   = result.insertId;
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.sqlMessage || 'Registration failed' });
    }
});

// ================= LOGIN =================

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Hardcoded admin fallback
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.loggedIn = true;
        req.session.username = ADMIN_USER;
        req.session.userId   = null;
        return res.json({ success: true });
    }

    // DB user login (email as username)
    try {
        const hashed = hashPassword(password);
        const [rows] = await db.query(
            'SELECT user_id, name FROM users WHERE email = ? AND password = ?',
            [username, hashed]
        );
        if (!rows.length) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        req.session.loggedIn = true;
        req.session.username = rows[0].name;
        req.session.userId   = rows[0].user_id;
        return res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed. Is MySQL running?' });
    }
});

// ================= LOGOUT =================

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

// ================= CHECK =================

router.get('/check', (req, res) => {
    res.json({
        loggedIn: !!(req.session && req.session.loggedIn),
        username: req.session ? req.session.username : null
    });
});

module.exports = router;
