import { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Label colors for consistent styling
const labelColors = {
  BENIGN: "rgba(34, 197, 94, 0.6)", // Green
  DoS: "rgba(239, 68, 68, 0.6)", // Red
  DDoS: "rgba(239, 68, 68, 0.6)", // Red
  PortScan: "rgba(234, 179, 8, 0.6)", // Yellow
  Patator: "rgba(234, 179, 8, 0.6)", // Yellow
  "Web Attack": "rgba(168, 85, 247, 0.6)", // Purple
  Other: "rgba(59, 130, 246, 0.6)", // Blue
};

// Normalize packet labels into broad categories
const normalizeLabel = (label) => {
  if (!label) return "Other";
  if (label.startsWith("DoS")) return "DoS";
  if (label.startsWith("Web Attack")) return "Web Attack";
  if (label.includes("Patator")) return "Patator";
  return label;
};

const AttackVisualizations = ({ processedPackets }) => {
  const [barData, setBarData] = useState({ labels: [], datasets: [] });
  const [lineData, setLineData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    // Bar chart: frequency of attack labels
    const labelCounts = processedPackets.reduce((acc, packet) => {
      const key = normalizeLabel(packet.classification);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const barLabels = Object.keys(labelCounts);
    const barCounts = Object.values(labelCounts);

    setBarData({
      labels: barLabels,
      datasets: [
        {
          label: "Attack Label Frequency",
          data: barCounts,
          backgroundColor: barLabels.map(label => labelColors[label] || labelColors.Other),
          borderColor: barLabels.map(label => (labelColors[label] || labelColors.Other).replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    });

    // Line chart: cumulative frequency over time
    const cumulativeCounts = {};
    const timestamps = [];

    processedPackets.forEach((packet, index) => {
      const key = normalizeLabel(packet.classification);
      if (!cumulativeCounts[key]) cumulativeCounts[key] = [];
      const prev = cumulativeCounts[key][cumulativeCounts[key].length - 1] || 0;
      cumulativeCounts[key].push(prev + 1);
      timestamps.push(index + 1); // Can be replaced with real timestamps if available
    });

    const lineDatasets = Object.keys(cumulativeCounts).map(label => ({
      label: `${label} Cumulative`,
      data: cumulativeCounts[label],
      borderColor: labelColors[label] || labelColors.Other,
      backgroundColor: (labelColors[label] || labelColors.Other).replace("0.6", "0.2"),
      fill: false,
      tension: 0.1,
    }));

    setLineData({
      labels: timestamps,
      datasets: lineDatasets,
    });
  }, [processedPackets]);

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#e5e7eb" },
      },
      title: {
        display: true,
        text: "Attack Label Frequency",
        color: "#e5e7eb",
        font: { size: 16 },
      },
    },
    scales: {
      x: { ticks: { color: "#e5e7eb" }, grid: { display: false } },
      y: {
        ticks: { color: "#e5e7eb" },
        grid: { color: "#4b5563" },
        beginAtZero: true,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#e5e7eb" },
      },
      title: {
        display: true,
        text: "Cumulative Attack Frequency Over Time",
        color: "#e5e7eb",
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Packet Index", color: "#e5e7eb" },
        ticks: { color: "#e5e7eb" },
        grid: { display: false },
      },
      y: {
        title: { display: true, text: "Cumulative Count", color: "#e5e7eb" },
        ticks: { color: "#e5e7eb" },
        grid: { color: "#4b5563" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="my-6">
      {processedPackets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <Bar data={barData} options={barOptions} />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <p>No data available for visualization. Start capturing packets to see attack label distributions.</p>
        </div>
      )}
    </div>
  );
};

export default AttackVisualizations;
