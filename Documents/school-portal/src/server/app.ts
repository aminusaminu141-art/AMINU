import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import principalRoutes from './routes/principal';
import studentRoutes from './routes/student';
import classMasterRoutes from './routes/classMaster';
import examOfficerRoutes from './routes/examOfficer';
import { connectDB } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/classMaster', classMasterRoutes);
app.use('/api/examOfficer', examOfficerRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});