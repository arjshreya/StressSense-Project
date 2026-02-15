import React, { useEffect, useRef } from "react";
// Import Chart from 'chart.js/auto' is correct for a default export
import Chart from "chart.js/auto"; 
import './Dashboard.css';

const GaugeChart = ({ value }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Define the stress segments (33%, 33%, 34% of the arc)
  const dataSegments = [33, 33, 34];
  const totalGaugeValue = 100;
  
  // --- Custom Plugin: The logic to draw and position the needle ---
  const needlePlugin = {
    id: "needle",
    afterDatasetDraw(chart) {
      const { ctx, data } = chart;
      
      // Get the current stress value (0-100)
      const needleValue = data.datasets[0].value || 0; 

      // Calculate center coordinates
      // cx and cy should be the center point of the semi-circle
      const meta = chart.getDatasetMeta(0);
      const cx = meta.data[0].x;
      const cy = meta.data[0].y;
      const angleOfNeedle = (Math.PI * needleValue) / totalGaugeValue;
      // Calculate final angle for the needle (starts at 180 deg (Math.PI) and ends at 360 deg)
      // The gauge spans only 180 degrees (Math.PI).
      // Angle: Math.PI (180 deg) + (Math.PI * (value / 100))
      // Since rotation starts at 270 deg (bottom center), we need 270 - 180 + angle.
      const finalAngle = Math.PI * 1.5 + angleOfNeedle; 
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(finalAngle); // Rotate by the calculated angle

      // 1. Draw the Needle (a simple black line)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -chart.width / 2.5); // Needle length
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#111827";
      ctx.stroke();
      
      // 2. Draw the Needle Hub (the small circle at the center)
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#111827";
      ctx.fill();
      
      ctx.restore();
    },
  };

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    // Destroy previous chart instance to avoid "Canvas is already in use" error
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    // --- Chart Configuration ---
    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            // Data for the colored arc segments
            data: [...dataSegments, totalGaugeValue - dataSegments.reduce((a, b) => a + b, 0)], // 33, 33, 34
            backgroundColor: ["#28a745", "#ffc107", "#dc3545", "#e5e7eb"], // Green, Yellow, Red, Gray (for hiding lower half)
            borderWidth: 0,
            cutout: "80%", 
            circumference: 180, // Half circle
            rotation: 270, // Start chart at 6 o'clock position (12 o'clock is 0)
            value: value // ⭐ Pass the dynamic value here for the plugin
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false },
          title: { display: false },
        },
        layout: {
            padding: {
                bottom: 10
            }
        },
        // ⭐ Enable animation for the needle movement
        animation: { 
            animateRotate: true, 
            duration: 1200,
            animateScale: false 
        },
      },
      plugins: [ needlePlugin ], // ⭐ Inject the custom needle plugin
    });

    // Cleanup function
    return () => {
        if (chartRef.current) {
            chartRef.current.destroy();
        }
    };
  }, [value]); // ⭐ Re-run effect whenever 'value' changes

  const getStatusText = (score) => {
    if (score <= 33) return "Low Stress";
    if (score <= 66) return "Moderate Stress";
    return "High Stress";
  };
  
  const getStatusColor = (score) => {
    if (score <= 33) return "#28a745";
    if (score <= 66) return "#ffc107";
    return "#dc3545";
  };

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "350px", height: "220px", margin: "0 auto" }}>
      <canvas ref={canvasRef}></canvas>
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          fontWeight: "600",
          width: "100%",
          color: getStatusColor(value)
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>{value}%</div>
        <div style={{ fontSize: "1.2rem", marginTop: "5px" }}>{getStatusText(value)}</div>
      </div>
    </div>
  );
};

export default GaugeChart;