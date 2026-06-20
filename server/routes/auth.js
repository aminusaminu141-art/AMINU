const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post(
    '/register',
    [
        check('full_name', 'Full name is required').not().isEmpty(),
        check('username', 'Username is required').not().isEmpty(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        check('role', 'Role is required').isIn(['student', 'class_master', 'exam_officer', 'principal'])
    ],
    authController.register
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('username', 'Please include a valid username').exists(),
        check('password', 'Password is required').exists()
    ],
    authController.login
);

module.exports = router;
