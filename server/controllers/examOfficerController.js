const pool = require('../db');

exports.getStats = async (req, res) => {
    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied. Exam officer only.' });
        }

        const [[{ total_classes }]] = await pool.query('SELECT COUNT(*) AS total_classes FROM classes');
        const [[{ total_subjects }]] = await pool.query('SELECT COUNT(*) AS total_subjects FROM subjects');

        // Pending approval: Count unique (class_id, term, year) where status = 'submitted'
        const [pendingClasses] = await pool.query(`
            SELECT DISTINCT c.id AS class_id, r.academic_term, r.academic_year
            FROM results r
            JOIN users u ON r.student_id = u.id
            JOIN classes c ON u.class_id = c.id
            WHERE r.status = 'submitted'
        `);

        res.json({
            classes: total_classes,
            subjects: total_subjects,
            pending_approvals: pendingClasses.length
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getClasses = async (req, res) => {
    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }
        const [classes] = await pool.query('SELECT * FROM classes ORDER BY name ASC');
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addClass = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ msg: 'Class name is required' });

    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        await pool.query('INSERT INTO classes (name) VALUES (?)', [name]);
        res.status(201).json({ msg: 'Class added successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'Class name already exists' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteClass = async (req, res) => {
    const classId = req.params.id;

    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        await pool.query('DELETE FROM classes WHERE id = ?', [classId]);
        res.json({ msg: 'Class deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getSubjects = async (req, res) => {
    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }
        const [subjects] = await pool.query('SELECT * FROM subjects ORDER BY name ASC');
        res.json(subjects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addSubject = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ msg: 'Subject name is required' });

    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        await pool.query('INSERT INTO subjects (name) VALUES (?)', [name]);
        res.status(201).json({ msg: 'Subject added successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: 'Subject name already exists' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteSubject = async (req, res) => {
    const subjectId = req.params.id;

    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        await pool.query('DELETE FROM subjects WHERE id = ?', [subjectId]);
        res.json({ msg: 'Subject deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getGradeSheets = async (req, res) => {
    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        const [sheets] = await pool.query(`
            SELECT 
                c.id AS class_id, c.name AS class_name,
                r.academic_term, r.academic_year,
                r.status,
                COUNT(DISTINCT r.student_id) AS student_count,
                COUNT(DISTINCT r.subject_id) AS subject_count
            FROM results r
            JOIN users u ON r.student_id = u.id
            JOIN classes c ON u.class_id = c.id
            GROUP BY c.id, c.name, r.academic_term, r.academic_year, r.status
            ORDER BY c.name ASC
        `);

        res.json(sheets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getGradeSheetDetails = async (req, res) => {
    const { class_id, term, year } = req.query;

    if (!class_id || !term || !year) {
        return res.status(400).json({ msg: 'Class, Term, and Year are required.' });
    }

    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        const [details] = await pool.query(`
            SELECT 
                u.full_name AS student_name, u.username AS student_id_code,
                s.name AS subject_name,
                r.test_score, r.test2_score, r.other_ca_score, r.exam_score, r.total_score, r.grade, r.status
            FROM results r
            JOIN users u ON r.student_id = u.id
            JOIN subjects s ON r.subject_id = s.id
            WHERE u.class_id = ? AND r.academic_term = ? AND r.academic_year = ?
            ORDER BY u.full_name ASC, s.name ASC
        `, [class_id, term, year]);

        res.json(details);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.finalizeGradeSheet = async (req, res) => {
    const { class_id, term, year } = req.body;

    if (!class_id || !term || !year) {
        return res.status(400).json({ msg: 'Class, Term, and Year are required.' });
    }

    try {
        if (req.user.role !== 'exam_officer') {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        await pool.query(`
            UPDATE results r
            JOIN users u ON r.student_id = u.id
            SET r.status = 'finalized'
            WHERE u.class_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'submitted'
        `, [class_id, term, year]);

        res.json({ msg: 'Class grades finalized and published successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getStudents = async (req, res) => {
    try {
        if (req.user.role !== 'exam_officer' && req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied.' });
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
        if (req.user.role !== 'exam_officer' && req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied.' });
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
                    remarks: { class_master_remark: '', principal_remark: '' },
                    ratings: { punctuality: null, neatness: null, honesty: null, peer_relation: null, attentiveness: null, perseverance: null, leadership: null, handwriting: null, sports: null, crafts: null },
                    attendance: { days_open: null, days_present: null }
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

        // Add remarks and ratings
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
                historyGrouped[key].ratings = {
                    punctuality: rem.punctuality,
                    neatness: rem.neatness,
                    honesty: rem.honesty,
                    peer_relation: rem.peer_relation,
                    attentiveness: rem.attentiveness,
                    perseverance: rem.perseverance,
                    leadership: rem.leadership,
                    handwriting: rem.handwriting,
                    sports: rem.sports,
                    crafts: rem.crafts
                };
                historyGrouped[key].attendance = {
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
        if (req.user.role !== 'exam_officer' && req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied.' });
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
        if (req.user.role !== 'exam_officer' && req.user.role !== 'principal') {
            return res.status(403).json({ msg: 'Access denied.' });
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
