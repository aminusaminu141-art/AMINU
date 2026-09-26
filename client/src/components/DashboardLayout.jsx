import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  X,
  GraduationCap,
  Users,
  BookOpen,
  FileSpreadsheet,
  Award,
  DollarSign,
  ClipboardList,
  MessageSquare,
  Building,
  Settings,
  Shield,
  FileText,
  LogOut,
  ChevronDown,
  User,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LayoutDashboard,
  Layers
} from 'lucide-react';
import './DashboardLayout.css';

/* ── Helper: get initials from a full name ── */
const getInitials = (name = '') =>
  name.trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

/* ── Role display label ── */
const roleLabel = (role = '') =>
  role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ── Role → header icon & subtitle ── */
const ROLE_META = {
  student: {
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    subtitle: 'Student Portal',
    icon: <GraduationCap className="w-4 h-4" />,
  },
  class_master: {
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    subtitle: 'Class Master Portal',
    icon: <Users className="w-4 h-4" />,
  },
  subject_teacher: {
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    subtitle: 'Teacher Portal',
    icon: <BookOpen className="w-4 h-4" />,
  },
  exam_officer: {
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    subtitle: 'Exam Officer Portal',
    icon: <FileSpreadsheet className="w-4 h-4" />,
  },
  principal: {
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    subtitle: 'Principal Portal',
    icon: <Award className="w-4 h-4" />,
  },
  bursar: {
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    subtitle: 'Bursar Portal',
    icon: <DollarSign className="w-4 h-4" />,
  },
  admin: {
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.12)',
    subtitle: 'Administration Console',
    icon: <GraduationCap className="w-4 h-4" />,
  },
};

/* ── Lucide Icon Renderer for Sidebar Links ── */
const renderIcon = (iconKey) => {
  const p = { className: 'sidebar-svg-icon w-4 h-4' };
  switch (iconKey) {
    case 'dashboard':
      return <LayoutDashboard {...p} />;
    case 'results':
      return <FileSpreadsheet {...p} />;
    case 'attendance':
      return <ClipboardList {...p} />;
    case 'students':
      return <GraduationCap {...p} />;
    case 'staff':
      return <Users {...p} />;
    case 'remarks':
      return <MessageSquare {...p} />;
    case 'classes':
      return <Building {...p} />;
    case 'subjects':
    case 'assignments':
      return <BookOpen {...p} />;
    case 'graduates':
      return <Award {...p} />;
    case 'settings':
      return <Settings {...p} />;
    case 'finance':
      return <DollarSign {...p} />;
    case 'reports':
      return <FileText {...p} />;
    default:
      return <Layers {...p} />;
  }
};

/* ── Navigation schema ── */
const NAV_LINKS = {
  student: [
    { path: '/student',            label: 'Dashboard',    icon: 'dashboard',  section: 'Overview' },
    { path: '/student/results',    label: 'My Results',   icon: 'results',    section: 'Academic' },
    { path: '/student/attendance', label: 'Attendance',   icon: 'attendance', section: 'Academic' },
    { path: '/student/fees',       label: 'School Fees',  icon: 'finance',    section: 'Finance' },
  ],
  class_master: [
    { path: '/master',             label: 'Dashboard',    icon: 'dashboard',  section: 'Overview' },
    { path: '/master/students',    label: 'My Students',  icon: 'students',   section: 'Class' },
    { path: '/master/attendance',  label: 'Attendance',   icon: 'attendance', section: 'Class' },
    { path: '/master/remarks',     label: 'Remarks',      icon: 'remarks',    section: 'Class' },
  ],
  subject_teacher: [
    { path: '/master',             label: 'Dashboard',    icon: 'dashboard',  section: 'Overview' },
    { path: '/master/students',    label: 'My Students',  icon: 'students',   section: 'Teaching' },
    { path: '/master/attendance',  label: 'Attendance',   icon: 'attendance', section: 'Teaching' },
    { path: '/master/remarks',     label: 'Remarks',      icon: 'remarks',    section: 'Teaching' },
  ],
  exam_officer: [
    { path: '/exam-officer',           label: 'Dashboard',         icon: 'dashboard',  section: 'Overview' },
    { path: '/exam-officer/classes',   label: 'Classes',           icon: 'classes',    section: 'Management' },
    { path: '/exam-officer/subjects',  label: 'Subjects',          icon: 'subjects',   section: 'Management' },
    { path: '/exam-officer/results',   label: 'Results',           icon: 'results',    section: 'Academic' },
    { path: '/exam-officer/graduates', label: 'Graduates & Certs', icon: 'graduates',  section: 'Academic' },
  ],
  principal: [
    { path: '/principal',              label: 'Dashboard',         icon: 'dashboard',   section: 'Overview' },
    { path: '/principal/staff',        label: 'Staff',             icon: 'staff',       section: 'Management' },
    { path: '/principal/assignments',  label: 'Assignments',       icon: 'assignments', section: 'Management' },
    { path: '/principal/remarks',      label: 'Remarks',           icon: 'remarks',     section: 'Academic' },
    { path: '/principal/graduates',    label: 'Graduates & Certs', icon: 'graduates',   section: 'Academic' },
  ],
  bursar: [
    { path: '/bursar',      label: 'Dashboard',    icon: 'dashboard', section: 'Overview' },
    { path: '/bursar/fees', label: 'Student Fees', icon: 'finance',   section: 'Finance' },
  ],
  admin: [
    { path: '/admin',          label: 'Dashboard', icon: 'dashboard', section: 'Overview' },
    { path: '/admin/students', label: 'Students',  icon: 'students',  section: 'Directory' },
    { path: '/admin/staff',    label: 'Staff',     icon: 'staff',     section: 'Directory' },
    { path: '/admin/classes',  label: 'Classes',   icon: 'classes',   section: 'Academic' },
    { path: '/admin/subjects', label: 'Subjects',  icon: 'subjects',  section: 'Academic' },
    { path: '/admin/results',  label: 'Results',   icon: 'results',   section: 'Academic' },
    { path: '/admin/finance',  label: 'Finance',   icon: 'finance',   section: 'Finance' },
    { path: '/admin/settings', label: 'Settings',  icon: 'settings',  section: 'System' },
  ],
};

