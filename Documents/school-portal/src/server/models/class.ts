import { Schema, model } from 'mongoose';

const classSchema = new Schema({
  className: {
    type: String,
    required: true,
    trim: true,
  },
  classTeacher: {
    type: String,
    required: true,
    trim: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'Student',
  }],
  schedule: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const Class = model('Class', classSchema);

export default Class;