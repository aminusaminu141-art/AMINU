const pool = require('./db');

async function migrate() {
    try {
        console.log('Starting testimonials migration...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS testimonials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT UNIQUE NOT NULL,
                date_issued DATE NOT NULL,
                conduct VARCHAR(100) NOT NULL,
                academic_performance VARCHAR(255) NOT NULL,
                sports_extracurricular VARCHAR(255) NULL,
                general_remarks TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Testimonials table created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
