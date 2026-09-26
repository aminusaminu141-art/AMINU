const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// 1. Get stats
exports.getStats = async (req, res) => {
    try {
        const [[studentCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role = "student"');
        const [[masterCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role = "class_master"');
        const [[teacherCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role = "subject_teacher"');
        const [[officerCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role = "exam_officer"');
        const [[principalCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role = "principal"');
        const [[bursarCount]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE role = "bursar"');
        const [[classCount]] = await pool.query('SELECT COUNT(*) AS count FROM classes');
        const [[subjectCount]] = await pool.query('SELECT COUNT(*) AS count FROM subjects');

        res.json({
            students: studentCount.count,
            classMasters: masterCount.count,
            classTeachers: teacherCount.count,
            examOfficers: officerCount.count,
            principals: principalCount.count,
            bursars: bursarCount.count,
            classes: classCount.count,
            subjects: subjectCount.count
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 2. Get all users
exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.full_name, u.username, u.role, u.class_id, c.name AS class_name, u.created_at
            FROM users u
            LEFT JOIN classes c ON u.class_id = c.id
            ORDER BY u.role ASC, u.username ASC
        `);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 3. Create a new user
exports.createUser = async (req, res) => {
    const { full_name, username, password, role, class_id } = req.body;

    if (!full_name || !username || !password || !role) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    try {
        // Check if username already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ msg: 'Username is already taken.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Save user
        const [result] = await pool.query(
            'INSERT INTO users (full_name, username, password_hash, role, class_id) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, password_hash, role, class_id || null]
        );

        res.status(201).json({ msg: 'User created successfully', userId: result.insertId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 4. Update an existing user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, username, role, class_id, password } = req.body;

    if (!full_name || !username || !role) {
        return res.status(400).json({ msg: 'Please fill in all required fields.' });
    }

    try {
        // Check if target user exists
        const [target] = await pool.query('SELECT id, password_hash FROM users WHERE id = ?', [id]);
        if (target.length === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        // Check username conflict
        const [conflict] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
        if (conflict.length > 0) {
            return res.status(400).json({ msg: 'Username is already taken by another account.' });
        }

        let passwordHash = target[0].password_hash;
        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(password, salt);
        }

        // Update user
        await pool.query(
            'UPDATE users SET full_name = ?, username = ?, role = ?, class_id = ?, password_hash = ? WHERE id = ?',
            [full_name, username, role, class_id || null, passwordHash, id]
        );

        res.json({ msg: 'User updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 5. Delete a user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Prevent deleting self
        if (req.user.id == id) {
            return res.status(400).json({ msg: 'You cannot delete your own admin account.' });
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        res.json({ msg: 'User deleted successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// 7. Get classes list
exports.getClasses = async (req, res) => {
    try {
        const [classes] = await pool.query('SELECT id, name FROM classes ORDER BY name ASC');
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// 8. Get classroom ranking position mapping
exports.getClassRankings = async (req, res) => {
    try {
        const { classId, term, year } = req.query;
        if (!classId || !term || !year) {
            return res.status(400).json({ msg: 'classId, term, and year are required.' });
        }

        const [allClassScores] = await pool.query(
            `SELECT r.student_id, SUM(r.total_score) AS total_term_score
             FROM results r
             JOIN users u ON r.student_id = u.id
             WHERE u.class_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'finalized'
             GROUP BY r.student_id
             ORDER BY total_term_score DESC`,
            [classId, term, year]
        );

        let rankings = {};
        let lastScore = null;
        let currentRank = 0;

        for (let i = 0; i < allClassScores.length; i++) {
            const scoreRow = allClassScores[i];
            const scoreVal = parseFloat(scoreRow.total_term_score);
            if (scoreVal !== lastScore) {
                currentRank = i + 1;
                lastScore = scoreVal;
            }
            rankings[scoreRow.student_id] = currentRank;
        }

        res.json({ rankings });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
