const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
    // 1. Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, username, password, role, class_id } = req.body;

    try {
        // 2. Check if username already exists
        const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'Username already exists' }] });
        }

        // 3. Encrypt the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Save the user to the database
        const [result] = await pool.query(
            'INSERT INTO users (full_name, username, password_hash, role, class_id) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, password_hash, role, class_id || null]
        );

        res.status(201).json({ msg: 'User registered successfully', userId: result.insertId });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    // 1. Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        // 2. Check if user exists
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const user = users[0];

        // 3. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        // 4. Return JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                username: user.username,
                full_name: user.full_name
            }
        };

        // Use a secret from env, or fallback
        const secret = process.env.JWT_SECRET || 'secret123';
        
        jwt.sign(
            payload,
            secret,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
