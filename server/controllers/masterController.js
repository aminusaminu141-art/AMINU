const pool = require('../db');
const bcrypt = require('bcrypt');

exports.getStudents = async (req, res) => {
    try {
        // Ensure user is a class master
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Get the master's class_id
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }
        
        const classId = masters[0].class_id;

        const [students] = await pool.query(
            'SELECT id, full_name, username, created_at FROM users WHERE role = "student" AND class_id = ? ORDER BY full_name ASC',
            [classId]
        );
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.addStudent = async (req, res) => {
    const { full_name } = req.body;
    
    if (!full_name) {
        return res.status(400).json({ msg: 'Full name is required' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Get the master's class_id
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }
        const classId = masters[0].class_id;

        // Generate a random 4 digit number for username: STUXXXX
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const username = `STU${randomNum}`;
        const defaultPassword = 'password123';
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(defaultPassword, salt);

        // Insert new student
        const [result] = await pool.query(
            'INSERT INTO users (full_name, username, password_hash, role, class_id) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, password_hash, 'student', classId]
        );

        res.status(201).json({ 
            id: result.insertId,
            full_name, 
            username,
            password: defaultPassword,
            msg: 'Student created successfully'
        });
    } catch (err) {
        // Handle duplicate username just in case
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(500).json({ msg: 'Username collision, please try again.' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.removeStudent = async (req, res) => {
    const studentId = req.params.id;

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Get the master's class_id
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }
        const classId = masters[0].class_id;

        // Ensure the student exists and belongs to this class
        const [students] = await pool.query('SELECT * FROM users WHERE id = ? AND role = "student" AND class_id = ?', [studentId, classId]);
        
        if (students.length === 0) {
            return res.status(404).json({ msg: 'Student not found in your class.' });
        }

        await pool.query('DELETE FROM users WHERE id = ?', [studentId]);

        res.json({ msg: 'Student removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAttendance = async (req, res) => {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return res.status(400).json({ msg: 'Date is required' });

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }
        const classId = masters[0].class_id;

        // Fetch students in this class
        const [students] = await pool.query(
            'SELECT id, full_name, username FROM users WHERE role = "student" AND class_id = ? ORDER BY full_name ASC',
            [classId]
        );

        // Fetch attendance for these students on the given date
        const [attendanceRecords] = await pool.query(
            `SELECT a.student_id, a.status 
             FROM attendance a
             JOIN users u ON a.student_id = u.id
             WHERE u.class_id = ? AND a.date = ?`,
            [classId, date]
        );

        // Map attendance to students
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
            attendanceMap[record.student_id] = record.status;
        });

        const result = students.map(student => ({
            id: student.id,
            full_name: student.full_name,
            username: student.username,
            status: attendanceMap[student.id] || 'present' // Smart default
        }));

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.saveAttendance = async (req, res) => {
    const { date, records } = req.body; // records: [{student_id, status}]
    if (!date || !records || !Array.isArray(records)) {
        return res.status(400).json({ msg: 'Date and valid records array are required' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Verify class master
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }

        if (records.length === 0) {
            return res.json({ msg: 'No attendance to save' });
        }

        // Prepare values for bulk insert: (student_id, date, status)
        const values = records.map(r => [r.student_id, date, r.status]);

        // MySQL ON DUPLICATE KEY UPDATE syntax
        await pool.query(
            `INSERT INTO attendance (student_id, date, status) 
             VALUES ? 
             ON DUPLICATE KEY UPDATE status = VALUES(status)`,
            [values]
        );

        res.json({ msg: 'Attendance saved successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getSubjects = async (req, res) => {
    try {
        const [subjects] = await pool.query('SELECT id, name FROM subjects ORDER BY name ASC');
        res.json(subjects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getResults = async (req, res) => {
    const { subject_id, class_id, academic_term, academic_year } = req.query;

    if (!subject_id || !class_id || !academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Subject, Class, Term, and Year are required' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Check permission: either they are assigned in subject_assignments OR they are the Class Master of this class
        const [user] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        const masterClassId = user[0]?.class_id;

        const isAuthorizedClassMaster = masterClassId && parseInt(masterClassId) === parseInt(class_id);
        
        const [assignment] = await pool.query(
            'SELECT id FROM subject_assignments WHERE teacher_id = ? AND class_id = ? AND subject_id = ?',
            [req.user.id, class_id, subject_id]
        );

        if (!isAuthorizedClassMaster && assignment.length === 0) {
            return res.status(403).json({ msg: 'You are not authorized to grade this class and subject.' });
        }

        // Fetch students in this class
        const [students] = await pool.query(
            'SELECT id, full_name, username FROM users WHERE role = "student" AND class_id = ? ORDER BY full_name ASC',
            [class_id]
        );

        // Fetch existing results
        const [results] = await pool.query(
            `SELECT student_id, test_score, exam_score, total_score, grade 
             FROM results 
             WHERE subject_id = ? AND academic_term = ? AND academic_year = ? AND student_id IN (
                 SELECT id FROM users WHERE role = "student" AND class_id = ?
             )`,
            [subject_id, academic_term, academic_year, class_id]
        );

        const resultMap = {};
        results.forEach(r => {
            resultMap[r.student_id] = r;
        });

        const gradedStudents = students.map(student => ({
            id: student.id,
            full_name: student.full_name,
            username: student.username,
            test_score: resultMap[student.id]?.test_score ?? 0.00,
            exam_score: resultMap[student.id]?.exam_score ?? 0.00,
            total_score: resultMap[student.id]?.total_score ?? 0.00,
            grade: resultMap[student.id]?.grade ?? ''
        }));

        res.json(gradedStudents);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

function calculateGrade(total) {
    if (total >= 80) return 'A';
    if (total >= 60) return 'B';
    if (total >= 50) return 'C';
    if (total >= 45) return 'D';
    if (total >= 40) return 'E';
    return 'F';
}

exports.saveResults = async (req, res) => {
    const { subject_id, class_id, academic_term, academic_year, grades } = req.body;

    if (!subject_id || !class_id || !academic_term || !academic_year || !grades || !Array.isArray(grades)) {
        return res.status(400).json({ msg: 'Missing required grading parameters.' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Check permission: either they are assigned in subject_assignments OR they are the Class Master of this class
        const [user] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        const masterClassId = user[0]?.class_id;

        const isAuthorizedClassMaster = masterClassId && parseInt(masterClassId) === parseInt(class_id);
        
        const [assignment] = await pool.query(
            'SELECT id FROM subject_assignments WHERE teacher_id = ? AND class_id = ? AND subject_id = ?',
            [req.user.id, class_id, subject_id]
        );

        if (!isAuthorizedClassMaster && assignment.length === 0) {
            return res.status(403).json({ msg: 'You are not authorized to grade this class and subject.' });
        }

        if (grades.length === 0) {
            return res.json({ msg: 'No grades to save' });
        }

        const values = grades.map(g => {
            const test = parseFloat(g.test_score) || 0;
            const exam = parseFloat(g.exam_score) || 0;
            const total = test + exam;
            const grade = calculateGrade(total);

            return [
                g.student_id,
                subject_id,
                academic_term,
                academic_year,
                test,
                exam,
                total,
                grade,
                'draft',
                class_id
            ];
        });

        await pool.query(
            `INSERT INTO results (student_id, subject_id, academic_term, academic_year, test_score, exam_score, total_score, grade, status, class_id)
             VALUES ?
             ON DUPLICATE KEY UPDATE 
                test_score = VALUES(test_score),
                exam_score = VALUES(exam_score),
                total_score = VALUES(total_score),
                grade = VALUES(grade),
                status = VALUES(status),
                class_id = VALUES(class_id)`,
            [values]
        );

        res.json({ msg: 'Grades saved successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAssignedClassesAndSubjects = async (req, res) => {
    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Fetch assignments in subject_assignments
        const [assignments] = await pool.query(
            `SELECT sa.class_id, sa.subject_id, c.name AS class_name, s.name AS subject_name
             FROM subject_assignments sa
             JOIN classes c ON sa.class_id = c.id
             JOIN subjects s ON sa.subject_id = s.id
             WHERE sa.teacher_id = ?`,
            [req.user.id]
        );

        // Fetch their master class (if any) and all subjects so they have access to their own class subjects too
        const [user] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        const masterClassId = user[0]?.class_id;

        let masterClassAssignments = [];
        if (masterClassId) {
            const [classInfo] = await pool.query('SELECT name FROM classes WHERE id = ?', [masterClassId]);
            const className = classInfo[0]?.name;

            const [subjects] = await pool.query('SELECT id, name FROM subjects');
            
            masterClassAssignments = subjects.map(s => ({
                class_id: masterClassId,
                subject_id: s.id,
                class_name: className,
                subject_name: s.name,
                is_master_class: true
            }));
        }

        const allAssignments = [...assignments];
        
        masterClassAssignments.forEach(m => {
            const exists = allAssignments.some(a => a.class_id === m.class_id && a.subject_id === m.subject_id);
            if (!exists) {
                allAssignments.push(m);
            }
        });

        res.json(allAssignments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getTermRemarks = async (req, res) => {
    const { academic_term, academic_year } = req.query;

    if (!academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Term and Year are required.' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Get the master's class_id
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }
        const classId = masters[0].class_id;

        // Fetch students in this class
        const [students] = await pool.query(
            'SELECT id, full_name, username FROM users WHERE role = "student" AND class_id = ? ORDER BY full_name ASC',
            [classId]
        );

        // Fetch existing remarks
        const [remarks] = await pool.query(
            `SELECT student_id, class_master_remark, principal_remark,
                    punctuality, neatness, honesty, peer_relation, attentiveness,
                    perseverance, leadership, handwriting, sports, crafts,
                    days_open, days_present
             FROM term_remarks 
             WHERE academic_term = ? AND academic_year = ? AND student_id IN (
                 SELECT id FROM users WHERE role = "student" AND class_id = ?
             )`,
            [academic_term, academic_year, classId]
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
            principal_remark: remarksMap[student.id]?.principal_remark ?? '',
            punctuality: remarksMap[student.id]?.punctuality ?? null,
            neatness: remarksMap[student.id]?.neatness ?? null,
            honesty: remarksMap[student.id]?.honesty ?? null,
            peer_relation: remarksMap[student.id]?.peer_relation ?? null,
            attentiveness: remarksMap[student.id]?.attentiveness ?? null,
            perseverance: remarksMap[student.id]?.perseverance ?? null,
            leadership: remarksMap[student.id]?.leadership ?? null,
            handwriting: remarksMap[student.id]?.handwriting ?? null,
            sports: remarksMap[student.id]?.sports ?? null,
            crafts: remarksMap[student.id]?.crafts ?? null,
            days_open: remarksMap[student.id]?.days_open ?? null,
            days_present: remarksMap[student.id]?.days_present ?? null
        }));

        res.json(result);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.saveTermRemarks = async (req, res) => {
    const { 
        student_id, academic_term, academic_year, remark,
        punctuality, neatness, honesty, peer_relation, attentiveness,
        perseverance, leadership, handwriting, sports, crafts,
        days_open, days_present
    } = req.body;

    if (!student_id || !academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Student ID, Term, and Year are required.' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Get the master's class_id
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }
        const classId = masters[0].class_id;

        // Verify the student belongs to this class
        const [students] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = "student" AND class_id = ?',
            [student_id, classId]
        );
        if (students.length === 0) {
            return res.status(403).json({ msg: 'Unauthorized. This student is not in your class.' });
        }

        // Insert or update remark
        await pool.query(
            `INSERT INTO term_remarks (
                student_id, academic_term, academic_year, class_master_remark, class_id,
                punctuality, neatness, honesty, peer_relation, attentiveness,
                perseverance, leadership, handwriting, sports, crafts,
                days_open, days_present
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                class_master_remark = VALUES(class_master_remark), 
                class_id = VALUES(class_id),
                punctuality = VALUES(punctuality),
                neatness = VALUES(neatness),
                honesty = VALUES(honesty),
                peer_relation = VALUES(peer_relation),
                attentiveness = VALUES(attentiveness),
                perseverance = VALUES(perseverance),
                leadership = VALUES(leadership),
                handwriting = VALUES(handwriting),
                sports = VALUES(sports),
                crafts = VALUES(crafts),
                days_open = VALUES(days_open),
                days_present = VALUES(days_present)`,
            [
                student_id, academic_term, academic_year, remark, classId,
                punctuality ?? null, neatness ?? null, honesty ?? null, peer_relation ?? null, attentiveness ?? null,
                perseverance ?? null, leadership ?? null, handwriting ?? null, sports ?? null, crafts ?? null,
                days_open ?? null, days_present ?? null
            ]
        );

        res.json({ msg: 'Remark and ratings saved successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.bulkSaveTermRemarks = async (req, res) => {
    const { 
        academic_term, academic_year, remark,
        punctuality, neatness, honesty, peer_relation, attentiveness,
        perseverance, leadership, handwriting, sports, crafts,
        days_open, days_present
    } = req.body;

    if (!academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Term and Year are required.' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Get the master's class_id
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        if (masters.length === 0 || !masters[0].class_id) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }
        const classId = masters[0].class_id;

        // Fetch students in this class
        const [students] = await pool.query(
            'SELECT id FROM users WHERE role = "student" AND class_id = ?',
            [classId]
        );

        if (students.length === 0) {
            return res.status(400).json({ msg: 'No students registered in your class.' });
        }

        // For each student, insert or update remark in bulk
        for (let s of students) {
            await pool.query(
                `INSERT INTO term_remarks (
                    student_id, academic_term, academic_year, class_master_remark, class_id,
                    punctuality, neatness, honesty, peer_relation, attentiveness,
                    perseverance, leadership, handwriting, sports, crafts,
                    days_open, days_present
                 )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    class_master_remark = VALUES(class_master_remark), 
                    class_id = VALUES(class_id),
                    punctuality = VALUES(punctuality),
                    neatness = VALUES(neatness),
                    honesty = VALUES(honesty),
                    peer_relation = VALUES(peer_relation),
                    attentiveness = VALUES(attentiveness),
                    perseverance = VALUES(perseverance),
                    leadership = VALUES(leadership),
                    handwriting = VALUES(handwriting),
                    sports = VALUES(sports),
                    crafts = VALUES(crafts),
                    days_open = VALUES(days_open),
                    days_present = VALUES(days_present)`,
                [
                    s.id, academic_term, academic_year, remark, classId,
                    punctuality ?? null, neatness ?? null, honesty ?? null, peer_relation ?? null, attentiveness ?? null,
                    perseverance ?? null, leadership ?? null, handwriting ?? null, sports ?? null, crafts ?? null,
                    days_open ?? null, days_present ?? null
                ]
            );
        }

        res.json({ msg: 'Bulk remark and ratings saved successfully for the entire class!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.getStudentResults = async (req, res) => {
    const { student_id, academic_term, academic_year } = req.query;

    if (!student_id || !academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Student ID, Term, and Year are required' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Verify class master can access this student
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        const classId = masters[0]?.class_id;

        if (!classId) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }

        const [studentCheck] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = "student" AND class_id = ?',
            [student_id, classId]
        );
        if (studentCheck.length === 0) {
            return res.status(403).json({ msg: 'Unauthorized. Student is not in your class.' });
        }

        // Fetch all subjects and join with existing results for this student
        const [results] = await pool.query(
            `SELECT 
                s.id AS subject_id, 
                s.name AS subject_name,
                r.id AS result_id,
                COALESCE(r.test_score, 0.00) AS test_score,
                COALESCE(r.test2_score, 0.00) AS test2_score,
                COALESCE(r.other_ca_score, 0.00) AS other_ca_score,
                COALESCE(r.exam_score, 0.00) AS exam_score,
                COALESCE(r.total_score, 0.00) AS total_score,
                COALESCE(r.grade, '') AS grade,
                COALESCE(r.status, 'draft') AS status
             FROM subjects s
             LEFT JOIN results r ON r.subject_id = s.id 
                 AND r.student_id = ? 
                 AND r.academic_term = ? 
                 AND r.academic_year = ?
             ORDER BY s.name ASC`,
            [student_id, academic_term, academic_year]
        );

        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.saveStudentResults = async (req, res) => {
    const { student_id, academic_term, academic_year, grades } = req.body;

    if (!student_id || !academic_term || !academic_year || !grades || !Array.isArray(grades)) {
        return res.status(400).json({ msg: 'Missing required grading parameters.' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Verify class master can access this student
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        const classId = masters[0]?.class_id;

        if (!classId) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }

        const [studentCheck] = await pool.query(
            'SELECT id FROM users WHERE id = ? AND role = "student" AND class_id = ?',
            [student_id, classId]
        );
        if (studentCheck.length === 0) {
            return res.status(403).json({ msg: 'Unauthorized. Student is not in your class.' });
        }

        if (grades.length === 0) {
            return res.json({ msg: 'No grades to save' });
        }

        const values = grades.map(g => {
            const test = parseFloat(g.test_score) || 0;
            const test2 = parseFloat(g.test2_score) || 0;
            const other_ca = parseFloat(g.other_ca_score) || 0;
            const exam = parseFloat(g.exam_score) || 0;
            const total = test + test2 + other_ca + exam;
            const grade = calculateGrade(total);

            return [
                student_id,
                g.subject_id,
                academic_term,
                academic_year,
                test,
                test2,
                other_ca,
                exam,
                total,
                grade,
                'draft',
                classId
            ];
        });

        await pool.query(
            `INSERT INTO results (student_id, subject_id, academic_term, academic_year, test_score, test2_score, other_ca_score, exam_score, total_score, grade, status, class_id)
             VALUES ?
             ON DUPLICATE KEY UPDATE 
                test_score = VALUES(test_score),
                test2_score = VALUES(test2_score),
                other_ca_score = VALUES(other_ca_score),
                exam_score = VALUES(exam_score),
                total_score = VALUES(total_score),
                grade = VALUES(grade),
                status = VALUES(status),
                class_id = VALUES(class_id)`,
            [values]
        );

        res.json({ msg: 'Student report card table saved successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.submitClassResults = async (req, res) => {
    const { academic_term, academic_year } = req.body;

    if (!academic_term || !academic_year) {
        return res.status(400).json({ msg: 'Term and Year are required.' });
    }

    try {
        if (req.user.role !== 'class_master') {
            return res.status(403).json({ msg: 'Access denied. Class master only.' });
        }

        // Get master's class_id
        const [masters] = await pool.query('SELECT class_id FROM users WHERE id = ?', [req.user.id]);
        const classId = masters[0]?.class_id;

        if (!classId) {
            return res.status(400).json({ msg: 'You are not assigned to a class.' });
        }

        // Update all results for this class, term, and year from 'draft' to 'submitted'
        await pool.query(
            `UPDATE results r
             JOIN users u ON r.student_id = u.id
             SET r.status = 'submitted'
             WHERE u.class_id = ? AND r.academic_term = ? AND r.academic_year = ? AND r.status = 'draft'`,
            [classId, academic_term, academic_year]
        );

        res.json({ msg: 'Class results submitted to Exams Office successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
