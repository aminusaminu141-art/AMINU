import { Router } from 'express';
import { login, register } from '../controllers/authController';

const router = Router();

// Route for user login
router.post('/login', login);

// Route for user registration
router.post('/register', register);

export default router;