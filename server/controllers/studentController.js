const pool = require('../db');

exports.getAttendance = async (req, res) => {
    try {
        // Ensure user is a student
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Access denied. Students only.' });
        }

        const studentId = req.user.id;

        // Fetch all attendance records for this student
        const [records] = await pool.query(
            'SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date DESC',
            [studentId]
        );

        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const lateDays = records.filter(r => r.status === 'late').length;
        const absentDays = records.filter(r => r.status === 'absent').length;

        // Calculate overall attendance rate: (present + late) / total
        const attendedCount = presentDays + lateDays;
        const percentage = totalDays > 0 ? Math.round((attendedCount / totalDays) * 100) : 100;

        res.json({
            overallPercentage: percentage,
            totalDays,
            presentDays,
            lateDays,
            absentDays,
            history: records
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getResults = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Access denied. Students only.' });
        }

        const studentId = req.user.id;

        // Fetch finalized results for this student
        const [results] = await pool.query(
            `SELECT r.id, r.academic_term, r.academic_year, r.test_score, r.exam_score, r.total_score, r.grade,
                    s.name AS subject_name
             FROM results r
             JOIN subjects s ON r.subject_id = s.id
             WHERE r.student_id = ? AND r.status = 'finalized'
             ORDER BY r.academic_year DESC, r.academic_term ASC, s.name ASC`,
            [studentId]
        );

        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getTermReport = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Access denied. Students only.' });
        }

        const studentId = req.user.id;
        const { term, year } = req.query;

        if (!term || !year) {
            return res.status(400).json({ msg: 'Term and year are required.' });
        }

        // 1. Fetch student's class_id and class_name
        const [[studentInfo]] = await pool.query(
            `SELECT u.class_id, c.name AS class_name 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.id = ?`, 
            [studentId]
        );
        const classId = studentInfo?.class_id;
        const className = studentInfo?.class_name || 'N/A';

        if (!classId) {
            return res.json({ 
                results: [], 
                position: null, 
                totalStudents: 0, 
                remarks: null,
                className: 'N/A'
            });
        }

        // 2. Fetch finalized results for this student for the given term and year
        const [results] = await pool.query(
            `SELECT r.id, r.test_score, r.test2_score, r.other_ca_score, r.exam_score, r.total_score, r.grade, s.name AS subject_name
             FROM results r
             JOIN subjects s ON r.subject_id = s.id
             WHERE r.student_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'finalized'
             ORDER BY s.name ASC`,
            [studentId, term, year]
        );

        // 3. Fetch all finalized total scores for all students in the class for ranking
        const [allClassScores] = await pool.query(
            `SELECT r.student_id, SUM(r.total_score) AS total_term_score
             FROM results r
             JOIN users u ON r.student_id = u.id
             WHERE u.class_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'finalized'
             GROUP BY r.student_id
             ORDER BY total_term_score DESC`,
            [classId, term, year]
        );

        // Calculate position (supporting ties)
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
            if (scoreRow.student_id === studentId) {
                position = currentRank;
                break;
            }
        }

        // 4. Fetch remarks
        const [[remarks]] = await pool.query(
            `SELECT class_master_remark, principal_remark,
                    punctuality, neatness, honesty, peer_relation, attentiveness,
                    perseverance, leadership, handwriting, sports, crafts,
                    days_open, days_present
             FROM term_remarks 
             WHERE student_id = ? AND academic_term = ? AND academic_year = ?`,
            [studentId, term, year]
        );

        res.json({
            results,
            position,
            totalStudents,
            remarks: remarks || { 
                class_master_remark: '', principal_remark: '',
                punctuality: null, neatness: null, honesty: null, peer_relation: null, attentiveness: null,
                perseverance: null, leadership: null, handwriting: null, sports: null, crafts: null,
                days_open: null, days_present: null
            },
            className
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAcademicHistory = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Fetch student general info
        const [[studentInfo]] = await pool.query(
            `SELECT u.full_name, u.username, c.name AS current_class 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.id = ?`, 
            [studentId]
        );

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

        // Add remarks and ratings to the grouped history
        for (const rem of remarks) {
            const key = `${rem.academic_year} - ${rem.academic_term}`;
            if (historyGrouped[key]) {
                historyGrouped[key].remarks = {
                    class_master_remark: rem.class_master_remark || '',
                    principal_remark: rem.principal_remark || ''
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

        // Calculate averages and class positions for each term
        for (const key in historyGrouped) {
            const termObj = historyGrouped[key];
            if (termObj.results.length > 0) {
                termObj.averageScore = termObj.totalScore / termObj.results.length;
            }

            if (termObj.class_id) {
                // Fetch ranks
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
                    if (scoreRow.student_id === studentId) {
                        position = currentRank;
                        break;
                    }
                }
                termObj.position = position;
            }
        }

        // Convert grouped object to sorted array
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


