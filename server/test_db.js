const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/xampp/htdocs/myproject/server/.env' });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amsuf_db',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

async function main() {
    try {
        console.log("Database:", process.env.DB_NAME);
        const [tables] = await pool.query("SHOW TABLES");
        console.log("Tables in database:", tables);

        const [attendanceCols] = await pool.query("SHOW COLUMNS FROM attendance");
        console.log("attendance columns:", attendanceCols);

        const [users] = await pool.query("SELECT id, username, full_name, role, class_id FROM users");
        console.log("Users in database:", users);

        const [attendance] = await pool.query("SELECT * FROM attendance");
        console.log("Attendance records:", attendance);

        // Check if there are any errors or constraints
        const [remarksCols] = await pool.query("SHOW COLUMNS FROM term_remarks");
        console.log("term_remarks columns:", remarksCols);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

main();
