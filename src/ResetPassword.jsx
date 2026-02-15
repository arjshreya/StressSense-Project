// src/ResetPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './AuthForm.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Updating password...');

    try {
      // API call to the reset password route, including the token
      const res = await axios.post(`/api/reset-password/${token}`, { password });
      setMessage(res.data.message);
      setIsSuccess(true);
      
      // Redirect to login after a short delay upon SUCCESS
      setTimeout(() => navigate('/'), 3000);
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error: Link expired or invalid.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="container right-panel-active">
      <div className="form-container sign-in-container">
        <form onSubmit={handleSubmit} className="reset-password-form">
          <h1>New Password</h1>
          <p className="subtitle">Enter and confirm your new password.</p>
          
          <input
            type="password"
            placeholder="New Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSuccess || password.length < 8}
            style={{ marginBottom: '15px' }} /* Added margin for button below */
          >
            RESET PASSWORD
          </button>
          
          {/* ⭐ ADDED: Manual Back to Login Button */}
          <button 
            type="button" 
            className="ghost back-to-login-btn" 
            onClick={() => navigate('/')}
            style={{ 
                background: 'transparent', 
                border: '1px solid #ccc',
                color: '#333',
                fontSize: '14px',
                padding: '8px 15px',
                width: '100%' 
            }}
          >
            ← Back to Login
          </button>
          
          {message && (
            <div className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
              {message}
            </div>
          )}
        </form>
      </div>

      {/* Overlay Panel (Aesthetic purposes) */}
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-right">
            <h1>Password Secured</h1>
            <p>Your password has been updated. You can now log in with your new password.</p>
          </div>
        </div>
      </div>
    </div>
  );
}