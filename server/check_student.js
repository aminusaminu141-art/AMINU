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
        const [rows] = await pool.query("SELECT id, username, full_name, class_id FROM users WHERE username = 'STU7727'");
        console.log("=== AMINU SAMINU PROFILE ===");
        console.log(rows);
        
        if (rows.length > 0) {
            const student = rows[0];
            const [classRow] = await pool.query("SELECT * FROM classes WHERE id = ?", [student.class_id]);
            console.log("\n=== CLASS ASSIGNED ===");
            console.log(classRow);
        }
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

main();
