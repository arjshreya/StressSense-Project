// src/AuthForm.jsx
import React, { useState } from 'react';
import './AuthForm.css';
import axios from 'axios';

function AuthForm({ onLoginSuccess }) {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [authError, setAuthError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // VALIDATION LOGIC
  const validateRegister = () => {
    const { name, email, password, confirmPassword } = formData;
    setAuthError('');

    if (!name || !email || !password || !confirmPassword) {
      setAuthError('All fields are required.');
      return false;
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      setAuthError('Name can only contain alphabetic characters and spaces.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError('Please enter a valid email address.');
      return false;
    }

    if (password !== confirmPassword) {
      setAuthError('Password and Confirm Password do not match.');
      return false;
    }

    const strengthRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strengthRegex.test(password)) {
      setAuthError('Password must be 8+ chars and include a letter, number, and symbol.');
      return false;
    }

    return true;
  };

  // ⭐ UPDATED REGISTER SUBMIT ⭐
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    if (!validateRegister()) return;

    setMessage('Registering...');

    const payload = { 
      name: formData.name, 
      email: formData.email, 
      password: formData.password 
    };

    axios.post('/api/register', payload)
      .then(res => {

        // 🔥 IMPORTANT:
        // After successful registration → go to login panel
        setIsRightPanelActive(false);

        // 🔥 Inform user to login manually
        setMessage("Registration successful! Please login.");

      })
      .catch(error => {
        setMessage('Registration failed: ' + (error.response?.data?.message || 'Something went wrong.'));
      });
  };

  // LOGIN SUBMIT
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setMessage('Logging in...');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    try {
      const res = await axios.post('/api/login', { 
        email: formData.email, 
        password: formData.password 
      });

      setMessage(res.data.message);

      localStorage.setItem('userData', JSON.stringify(res.data.userData));

      onLoginSuccess(res.data.hasHistory);

    } catch (error) {
      setMessage('Login failed: ' + (error.response?.data?.message || 'Something went wrong.'));
    }
  };

  return (
    <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`}>

      {/* SIGN UP */}
      <div className="form-container sign-up-container">
        <form onSubmit={handleRegisterSubmit}>
          <h1>Create Account</h1>

          <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />

          {authError && <div className="auth-error-message">{authError}</div>}

          <button type="submit">Register</button>
        </form>
      </div>

      {/* SIGN IN */}
      <div className="form-container sign-in-container">
        <form onSubmit={handleLoginSubmit}>
          <h1>Login</h1>

          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />

          <a href="/forgot-password">Forgot your password?</a>

          {authError && <div className="auth-error-message">{authError}</div>}

          <button type="submit">Login</button>
        </form>
      </div>

      {/* OVERLAY */}
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome Back!</h1>
            <p>To keep connected with us please login</p>
            <button className="ghost" onClick={() => setIsRightPanelActive(false)}>Login</button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Hello, Friend!</h1>
            <p>Enter your details and start your journey</p>
            <button className="ghost" onClick={() => setIsRightPanelActive(true)}>Register</button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('failed') ? 'error-message' : 'success-message'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default AuthForm;
