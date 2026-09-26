const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController');

// Protect all student routes
router.use(authMiddleware);

// Get student attendance metrics and history
router.get('/attendance', studentController.getAttendance);

// Get student finalized results
router.get('/results', studentController.getResults);

// Get term-specific report card including position and remarks
router.get('/term-report', studentController.getTermReport);

// Get full academic transcript / history
router.get('/academic-history', studentController.getAcademicHistory);

module.exports = router;
