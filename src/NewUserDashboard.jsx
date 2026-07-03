import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function NewUserDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const quotes = [
    "Every day may not be good, but there is something good in every day.",
    "The greatest wealth is health.",
    "Your current situation is not your final destination.",
    "Small steps every day lead to big changes.",
    "Mental health is just as important as physical health."
  ];

  const randomQuote =
    quotes[Math.floor(Math.random() * quotes.length)];

  const userData =
    JSON.parse(localStorage.getItem("userData")) || {};

  return (
    <div className="welcome-page">
      <div className="welcome-card">

        <h1 className="form-name">
          Welcome, {userData.name || "Student"} 👋
        </h1>

        <p className="subtitle">
          We are glad to have you here.
        </p>

        {/* Daily Motivation */}
        <div className="dashboard-card">
          <h2>🌟 Daily Motivation</h2>
          <p>{randomQuote}</p>
        </div>

        {/* Assessment Status */}
        <div className="dashboard-card">
          <h2>📋 Assessment Status</h2>
          <p>No Assessment Taken Yet</p>
          <p>
            Take your first assessment to receive your
            personalized stress analysis.
          </p>
        </div>

        {/* Benefits */}
        <div className="dashboard-card">
          <h2>💡 Why Take Assessment?</h2>

          <ul>
            <li>Understand your stress levels</li>
            <li>Receive AI-powered insights</li>
            <li>Track emotional well-being</li>
            <li>Monitor progress over time</li>
          </ul>
        </div>

        {/* CTA Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "30px"
          }}
        >
          <button
            className="submit-btn"
            onClick={() => navigate("/dashboard/new")}
          >
            Take Your First Assessment
          </button>
        </div>

      </div>
    </div>
  );
}

export default NewUserDashboard;