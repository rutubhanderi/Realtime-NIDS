import { useState } from "react";
import { Activity, LogOut, FileInput, Database, Settings } from "lucide-react";


const Header = ({ isAuthenticated, handleLogout, startCapture, isCapturing }) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3">
            <Activity className="text-blue-400" size={28} />
            <div>
              <h1 className="text-xl font-bold text-white">NIDS</h1>
              <p className="text-xs text-gray-400">Anamoly based Network Intrusion Detection</p>
            </div>
          </div>

          {isAuthenticated && (
            <nav className="flex items-center space-x-6">
              <a 
                href="#dashboard" 
                className={`text-gray-300 hover:text-white border-b-2 pb-1 ${
                  activeTab === "dashboard" ? "border-blue-500 text-white" : "border-transparent"
                }`}
                onClick={() => setActiveTab("dashboard")}
              >
                <span className="flex items-center">
                  <Database size={14} className="mr-1" /> Dashboard
                </span>
              </a>
              <a 
                href="#capture" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab("capture");
                  if (!isCapturing) startCapture();
                }}
                className={`text-gray-300 hover:text-white border-b-2 pb-1 ${
                  activeTab === "capture" 
                    ? "border-blue-500 text-white" 
                    : "border-transparent"
                } ${
                  isCapturing ? "animate-pulse text-green-400" : ""
                }`}
              >
                <span className="flex items-center">
                  <Activity size={14} className={`mr-1 ${isCapturing ? "animate-pulse" : ""}`} /> 
                  {isCapturing ? "Capturing..." : "Capture"}
                </span>
              </a>
              <a 
                href="#demo" 
                className={`text-gray-300 hover:text-white border-b-2 pb-1 ${
                  activeTab === "demo" ? "border-blue-500 text-white" : "border-transparent"
                }`}
                onClick={() => setActiveTab("demo")}
              >
                <span className="flex items-center">
                  <FileInput size={14} className="mr-1" /> Demo
                </span>
              </a>
              <a 
                href="#settings" 
                className={`text-gray-300 hover:text-white border-b-2 pb-1 ${
                  activeTab === "settings" ? "border-blue-500 text-white" : "border-transparent"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                <span className="flex items-center">
                  <Settings size={14} className="mr-1" /> Settings
                </span>
              </a>
              <button 
                onClick={handleLogout} 
                className="flex items-center text-gray-300 hover:text-white ml-4"
              >
                <LogOut size={16} className="mr-1" /> Logout
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;