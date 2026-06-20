import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const formatPosition = (pos) => {
  if (!pos) return '';
  const n = parseInt(pos);
  if (isNaN(n)) return pos;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const isGraduatingClass = (clsName) => {
  if (!clsName) return false;
  const name = clsName.toUpperCase();
  const isPrimary5 = name.includes('PRIMARY 5') || name.includes('PRIMARY5');
  const isSS3 = (name.includes('SS 3') || name.includes('SS3')) && !name.includes('JSS');
  return isPrimary5 || isSS3;
};


export default function ExamOfficerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ classes: 0, subjects: 0, pending_approvals: 0 });
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeSheets, setGradeSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sync activeTab with URL routing paths
  let activeTab = 'overview';
  if (location.pathname === '/exam-officer/classes') {
    activeTab = 'classes';
  } else if (location.pathname === '/exam-officer/subjects') {
    activeTab = 'subjects';
  } else if (location.pathname === '/exam-officer/results') {
    activeTab = 'approvals';
  } else if (location.pathname === '/exam-officer/graduates') {
    activeTab = 'graduates';
  }

  // Modal / Detail State for Grade Inspecting
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetDetails, setSheetDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // New Entity States
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingClass, setAddingClass] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);

  // Graduates & Certificates panel states
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [gradViewMode, setGradViewMode] = useState('list'); // 'list' | 'transcript' | 'certificate' | 'testimonial'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState(null);
  const [loadingStudentHistory, setLoadingStudentHistory] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [selectedTermFilter, setSelectedTermFilter] = useState('All');
  const [testimonialData, setTestimonialData] = useState({
    date_issued: new Date().toISOString().split('T')[0],
    conduct: 'Excellent',
    academic_performance: 'Hardworking and Diligent',
    sports_extracurricular: 'Active Participant in Football and Athletics',
    general_remarks: 'An outstanding student who is highly recommended for higher studies.'
  });
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState({});
  const [expandedManageClasses, setExpandedManageClasses] = useState({});

  useEffect(() => {
    if (students && students.length > 0) {
      const initialExpanded = {};
      students.forEach(s => {
        const cls = s.class_name || 'Unassigned / Graduates';
        initialExpanded[cls] = true;
      });
      setExpandedClasses(initialExpanded);
    }
  }, [students]);

  useEffect(() => {
    if (classes && classes.length > 0) {
      const initialExpanded = {};
      classes.forEach(c => {
        initialExpanded[c.name] = true;
      });
      setExpandedManageClasses(initialExpanded);
    }
  }, [classes]);

  const toggleClass = (className) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  const toggleManageClass = (className) => {
    setExpandedManageClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'graduates' || activeTab === 'classes') {
      fetchStudents();
      if (activeTab === 'graduates') {
        setGradViewMode('list');
      }
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, classesRes, subjectsRes, sheetsRes] = await Promise.all([
        axios.get('/api/exam-officer/stats', { headers }),
        axios.get('/api/exam-officer/classes', { headers }),
        axios.get('/api/exam-officer/subjects', { headers }),
        axios.get('/api/exam-officer/sheets', { headers })
      ]);

      setStats(statsRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setGradeSheets(sheetsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Exam Officer data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setAddingClass(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/exam-officer/classes',
        { name: newClassName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewClassName('');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add class.');
    } finally {
      setAddingClass(false);
    }
  };

  const handleDeleteClass = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete class ${name}? This will affect registered students.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/exam-officer/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete class.');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    setAddingSubject(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/exam-officer/subjects',
        { name: newSubjectName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewSubjectName('');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add subject.');
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete subject ${name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/exam-officer/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete subject.');
    }
  };

  const inspectSheet = async (sheet) => {
    setSelectedSheet(sheet);
    setLoadingDetails(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/api/exam-officer/sheet-details?class_id=${sheet.class_id}&term=${encodeURIComponent(sheet.academic_term)}&year=${encodeURIComponent(sheet.academic_year)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSheetDetails(res.data);
    } catch (err) {
      setError('Failed to fetch details for this grade sheet.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const finalizeSheet = async () => {
    if (!selectedSheet) return;
    setFinalizing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/exam-officer/finalize-sheet',
        {
          class_id: selectedSheet.class_id,
          term: selectedSheet.academic_term,
          year: selectedSheet.academic_year
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedSheet(null);
      setSheetDetails([]);
      fetchDashboardData();
    } catch (err) {
      setError('Failed to finalize and publish grades.');
    } finally {
      setFinalizing(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/exam-officer/students', { headers });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch students list.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleViewHistory = async (student) => {
    setSelectedStudent(student);
    setStudentHistory(null);
    setLoadingStudentHistory(true);
    setGradViewMode('transcript');
    setSelectedClassFilter('All');
    setSelectedTermFilter('All');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/exam-officer/students/${student.id}/history`, { headers });
      setStudentHistory(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load student academic history.');
    } finally {
      setLoadingStudentHistory(false);
    }
  };

  const handleOpenCertificate = async (student) => {
    setSelectedStudent(student);
    setStudentHistory(null);
    setLoadingStudentHistory(true);
    setGradViewMode('certificate');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/exam-officer/students/${student.id}/history`, { headers });
      setStudentHistory(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load student details for certificate.');
    } finally {
      setLoadingStudentHistory(false);
    }
  };

  const handleOpenTestimonial = async (student) => {
    setSelectedStudent(student);
    setGradViewMode('testimonial');
    setLoadingStudentHistory(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/exam-officer/students/${student.id}/testimonial`, { headers });
      if (res.data) {
        setTestimonialData({
          date_issued: res.data.date_issued ? res.data.date_issued.split('T')[0] : new Date().toISOString().split('T')[0],
          conduct: res.data.conduct || 'Excellent',
          academic_performance: res.data.academic_performance || 'Hardworking and Diligent',
          sports_extracurricular: res.data.sports_extracurricular || 'Active Participant in Football and Athletics',
          general_remarks: res.data.general_remarks || 'An outstanding student who is highly recommended for higher studies.'
        });
      } else {
        setTestimonialData({
          date_issued: new Date().toISOString().split('T')[0],
          conduct: 'Excellent',
          academic_performance: 'Hardworking and Diligent',
          sports_extracurricular: 'Active Participant in Football and Athletics',
          general_remarks: 'An outstanding student who is highly recommended for higher studies.'
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load testimonial details.');
    } finally {
      setLoadingStudentHistory(false);
    }
  };

  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    setSavingTestimonial(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/exam-officer/students/testimonial', {
        student_id: selectedStudent.id,
        ...testimonialData
      }, { headers });
      alert('Testimonial saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save testimonial.');
    } finally {
      setSavingTestimonial(false);
    }
  };

  return (
    <DashboardLayout title="Exam Officer Dashboard" role="exam_officer">
      
      {/* Stats Summary Cards */}
      <div className="grid-responsive mb-lg">
        <div className="dashboard-card">
          <h3 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>Pending Approvals</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--color-accent)' }}>{loading ? '...' : stats.pending_approvals}</p>
          <p style={{ margin: 'var(--space-sm) 0 0 0', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>Results awaiting publishing</p>
        </div>

        <div className="dashboard-card">
          <h3 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>Total Subjects</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{loading ? '...' : stats.subjects}</p>
          <p style={{ margin: 'var(--space-sm) 0 0 0', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>Registered subjects</p>
        </div>

        <div className="dashboard-card">
          <h3 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>Total Classes</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{loading ? '...' : stats.classes}</p>
          <p style={{ margin: 'var(--space-sm) 0 0 0', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>Active classes</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex-row gap-md no-print" style={{ borderBottom: '1.5px solid var(--color-border)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <button 
          onClick={() => navigate('/exam-officer')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'overview' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'overview' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Portal Overview
        </button>
        <button 
          onClick={() => navigate('/exam-officer/classes')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'classes' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'classes' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Manage Classes
        </button>
        <button 
          onClick={() => navigate('/exam-officer/subjects')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'subjects' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'subjects' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Manage Subjects
        </button>
        <button 
          onClick={() => navigate('/exam-officer/results')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'approvals' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'approvals' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Grade Approvals
        </button>
        <button 
          onClick={() => navigate('/exam-officer/graduates')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'graduates' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'graduates' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Graduates & Certs
        </button>
      </div>

      <div>
        {error && <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

        {/* --- 1. OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Welcome, Exams Officer</h3>
            <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
              From this portal you are in charge of coordinating curriculum objects (Classes and Subjects) as well as verifying and publishing students' grades.
            </p>
            <div style={{ marginTop: '20px', background: '#f7fafc', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4318FF' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2b3674' }}>Getting Started</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#4a5568', lineHeight: '1.8' }}>
                <li>Navigate to <strong>Manage Classes</strong> or <strong>Manage Subjects</strong> to edit curriculum components.</li>
                <li>Go to <strong>Grade Approvals</strong> to publish scores recorded by teachers to the student portals.</li>
              </ul>
            </div>
          </div>
        )}

        {/* --- 2. MANAGE CLASSES --- */}
        {activeTab === 'classes' && (
          <>
            {/* Create Class Form */}
            <div className="dashboard-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Add New Class</h3>
              <form onSubmit={handleAddClass} style={{ display: 'flex', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. Nursery 2, JSS 2, SS 3 Science" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                  required
                />
                <button 
                  type="submit" 
                  disabled={addingClass}
                  style={{ 
                    padding: '10px 20px', background: '#4318FF', color: 'white', 
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  {addingClass ? 'Adding...' : 'Create Class'}
                </button>
              </form>
            </div>

            {/* Classes List */}
            <div className="dashboard-card">
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Classes List</h3>
              {loading ? (
                <p>Loading classes...</p>
              ) : classes.length === 0 ? (
                <p>No classes registered yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {classes.map(c => {
                    const classStudents = students.filter(student => student.class_id === c.id);
                    const isOpen = expandedManageClasses[c.name] ?? true;

                    return (
                      <div 
                        key={c.id} 
                        style={{ 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          overflow: 'hidden', 
                          background: '#ffffff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Class Header */}
                        <div 
                          onClick={() => toggleManageClass(c.name)}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '12px 18px', 
                            backgroundColor: '#f7fafc', 
                            borderBottom: isOpen ? '1px solid #e2e8f0' : 'none', 
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#edf2f7'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🏫</span>
                            <h4 style={{ margin: 0, color: '#2b3674', fontSize: '1rem', fontWeight: 'bold' }}>
                              {c.name}
                            </h4>
                            <span style={{ 
                              padding: '2px 8px', 
                              background: '#e2e8f0', 
                              color: '#4a5568', 
                              borderRadius: '12px', 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold' 
                            }}>
                              {classStudents.length} {classStudents.length === 1 ? 'Student' : 'Students'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClass(c.id, c.name);
                              }}
                              style={{ 
                                background: '#ffebee', 
                                color: '#d32f2f', 
                                border: 'none', 
                                padding: '6px 12px', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                fontWeight: 'bold', 
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>🗑️</span> Delete Class
                            </button>
                            <span style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.8rem', color: '#a0aec0' }}>
                              ▶
                            </span>
                          </div>
                        </div>

                        {/* Class Students Table */}
                        {isOpen && (
                          <div style={{ padding: '15px 18px', overflowX: 'auto' }}>
                            {classStudents.length === 0 ? (
                              <p style={{ color: '#718096', fontSize: '0.9rem', margin: 0 }}>
                                No students registered in this class.
                              </p>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '10px' }}>Full Name</th>
                                    <th style={{ padding: '10px' }}>Login ID</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classStudents.map(student => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                                      <td style={{ padding: '10px', fontWeight: '500', color: '#2b3674' }}>{student.full_name}</td>
                                      <td style={{ padding: '10px', color: '#4a5568' }}>{student.username}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* --- 3. MANAGE SUBJECTS --- */}
        {activeTab === 'subjects' && (
          <>
            {/* Create Subject Form */}
            <div className="dashboard-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Add New Subject</h3>
              <form onSubmit={handleAddSubject} style={{ display: 'flex', gap: '15px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. Mathematics, Basic Science, Chemistry" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                  required
                />
                <button 
                  type="submit" 
                  disabled={addingSubject}
                  style={{ 
                    padding: '10px 20px', background: '#4318FF', color: 'white', 
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  {addingSubject ? 'Adding...' : 'Create Subject'}
                </button>
              </form>
            </div>

            {/* Subjects Table */}
            <div className="dashboard-card">
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Subjects List</h3>
              {loading ? (
                <p>Loading subjects...</p>
              ) : subjects.length === 0 ? (
                <p>No subjects registered yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                        <th style={{ padding: '12px' }}>Subject Name</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#2b3674' }}>{s.name}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleDeleteSubject(s.id, s.name)}
                              style={{ 
                                background: '#ffebee', color: '#d32f2f', border: 'none', 
                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                fontWeight: 'bold', fontSize: '0.85rem'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* --- 4. GRADE APPROVALS --- */}
        {activeTab === 'approvals' && (
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Recorded Grades Sheets</h3>
            {loading ? (
              <p>Loading grade sheets...</p>
            ) : gradeSheets.length === 0 ? (
              <p>No academic grade sheets have been recorded by teachers yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                      <th style={{ padding: '12px' }}>Class Name</th>
                      <th style={{ padding: '12px' }}>Term</th>
                      <th style={{ padding: '12px' }}>Year</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Graded Students</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Subjects Graded</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradeSheets.map((sheet, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#2b3674' }}>{sheet.class_name}</td>
                        <td style={{ padding: '12px', color: '#4a5568' }}>{sheet.academic_term}</td>
                        <td style={{ padding: '12px', color: '#4a5568' }}>{sheet.academic_year}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{sheet.student_count}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{sheet.subject_count}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem',
                            backgroundColor: sheet.status === 'finalized' ? '#e6fffa' : sheet.status === 'submitted' ? '#ffe8cc' : '#f7fafc',
                            color: sheet.status === 'finalized' ? '#047457' : sheet.status === 'submitted' ? '#d97706' : '#4a5568'
                          }}>
                            {sheet.status === 'finalized' ? 'Published' : sheet.status === 'submitted' ? 'Pending Approval' : 'Draft'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button 
                            onClick={() => inspectSheet(sheet)}
                            style={{ 
                              background: '#e6f4ff', color: '#096dd9', border: 'none', 
                              padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                              fontWeight: 'bold', fontSize: '0.85rem'
                            }}
                          >
                            Inspect & Publish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INSPECT GRADE SHEET MODAL */}
      {selectedSheet && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '1000px', maxHeight: '80%', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#2b3674' }}>
                Review Sheet: {selectedSheet.class_name} Results
              </h3>
              <button 
                onClick={() => setSelectedSheet(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0aec0' }}
              >
                &times;
              </button>
            </div>

            <p style={{ color: '#718096', margin: '0 0 20px 0' }}>
              Term: <strong>{selectedSheet.academic_term}</strong> | Year: <strong>{selectedSheet.academic_year}</strong>
            </p>

            {loadingDetails ? (
              <p>Loading sheet details...</p>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1', backgroundColor: '#f7fafc' }}>
                      <th style={{ padding: '8px 12px' }}>Student Name</th>
                      <th style={{ padding: '8px 12px' }}>Login ID</th>
                      <th style={{ padding: '8px 12px' }}>Subject</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>1st Test</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>2nd Test</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Other C.A.</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Exam</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Total (100)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetDetails.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '500', color: '#2b3674' }}>{row.student_name}</td>
                        <td style={{ padding: '8px 12px', color: '#718096' }}>{row.student_id_code}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#4a5568' }}>{row.subject_name}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{row.test_score}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{row.test2_score}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{row.other_ca_score}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{row.exam_score}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 'bold', color: '#2b3674' }}>{row.total_score}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem',
                            backgroundColor: row.grade === 'A' ? '#e6fffa' : row.grade === 'F' ? '#ffe5e5' : '#fefcbf',
                            color: row.grade === 'A' ? '#047457' : row.grade === 'F' ? '#c53030' : '#b7791f'
                          }}>
                            {row.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button 
                onClick={() => setSelectedSheet(null)}
                style={{ padding: '10px 20px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Close
              </button>
              
              {selectedSheet.status === 'submitted' && (
                <button 
                  onClick={finalizeSheet}
                  disabled={finalizing}
                  style={{ padding: '10px 24px', background: '#05cd99', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {finalizing ? 'Publishing...' : 'Approve & Publish to Students'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 5. GRADUATES & CERTIFICATES TAB --- */}
      {activeTab === 'graduates' && (
        <div>
          {gradViewMode === 'list' && (
            <div className="dashboard-card">
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Graduates, Certificates & Testimonials</h3>
              <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '20px' }}>
                Track student progress, view full transcripts, and generate official graduation certificates and character testimonials.
              </p>

              {loadingStudents ? (
                <p>Loading students list...</p>
              ) : students.length === 0 ? (
                <p style={{ color: '#718096' }}>No student records found.</p>
              ) : (() => {
                const studentsByClass = students.reduce((acc, student) => {
                  const className = student.class_name || 'Unassigned / Graduates';
                  if (!acc[className]) {
                    acc[className] = [];
                  }
                  acc[className].push(student);
                  return acc;
                }, {});

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {Object.entries(studentsByClass).map(([className, classStudents]) => {
                      const isOpen = expandedClasses[className] ?? true;
                      return (
                        <div key={className} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          {/* Class Header */}
                          <div 
                            onClick={() => toggleClass(className)}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '14px 20px', 
                              backgroundColor: '#f7fafc', 
                              borderBottom: isOpen ? '1px solid #e2e8f0' : 'none', 
                              cursor: 'pointer',
                              userSelect: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#edf2f7'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f7fafc'}
                            className="class-group-header"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>🏫</span>
                              <h4 style={{ margin: 0, color: '#2b3674', fontSize: '1.05rem', fontWeight: 'bold' }}>
                                {className}
                              </h4>
                              <span style={{ 
                                padding: '2px 8px', 
                                background: '#e2e8f0', 
                                color: '#4a5568', 
                                borderRadius: '12px', 
                                fontSize: '0.75rem', 
                                fontWeight: 'bold' 
                              }}>
                                {classStudents.length} {classStudents.length === 1 ? 'Student' : 'Students'}
                              </span>
                            </div>
                            <span style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.9rem', color: '#a0aec0' }}>
                              ▶
                            </span>
                          </div>

                          {/* Class Students Table */}
                          {isOpen && (
                            <div style={{ padding: '10px 20px 20px 20px', overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                                    <th style={{ padding: '12px' }}>Student Name</th>
                                    <th style={{ padding: '12px' }}>Admission ID</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {classStudents.map(student => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#2b3674' }}>{student.full_name}</td>
                                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#4a5568' }}>{student.username}</td>
                                      <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                          <button 
                                            onClick={() => handleViewHistory(student)}
                                            style={{ background: '#e6fffa', color: '#047457', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                          >
                                            📜 Transcript
                                          </button>
                                          {isGraduatingClass(className) && (
                                            <>
                                              <button 
                                                onClick={() => handleOpenCertificate(student)}
                                                style={{ background: '#fffbeb', color: '#d97706', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                              >
                                                🎓 Certificate
                                              </button>
                                              <button 
                                                onClick={() => handleOpenTestimonial(student)}
                                                style={{ background: '#eef2ff', color: '#4318FF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                              >
                                                📝 Testimonial
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Transcript view mode */}
          {gradViewMode === 'transcript' && (
            <div>
               <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }} className="no-print">
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button 
                    onClick={() => setGradViewMode('list')}
                    style={{ background: '#edf2f7', color: '#4a5568', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ⬅️ Back to Student List
                  </button>
                  <button 
                    onClick={() => window.print()}
                    style={{ background: '#4318FF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🖨️ Print Transcript
                  </button>
                </div>
                
                {studentHistory && studentHistory.history && (
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div>
                      <label style={{ marginRight: '8px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Filter Class:</label>
                      <select
                        value={selectedClassFilter}
                        onChange={(e) => setSelectedClassFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: 'white', color: '#2d3748', fontSize: '0.9rem' }}
                      >
                        <option value="All">All Classes</option>
                        {Array.from(new Set(studentHistory.history.map(h => h.class_name))).map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ marginRight: '8px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Filter Term:</label>
                      <select
                        value={selectedTermFilter}
                        onChange={(e) => setSelectedTermFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: 'white', color: '#2d3748', fontSize: '0.9rem' }}
                      >
                        <option value="All">All Terms</option>
                        <option value="1st Term">1st Term</option>
                        <option value="2nd Term">2nd Term</option>
                        <option value="3rd Term">3rd Term</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <style>{`
                .transcript-print-container {
                  background: #ffffff;
                  border: 1px solid #cbd5e0;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                  color: #2d3748;
                  max-width: 900px;
                  margin: 0 auto;
                  font-family: 'Outfit', 'Inter', sans-serif;
                }
                .term-print-card {
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  padding: 20px;
                  margin-bottom: 25px;
                  background: #ffffff;
                  box-shadow: none;
                }
                @media print {
                  body {
                    background: #ffffff !important;
                    color: #000000 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  aside, .sidebar, header, .top-header, nav, .navigation, button {
                    display: none !important;
                  }
                  .main-wrapper, .main-content, #root, .App {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    box-shadow: none !important;
                  }
                  .transcript-print-container {
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                  }
                  .term-print-card {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    border: 1px solid #000000 !important;
                    border-radius: 0 !important;
                    padding: 20px !important;
                    margin-bottom: 0 !important;
                    background: #ffffff !important;
                  }
                  .term-print-card:last-child {
                    page-break-after: auto !important;
                    break-after: auto !important;
                  }
                  table {
                    border: 1px solid #000000 !important;
                    border-collapse: collapse !important;
                  }
                  th, td {
                    border: 1px solid #cbd5e0 !important;
                  }
                }
              `}</style>

              {loadingStudentHistory ? (
                <p>Loading history...</p>
              ) : !studentHistory || !studentHistory.history || studentHistory.history.length === 0 ? (
                <p>No history records found.</p>
              ) : (
                <div className="transcript-print-container">
                  {/* Informational card at the top (visible on screen only) */}
                  <div className="dashboard-card no-print" style={{ marginBottom: '20px', background: '#f7fafc', borderLeft: '4px solid #4318FF' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2b3674' }}>Cumulative Academic Transcript: {studentHistory.student.full_name} ({studentHistory.student.username})</h4>
                    <p style={{ margin: 0, color: '#718096' }}>
                      Cumulative Average: {(studentHistory.history.reduce((acc, h) => acc + h.averageScore, 0) / studentHistory.history.length || 0).toFixed(2)}% | Total Terms Recorded: {studentHistory.history.length}
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#a3aed1', fontStyle: 'italic' }}>
                      Note: Printing this transcript will output a complete copy of the official report card for each term, with page breaks between terms.
                    </p>
                  </div>

                  {/* Term Report Cards */}
                    {(() => {
                      const filteredHistory = studentHistory.history.filter(termRecord => {
                        const matchClass = selectedClassFilter === 'All' || termRecord.class_name === selectedClassFilter;
                        const matchTerm = selectedTermFilter === 'All' || termRecord.academic_term === selectedTermFilter;
                        return matchClass && matchTerm;
                      });

                      if (filteredHistory.length === 0) {
                        return <p style={{ textAlign: 'center', padding: '40px', color: '#718096', fontWeight: 'bold' }}>No history records found matching the selected filters.</p>;
                      }

                      return filteredHistory.map((termRecord, idx) => (
                        <div key={idx} className="term-print-card" style={{ 
                          background: '#ffffff',
                          border: '1px solid #cbd5e0',
                          padding: '40px',
                          borderRadius: '8px',
                          color: '#2d3748',
                          fontFamily: "'Outfit', 'Inter', sans-serif"
                        }}>
                          {/* Bichi Academy Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '25px', borderBottom: '4px double #2b3674', paddingBottom: '15px' }}>
                            <svg width="70" height="70" viewBox="0 0 100 100" style={{ marginRight: '20px' }}>
                              <path d="M50,5 L90,20 L90,55 C90,75 50,92 50,92 C50,92 10,75 10,55 L10,20 Z" fill="#2b3674" stroke="#d97706" strokeWidth="2.5" />
                              <path d="M50,10 L83,23 L83,53 C83,70 50,85 50,85 C50,85 17,70 17,53 L17,23 Z" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" />
                              <path d="M28,45 C38,40 48,43 50,45 L50,68 C48,66 38,63 28,68 Z" fill="#ffffff" />
                              <path d="M72,45 C62,40 52,43 50,45 L50,68 C52,66 62,63 72,68 Z" fill="#ffffff" />
                              <path d="M50,45 L50,68" stroke="#2b3674" strokeWidth="1.5" />
                              <polygon points="50,18 53,24 60,25 55,30 56,37 50,33 44,37 45,30 40,25 47,24" fill="#d97706" />
                              <text x="50" y="80" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold" letterSpacing="0.5">EST. 2015</text>
                            </svg>
                            
                            <div style={{ textAlign: 'left' }}>
                              <h1 style={{ margin: '0', fontSize: '26px', fontWeight: '800', color: '#2b3674', letterSpacing: '1px', textTransform: 'uppercase' }}>Bichi Academy</h1>
                              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#d97706', fontWeight: 'bold', letterSpacing: '1px' }}>KNOWLEDGE · DISCIPLINE · EXCELLENCE</p>
                              <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#718096' }}>P.O. Box 450, School Avenue Road, Tech City | info@bichiacademy.edu.ng</p>
                              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#2b3674', fontWeight: 'bold' }}>OFFICIAL STUDENT TERM ACADEMIC REPORT</p>
                            </div>
                          </div>

                          {/* Student Bio Table */}
                          <table style={{ width: '100%', marginBottom: '25px', border: '1px solid #cbd5e0', padding: '15px', borderRadius: '8px', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', width: '20%', border: '1px solid #edf2f7' }}>Student Name:</td>
                                <td style={{ padding: '10px', color: '#2b3674', fontWeight: '700', fontSize: '1.05rem', border: '1px solid #edf2f7' }}>{studentHistory.student.full_name}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', width: '20%', border: '1px solid #edf2f7' }}>Class of Record:</td>
                                <td style={{ padding: '10px', color: '#2b3674', fontWeight: '700', border: '1px solid #edf2f7' }}>{termRecord.class_name}</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Admission ID:</td>
                                <td style={{ padding: '10px', color: '#2b3674', fontFamily: 'monospace', fontWeight: '600', border: '1px solid #edf2f7' }}>{studentHistory.student.username}</td>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Academic Period:</td>
                                <td style={{ padding: '10px', color: '#2b3674', border: '1px solid #edf2f7' }}>{termRecord.academic_term} ({termRecord.academic_year})</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Term Average:</td>
                                <td style={{ padding: '10px', color: '#047457', fontWeight: '700', border: '1px solid #edf2f7' }}>{termRecord.averageScore.toFixed(2)}%</td>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Class Position:</td>
                                <td style={{ padding: '10px', color: '#4318FF', fontWeight: '700', border: '1px solid #edf2f7' }}>
                                  {termRecord.position ? `${formatPosition(termRecord.position)} of ${termRecord.totalStudents}` : 'N/A'}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Results Table */}
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '25px', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #cbd5e0', color: '#2b3674', fontWeight: 'bold' }}>
                                <th style={{ padding: '10px', border: '1px solid #cbd5e0' }}>Subject</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Test 1 (10)</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Test 2 (10)</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Other C.A. (10)</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Total C.A. (30)</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Exam (70)</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Total (100)</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Grade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {termRecord.results.map((row, rIdx) => {
                                const caTotal = (parseFloat(row.test_score) || 0) + (parseFloat(row.test2_score) || 0) + (parseFloat(row.other_ca_score) || 0);
                                return (
                                  <tr key={rIdx} style={{ borderBottom: '1px solid #edf2f7' }}>
                                    <td style={{ padding: '8px', fontWeight: '600', color: '#2d3748', border: '1px solid #edf2f7' }}>{row.subject_name}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.test_score ?? '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.test2_score ?? '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.other_ca_score ?? '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #edf2f7', fontWeight: '500', color: '#4a5568' }}>{caTotal.toFixed(2)}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.exam_score ?? '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#2b3674', border: '1px solid #edf2f7' }}>{row.total_score ?? '-'}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: row.grade === 'F' ? '#e53e3e' : '#2f855a', border: '1px solid #edf2f7' }}>{row.grade ?? '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Affective ratings, remarks, and attendance */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '15px' }}>
                            {/* Character ratings */}
                            <div style={{ border: '1px solid #cbd5e0', borderRadius: '6px', padding: '12px' }}>
                              <h5 style={{ margin: '0 0 8px 0', color: '#2b3674', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #edf2f7', paddingBottom: '4px' }}>
                                ⭐ Affective & Psychomotor Ratings (1-5 Scale)
                              </h5>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.75rem' }}>
                                {[
                                  { key: 'punctuality', label: 'Punctuality' },
                                  { key: 'neatness', label: 'Neatness' },
                                  { key: 'honesty', label: 'Honesty' },
                                  { key: 'peer_relation', label: 'Peer Relations' },
                                  { key: 'attentiveness', label: 'Attentiveness' },
                                  { key: 'perseverance', label: 'Perseverance' },
                                  { key: 'leadership', label: 'Leadership' },
                                  { key: 'handwriting', label: 'Handwriting' },
                                  { key: 'sports', label: 'Games & Sports' },
                                  { key: 'crafts', label: 'Club/Craft Skills' }
                                ].map(trait => (
                                  <div key={trait.key} style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '10px', borderBottom: '1px dashed #edf2f7' }}>
                                    <span style={{ color: '#4a5568' }}>{trait.label}:</span>
                                    <span style={{ fontWeight: 'bold', color: '#2b3674' }}>
                                      {termRecord.remarks?.[trait.key] !== null && termRecord.remarks?.[trait.key] !== undefined ? termRecord.remarks[trait.key] : '-'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Attendance and remarks */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {/* Attendance card */}
                              <div style={{ border: '1px solid #cbd5e0', borderRadius: '6px', padding: '10px' }}>
                                <h5 style={{ margin: '0 0 6px 0', color: '#2b3674', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #edf2f7', paddingBottom: '4px' }}>
                                  📅 Attendance Statistics
                                </h5>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                  <tbody>
                                    <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                                      <td style={{ padding: '3px 0', color: '#4a5568' }}>School Open Days:</td>
                                      <td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right', color: '#2b3674' }}>
                                        {termRecord.remarks?.days_open !== null && termRecord.remarks?.days_open !== undefined ? termRecord.remarks.days_open : '-'}
                                      </td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                                      <td style={{ padding: '3px 0', color: '#4a5568' }}>Days Present:</td>
                                      <td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right', color: '#2b3674' }}>
                                        {termRecord.remarks?.days_present !== null && termRecord.remarks?.days_present !== undefined ? termRecord.remarks.days_present : '-'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style={{ padding: '3px 0', color: '#4a5568' }}>Attendance Rate:</td>
                                      <td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right', color: '#047457' }}>
                                        {termRecord.remarks?.days_open && termRecord.remarks?.days_present !== null 
                                          ? `${Math.round((termRecord.remarks.days_present / termRecord.remarks.days_open) * 100)}%` 
                                          : '-'}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Comments Card */}
                              <div style={{ border: '1px solid #cbd5e0', borderRadius: '6px', padding: '10px', flex: 1 }}>
                                <h5 style={{ margin: '0 0 6px 0', color: '#2b3674', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px solid #edf2f7', paddingBottom: '4px' }}>
                                  💬 Official Comments
                                </h5>
                                <div style={{ fontSize: '0.75rem', lineHeight: '1.4', color: '#4a5568' }}>
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Class Master:</strong> <span style={{ fontStyle: 'italic' }}>{termRecord.remarks?.class_master_remark || 'No remark entered.'}</span>
                                  </div>
                                  <div>
                                    <strong>Principal:</strong> <span style={{ fontStyle: 'italic' }}>{termRecord.remarks?.principal_remark || 'No remark entered.'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Official signatures */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', padding: '0 20px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ borderBottom: '1px solid black', width: '150px', marginBottom: '5px' }}></div>
                              <span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Class Master</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ borderBottom: '1px solid black', width: '150px', marginBottom: '5px' }}></div>
                              <span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Exams Officer</span>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ borderBottom: '1px solid black', width: '150px', marginBottom: '5px' }}></div>
                              <span style={{ fontSize: '0.8rem', color: '#4a5568' }}>Principal</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                </div>
              )}
            </div>
          )}

          {/* Certificate view mode */}
          {gradViewMode === 'certificate' && (
            <div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }} className="no-print">
                <button 
                  onClick={() => setGradViewMode('list')}
                  style={{ background: '#edf2f7', color: '#4a5568', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ⬅️ Back to Student List
                </button>
                <button 
                  onClick={() => window.print()}
                  style={{ background: '#4318FF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🖨️ Print Certificate
                </button>
              </div>

              <style>{`
                @media print {
                  @page {
                    size: landscape;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    background: #fff;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .sidebar {
                    display: none !important;
                  }
                  .top-header {
                    display: none !important;
                  }
                  .main-wrapper {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .print-cert-container {
                    display: block !important;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(1.1);
                    width: 1000px;
                    height: 700px;
                    border: 15px solid #2b3674 !important;
                    margin: 0 !important;
                    padding: 40px !important;
                    box-sizing: border-box;
                  }
                }
              `}</style>

              <div className="print-cert-container" style={{
                background: '#fcfbf9',
                border: '15px solid #2b3674',
                padding: '50px',
                textAlign: 'center',
                fontFamily: "'Georgia', serif",
                color: '#2d3748',
                maxWidth: '900px',
                margin: '20px auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                borderRadius: '8px'
              }}>
                <div style={{ border: '2px solid #b7791f', padding: '30px', height: '100%' }}>
                  <h1 style={{ margin: '0 0 10px 0', fontFamily: "'Georgia', serif", color: '#b7791f', letterSpacing: '4px', fontSize: '2.5rem' }}>
                    BICHI ACADEMY
                  </h1>
                  <h3 style={{ margin: '0 0 40px 0', fontSize: '1.1rem', letterSpacing: '2px', color: '#718096' }}>
                    KNOWLEDGE · DISCIPLINE · EXCELLENCE
                  </h3>
                  
                  <p style={{ fontStyle: 'italic', fontSize: '1.2rem', margin: '0 0 20px 0' }}>This is to certify that</p>
                  
                  <h2 style={{ margin: '0 0 20px 0', fontSize: '2.8rem', color: '#2b3674', borderBottom: '2px solid #e2e8f0', display: 'inline-block', paddingBottom: '5px', fontWeight: 'bold' }}>
                    {selectedStudent.full_name}
                  </h2>
                  
                  <p style={{ fontSize: '1.15rem', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto 40px auto' }}>
                    has successfully completed the prescribed course of study at this academy and is hereby awarded this
                  </p>
                  
                  <h1 style={{ margin: '0 0 40px 0', color: '#b7791f', fontSize: '3rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                    GRADUATION CERTIFICATE
                  </h1>
                  
                  <p style={{ fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 60px 0' }}>
                    Given on this {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} at Bichi Academy.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', padding: '0 40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="#b7791f" stroke="#2b3674" strokeWidth="2" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
                        <path d="M50 20 L58 38 L77 38 L62 49 L68 67 L50 56 L32 67 L38 49 L23 38 L42 38 Z" fill="#fff" />
                        <text x="50" y="80" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">OFFICIAL SEAL</text>
                      </svg>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem', color: '#718096' }}>Student ID:</p>
                        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '1rem', color: '#2b3674', fontWeight: 'bold' }}>{selectedStudent.username}</p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid #718096', width: '200px', marginBottom: '8px', height: '40px' }}></div>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#4a5568' }}>Principal</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#a3aed1' }}>Bichi Academy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Testimonial view mode */}
          {gradViewMode === 'testimonial' && (
            <div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }} className="no-print">
                <button 
                  onClick={() => setGradViewMode('list')}
                  style={{ background: '#edf2f7', color: '#4a5568', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ⬅️ Back to Student List
                </button>
                <button 
                  onClick={() => window.print()}
                  style={{ background: '#4318FF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🖨️ Print Testimonial
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Left: Testimonial Form Editor */}
                <div className="dashboard-card no-print">
                  <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Edit Student Testimonial</h3>
                  <form onSubmit={handleSaveTestimonial} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Date Issued</label>
                      <input 
                        type="date" 
                        value={testimonialData.date_issued}
                        onChange={(e) => setTestimonialData({ ...testimonialData, date_issued: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e0' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Conduct & Character</label>
                      <select 
                        value={testimonialData.conduct}
                        onChange={(e) => setTestimonialData({ ...testimonialData, conduct: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e0', background: 'white' }}
                        required
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                        <option value="Satisfactory">Satisfactory</option>
                        <option value="Unsatisfactory">Unsatisfactory</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Academic Performance</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Hardworking and Diligent"
                        value={testimonialData.academic_performance}
                        onChange={(e) => setTestimonialData({ ...testimonialData, academic_performance: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e0' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Sports & Extracurricular Activities</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Active Participant in Football and Athletics"
                        value={testimonialData.sports_extracurricular}
                        onChange={(e) => setTestimonialData({ ...testimonialData, sports_extracurricular: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e0' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>General Remarks</label>
                      <textarea 
                        placeholder="e.g. An outstanding student who is highly recommended for higher studies."
                        value={testimonialData.general_remarks}
                        onChange={(e) => setTestimonialData({ ...testimonialData, general_remarks: e.target.value })}
                        style={{ width: '100%', minHeight: '100px', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e0' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={savingTestimonial}
                      style={{ background: '#4318FF', color: 'white', border: 'none', padding: '12px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {savingTestimonial ? 'Saving...' : '💾 Save Testimonial Data'}
                    </button>
                  </form>
                </div>

                {/* Right & Printable Page: Character Testimonial Letterhead */}
                <div className="print-testimonial-container" style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  padding: '40px',
                  fontFamily: "'Courier New', Courier, monospace",
                  color: 'black',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  borderRadius: '8px'
                }}>
                  {/* Official Letterhead */}
                  <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid black', paddingBottom: '15px' }}>
                    <h2 style={{ margin: '0 0 5px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>Bichi Academy</h2>
                    <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>P.O. Box 450, School Avenue Road, Tech City</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>OFFICIAL STUDENT TESTIMONIAL</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                    <span>Ref: ATA/TEST/{selectedStudent.username}</span>
                    <span>Date: {new Date(testimonialData.date_issued).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>

                  <h3 style={{ textAlign: 'center', textDecoration: 'underline', fontWeight: 'bold', marginBottom: '30px', textTransform: 'uppercase' }}>
                    Letter of Testimonial & Character Reference
                  </h3>

                  <p style={{ lineHeight: '1.8', marginBottom: '20px', textAlign: 'justify' }}>
                    This is to certify that <strong>{selectedStudent.full_name}</strong> was a registered student of Bichi Academy. 
                    During the period of enrollment, the student pursued standard secondary courses leading up to completion in the <strong>{selectedStudent.class_name || 'SS3'}</strong> class.
                  </p>

                  <p style={{ lineHeight: '1.8', marginBottom: '20px', textAlign: 'justify' }}>
                    Throughout the period of studies, the student's general conduct was evaluated to be <strong>{testimonialData.conduct}</strong>.
                    In terms of Academic performance, the student was found to be <strong>{testimonialData.academic_performance}</strong>.
                  </p>

                  {testimonialData.sports_extracurricular && (
                    <p style={{ lineHeight: '1.8', marginBottom: '20px', textAlign: 'justify' }}>
                      Apart from academic duties, the student participated actively in extracurricular activities, specifically: <strong>{testimonialData.sports_extracurricular}</strong>.
                    </p>
                  )}

                  {testimonialData.general_remarks && (
                    <p style={{ lineHeight: '1.8', marginBottom: '35px', textAlign: 'justify' }}>
                      <strong>General Remarks:</strong> {testimonialData.general_remarks}
                    </p>
                  )}

                  <p style={{ lineHeight: '1.8', marginBottom: '60px' }}>
                    We wish him/her the absolute best in all future academic and career endeavors.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '50px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid black', width: '200px', marginBottom: '5px' }}></div>
                      <span>Exams Officer</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid black', width: '200px', marginBottom: '5px' }}></div>
                      <strong>Principal</strong>
                      <div style={{ fontSize: '11px', color: '#718096' }}>(Stamp & Signature)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </DashboardLayout>
  );
}
