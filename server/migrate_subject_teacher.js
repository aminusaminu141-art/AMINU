const pool = require('./db');

async function migrate() {
    try {
        console.log('Altering users table to support subject_teacher role...');
        // Alter role ENUM in users table
        await pool.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('student', 'class_master', 'subject_teacher', 'exam_officer', 'principal', 'bursar', 'admin') NOT NULL
        `);
        console.log('Users table altered successfully to include subject_teacher.');
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        process.exit();
    }
}

migrate();
