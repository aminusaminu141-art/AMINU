import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

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

export default function PrincipalDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [masters, setMasters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sync activeSubTab with URL routing paths
  let activeSubTab = 'roster'; // default to Roster
  if (location.pathname === '/principal/assignments') {
    activeSubTab = 'assignments';
  } else if (location.pathname === '/principal/remarks') {
    activeSubTab = 'remarks';
  } else if (location.pathname === '/principal/graduates') {
    activeSubTab = 'graduates';
  }

  // Master Form State
  const [newMasterName, setNewMasterName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [adding, setAdding] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // Assignment Form State
  const [newTeacherName, setNewTeacherName] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignClassIds, setAssignClassIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  // Modal States
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedTeacherForAssignments, setSelectedTeacherForAssignments] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Principal Remarks State
  const [remarksClassId, setRemarksClassId] = useState('');
  const [remarksTerm, setRemarksTerm] = useState('1st Term');
  const [remarksYear, setRemarksYear] = useState('2025/2026');
  const [remarksList, setRemarksList] = useState([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [savingRemarkId, setSavingRemarkId] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPrincipalRemark, setBulkPrincipalRemark] = useState('');
  const [savingBulkRemarks, setSavingBulkRemarks] = useState(false);

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

  const toggleClass = (className) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'graduates') {
      fetchStudents();
      setGradViewMode('list');
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'remarks' && remarksClassId && remarksTerm && remarksYear) {
      fetchPrincipalRemarks();
    }
  }, [activeSubTab, remarksClassId, remarksTerm, remarksYear]);

  useEffect(() => {
    if (classes.length > 0 && !remarksClassId) {
      setRemarksClassId(classes[0].id.toString());
    }
  }, [classes]);

  const fetchPrincipalRemarks = async () => {
    setLoadingRemarks(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        `/api/principal/term-remarks?class_id=${remarksClassId}&academic_term=${encodeURIComponent(remarksTerm)}&academic_year=${encodeURIComponent(remarksYear)}`,
        { headers }
      );
      setRemarksList(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch student remarks.');
    } finally {
      setLoadingRemarks(false);
    }
  };

  const handleSavePrincipalRemark = async (studentId, remarkText) => {
    setSavingRemarkId(studentId);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        '/api/principal/term-remarks',
        {
          student_id: studentId,
          academic_term: remarksTerm,
          academic_year: remarksYear,
          remark: remarkText
        },
        { headers }
      );

      setRemarksList(prev => prev.map(item => 
        item.id === studentId ? { ...item, principal_remark: remarkText } : item
      ));

      alert('Principal remark saved successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to save remark.');
    } finally {
      setSavingRemarkId(null);
    }
  };

  const handleSaveBulkPrincipalRemarks = async (e) => {
    e.preventDefault();
    if (!remarksClassId) {
      alert('Please select a class first.');
      return;
    }

    if (!window.confirm('Are you sure you want to apply this official remark to ALL students in this class for the selected term? Existing remarks will be overwritten.')) {
      return;
    }

    setSavingBulkRemarks(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/principal/bulk-term-remarks', {
        class_id: remarksClassId,
        academic_term: remarksTerm,
        academic_year: remarksYear,
        remark: bulkPrincipalRemark
      }, { headers });

      alert('Bulk principal remarks applied successfully!');
      setShowBulkModal(false);
      setBulkPrincipalRemark('');
      fetchPrincipalRemarks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to apply bulk remarks.');
    } finally {
      setSavingBulkRemarks(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/principal/students', { headers });
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
      const res = await axios.get(`/api/principal/students/${student.id}/history`, { headers });
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
      const res = await axios.get(`/api/principal/students/${student.id}/history`, { headers });
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
      const res = await axios.get(`/api/principal/students/${student.id}/testimonial`, { headers });
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
      await axios.post('/api/principal/students/testimonial', {
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

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [mastersRes, classesRes, subjectsRes, assignmentsRes] = await Promise.all([
        axios.get('/api/principal/masters', { headers }),
        axios.get('/api/principal/classes', { headers }),
        axios.get('/api/principal/subjects', { headers }),
        axios.get('/api/principal/assignments', { headers })
      ]);

      setMasters(mastersRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setAssignments(assignmentsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaster = async (e) => {
    e.preventDefault();
    if (!newMasterName.trim()) return;

    setAdding(true);
    setGeneratedCreds(null);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/principal/masters',
        { 
          full_name: newMasterName, 
          class_id: selectedClassId || null 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchDashboardData();

      setGeneratedCreds({
        username: res.data.username,
        password: res.data.password,
        name: res.data.full_name
      });
      setNewMasterName('');
      setSelectedClassId('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add class master');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMaster = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove Class Master ${name}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/principal/masters/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMasters(masters.filter(m => m.id !== id));
      // Refresh assignments since teacher deletion cascades
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to remove class master');
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !assignSubjectId || assignClassIds.length === 0) {
      alert("Please fill in teacher's name, select a subject, and choose at least one class.");
      return;
    }

    setAssigning(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/principal/teachers-assign',
        {
          teacher_name: newTeacherName,
          subject_id: assignSubjectId,
          class_ids: assignClassIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchDashboardData(); // Refresh list

      setNewTeacherName('');
      setAssignSubjectId('');
      setAssignClassIds([]);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create teacher and assign classes.');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete teacher "${name}" and all their assignments?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/principal/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete teacher.');
    }
  };

  const getGroupedAssignments = () => {
    const grouped = {};
    assignments.forEach(item => {
      const key = item.teacher_id;
      if (!grouped[key]) {
        grouped[key] = {
          teacher_id: item.teacher_id,
          teacher_name: item.teacher_name,
          teacher_username: item.teacher_username || '',
          subjects: {},
          classes: {}
        };
      }
      grouped[key].subjects[item.subject_id] = item.subject_name;
      grouped[key].classes[item.class_id] = item.class_name;
    });
    return Object.values(grouped).map(t => ({
      teacher_id: t.teacher_id,
      teacher_name: t.teacher_name,
      teacher_username: t.teacher_username,
      subjectNames: Object.values(t.subjects).join(', '),
      classNames: Object.values(t.classes).join(', '),
      subjectIds: Object.keys(t.subjects).map(Number),
      classIds: Object.keys(t.classes).map(Number)
    }));
  };

  const handleOpenAssignmentModal = (teacher) => {
    setSelectedTeacherForAssignments(teacher);
    setSelectedSubjectIds(teacher.subjectIds);
    setSelectedClassIds(teacher.classIds);
    setIsAssignmentModalOpen(true);
  };

  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    if (!selectedTeacherForAssignments) return;
    setSavingAssignments(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/principal/teachers/${selectedTeacherForAssignments.teacher_id}/assignments`,
        {
          subject_ids: selectedSubjectIds,
          class_ids: selectedClassIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
      setIsAssignmentModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to save assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  const handlePrintTranscript = () => {
    const node = document.querySelector('.transcript-print-container');
    if (!node) {
      window.print();
      return;
    }
    const printWin = window.open('', '', 'width=950,height=850');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>&nbsp;</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
            }
            body {
              font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
              color: #1a202c !important;
              padding: 6mm 8mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, button, select, input {
              display: none !important;
            }
            .term-print-card {
              border: 2px solid #2b3674 !important;
              border-radius: 6px;
              padding: 14px 18px !important;
              background: #ffffff !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              margin-bottom: 0 !important;
            }
            .term-print-card:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-family: inherit;
            }
            th, td {
              border: 1px solid #cbd5e0 !important;
            }
          </style>
        </head>
        <body>
          <div class="transcript-print-container">
            ${node.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrintCertificate = () => {
    const node = document.querySelector('.print-cert-container');
    if (!node) {
      window.print();
      return;
    }
    const printWin = window.open('', '', 'width=1100,height=800');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>&nbsp;</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 landscape;
              margin: 0 !important;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              height: 100% !important;
            }
            body {
              font-family: 'Cinzel', 'Georgia', serif;
              color: #1a202c !important;
              padding: 5mm 6mm !important;
              display: flex;
              align-items: center;
              justify-content: center;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, button, select, input {
              display: none !important;
            }
            .print-cert-container {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div class="print-cert-container">
            ${node.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrintTestimonial = () => {
    const node = document.querySelector('.print-testimonial-container');
    if (!node) {
      window.print();
      return;
    }
    const printWin = window.open('', '', 'width=900,height=800');
    if (!printWin) {
      window.print();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>&nbsp;</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            * { box-sizing: border-box; }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000000 !important;
              padding: 10mm 12mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print, button, select, input {
              display: none !important;
            }
            .print-testimonial-container {
              width: 100% !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div class="print-testimonial-container">
            ${node.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <DashboardLayout title="Principal Dashboard" role="principal" studentCount={students.length}>

      {/* ── Welcome Banner ── */}
      <div className="no-print" style={{
        background: 'linear-gradient(135deg, var(--color-accent) 0%, #38bdf8 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '18px 24px',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-glow-md)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div>
          <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Principal Portal</p>
          <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            School Administration Overview
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
            Manage staff assignments, oversee student records, and endorse results.
          </p>
        </div>
        <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: '12px', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-3 mb-lg no-print">
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Class Masters</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {loading ? '…' : masters.length}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Active form teachers</p>
        </div>

        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Assignments</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-success)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {loading ? '…' : assignments.length}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Subjects assigned</p>
        </div>
      </div>

      {/* Visual Analytics Chart (Assignments tab only) */}
      {!loading && assignments.length > 0 && activeSubTab === 'assignments' && (
        <div className="dashboard-card mb-lg animate-fade-in no-print" style={{ padding: 'var(--space-xl)' }}>
          <h3 style={{ margin: '0 0 var(--space-md) 0', color: 'var(--color-primary)' }}>Teacher Assignments & Workload Overview</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getGroupedAssignments().map(item => ({
                name: item.teacher_name,
                'Classes Handled': item.classNames ? item.classNames.split(', ').length : 0,
                'Subjects Taught': item.subjectNames ? item.subjectNames.split(', ').length : 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--color-secondary)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Classes Handled" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Subjects Taught" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1.5px solid var(--color-border)', marginBottom: 'var(--space-lg)', paddingBottom: '2px', overflowX: 'auto' }} className="no-print">
        {[
          { path: '/principal/staff', label: 'Class Masters Roster', key: 'roster' },
          { path: '/principal/assignments', label: 'Teacher Assignments', key: 'assignments' },
          { path: '/principal/remarks', label: 'Student Remarks', key: 'remarks' },
          { path: '/principal/graduates', label: 'Graduates & Certificates', key: 'graduates' },
        ].map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              padding: '8px 16px',
              background: activeSubTab === tab.key ? 'var(--color-accent-light)' : 'transparent',
              color: activeSubTab === tab.key ? 'var(--color-accent)' : 'var(--color-secondary)',
              fontWeight: activeSubTab === tab.key ? 800 : 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
              border: 'none',
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
              transition: 'all 0.15s ease',
              borderBottom: activeSubTab === tab.key ? '2px solid var(--color-accent)' : '2px solid transparent',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '10px' }}>
        {error && <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

        {/* --- 1. CLASS MASTERS ROSTER --- */}
        {activeSubTab === 'roster' && (
          <>
            {generatedCreds && (
              <div style={{ background: '#e6fffa', border: '1px solid #38b2ac', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#234e52' }}> Class Master Created!</h4>
                <p style={{ margin: '0 0 5px 0' }}>Provide these login details to the teacher:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontWeight: 'bold' }}>
                  <li>Name: {generatedCreds.name}</li>
                  <li>Login ID: {generatedCreds.username}</li>
                  <li>Password: {generatedCreds.password}</li>
                </ul>
              </div>
            )}

            {/* Add Class Master Form */}
            <div className="dashboard-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Add New Class Master</h3>
              <form onSubmit={handleAddMaster} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Enter Teacher's Full Name" 
                  value={newMasterName}
                  onChange={(e) => setNewMasterName(e.target.value)}
                  style={{ flex: 2, minWidth: '200px', padding: '10px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                  required
                />
                
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  style={{ flex: 1, minWidth: '150px', padding: '10px', borderRadius: '5px', border: '1px solid #e2e8f0', background: 'white' }}
                >
                  <option value="">-- Assign Class (Optional) --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <button 
                  type="submit" 
                  disabled={adding}
                  style={{ 
                    padding: '10px 20px', background: '#4318FF', color: 'white', 
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                  }}
                >
                  {adding ? 'Creating...' : 'Create Class Master'}
                </button>
              </form>
            </div>

            {/* Class Masters Table */}
            <div className="dashboard-card">
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Class Masters Roster</h3>
              {loading ? (
                <p>Loading Class Masters...</p>
              ) : masters.length === 0 ? (
                <p>No Class Masters registered yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                        <th style={{ padding: '12px' }}>Full Name</th>
                        <th style={{ padding: '12px' }}>Login ID</th>
                        <th style={{ padding: '12px' }}>Assigned Class</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masters.map(master => (
                        <tr key={master.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#2b3674' }}>{master.full_name}</td>
                          <td style={{ padding: '12px', color: '#4a5568' }}>{master.username}</td>
                          <td style={{ padding: '12px', color: '#4a5568' }}>
                            {master.class_name ? (
                              <span style={{ padding: '4px 8px', background: '#e6f4ff', color: '#096dd9', borderRadius: '4px', fontWeight: '600', fontSize: '0.85rem' }}>
                                {master.class_name}
                              </span>
                            ) : (
                              <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>Unassigned</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button 
                              onClick={() => handleRemoveMaster(master.id, master.full_name)}
                              style={{ 
                                background: '#ffebee', color: '#d32f2f', border: 'none', 
                                padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                fontWeight: 'bold', fontSize: '0.85rem'
                              }}
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
        )}        {/* --- 2. TEACHER ASSIGNMENTS --- */}
        {activeSubTab === 'assignments' && (
          <>
            {/* Assign Subject Form */}
            <div className="dashboard-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Add & Assign Teacher</h3>
              <form onSubmit={handleAddAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Teacher's Name input */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#4a5568' }}>Teacher's Full Name:</label>
                  <input 
                    type="text" 
                    placeholder="Enter Teacher's Full Name" 
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e2e8f0' }}
                    required
                  />
                </div>

                {/* Select Subject */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#4a5568' }}>Subject to Teach:</label>
                  <select
                    value={assignSubjectId}
                    onChange={(e) => setAssignSubjectId(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #e2e8f0', background: 'white' }}
                    required
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Checkboxes for Classes */}
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#4a5568' }}>Choose Classes to Teach:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '5px', background: '#f8fafc' }}>
                    {classes.map(c => {
                      const isChecked = assignClassIds.includes(c.id);
                      return (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#2d3748' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignClassIds([...assignClassIds, c.id]);
                              } else {
                                setAssignClassIds(assignClassIds.filter(id => id !== c.id));
                              }
                            }}
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <button 
                    type="submit" 
                    disabled={assigning}
                    style={{ 
                      padding: '10px 20px', background: '#05cd99', color: 'white', 
                      border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    {assigning ? 'Adding...' : 'Add & Assign Teacher'}
                  </button>
                </div>
              </form>
            </div>

            {/* Assignments Table */}
            <div className="dashboard-card">
              <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Assigned Teachers & Classes</h3>
              {loading ? (
                <p>Loading assignments...</p>
              ) : assignments.length === 0 ? (
                <p>No teacher assignments registered yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                        <th style={{ padding: '12px' }}>Teacher</th>
                        <th style={{ padding: '12px' }}>Classes Handled</th>
                        <th style={{ padding: '12px' }}>Subjects Taught</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getGroupedAssignments().map((item, idx) => (
                        <tr key={`${item.teacher_id}_${idx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#2b3674' }}>
                            {item.teacher_name}
                          </td>
                          <td style={{ padding: '12px', color: '#4a5568' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {item.classNames ? item.classNames.split(', ').map((cName, i) => (
                                <span key={i} style={{ padding: '2px 8px', background: '#e6f4ff', color: '#096dd9', borderRadius: '4px', fontWeight: '600', fontSize: '0.8rem' }}>
                                  {cName}
                                </span>
                              )) : <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>None</span>}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#4a5568' }}>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {item.subjectNames ? item.subjectNames.split(', ').map((sName, i) => (
                                <span key={i} style={{ padding: '2px 8px', background: '#f5f5f5', color: '#595959', borderRadius: '4px', fontWeight: '600', fontSize: '0.8rem' }}>
                                  {sName}
                                </span>
                              )) : <span style={{ color: '#a0aec0', fontStyle: 'italic' }}>None</span>}
                            </div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                type="button"
                                onClick={() => handleOpenAssignmentModal(item)}
                                style={{ 
                                  background: '#e6f7ff', color: '#1890ff', border: 'none', 
                                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                  fontWeight: 'bold', fontSize: '0.85rem'
                                }}
                              >
                                Edit Assignments
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTeacher(item.teacher_id, item.teacher_name)}
                                style={{ 
                                  background: '#ffebee', color: '#d32f2f', border: 'none', 
                                  padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                                  fontWeight: 'bold', fontSize: '0.85rem'
                                }}
                              >
                                Delete Teacher
                              </button>
                            </div>
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

        {/* --- 3. STUDENT REMARKS TAB --- */}
        {activeSubTab === 'remarks' && (
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>Student Evaluation Remarks (Principal)</h3>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '20px' }}>
              Select a class to review the Class Master's remarks and add the official Principal's remarks.
            </p>

            {/* Filter selectors */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#4a5568', fontWeight: 'bold' }}>Class</label>
                <select 
                  value={remarksClassId} 
                  onChange={(e) => setRemarksClassId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', background: 'white', color: '#2d3748', fontSize: '0.95rem', minWidth: '150px' }}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
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
              {remarksClassId && remarksList.length > 0 && (
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
                     Bulk Remark (All Class)
                  </button>
                </div>
              )}
            </div>

            {loadingRemarks ? (
              <p>Loading student remarks...</p>
            ) : !remarksClassId ? (
              <p style={{ color: '#718096' }}>Please select a class to view remarks.</p>
            ) : remarksList.length === 0 ? (
              <p style={{ color: '#718096' }}>No students found in the selected class.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1', backgroundColor: '#f7fafc' }}>
                      <th style={{ padding: '12px', width: '20%' }}>Student Name</th>
                      <th style={{ padding: '12px', width: '40%' }}>Class Master's Evaluation</th>
                      <th style={{ padding: '12px', width: '40%' }}>Principal's Official Remark</th>
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
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#2b3674' }}>
                            {student.full_name}
                            <div style={{ fontSize: '0.8rem', color: '#a3aed1', fontWeight: 'normal' }}>{student.username}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ color: student.class_master_remark ? '#2d3748' : '#a0aec0', fontStyle: 'italic', fontSize: '0.9rem' }}>
                              "{student.class_master_remark || 'No remark from Class Master yet.'}"
                            </div>
                            {hasRatings ? (
                              <div style={{ marginTop: '8px', fontSize: '0.8rem', background: '#f7fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #edf2f7', color: '#4a5568' }}>
                                <strong> Avg Behavior Rating: {avgRating.toFixed(1)}/5</strong> | <strong> Attendance: {student.days_present}/{student.days_open} days</strong>
                              </div>
                            ) : (
                              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#a0aec0', fontStyle: 'italic' }}>
                                No behavior/attendance rating entered yet.
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <textarea
                                key={`${student.id}-${remarksClassId}-${remarksTerm}-${remarksYear}`}
                                defaultValue={student.principal_remark}
                                id={`pr-remark-${student.id}`}
                                placeholder="e.g. Excellent behavior and grade performance. Recommended for promotion."
                                style={{ 
                                  flex: 1, 
                                  minHeight: '60px', 
                                  padding: '8px', 
                                  borderRadius: '4px', 
                                  border: '1px solid #cbd5e0', 
                                  fontSize: '0.9rem',
                                  resize: 'vertical',
                                  background: 'white',
                                  color: '#2d3748'
                                }}
                              />
                              <button
                                onClick={() => {
                                  const text = document.getElementById(`pr-remark-${student.id}`).value;
                                  handleSavePrincipalRemark(student.id, text);
                                }}
                                disabled={savingRemarkId === student.id}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#4318FF',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '0.85rem'
                                }}
                              >
                                {savingRemarkId === student.id ? 'Saving...' : 'Save'}
                              </button>
                            </div>
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

        {/* --- 4. GRADUATES & CERTIFICATES TAB --- */}
        {activeSubTab === 'graduates' && (
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
                                <span style={{ fontSize: '1.2rem' }}></span>
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
                                               Transcript
                                            </button>
                                            {isGraduatingClass(className) && (
                                              <>
                                                <button 
                                                  onClick={() => handleOpenCertificate(student)}
                                                  style={{ background: '#fffbeb', color: '#d97706', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                >
                                                   Certificate
                                                </button>
                                                <button 
                                                  onClick={() => handleOpenTestimonial(student)}
                                                  style={{ background: '#eef2ff', color: '#4318FF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                >
                                                   Testimonial
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
                      onClick={handlePrintTranscript}
                      style={{ background: '#4318FF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ️ Print Transcript
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
                    @page {
                      size: auto;
                      margin: 0 !important;
                    }
                    html, body {
                      background: #ffffff !important;
                      color: #000000 !important;
                      margin: 0 !important;
                      padding: 10mm 10mm !important;
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
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
                                 Affective & Psychomotor Ratings (1-5 Scale)
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
                                   Attendance Statistics
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
                                   Official Comments
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
                    onClick={handlePrintCertificate}
                    style={{ background: '#4318FF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ️ Print Certificate
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
                    onClick={handlePrintTestimonial}
                    style={{ background: '#4318FF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ️ Print Testimonial
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
                        {savingTestimonial ? 'Saving...' : ' Save Testimonial Data'}
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

            {/* Report Card view mode */}


        {/* --- BULK OFFICIAL REMARKS MODAL (PRINCIPAL) --- */}
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
              maxWidth: '600px',
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
                   Bulk Official Remark (Entire Class)
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
              <form onSubmit={handleSaveBulkPrincipalRemarks} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ color: '#4a5568', fontSize: '0.9rem', margin: 0 }}>
                  This will apply the official Principal remark to all students in the selected class for <strong>{remarksTerm} ({remarksYear})</strong>. You can still modify individual student remarks afterward.
                </p>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: '#1B2559', marginBottom: '8px', fontWeight: 'bold' }}>
                    Default Principal's Remark
                  </label>
                  <textarea
                    value={bulkPrincipalRemark}
                    onChange={(e) => setBulkPrincipalRemark(e.target.value)}
                    required
                    placeholder="e.g. An excellent term performance. Promoted successfully with honors."
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

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
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
                    type="submit"
                    disabled={savingBulkRemarks}
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
                    {savingBulkRemarks ? 'Applying...' : 'Apply to All Students'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MANAGE SUBJECT ASSIGNMENTS MODAL (PRINCIPAL) --- */}
        {isAssignmentModalOpen && selectedTeacherForAssignments && (
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
              maxWidth: '500px',
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
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                color: 'white',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>
                  Manage Assignments: {selectedTeacherForAssignments.teacher_name}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)} 
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveAssignments} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                  {/* Subjects Selection */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#4b5563', fontSize: '0.85rem', textTransform: 'uppercase', tracking: '0.05em' }}>
                      Subjects to Teach:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', maxHeight: '150px', overflowY: 'auto' }}>
                      {subjects.map(sub => {
                        const isChecked = selectedSubjectIds.includes(sub.id);
                        return (
                          <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                                } else {
                                  setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== sub.id));
                                }
                              }}
                            />
                            {sub.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Classes Selection */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#4b5563', fontSize: '0.85rem', textTransform: 'uppercase', tracking: '0.05em' }}>
                      Classes Handled:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', maxHeight: '150px', overflowY: 'auto' }}>
                      {classes.map(cls => {
                        const isChecked = selectedClassIds.includes(cls.id);
                        return (
                          <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#374151' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClassIds([...selectedClassIds, cls.id]);
                                } else {
                                  setSelectedClassIds(selectedClassIds.filter(id => id !== cls.id));
                                }
                              }}
                            />
                            {cls.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f9fafb', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAssignmentModalOpen(false)}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', color: '#4b5563', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAssignments}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#1890ff',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(24, 144, 255, 0.25)'
                    }}
                  >
                    {savingAssignments ? 'Saving...' : 'Save Assignments'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
