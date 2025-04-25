import { useState, useEffect } from "react";
import { Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Label colors for consistent styling
const labelColors = {
  "Benign Traffic": "rgba(34, 197, 94, 0.6)", // Green
  "DoS Attacks": "rgba(239, 68, 68, 0.6)", // Red
  "DDoS Attacks": "rgba(239, 68, 68, 0.6)", // Red
  "Port Scanning & Brute Force": "rgba(234, 179, 8, 0.6)", // Yellow
  "Other Exploits & Infiltrations": "rgba(59, 130, 246, 0.6)", // Blue
};

// Severity colors
const severityColors = {
  Critical: "rgba(220, 38, 38, 0.8)",  // Bright red
  High: "rgba(239, 68, 68, 0.6)",      // Red
  Medium: "rgba(234, 179, 8, 0.6)",    // Yellow
  Low: "rgba(59, 130, 246, 0.6)",      // Blue
  Info: "rgba(34, 197, 94, 0.6)",      // Green
};

// Risk level border colors
const riskBorderColors = {
  Critical: "border-red-600",
  High: "border-red-500",
  Medium: "border-yellow-500",
  Low: "border-blue-500",
  Info: "border-green-500"
};

// Normalize packet labels
const normalizeLabel = (label) => {
  if (!label || label === null || label === undefined) return "Benign Traffic";
  return label;
};

// Map attack types to severity levels
const getSeverity = (attackType) => {
  const severityMap = {
    "DoS Attacks": "Critical",
    "DDoS Attacks": "Critical",
    "Port Scanning & Brute Force": "High",
    "Other Exploits & Infiltrations": "Medium",
    "Benign Traffic": "Info"
  };
  
  return severityMap[attackType] || "Medium";
};

const AttackVisualizations = ({ processedPackets }) => {
  const [barData, setBarData] = useState({ labels: [], datasets: [] });
  const [pieData, setPieData] = useState({ labels: [], datasets: [] });
  const [severityData, setSeverityData] = useState({ labels: [], datasets: [] });
  const [riskScoreData, setRiskScoreData] = useState({ value: 0, level: "Low" });

  useEffect(() => {
    if (!processedPackets || processedPackets.length === 0) {
      return;
    }

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
          backgroundColor: barLabels.map(label => labelColors[label] || labelColors["Other Exploits & Infiltrations"]),
          borderColor: barLabels.map(label => (labelColors[label] || labelColors["Other Exploits & Infiltrations"]).replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    });

    // Pie chart: distribution of attack labels
    setPieData({
      labels: barLabels,
      datasets: [
        {
          label: "Attack Distribution",
          data: barCounts,
          backgroundColor: barLabels.map(label => labelColors[label] || labelColors["Other Exploits & Infiltrations"]),
          borderColor: barLabels.map(label => (labelColors[label] || labelColors["Other Exploits & Infiltrations"]).replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    });

    // Severity distribution (Nessus-like)
    const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    
    processedPackets.forEach(packet => {
      const attackType = normalizeLabel(packet.classification);
      const severity = getSeverity(attackType);
      severityCounts[severity] += 1;
    });
    
    setSeverityData({
      labels: Object.keys(severityCounts),
      datasets: [
        {
          label: "Severity Distribution",
          data: Object.values(severityCounts),
          backgroundColor: Object.keys(severityCounts).map(severity => severityColors[severity]),
          borderColor: Object.keys(severityCounts).map(severity => severityColors[severity].replace("0.6", "1")),
          borderWidth: 1,
        },
      ],
    });

    // Calculate risk score (0-100)
    const weightedSeverity = {
      Critical: 100,
      High: 75,
      Medium: 50,
      Low: 25,
      Info: 0
    };

    let totalWeightedScore = 0;
    let totalPackets = 0;
    
    Object.entries(severityCounts).forEach(([severity, count]) => {
      totalWeightedScore += weightedSeverity[severity] * count;
      totalPackets += count;
    });
    
    const riskScore = totalPackets > 0 ? Math.round(totalWeightedScore / totalPackets) : 0;
    
    let riskLevel = "Low";
    if (riskScore >= 75) riskLevel = "Critical";
    else if (riskScore >= 50) riskLevel = "High";
    else if (riskScore >= 25) riskLevel = "Medium";
    
    setRiskScoreData({
      value: riskScore,
      level: riskLevel
    });

  }, [processedPackets]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#e5e7eb" },
      },
      title: {
        display: true,
        color: "#e5e7eb",
        font: { size: 16 },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: "Attack Label Frequency",
      }
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

  const pieOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: "Attack Label Distribution",
      }
    },
  };

  const severityOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: {
        ...chartOptions.plugins.title,
        text: "Severity Distribution",
      }
    },
  };

  // Risk level styling
  const getRiskScoreColor = (level) => {
    switch(level) {
      case "Critical": return "bg-red-600";
      case "High": return "bg-red-500";
      case "Medium": return "bg-yellow-500";
      case "Low": return "bg-blue-500";
      default: return "bg-green-500";
    }
  };

  return (
    <div className="my-6">
      {processedPackets.length > 0 ? (
        <>
          {/* Dashboard Grid - Evenly sized charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Risk Score Summary with colored circle border */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex flex-col items-center h-full justify-center">
                <h3 className="text-lg font-semibold text-gray-200 mb-3">Overall Risk Score</h3>
                
                {/* Updated risk gauge with colored border */}
                <div className={`flex items-center justify-center w-36 h-36 rounded-full bg-gray-900 border-8 ${riskBorderColors[riskScoreData.level]} mb-4 relative`}>
                  <div className="text-4xl font-bold text-white">{riskScoreData.value}</div>
                </div>
                
                {/* Risk indicator label */}
                <div className={`text-lg font-medium px-6 py-1 rounded-full ${getRiskScoreColor(riskScoreData.level)} text-white`}>
                  {riskScoreData.level} Risk
                </div>
              </div>
            </div>
            
            {/* Attack Label Distribution */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="h-64">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
            
            {/* Severity Distribution */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="h-64">
                <Doughnut data={severityData} options={severityOptions} />
              </div>
            </div>
          </div>

          {/* Bar Chart - Full Width */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
          
          {/* Vulnerability Summary */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Security Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {Object.entries(severityData.datasets[0]?.data ? 
                severityData.datasets[0].data.reduce((acc, count, index) => {
                  acc[severityData.labels[index]] = count;
                  return acc;
                }, {}) : {}).map(([severity, count]) => (
                <div key={severity} className="p-3 rounded-lg border border-gray-700 bg-gray-750">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{severity}</span>
                    <span className={`text-lg font-semibold ${severity === 'Critical' || severity === 'High' ? 'text-red-500' : 
                      severity === 'Medium' ? 'text-yellow-500' : 
                      severity === 'Low' ? 'text-blue-500' : 'text-green-500'}`}>
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 p-6 bg-gray-800 rounded-lg border border-gray-700">
          <p>No data available for visualization. Start capturing packets to see attack label distributions.</p>
        </div>
      )}
    </div>
  );
};

export default AttackVisualizations;