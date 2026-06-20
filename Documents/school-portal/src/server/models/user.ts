import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  username: string;
  password: string;
  role: 'principal' | 'student' | 'classMaster' | 'examOfficer';
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['principal', 'student', 'classMaster', 'examOfficer'], required: true },
  email: { type: String, required: true, unique: true },
}, {
  timestamps: true,
});

const User = model<IUser>('User', userSchema);

export default User;