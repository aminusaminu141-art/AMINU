const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('./db');

async function seed() {
    try {
        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        // Split schema into individual queries
        const queries = schema.split(';').map(q => q.trim()).filter(q => q.length > 0);
        
        console.log('Executing schema queries...');
        for (let query of queries) {
            await pool.query(query);
        }
        
        console.log('Schema created successfully.');

        // Insert initial classes
        console.log('Inserting classes...');
        const classes = ['Nursery 1', 'Nursery 2', 'Primary 1', 'JSS 1', 'SS 1 Science', 'SS 3 Arts'];
        for (let c of classes) {
            await pool.query('INSERT IGNORE INTO classes (name) VALUES (?)', [c]);
        }

        // Insert initial subjects
        console.log('Inserting subjects...');
        const subjects = [
            'English Language',
            'Arabic Language',
            'Hausa Language',
            'Yoruba Language',
            'Igbo Language',
            'Mathematics',
            'Quantitative Reasoning',
            'Basic Science',
            'Agricultural Science',
            'Computer Science',
            'Physical & Health Education',
            'Home Economics',
            'Social Studies',
            'Business Studies',
            'Moral Instructions',
            'Civic Education',
            'Vocational Aptitude',
            'Islamic Religious Knowledge',
            'Arabic',
            'Poly/Phm / Lin Eng',
            'Writing Skill',
            'Reading/Dictation Skill',
            'Art',
            'French'
        ];
        for (let s of subjects) {
            await pool.query('INSERT IGNORE INTO subjects (name) VALUES (?)', [s]);
        }

        // Generate password hash
        const passwordHash = await bcrypt.hash('password123', 10);

        // Fetch a class ID for the student
        const [rows] = await pool.query('SELECT id FROM classes WHERE name = ?', ['JSS 1']);
        const classId = rows[0]?.id || null;

        // Insert users
        console.log('Inserting users...');
        const users = [
            ['Student One', 'STU001', passwordHash, 'student', classId],
            ['Mr. Master', 'MAS001', passwordHash, 'class_master', classId],
            ['Exam Officer', 'EXM001', passwordHash, 'exam_officer', null],
            ['The Principal', 'PRN001', passwordHash, 'principal', null]
        ];

        for (let user of users) {
            await pool.query(
                'INSERT IGNORE INTO users (full_name, username, password_hash, role, class_id) VALUES (?, ?, ?, ?, ?)',
                user
            );
        }

        console.log('Seed completed successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        process.exit();
    }
}

seed();
