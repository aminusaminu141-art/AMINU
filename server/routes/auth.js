const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @access  Public
router.post(
    '/register',
    [
        check('full_name', 'Full name is required').not().isEmpty(),
        check('username', 'Username is required').not().isEmpty(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        check('role', 'Role is required').isIn(['student', 'class_master', 'subject_teacher', 'exam_officer', 'principal', 'bursar', 'admin'])
    ],
    authController.register
);

// @route   POST /api/auth/login
// @access  Public
router.post(
    '/login',
    [
        check('username', 'Please include a valid username').exists(),
        check('password', 'Password is required').exists()
    ],
    authController.login
);

// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', authMiddleware, authController.getProfile);

// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;

