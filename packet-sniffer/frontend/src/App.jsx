import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginForm from "./components/LoginForm";
import PacketControls from "./components/PacketControls";
import PacketAnalyzerTable from "./components/PacketAnalyzerTable";
import AttackVisualizations from "./components/AttackVisualizations";
import CSVUpload from "./components/CSVUpload";

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
  const [currentAttack, setCurrentAttack] = useState("Benign Traffic");
  const [activeTab, setActiveTab] = useState("capture"); // 'capture' or 'upload'
  const wsRef = useRef(null);
  const statusIntervalRef = useRef(null);

  const API_URL = "http://localhost:8000";
  const WS_URL = "ws://localhost:8000/ws/packets";
  
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setIsAuthenticated(true);
      setUsername(savedUser);
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) return setLoginError("Username is required");
    if (password.length < 6)
      return setLoginError("Password must be at least 6 characters");
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

  const startContinuousCapture = async () => {
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

  const clearPackets = () => {
    setPackets([]);
    setProcessedPackets([]);
    setCurrentAttack("Benign Traffic");
  };

  const handleCSVDataLoaded = (data) => {
    setPackets(data);
    setProcessedPackets(data);

    let attackCategory = "Benign Traffic";
    data.forEach((packet) => {
      const prediction = packet.classification;
      if (prediction && prediction !== "Benign Traffic") {
        attackCategory = prediction;
      }
    });
    setCurrentAttack(attackCategory);
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
                  downloadCSV={downloadCSV}
                  clearPackets={clearPackets}
                  isLoading={isLoading}
                  isCapturing={isCapturing}
                  packets={packets}
                  processedPackets={processedPackets}
                />
              ) : (
                <CSVUpload
                  onDataLoaded={handleCSVDataLoaded}
                  setIsLoading={setIsLoading}
                  setError={setError}
                  apiUrl={API_URL}
                />
              )}

              <AttackVisualizations processedPackets={processedPackets} />
              <PacketAnalyzerTable
                packets={packets}
                processedPackets={processedPackets}
                isCapturing={isCapturing}
                currentAttack={currentAttack}
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