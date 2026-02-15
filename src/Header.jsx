// src/Header.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";

function Header({ hasHistory }) {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("userData");
    navigate("/");
  };

  const activeClass = (path) =>
    location.pathname.includes(path) ? "active-link" : "";

  return (
    <header className="header-nav">
      {/* LOGO */}
      <div
        className="logo"
        onClick={() => navigate(hasHistory ? "/dashboard/existing" : "/dashboard/new")}
      >
        StressSense
      </div>

      <nav className="nav-links">

        {hasHistory ? (
          <>
            {/* EXISTING USER — HOME */}
            <button
              onClick={() => navigate("/dashboard/existing")}
              className={activeClass("/dashboard/existing")}
            >
              Home
            </button>

            {/* TEST STRESS (go to new assessment) */}
            <button
              onClick={() => navigate("/dashboard/new")}
              className={activeClass("/dashboard/new")}
            >
              Test Stress
            </button>
          </>
        ) : (
          <>
            {/* NEW USER — ASSESSMENT HOME */}
            <button
              onClick={() => navigate("/dashboard/new")}
              className={activeClass("/dashboard/new")}
            >
              Assessment Home
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

        {/* LOGOUT */}
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Header;
