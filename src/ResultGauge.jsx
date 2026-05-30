import React, {useEffect} from "react";
import GaugeChart from "./GaugeChart";
import Header from './Header'; 
import './Dashboard.css';
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
        navigate('/dashboard/existing', { replace: true });
        return <div>Redirecting...</div>;
    }

    // ✅ Get stress label directly
    const stressLabel = resultData.stress_label || "Unknown";

    const recommendations = resultData.recommendations || [];

    return (
        <div className="dashboard-wrapper">

            <Header hasHistory={true} />

            <div className="dashboard-container">

                <div className="result-card">

                    <h1>Stress Assessment Result</h1>

                    <p className="subtitle">
                        Your stress level has been analyzed using behavioral,
                        facial and voice inputs.
                    </p>

                    {/* ✅ Send label instead of percentage */}
                    <GaugeChart label={stressLabel} />

                    <h2 style={{ marginTop: "25px" }}>
                        Stress Level:
                        <span style={{ color: "#2563eb" }}>
                            {" "}{stressLabel}
                        </span>
                    </h2>

                    <div
                        className="recommendations-block"
                        style={{ marginTop: "20px" }}
                    >

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