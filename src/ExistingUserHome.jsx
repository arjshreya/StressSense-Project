import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import './Dashboard.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Motivational Quotes
const quotes = [
  "Every small step you take toward balance counts more than you think.",
  "You are stronger than the stress you feel today.",
  "Progress is progress, no matter how slow.",
  "Your mind deserves the same care you give to others.",
  "Breathe. You’re doing the best you can.",
  "Peace begins the moment you choose it.",
  "Take a moment for yourself — you’ve earned it.",
  "Healing is not linear, but every step matters.",
];

function ExistingUserHome() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState("");
  
  const userData = JSON.parse(localStorage.getItem("userData"));
  const userId = userData?.userId;
  const userName = userData?.name || "User";

  // =========================================
  // RANDOM QUOTE GENERATOR
  // =========================================
  useEffect(() => {
    const random = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[random]);
  }, []);

  // =========================================
  // FETCH HISTORY FROM API
  // =========================================
  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:5000/api/get-history/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched History Payload:", data);
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching history:", err);
        setLoading(false);
      });
  }, [userId]);

  // =========================================
  // HELPER FUNCTION: CONVERT SCORE TO LABEL
  // =========================================
  const getStressLabelFromScore = (score) => {
    if (score <= 35) return "Low Stress";
    if (score <= 70) return "Medium Stress";
    return "High Stress";
  };

  const getLabelColor = (label) => {
    if (label === "Low Stress") return "#28a745"; // Green
    if (label === "Medium Stress") return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  // =========================================
  // LOADING STATE
  // =========================================
  if (loading) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "100px" }}>
        Loading Dashboard...
      </h2>
    );
  }

  // =========================================
  // NO HISTORY STATE
  // =========================================
  if (history.length === 0) {
    return (
      <div className="history-card fade-in">
        <h1>Welcome to your Dashboard 🎉</h1>
        <p>You haven’t completed any assessments yet.</p>
        <p>Submit your first assessment to start tracking your stress trends.</p>
        <p className="motivational-quote fade-in">{quote}</p>
      </div>
    );
  }

  // =========================================
  // PROCESSING HISTORY TIMELINES (BAR GRAPH FIX)
  // =========================================
  const labels = history.map((item) =>
    new Date(item.createdAt || Date.now()).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    })
  );

  const stressValues = history
    .map((item) => {
      // 1. Look for your new unified endpoint score parameter
      if (item.overall_score !== undefined && !isNaN(Number(item.overall_score))) {
        return Number(item.overall_score);
      }
      // 2. Look for fallback prediction metric keys
      if (item.predicted_score !== undefined && !isNaN(Number(item.predicted_score))) {
        return Number(item.predicted_score);
      }
      // 3. Look for legacy backup numbers
      if (item.stressScore !== undefined && !isNaN(Number(item.stressScore))) {
        return Number(item.stressScore);
      }
      if (item.stressLevel !== undefined && !isNaN(Number(item.stressLevel))) {
        return Number(item.stressLevel);
      }
      // 4. Handle text backups
      if (item.stressLevel === "Low Stress") return 25;
      if (item.stressLevel === "Medium Stress") return 55;
      if (item.stressLevel === "High Stress") return 85;

      return null;
    })
    .filter((value) => value !== null);

  // =========================================
  // SUMMARY CALCULATIONS (COUNTING CATEGORIES)
  // =========================================
  const totalAssessments = stressValues.length;

  // Track counts of each specific assessment outcome level
  let lowCount = 0;
  let mediumCount = 0;
  let highCount = 0;

  stressValues.forEach((val) => {
    if (val <= 35) lowCount++;
    else if (val <= 70) mediumCount++;
    else highCount++;
  });

  // Extract the latest assessment score to convert it into a string label
  const latestNumericScore = totalAssessments > 0 ? stressValues[totalAssessments - 1] : 0;
  const latestStressLabel = getStressLabelFromScore(latestNumericScore);

  // =========================================
  // BAR DYNAMIC COLOR FUNCTIONS
  // =========================================
  const getBarColor = (value) => {
    if (value <= 35) return "rgba(40, 167, 69, 0.6)";   // Symmetrical green
    if (value <= 70) return "rgba(255, 193, 7, 0.6)";   // Symmetrical yellow
    return "rgba(220, 53, 69, 0.6)";    // Symmetrical red
  };

  const getBorderColor = (value) => {
    if (value <= 35) return "rgb(40, 167, 69)";
    if (value <= 70) return "rgb(255, 193, 7)";
    return "rgb(220, 53, 69)";
  };

  // =========================================
  // CHART CONFIGURATIONS
  // =========================================
  const chartData = {
    labels,
    datasets: [
      {
        label: "Stress Level (%)",
        data: stressValues,
        backgroundColor: stressValues.map((v) => getBarColor(v)),
        borderColor: stressValues.map((v) => getBorderColor(v)),
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 10,
          padding: 10,
          font: { size: 12 },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  // =========================================
  // CORE COMPONENT RENDER INTERFACE
  // =========================================
  return (
    <div className="dashboard-wrapper">
      {/* WELCOME */}
      <div className="welcome-banner fade-in">
        <h2>Welcome back, {userName}! 👋</h2>
        <p>Your personal wellness insights are updated below.</p>
        <p className="motivational-quote fade-in">{quote}</p>
      </div>

      {/* DASHBOARD CARD */}
      <div className="history-card fade-in">
        <h1>Your Wellness Dashboard</h1>

        <div className="current-status-box">
          <p>Your Latest Stress Level:</p>
          <h2 style={{ color: getLabelColor(latestStressLabel), fontSize: "2.2rem", fontWeight: "700" }}>
            {latestStressLabel}
          </h2>
        </div>

        {/* SUMMARY CARDS SECTION */}
        <div className="summary-cards">
          <div className="summary-card" style={{ borderTop: "4px solid #28a745" }}>
            <h4>🟢 Low Stress Cases</h4>
            <p style={{ color: "#28a745" }}>{lowCount}</p>
          </div>

          <div className="summary-card" style={{ borderTop: "4px solid #ffc107" }}>
            <h4>🟡 Medium Stress Cases</h4>
            <p style={{ color: "#ffc107" }}>{mediumCount}</p>
          </div>

          <div className="summary-card" style={{ borderTop: "4px solid #dc3545" }}>
            <h4>🔴 High Stress Cases</h4>
            <p style={{ color: "#dc3545" }}>{highCount}</p>
          </div>

          <div className="summary-card" style={{ borderTop: "4px solid #2575fc" }}>
            <h4>📊 Total Assessments</h4>
            <p style={{ color: "#2575fc" }}>{totalAssessments}</p>
          </div>
        </div>

        {/* COMPREHENSIVE TIMELINE CHART CONTAINER */}
        <div className="chart-container" style={{ height: "400px", marginTop: "40px" }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default ExistingUserHome;