import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

function formatPosition(pos) {
  if (!pos) return 'N/A';
  const j = pos % 10;
  const k = pos % 100;
  if (j === 1 && k !== 11) return pos + "st";
  if (j === 2 && k !== 12) return pos + "nd";
  if (j === 3 && k !== 13) return pos + "rd";
  return pos + "th";
}

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sub Tab Navigation synced with URL route
  let activeSubTab = 'attendance';
  if (location.pathname === '/student/results') {
    activeSubTab = 'results';
  }

  // Report Card Filter States
  const [term, setTerm] = useState('1st Term');
  const [year, setYear] = useState('2025/2026');
  const [termReport, setTermReport] = useState(null);
  const [loadingTermReport, setLoadingTermReport] = useState(false);

  const [studentProfile, setStudentProfile] = useState(null);



  useEffect(() => {
    fetchStudentData();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setStudentProfile(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === 'results') {
      fetchTermReport(term, year);
    }
  }, [term, year, activeSubTab]);



  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [attendanceRes, resultsRes] = await Promise.all([
        axios.get('/api/student/attendance', { headers }),
        axios.get('/api/student/results', { headers })
      ]);

      setAttendance(attendanceRes.data);
      setResults(resultsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTermReport = async (selectedTerm, selectedYear) => {
    setLoadingTermReport(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/student/term-report?term=${encodeURIComponent(selectedTerm)}&year=${encodeURIComponent(selectedYear)}`, { headers });
      setTermReport(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load term report card.');
    } finally {
      setLoadingTermReport(false);
    }
  };

  const renderRating = (val) => {
    if (val === null || val === undefined) return '-';
    return `${val} / 5`;
  };

  return (
    <DashboardLayout title="Student Overview" role="student">
      
      {/* Overview Cards */}
      <div className="grid-responsive mb-lg">
        <div className="dashboard-card">
          <h3 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>Overall Attendance</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary)' }}>
            {loading ? '...' : error ? 'N/A' : `${attendance?.overallPercentage}%`}
          </p>
          <p style={{ margin: 'var(--space-sm) 0 0 0', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>
            {loading ? '' : error ? error : `${attendance?.presentDays} Present / ${attendance?.totalDays} Total Days`}
          </p>
        </div>

        <div className="dashboard-card">
          <h3 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.9rem' }}>Subjects Passed</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--color-accent)' }}>
            {loading ? '...' : results.filter(r => r.grade !== 'F').length}
          </p>
          <p style={{ margin: 'var(--space-sm) 0 0 0', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>Finalized subjects with grade ≥ E</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-row gap-md no-print" style={{ borderBottom: '1.5px solid var(--color-border)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
        <button 
          onClick={() => navigate('/student/attendance')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeSubTab === 'attendance' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeSubTab === 'attendance' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Attendance History
        </button>
        <button 
          onClick={() => navigate('/student/results')}
          style={{ 
            padding: '12px 16px', background: 'none', border: 'none', 
            borderBottom: activeSubTab === 'results' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
            color: activeSubTab === 'results' ? 'var(--color-accent)' : 'var(--color-secondary)', 
            fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Academic Report Card
        </button>
      </div>

      <div>
        {error && <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

        {/* --- 1. ATTENDANCE HISTORY --- */}
        {activeSubTab === 'attendance' && (
          <div className="dashboard-card">
            <h3 style={{ margin: '0 0 15px 0', color: '#2b3674' }}>My Attendance History</h3>
            
            {loading ? (
              <p>Loading records...</p>
            ) : attendance?.history.length === 0 ? (
              <p style={{ color: '#718096' }}>No attendance records found yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a3aed1' }}>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance?.history.map((record, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', color: '#2b3674', fontWeight: '500' }}>
                          {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            textTransform: 'capitalize',
                            backgroundColor: record.status === 'present' ? '#e6fffa' : record.status === 'late' ? '#fefcbf' : '#ffe5e5',
                            color: record.status === 'present' ? '#047457' : record.status === 'late' ? '#b7791f' : '#c53030'
                          }}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- 2. ACADEMIC REPORT CARD --- */}
        {activeSubTab === 'results' && (
          <div className="dashboard-card">
            <div className="flex-between mb-md no-print">
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Academic Report Card</h3>
                <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', margin: 'var(--space-xs) 0 0 0' }}>
                  Only official grades finalized and published by the Exams Officer are shown here.
                </p>
              </div>
              <button 
                onClick={() => window.print()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-bg-surface)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  fontSize: '0.95rem',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                Print Report Card
              </button>
            </div>

            {/* Term/Year Selectors */}
            <div className="flex-row gap-md mb-md flex-wrap">
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: '600' }}>Academic Term</label>
                <select 
                  value={term} 
                  onChange={(e) => setTerm(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-primary)', fontSize: '0.95rem' }}
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: '600' }}>Academic Year</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-primary)', fontSize: '0.95rem' }}
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>
            </div>

            {loadingTermReport ? (
              <p>Loading report card...</p>
            ) : !termReport || termReport.results.length === 0 ? (
              <p style={{ color: '#718096' }}>No finalized results available for this term yet.</p>
            ) : (
              <div className="report-print-container">
                <style>{`
                  .report-print-container {
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
                    .report-print-container {
                      border: none !important;
                      box-shadow: none !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      width: 100% !important;
                      max-width: 100% !important;
                    }
                    .term-print-card {
                      border: 1px solid #000000 !important;
                      border-radius: 0 !important;
                      padding: 20px !important;
                      margin-bottom: 0 !important;
                      background: #ffffff !important;
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

                <div className="term-print-card">
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
                        <td style={{ padding: '10px', color: '#2b3674', fontWeight: '700', fontSize: '1.05rem', border: '1px solid #edf2f7' }}>{studentProfile?.full_name}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', width: '20%', border: '1px solid #edf2f7' }}>Class of Record:</td>
                        <td style={{ padding: '10px', color: '#2b3674', fontWeight: '700', border: '1px solid #edf2f7' }}>{termReport.className || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Admission ID:</td>
                        <td style={{ padding: '10px', color: '#2b3674', fontFamily: 'monospace', fontWeight: '600', border: '1px solid #edf2f7' }}>{studentProfile?.username}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Academic Period:</td>
                        <td style={{ padding: '10px', color: '#2b3674', border: '1px solid #edf2f7' }}>{term} ({year})</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Term Average:</td>
                        <td style={{ padding: '10px', color: '#047457', fontWeight: '700', border: '1px solid #edf2f7' }}>{termReport.averageScore ? `${termReport.averageScore.toFixed(2)}%` : 'N/A'}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7' }}>Class Position:</td>
                        <td style={{ padding: '10px', color: '#4318FF', fontWeight: '700', border: '1px solid #edf2f7' }}>
                          {termReport.position ? `${formatPosition(termReport.position)} of ${termReport.totalStudents}` : 'N/A'}
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
                      {termReport.results.map((row, rIdx) => {
                        const caTotal = (parseFloat(row.test_score) || 0) + (parseFloat(row.test2_score) || 0) + (parseFloat(row.other_ca_score) || 0);
                        return (
                          <tr key={row.id || rIdx} style={{ borderBottom: '1px solid #edf2f7' }}>
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
                              {termReport.remarks?.[trait.key] !== null && termReport.remarks?.[trait.key] !== undefined ? termReport.remarks[trait.key] : '-'}
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
                                {termReport.remarks?.days_open !== null && termReport.remarks?.days_open !== undefined ? termReport.remarks.days_open : '-'}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                              <td style={{ padding: '3px 0', color: '#4a5568' }}>Days Present:</td>
                              <td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right', color: '#2b3674' }}>
                                {termReport.remarks?.days_present !== null && termReport.remarks?.days_present !== undefined ? termReport.remarks.days_present : '-'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0', color: '#4a5568' }}>Attendance Rate:</td>
                              <td style={{ padding: '3px 0', fontWeight: 'bold', textAlign: 'right', color: '#047457' }}>
                                {termReport.remarks?.days_open && termReport.remarks?.days_present !== null 
                                  ? `${Math.round((termReport.remarks.days_present / termReport.remarks.days_open) * 100)}%` 
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
                            <strong>Class Master:</strong> <span style={{ fontStyle: 'italic' }}>{termReport.remarks?.class_master_remark || 'No remark entered.'}</span>
                          </div>
                          <div>
                            <strong>Principal:</strong> <span style={{ fontStyle: 'italic' }}>{termReport.remarks?.principal_remark || 'No remark entered.'}</span>
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
              </div>
            )}
          </div>
        )}


      </div>

    </DashboardLayout>
  );
}
