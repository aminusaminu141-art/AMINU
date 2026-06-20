import { Request, Response } from 'express';
import { Exam } from '../models/exam';

export class ExamOfficerController {
  async createExam(req: Request, res: Response) {
    try {
      const examData = req.body;
      const exam = new Exam(examData);
      await exam.save();
      res.status(201).json({ message: 'Exam created successfully', exam });
    } catch (error) {
      res.status(500).json({ message: 'Error creating exam', error });
    }
  }

  async getExams(req: Request, res: Response) {
    try {
      const exams = await Exam.find();
      res.status(200).json(exams);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching exams', error });
    }
  }

  async updateExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const examData = req.body;
      const exam = await Exam.findByIdAndUpdate(id, examData, { new: true });
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      res.status(200).json({ message: 'Exam updated successfully', exam });
    } catch (error) {
      res.status(500).json({ message: 'Error updating exam', error });
    }
  }

  async deleteExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const exam = await Exam.findByIdAndDelete(id);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      res.status(200).json({ message: 'Exam deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting exam', error });
    }
  }
}