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

// ⭐ Motivational Quotes
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
  const [quote, setQuote] = useState(""); // ⭐ NEW

  const userData = JSON.parse(localStorage.getItem("userData"));
  const userId = userData?.userId;
  const userName = userData?.name || "User";

  // ⭐ Pick Random Quote on Page Load
  useEffect(() => {
    const random = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[random]);
  }, []);

  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:5000/api/get-history/${userId}`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching history", err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <h2>Loading...</h2>;

  if (history.length === 0) {
    return (
      <div className="history-card fade-in">
        <h1>Welcome to your Dashboard 🎉</h1>
        <p>You haven’t completed any assessments yet.</p>
        <p>Submit your first assessment to start tracking your stress trends.</p>

        {/* ⭐ Random quote even when no history */}
        <p className="motivational-quote fade-in">{quote}</p>
      </div>
    );
  }

  // Format history data
  const labels = history.map((item) =>
    new Date(item.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    })
  );

  const stressValues = history.map((item) => item.stressLevel);

  const getBarColor = (value) => {
    if (value <= 40) return "rgba(0, 200, 0, 0.6)";
    if (value <= 70) return "rgba(255, 206, 86, 0.6)";
    return "rgba(255, 99, 132, 0.6)";
  };

  const getBorderColor = (value) => {
    if (value <= 40) return "rgb(0, 200, 0)";
    if (value <= 70) return "rgb(255, 206, 86)";
    return "rgb(255, 99, 132)";
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Stress Level (%)",
        data: stressValues,
        backgroundColor: stressValues.map((v) => getBarColor(v)),
        borderColor: stressValues.map((v) => getBorderColor(v)),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 10, padding: 10, font: { size: 12 } },
      },
      x: {
        ticks: { maxRotation: 60, minRotation: 60 },
      },
    },
  };

  const lastAssessment = stressValues[stressValues.length - 1];
  const averageStress = Math.round(
    stressValues.reduce((sum, val) => sum + val, 0) / stressValues.length
  );

  const highestStress = Math.max(...stressValues);
  const lowestStress = Math.min(...stressValues);
  const totalAssessments = stressValues.length;

  return (
    <div className="dashboard-wrapper">

      {/* ⭐ WELCOME BANNER WITH QUOTE */}
      <div className="welcome-banner fade-in">
        <h2>Welcome back, {userName}! 👋</h2>
        <p>Your personal wellness insights are updated below.</p>

        {/* ⭐ Random Motivational Quote */}
        <p className="motivational-quote fade-in">{quote}</p>
      </div>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="history-card fade-in">
        <h1>Your Wellness Dashboard</h1>

        <div className="current-status-box">
          <p>Your Latest Stress Level:</p>
          <h2>{lastAssessment}%</h2>
        </div>

        {/* SUMMARY CARDS */}
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Average Stress</h4>
            <p>{averageStress}%</p>
          </div>

          <div className="summary-card">
            <h4>Highest Stress</h4>
            <p>{highestStress}%</p>
          </div>

          <div className="summary-card">
            <h4>Lowest Stress</h4>
            <p>{lowestStress}%</p>
          </div>

          <div className="summary-card">
            <h4>Total Assessments</h4>
            <p>{totalAssessments}</p>
          </div>
        </div>

        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default ExistingUserHome;
