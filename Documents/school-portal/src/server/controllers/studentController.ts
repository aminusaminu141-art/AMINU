import { Request, Response } from 'express';
import { Student } from '../models/student';

export class StudentController {
  async getAllStudents(req: Request, res: Response) {
    try {
      const students = await Student.find();
      res.status(200).json(students);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving students', error });
    }
  }

  async getStudentById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.status(200).json(student);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving student', error });
    }
  }

  async createStudent(req: Request, res: Response) {
    const studentData = req.body;
    try {
      const newStudent = new Student(studentData);
      await newStudent.save();
      res.status(201).json(newStudent);
    } catch (error) {
      res.status(400).json({ message: 'Error creating student', error });
    }
  }

  async updateStudent(req: Request, res: Response) {
    const { id } = req.params;
    const studentData = req.body;
    try {
      const updatedStudent = await Student.findByIdAndUpdate(id, studentData, { new: true });
      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.status(200).json(updatedStudent);
    } catch (error) {
      res.status(400).json({ message: 'Error updating student', error });
    }
  }

  async deleteStudent(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const deletedStudent = await Student.findByIdAndDelete(id);
      if (!deletedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting student', error });
    }
  }
}