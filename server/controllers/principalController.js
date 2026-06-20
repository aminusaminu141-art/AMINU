const pool = require('../db');
const bcrypt = require('bcrypt');

exports.getClassMasters = async (req, res) => {
    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const [masters] = await pool.query(
            `SELECT u.id, u.full_name, u.username, u.class_id, c.name AS class_name 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.role = 'class_master' 
             ORDER BY u.full_name ASC`
        );
        res.json(masters);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getClasses = async (req, res) => {
    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const [classes] = await pool.query('SELECT id, name FROM classes ORDER BY name ASC');
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addClassMaster = async (req, res) => {
    const { full_name, class_id } = req.body;

    if (!full_name) {
        return res.status(400).json({ msg: 'Full name is required' });
    }

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        // Generate username: MASXXXX
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const username = `MAS${randomNum}`;
        const defaultPassword = 'password123';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(defaultPassword, salt);

        // Insert new Class Master
        const [result] = await pool.query(
            'INSERT INTO users (full_name, username, password_hash, role, class_id) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, password_hash, 'class_master', class_id || null]
        );

        res.status(201).json({
            id: result.insertId,
            full_name,
            username,
            password: defaultPassword,
            msg: 'Class Master created successfully'
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(500).json({ msg: 'Username collision, please try again.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.removeClassMaster = async (req, res) => {
    const masterId = req.params.id;

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        // Verify the user is a class master
        const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "class_master"', [masterId]);
        if (users.length === 0) {
            return res.status(404).json({ msg: 'Class Master not found' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [masterId]);
        res.json({ msg: 'Class Master removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getSubjects = async (req, res) => {
    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const [subjects] = await pool.query('SELECT id, name FROM subjects ORDER BY name ASC');
        res.json(subjects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAssignments = async (req, res) => {
    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const [assignments] = await pool.query(`
            SELECT sa.id, sa.teacher_id, sa.class_id, sa.subject_id, 
                   u.full_name AS teacher_name, c.name AS class_name, s.name AS subject_name
            FROM subject_assignments sa
            JOIN users u ON sa.teacher_id = u.id
            JOIN classes c ON sa.class_id = c.id
            JOIN subjects s ON sa.subject_id = s.id
            ORDER BY u.full_name ASC
        `);
        res.json(assignments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addAssignment = async (req, res) => {
    const { teacher_id, class_id, subject_id } = req.body;

    if (!teacher_id || !class_id || !subject_id) {
        return res.status(400).json({ msg: 'Teacher, Class, and Subject are required.' });
    }

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        // Insert assignment
        await pool.query(
            'INSERT INTO subject_assignments (teacher_id, class_id, subject_id) VALUES (?, ?, ?)',
            [teacher_id, class_id, subject_id]
        );

        res.status(201).json({ msg: 'Subject assigned successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'This assignment already exists.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteAssignment = async (req, res) => {
    const assignmentId = req.params.id;

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        await pool.query('DELETE FROM subject_assignments WHERE id = ?', [assignmentId]);
        res.json({ msg: 'Assignment removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getTermRemarks = async (req, res) => {
    const { class_id, academic_term, academic_year } = req.query;

    if (!class_id || !academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Class, Term, and Year are required.' });
    }

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        // Fetch students in this class
        const [students] = await pool.query(
            'SELECT id, full_name, username FROM users WHERE role = "student" AND class_id = ? ORDER BY full_name ASC',
            [class_id]
        );

        // Fetch existing remarks
        const [remarks] = await pool.query(
            `SELECT student_id, class_master_remark, principal_remark 
             FROM term_remarks 
             WHERE academic_term = ? AND academic_year = ? AND student_id IN (
                 SELECT id FROM users WHERE role = "student" AND class_id = ?
             )`,
            [academic_term, academic_year, class_id]
        );

        const remarksMap = {};
        remarks.forEach(r => {
            remarksMap[r.student_id] = r;
        });

        const result = students.map(student => ({
            id: student.id,
            full_name: student.full_name,
            username: student.username,
            class_master_remark: remarksMap[student.id]?.class_master_remark ?? '',
            principal_remark: remarksMap[student.id]?.principal_remark ?? ''
        }));

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.saveTermRemarks = async (req, res) => {
    const { student_id, academic_term, academic_year, remark } = req.body;

    if (!student_id || !academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Student ID, Term, and Year are required.' });
    }

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const [[studentInfo]] = await pool.query('SELECT class_id FROM users WHERE id = ?', [student_id]);
        const classId = studentInfo?.class_id || null;

        // Insert or update remark
        await pool.query(
            `INSERT INTO term_remarks (student_id, academic_term, academic_year, principal_remark, class_id)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE principal_remark = VALUES(principal_remark), class_id = VALUES(class_id)`,
            [student_id, academic_term, academic_year, remark, classId]
        );

        res.json({ msg: 'Principal remark saved successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.bulkSaveTermRemarks = async (req, res) => {
    const { class_id, academic_term, academic_year, remark } = req.body;

    if (!class_id || !academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Class ID, Term, and Year are required.' });
    }

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        // Fetch students in this class
        const [students] = await pool.query(
            'SELECT id FROM users WHERE role = "student" AND class_id = ?',
            [class_id]
        );

        if (students.length === 0) {
            return res.status(400).json({ msg: 'No students found in the selected class.' });
        }

        // Save Principal remark in bulk for each student
        for (let s of students) {
            await pool.query(
                `INSERT INTO term_remarks (student_id, academic_term, academic_year, principal_remark, class_id)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE principal_remark = VALUES(principal_remark), class_id = VALUES(class_id)`,
                [s.id, academic_term, academic_year, remark, class_id]
            );
        }

        res.json({ msg: 'Bulk principal remarks saved successfully for the entire class!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.getStudents = async (req, res) => {
    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const [students] = await pool.query(
            `SELECT u.id, u.full_name, u.username, u.class_id, c.name AS class_name 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.role = 'student' 
             ORDER BY c.name ASC, u.full_name ASC`
        );
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getStudentAcademicHistory = async (req, res) => {
    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const studentId = req.params.student_id;

        // 1. Fetch student info
        const [[studentInfo]] = await pool.query(
            `SELECT u.full_name, u.username, c.name AS current_class 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.id = ? AND u.role = 'student'`, 
            [studentId]
        );

        if (!studentInfo) {
            return res.status(404).json({ msg: 'Student not found.' });
        }

        // 2. Fetch all finalized results
        const [results] = await pool.query(
            `SELECT r.test_score, r.test2_score, r.other_ca_score, r.exam_score, r.total_score, r.grade, r.academic_term, r.academic_year, r.class_id,
                    s.name AS subject_name,
                    c.name AS class_name
             FROM results r
             JOIN subjects s ON r.subject_id = s.id
             LEFT JOIN classes c ON r.class_id = c.id
             WHERE r.student_id = ? AND r.status = 'finalized'
             ORDER BY r.academic_year ASC, r.academic_term ASC, s.name ASC`,
            [studentId]
        );

        // 3. Fetch all remarks
        const [remarks] = await pool.query(
            `SELECT tr.academic_term, tr.academic_year, tr.class_master_remark, tr.principal_remark, tr.class_id,
                    tr.punctuality, tr.neatness, tr.honesty, tr.peer_relation, tr.attentiveness,
                    tr.perseverance, tr.leadership, tr.handwriting, tr.sports, tr.crafts,
                    tr.days_open, tr.days_present,
                    c.name AS class_name
             FROM term_remarks tr
             LEFT JOIN classes c ON tr.class_id = c.id
             WHERE tr.student_id = ?`,
            [studentId]
        );

        // Group results by Year + Term
        const historyGrouped = {};

        for (const row of results) {
            const key = `${row.academic_year} - ${row.academic_term}`;
            if (!historyGrouped[key]) {
                historyGrouped[key] = {
                    academic_year: row.academic_year,
                    academic_term: row.academic_term,
                    class_name: row.class_name || 'N/A',
                    class_id: row.class_id,
                    results: [],
                    totalScore: 0,
                    averageScore: 0,
                    position: null,
                    totalStudents: 0,
                    remarks: { class_master_remark: '', principal_remark: '' }
                };
            }
            const caTotal = (parseFloat(row.test_score) || 0) + (parseFloat(row.test2_score) || 0) + (parseFloat(row.other_ca_score) || 0);
            historyGrouped[key].results.push({
                subject_name: row.subject_name,
                test_score: row.test_score,
                test2_score: row.test2_score,
                other_ca_score: row.other_ca_score,
                ca_total: caTotal,
                exam_score: row.exam_score,
                total_score: row.total_score,
                grade: row.grade
            });
            historyGrouped[key].totalScore += parseFloat(row.total_score) || 0;
        }

        // Add remarks
        for (const rem of remarks) {
            const key = `${rem.academic_year} - ${rem.academic_term}`;
            if (historyGrouped[key]) {
                historyGrouped[key].remarks = {
                    class_master_remark: rem.class_master_remark || '',
                    principal_remark: rem.principal_remark || '',
                    punctuality: rem.punctuality,
                    neatness: rem.neatness,
                    honesty: rem.honesty,
                    peer_relation: rem.peer_relation,
                    attentiveness: rem.attentiveness,
                    perseverance: rem.perseverance,
                    leadership: rem.leadership,
                    handwriting: rem.handwriting,
                    sports: rem.sports,
                    crafts: rem.crafts,
                    days_open: rem.days_open,
                    days_present: rem.days_present
                };
            }
        }

        // Calculate positions
        for (const key in historyGrouped) {
            const termObj = historyGrouped[key];
            if (termObj.results.length > 0) {
                termObj.averageScore = termObj.totalScore / termObj.results.length;
            }

            if (termObj.class_id) {
                const [allClassScores] = await pool.query(
                    `SELECT r.student_id, SUM(r.total_score) AS total_term_score
                     FROM results r
                     JOIN users u ON r.student_id = u.id
                     WHERE r.class_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'finalized'
                     GROUP BY r.student_id
                     ORDER BY total_term_score DESC`,
                    [termObj.class_id, termObj.academic_term, termObj.academic_year]
                );

                termObj.totalStudents = allClassScores.length;

                let position = null;
                let lastScore = null;
                let currentRank = 0;

                for (let i = 0; i < allClassScores.length; i++) {
                    const scoreRow = allClassScores[i];
                    const scoreVal = parseFloat(scoreRow.total_term_score);
                    if (scoreVal !== lastScore) {
                        currentRank = i + 1;
                        lastScore = scoreVal;
                    }
                    if (scoreRow.student_id === parseInt(studentId)) {
                        position = currentRank;
                        break;
                    }
                }
                termObj.position = position;
            }
        }

        const historyArray = Object.values(historyGrouped).sort((a, b) => {
            if (a.academic_year !== b.academic_year) {
                return a.academic_year.localeCompare(b.academic_year);
            }
            return a.academic_term.localeCompare(b.academic_term);
        });

        res.json({
            student: studentInfo,
            history: historyArray
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getTestimonial = async (req, res) => {
    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        const studentId = req.params.student_id;

        const [testimonials] = await pool.query(
            'SELECT * FROM testimonials WHERE student_id = ?',
            [studentId]
        );

        if (testimonials.length === 0) {
            return res.json(null);
        }

        res.json(testimonials[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.saveTestimonial = async (req, res) => {
    const { student_id, date_issued, conduct, academic_performance, sports_extracurricular, general_remarks } = req.body;

    if (!student_id || !date_issued || !conduct || !academic_performance) {
        return res.status(400).json({ msg: 'Student, Date, Conduct, and Academic performance details are required.' });
    }

    try {
        if (req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied. Principal only.' });
        }

        await pool.query(
            `INSERT INTO testimonials (student_id, date_issued, conduct, academic_performance, sports_extracurricular, general_remarks)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                date_issued = VALUES(date_issued),
                conduct = VALUES(conduct),
                academic_performance = VALUES(academic_performance),
                sports_extracurricular = VALUES(sports_extracurricular),
                general_remarks = VALUES(general_remarks)`,
            [student_id, date_issued, conduct, academic_performance, sports_extracurricular || null, general_remarks || null]
        );

        res.json({ msg: 'Testimonial saved successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

