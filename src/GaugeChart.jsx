// src/GaugeChart.jsx

import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "./Dashboard.css";

const GaugeChart = ({ label }) => {

  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // =========================
  // CONVERT LABEL TO VALUE
  // =========================

  const gaugeValue =
    label === "Low Stress"
      ? 25
      : label === "Medium Stress"
      ? 55
      : 85;

  const dataSegments = [33, 33, 34];
  const totalGaugeValue = 100;

  // =========================
  // NEEDLE PLUGIN
  // =========================

  const needlePlugin = {

    id: "needle",

    afterDatasetDraw(chart) {

      const { ctx, data } = chart;

      const needleValue =
        data.datasets[0].value || 0;

      const meta =
        chart.getDatasetMeta(0);

      const cx = meta.data[0].x;
      const cy = meta.data[0].y;

      const angleOfNeedle =
        (Math.PI * needleValue) /
        totalGaugeValue;

      const finalAngle =
        Math.PI * 1.5 +
        angleOfNeedle;

      ctx.save();

      ctx.translate(cx, cy);

      ctx.rotate(finalAngle);

      // NEEDLE
      ctx.beginPath();

      ctx.moveTo(0, 0);

      ctx.lineTo(
        0,
        -chart.width / 2.5
      );

      ctx.lineWidth = 4;

      ctx.strokeStyle = "#111827";

      ctx.stroke();

      // CENTER DOT
      ctx.beginPath();

      ctx.arc(
        0,
        0,
        8,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = "#111827";

      ctx.fill();

      ctx.restore();
    },
  };

  // =========================
  // CHART
  // =========================

  useEffect(() => {

    const ctx =
      canvasRef.current.getContext("2d");

    // destroy old chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {

      type: "doughnut",

      data: {

        datasets: [
          {

            data: [
              ...dataSegments,
              totalGaugeValue -
                dataSegments.reduce(
                  (a, b) => a + b,
                  0
                ),
            ],

            backgroundColor: [
              "#22c55e",
              "#facc15",
              "#ef4444",
              "#e5e7eb",
            ],

            borderWidth: 0,

            cutout: "80%",

            circumference: 180,

            rotation: 270,

            value: gaugeValue,
          },
        ],
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          tooltip: {
            enabled: false,
          },

          legend: {
            display: false,
          },
        },

        layout: {
          padding: {
            top: 10,
            bottom: 10,
          },
        },

        animation: {
          animateRotate: true,
          duration: 1200,
        },
      },

      plugins: [needlePlugin],
    });

    return () => {

      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };

  }, [gaugeValue]);

  // =========================
  // COLOR
  // =========================

  const getStatusColor = () => {

    if (gaugeValue <= 33)
      return "#22c55e";

    if (gaugeValue <= 66)
      return "#f59e0b";

    return "#ef4444";
  };

  // =========================
  // UI
  // =========================

  return (

    <div
      className="gauge-wrapper"
    >

      <canvas
        ref={canvasRef}
      ></canvas>

      <div
        className="gauge-center-text"
      >

        <div
          className="gauge-label"
          style={{
            color: getStatusColor(),
          }}
        >
          {label}
        </div>

        <div className="gauge-subtitle">
          Stress Analysis Result
        </div>

      </div>

    </div>
  );
};

export default GaugeChart;