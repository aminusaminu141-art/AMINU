import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import './MasterDashboard.css';

export default function MasterDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Sync activeTab with URL routing paths
  let activeTab = 'grading'; // default to grading/Dashboard
  if (location.pathname === '/master/attendance') {
    activeTab = 'attendance';
  } else if (location.pathname === '/master/students') {
    activeTab = 'roster';
  } else if (location.pathname === '/master/remarks') {
    activeTab = 'remarks';
  }

  // Student Management State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newStudentName, setNewStudentName] = useState('');
  const [adding, setAdding] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState({ type: '', text: '' });

  // Grading State (Assigned Classes and Subjects)
  const [assignmentsRoster, setAssignmentsRoster] = useState([]);
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  const [selectedYear, setSelectedYear] = useState('2025/2026');
  const [gradingRecords, setGradingRecords] = useState([]);
  const [loadingGrading, setLoadingGrading] = useState(false);
  const [savingGrading, setSavingGrading] = useState(false);
  const [gradingMessage, setGradingMessage] = useState({ type: '', text: '' });

  // Student-wise Grading State (Kano State report card style)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentGradingRows, setStudentGradingRows] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchAssignmentsRoster();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab, attendanceDate]);

  useEffect(() => {
    if (activeTab === 'grading' && selectedStudentId && selectedTerm && selectedYear) {
      fetchStudentGradingRows();
    }
  }, [activeTab, selectedStudentId, selectedTerm, selectedYear]);

  // Remarks State
  const [remarksList, setRemarksList] = useState([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [remarksTerm, setRemarksTerm] = useState('1st Term');
  const [remarksYear, setRemarksYear] = useState('2025/2026');
  const [savingRemarkId, setSavingRemarkId] = useState(null);
  const [selectedStudentRemarks, setSelectedStudentRemarks] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [ratingsForm, setRatingsForm] = useState({
    punctuality: 5,
    neatness: 5,
    honesty: 5,
    peer_relation: 5,
    attentiveness: 5,
    perseverance: 5,
    leadership: 5,
    handwriting: 5,
    sports: 5,
    crafts: 5,
    days_open: 90,
    days_present: 90,
    remark: ''
  });
  const [bulkRatingsForm, setBulkRatingsForm] = useState({
    punctuality: 5,
    neatness: 5,
    honesty: 5,
    peer_relation: 5,
    attentiveness: 5,
    perseverance: 5,
    leadership: 5,
    handwriting: 5,
    sports: 5,
    crafts: 5,
    days_open: 90,
    days_present: 90,
    remark: ''
  });

  useEffect(() => {
    if (activeTab === 'remarks') {
      fetchTermRemarks();
    }
  }, [activeTab, remarksTerm, remarksYear]);

  const fetchTermRemarks = async () => {
    setLoadingRemarks(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/master/term-remarks?academic_term=${encodeURIComponent(remarksTerm)}&academic_year=${encodeURIComponent(remarksYear)}`, { headers });
      setRemarksList(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load student remarks.');
    } finally {
      setLoadingRemarks(false);
    }
  };

  const handleOpenAssessmentModal = (student) => {
    setSelectedStudentRemarks(student);
    setRatingsForm({
      punctuality: student.punctuality ?? 5,
      neatness: student.neatness ?? 5,
      honesty: student.honesty ?? 5,
      peer_relation: student.peer_relation ?? 5,
      attentiveness: student.attentiveness ?? 5,
      perseverance: student.perseverance ?? 5,
      leadership: student.leadership ?? 5,
      handwriting: student.handwriting ?? 5,
      sports: student.sports ?? 5,
      crafts: student.crafts ?? 5,
      days_open: student.days_open ?? 90,
      days_present: student.days_present ?? 90,
      remark: student.class_master_remark ?? ''
    });
  };

  const handleSaveAssessment = async (studentId, assessmentData) => {
    if (parseInt(assessmentData.days_present) > parseInt(assessmentData.days_open)) {
      alert('Error: Days Present cannot exceed Total School Days Open!');
      return;
    }

    setSavingRemarkId(studentId);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/master/term-remarks', {
        student_id: studentId,
        academic_term: remarksTerm,
        academic_year: remarksYear,
        remark: assessmentData.remark,
        punctuality: assessmentData.punctuality,
        neatness: assessmentData.neatness,
        honesty: assessmentData.honesty,
        peer_relation: assessmentData.peer_relation,
        attentiveness: assessmentData.attentiveness,
        perseverance: assessmentData.perseverance,
        leadership: assessmentData.leadership,
        handwriting: assessmentData.handwriting,
        sports: assessmentData.sports,
        crafts: assessmentData.crafts,
        days_open: assessmentData.days_open,
        days_present: assessmentData.days_present
      }, { headers });
      
      setRemarksList(prev => prev.map(item => 
        item.id === studentId ? { 
          ...item, 
          class_master_remark: assessmentData.remark,
          punctuality: assessmentData.punctuality,
          neatness: assessmentData.neatness,
          honesty: assessmentData.honesty,
          peer_relation: assessmentData.peer_relation,
          attentiveness: assessmentData.attentiveness,
          perseverance: assessmentData.perseverance,
          leadership: assessmentData.leadership,
          handwriting: assessmentData.handwriting,
          sports: assessmentData.sports,
          crafts: assessmentData.crafts,
          days_open: assessmentData.days_open,
          days_present: assessmentData.days_present
        } : item
      ));
      
      alert('Behavior assessment and attendance saved successfully!');
      setSelectedStudentRemarks(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to save assessment.');
    } finally {
      setSavingRemarkId(null);
    }
  };

  const handleSaveBulkAssessment = async (e) => {
    e.preventDefault();
    if (parseInt(bulkRatingsForm.days_present) > parseInt(bulkRatingsForm.days_open)) {
      alert('Error: Days Present cannot exceed Total School Days Open!');
      return;
    }

    if (!window.confirm('Are you sure you want to apply these default ratings and remarks to ALL students in your class for this term? Existing evaluations will be overwritten.')) {
      return;
    }

    setSavingBulk(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/master/bulk-term-remarks', {
        academic_term: remarksTerm,
        academic_year: remarksYear,
        remark: bulkRatingsForm.remark,
        punctuality: bulkRatingsForm.punctuality,
        neatness: bulkRatingsForm.neatness,
        honesty: bulkRatingsForm.honesty,
        peer_relation: bulkRatingsForm.peer_relation,
        attentiveness: bulkRatingsForm.attentiveness,
        perseverance: bulkRatingsForm.perseverance,
        leadership: bulkRatingsForm.leadership,
        handwriting: bulkRatingsForm.handwriting,
        sports: bulkRatingsForm.sports,
        crafts: bulkRatingsForm.crafts,
        days_open: bulkRatingsForm.days_open,
        days_present: bulkRatingsForm.days_present
      }, { headers });

      alert('Bulk behavior assessment and remarks applied to the entire class successfully!');
      setShowBulkModal(false);
      fetchTermRemarks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to save bulk assessment.');
    } finally {
      setSavingBulk(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/master/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
      if (res.data.length > 0) {
        setSelectedStudentId(res.data[0].id.toString());
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch students. Ensure you are assigned to a class.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsRoster = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/master/assigned-classes-subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignmentsRoster(res.data);
      if (res.data.length > 0) {
        setSelectedAssignmentIndex('0');
      }
    } catch (err) {
      console.error('Failed to load assignments roster', err);
    }
  };

  const fetchAttendance = async () => {
    if (!attendanceDate) return;
    setLoadingAttendance(true);
    setAttendanceMessage({ type: '', text: '' });
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/master/attendance?date=${attendanceDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceRecords(res.data);
    } catch (err) {
      console.error(err);
      setAttendanceMessage({ type: 'error', text: 'Failed to load attendance.' });
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords(prev => prev.map(record => 
      record.id === studentId ? { ...record, status } : record
    ));
  };

  const fetchStudentGradingRows = async () => {
    if (!selectedStudentId) return;
    setLoadingGrading(true);
    setGradingMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `/api/master/student-results?student_id=${selectedStudentId}&academic_term=${encodeURIComponent(selectedTerm)}&academic_year=${encodeURIComponent(selectedYear)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudentGradingRows(res.data);
    } catch (err) {
      console.error(err);
      setGradingMessage({ type: 'error', text: 'Failed to load report card grading table.' });
    } finally {
      setLoadingGrading(false);
    }
  };

  const handleScoreChange = (subjectId, field, value) => {
    let maxVal = 10;
    if (field === 'exam_score') maxVal = 70;
    
    const numericValue = value === '' ? '' : Math.min(maxVal, Math.max(0, parseFloat(value) || 0));

    setStudentGradingRows(prev => prev.map(row => {
      if (row.subject_id === subjectId) {
        const updatedRow = { ...row, [field]: numericValue };
        
        // Calculate dynamic total
        const t1 = parseFloat(updatedRow.test_score) || 0;
        const t2 = parseFloat(updatedRow.test2_score) || 0;
        const oca = parseFloat(updatedRow.other_ca_score) || 0;
        const exam = parseFloat(updatedRow.exam_score) || 0;
        
        const total = t1 + t2 + oca + exam;
        updatedRow.total_score = total.toFixed(2);
        
        let grade = 'F';
        if (total >= 80) grade = 'A';
        else if (total >= 60) grade = 'B';
        else if (total >= 50) grade = 'C';
        else if (total >= 45) grade = 'D';
        else if (total >= 40) grade = 'E';
        
        updatedRow.grade = grade;
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSaveStudentReport = async () => {
    setSavingGrading(true);
    setGradingMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        student_id: selectedStudentId,
        academic_term: selectedTerm,
        academic_year: selectedYear,
        grades: studentGradingRows.map(row => ({
          subject_id: row.subject_id,
          test_score: parseFloat(row.test_score) || 0,
          test2_score: parseFloat(row.test2_score) || 0,
          other_ca_score: parseFloat(row.other_ca_score) || 0,
          exam_score: parseFloat(row.exam_score) || 0
        }))
      };

      const res = await axios.post('/api/master/student-results', payload, { headers });
      setGradingMessage({ type: 'success', text: res.data.msg || 'Student report card table saved successfully!' });
      
      fetchStudentGradingRows();
    } catch (err) {
      console.error(err);
      setGradingMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to save student report card.' });
    } finally {
      setSavingGrading(false);
    }
  };

  const handleSubmitClassReport = async () => {
    if (!window.confirm(`Are you sure you want to submit the results of the ENTIRE class for ${selectedTerm} (${selectedYear}) to the Exams Office? You will not be able to edit them until they are reviewed.`)) {
      return;
    }
    
    setSavingGrading(true);
    setGradingMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        academic_term: selectedTerm,
        academic_year: selectedYear
      };

      const res = await axios.post('/api/master/submit-class-results', payload, { headers });
      setGradingMessage({ type: 'success', text: res.data.msg || 'Class results submitted successfully!' });
      fetchStudentGradingRows();
    } catch (err) {
      console.error(err);
      setGradingMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to submit class results.' });
    } finally {
      setSavingGrading(false);
    }
  };


  const saveAttendance = async () => {
    setSavingAttendance(true);
    setAttendanceMessage({ type: '', text: '' });

    const payload = {
      date: attendanceDate,
      records: attendanceRecords.map(r => ({ student_id: r.id, status: r.status }))
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/master/attendance', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceMessage({ type: 'success', text: 'Attendance saved successfully!' });
      setTimeout(() => setAttendanceMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setAttendanceMessage({ type: 'error', text: 'Failed to save attendance.' });
    } finally {
      setSavingAttendance(false);
    }
  };



  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    
    setAdding(true);
    setGeneratedCreds(null);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/master/students',
        { full_name: newStudentName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchStudents();
      fetchAttendance();
      if (activeTab === 'grading') fetchGradingRecords();
      
      setGeneratedCreds({
        username: res.data.username,
        password: res.data.password,
        name: res.data.full_name
      });
      setNewStudentName('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add student');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the school?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/master/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(students.filter(s => s.id !== id));
      setAttendanceRecords(attendanceRecords.filter(r => r.id !== id));
      setGradingRecords(gradingRecords.filter(g => g.id !== id));
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove student');
    }
  };

  const isToday = attendanceDate === new Date().toISOString().split('T')[0];
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;

  return (
    <DashboardLayout title="Class Master Dashboard" role="class_master">
      {/* Dynamic Summary Cards */}
      <div className="grid-responsive mb-lg">
        <div className="dashboard-card">
          <h3 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>Total Students</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>{loading ? '...' : students.length}</p>
        </div>

        <div className="dashboard-card">
          <h3 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>{isToday ? "Today's Attendance" : "Selected Date Attendance"}</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>
            {loadingAttendance ? '...' : `${presentCount}/${attendanceRecords.length}`}
          </p>
          <p style={{ margin: 'var(--space-sm) 0 0 0', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>Present / Total</p>
        </div>
      </div>

      {/* Tabs System */}
      <div className="flex-row gap-md no-print" style={{ borderBottom: '1.5px solid var(--color-border)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <button 
          onClick={() => navigate('/master/attendance')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'attendance' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'attendance' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Daily Attendance
        </button>
        <button 
          onClick={() => navigate('/master')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'grading' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'grading' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Record Scores
        </button>
        <button 
          onClick={() => navigate('/master/students')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'roster' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'roster' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Student Roster
        </button>
        <button 
          onClick={() => navigate('/master/remarks')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeTab === 'remarks' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeTab === 'remarks' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Student Remarks
        </button>
      </div>

      <div className="master-content-area">
        {error && <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

        {/* --- 1. DAILY ATTENDANCE TAB --- */}
        {activeTab === 'attendance' && (
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 20px 0', color: '#2b3674' }}>Daily Attendance</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <label style={{ fontWeight: '600', color: '#4a5568' }}>Select Date:</label>
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '5px' }}
              />
            </div>

            {loadingAttendance ? (
              <p>Loading attendance...</p>
            ) : attendanceRecords.length === 0 ? (
              <p style={{ color: '#718096' }}>No students in class yet.</p>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Student Name</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Present</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map(student => (
                        <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#2b3674' }}>{student.full_name}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              checked={student.status === 'present'}
                              onChange={() => handleAttendanceChange(student.id, 'present')}
                              style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input 
                              type="radio" 
                              name={`attendance-${student.id}`} 
                              checked={student.status === 'absent'}
                              onChange={() => handleAttendanceChange(student.id, 'absent')}
                              style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button 
                    onClick={saveAttendance}
                    disabled={savingAttendance}
                    style={{ 
                      padding: '10px 24px', background: '#05cd99', color: 'white', 
                      border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' 
                    }}
                  >
                    {savingAttendance ? 'Saving...' : 'Save Attendance'}
                  </button>
                  {attendanceMessage.text && (
                    <span style={{ color: attendanceMessage.type === 'success' ? '#05cd99' : '#e53e3e', fontWeight: '500' }}>
                      {attendanceMessage.text}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* --- 2. RECORD SCORES TAB --- */}
        {activeTab === 'grading' && (
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 20px 0', color: '#2b3674' }}>Record Academic Scores</h3>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#718096' }}>Select Student</label>
                {students.length === 0 ? (
                  <p style={{ color: 'orange', fontSize: '0.9rem', margin: 0 }}>No students in class roster.</p>
                ) : (
                  <select 
                    value={selectedStudentId} 
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '5px', background: 'white', minWidth: '180px' }}
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} ({student.username})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#718096' }}>Academic Term</label>
                <select 
                  value={selectedTerm} 
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '5px', background: 'white' }}
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#718096' }}>Academic Year</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '5px', background: 'white' }}
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>
            </div>

            {loadingGrading ? (
              <p>Loading student report card table...</p>
            ) : !selectedStudentId ? (
              <p style={{ color: '#718096' }}>Please select a student from the class roster.</p>
            ) : studentGradingRows.length === 0 ? (
              <p style={{ color: '#718096' }}>No subjects loaded in the database.</p>
            ) : (
              (() => {
                const overallStatus = studentGradingRows[0]?.status || 'draft';
                const isLocked = overallStatus === 'submitted' || overallStatus === 'finalized';
                return (
                  <>
                    {/* Class Submission Status Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: overallStatus === 'finalized' ? '#e6fffa' : overallStatus === 'submitted' ? '#fffbeb' : '#f7fafc',
                      border: `1px solid ${overallStatus === 'finalized' ? '#38b2ac' : overallStatus === 'submitted' ? '#fefcbf' : '#e2e8f0'}`,
                      padding: '15px 20px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      color: '#2d3748'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#2b3674', fontSize: '1rem' }}>
                          Class Submission Status for {selectedTerm} ({selectedYear}): 
                          <span style={{
                            marginLeft: '10px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            backgroundColor: overallStatus === 'finalized' ? '#319795' : overallStatus === 'submitted' ? '#dd6b20' : '#4a5568',
                            color: 'white'
                          }}>
                            {overallStatus === 'finalized' ? 'Approved & Published' : overallStatus === 'submitted' ? 'Submitted (Pending Approval)' : 'Draft (Not Submitted)'}
                          </span>
                        </h4>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#718096' }}>
                          {overallStatus === 'draft' ? "Save all students' report cards first, then submit the whole class to the Exams Office." : 
                           overallStatus === 'submitted' ? 'Results are locked and awaiting review by the Exams Officer.' : 
                           'Results have been approved and published to student portals.'}
                        </p>
                      </div>
                      {overallStatus === 'draft' && (
                        <button
                          onClick={handleSubmitClassReport}
                          disabled={savingGrading}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#e53e3e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 12px rgba(229, 62, 62, 0.2)'
                          }}
                        >
                          🚀 Submit Class to Exams Office
                        </button>
                      )}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1', backgroundColor: '#f7fafc' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Subject Name</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>1st Test (10)</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>2nd Test (10)</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Other C.A. (10)</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '110px' }}>Total C.A. (30)</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '110px' }}>Exam (70)</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '110px' }}>Total Score (100)</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>Grade (A-F)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentGradingRows.map(row => {
                            const caTotal = (parseFloat(row.test_score) || 0) + (parseFloat(row.test2_score) || 0) + (parseFloat(row.other_ca_score) || 0);
                            return (
                              <tr key={row.subject_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2b3674' }}>{row.subject_name}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="10"
                                    step="0.5"
                                    value={row.test_score}
                                    disabled={isLocked}
                                    onChange={(e) => handleScoreChange(row.subject_id, 'test_score', e.target.value)}
                                    style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: isLocked ? '#e2e8f0' : 'white' }}
                                  />
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="10"
                                    step="0.5"
                                    value={row.test2_score}
                                    disabled={isLocked}
                                    onChange={(e) => handleScoreChange(row.subject_id, 'test2_score', e.target.value)}
                                    style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: isLocked ? '#e2e8f0' : 'white' }}
                                  />
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="10"
                                    step="0.5"
                                    value={row.other_ca_score}
                                    disabled={isLocked}
                                    onChange={(e) => handleScoreChange(row.subject_id, 'other_ca_score', e.target.value)}
                                    style={{ width: '65px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: isLocked ? '#e2e8f0' : 'white' }}
                                  />
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#4a5568' }}>
                                  {caTotal.toFixed(2)}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="70"
                                    step="0.5"
                                    value={row.exam_score}
                                    disabled={isLocked}
                                    onChange={(e) => handleScoreChange(row.subject_id, 'exam_score', e.target.value)}
                                    style={{ width: '70px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e0', borderRadius: '4px', backgroundColor: isLocked ? '#e2e8f0' : 'white' }}
                                  />
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2b3674' }}>
                                  {row.total_score}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <span style={{ 
                                    padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold',
                                    backgroundColor: row.grade === 'A' ? '#e6fffa' : row.grade === 'F' ? '#ffe5e5' : '#fefcbf',
                                    color: row.grade === 'A' ? '#047457' : row.grade === 'F' ? '#c53030' : '#b7791f'
                                  }}>
                                    {row.grade || '-'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <button 
                        onClick={handleSaveStudentReport}
                        disabled={savingGrading || isLocked}
                        style={{ 
                          padding: '10px 28px', backgroundColor: isLocked ? '#cbd5e0' : '#4318FF', 
                          color: isLocked ? '#718096' : 'white', 
                          border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: isLocked ? 'not-allowed' : 'pointer',
                          fontSize: '0.95rem'
                        }}
                      >
                        {savingGrading ? 'Saving Report Card...' : 'Save Student Report Card Table'}
                      </button>
                      {gradingMessage.text && (
                        <span style={{ color: gradingMessage.type === 'success' ? '#05cd99' : '#e53e3e', fontWeight: 'bold' }}>
                          {gradingMessage.text}
                        </span>
                      )}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        )}

        {/* --- 3. STUDENT ROSTER TAB --- */}
        {activeTab === 'roster' && (
          <>
            {generatedCreds && (
              <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#234e52' }}>✅ Student Added Successfully!</h4>
                <p style={{ margin: '0 0 5px 0' }}>Please give these credentials to the student:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontWeight: 'bold' }}>
                  <li>Name: {generatedCreds.name}</li>
                  <li>Login ID: {generatedCreds.username}</li>
                  <li>Password: {generatedCreds.password}</li>
                </ul>
              </div>
            )}

            <div className="dashboard-card" style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#4a5568' }}>Add New Student</h4>
              <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Enter Student's Full Name" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                  required
                />
                <button 
                  type="submit" 
                  disabled={adding}
                  style={{ padding: '10px 20px', background: '#4318FF', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  {adding ? 'Adding...' : 'Add Student'}
                </button>
              </form>
            </div>

            <div className="dashboard-card">
              <h4 style={{ margin: '0 0 15px 0', color: '#4a5568' }}>Student Roster</h4>
              {loading ? (
                <p>Loading students...</p>
              ) : students.length === 0 ? (
                <p>No students in your class yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                        <th style={{ padding: '12px' }}>Full Name</th>
                        <th style={{ padding: '12px' }}>Login ID</th>
                        <th style={{ padding: '12px' }}>Joined Date</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#2b3674' }}>{student.full_name}</td>
                          <td style={{ padding: '12px', color: '#4a5568' }}>{student.username}</td>
                          <td style={{ padding: '12px', color: '#4a5568' }}>{new Date(student.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleRemoveStudent(student.id, student.full_name)}
                              style={{ background: '#ffebee', color: '#d32f2f', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              Remove
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

        {/* --- 4. STUDENT REMARKS TAB --- */}
        {activeTab === 'remarks' && (
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Student Evaluation Remarks</h3>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '20px' }}>
              Add evaluation remarks on student performance and behavior for the report card.
            </p>

            {/* Filter selectors */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Academic Term</label>
                <select 
                  value={remarksTerm} 
                  onChange={(e) => setRemarksTerm(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: 'white', color: '#2d3748', fontSize: '0.95rem' }}
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Academic Year</label>
                <select 
                  value={remarksYear} 
                  onChange={(e) => setRemarksYear(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: 'white', color: '#2d3748', fontSize: '0.95rem' }}
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={() => setShowBulkModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #05cd99 0%, #36b37e 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 12px rgba(5, 205, 153, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ⚡ Bulk Evaluation (All Class)
                </button>
              </div>
            </div>

            {loadingRemarks ? (
              <p>Loading student remarks...</p>
            ) : remarksList.length === 0 ? (
              <p style={{ color: '#718096' }}>No students found in your class.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1', backgroundColor: '#f7fafc' }}>
                      <th style={{ padding: '12px' }}>Student Info</th>
                      <th style={{ padding: '12px' }}>Ratings & Attendance</th>
                      <th style={{ padding: '12px' }}>Class Master's Remark</th>
                      <th style={{ padding: '12px' }}>Principal's Remark</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remarksList.map(student => {
                      const hasRatings = student.punctuality !== null;
                      const avgRating = hasRatings ? (
                        ((student.punctuality || 0) + (student.neatness || 0) + (student.honesty || 0) +
                         (student.peer_relation || 0) + (student.attentiveness || 0) + (student.perseverance || 0) +
                         (student.leadership || 0) + (student.handwriting || 0) + (student.sports || 0) + (student.crafts || 0)
                        ) / 10
                      ) : null;
                      return (
                        <tr key={student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 'bold', color: '#2b3674' }}>{student.full_name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#718096' }}>{student.username}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {hasRatings ? (
                              <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>
                                <div>⭐ Avg Rating: {avgRating.toFixed(1)} / 5</div>
                                <div style={{ marginTop: '2px', color: '#718096' }}>
                                  📅 Present: {student.days_present}/{student.days_open} days
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#edf2f7', color: '#718096' }}>
                                Pending Assessment
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.9rem', color: '#2d3748', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.class_master_remark || <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>No remark entered</span>}
                          </td>
                          <td style={{ padding: '12px', color: student.principal_remark ? '#2d3748' : '#a0aec0', fontStyle: 'italic', fontSize: '0.9rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.principal_remark || 'No Principal remark yet.'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenAssessmentModal(student)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#4318FF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                boxShadow: '0 4px 12px rgba(67, 24, 255, 0.15)'
                              }}
                            >
                              Assess Student
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- BEHAVIOR & ATTENDANCE ASSESSMENT MODAL --- */}
        {selectedStudentRemarks && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #4318FF 0%, #868CFF 100%)',
                color: 'white',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Assess Student: {selectedStudentRemarks.full_name}
                </h3>
                <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px' }}>
                  {selectedStudentRemarks.username}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', color: '#2d3748' }}>
                {/* Left Column: Cognitive & Affective Traits */}
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: '#1B2559', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
                    Cognitive & Affective Domains (1–5)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'punctuality', label: 'Punctuality' },
                      { key: 'neatness', label: 'Neatness / Cleanliness' },
                      { key: 'honesty', label: 'Honesty & Reliability' },
                      { key: 'peer_relation', label: 'Relationship with Peers' },
                      { key: 'attentiveness', label: 'Attentiveness in Class' },
                      { key: 'perseverance', label: 'Industry / Perseverance' },
                      { key: 'leadership', label: 'Leadership & Cooperation' },
                      { key: 'handwriting', label: 'Hand Writing' },
                      { key: 'sports', label: 'Sports & Games' },
                      { key: 'crafts', label: 'Manual Skills / Crafts' }
                    ].map(field => (
                      <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', color: '#4A5568', fontWeight: '500' }}>{field.label}</label>
                        <select
                          value={ratingsForm[field.key]}
                          onChange={(e) => setRatingsForm(prev => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            background: 'white',
                            color: '#2d3748',
                            fontSize: '0.9rem',
                            width: '120px'
                          }}
                        >
                          <option value="5">5 - Excellent</option>
                          <option value="4">4 - Very Good</option>
                          <option value="3">3 - Good</option>
                          <option value="2">2 - Fair</option>
                          <option value="1">1 - Poor</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Attendance & Remarks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', color: '#1B2559', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
                      Term Attendance Summary
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 'bold' }}>
                          Total Days Open
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={ratingsForm.days_open}
                          onChange={(e) => setRatingsForm(prev => ({ ...prev, days_open: parseInt(e.target.value) || 0 }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            fontSize: '0.9rem',
                            background: 'white',
                            color: '#2d3748'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 'bold' }}>
                          Days Present
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={ratingsForm.days_present}
                          onChange={(e) => setRatingsForm(prev => ({ ...prev, days_present: parseInt(e.target.value) || 0 }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            fontSize: '0.9rem',
                            background: 'white',
                            color: '#2d3748'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#1B2559', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
                      Class Master's Remark
                    </h4>
                    <textarea
                      value={ratingsForm.remark}
                      onChange={(e) => setRatingsForm(prev => ({ ...prev, remark: e.target.value }))}
                      placeholder="Enter performance & behavior remarks..."
                      style={{
                        width: '100%',
                        height: '140px',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e0',
                        fontSize: '0.9rem',
                        resize: 'none',
                        background: 'white',
                        color: '#2d3748'
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setSelectedStudentRemarks(null)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e0',
                        background: '#edf2f7',
                        color: '#4a5568',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveAssessment(selectedStudentRemarks.id, ratingsForm)}
                      disabled={savingRemarkId !== null}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#4318FF',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(67, 24, 255, 0.25)'
                      }}
                    >
                      {savingRemarkId !== null ? 'Saving...' : 'Save Assessment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- BULK BEHAVIOR & ATTENDANCE ASSESSMENT MODAL --- */}
        {showBulkModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #05cd99 0%, #36b37e 100%)',
                color: 'white',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                  ⚡ Bulk Evaluation: Entire Class ({remarksTerm})
                </h3>
                <button
                  onClick={() => setShowBulkModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', color: '#2d3748' }}>
                {/* Left Column: Cognitive & Affective Traits */}
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: '#1B2559', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
                    Default Cognitive & Affective Domains (1–5)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'punctuality', label: 'Punctuality' },
                      { key: 'neatness', label: 'Neatness / Cleanliness' },
                      { key: 'honesty', label: 'Honesty & Reliability' },
                      { key: 'peer_relation', label: 'Relationship with Peers' },
                      { key: 'attentiveness', label: 'Attentiveness in Class' },
                      { key: 'perseverance', label: 'Industry / Perseverance' },
                      { key: 'leadership', label: 'Leadership & Cooperation' },
                      { key: 'handwriting', label: 'Hand Writing' },
                      { key: 'sports', label: 'Sports & Games' },
                      { key: 'crafts', label: 'Manual Skills / Crafts' }
                    ].map(field => (
                      <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.9rem', color: '#4A5568', fontWeight: '500' }}>{field.label}</label>
                        <select
                          value={bulkRatingsForm[field.key]}
                          onChange={(e) => setBulkRatingsForm(prev => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            background: 'white',
                            color: '#2d3748',
                            fontSize: '0.9rem',
                            width: '120px'
                          }}
                        >
                          <option value="5">5 - Excellent</option>
                          <option value="4">4 - Very Good</option>
                          <option value="3">3 - Good</option>
                          <option value="2">2 - Fair</option>
                          <option value="1">1 - Poor</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Attendance & Remarks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', color: '#1B2559', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
                      Default Attendance Summary
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 'bold' }}>
                          Total Days Open
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={bulkRatingsForm.days_open}
                          onChange={(e) => setBulkRatingsForm(prev => ({ ...prev, days_open: parseInt(e.target.value) || 0 }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            fontSize: '0.9rem',
                            background: 'white',
                            color: '#2d3748'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 'bold' }}>
                          Days Present
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={bulkRatingsForm.days_present}
                          onChange={(e) => setBulkRatingsForm(prev => ({ ...prev, days_present: parseInt(e.target.value) || 0 }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e0',
                            fontSize: '0.9rem',
                            background: 'white',
                            color: '#2d3748'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: '#1B2559', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
                      Default Class Master's Remark
                    </h4>
                    <textarea
                      value={bulkRatingsForm.remark}
                      onChange={(e) => setBulkRatingsForm(prev => ({ ...prev, remark: e.target.value }))}
                      placeholder="e.g. A very active and cooperative student who shows great academic potential. Recommended for promotion."
                      style={{
                        width: '100%',
                        height: '140px',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e0',
                        fontSize: '0.9rem',
                        resize: 'none',
                        background: 'white',
                        color: '#2d3748'
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowBulkModal(false)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e0',
                        background: '#edf2f7',
                        color: '#4a5568',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBulkAssessment}
                      disabled={savingBulk}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#05cd99',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(5, 205, 153, 0.25)'
                      }}
                    >
                      {savingBulk ? 'Applying...' : 'Apply to All Students'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
