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
        console.error('Register error:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error during registration. Please try again.' }] });
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
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials. Please check your Login ID and password.' }] });
        }

        const user = users[0];

        // 3. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials. Please check your Login ID and password.' }] });
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

        const secret = process.env.JWT_SECRET || 'secret123';

        jwt.sign(
            payload,
            secret,
            { expiresIn: '8h' },
            (err, token) => {
                if (err) {
                    console.error('JWT sign error:', err.message);
                    return res.status(500).json({ errors: [{ msg: 'Authentication error. Please try again.' }] });
                }
                res.json({ token, user: payload.user });
            }
        );

    } catch (err) {
        console.error('Login error full:', JSON.stringify({ code: err.code, message: err.message, errno: err.errno, sqlState: err.sqlState }));
        const msg = err.code === 'ECONNREFUSED'
            ? 'Cannot connect to database. Please ensure MySQL is running.'
            : err.code === 'ER_ACCESS_DENIED_ERROR'
            ? 'Database access denied. Check DB credentials in .env'
            : err.code === 'ER_BAD_DB_ERROR'
            ? `Database "${process.env.DB_NAME}" does not exist.`
            : `Server error: ${err.code || err.message || 'Unknown'}`;
        res.status(500).json({ errors: [{ msg }] });
    }
};
// Change password (protected — requires valid JWT)
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Both current and new password are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ msg: 'New password must be at least 6 characters.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ msg: 'New password must be different from the current password.' });
    }

    try {
        const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ msg: 'User not found.' });

        const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect.' });

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

        res.json({ msg: 'Password changed successfully.' });
    } catch (err) {
        console.error('changePassword error:', err.message);
        res.status(500).json({ msg: 'Server error while changing password.' });
    }
};

// Get current user profile (protected)
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.full_name, u.username, u.role, u.created_at,
                    c.name AS class_name
             FROM users u
             LEFT JOIN classes c ON u.class_id = c.id
             WHERE u.id = ?`,
            [req.user.id]
        );
        if (rows.length === 0) return res.status(404).json({ msg: 'User not found.' });
        res.json(rows[0]);
    } catch (err) {
        console.error('getProfile error:', err.message);
        res.status(500).json({ msg: 'Server error loading profile.' });
    }
};
