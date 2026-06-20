const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Role restriction helper
const verifyBursar = (req, res, next) => {
    if (req.user && (req.user.role === 'bursar' || req.user.role === 'principal')) {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Bursar or Principal privileges required.' });
    }
};

// --- PUBLIC CALLBACKS & WEBHOOKS (NO AUTH REQUIRED TO ALLOW REMITA POSTS) ---
router.get('/callback', paymentController.handleCallback);
router.post('/webhook', paymentController.handleWebhook);

// --- PROTECTED ROUTES (STUDENTS, BURSARS & ADMINS) ---
router.use(authMiddleware);

// Student Routes
router.get('/fees', paymentController.getStudentFees);
router.post('/initialize', paymentController.initializePayment);
router.get('/verify/:orderId', paymentController.verifyPaymentStatus);
router.get('/history', paymentController.getPaymentHistory);
router.get('/receipt/:paymentId', paymentController.getReceiptDetails);

// Bursar / Admin Routes
router.get('/bursar/stats', verifyBursar, paymentController.getBursarStats);
router.get('/bursar/reports', verifyBursar, paymentController.getBursarReports);
router.post('/bursar/configure-fee', verifyBursar, paymentController.configureFee);

module.exports = router;
