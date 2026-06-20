import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

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

    // Configuration Form State
    const [selectedClassId, setSelectedClassId] = useState('');
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
                axios.get('/api/principal/classes', { headers }) // Reuses principal class fetch route
            ]);

            setStats(statsRes.data);
            setClassesList(classesRes.data);
            if (classesRes.data.length > 0) {
                setSelectedClassId(classesRes.data[0].id.toString());
            }
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
        if (!selectedClassId || !amount || parseFloat(amount) <= 0) {
            alert('Please select a class and enter a valid positive fee amount.');
            return;
        }

        setConfiguring(true);
        setConfigMessage('');
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            await axios.post('/api/payment/bursar/configure-fee', {
                class_id: selectedClassId,
                academic_term: term,
                academic_year: year,
                amount: parseFloat(amount)
            }, { headers });

            setConfigMessage('Fee configuration saved successfully! Balances for all enrolled students have been updated.');
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
        <DashboardLayout title="Bursar Financial Dashboard" role="bursar">
            {/* Overview Summary Widgets */}
            <div className="grid-3 mb-lg">
                <div className="dashboard-card" style={{ borderLeft: '5px solid var(--color-accent)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Expected Fees
                    </h4>
                    <p style={{ margin: 0, fontSize: '2.1rem', fontWeight: '900', color: 'var(--color-primary)' }}>
                        {loading ? '...' : formatCurrency(stats.total_expected)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: 'var(--color-secondary)', fontSize: '0.8rem' }}>Aggregated targets for all classes</p>
                </div>

                <div className="dashboard-card" style={{ borderLeft: '5px solid var(--color-success)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Collected Fees
                    </h4>
                    <p style={{ margin: 0, fontSize: '2.1rem', fontWeight: '900', color: 'var(--color-success)' }}>
                        {loading ? '...' : formatCurrency(stats.total_collected)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: 'var(--color-secondary)', fontSize: '0.8rem' }}>Successfully cleared transactions</p>
                </div>

                <div className="dashboard-card" style={{ borderLeft: '5px solid var(--color-warning)' }}>
                    <h4 style={{ margin: '0 0 var(--space-xs) 0', color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Outstanding Balances
                    </h4>
                    <p style={{ margin: 0, fontSize: '2.1rem', fontWeight: '900', color: 'var(--color-warning)' }}>
                        {loading ? '...' : formatCurrency(stats.outstanding)}
                    </p>
                    <p style={{ margin: '6px 0 0 0', color: 'var(--color-secondary)', fontSize: '0.8rem' }}>Uncollected deficit/debts</p>
                </div>
            </div>

            {/* Dashboard Sub-tabs */}
            <div className="flex-row gap-md no-print" style={{ borderBottom: '1.5px solid var(--color-border)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                <button
                    onClick={() => navigate('/bursar')}
                    style={{
                        padding: '12px 16px', background: 'none', border: 'none',
                        borderBottom: activeSubTab === 'overview' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                        color: activeSubTab === 'overview' ? 'var(--color-accent)' : 'var(--color-secondary)',
                        fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem'
                    }}
                >
                    Financial Overview
                </button>
                <button
                    onClick={() => navigate('/bursar/fees')}
                    style={{
                        padding: '12px 16px', background: 'none', border: 'none',
                        borderBottom: activeSubTab === 'fees' ? '2.5px solid var(--color-accent)' : '2.5px solid transparent',
                        color: activeSubTab === 'fees' ? 'var(--color-accent)' : 'var(--color-secondary)',
                        fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem'
                    }}
                >
                    Student Fee Statuses & Config
                </button>
            </div>

            <div>
                {error && <div className="error-message">{error}</div>}

                {/* --- 1. FINANCIAL OVERVIEW SUB-TAB --- */}
                {activeSubTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-lg)' }}>
                        {/* Class configurations card */}
                        <div className="dashboard-card">
                            <h3 style={{ margin: '0 0 var(--space-md) 0' }}>Class Fee Configurations</h3>
                            {loading ? (
                                <p>Loading configurations...</p>
                            ) : stats.classes.length === 0 ? (
                                <p style={{ color: 'var(--color-secondary)' }}>No fee configurations found for this term yet.</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            <th>Term</th>
                                            <th>Session</th>
                                            <th style={{ textAlign: 'right' }}>Fee Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.classes.map((cls, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 'bold' }}>{cls.class_name}</td>
                                                <td>{cls.academic_term}</td>
                                                <td>{cls.academic_year}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                                                    {formatCurrency(cls.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Quick Configuration Form */}
                        <div className="dashboard-card">
                            <h3 style={{ margin: '0 0 var(--space-md) 0' }}>Set Class Term Fee</h3>
                            {configMessage && (
                                <div className={configMessage.includes('success') ? 'success-message' : 'error-message'}>
                                    {configMessage}
                                </div>
                            )}
                            <form onSubmit={handleConfigureFee} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div>
                                    <label>Select Class</label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        style={{ background: 'white' }}
                                    >
                                        {classesList.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid-2">
                                    <div>
                                        <label>Academic Term</label>
                                        <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ background: 'white' }}>
                                            <option value="1st Term">1st Term</option>
                                            <option value="2nd Term">2nd Term</option>
                                            <option value="3rd Term">3rd Term</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Academic Year</label>
                                        <select value={year} onChange={(e) => setYear(e.target.value)} style={{ background: 'white' }}>
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
                                <button type="submit" disabled={configuring} style={{ marginTop: '10px' }}>
                                    {configuring ? 'Saving Config...' : '💾 Save Fee Configuration'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- 2. STUDENT FEES STATUS & CONFIG SUB-TAB --- */}
                {activeSubTab === 'fees' && (
                    <div className="dashboard-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                            <h3 style={{ margin: 0 }}>Student Financial Records</h3>
                            <button onClick={() => window.print()} className="btn-secondary">🖨️ Print Financial Statement</button>
                        </div>

                        {/* Search Filters */}
                        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginBottom: 'var(--space-xl)', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label>Class Filter</label>
                                <select value={filterClassId} onChange={(e) => setFilterClassId(e.target.value)} style={{ background: 'white' }}>
                                    <option value="All">All Classes</option>
                                    {classesList.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label>Payment Status</label>
                                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ background: 'white' }}>
                                    <option value="All">All Statuses</option>
                                    <option value="paid">Fully Paid</option>
                                    <option value="partially_paid">Partially Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div>
                                <label>Term</label>
                                <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} style={{ background: 'white' }}>
                                    <option value="All">All Terms</option>
                                    <option value="1st Term">1st Term</option>
                                    <option value="2nd Term">2nd Term</option>
                                    <option value="3rd Term">3rd Term</option>
                                </select>
                            </div>
                            <div>
                                <label>Session</label>
                                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ background: 'white' }}>
                                    <option value="All">All Sessions</option>
                                    <option value="2025/2026">2025/2026</option>
                                    <option value="2026/2027">2026/2027</option>
                                </select>
                            </div>
                        </div>

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
