const bcrypt = require('bcrypt');
const pool = require('./db');

async function migrate() {
    try {
        console.log('Altering users table to support bursar role...');
        // Alter role ENUM in users table
        await pool.query(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('student', 'class_master', 'exam_officer', 'principal', 'bursar') NOT NULL
        `);
        console.log('Users table altered successfully.');

        // Create fee_configurations table
        console.log('Creating fee_configurations table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fee_configurations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                academic_term VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
                UNIQUE KEY unique_class_term_year (class_id, academic_term, academic_year)
            )
        `);
        console.log('fee_configurations table created.');

        // Create student_fees table
        console.log('Creating student_fees table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_fees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                academic_term VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                amount_paid DECIMAL(10,2) DEFAULT 0.00,
                status ENUM('unpaid', 'partially_paid', 'paid') DEFAULT 'unpaid',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_student_term_year (student_id, academic_term, academic_year)
            )
        `);
        console.log('student_fees table created.');

        // Create payments table
        console.log('Creating payments table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                academic_term VARCHAR(50) NOT NULL,
                academic_year VARCHAR(50) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                transaction_reference VARCHAR(100) NOT NULL UNIQUE,
                payment_gateway VARCHAR(50) DEFAULT 'remita',
                status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
                rrr VARCHAR(50) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                verified_at TIMESTAMP NULL,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('payments table created.');

        // Seed a default Bursar user
        console.log('Seeding default bursar account...');
        const passwordHash = await bcrypt.hash('password123', 10);
        await pool.query(`
            INSERT IGNORE INTO users (full_name, username, password_hash, role, class_id)
            VALUES (?, ?, ?, ?, ?)
        `, ['Default Bursar', 'BUR001', passwordHash, 'bursar', null]);
        console.log('Seeded Bursar user BUR001 with password: password123');

        // Seed some sample fee configurations for active classes
        console.log('Seeding sample fee configurations...');
        const [classes] = await pool.query('SELECT id, name FROM classes');
        for (let c of classes) {
            let feeAmount = 45000.00;
            if (c.name.includes('SS')) feeAmount = 60000.00;
            if (c.name.includes('Nursery')) feeAmount = 30000.00;

            await pool.query(`
                INSERT IGNORE INTO fee_configurations (class_id, academic_term, academic_year, amount)
                VALUES (?, ?, ?, ?)
            `, [c.id, '1st Term', '2025/2026', feeAmount]);
        }
        console.log('Seeded sample fee configurations.');

        // Link existing students to their fee records
        console.log('Initializing student fee records...');
        const [students] = await pool.query('SELECT id, class_id FROM users WHERE role = "student"');
        for (let s of students) {
            if (s.class_id) {
                const [feeConfig] = await pool.query(`
                    SELECT amount FROM fee_configurations 
                    WHERE class_id = ? AND academic_term = ? AND academic_year = ?
                `, [s.class_id, '1st Term', '2025/2026']);
                
                if (feeConfig.length > 0) {
                    await pool.query(`
                        INSERT IGNORE INTO student_fees (student_id, academic_term, academic_year, total_amount, amount_paid, status)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [s.id, '1st Term', '2025/2026', feeConfig[0].amount, 0.00, 'unpaid']);
                }
            }
        }
        console.log('Student fee records initialized.');
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Error during migration:', err);
    } finally {
        process.exit();
    }
}

migrate();
