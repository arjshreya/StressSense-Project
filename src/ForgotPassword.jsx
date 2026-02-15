// src/ForgotPassword.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './AuthForm.css';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Sending reset link...');
    setIsSuccess(false);

    try {
      const res = await axios.post('/api/forgot-password', { email });
      
      setMessage(res.data.message);
      setIsSuccess(true);
      setIsSent(true); 


    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error: Could not process request.';
      setMessage(errorMessage);
      setIsSuccess(false);
      setIsSent(false); // Keep form visible on failure, but show error
    }
  };

  return (
    <div className="container right-panel-active">
      <div className="form-container sign-in-container forgot-password-container-flow">
        
        {/*
          CONTENT WRAPPER (Handles Input Form or Success Message)
        */}
        {isSent && isSuccess ? (
          // 1. SUCCESS MESSAGE VIEW
          <div className="reset-success-message-wrapper">
            <h1>Success!</h1>
            <p className="subtitle">Check your email for the password reset link.</p>
          </div>
        ) : (
          // 2. INPUT FORM VIEW
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <h1>Forgot Password</h1>
            <p className="subtitle">Enter your registered email address below.</p>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="submit-btn" disabled={message === 'Sending reset link...'}>
              Send Reset Link
            </button>
          </form>
        )}
        
        {/* ⭐ STATUS MESSAGE (Displays success/error right below the main content flow) */}
        {message && (
          <div 
            className={`message-flow ${isSuccess ? 'success-message' : 'error-message'}`}
            // Added margin-top to ensure space from the form/success message above
            style={{ position: 'relative', marginTop: '15px', width: '100%', textAlign: 'center' }}
          >
            {message}
          </div>
        )}

        {/* ⭐ MANUAL BACK BUTTON (Uses absolute positioning to stay fixed at the bottom) */}
        <button 
            type="button" 
            className="back-to-login-btn" 
            onClick={() => navigate('/')}
            style={{ 
                position: 'absolute', 
                bottom: '15px', // Adjusted from 30px to 15px
                left: '50%', 
                transform: 'translateX(-50%)', 
                background: 'transparent', 
                border: '1px solid #aaa',
                color: '#333',
                fontSize: '14px',
                padding: '10px 20px',
                width: '80%',
                maxWidth: '250px',
                borderRadius: '25px',
                zIndex: 100 
            }}
        >
          ← Back to Login
        </button>
        
      </div>

      {/* Overlay Panel (Aesthetic purposes) */}
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-right">
            <h1>Reset Your Access</h1>
            <p>We take your security seriously. Check your email for the reset link.</p>
          </div>
        </div>
      </div>
    </div>
  );
}