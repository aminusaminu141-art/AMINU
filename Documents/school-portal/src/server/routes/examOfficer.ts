import { Router } from 'express';
import ExamOfficerController from '../controllers/examOfficerController';

const router = Router();
const examOfficerController = new ExamOfficerController();

// Route to manage exam schedules
router.post('/schedules', examOfficerController.createSchedule);
router.get('/schedules', examOfficerController.getSchedules);
router.put('/schedules/:id', examOfficerController.updateSchedule);
router.delete('/schedules/:id', examOfficerController.deleteSchedule);

// Route to manage exam results
router.post('/results', examOfficerController.createResult);
router.get('/results', examOfficerController.getResults);
router.put('/results/:id', examOfficerController.updateResult);
router.delete('/results/:id', examOfficerController.deleteResult);

export default router;