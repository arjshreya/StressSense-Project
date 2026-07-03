import React, { useEffect } from "react";
import GaugeChart from "./GaugeChart";
import Header from './Header'; 
import './ResultGauge.css'; // 🔹 FIXED: Corrected spelling to import your styling perfectly
import { useLocation, useNavigate } from 'react-router-dom';

const ResultGauge = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const location = useLocation();
    const navigate = useNavigate();
    const resultData = location.state;

    // Redirect if no data
    if (!resultData) {
        localStorage.setItem("hasHistory", "true");
        navigate('/dashboard/existing', { replace: true });
        return <div>Redirecting...</div>;
    }

    const stressLabel = resultData.stress_label || "Unknown";
    const recommendations = resultData.recommendations || [];

    const breakdown = resultData.breakdown || {
        questionnaire_contribution: 0,
        face_contribution: 0,
        voice_contribution: 0
    };

    const getScoreBadgeColor = (score) => {
        if (score <= 35) return "#28a745"; // Green
        if (score <= 70) return "#ffc107"; // Yellow
        return "#dc3545"; // Red
    };

    return (
        <div className="results-page-wrapper">
            <Header hasHistory={true} />

            <div className="results-page-container">
                <div className="results-card-custom">
                    
                    {/* ✅ FIXED: These headers are now fully functional and visible */}
                    <h1>Stress Assessment Result</h1>
                    <p className="subtitle">
                        Your stress level has been analyzed using behavioral,
                        facial and voice inputs.
                    </p>

                    <GaugeChart label={stressLabel} />
                    {resultData?.warnings?.length > 0 && (
                        <div className="warning-box">
                            <h4>⚠ Prediction Accuracy Warning</h4>

                            {resultData.warnings.map((warning, index) => (
                            <p key={index}>{warning}</p>
                            ))}

                            <p>
                            Prediction was generated using available information only.
                            Accuracy may be reduced because some inputs were missing.
                            </p>
                        </div>
                        )}
                    <h2 style={{ marginTop: "25px" }}>
                        Stress Level:
                        <span style={{ color: getScoreBadgeColor(resultData.predicted_score || 0) }}>
                            {" "}{stressLabel}
                        </span>
                    </h2>

                    {/* ✅ FIXED: Cleaned up character prefix */}
                    <h3 style={{ color: "#1a237e", marginBottom: "15px", marginTop: "30px", textAlign: "left", fontSize: "1.2rem" }}>
                        📊 Multi-Modal Input Breakdown
                    </h3>
            
                    <div className="summary-cards">
                        <div className="summary-card" style={{ borderTop: `4px solid #6a11cb` }}>
                            <h4>📝 Questionnaire Model</h4>
                            <p style={{ color: getScoreBadgeColor(breakdown.questionnaire_contribution) }}>
                                {Math.round(breakdown.questionnaire_contribution)}%
                            </p>
                            <span style={{ fontSize: "11px", color: "#888" }}>Weight Impact: 80%</span>
                        </div>

                        <div className="summary-card" style={{ borderTop: `4px solid #2575fc` }}>
                            <h4>📸 Facial CNN Model</h4>
                            <p style={{ color: getScoreBadgeColor(breakdown.face_contribution) }}>
                                {Math.round(breakdown.face_contribution)}%
                            </p>
                            <span style={{ fontSize: "11px", color: "#888" }}>Weight Impact: 10%</span>
                        </div>

                        <div className="summary-card" style={{ borderTop: `4px solid #28a745` }}>
                            <h4>🎙️ Vocal Acoustic Model</h4>
                            <p style={{ color: getScoreBadgeColor(breakdown.voice_contribution) }}>
                                {Math.round(breakdown.voice_contribution)}%
                            </p>
                            <span style={{ fontSize: "11px", color: "#888" }}>Weight Impact: 10%</span>
                        </div>
                    </div>

                    <hr style={{ border: "0", borderTop: "1px dashed #ccd8ff", margin: "25px 0" }} />
                    
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