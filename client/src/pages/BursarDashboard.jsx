import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export default function BursarDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    // Active sub-tab synced with URL routing
    let activeSubTab = 'overview';
    if (location.pathname === '/bursar/fees') {
        activeSubTab = 'fees';
    }

    // State Variables
    const [stats, setStats] = useState({ total_expected: 0, total_collected: 0, outstanding: 0, classes: [] });
    const [classesList, setClassesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Configuration Form State (Sections ONLY)
    const [selectedSection, setSelectedSection] = useState('primary_all');
    const [term, setTerm] = useState('1st Term');
    const [year, setYear] = useState('2025/2026');
    const [amount, setAmount] = useState('');
    const [configuring, setConfiguring] = useState(false);
    const [configMessage, setConfigMessage] = useState('');

    // Reports Filters State
    const [filterClassId, setFilterClassId] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterTerm, setFilterTerm] = useState('All');
    const [filterYear, setFilterYear] = useState('All');
    const [reportsList, setReportsList] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Section definitions
    const SECTIONS = [
        { key: 'primary_all', label: 'Primary Section', match: 'primary' },
        { key: 'nursery_all', label: 'Nursery Section', match: 'nursery' },
        { key: 'jss_all', label: 'Junior Secondary', match: 'jss' },
        { key: 'ss_all', label: 'Senior Secondary (SS)', match: 'ss' }
    ];

    // Compute Section-level standard fees
    const getSectionFees = () => {
        return SECTIONS.map(sec => {
            const found = (stats.classes || []).find(c => {
                const lower = (c.class_name || '').toLowerCase();
                if (sec.match === 'ss') {
                    return lower.includes('ss') && !lower.includes('jss');
                }
                return lower.includes(sec.match);
            });

            return {
                key: sec.key,
                section: sec.label,
                academic_term: found?.academic_term || term,
                academic_year: found?.academic_year || year,
                amount: found ? parseFloat(found.amount || 0) : 0
            };
        });
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeSubTab === 'fees') {
            fetchReports();
        }
    }, [activeSubTab, filterClassId, filterStatus, filterTerm, filterYear]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, classesRes] = await Promise.all([
                axios.get('/api/payment/bursar/stats', { headers }),
                axios.get('/api/principal/classes', { headers })
            ]);

            setStats(statsRes.data);
            setClassesList(classesRes.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load bursar statistics. Ensure you have proper permissions.');
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoadingReports(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(
                `/api/payment/bursar/reports?class_id=${filterClassId}&status=${filterStatus}&term=${filterTerm}&year=${filterYear}`,
                { headers }
            );
            setReportsList(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load fees reports.');
        } finally {
            setLoadingReports(false);
        }
    };

    const handleConfigureFee = async (e) => {
        e.preventDefault();
        if (!selectedSection || !amount || parseFloat(amount) <= 0) {
            alert('Please select a section and enter a valid positive fee amount.');
            return;
        }

        setConfiguring(true);
        setConfigMessage('');
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const res = await axios.post('/api/payment/bursar/configure-fee', {
                class_id: selectedSection,
                academic_term: term,
                academic_year: year,
                amount: parseFloat(amount)
            }, { headers });

            setConfigMessage(res.data?.msg || 'Fee configuration saved successfully! Balances for all enrolled students in the section have been updated.');
            setAmount('');
            fetchDashboardData();
        } catch (err) {
            console.error(err);
            setConfigMessage(err.response?.data?.msg || 'Failed to save fee configuration.');
        } finally {
            setConfiguring(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(val);
    };

    return (
        <DashboardLayout title="Bursar Financial Dashboard" role="bursar" studentCount={reportsList.length}>

            {/* ── Welcome Banner ── */}
            <div style={{
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
                    <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Bursar Portal</p>
                    <h2 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                        Financial Overview &amp; Fee Management
                    </h2>
                    <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                        Manage school fees, configure fee amounts, and view payment reports.
                    </p>
                </div>
                <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: '12px', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            {/* Overview Summary Widgets */}
            <div className="grid-3 mb-lg">
                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Expected Fees</span>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {loading ? '…' : formatCurrency(stats.total_expected)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Aggregated targets for all classes</p>
                </div>

                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Collected Fees</span>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-success)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-success)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {loading ? '…' : formatCurrency(stats.total_collected)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Successfully cleared transactions</p>
                </div>

                <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-muted-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Outstanding Balances</span>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--color-warning)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, fontFamily: 'Sora, sans-serif', color: 'var(--color-warning)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {loading ? '…' : formatCurrency(stats.outstanding)}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-secondary)' }}>Uncollected deficit/debts</p>
                </div>
            </div>

            {/* Dashboard Sub-tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1.5px solid var(--color-border)', marginBottom: 'var(--space-lg)', paddingBottom: '2px' }} className="no-print">
                {[
                    { path: '/bursar', label: 'Financial Overview', key: 'overview' },
                    { path: '/bursar/fees', label: 'Student Fee Statuses & Config', key: 'fees' },
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

            <div>
                {error && <div className="error-message">{error}</div>}

                {/* --- 1. FINANCIAL OVERVIEW SUB-TAB --- */}
                {activeSubTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }} className="animate-fade-in">
                        {/* Collection Analytics Charts */}
                        {!loading && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
                                <div className="dashboard-card flex flex-col items-center justify-center">
                                    <h3 style={{ margin: '0 0 var(--space-md) 0', color: 'var(--color-primary)', alignSelf: 'flex-start' }}>Fees Collection Progress</h3>
                                    <div style={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Collected', value: parseFloat(stats.total_collected) },
                                                        { name: 'Outstanding', value: Math.max(0, parseFloat(stats.total_expected) - parseFloat(stats.total_collected)) }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="var(--color-success)" />
                                                    <Cell fill="var(--color-warning)" />
                                                </Pie>
                                                <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px' }} />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="dashboard-card flex flex-col items-center justify-center">
                                    <h3 style={{ margin: '0 0 var(--space-md) 0', color: 'var(--color-primary)', alignSelf: 'flex-start' }}>Section Fee Comparison</h3>
                                    <div style={{ width: '100%', height: 200 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={getSectionFees()}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                                <XAxis dataKey="section" stroke="var(--color-secondary)" fontSize={11} tickLine={false} />
                                                <YAxis stroke="var(--color-secondary)" fontSize={10} tickLine={false} />
                                                <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px' }} />
                                                <Bar dataKey="amount" fill="var(--color-accent)" radius={[6, 6, 0, 0]} name="Term Fee (NGN)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
                            {/* Section fee schedules card */}
                            <div className="dashboard-card">
                                <h3 style={{ margin: '0 0 var(--space-md) 0' }}>Section Fee Schedules</h3>

                                {loading ? (
                                    <p>Loading fee schedules...</p>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Section</th>
                                                <th>Term</th>
                                                <th>Session</th>
                                                <th style={{ textAlign: 'right' }}>Standard Term Fee</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getSectionFees().map((sec, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{sec.section}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{sec.academic_term}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{sec.academic_year}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-accent)', fontSize: '0.95rem' }}>
                                                        {formatCurrency(sec.amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Quick Configuration Form */}
                            <div className="dashboard-card">
                                <h3 style={{ margin: '0 0 4px 0' }}>Set Section Term Fee</h3>
                                <p style={{ margin: '0 0 var(--space-md) 0', fontSize: '0.8rem', color: 'var(--color-secondary)' }}>
                                    Set the standard fee for all students in a section with one click.
                                </p>

                                {configMessage && (
                                    <div className={configMessage.includes('success') ? 'success-message' : 'error-message'} style={{ marginBottom: '12px' }}>
                                        {configMessage}
                                    </div>
                                )}

                                <form onSubmit={handleConfigureFee} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    <div>
                                        <label>Select Section</label>
                                        <select
                                            value={selectedSection}
                                            onChange={(e) => setSelectedSection(e.target.value)}
                                            style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)', fontWeight: 700 }}
                                        >
                                            <option value="primary_all">Primary Section</option>
                                            <option value="nursery_all">Nursery Section</option>
                                            <option value="jss_all">Junior Secondary</option>
                                            <option value="ss_all">Senior Secondary (SS)</option>
                                        </select>

                                        {/* Quick Section Selection Pills */}
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                                            {[
                                                { label: 'Primary Section', val: 'primary_all' },
                                                { label: 'Nursery Section', val: 'nursery_all' },
                                                { label: 'Junior Secondary', val: 'jss_all' },
                                                { label: 'Senior Secondary', val: 'ss_all' }
                                            ].map(p => (
                                                <button
                                                    key={p.val}
                                                    type="button"
                                                    onClick={() => setSelectedSection(p.val)}
                                                    style={{
                                                        padding: '5px 10px',
                                                        fontSize: '0.75rem',
                                                        borderRadius: '6px',
                                                        border: selectedSection === p.val ? '1.5px solid var(--color-accent)' : '1px solid var(--color-border)',
                                                        background: selectedSection === p.val ? 'var(--color-accent-light)' : 'var(--color-bg-surface)',
                                                        color: selectedSection === p.val ? 'var(--color-accent)' : 'var(--color-secondary)',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid-2">
                                        <div>
                                            <label>Academic Term</label>
                                            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)' }}>
                                                <option value="1st Term">1st Term</option>
                                                <option value="2nd Term">2nd Term</option>
                                                <option value="3rd Term">3rd Term</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label>Academic Year</label>
                                            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)' }}>
                                                <option value="2025/2026">2025/2026</option>
                                                <option value="2026/2027">2026/2027</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label>Fee Amount (NGN)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            placeholder="e.g. 45000"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <button type="submit" disabled={configuring} style={{ marginTop: '8px' }}>
                                        {configuring ? 'Saving Configuration...' : ' Save Fee Configuration'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 2. STUDENT FEES STATUS & CONFIG SUB-TAB --- */}
                {activeSubTab === 'fees' && (
                    <div className="dashboard-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3 style={{ margin: 0 }}>Student Financial Records</h3>
                            <button onClick={() => window.print()} className="btn-secondary">️ Print Financial Statement</button>
                        </div>

                        {/* Search Filters */}
                        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label>Class Filter</label>
                                <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)' }}>
                                    <option value="All">All Classes</option>
                                    {classesList.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label>Payment Status</label>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)' }}>
                                    <option value="All">All Statuses</option>
                                    <option value="paid">Fully Paid</option>
                                    <option value="partially_paid">Partially Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div>
                                <label>Term</label>
                                <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)' }}>
                                    <option value="All">All Terms</option>
                                    <option value="1st Term">1st Term</option>
                                    <option value="2nd Term">2nd Term</option>
                                    <option value="3rd Term">3rd Term</option>
                                </select>
                            </div>
                            <div>
                                <label>Session</label>
                                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ background: 'var(--color-bg-surface)', color: 'var(--color-primary)' }}>
                                    <option value="All">All Sessions</option>
                                    <option value="2025/2026">2025/2026</option>
                                    <option value="2026/2027">2026/2027</option>
                                </select>
                            </div>
                        </div>

                        {/* Class Collection Chart (no-print) */}
                        {!loadingReports && reportsList.length > 0 && (
                            <div className="no-print" style={{ marginBottom: 'var(--space-xl)' }}>
                                <h4 style={{ margin: '0 0 var(--space-md) 0', color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Expected vs Collected Class Revenue Breakdown
                                </h4>
                                <div style={{ width: '100%', height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={(() => {
                                            const map = {};
                                            reportsList.forEach(r => {
                                                const cName = r.class_name || 'Unassigned';
                                                if (!map[cName]) map[cName] = { name: cName, Expected: 0, Collected: 0 };
                                                map[cName].Expected += parseFloat(r.total_amount || 0);
                                                map[cName].Collected += parseFloat(r.amount_paid || 0);
                                            });
                                            return Object.values(map);
                                        })()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                            <XAxis dataKey="name" stroke="var(--color-secondary)" fontSize={10} tickLine={false} />
                                            <YAxis stroke="var(--color-secondary)" fontSize={10} tickLine={false} />
                                            <Tooltip contentStyle={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)', color: 'var(--color-primary)', borderRadius: '8px' }} />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Bar dataKey="Collected" fill="var(--color-success)" radius={[4, 4, 0, 0]} name="Collected Revenue" />
                                            <Bar dataKey="Expected" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Expected Revenue" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Records Table */}
                        {loadingReports ? (
                            <p>Loading reports...</p>
                        ) : reportsList.length === 0 ? (
                            <p style={{ color: 'var(--color-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                                No student fee records match your filters.
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Admission ID</th>
                                            <th>Class</th>
                                            <th>Period</th>
                                            <th style={{ textAlign: 'right' }}>Total Fees</th>
                                            <th style={{ textAlign: 'right' }}>Amount Paid</th>
                                            <th style={{ textAlign: 'right' }}>Balance</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportsList.map((row) => {
                                            const bal = parseFloat(row.total_amount) - parseFloat(row.amount_paid);
                                            return (
                                                <tr key={row.id}>
                                                    <td style={{ fontWeight: 'bold' }}>{row.student_name}</td>
                                                    <td style={{ fontFamily: 'monospace' }}>{row.admission_id}</td>
                                                    <td>
                                                        <span style={{ padding: '3px 8px', background: '#eef2ff', color: '#6366f1', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                            {row.class_name || 'Unassigned'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.85rem' }}>{row.academic_term} ({row.academic_year})</td>
                                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.total_amount)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-success)' }}>{formatCurrency(row.amount_paid)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: '700', color: bal > 0 ? 'var(--color-destructive)' : 'var(--color-success)' }}>
                                                        {formatCurrency(bal > 0 ? bal : 0.00)}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`status-badge ${row.status === 'paid' ? 'success' : row.status === 'partially_paid' ? 'warning' : 'danger'}`}>
                                                            {row.status.replace('_', ' ')}
                                                        </span>
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
            </div>
        </DashboardLayout>
    );
}
