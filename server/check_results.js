const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amsuf_db',
    waitForConnections: true,
    connectionLimit: 1
});

async function main() {
    try {
        const studentId = 5; // Aminu Saminu
        
        console.log("=== RESULTS FOR AMINU SAMINU ===");
        const [results] = await pool.query(
            "SELECT id, subject_id, academic_term, academic_year, total_score, status FROM results WHERE student_id = ?",
            [studentId]
        );
        console.log(results);

        console.log("\n=== REMARKS FOR AMINU SAMINU ===");
        const [remarks] = await pool.query(
            "SELECT * FROM term_remarks WHERE student_id = ?",
            [studentId]
        );
        console.log(remarks);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

main();
