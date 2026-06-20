const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const examOfficerController = require('../controllers/examOfficerController');

// Protect all exam officer routes
router.use(authMiddleware);

// Stats
router.get('/stats', examOfficerController.getStats);

// Classes CRUD
router.get('/classes', examOfficerController.getClasses);
router.post('/classes', examOfficerController.addClass);
router.delete('/classes/:id', examOfficerController.deleteClass);

// Subjects CRUD
router.get('/subjects', examOfficerController.getSubjects);
router.post('/subjects', examOfficerController.addSubject);
router.delete('/subjects/:id', examOfficerController.deleteSubject);

// Grade Sheet approvals
router.get('/sheets', examOfficerController.getGradeSheets);
router.get('/sheet-details', examOfficerController.getGradeSheetDetails);
router.post('/finalize-sheet', examOfficerController.finalizeGradeSheet);

// Graduates & Certificates management
router.get('/students', examOfficerController.getStudents);
router.get('/students/:student_id/history', examOfficerController.getStudentAcademicHistory);
router.get('/students/:student_id/testimonial', examOfficerController.getTestimonial);
router.post('/students/testimonial', examOfficerController.saveTestimonial);

module.exports = router;
