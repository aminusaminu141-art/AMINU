import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

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
  } else if (location.pathname === '/student/fees') {
    activeSubTab = 'fees';
  }

  // Report Card & Fees Filter States
  const [term, setTerm] = useState('1st Term');
  const [year, setYear] = useState('2025/2026');
  const [termReport, setTermReport] = useState(null);
  const [loadingTermReport, setLoadingTermReport] = useState(false);

  const [studentProfile, setStudentProfile] = useState(null);

  // School Fees and Payments States
  const [feesSummary, setFeesSummary] = useState(null);
  const [feesDetails, setFeesDetails] = useState(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feesError, setFeesError] = useState('');
  
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmountType, setPaymentAmountType] = useState('full'); // 'full' or 'custom'
  const [customAmount, setCustomAmount] = useState('');
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

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
    } else if (activeSubTab === 'fees') {
      fetchFeesDetails(term, year);
      fetchPaymentHistory();
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

      // Load school fees summary for the current session card
      try {
        const feesRes = await axios.get('/api/payment/fees', { headers });
        setFeesSummary(feesRes.data);
      } catch (feeErr) {
        console.warn('Failed to load current term fees summary for card:', feeErr.message);
      }

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

  const fetchFeesDetails = async (selectedTerm, selectedYear) => {
    setLoadingFees(true);
    setFeesError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/payment/fees?term=${encodeURIComponent(selectedTerm)}&year=${encodeURIComponent(selectedYear)}`, { headers });
      setFeesDetails(res.data);
      if (selectedTerm === '1st Term' && selectedYear === '2025/2026') {
        setFeesSummary(res.data);
      }
    } catch (err) {
      console.error(err);
      setFeesError(err.response?.data?.msg || 'Failed to load school fees statement.');
    } finally {
      setLoadingFees(false);
    }
  };

  const fetchPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/payment/history', { headers });
      setPaymentHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleInitializePayment = async () => {
    const amountToPay = paymentAmountType === 'full' ? feesDetails.balance : parseFloat(customAmount);

    if (!amountToPay || amountToPay <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (amountToPay > feesDetails.balance) {
      alert('Amount cannot exceed the outstanding balance.');
      return;
    }

    try {
      setInitiatingPayment(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Ask the server to initialise the Paystack transaction
      const res = await axios.post('/api/payment/initialize', {
        amount: amountToPay,
        term: feesDetails.academic_term,
        year: feesDetails.academic_year
      }, { headers });

      const { reference, access_code } = res.data;

      // Close our custom modal before Paystack overlay opens
      setIsPaymentModalOpen(false);

      // Launch Paystack Inline JS overlay
      const handler = window.PaystackPop.setup({
        key: 'pk_test_e92dd15302765231898a6ffca55c98e62362d84d',
        email: `${studentProfile?.username || 'student'}@bichiacademy.edu.ng`,
        amount: Math.round(amountToPay * 100), // kobo
        ref: reference,
        ...(access_code ? { access_code } : {}),
        metadata: {
          custom_fields: [
            { display_name: 'Student Name', variable_name: 'student_name', value: studentProfile?.full_name || '' },
            { display_name: 'Term', variable_name: 'term', value: feesDetails.academic_term },
            { display_name: 'Session', variable_name: 'year', value: feesDetails.academic_year },
          ]
        },
        onSuccess: async (transaction) => {
          // Paystack confirmed success — verify on the server side
          try {
            const vRes = await axios.get(`/api/payment/verify/${transaction.reference || reference}`, { headers });
            if (vRes.data.status === 'success') {
              setPendingCheckout(null);
              fetchFeesDetails(term, year);
              fetchPaymentHistory();
              fetchStudentData();
            } else {
              // Server hasn't confirmed yet; show pending banner so student can re-verify
              setPendingCheckout({ orderId: reference, rrr: reference, amount: amountToPay });
            }
          } catch (verifyErr) {
            console.error('Verification error after Paystack success:', verifyErr);
            setPendingCheckout({ orderId: reference, rrr: reference, amount: amountToPay });
          }
        },
        onCancel: () => {
          // Payment was cancelled by the student
          console.log('Paystack payment cancelled by user.');
        }
      });

      handler.openIframe();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to initialise payment. Please check your internet connection and try again.');
    } finally {
      setInitiatingPayment(false);
    }
  };

  const verifyPendingPayment = async () => {
    if (!pendingCheckout) return;
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/payment/verify/${pendingCheckout.orderId}`, { headers });
      if (res.data.status === 'success') {
        alert('Payment verified successfully!');
        setPendingCheckout(null);
        fetchFeesDetails(term, year);
        fetchPaymentHistory();
        fetchStudentData();
      } else {
        alert('Payment verification in progress or pending at Paystack. Please complete checkout if open.');
      }
    } catch (err) {
      console.error(err);
      alert('Error verifying payment reference.');
    }
  };

  const fetchReceiptDetails = async (paymentId) => {
    setLoadingReceipt(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`/api/payment/receipt/${paymentId}`, { headers });
      setSelectedReceipt(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load receipt details.');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(val);
  };

  const renderRating = (val) => {
    if (val === null || val === undefined) return '-';
    return `${val} / 5`;
  };

  const handlePrintReportCard = () => {
    if (!termReport || !termReport.results || termReport.results.length === 0) {
      alert(`No finalized results available to print for ${term} (${year}). Please select a term with published grades.`);
      return;
    }

    const reportNode = document.querySelector('.report-print-container');
    if (!reportNode) {
      alert('Report card content not ready.');
      return;
    }

    const printWin = window.open('', '_blank', 'width=950,height=800');
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
            .term-print-card {
              border: 2px solid #2b3674 !important;
              border-radius: 6px;
              padding: 14px 18px !important;
              background: #ffffff !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-family: inherit;
            }
            th, td {
              border: 1px solid #cbd5e0 !important;
            }
            .no-print, button, select, input {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="report-print-container">
            ${reportNode.innerHTML}
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
    <DashboardLayout title="Student Overview" role="student">

      {/* ── Welcome Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-accent) 0%, #38bdf8 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px',
        marginBottom: 'var(--space-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'var(--shadow-glow-md)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20px', right: '80px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div>
          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Student Portal</p>
          <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Welcome back, {studentProfile?.full_name?.split(' ')[0] || 'Student'} 
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
            {studentProfile?.class_name || 'Class not assigned'}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'rgba(255,255,255,0.20)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff', marginLeft: 'auto' }}>
            {studentProfile?.full_name?.split(' ').map(w => w[0]).slice(0,2).join('') || 'S'}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid-4 mb-lg">
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Attendance</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-success)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {loading ? '…' : error ? 'N/A' : `${attendance?.overallPercentage ?? 0}%`}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
            {loading ? '' : `${attendance?.presentDays ?? 0} Present / ${attendance?.totalDays ?? 0} Days`}
          </p>
        </div>

        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subjects Passed</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {loading ? '…' : results.filter(r => r.grade !== 'F').length}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Subjects with grade ≥ E</p>
        </div>

        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Subjects</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-warning)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {loading ? '…' : results.length}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Registered subjects</p>
        </div>

        <div
          className="stat-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', borderLeft: feesSummary?.balance > 0 ? '3px solid var(--color-destructive)' : '3px solid var(--color-success)' }}
          onClick={() => navigate('/student/fees')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fees Balance</span>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: feesSummary?.balance > 0 ? 'var(--color-destructive-light)' : 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={feesSummary?.balance > 0 ? 'var(--color-destructive)' : 'var(--color-success)'} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: feesSummary?.balance > 0 ? 'var(--color-destructive)' : 'var(--color-success)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {loading ? '…' : formatCurrency(feesSummary?.balance ?? 0)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {!loading && (
              <span className={`badge ${feesSummary?.status === 'paid' ? 'badge-success' : feesSummary?.status === 'partially_paid' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>
                {feesSummary?.status ? feesSummary.status.replace('_', ' ') : 'unpaid'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1.5px solid var(--color-border)', marginBottom: 'var(--space-lg)', paddingBottom: '2px' }} className="no-print">
        {[
          { path: '/student', label: 'Attendance' },
          { path: '/student/results', label: 'My Results' },
          { path: '/student/fees', label: 'School Fees' },
        ].map((tab) => {
          const isActive = activeSubTab === (tab.path === '/student' ? 'attendance' : tab.path === '/student/results' ? 'results' : 'fees');
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                padding: '8px 16px',
                background: isActive ? 'var(--color-accent-light)' : 'transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--color-secondary)',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                fontSize: '0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                transition: 'all 0.15s ease',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>



      <div>
        {error && <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

        {/* --- 1. ATTENDANCE HISTORY --- */}
        {activeSubTab === 'attendance' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)', alignItems: 'start' }} className="animate-fade-in">
            <div className="dashboard-card">
              <h3 style={{ margin: '0 0 var(--space-md) 0', color: 'var(--color-primary)' }}>My Attendance History</h3>
              
              {loading ? (
                <p>Loading records...</p>
              ) : attendance?.history.length === 0 ? (
                <p style={{ color: 'var(--color-secondary)' }}>No attendance records found yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance?.history.map((record, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px', color: 'var(--color-primary)', fontWeight: '500' }}>
                            {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`status-badge ${record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}`}>
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

            {!loading && attendance && (
              <div className="dashboard-card flex flex-col items-center justify-center">
                <h3 style={{ margin: '0 0 var(--space-md) 0', color: 'var(--color-primary)', alignSelf: 'flex-start' }}>Attendance Rate Breakdown</h3>
                <div style={{ width: '100%', height: 240, display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present Days', value: attendance.presentDays },
                          { name: 'Absent Days', value: Math.max(0, attendance.totalDays - attendance.presentDays) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="var(--color-success)" />
                        <Cell fill="var(--color-destructive)" />
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--color-success)' }}>
                    {attendance.overallPercentage}%
                  </span>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Overall Attendance Percentage</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 2. ACADEMIC REPORT CARD --- */}
        {activeSubTab === 'results' && (
          <div className="dashboard-card animate-fade-in">
            <div className="flex-between mb-md no-print">
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Academic Report Card</h3>
                <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', margin: 'var(--space-xs) 0 0 0' }}>
                  Only official grades finalized and published by the Exams Officer are shown here.
                </p>
              </div>
              <button 
                onClick={handlePrintReportCard}
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
              <>
                <div className="report-print-container">
                <style>{`
                  .report-print-container {
                    background: #ffffff;
                    border: 1px solid #cbd5e0;
                    padding: 24px 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                    color: #2d3748;
                    max-width: 880px;
                    margin: 0 auto;
                    font-family: 'Outfit', 'Inter', sans-serif;
                  }
                  .term-print-card {
                    border: 1.5px solid #2b3674;
                    border-radius: 6px;
                    padding: 16px 20px;
                    background: #ffffff;
                    box-shadow: none;
                  }
                  @media print {
                    @page {
                      size: A4 portrait;
                      margin: 0 !important;
                    }
                    html, body {
                      background: #ffffff !important;
                      color: #000000 !important;
                      margin: 0 !important;
                      padding: 6mm 8mm !important;
                      width: 100% !important;
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
                      border: 2px solid #2b3674 !important;
                      border-radius: 6px !important;
                      padding: 14px 18px !important;
                      margin-bottom: 0 !important;
                      background: #ffffff !important;
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', borderBottom: '3px double #2b3674', paddingBottom: '10px' }}>
                    <svg width="52" height="52" viewBox="0 0 100 100" style={{ marginRight: '16px', flexShrink: 0 }}>
                      <path d="M50,5 L90,20 L90,55 C90,75 50,92 50,92 C50,92 10,75 10,55 L10,20 Z" fill="#2b3674" stroke="#d97706" strokeWidth="2.5" />
                      <path d="M50,10 L83,23 L83,53 C83,70 50,85 50,85 C50,85 17,70 17,53 L17,23 Z" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" />
                      <path d="M28,45 C38,40 48,43 50,45 L50,68 C48,66 38,63 28,68 Z" fill="#ffffff" />
                      <path d="M72,45 C62,40 52,43 50,45 L50,68 C52,66 62,63 72,68 Z" fill="#ffffff" />
                      <path d="M50,45 L50,68" stroke="#2b3674" strokeWidth="1.5" />
                      <polygon points="50,18 53,24 60,25 55,30 56,37 50,33 44,37 45,30 40,25 47,24" fill="#d97706" />
                      <text x="50" y="80" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="bold" letterSpacing="0.5">EST. 2015</text>
                    </svg>
                    
                    <div style={{ textAlign: 'left' }}>
                      <h1 style={{ margin: '0', fontSize: '20px', fontWeight: '800', color: '#2b3674', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: 1.1 }}>Bichi Academy</h1>
                      <p style={{ margin: '2px 0 0 0', fontSize: '10.5px', color: '#d97706', fontWeight: 'bold', letterSpacing: '0.8px' }}>KNOWLEDGE · DISCIPLINE · EXCELLENCE</p>
                      <p style={{ margin: '1px 0 0 0', fontSize: '9.5px', color: '#718096' }}>P.O. Box 450, School Avenue Road, Tech City | info@bichiacademy.edu.ng</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#2b3674', fontWeight: '800', letterSpacing: '0.04em' }}>OFFICIAL STUDENT TERM ACADEMIC REPORT</p>
                    </div>
                  </div>

                  {/* Student Bio Table */}
                  <table style={{ width: '100%', marginBottom: '12px', border: '1px solid #cbd5e0', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#4a5568', width: '20%', border: '1px solid #edf2f7', background: '#f8fafc' }}>Student Name:</td>
                        <td style={{ padding: '6px 10px', color: '#2b3674', fontWeight: '800', fontSize: '0.92rem', border: '1px solid #edf2f7' }}>{studentProfile?.full_name}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#4a5568', width: '20%', border: '1px solid #edf2f7', background: '#f8fafc' }}>Class of Record:</td>
                        <td style={{ padding: '6px 10px', color: '#2b3674', fontWeight: '700', border: '1px solid #edf2f7' }}>{termReport.className || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7', background: '#f8fafc' }}>Admission ID:</td>
                        <td style={{ padding: '6px 10px', color: '#2b3674', fontFamily: 'monospace', fontWeight: '700', border: '1px solid #edf2f7' }}>{studentProfile?.username}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7', background: '#f8fafc' }}>Academic Period:</td>
                        <td style={{ padding: '6px 10px', color: '#2b3674', border: '1px solid #edf2f7' }}>{term} ({year})</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7', background: '#f8fafc' }}>Term Average:</td>
                        <td style={{ padding: '6px 10px', color: '#047457', fontWeight: '800', border: '1px solid #edf2f7' }}>{termReport.averageScore ? `${termReport.averageScore.toFixed(2)}%` : 'N/A'}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 'bold', color: '#4a5568', border: '1px solid #edf2f7', background: '#f8fafc' }}>Class Position:</td>
                        <td style={{ padding: '6px 10px', color: '#4318FF', fontWeight: '800', border: '1px solid #edf2f7' }}>
                          {termReport.position ? `${formatPosition(termReport.position)} of ${termReport.totalStudents}` : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Results Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '12px', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e0', color: '#2b3674', fontWeight: 'bold' }}>
                        <th style={{ padding: '6px 8px', border: '1px solid #cbd5e0' }}>Subject</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Test 1 (10)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Test 2 (10)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Other C.A. (10)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Total C.A. (30)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Exam (70)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Total (100)</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e0' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {termReport.results.map((row, rIdx) => {
                        const caTotal = (parseFloat(row.test_score) || 0) + (parseFloat(row.test2_score) || 0) + (parseFloat(row.other_ca_score) || 0);
                        return (
                          <tr key={row.id || rIdx} style={{ borderBottom: '1px solid #edf2f7' }}>
                            <td style={{ padding: '5px 8px', fontWeight: '600', color: '#2d3748', border: '1px solid #edf2f7' }}>{row.subject_name}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.test_score ?? '-'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.test2_score ?? '-'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.other_ca_score ?? '-'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #edf2f7', fontWeight: '500', color: '#4a5568' }}>{caTotal.toFixed(2)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', border: '1px solid #edf2f7' }}>{row.exam_score ?? '-'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: '#2b3674', border: '1px solid #edf2f7' }}>{row.total_score ?? '-'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: row.grade === 'F' ? '#e53e3e' : '#2f855a', border: '1px solid #edf2f7' }}>{row.grade ?? '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Affective ratings, remarks, and attendance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginTop: '10px' }}>
                    {/* Character ratings */}
                    <div style={{ border: '1px solid #cbd5e0', borderRadius: '6px', padding: '8px 10px' }}>
                      <h5 style={{ margin: '0 0 6px 0', color: '#2b3674', fontWeight: 'bold', fontSize: '0.8rem', borderBottom: '1px solid #edf2f7', paddingBottom: '3px' }}>
                        Affective &amp; Psychomotor Ratings (1-5 Scale)
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '0.72rem' }}>
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
                          <div key={trait.key} style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '8px', borderBottom: '1px dashed #edf2f7' }}>
                            <span style={{ color: '#4a5568' }}>{trait.label}:</span>
                            <span style={{ fontWeight: 'bold', color: '#2b3674' }}>
                              {termReport.remarks?.[trait.key] !== null && termReport.remarks?.[trait.key] !== undefined ? termReport.remarks[trait.key] : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Attendance and remarks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Attendance card */}
                      <div style={{ border: '1px solid #cbd5e0', borderRadius: '6px', padding: '8px 10px' }}>
                        <h5 style={{ margin: '0 0 4px 0', color: '#2b3674', fontWeight: 'bold', fontSize: '0.8rem', borderBottom: '1px solid #edf2f7', paddingBottom: '3px' }}>
                          Attendance Statistics
                        </h5>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                              <td style={{ padding: '2px 0', color: '#4a5568' }}>School Open Days:</td>
                              <td style={{ padding: '2px 0', fontWeight: 'bold', textAlign: 'right', color: '#2b3674' }}>
                                {termReport.remarks?.days_open !== null && termReport.remarks?.days_open !== undefined ? termReport.remarks.days_open : '-'}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                              <td style={{ padding: '2px 0', color: '#4a5568' }}>Days Present:</td>
                              <td style={{ padding: '2px 0', fontWeight: 'bold', textAlign: 'right', color: '#2b3674' }}>
                                {termReport.remarks?.days_present !== null && termReport.remarks?.days_present !== undefined ? termReport.remarks.days_present : '-'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '2px 0', color: '#4a5568' }}>Attendance Rate:</td>
                              <td style={{ padding: '2px 0', fontWeight: 'bold', textAlign: 'right', color: '#047457' }}>
                                {termReport.remarks?.days_open && termReport.remarks?.days_present !== null 
                                  ? `${Math.round((termReport.remarks.days_present / termReport.remarks.days_open) * 100)}%` 
                                  : '-'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Comments Card */}
                      <div style={{ border: '1px solid #cbd5e0', borderRadius: '6px', padding: '8px 10px', flex: 1 }}>
                        <h5 style={{ margin: '0 0 4px 0', color: '#2b3674', fontWeight: 'bold', fontSize: '0.8rem', borderBottom: '1px solid #edf2f7', paddingBottom: '3px' }}>
                          Official Comments
                        </h5>
                        <div style={{ fontSize: '0.72rem', lineHeight: '1.35', color: '#4a5568' }}>
                          <div style={{ marginBottom: '3px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', padding: '0 10px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid black', width: '130px', marginBottom: '4px' }}></div>
                      <span style={{ fontSize: '0.75rem', color: '#4a5568', fontWeight: 600 }}>Class Master</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid black', width: '130px', marginBottom: '4px' }}></div>
                      <span style={{ fontSize: '0.75rem', color: '#4a5568', fontWeight: 600 }}>Exams Officer</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid black', width: '130px', marginBottom: '4px' }}></div>
                      <span style={{ fontSize: '0.75rem', color: '#4a5568', fontWeight: 600 }}>Principal</span>
                    </div>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {/* --- 3. SCHOOL FEES TAB --- */}
        {activeSubTab === 'fees' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            
            {/* Statement Header Card */}
            <div className="dashboard-card">
              <div className="flex-between flex-wrap gap-md">
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>School Fees Statement</h3>
                  <p style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', margin: 'var(--space-xs) 0 0 0' }}>
                    Verify your outstanding balance and make secure payments through the Paystack Gateway.
                  </p>
                </div>
                
                <div className="flex-row gap-sm flex-wrap">
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Term</label>
                    <select 
                      value={term} 
                      onChange={(e) => setTerm(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', background: '#fff', fontSize: '0.9rem', minWidth: '120px' }}
                    >
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Session</label>
                    <select 
                      value={year} 
                      onChange={(e) => setYear(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', background: '#fff', fontSize: '0.9rem', minWidth: '120px' }}
                    >
                      <option value="2025/2026">2025/2026</option>
                      <option value="2026/2027">2026/2027</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Verification Banner */}
            {pendingCheckout && (
              <div style={{
                background: 'var(--color-warning-light)',
                border: '1.5px solid var(--color-warning)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-md)'
              }}>
                <div>
                  <h4 style={{ color: '#854d0e', fontSize: '1rem', margin: 0, fontWeight: '700' }}>Verification Query Active</h4>
                  <p style={{ color: '#a16207', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    You have a pending gateway session of <strong>{formatCurrency(pendingCheckout.amount)}</strong> (RRR: {pendingCheckout.rrr}).
                  </p>
                </div>
                <div className="flex-row gap-sm">
                  <button onClick={verifyPendingPayment} className="btn-primary" style={{ background: 'var(--color-warning)', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.85rem' }}>
                     Verify Transaction
                  </button>
                  <button onClick={() => setPendingCheckout(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Dismiss Banner
                  </button>
                </div>
              </div>
            )}

            {/* Loading or Errors */}
            {loadingFees ? (
              <p>Querying fees register...</p>
            ) : feesError ? (
              <div className="error-message">{feesError}</div>
            ) : !feesDetails ? (
              <p style={{ color: 'var(--color-secondary)', fontStyle: 'italic' }}>No fees configured for this class and period.</p>
            ) : feesDetails.total_amount === 0 ? (
              <div className="dashboard-card animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-md)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}></div>
                <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>No Fees Scheduled</h3>
                <p style={{ marginTop: 'var(--space-xs)', color: 'var(--color-secondary)', fontSize: '0.95rem' }}>
                  School fees have not yet been configured for your class in this academic period ({term}, {year}) by the Bursar's Office.
                </p>
              </div>
            ) : (
              <>
                {/* Financial Summary Cards */}
                <div className="grid-3">
                  <div className="dashboard-card" style={{ borderLeft: '5px solid var(--color-accent)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Expected Term Fee
                    </h4>
                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'var(--color-primary)' }}>
                      {formatCurrency(feesDetails.total_amount)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: 'var(--color-secondary)', fontSize: '0.75rem' }}>Class target configuration</p>
                  </div>

                  <div className="dashboard-card" style={{ borderLeft: '5px solid var(--color-success)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Verified Paid
                    </h4>
                    <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'var(--color-success)' }}>
                      {formatCurrency(feesDetails.amount_paid)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: 'var(--color-secondary)', fontSize: '0.75rem' }}>Successfully cleared payments</p>
                  </div>

                  <div className="dashboard-card" style={{ borderLeft: feesDetails.balance > 0 ? '5px solid var(--color-destructive)' : '5px solid var(--color-success)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Outstanding Deficit
                    </h4>
                    <div className="flex-between">
                      <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: feesDetails.balance > 0 ? 'var(--color-destructive)' : 'var(--color-success)' }}>
                        {formatCurrency(feesDetails.balance)}
                      </p>
                      <span className={`status-badge ${feesDetails.status === 'paid' ? 'success' : feesDetails.status === 'partially_paid' ? 'warning' : 'danger'}`}>
                        {feesDetails.status.replace('_', ' ')}
                      </span>
                    </div>
                    {feesDetails.balance > 0 ? (
                      <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="btn-primary" 
                        style={{ marginTop: '12px', width: '100%', padding: '8px 12px' }}
                      >
                         Make Payment Online
                      </button>
                    ) : (
                      <p style={{ margin: '12px 0 0 0', color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 'bold' }}> You are fully cleared for this term!</p>
                    )}
                  </div>
                </div>

                {/* Transaction History Grid */}
                <div className="dashboard-card">
                  <h3 style={{ margin: '0 0 var(--space-md) 0' }}>Transaction History</h3>
                  {loadingHistory ? (
                    <p>Loading history...</p>
                  ) : paymentHistory.length === 0 ? (
                    <p style={{ color: 'var(--color-secondary)', fontStyle: 'italic', padding: '10px 0' }}>No payment attempts found in history logs.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Reference / RRR</th>
                            <th>Term / Year</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                            <th style={{ textAlign: 'center' }}>Gateway Status</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((row) => (
                            <tr key={row.id}>
                              <td style={{ fontSize: '0.85rem' }}>
                                {new Date(row.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}<br/>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>{new Date(row.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-primary)' }}>Ref: {row.transaction_reference}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'monospace' }}>RRR: {row.rrr || 'Pending Generation'}</div>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>{row.academic_term} ({row.academic_year})</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary)' }}>{formatCurrency(row.amount)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`status-badge ${row.status === 'success' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {row.status === 'success' ? (
                                  <button 
                                    onClick={() => fetchReceiptDetails(row.id)} 
                                    className="btn-secondary" 
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  >
                                    ️ Print Receipt
                                  </button>
                                ) : row.status === 'pending' ? (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        const token = localStorage.getItem('token');
                                        const headers = { Authorization: `Bearer ${token}` };
                                        const res = await axios.get(`/api/payment/verify/${row.transaction_reference}`, { headers });
                                        if (res.data.status === 'success') {
                                          alert('Transaction verified successfully!');
                                          fetchFeesDetails(term, year);
                                          fetchPaymentHistory();
                                          fetchStudentData();
                                        } else {
                                          alert('Verification checked: Transaction is still pending at gateway.');
                                        }
                                      } catch (err) {
                                        console.error(err);
                                        alert('Query to payment gateway timed out.');
                                      }
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}
                                  >
                                     Query Status
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--color-secondary)', fontSize: '0.85rem' }}>-</span>
                                )}
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
          </div>
        )}
      </div>

      {/*  PAYSTACK PAYMENT INITIALIZATION MODAL */}
      {isPaymentModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="dashboard-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', background: 'white' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Paystack Fees Checkout</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-secondary)' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>PENDING OUTSTANDING:</p>
              <h2 style={{ color: 'var(--color-destructive)', fontWeight: '900', margin: '4px 0 0 0', fontSize: '2rem' }}>{formatCurrency(feesDetails?.balance || 0)}</h2>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleInitializePayment();
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <label>Service Type</label>
                  <input type="text" disabled value="Bichi Academy Termly Fees" style={{ background: 'var(--color-muted)', cursor: 'not-allowed', fontWeight: 'bold' }} />
                </div>

                <div>
                  <label>Payment Amount Mode</label>
                  <div className="flex-col gap-sm" style={{ marginTop: 'var(--space-xs)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', textTransform: 'none', fontSize: '0.92rem', fontWeight: '600', color: 'var(--color-primary)', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="amountType" 
                        value="full" 
                        checked={paymentAmountType === 'full'}
                        onChange={() => setPaymentAmountType('full')}
                        style={{ width: 'auto', marginRight: '8px' }}
                      />
                      Settle Full Balance ({formatCurrency(feesDetails?.balance || 0)})
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', textTransform: 'none', fontSize: '0.92rem', fontWeight: '600', color: 'var(--color-primary)', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="amountType" 
                        value="custom" 
                        checked={paymentAmountType === 'custom'}
                        onChange={() => {
                          setPaymentAmountType('custom');
                          setCustomAmount('');
                        }}
                        style={{ width: 'auto', marginRight: '8px' }}
                      />
                      Make Partial Payment (Custom Amount)
                    </label>
                  </div>
                </div>

                {paymentAmountType === 'custom' && (
                  <div className="animate-fade-in">
                    <label>Amount to Pay (NGN)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={feesDetails?.balance}
                      step="0.01"
                      placeholder="e.g. 20000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex-row gap-md" style={{ justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={initiatingPayment} className="btn-primary" style={{ flex: 1 }}>
                  {initiatingPayment ? 'Connecting to Paystack...' : ' Pay with Paystack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ️ PREMIUM PAYMENT SUCCESSFUL PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="no-print" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
          overflowY: 'auto', padding: '20px 0'
        }}>
          <style>{`
            .receipt-print-wrapper {
              background: white;
              border-radius: var(--radius-lg);
              padding: var(--space-xl);
              width: 100%;
              max-width: 600px;
              box-shadow: var(--shadow-xl);
              position: relative;
            }
            .receipt-print-container {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              padding: var(--space-lg);
              border-radius: var(--radius-md);
              font-family: 'Outfit', 'Inter', sans-serif;
              color: #1e293b;
            }
            .receipt-header {
              display: flex;
              align-items: center;
              justify-content: center;
              border-bottom: 2px dashed #cbd5e1;
              padding-bottom: var(--space-md);
              margin-bottom: var(--space-lg);
            }
            .receipt-stamp {
              border: 3px double #10b981;
              color: #10b981;
              text-transform: uppercase;
              font-weight: 800;
              font-size: 0.85rem;
              padding: 6px 12px;
              border-radius: 6px;
              display: inline-block;
              transform: rotate(-5deg);
              letter-spacing: 1px;
            }
            @media print {
              body * {
                visibility: hidden;
              }
              .receipt-print-container, .receipt-print-container * {
                visibility: visible;
              }
              .receipt-print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          
          <div className="receipt-print-wrapper animate-fade-in">
            <div className="flex-between no-print" style={{ marginBottom: 'var(--space-md)' }}>
              <h3 style={{ margin: 0 }}>Payment Receipt</h3>
              <button onClick={() => setSelectedReceipt(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-secondary)' }}>&times;</button>
            </div>

            {/* Printable Receipt Block */}
            <div className="receipt-print-container">
              {/* Logo & School Header */}
              <div className="receipt-header">
                <svg width="45" height="45" viewBox="0 0 100 100" style={{ marginRight: '12px' }}>
                  <path d="M50,5 L90,20 L90,55 C90,75 50,92 50,92 C50,92 10,75 10,55 L10,20 Z" fill="#2b3674" stroke="#d97706" strokeWidth="2.5" />
                  <polygon points="50,18 53,24 60,25 55,30 56,37 50,33 44,37 45,30 40,25 47,24" fill="#d97706" />
                  <text x="50" y="80" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">EST. 2015</text>
                </svg>
                <div style={{ textAlign: 'left' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#2b3674', textTransform: 'uppercase' }}>Bichi Academy</h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#d97706', fontWeight: 'bold' }}>KNOWLEDGE · DISCIPLINE · EXCELLENCE</p>
                  <p style={{ margin: '1px 0 0 0', fontSize: '9px', color: '#64748b' }}>info@bichiacademy.edu.ng | +234 800 000 0000</p>
                </div>
              </div>

              {/* Success Stamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>RECEIPT NO:</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>BA-FEE-{selectedReceipt.id.toString().padStart(6, '0')}</div>
                </div>
                <div className="receipt-stamp">PAID SUCCESSFULLY</div>
              </div>

              {/* Receipt Body */}
              <table style={{ width: '100%', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #e2e8f0', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#64748b', width: '40%', border: '1px solid #e2e8f0' }}>Student Name</td>
                    <td style={{ padding: '8px 12px', fontWeight: '700', color: '#2b3674', border: '1px solid #e2e8f0' }}>{selectedReceipt.student_name}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>Admission ID / Reg No</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: '600', border: '1px solid #e2e8f0' }}>{selectedReceipt.admission_id}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>Class</td>
                    <td style={{ padding: '8px 12px', fontWeight: '600', border: '1px solid #e2e8f0' }}>{selectedReceipt.class_name || 'Unassigned'}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>Academic Period</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{selectedReceipt.academic_term} ({selectedReceipt.academic_year})</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>Paystack Reference</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: '700', color: '#3bb75e', border: '1px solid #e2e8f0' }}>{selectedReceipt.rrr}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>Transaction Ref</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>{selectedReceipt.transaction_reference}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#64748b', border: '1px solid #e2e8f0' }}>Date Verified</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{new Date(selectedReceipt.verified_at || selectedReceipt.created_at).toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                    <td style={{ padding: '12px', fontWeight: '900', color: '#0f172a', fontSize: '0.95rem', border: '1px solid #e2e8f0' }}>AMOUNT PAID</td>
                    <td style={{ padding: '12px', fontWeight: '900', color: '#10b981', fontSize: '1.15rem', border: '1px solid #e2e8f0' }}>{formatCurrency(selectedReceipt.amount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Thank you note */}
              <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                <p>This is a computer-generated official receipt for school fees payment.</p>
                <p style={{ marginTop: '4px', fontWeight: 'bold', color: '#2b3674' }}>Thank you for your payment!</p>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex-row gap-md no-print" style={{ marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedReceipt(null)} className="btn-secondary" style={{ flex: 1 }}>
                Close
              </button>
              <button 
                onClick={() => window.print()} 
                className="btn-primary" 
                style={{ flex: 1 }}
              >
                ️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
