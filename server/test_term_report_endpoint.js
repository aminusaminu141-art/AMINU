const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

async function main() {
    try {
        // Generate a token for student ID 5 (Aminu Saminu)
        const token = jwt.sign(
            { user: { id: 5, role: 'student' } },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '1h' }
        );

        const res = await axios.get(`http://localhost:${PORT}/api/student/term-report`, {
            params: {
                term: '1st Term',
                year: '2025/2026'
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("=== API RESPONSE ===");
        console.log(JSON.stringify(res.data, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Error fetching term-report:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
        process.exit(1);
    }
}

main();
