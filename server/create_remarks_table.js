const pool = require('./db');

async function run() {
    try {
        console.log('Creating term_remarks table if it does not exist...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS term_remarks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                academic_term VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                class_master_remark TEXT NULL,
                principal_remark TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_term (student_id, academic_term, academic_year)
            )
        `);
        console.log('term_remarks table created successfully!');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        process.exit();
    }
}

run();
