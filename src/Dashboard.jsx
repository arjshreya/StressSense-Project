// src/Dashboard.jsx

import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import "./Dashboard.css";

function Dashboard({
  hasHistory,
  onAssessmentSubmit,
  handleLogout
}) {

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="full-dashboard-wrapper">

      <Header hasHistory={hasHistory}
      handleLogout={handleLogout}
       />

      <main className="dashboard-main">
      <Outlet
          context={{
            onAssessmentSubmit
          }}
        />
      </main>

    </div>
  );
}

export default Dashboard;