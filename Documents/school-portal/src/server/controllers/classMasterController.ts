import { Request, Response } from 'express';
import { Class } from '../models/class';

export class ClassMasterController {
  async getClassSchedules(req: Request, res: Response) {
    try {
      const schedules = await Class.find(); // Assuming Class model has a method to get schedules
      res.status(200).json(schedules);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving class schedules', error });
    }
  }

  async markAttendance(req: Request, res: Response) {
    const { classId, studentId, status } = req.body;
    try {
      const classRecord = await Class.findById(classId);
      if (!classRecord) {
        return res.status(404).json({ message: 'Class not found' });
      }
      // Logic to mark attendance
      classRecord.attendance.push({ studentId, status });
      await classRecord.save();
      res.status(200).json({ message: 'Attendance marked successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error marking attendance', error });
    }
  }

  async updateClassSchedule(req: Request, res: Response) {
    const { classId, schedule } = req.body;
    try {
      const classRecord = await Class.findByIdAndUpdate(classId, { schedule }, { new: true });
      if (!classRecord) {
        return res.status(404).json({ message: 'Class not found' });
      }
      res.status(200).json(classRecord);
    } catch (error) {
      res.status(500).json({ message: 'Error updating class schedule', error });
    }
  }
}