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

// Subject selection mapping per class category
function getSubjectsForClass(className, subjectsList) {
    const list = [];
    const findSubject = (name) => subjectsList.find(s => s.name.toLowerCase() === name.toLowerCase());

    if (className.startsWith('Nursery')) {
        const nurseryNames = ['Reading/Dictation Skill', 'Writing Skill', 'Arabic Language', 'Hausa Language', 'Art'];
        nurseryNames.forEach(n => {
            const sub = findSubject(n);
            if (sub) list.push(sub);
        });
    } else if (className.startsWith('Primary')) {
        const primaryNames = [
            'English Language', 'Mathematics', 'Basic Science', 'Social Studies', 
            'Home Economics', 'Physical & Health Education', 'Islamic Religious Knowledge', 
            'Civic Education', 'Computer Science', 'French'
        ];
        primaryNames.forEach(n => {
            const sub = findSubject(n);
            if (sub) list.push(sub);
        });
    } else if (className.startsWith('JSS')) {
        const jssNames = [
            'English Language', 'Mathematics', 'Basic Science', 'Social Studies',
            'Computer Science', 'Business Studies', 'Agricultural Science', 'Civic Education'
        ];
        jssNames.forEach(n => {
            const sub = findSubject(n);
            if (sub) list.push(sub);
        });
    } else { // Senior Secondary (SS) classes
        let ssNames = ['English Language', 'Mathematics', 'Civic Education'];
        if (className.includes('Science')) {
            ssNames = ssNames.concat(['Basic Science', 'Computer Science', 'Agricultural Science']);
        } else if (className.includes('Arts')) {
            ssNames = ssNames.concat(['Arabic Language', 'Hausa Language', 'Social Studies']);
        } else { // General SS
            ssNames = ssNames.concat(['Computer Science', 'Agricultural Science', 'Social Studies']);
        }
        ssNames.forEach(n => {
            const sub = findSubject(n);
            if (sub) list.push(sub);
        });
    }

    // Fallback if no specific subjects matched
    if (list.length === 0) {
        const defaultNames = ['English Language', 'Mathematics', 'Basic Science', 'Social Studies', 'Civic Education'];
        defaultNames.forEach(n => {
            const sub = findSubject(n);
            if (sub) list.push(sub);
        });
    }

    return list;
}

// Compute letter grade from total score
function getGrade(score) {
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C';
    if (score >= 45) return 'D';
    if (score >= 40) return 'E';
    return 'F';
}

// Comments based on performance
function getRemarks(avg) {
    if (avg >= 75) {
        return {
            master: "An exceptionally brilliant term. Keep up the high standard!",
            principal: "Outstanding academic performance. A model student."
        };
    } else if (avg >= 60) {
        return {
            master: "A very good performance. Keep putting in effort to reach the top.",
            principal: "Impressive result. Satisfactory conduct and attitude."
        };
    } else if (avg >= 40) {
        return {
            master: "Average performance. More effort is needed in weak subjects.",
            principal: "Pass. You have the potential to perform much better next term."
        };
    } else {
        return {
            master: "Poor result. You need serious academic counseling and focus.",
            principal: "Unsatisfactory. Must repeat the term's work if no improvement."
        };
    }
}

