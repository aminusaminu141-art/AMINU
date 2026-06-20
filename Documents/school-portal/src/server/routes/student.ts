import { Router } from 'express';
import StudentController from '../controllers/studentController';

const router = Router();
const studentController = new StudentController();

// Route to get all students
router.get('/', studentController.getAllStudents);

// Route to get a specific student by ID
router.get('/:id', studentController.getStudentById);

// Route to create a new student
router.post('/', studentController.createStudent);

// Route to update an existing student
router.put('/:id', studentController.updateStudent);

// Route to delete a student
router.delete('/:id', studentController.deleteStudent);

export default router;