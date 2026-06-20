import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import MasterDashboard from './pages/MasterDashboard';
import ExamOfficerDashboard from './pages/ExamOfficerDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/student/*" element={<StudentDashboard />} />
        <Route path="/master/*" element={<MasterDashboard />} />
        <Route path="/exam-officer/*" element={<ExamOfficerDashboard />} />
        <Route path="/principal/*" element={<PrincipalDashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