/* ── Group nav links by section ── */
const groupNavLinks = (links) => {
  const sections = {};
  links.forEach((link) => {
    const sec = link.section || 'General';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(link);
  });
  return sections;
};

/* ── Default notifications (shown for all roles) ── */
const DEFAULT_NOTIFICATIONS = [
  { id: 1, text: 'Database cache synchronized successfully', time: '10m ago', unread: true },
  { id: 2, text: 'New class master assigned to SS 3 Arts', time: '1h ago', unread: true },
  { id: 3, text: 'System backup completed successfully', time: '1d ago', unread: false },
];

export default function DashboardLayout({ children, title, role, studentCount }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [user, setUser]                   = useState(null);
  const [isSidebarOpen, setSidebarOpen]   = useState(true);
  const [theme, setTheme]                 = useState(localStorage.getItem('theme') || 'dark');
  const [isNotifOpen, setIsNotifOpen]     = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchValue, setSearchValue]     = useState('');
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  // ── My Account modal ──
  const [isAccountOpen, setIsAccountOpen]   = useState(false);
  const [profileData, setProfileData]       = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // ── Change Password modal ──
  const [isPasswordOpen, setIsPasswordOpen]   = useState(false);
  const [pwCurrent, setPwCurrent]             = useState('');
  const [pwNew, setPwNew]                     = useState('');
  const [pwConfirm, setPwConfirm]             = useState('');
  const [pwShowCurrent, setPwShowCurrent]     = useState(false);
  const [pwShowNew, setPwShowNew]             = useState(false);
  const [pwShowConfirm, setPwShowConfirm]     = useState(false);
  const [pwLoading, setPwLoading]             = useState(false);
  const [pwError, setPwError]                 = useState('');
  const [pwSuccess, setPwSuccess]             = useState('');

  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  /* ── Apply theme ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  /* ── Load user ── */
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { navigate('/login'); }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme   = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));
  const toggleSidebar = () => setSidebarOpen((p) => !p);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openAccountModal = async () => {
    setIsProfileOpen(false);
    setIsAccountOpen(true);
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const openPasswordModal = () => {
    setIsProfileOpen(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setPwError(''); setPwSuccess('');
    setIsPasswordOpen(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwNew.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/auth/change-password',
        { currentPassword: pwCurrent, newPassword: pwNew },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPwSuccess(res.data.msg || 'Password changed successfully!');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err) {
      setPwError(err.response?.data?.msg || 'Failed to change password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearchValue(val);
    window.dispatchEvent(new CustomEvent('globalPortalSearch', { detail: val }));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const links       = NAV_LINKS[role] || [];
  const navSections = useMemo(() => groupNavLinks(links), [role]);
  const initials    = useMemo(() => getInitials(user?.full_name), [user]);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="dashboard-layout-container">

      {/* ── Mobile Sidebar Overlay ── */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

        {/* ============================================================
            SIDEBAR
        ============================================================ */}
        <aside className="sidebar">

          {/* Brand Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo-wrap" style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #38bdf8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Bichi Portal</span>
              <span className="brand-tagline">Academic System</span>
            </div>
          </div>

          {/* Navigation grouped by section */}
          <nav className="sidebar-nav">
            {Object.entries(navSections).map(([section, sectionLinks]) => (
              <div key={section} className="nav-section">
                <span className="nav-section-title">{section}</span>
                <ul>
                  {sectionLinks.map((link, i) => {
                    const isActive = location.pathname === link.path ||
                      (link.path !== '/admin' && link.path !== '/master' && link.path !== '/student' &&
                       link.path !== '/bursar' && link.path !== '/principal' && link.path !== '/exam-officer' &&
                       location.pathname.startsWith(link.path + '/'));
                    return (
                      <li key={i}>
                        <a
                          href={link.path}
                          onClick={(e) => { e.preventDefault(); navigate(link.path); }}
                          className={isActive ? 'active' : ''}
                          title={link.label}
                        >
                          <span className="nav-icon">{renderIcon(link.icon)}</span>
                          <span className="nav-label">{link.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="avatar">{initials || '?'}</div>
              <div className="user-details">
                <span className="user-name">{user?.full_name || 'User'}</span>
                <span className="user-role">{roleLabel(user?.role)}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut className="logout-svg-icon w-4 h-4" />
              <span className="logout-label">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ============================================================
            MAIN CONTENT AREA
        ============================================================ */}
        <div className="main-wrapper">

          {/* ── Top Header ── */}
          <header className="top-header">

            {/* LEFT: Menu toggle + Branded portal header for ALL roles */}
            <div className="header-left">
              <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
                <Menu size={20} strokeWidth={2.2} style={{ color: 'var(--color-primary)' }} />
              </button>

              {(() => {
                const meta = ROLE_META[role];
                if (!meta) return <div className="header-title"><h1>{title}</h1></div>;
                return (
                  <div className="header-admin-brand">
                    <div
                      className="header-admin-icon"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <div className="header-admin-name">Bichi Academy</div>
                      <div className="header-admin-sub">{meta.subtitle}</div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* CENTRE: Global search (admin only) */}
            {role === 'admin' && (
              <div className="header-search-wrap">
                <div className="header-search-box">
                  <span className="search-icon">
                    <Search size={16} strokeWidth={2.2} style={{ color: 'var(--color-secondary)' }} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search students, staff, classes..."
                    value={searchValue}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                  />
                  {searchValue && (
                    <button
                      className="search-clear-btn"
                      onClick={() => handleSearch('')}
                      aria-label="Clear search"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* RIGHT: Actions */}
            <div className="header-actions">

              {/* Student/class count chip */}
              {studentCount !== undefined && studentCount !== null && (
                <div className="role-chip">
                  <span className="role-chip-dot" />
                  {role === 'class_master' ? 'Class' : 'Students'}: {studentCount}
                </div>
              )}

              {/* Theme toggle */}
              <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun size={20} strokeWidth={2.2} style={{ color: '#f59e0b' }} />
                ) : (
                  <Moon size={20} strokeWidth={2.2} style={{ color: 'var(--color-primary)' }} />
                )}
              </button>

              {/* ── Notifications ── */}
              <div className="notif-wrapper" ref={notifRef}>
                <button
                  className="notification-btn"
                  aria-label="Notifications"
                  onClick={() => { setIsNotifOpen((p) => !p); setIsProfileOpen(false); }}
                >
                  <Bell size={20} strokeWidth={2.2} style={{ color: 'var(--color-primary)' }} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                </button>

                {isNotifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span className="notif-header-title">Notifications</span>
                      {unreadCount > 0 && <span className="notif-unread-count">{unreadCount} new</span>}
                    </div>
                    <div className="notif-list">
                      {notifications.map((n) => (
                        <div key={n.id} className={`notif-item${n.unread ? ' notif-item--unread' : ''}`}>
                          <div className="notif-item-content">
                            <p className="notif-item-text">{n.text}</p>
                            <span className="notif-item-time">{n.time}</span>
                          </div>
                          {n.unread && <span className="notif-item-dot" />}
                        </div>
                      ))}
                    </div>
                    <div className="notif-footer">
                      <button className="notif-mark-read-btn" onClick={handleMarkAllRead}>
                        Mark all as read
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Profile Dropdown ── */}
              <div className="profile-wrapper" ref={profileRef} style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: '10px', marginLeft: '2px' }}>
                <button
                  className="profile-trigger-btn"
                  onClick={() => { setIsProfileOpen((p) => !p); setIsNotifOpen(false); }}
                  title={user?.full_name}
                  aria-label="Open profile menu"
                >
                  <div className="avatar-sm">{initials || '?'}</div>
                  <ChevronDown className={`profile-chevron w-3 h-3 ${isProfileOpen ? 'profile-chevron--open' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-dropdown-user">
                      <div className="profile-dropdown-avatar">{initials || '?'}</div>
                      <div>
                        <p className="profile-dropdown-name">{user?.full_name || 'User'}</p>
                        <p className="profile-dropdown-role">{roleLabel(user?.role)}</p>
                      </div>
                    </div>
                    <div className="profile-divider" />
                    <button className="profile-menu-item" onClick={openAccountModal}>
                      <User className="w-4 h-4" />
                      My Account
                    </button>
                    <button className="profile-menu-item" onClick={openPasswordModal}>
                      <Key className="w-4 h-4" />
                      Change Password
                    </button>
                    <div className="profile-divider" />
                    <button className="profile-menu-item profile-menu-item--danger" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── Page Content ── */}
          <main className="main-content">
            <div className="content-inner">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MY ACCOUNT MODAL
      ════════════════════════════════════════ */}
      {isAccountOpen && (
        <div style={{
          position:'fixed',top:0,left:0,width:'100%',height:'100%',
          background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000
        }}>
          <div style={{
            background:'var(--color-bg-surface,#1e2130)',border:'1px solid var(--color-border,#2d3148)',
            borderRadius:'16px',padding:'32px',width:'100%',maxWidth:'440px',
            boxShadow:'0 25px 50px rgba(0,0,0,0.4)',position:'relative',animation:'fadeInUp .2s ease'
          }}>
            {/* Close */}
            <button onClick={() => setIsAccountOpen(false)} style={{
              position:'absolute',top:'16px',right:'16px',background:'none',border:'none',
              fontSize:'1.4rem',cursor:'pointer',color:'var(--color-secondary,#94a3b8)',lineHeight:1
            }}>×</button>

            {/* Avatar */}
            <div style={{textAlign:'center',marginBottom:'24px'}}>
              <div style={{
                width:'72px',height:'72px',borderRadius:'18px',
                background:'linear-gradient(135deg,var(--color-accent,#6366f1),#38bdf8)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:'1.6rem',fontWeight:800,color:'#fff',margin:'0 auto 12px'
              }}>{initials || '?'}</div>
              <h2 style={{margin:0,fontSize:'1.15rem',fontWeight:800,color:'var(--color-primary,#f1f5f9)'}}>
                {user?.full_name}
              </h2>
              <p style={{margin:'4px 0 0',fontSize:'0.78rem',color:'var(--color-secondary,#94a3b8)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                {roleLabel(user?.role)}
              </p>
            </div>

            {loadingProfile ? (
              <p style={{textAlign:'center',color:'var(--color-secondary,#94a3b8)'}}>Loading profile…</p>
            ) : profileData ? (
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {[
                  {label:'Login ID / Username', value: profileData.username},
                  {label:'Full Name',            value: profileData.full_name},
                  {label:'Role',                 value: roleLabel(profileData.role)},
                  {label:'Class',                value: profileData.class_name || '—'},
                  {label:'Account Created',      value: new Date(profileData.created_at).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})},
                ].map(({label,value}) => (
                  <div key={label} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'10px 14px',borderRadius:'10px',
                    background:'var(--color-muted,rgba(255,255,255,0.04))',
                    border:'1px solid var(--color-border,rgba(255,255,255,0.08))'
                  }}>
                    <span style={{fontSize:'0.78rem',color:'var(--color-secondary,#94a3b8)',fontWeight:600}}>{label}</span>
                    <span style={{fontSize:'0.88rem',fontWeight:700,color:'var(--color-primary,#f1f5f9)'}}>{value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <button onClick={() => setIsAccountOpen(false)} style={{
              marginTop:'24px',width:'100%',padding:'12px',borderRadius:'10px',
              background:'var(--color-accent,#6366f1)',color:'#fff',border:'none',
              fontWeight:700,fontSize:'0.95rem',cursor:'pointer'
            }}>Close</button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          CHANGE PASSWORD MODAL
      ════════════════════════════════════════ */}
      {isPasswordOpen && (
        <div style={{
          position:'fixed',top:0,left:0,width:'100%',height:'100%',
          background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000
        }}>
          <div style={{
            background:'var(--color-bg-surface,#1e2130)',border:'1px solid var(--color-border,#2d3148)',
            borderRadius:'16px',padding:'32px',width:'100%',maxWidth:'420px',
            boxShadow:'0 25px 50px rgba(0,0,0,0.4)',position:'relative',animation:'fadeInUp .2s ease'
          }}>
            <button onClick={() => setIsPasswordOpen(false)} style={{
              position:'absolute',top:'16px',right:'16px',background:'none',border:'none',
              fontSize:'1.4rem',cursor:'pointer',color:'var(--color-secondary,#94a3b8)',lineHeight:1
            }}>×</button>

            <div style={{marginBottom:'24px'}}>
              <h2 style={{margin:'0 0 4px',fontSize:'1.1rem',fontWeight:800,color:'var(--color-primary,#f1f5f9)'}}>
                Change Password
              </h2>
              <p style={{margin:0,fontSize:'0.82rem',color:'var(--color-secondary,#94a3b8)'}}>
                Choose a strong password with at least 6 characters.
              </p>
            </div>

            {pwSuccess && (
              <div style={{
                background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.3)',
                borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',
                color:'#10b981',fontSize:'0.88rem',fontWeight:600
              }}>{pwSuccess}</div>
            )}
            {pwError && (
              <div style={{
                background:'rgba(244,63,94,0.12)',border:'1px solid rgba(244,63,94,0.3)',
                borderRadius:'10px',padding:'12px 16px',marginBottom:'16px',
                color:'#f43f5e',fontSize:'0.88rem',fontWeight:600
              }}>{pwError}</div>
            )}

            <form onSubmit={handleChangePassword} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {[
                {label:'Current Password', value:pwCurrent, set:setPwCurrent, show:pwShowCurrent, toggleShow:()=>setPwShowCurrent(p=>!p)},
                {label:'New Password',     value:pwNew,     set:setPwNew,     show:pwShowNew,     toggleShow:()=>setPwShowNew(p=>!p)},
                {label:'Confirm New Password', value:pwConfirm, set:setPwConfirm, show:pwShowConfirm, toggleShow:()=>setPwShowConfirm(p=>!p)},
              ].map(({label,value,set,show,toggleShow}) => (
                <div key={label}>
                  <label style={{display:'block',fontSize:'0.78rem',fontWeight:700,
                    color:'var(--color-secondary,#94a3b8)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.06em'
                  }}>{label}</label>
                  <div style={{position:'relative'}}>
                    <input
                      type={show ? 'text' : 'password'}
                      value={value}
                      onChange={e => set(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{
                        width:'100%',padding:'11px 44px 11px 14px',borderRadius:'10px',
                        border:'1.5px solid var(--color-border,rgba(255,255,255,0.1))',
                        background:'var(--color-muted,rgba(255,255,255,0.04))',
                        color:'var(--color-primary,#f1f5f9)',fontSize:'0.93rem',outline:'none',boxSizing:'border-box'
                      }}
                    />
                    <button type="button" onClick={toggleShow} style={{
                      position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',
                      background:'none',border:'none',cursor:'pointer',padding:0,
                      color:'var(--color-secondary,#94a3b8)'
                    }}>
                      {show ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <div style={{display:'flex',gap:'12px',marginTop:'8px'}}>
                <button type="button" onClick={() => setIsPasswordOpen(false)} style={{
                  flex:1,padding:'12px',borderRadius:'10px',
                  background:'var(--color-muted,rgba(255,255,255,0.06))',
                  color:'var(--color-secondary,#94a3b8)',border:'1px solid var(--color-border,rgba(255,255,255,0.08))',
                  fontWeight:700,fontSize:'0.93rem',cursor:'pointer'
                }}>Cancel</button>
                <button type="submit" disabled={pwLoading} style={{
                  flex:1,padding:'12px',borderRadius:'10px',
                  background:'linear-gradient(135deg,var(--color-accent),#38bdf8)',
                  color:'#fff',border:'none',fontWeight:700,fontSize:'0.93rem',
                  cursor:pwLoading?'not-allowed':'pointer',opacity:pwLoading?0.7:1
                }}>{pwLoading ? 'Saving…' : 'Update Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
