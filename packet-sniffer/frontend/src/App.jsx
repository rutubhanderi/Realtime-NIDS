import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginForm from "./components/LoginForm";
import PacketControls from "./components/PacketControls";
import VerticalPacketCarousel from "./components/VerticalPacketCarousel";
import ProcessedPacketsTable from "./components/ProcessedPacketsTable";

function App() {
  const [packets, setPackets] = useState([]);
  const [processedPackets, setProcessedPackets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [captureMode, setCaptureMode] = useState("single");
  const [currentAttack, setCurrentAttack] = useState("Benign Traffic");
  const captureIntervalRef = useRef(null);

  // API endpoint
  const API_URL = "http://localhost:8000"; 

  // CICIDS label mapping
  const cicidsLabels = [
    'BENIGN',
    'DoS Hulk',
    'DoS GoldenEye',
    'DoS slowloris',
    'DoS Slowhttptest',
    'DDoS',
    'PortScan',
    'FTP-Patator',
    'SSH-Patator',
    'Web Attack – Brute Force',
    'Web Attack – XSS',
    'Web Attack – Sql Injection',
    'Bot',
    'Infiltration',
    'Heartbleed'
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setIsAuthenticated(true);
      setUsername(savedUser);
    }
    
    // Clean up interval on component unmount
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) return setLoginError("Username is required");
    if (password.length < 6) return setLoginError("Password must be at least 6 characters");
    setIsAuthenticated(true);
    setLoginError("");
    localStorage.setItem("user", username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    localStorage.removeItem("user");
    setPackets([]);
    setProcessedPackets([]);
    stopCapture();
  };

  // Update processed packets handler
  const updateProcessedPackets = (newProcessedPackets) => {
    setProcessedPackets(prev => [...newProcessedPackets, ...prev]);
  };

  const capturePackets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch real packet data from the FastAPI backend
      const response = await fetch(`${API_URL}/capture`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const capturedFeatures = await response.json();
      
      // Transform the packet features into our packet format
      const packetData = transformPacketData(capturedFeatures);
      
      // Randomly select a CICIDS label for demonstration
      // In a real system, this would come from a ML model
      const randomLabel = cicidsLabels[Math.floor(Math.random() * cicidsLabels.length)];
      
      // Map the label to a category for UI display
      let attackCategory = "Benign Traffic";
      if (randomLabel !== 'BENIGN') {
        if (randomLabel.startsWith('DoS') || randomLabel === 'DDoS') {
          attackCategory = "DoS/DDoS Attacks";
        } else if (randomLabel === 'PortScan' || randomLabel.includes('Patator')) {
          attackCategory = "Port Scanning & Brute Force";
        } else if (randomLabel.startsWith('Web Attack')) {
          attackCategory = "Web-Based Attacks";
        } else {
          attackCategory = "Other Exploits & Infiltrations";
        }
      }
      
      // Update the current attack type
      setCurrentAttack(attackCategory);
      
      // Add to packets
      setPackets(prev => [packetData, ...prev]);
      
      // Add to processed packets after simulated processing
      setTimeout(() => {
        setProcessedPackets(prev => [{
          ...packetData,
          timestamp: new Date().toLocaleTimeString(),
          classification: randomLabel
        }, ...prev]);
      }, 5000); // After simulated 5-second processing
      
    } catch (err) {
      console.error("Error capturing packets:", err);
      setError(err.message || "Failed to capture network packets");
    } finally {
      setIsLoading(false);
    }
  };

  // Transform packet features from backend format to our UI format
  const transformPacketData = (featuresData) => {
    // In a real implementation, this would parse the CICIDS features
    // For now, we'll create a simplified version that maps to our UI needs
    
    // If we received multiple packets, just use the first one
    const features = Array.isArray(featuresData) ? featuresData[0] : featuresData;
    
    // Extract IP information from features
    // This is simplified - in a real implementation we'd actually extract this from the packet data
    return {
      src_ip: features.src_ip || "192.168.1." + Math.floor(Math.random() * 255),
      src_port: features["Destination Port"] || Math.floor(Math.random() * 65535),
      dst_ip: features.dst_ip || "10.0.0." + Math.floor(Math.random() * 255),
      dst_port: features["Destination Port"] || 80,
      protocol: features.protocol || "TCP",
      length: features["Total Length of Fwd Packets"] || Math.floor(Math.random() * 1500) + 40,
      flags: features["SYN Flag Count"] > 0 ? "SYN" : 
             features["ACK Flag Count"] > 0 ? "ACK" : 
             features["FIN Flag Count"] > 0 ? "FIN" : "NONE",
      ttl: Math.floor(Math.random() * 64) + 1 // TTL isn't included in CICIDS, so randomize
    };
  };

  const startContinuousCapture = () => {
    // Clear existing packets when starting capture
    setPackets([]);
    setProcessedPackets([]);
    setCurrentAttack("Benign Traffic");
    
    setIsCapturing(true);
    
    // Clear any existing intervals first
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    
    // Immediately capture once
    capturePackets();
    
    // Then set up interval based on mode
    if (captureMode === "continuous") {
      // Real-time mode captures every second
      captureIntervalRef.current = setInterval(capturePackets, 1000);
    } else if (captureMode === "batch") {
      // Batch mode captures 5 packets every 5 seconds
      captureIntervalRef.current = setInterval(async () => {
        for (let i = 0; i < 5; i++) {
          await capturePackets();
        }
      }, 5000);
    }
  };

  const stopCapture = () => {
    setIsCapturing(false);
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
  };

  const downloadCSV = () => {
    if (processedPackets.length === 0) return;
    const csvHeader = Object.keys(processedPackets[0]).join(",") + "\n";
    const csvRows = processedPackets.map(packet =>
      Object.values(packet).map(val => val === null ? "" : String(val).replace(/,/g, ";")).join(",")
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cicids_processed_packets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearPackets = () => {
    setPackets([]);
    setProcessedPackets([]);
    setCurrentAttack("Benign Traffic");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header 
        isAuthenticated={isAuthenticated} 
        handleLogout={handleLogout}
        startCapture={startContinuousCapture}
        isCapturing={isCapturing}
      />
      <main className="container mx-auto flex-grow p-4">
        {!isAuthenticated ? (
          <LoginForm
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loginError={loginError}
            handleLogin={handleLogin}
          />
        ) : (
          <>
            <div className="mb-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-100">
                Network Packet Capture & CICIDS Analysis
              </h2>
              {error && (
                <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 rounded-md mb-4">
                  <p className="font-medium">Error capturing packets:</p>
                  <p>{error}</p>
                </div>
              )}
              <PacketControls
                capturePackets={capturePackets}
                startContinuousCapture={startContinuousCapture}
                stopCapture={stopCapture}
                downloadCSV={downloadCSV}
                clearPackets={clearPackets}
                isLoading={isLoading}
                isCapturing={isCapturing}
                packets={packets}
                captureMode={captureMode}
                setCaptureMode={setCaptureMode}
              />
              
              {/* Vertical Packet Processing Carousel */}
              <VerticalPacketCarousel 
                packets={packets}
                isCapturing={isCapturing}
                currentAttack={currentAttack}
                updateProcessedPackets={updateProcessedPackets}
              />
              
              {/* Processed Packets Results Table */}
              <ProcessedPacketsTable 
                processedPackets={processedPackets}
              />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;