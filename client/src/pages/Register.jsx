import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Reuse Login.css for identical visual styling!

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess('');

    try {
      // Changed to relative URL to work correctly with Vite proxy
      await axios.post('/api/auth/register', formData);
      setSuccess('Account created successfully! You can now log in.');
      setFormData({ full_name: '', email: '', password: '' });
    } catch (err) {
      if (err.response && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors([{ msg: 'An unexpected error occurred. Please try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* LEFT PANE: Academy Identity & Features (Hidden on Mobile) */}
      <div className="login-left-pane">
        <div className="left-pane-content">
          <div className="portal-badge">
            <svg className="badge-shield-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2 4 4M5 13V9a2 2 0 012-2h10a2 2 0 012 2v4a5 5 0 01-10 0zm0 0v-4" />
            </svg>
            <span>SECURED ACADEMIC PORTAL</span>
          </div>

          <h1 className="left-pane-title">
            Unity, Growth & Support.
          </h1>
          
          <p className="left-pane-description">
            A private space for students, staff, and administration to manage academic performance, view report cards, track attendance, and grow together.
          </p>

          <div className="avatar-stats-section">
            <div className="avatar-stack">
              <div className="avatar-img avatar-1">
                <span className="avatar-text">ST</span>
              </div>
              <div className="avatar-img avatar-2">
                <span className="avatar-text">TE</span>
              </div>
              <div className="avatar-img avatar-3">
                <span className="avatar-text">AD</span>
              </div>
            </div>
            <p className="avatar-stats-text">
              Securely connecting <strong style={{ color: '#fff' }}>1,000+</strong> active members.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Floating Premium Registration Card */}
      <div className="login-right-pane">
        <div className="floating-login-card">
          {/* Accent border top line */}
          <div className="card-top-accent"></div>

          <div className="login-card-header">
            <div className="header-icon-box">
              <svg className="header-lock-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2>Create Account</h2>
            <p>Join the Bichi Academy Portal workspace</p>
          </div>

          {success && (
            <div className="login-error-box" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981'
            }}>
              <svg className="error-alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="login-error-box flex-col items-start gap-xs">
              {errors.map((error, index) => (
                <div key={index} className="flex items-center gap-xs">
                  <svg className="error-alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error.msg}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-fields">
            <div className="login-input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  name="full_name"
                  placeholder="John Doe" 
                  value={formData.full_name}
                  onChange={handleChange}
                  required 
                  className="login-field-input"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  name="email"
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  className="login-field-input"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label>Password</label>
              <div className="input-wrapper relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={handleChange}
                  required 
                  minLength="6"
                  className="login-field-input password-input-field"
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="toggle-eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="toggle-eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading} style={{ marginTop: '1.5rem' }}>
              {loading ? (
                <span className="flex-center gap-sm">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-xs">
                  Create Account <span className="arrow-transition">→</span>
                </span>
              )}
            </button>
          </form>

          <div className="login-card-footer">
            <p className="register-redirect-text">
              Already have an identity? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="register-link-accent">Sign in to Portal</a>
            </p>
            <div className="authorized-badge">
              <svg className="badge-lock-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>AUTHORIZED MEMBERS ONLY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
