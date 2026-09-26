const bcrypt = require('bcrypt');
const pool = require('./db');

async function migrate() {
    try {
        console.log('Altering users table to support admin role...');
        // Alter role ENUM in users table
        await pool.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('student', 'class_master', 'exam_officer', 'principal', 'bursar', 'admin') NOT NULL
        `);
        console.log('Users table altered successfully.');

        // Seed a default Admin user
        console.log('Seeding default admin account...');
        const passwordHash = await bcrypt.hash('password123', 10);
        await pool.query(`
            INSERT IGNORE INTO users (full_name, username, password_hash, role, class_id)
            VALUES (?, ?, ?, ?, ?)
        `, ['System Administrator', 'ADM001', passwordHash, 'admin', null]);
        console.log('Seeded Admin user ADM001 with password: password123');

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        process.exit();
    }
}

migrate();
