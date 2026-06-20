import { Router } from 'express';
import ClassMasterController from '../controllers/classMasterController';

const router = Router();
const classMasterController = new ClassMasterController();

// Route to get all class schedules
router.get('/schedules', classMasterController.getAllSchedules);

// Route to get a specific class schedule by ID
router.get('/schedules/:id', classMasterController.getScheduleById);

// Route to create a new class schedule
router.post('/schedules', classMasterController.createSchedule);

// Route to update an existing class schedule
router.put('/schedules/:id', classMasterController.updateSchedule);

// Route to delete a class schedule
router.delete('/schedules/:id', classMasterController.deleteSchedule);

// Route to manage student attendance
router.post('/attendance', classMasterController.markAttendance);

export default router;