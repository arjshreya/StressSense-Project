// src/App.js

import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate
} from 'react-router-dom';

import ScrollToTop from "./ScrollToTop";
import AuthForm from './AuthForm';
import Dashboard from './Dashboard';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ResultGauge from './ResultGauge';
import NewUserHome from './NewUserHome';
import ExistingUserHome from './ExistingUserHome';
import NewUserDashboard from './NewUserDashboard';
import Profile from './Profile';

import './Dashboard.css';

function AppWrapper() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("userData")
  );
  const [hasHistory, setHasHistory] =
  useState(
    localStorage.getItem("hasHistory") === "true"
  );
  const navigate = useNavigate();

  const handleLogout = () => {

    setIsLoggedIn(false);
    setHasHistory(false);
  
    localStorage.removeItem("userData");
    localStorage.removeItem("hasHistory");
  
    navigate("/");
  };
  
  const handleLoginSuccess = (backendHasHistory) => {

    const localHistory =
      localStorage.getItem("hasHistory") === "true";
  
    const finalHistory =
      backendHasHistory || localHistory;
    
      localStorage.setItem(
        "hasHistory",
        finalHistory
      );
    setIsLoggedIn(true);
    setHasHistory(finalHistory);
  
    if (finalHistory) {
      navigate("/dashboard/existing");
    } else {
      navigate("/dashboard/welcome");
    }
  };

  const handleRegisterSuccess = () => {
    setIsLoggedIn(false);
    setHasHistory(false);
    navigate('/');  
  };
  

  const handleAssessmentSubmit = () => {

    localStorage.setItem(
      "hasHistory",
      "true"
    );
  
    setHasHistory(true);
  
    navigate("/dashboard/existing");
  };

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/"
        element={
          <AuthForm
            onLoginSuccess={handleLoginSuccess}
            onRegisterSuccess={handleRegisterSuccess}
          />
        }
      />
  
      {/* PASSWORD ROUTES */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* RESULT PAGE */}
      <Route
        path="/dashboard/results"
        element={isLoggedIn ? <ResultGauge /> : <Navigate to="/" replace />}
      />

      {/* MAIN DASHBOARD ROUTER WITH NESTED ROUTES */}
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            <Dashboard
              hasHistory={hasHistory}
              handleLogout={handleLogout}
              onAssessmentSubmit={handleAssessmentSubmit}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      >
        {/* DEFAULT REDIRECT: If no subroute given */}
        <Route
          index
          element={
            <Navigate
              to={hasHistory ? '/dashboard/existing' : '/dashboard/welcome'}
              replace
            />
          }
        />

        {/* NEW USER (NO HISTORY) */}
        <Route path="welcome" element={<NewUserDashboard />} />
        <Route path="new" element={<NewUserHome onSubmit={handleAssessmentSubmit} />} />

        {/* EXISTING USER (HAS HISTORY) */}
        <Route path="existing" element={<ExistingUserHome />} />

        {/* PROFILE ROUTE */}
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* IF ROUTE NOT FOUND → GO HOME */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppWrapper />
    </Router>
  );
}