async function main() {
    try {
        console.log("Fetching classes, subjects, and students...");
        const [classes] = await pool.query("SELECT * FROM classes");
        const [subjects] = await pool.query("SELECT * FROM subjects");
        const [students] = await pool.query("SELECT id, username, full_name, class_id FROM users WHERE role = 'student'");

        console.log(`Found ${classes.length} classes, ${subjects.length} subjects, and ${students.length} students.`);

        // Target terms and sessions
        const academicPeriods = [
            { term: '1st Term', year: '2025/2026' },
            { term: '2nd Term', year: '2025/2026' },
            { term: '3rd Term', year: '2025/2026' },
            { term: '1st Term', year: '2026/2027' } // current active
        ];

        console.log("Clearing existing grades/remarks for the target terms to prevent duplicates...");
        for (const period of academicPeriods) {
            await pool.query("DELETE FROM results WHERE academic_term = ? AND academic_year = ?", [period.term, period.year]);
            await pool.query("DELETE FROM term_remarks WHERE academic_term = ? AND academic_year = ?", [period.term, period.year]);
        }
        console.log("Database cleared for target periods.");

        console.log("Generating academic results and remarks for each student...");
        let resultsCount = 0;
        let remarksCount = 0;

        for (const student of students) {
            const classObj = classes.find(c => c.id === student.class_id);
            if (!classObj) {
                console.log(`Skipping student ${student.full_name} (ID: ${student.id}) as they have no class assigned.`);
                continue;
            }

            const targetSubjects = getSubjectsForClass(classObj.name, subjects);
            
            // Assign a performance profile factor to each student so they get differentiated rankings
            // Profile factor determines how high their scores will generally be
            const profileFactor = 0.45 + (Math.random() * 0.55); // between 0.45 and 1.0

            for (const period of academicPeriods) {
                let studentTotalScoreSum = 0;
                let subjectsGradesCount = 0;

                for (const subject of targetSubjects) {
                    // Generate realistic scores based on profileFactor
                    // test1: 10, test2: 10, other_ca: 10, exam: 70
                    const test = Math.min(10, Math.round((4 + Math.random() * 6) * profileFactor * 2) / 2);
                    const test2 = Math.min(10, Math.round((4 + Math.random() * 6) * profileFactor * 2) / 2);
                    const otherCa = Math.min(10, Math.round((4 + Math.random() * 6) * profileFactor * 2) / 2);
                    const exam = Math.min(70, Math.round((25 + Math.random() * 45) * profileFactor * 2) / 2);
                    
                    const total = parseFloat((test + test2 + otherCa + exam).toFixed(2));
                    const grade = getGrade(total);

                     await pool.query(
                        `INSERT INTO results (student_id, subject_id, academic_term, academic_year, test_score, test2_score, other_ca_score, exam_score, total_score, grade, status, class_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'finalized', ?)`,
                        [student.id, subject.id, period.term, period.year, test, test2, otherCa, exam, total, grade, student.class_id]
                    );

                    studentTotalScoreSum += total;
                    subjectsGradesCount++;
                    resultsCount++;
                }

                // Calculate average for remarks
                const average = subjectsGradesCount > 0 ? (studentTotalScoreSum / subjectsGradesCount) : 0;
                const remarksText = getRemarks(average);

                // Generate affective ratings (1 to 5)
                const rating = () => Math.floor(Math.random() * 2) + (average >= 70 ? 4 : average >= 50 ? 3 : 2);
                const punctuality = Math.min(5, rating());
                const neatness = Math.min(5, rating());
                const honesty = Math.min(5, rating());
                const peer_relation = Math.min(5, rating());
                const attentiveness = Math.min(5, rating());
                const perseverance = Math.min(5, rating());
                const leadership = Math.min(5, rating());
                const handwriting = Math.min(5, rating());
                const sports = Math.min(5, rating());
                const crafts = Math.min(5, rating());
                
                const days_open = 90;
                const days_present = Math.floor(75 + (Math.random() * 15 * (profileFactor >= 0.7 ? 1 : 0.7)));

                await pool.query(
                    `INSERT INTO term_remarks (student_id, academic_term, academic_year, class_master_remark, principal_remark, 
                                              punctuality, neatness, honesty, peer_relation, attentiveness, 
                                              perseverance, leadership, handwriting, sports, crafts, days_open, days_present, class_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [student.id, period.term, period.year, remarksText.master, remarksText.principal, 
                     punctuality, neatness, honesty, peer_relation, attentiveness, 
                     perseverance, leadership, handwriting, sports, crafts, days_open, days_present, student.class_id]
                );

                remarksCount++;
            }
        }

        console.log(`\nSuccessfully seeded ${resultsCount} subject results and ${remarksCount} term remarks records across all academic periods!`);
        process.exit(0);
    } catch (err) {
        console.error("Error populating grades:", err);
        process.exit(1);
    }
}

main();
