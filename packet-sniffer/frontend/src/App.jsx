import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PacketControls from "./components/PacketControls";
import PacketAnalyzerTable from "./components/PacketAnalyzerTable";
import AttackVisualizations from "./components/AttackVisualizations";
import CSVUpload from "./components/CSVUpload";
import { Download, Trash2, FileText } from "lucide-react";
//for pdf export
import jsPDF from 'jspdf';


function App() {
  const [packets, setPackets] = useState([]);
  const [processedPackets, setProcessedPackets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [currentAttack, setCurrentAttack] = useState("Benign Traffic");
  const [activeTab, setActiveTab] = useState("capture"); // 'capture' or 'upload'
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const wsRef = useRef(null);
  const statusIntervalRef = useRef(null);

  const API_URL = "http://localhost:8000";
  const WS_URL = "ws://localhost:8000/ws/packets";
  
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, []);

  const startContinuousCapture = async () => {
    setCsvUploaded(false);
    setUploadedFileName("");
    setIsLoading(true);
    setError(null);
    setPackets([]);
    setProcessedPackets([]);
    setCurrentAttack("Benign Traffic");

    try {
      const response = await fetch(`${API_URL}/start-capture`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      setIsCapturing(true);

      wsRef.current = new WebSocket(WS_URL);
      wsRef.current.onopen = () => console.log("WebSocket connected");

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`WebSocket message at ${new Date().toLocaleTimeString()}:`, data);
        if (data.type === "status_update" || data.type === "capture_complete") {
          if (
            data.type === "status_update" &&
            data.complete &&
            data.current_count >= data.max_packets
          ) {
            stopCapture();
          } else if (data.type === "capture_complete") {
            stopCapture();
          }
        } else {
          console.log("Packet data received:", data); // Log only packet data
          const packetData = transformPacketData(data);
          const prediction = data.classification ?? "Unknown"; // Fallback to "Unknown"

          const attackCategory = prediction || "Benign Traffic";
          setCurrentAttack(attackCategory);
          setPackets((prev) => [packetData, ...prev]);
          setProcessedPackets((prev) => [
            {
              ...packetData,
              timestamp: new Date().toLocaleTimeString(),
              classification: prediction,
            },
            ...prev,
          ]);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection failed");
        stopCapture();
      };

      wsRef.current.onclose = () => console.log("WebSocket disconnected");

      statusIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${API_URL}/capture-status`);
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            if (status.complete) stopCapture();
          }
        } catch (err) {
          console.error("Status check error:", err);
          setError("Failed to check capture status");
        }
      }, 5000);
    } catch (err) {
      console.error("Error starting capture:", err);
      setError(err.message || "Failed to start packet capture");
      setIsCapturing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const transformPacketData = (featuresData) => {
    console.log("Transforming packet data:", featuresData); // Log input data
    return {
      src_ip:
        featuresData.src_ip || "192.168.1." + Math.floor(Math.random() * 255),
      src_port: featuresData["Source Port"] || Math.floor(Math.random() * 65535),
      dst_ip: featuresData.dst_ip || "10.0.0." + Math.floor(Math.random() * 255),
      dst_port: featuresData["Destination Port"] || 80,
      protocol: featuresData.protocol || "TCP",
      length:
        featuresData["Total Length of Fwd Packets"] ||
        Math.floor(Math.random() * 1500) + 40,
      flags:
        featuresData["SYN Flag Count"] > 0
          ? "SYN"
          : featuresData["ACK Flag Count"] > 0
          ? "ACK"
          : featuresData["FIN Flag Count"] > 0
          ? "FIN"
          : "NONE",
      ttl: Math.floor(Math.random() * 64) + 1,
    };
  };

  const stopCapture = () => {
    setIsCapturing(false);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  const downloadCSV = () => {
    if (processedPackets.length === 0) return;
    const csvHeader = Object.keys(processedPackets[0]).join(",") + "\n";
    const csvRows = processedPackets
      .map((packet) =>
        Object.values(packet)
          .map((val) => (val === null ? "" : String(val).replace(/,/g, ";")))
          .join(",")
      )
      .join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cicids_processed_packets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

// required packages
// npm install jspdf 
const exportLogs = () => {
  if (processedPackets.length === 0) return;
  
  try {
    // Create new PDF document (portrait orientation since we don't need as much space now)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Define colors for different attack types
    const attackColors = {
      "Benign Traffic": [75, 192, 192],  // Teal
      "DoS Attacks": [255, 99, 132],     // Red
      "DDoS": [255, 99, 132],            // Red
      "Port Scanning": [255, 159, 64],   // Orange
      "Brute Force": [153, 102, 255],    // Purple
      "Other Exploits & Infiltrations": [201, 203, 207], // Grey
      "Unknown": [150, 150, 150]         // Light Grey
    };
    
    // Default color for unlisted attack types
    const defaultColor = [255, 159, 64]; // Orange
    
    // Add header with improved styling
    doc.setFillColor(40, 45, 55);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Network Packet Analysis Report", 14, 16);
    
    // Add timestamp
    const currentDate = new Date().toLocaleString();
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${currentDate}`, doc.internal.pageSize.getWidth() - 70, 16);
    
    // Generate attack statistics
    const attackStats = {};
    processedPackets.forEach(packet => {
      const classification = packet.classification || "Unknown";
      if (attackStats[classification]) {
        attackStats[classification]++;
      } else {
        attackStats[classification] = 1;
      }
    });
    
    // Create summary section with better spacing
    const summaryStartY = 35;
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Analysis Summary", 14, summaryStartY);
    
    // Add horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, summaryStartY + 3, doc.internal.pageSize.getWidth() - 14, summaryStartY + 3);
    
    // Add packet count information
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total packets processed: ${processedPackets.length}`, 14, summaryStartY + 10);
    
    // Add analysis date range if available
    if (processedPackets.length > 0) {
      const firstPacketTime = processedPackets[processedPackets.length - 1].timestamp;
      const lastPacketTime = processedPackets[0].timestamp;
      if (firstPacketTime && lastPacketTime) {
        doc.text(`Analysis period: ${firstPacketTime} - ${lastPacketTime}`, 14, summaryStartY + 18);
      }
    }
    
    // Draw summary table header with rounded corners
    const tableStartY = summaryStartY + 25;
    doc.setFillColor(50, 55, 70);
    doc.roundedRect(14, tableStartY, 180, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("Attack Type", 20, tableStartY + 6.5);
    doc.text("Count", 120, tableStartY + 6.5);
    doc.text("Percentage", 150, tableStartY + 6.5);
    
    // Draw summary table rows
    let rowY = tableStartY + 10;
    doc.setTextColor(40, 40, 40);
    
    // Prepare data for summary
    const attackEntries = Object.entries(attackStats);
    const totalPackets = processedPackets.length;
    
    // Sort entries by count in descending order
    attackEntries.sort((a, b) => b[1] - a[1]);
    
    attackEntries.forEach(([type, count], index) => {
      const percentage = ((count / totalPackets) * 100).toFixed(2);
      rowY += 10;
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(14, rowY - 7, 180, 10, 1, 1, 'F');
      }
      
      // Get color for this attack type
      const color = attackColors[type] || defaultColor;
      
      // Draw a colored square for the attack type
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(20, rowY - 4, 4, 4, 'F');
      
      // Draw text with colored indicator
      doc.setFontSize(11);
      doc.text(type, 28, rowY);
      doc.text(count.toString(), 120, rowY);
      doc.text(`${percentage}%`, 150, rowY);
    });
    
    // Add network security insights section
    const insightsY = rowY + 20;
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Network Security Insights", 14, insightsY);
    
    // Add horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, insightsY + 3, doc.internal.pageSize.getWidth() - 14, insightsY + 3);
    
    // Add insights content
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    let insightTextY = insightsY + 12;
    
    // Finding the most common attack type
    let mostCommonAttack = "None";
    let highestCount = 0;
    let percentageHighest = 0;
    
    attackEntries.forEach(([type, count]) => {
      if (type !== "Benign Traffic" && count > highestCount) {
        mostCommonAttack = type;
        highestCount = count;
        percentageHighest = ((count / totalPackets) * 100).toFixed(2);
      }
    });
    
    // Calculate benign traffic percentage
    const benignCount = attackStats["Benign Traffic"] || 0;
    const benignPercentage = ((benignCount / totalPackets) * 100).toFixed(2);
    
    // Add insight points
    if (mostCommonAttack !== "None" && highestCount > 0) {
      doc.text(`• Most prevalent attack detected: ${mostCommonAttack} (${percentageHighest}% of traffic)`, 18, insightTextY);
      insightTextY += 8;
    }
    
    doc.text(`• Clean traffic: ${benignPercentage}% of network packets analyzed were classified as benign`, 18, insightTextY);
    insightTextY += 8;
    
    // Add recommendation based on attack profile
    doc.text(`• System recommendation: ${getSecurityRecommendation(attackEntries, benignPercentage)}`, 18, insightTextY);
    insightTextY += 16;
    
    // Add recommendations section
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Security Recommendations", 14, insightTextY);
    
    // Add horizontal line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, insightTextY + 3, doc.internal.pageSize.getWidth() - 14, insightTextY + 3);
    
    // Add recommendations based on detected attacks
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    let recY = insightTextY + 12;
    
    // Generate recommendations based on attack types
    const recommendationPoints = generateRecommendations(attackStats);
    recommendationPoints.forEach((rec, index) => {
      if (index < 5) { // Limit to 5 recommendations to fit on page
        doc.text(`${index + 1}. ${rec}`, 18, recY);
        recY += 8;
      }
    });
    
    // Add footer with gradient background
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFillColor(245, 245, 245);
    doc.rect(0, footerY - 5, doc.internal.pageSize.getWidth(), 17, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Network Security Report - NetGuard v1.0",
      14,
      footerY
    );
    
    doc.text(
      "Page 1",
      doc.internal.pageSize.getWidth() - 20,
      footerY
    );
    
    // Save the PDF
    doc.save("network_security_summary.pdf");
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("Failed to generate PDF. See console for details.");
  }
};

// Helper function to generate security recommendation based on attack profile
function getSecurityRecommendation(attackEntries, benignPercentage) {
  if (benignPercentage > 95) {
    return "Continue monitoring. Current security measures appear effective.";
  } else if (benignPercentage < 70) {
    return "URGENT: Implement immediate security measures.";
  } else {
    // Find most common attack
    const [mostCommonAttack] = attackEntries.find(([type]) => type !== "Benign Traffic") || ["Unknown"];
    
    if (mostCommonAttack.includes("DoS") || mostCommonAttack.includes("DDoS")) {
      return "Implement rate limiting and traffic filtering to mitigate DoS/DDoS attacks.";
    } else if (mostCommonAttack.includes("Port")) {
      return "Review firewall rules and close unnecessary ports to prevent scanning.";
    } else if (mostCommonAttack.includes("Brute")) {
      return "Enforce strong password policies and implement account lockout mechanisms.";
    } else {
      return "Review security measures and consider enhancing network monitoring.";
    }
  }
}

// Helper function to generate recommendations based on attack types
function generateRecommendations(attackStats) {
  const recommendations = [
    "Implement regular security audits and vulnerability assessments",
    "Ensure all network devices and software are updated with the latest security patches"
  ];
  
  // Attack-specific recommendations
  if (attackStats["DoS Attacks"] || attackStats["DDoS"]) {
    recommendations.push("Deploy traffic filtering solutions and consider DDoS protection services");
    recommendations.push("Implement rate limiting on public-facing services");
  }
  
  if (attackStats["Port Scanning"]) {
    recommendations.push("Review and restrict open ports on your network perimeter");
    recommendations.push("Configure intrusion detection systems to alert on scanning activities");
  }
  
  if (attackStats["Brute Force"]) {
    recommendations.push("Implement account lockout policies and multi-factor authentication");
    recommendations.push("Use strong password policies and consider password management solutions");
  }
  
  if (attackStats["Other Exploits & Infiltrations"]) {
    recommendations.push("Conduct thorough application security testing");
    recommendations.push("Consider implementing a web application firewall (WAF)");
  }
  
  // Always include these general recommendations
  recommendations.push("Maintain comprehensive logging and monitoring of network activities");
  recommendations.push("Develop and regularly test incident response procedures");
  recommendations.push("Provide security awareness training to all staff members");
  
  return recommendations;
}

  const clearPackets = () => {
    setPackets([]);
    setProcessedPackets([]);
    setCurrentAttack("Benign Traffic");
    setCsvUploaded(false);
    setUploadedFileName("");
  };

  const handleCSVDataLoaded = (data, fileName) => {
    setPackets(data);
    setProcessedPackets(data);
    setCsvUploaded(true);
    setUploadedFileName(fileName);

    let attackCategory = "Benign Traffic";
    data.forEach((packet) => {
      const prediction = packet.classification;
      if (prediction && prediction !== "Benign Traffic") {
        attackCategory = prediction;
      }
    });
    setCurrentAttack(attackCategory);
  };

  // Shared controls for data management
  const renderSharedControls = () => (
    <div className="flex flex-wrap gap-4 mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex flex-wrap items-center gap-4 w-full">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-200">Data Management</h3>
          {csvUploaded && (
            <div className="text-sm text-gray-400 mt-1">
              Current data: <span className="text-blue-400">{uploadedFileName}</span>
            </div>
          )}
          {isCapturing && (
            <div className="flex items-center mt-1">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-400 text-sm font-medium">LIVE CAPTURE</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadCSV}
            disabled={processedPackets.length === 0 || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:bg-purple-800 disabled:opacity-60 flex items-center transition-all"
          >
            <Download size={18} className="mr-2" />
            Download CSV
          </button>

          <button
            onClick={exportLogs}
            disabled={processedPackets.length === 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-800 disabled:opacity-60 flex items-center transition-all"
          >
            <FileText size={18} className="mr-2" />
            Export Logs
          </button>

          <button
            onClick={clearPackets}
            disabled={processedPackets.length === 0 || isLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md disabled:bg-gray-700 disabled:opacity-60 flex items-center transition-all"
          >
            <Trash2 size={18} className="mr-2" />
            Reset Data
          </button>
        </div>
      </div>
      
      {processedPackets.length > 0 && (
        <div className="w-full mt-2 text-sm text-gray-400">
          {processedPackets.length} packets available for analysis
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header 
        
      />
      <main className="container mx-auto flex-grow p-4">
        <div className="mb-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-100">
            Network Packet Analysis
          </h2>

          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "capture"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("capture")}
            >
              Live Capture
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "upload"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              Upload CSV
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 rounded-md mb-4">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {activeTab === "capture" ? (
            <PacketControls
              startContinuousCapture={startContinuousCapture}
              stopCapture={stopCapture}
              isLoading={isLoading}
              isCapturing={isCapturing}
              packets={packets}
            />
          ) : (
            <CSVUpload
              onDataLoaded={handleCSVDataLoaded}
              setIsLoading={setIsLoading}
              setError={setError}
              apiUrl={API_URL}
              clearPackets={clearPackets}
            />
          )}

          {/* Shared controls for both modes */}
          {processedPackets.length > 0 && renderSharedControls()}

          {/* Data visualizations */}
          <AttackVisualizations processedPackets={processedPackets} />
          <PacketAnalyzerTable
            packets={packets}
            processedPackets={processedPackets}
            isCapturing={isCapturing}
            currentAttack={currentAttack}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;