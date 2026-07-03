// src/Header.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";

function Header({ hasHistory, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogoClick = () => {
    navigate(hasHistory ? "/dashboard/existing" : "/dashboard/welcome");
  };

  const activeClass = (path) =>
    location.pathname.includes(path) ? "active-link" : "";

  return (
    <header className="header-nav">
      {/* Restored back to the original simple text layout */}
      <div className="logo" onClick={handleLogoClick}>
        StressSense
      </div>

      <nav className="nav-links">
        {hasHistory && (
          <>
            <button
              onClick={() => navigate("/dashboard/existing")}
              className={activeClass("/dashboard/existing")}
            >
              Home
            </button>

            <button
              onClick={() => navigate("/dashboard/new")}
              className={activeClass("/dashboard/new")}
            >
              Test Stress
            </button>
          </>
        )}

        {/* PROFILE */}
        <button
          onClick={() => navigate("/dashboard/profile")}
          className={activeClass("/dashboard/profile")}
        >
          Profile
        </button>

        {/* LOGOUT BUTTON */}
        <button
          className="logout-btn"
          onClick={() => setShowLogoutModal(true)}
        >
          Logout
        </button>

        {/* LOGOUT CONFIRM MODAL */}
        {showLogoutModal && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <h3>Logout</h3>
              <p>Are you sure you want to logout?</p>

              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="delete-btn"
                  onClick={() => {
                    setShowLogoutModal(false);
                    setSuccessMessage("Logged out successfully.");
                    setShowSuccessModal(true);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="delete-modal">
              <h3>Success</h3>
              <p>{successMessage}</p>

              <div className="modal-buttons">
                <button
                  className="save-btn"
                  onClick={() => {
                    setShowSuccessModal(false);
                    handleLogout(); // actual logout here
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;