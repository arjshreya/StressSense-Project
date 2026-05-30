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
  const [quote, setQuote] = useState("");
  
  const userData =
    JSON.parse(localStorage.getItem("userData"));

  const userId = userData?.userId;

  const userName =
    userData?.name || "User";

  
  // =========================================
  // RANDOM QUOTE
  // =========================================

  useEffect(() => {

    const random =
      Math.floor(Math.random() * quotes.length);

    setQuote(quotes[random]);

  }, []);

  // =========================================
  // FETCH HISTORY
  // =========================================

  useEffect(() => {

    if (!userId) return;

    fetch(
      `http://localhost:5000/api/get-history/${userId}`
    )
      .then((res) => res.json())

      .then((data) => {

        console.log("Fetched History:", data);

        setHistory(data.history || []);

        setLoading(false);
      })

      .catch((err) => {

        console.error(
          "Error fetching history",
          err
        );

        setLoading(false);
      });

  }, [userId]);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (
      <h2 style={{ textAlign: "center" }}>
        Loading...
      </h2>
    );
  }

  // =========================================
  // NO HISTORY
  // =========================================

  if (history.length === 0) {

    return (

      <div className="history-card fade-in">

        <h1>
          Welcome to your Dashboard 🎉
        </h1>

        <p>
          You haven’t completed any
          assessments yet.
        </p>

        <p>
          Submit your first assessment to
          start tracking your stress trends.
        </p>

        <p className="motivational-quote fade-in">
          {quote}
        </p>

      </div>
    );
  }

  // =========================================
  // LABELS
  // =========================================

  const labels = history.map((item) =>

    new Date(
      item.createdAt || Date.now()
    ).toLocaleDateString('en-GB', {

      day: '2-digit',
      month: 'short'

    })
  );

  // =========================================
  // STRESS VALUES
  // =========================================

  const stressValues = history

    .map((item) => {

      console.log(
        "History Item:",
        item
      );

      // predicted_score
      if (

        item.predicted_score !== undefined &&

        !isNaN(
          Number(item.predicted_score)
        )

      ) {

        return Number(
          item.predicted_score
        );
      }

      // stressLevel
      if (

        item.stressLevel !== undefined &&

        !isNaN(
          Number(item.stressLevel)
        )

      ) {

        return Number(
          item.stressLevel
        );
      }

      // stress_label fallback
      if (item.stress_label) {

        if (
          item.stress_label ===
          "Low Stress"
        ) {
          return 25;
        }

        if (
          item.stress_label ===
          "Medium Stress"
        ) {
          return 55;
        }

        if (
          item.stress_label ===
          "High Stress"
        ) {
          return 85;
        }
      }

      return null;
    })

    .filter(
      (value) => value !== null
    );

  console.log(
    "Final Stress Values:",
    stressValues
  );

  // =========================================
  // SAFE CALCULATIONS
  // =========================================

  const totalAssessments =
    stressValues.length;

  const lastAssessment =

    totalAssessments > 0

      ? stressValues[
          totalAssessments - 1
        ]

      : 0;

  const averageStress =

    totalAssessments > 0

      ? Math.round(

          stressValues.reduce(

            (sum, val) =>
              sum + val,

            0

          ) / totalAssessments

        )

      : 0;

  const highestStress =

    totalAssessments > 0

      ? Math.max(...stressValues)

      : 0;

  const lowestStress =

    totalAssessments > 0

      ? Math.min(...stressValues)

      : 0;

  // =========================================
  // BAR COLORS
  // =========================================

  const getBarColor = (value) => {

    if (value <= 40)
      return "rgba(0, 200, 0, 0.6)";

    if (value <= 70)
      return "rgba(255, 206, 86, 0.6)";

    return "rgba(255, 99, 132, 0.6)";
  };

  const getBorderColor = (value) => {

    if (value <= 40)
      return "rgb(0, 200, 0)";

    if (value <= 70)
      return "rgb(255, 206, 86)";

    return "rgb(255, 99, 132)";
  };

  // =========================================
  // CHART DATA
  // =========================================

  const chartData = {

    labels,

    datasets: [

      {
        label: "Stress Level (%)",

        data: stressValues,

        backgroundColor:
          stressValues.map((v) =>
            getBarColor(v)
          ),

        borderColor:
          stressValues.map((v) =>
            getBorderColor(v)
          ),

        borderWidth: 1,

        borderRadius: 8,
      },
    ],
  };

  // =========================================
  // CHART OPTIONS
  // =========================================

  const chartOptions = {

    responsive: true,

    maintainAspectRatio: false,

    plugins: {

      legend: {
        display: true,
      },

      title: {
        display: false,
      },
    },

    scales: {

      y: {

        beginAtZero: true,

        max: 100,

        ticks: {

          stepSize: 10,

          padding: 10,

          font: {
            size: 12
          },
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
  // UI
  // =========================================

  return (

    <div className="dashboard-wrapper">

      {/* WELCOME */}

      <div className="welcome-banner fade-in">

        <h2>
          Welcome back,
          {userName}! 👋
        </h2>

        <p>
          Your personal wellness insights
          are updated below.
        </p>

        <p className="motivational-quote fade-in">
          {quote}
        </p>

      </div>

      {/* DASHBOARD */}

      <div className="history-card fade-in">

        <h1>
          Your Wellness Dashboard
        </h1>

        <div className="current-status-box">

          <p>
            Your Latest Stress Level:
          </p>

          <h2>
            {lastAssessment}%
          </h2>

        </div>

        {/* SUMMARY */}

        <div className="summary-cards">

          <div className="summary-card">

            <h4>
              Average Stress
            </h4>

            <p>
              {averageStress}%
            </p>

          </div>

          <div className="summary-card">

            <h4>
              Highest Stress
            </h4>

            <p>
              {highestStress}%
            </p>

          </div>

          <div className="summary-card">

            <h4>
              Lowest Stress
            </h4>

            <p>
              {lowestStress}%
            </p>

          </div>

          <div className="summary-card">

            <h4>
              Total Assessments
            </h4>

            <p>
              {totalAssessments}
            </p>

          </div>

        </div>

        {/* CHART */}

        <div
          className="chart-container"
          style={{
            height: "400px",
            marginTop: "30px",
          }}
        >

          <Bar
            data={chartData}
            options={chartOptions}
          />

        </div>

      </div>

    </div>
  );
}

export default ExistingUserHome;