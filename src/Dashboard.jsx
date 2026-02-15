// src/Dashboard.jsx

import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import "./Dashboard.css";

const HEADER_HEIGHT = "75px";

function Dashboard({ hasHistory }) {
  return (
    <div className="full-dashboard-wrapper">
      
      {/* ⭐ FIXED HEADER - uses new router-based Header */}
      <Header hasHistory={hasHistory} />

      {/* ⭐ SPACER TO PREVENT OVERLAP */}
      <div style={{ height: HEADER_HEIGHT, width: "100%" }}></div>

      {/* ⭐ MAIN CONTENT (ROUTER OUTLET) */}
      <div className="dashboard-container">
        <div className="dashboard-content-area">
          <Outlet /> {/* Renders nested routes (new, existing, profile, etc) */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
