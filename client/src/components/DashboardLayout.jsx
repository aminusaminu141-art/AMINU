import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DashboardLayout.css';

// Helper function to render vector SVG icons instead of emojis
const renderIcon = (iconKey) => {
  const props = { className: "sidebar-svg-icon", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 };
  switch (iconKey) {
    case 'dashboard':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      );
    case 'results':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'attendance':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'students':
    case 'staff':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'remarks':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'classes':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'subjects':
    case 'assignments':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'graduates':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      );
    default:
      return null;
  }
};

export default function DashboardLayout({ children, title, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Navigation schema utilizing design system string IDs for renderIcon lookup
  const navLinks = {
    student: [
      { path: '/student', label: 'Dashboard', icon: 'dashboard' },
      { path: '/student/results', label: 'My Results', icon: 'results' },
      { path: '/student/attendance', label: 'Attendance', icon: 'attendance' },
    ],
    class_master: [
      { path: '/master', label: 'Dashboard', icon: 'dashboard' },
      { path: '/master/students', label: 'My Students', icon: 'students' },
      { path: '/master/attendance', label: 'Attendance', icon: 'attendance' },
      { path: '/master/remarks', label: 'Student Remarks', icon: 'remarks' },
    ],
    exam_officer: [
      { path: '/exam-officer', label: 'Dashboard', icon: 'dashboard' },
      { path: '/exam-officer/classes', label: 'Classes', icon: 'classes' },
      { path: '/exam-officer/subjects', label: 'Subjects', icon: 'subjects' },
      { path: '/exam-officer/results', label: 'Results Mgmt', icon: 'results' },
      { path: '/exam-officer/graduates', label: 'Graduates & Certs', icon: 'graduates' },
    ],
    principal: [
      { path: '/principal', label: 'Dashboard', icon: 'dashboard' },
      { path: '/principal/staff', label: 'Staff Mgmt', icon: 'staff' },
      { path: '/principal/assignments', label: 'Assignments', icon: 'assignments' },
      { path: '/principal/remarks', label: 'Student Remarks', icon: 'remarks' },
      { path: '/principal/graduates', label: 'Graduates & Certs', icon: 'graduates' },
    ]
  };

  const links = navLinks[role] || [];

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <svg className="sidebar-svg-icon" style={{ color: 'var(--color-accent)', width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <h2 className="brand-name">Bichi Portal</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {links.map((link, index) => (
              <li key={index}>
                <a 
                  href={link.path}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.path);
                  }}
                  className={location.pathname === link.path ? 'active' : ''}
                >
                  <span className="nav-icon">{renderIcon(link.icon)}</span>
                  <span className="nav-label">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="user-details">
              <span className="user-name">{user?.full_name || 'User'}</span>
              <span className="user-role">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg className="logout-svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="header-title">
            <h1>{title}</h1>
          </div>
          <div className="header-actions">
            <button className="notification-btn">
              <svg className="header-svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="profile-btn">
              <div className="avatar-sm">
                <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
