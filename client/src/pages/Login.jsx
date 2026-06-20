import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      const { token, user } = response.data;
      
      // Save token & user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Navigate based on role
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'class_master') navigate('/master');
      else if (user.role === 'exam_officer') navigate('/exam-officer');
      else if (user.role === 'principal') navigate('/principal');
      else if (user.role === 'bursar') navigate('/bursar');
      else navigate('/');


    } catch (error) {
      if (error.response && error.response.data.errors) {
        setErrorMsg(error.response.data.errors[0].msg);
      } else {
        setErrorMsg('Server error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-wrapper">
            <svg className="logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <h2>Portal Login</h2>
          <p>Welcome back! Please enter your details.</p>
        </div>
        
        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Login ID</label>
            <input 
              type="text" 
              placeholder="Enter your ID (e.g. STU001)" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className="form-actions">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
