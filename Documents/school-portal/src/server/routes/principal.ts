import { Router } from 'express';
import PrincipalController from '../controllers/principalController';

const router = Router();
const principalController = new PrincipalController();

// Route to view reports
router.get('/reports', principalController.viewReports);

// Route to manage school operations
router.post('/manage', principalController.manageOperations);

// Additional routes can be added here

export default router;