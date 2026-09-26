import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import MasterDashboard from './pages/MasterDashboard';
import ExamOfficerDashboard from './pages/ExamOfficerDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import BursarDashboard from './pages/BursarDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes – each locked to specific role(s) only */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute
              allowedRoles={['student']}
              element={<StudentDashboard />}
            />
          }
        />
        <Route
          path="/master/*"
          element={
            <ProtectedRoute
              allowedRoles={['class_master', 'subject_teacher']}
              element={<MasterDashboard />}
            />
          }
        />
        <Route
          path="/exam-officer/*"
          element={
            <ProtectedRoute
              allowedRoles={['exam_officer']}
              element={<ExamOfficerDashboard />}
            />
          }
        />
        <Route
          path="/principal/*"
          element={
            <ProtectedRoute
              allowedRoles={['principal']}
              element={<PrincipalDashboard />}
            />
          }
        />
        <Route
          path="/bursar/*"
          element={
            <ProtectedRoute
              allowedRoles={['bursar']}
              element={<BursarDashboard />}
            />
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute
              allowedRoles={['admin']}
              element={<AdminDashboard />}
            />
          }
        />

        {/* Fallback – redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Catch-all for unknown paths */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
