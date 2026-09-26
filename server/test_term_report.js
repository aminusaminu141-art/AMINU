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
        const term = '1st Term';
        const year = '2025/2026';

        // 1. Fetch student's class_id and class_name
        const [[studentInfo]] = await pool.query(
            `SELECT u.class_id, c.name AS class_name 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.id = ?`, 
            [studentId]
        );
        console.log("=== studentInfo ===");
        console.log(studentInfo);

        const classId = studentInfo?.class_id;
        const className = studentInfo?.class_name || 'N/A';
        console.log("classId:", classId);
        console.log("className:", className);

        // 2. Fetch finalized results
        const [results] = await pool.query(
            `SELECT r.id, r.test_score, r.test2_score, r.other_ca_score, r.exam_score, r.total_score, r.grade, s.name AS subject_name
             FROM results r
             JOIN subjects s ON r.subject_id = s.id
             WHERE r.student_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'finalized'
             ORDER BY s.name ASC`,
            [studentId, term, year]
        );
        console.log(`\nFound ${results.length} finalized results.`);

        // 3. Fetch all finalized total scores for ranking
        const [allClassScores] = await pool.query(
            `SELECT r.student_id, SUM(r.total_score) AS total_term_score
             FROM results r
             JOIN users u ON r.student_id = u.id
             WHERE u.class_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'finalized'
             GROUP BY r.student_id
             ORDER BY total_term_score DESC`,
            [classId, term, year]
        );
        console.log("\n=== allClassScores ===");
        console.log(allClassScores);

        // Calculate position
        let position = null;
        let lastScore = null;
        let currentRank = 0;
        const totalStudents = allClassScores.length;

        for (let i = 0; i < allClassScores.length; i++) {
            const scoreRow = allClassScores[i];
            const scoreVal = parseFloat(scoreRow.total_term_score);
            if (scoreVal !== lastScore) {
                currentRank = i + 1;
                lastScore = scoreVal;
            }
            if (scoreRow.student_id == studentId) {
                position = currentRank;
                break;
            }
        }
        console.log("\nCalculated position:", position);
        console.log("Total students in class ranking:", totalStudents);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

main();
