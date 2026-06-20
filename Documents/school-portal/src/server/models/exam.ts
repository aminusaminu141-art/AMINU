import { Schema, model } from 'mongoose';

const examSchema = new Schema({
  subject: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true, // duration in minutes
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  results: [{
    studentId: {
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
});

const Exam = model('Exam', examSchema);

export default Exam;