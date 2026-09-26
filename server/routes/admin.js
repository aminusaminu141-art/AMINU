const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Helper middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Administrator privileges required.' });
    }
};

// All admin routes require authentication and admin privileges
router.use(authMiddleware);
router.use(verifyAdmin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// User management routes
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/classes', adminController.getClasses);
router.get('/class-rankings', adminController.getClassRankings);

module.exports = router;
