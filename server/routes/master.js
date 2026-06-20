const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const masterController = require('../controllers/masterController');

// All master routes are protected by authMiddleware
router.use(authMiddleware);

// Get all students in the master's class
router.get('/students', masterController.getStudents);

// Add a new student to the master's class
router.post('/students', masterController.addStudent);

// Remove a student from the master's class
router.delete('/students/:id', masterController.removeStudent);

// Get attendance for a specific date
router.get('/attendance', masterController.getAttendance);

// Save attendance for a specific date
router.post('/attendance', masterController.saveAttendance);

// Get list of all subjects
router.get('/subjects', masterController.getSubjects);

// Get list of assigned classes and subjects
router.get('/assigned-classes-subjects', masterController.getAssignedClassesAndSubjects);

// Get results for a subject, term, and year
router.get('/results', masterController.getResults);

// Save results
router.post('/results', masterController.saveResults);

// Get student-wise results ( Kano State report card style )
router.get('/student-results', masterController.getStudentResults);
router.post('/student-results', masterController.saveStudentResults);
router.post('/submit-class-results', masterController.submitClassResults);

// Get remarks for students in master's class
router.get('/term-remarks', masterController.getTermRemarks);

// Save remark for a student
router.post('/term-remarks', masterController.saveTermRemarks);

// Save remarks in bulk for the whole class
router.post('/bulk-term-remarks', masterController.bulkSaveTermRemarks);

module.exports = router;
