import React from "react";
import GaugeChart from "./GaugeChart";
import Header from './Header'; 
import './Dashboard.css';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultGauge = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // FIXED: get state directly
    const resultData = location.state;

    // If no result data → redirect user
    if (!resultData) {
        navigate('/dashboard/existing', { replace: true });
        return <div>Redirecting...</div>;
    }

    // FIXED: correct variable names
    const stressLevel = Math.round(resultData.predicted_score || 0);
    const category = resultData.category || "Unknown";
    const recommendations = resultData.recommendations || [];

    return (
        <div className="dashboard-wrapper">
            <Header hasHistory={true} />

            <div className="dashboard-container">
                <div className="result-card">
                    <h1>Stress Assessment Result</h1>
                    <p className="subtitle">
                        Your stress score has been calculated using facial, voice & lifestyle inputs.
                    </p>

                    <GaugeChart value={stressLevel} />

                    <h2 style={{ marginTop: "25px" }}>
                        Category: <span style={{ color: "#2563eb" }}>{category}</span>
                    </h2>

                    <div className="recommendations-block" style={{ marginTop: "20px" }}>
                        <h3>Your Recommendations</h3>

                        {recommendations.length === 0 ? (
                            <p>No recommendations available.</p>
                        ) : (
                            <ul>
                                {recommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        className="submit-btn"
                        style={{ maxWidth: "300px", marginTop: "30px" }}
                        onClick={() => navigate('/dashboard/existing')}
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultGauge;
