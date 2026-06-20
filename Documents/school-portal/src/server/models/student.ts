import { Schema, model } from 'mongoose';

const studentSchema = new Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  studentClass: {
    type: String,
    required: true,
  },
  subjects: [{
    subject: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
    },
    remarks: {
      type: String,
    },
  }],
}, { timestamps: true });

studentSchema.methods.calculateGrade = function(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

studentSchema.methods.getRemarks = function(score) {
  return score >= 60 ? 'Pass' : 'Fail';
};

const Student = model('Student', studentSchema);

export default Student;