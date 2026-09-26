const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', require('./routes/master'));
app.use('/api/student', require('./routes/student'));
app.use('/api/principal', require('./routes/principal'));
app.use('/api/exam-officer', require('./routes/examOfficer'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

// Health check — tests DB connection
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected', database: process.env.DB_NAME });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            db: 'disconnected',
            code: err.code,
            message: err.message,
            database: process.env.DB_NAME
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Test DB on startup
    pool.query('SELECT 1')
        .then(() => console.log('✅ Database connected successfully'))
        .catch(err => console.error(`❌ Database connection FAILED: [${err.code}] ${err.message}`));
});
