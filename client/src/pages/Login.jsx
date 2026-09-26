import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const ROLE_PATHS = {
  student:         '/student',
  class_master:    '/master',
  subject_teacher: '/master',
  exam_officer:    '/exam-officer',
  principal:       '/principal',
  bursar:          '/bursar',
  admin:           '/admin',
};

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));
      navigate(ROLE_PATHS[data.user.role] || '/');
    } catch (err) {
      setErrorMsg(
        err.response?.data?.errors?.[0]?.msg || 'Server error. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── Decorative background blobs ── */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />

      {/* ── Left Identity Panel ── */}
      <div className="login-left">
        <div className="login-left-content">
          {/* Badge */}
          <div className="login-badge">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Secured Academic Portal</span>
          </div>

          {/* School logo */}
          <div className="login-school-logo">
            <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>

          <h1 className="login-school-name">Bichi Academy</h1>
          <p className="login-school-tagline">
            Unity · Growth · Excellence
          </p>

          <p className="login-left-desc">
            A unified digital platform for students, teachers, and administration to manage academic performance, attendance records, and financial activities — all in one place.
          </p>

          {/* Feature chips */}
          <div className="login-features">
            {[
              { icon: '', text: 'Academic Reports' },
              { icon: '', text: 'Attendance Tracking' },
              { icon: '', text: 'Fees Management' },
              { icon: '', text: 'Class Rankings' },
            ].map((f, i) => (
              <div key={i} className="login-feature-chip">
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Avatar strip */}
          <div className="login-avatar-strip">
            <div className="login-avatar-stack">
              {['ST', 'TE', 'AD', 'EX'].map((t, i) => (
                <div key={i} className={`login-avatar login-avatar-${i + 1}`}>{t}</div>
              ))}
            </div>
            <p>Connecting <strong>1,000+</strong> active members</p>
          </div>
        </div>
      </div>

      {/* ── Right Login Panel ── */}
      <div className="login-right">
        <div className="login-card">
          {/* Top accent bar */}
          <div className="login-card-accent" />

          {/* Header */}
          <div className="login-card-header">
            <div className="login-card-icon">
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to your digital dashboard</p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="login-error animate-fade-in">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Login ID */}
            <div className="login-field-group">
              <label htmlFor="login-id">Login ID</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="login-id"
                  type="text"
                  placeholder="e.g. STU001 or ADMIN"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="login-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field-group">
              <label htmlFor="login-pass">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="login-input login-input-pass"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="login-form-row">
              <label className="login-remember">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" className="login-forgot">Forgot password?</a>
            </div>

            {/* Submit */}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path fill="currentColor" fillOpacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Portal
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="login-arrow">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-card-footer">
            <div className="login-secure-badge">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Authorized Personnel Only · SSL Secured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
