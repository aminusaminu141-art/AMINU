const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const principalController = require('../controllers/principalController');

// All Principal routes are protected by authMiddleware
router.use(authMiddleware);

// Get list of Class Masters
router.get('/masters', principalController.getClassMasters);

// Get list of all Classes
router.get('/classes', principalController.getClasses);

// Add a new Class Master
router.post('/masters', principalController.addClassMaster);

// Remove a Class Master
router.delete('/masters/:id', principalController.removeClassMaster);

// Get list of all Subjects
router.get('/subjects', principalController.getSubjects);

// Manage assignments
router.get('/assignments', principalController.getAssignments);
router.post('/assignments', principalController.addAssignment);
router.delete('/assignments/:id', principalController.deleteAssignment);

// Get remarks for students in a class
router.get('/term-remarks', principalController.getTermRemarks);

// Save principal remark for a student
router.post('/term-remarks', principalController.saveTermRemarks);

// Save principal remarks in bulk for the whole class
router.post('/bulk-term-remarks', principalController.bulkSaveTermRemarks);

// Get list of all students for the principal
router.get('/students', principalController.getStudents);

// Get specific student academic history for transcripts
router.get('/students/:student_id/history', principalController.getStudentAcademicHistory);

// Get testimonial details
router.get('/students/:student_id/testimonial', principalController.getTestimonial);

// Save testimonial details
router.post('/students/testimonial', principalController.saveTestimonial);

module.exports = router;
