import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";

const CSVUpload = ({ onDataLoaded, setIsLoading, setError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processCSVData = (text) => {
    try {
      // Split the CSV text into lines
      const lines = text.trim().split("\n");
      
      // Parse header line to get column names
      const headers = lines[0].split(",").map(header => header.trim());
      
      // Process each data row
      const processedData = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Split by comma but handle quoted values properly
        const values = line.split(",").map(val => val.trim());
        
        // Create object from headers and values
        const packet = {};
        
        for (let j = 0; j < headers.length; j++) {
          // Handle potential value type conversion
          const value = values[j];
          packet[headers[j]] = value;
        }
        
        // Create standard format expected by the app
        const standardizedPacket = {
          src_ip: packet.src_ip || packet.source_ip || "192.168.1.1",
          src_port: packet.src_port || packet.source_port || "0",
          dst_ip: packet.dst_ip || packet.destination_ip || "192.168.1.2",
          dst_port: packet.dst_port || packet.destination_port || "0",
          protocol: packet.protocol || "TCP",
          length: packet.length || packet["Total Length of Fwd Packets"] || "0",
          flags: packet.flags || (
            packet["SYN Flag Count"] > 0 ? "SYN" : 
            packet["ACK Flag Count"] > 0 ? "ACK" : 
            packet["FIN Flag Count"] > 0 ? "FIN" : "NONE"
          ),
          ttl: packet.ttl || "64",
          timestamp: packet.timestamp || new Date().toLocaleTimeString(),
          classification: packet.classification || 
                         packet.prediction || 
                         packet.label ||
                         packet.Predicted_Label || "BENIGN"
        };
        
        processedData.push(standardizedPacket);
      }
      
      return processedData;
    } catch (error) {
      console.error("Error processing CSV:", error);
      throw new Error("Could not process CSV data. Please check the file format.");
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    
    setIsLoading(true);
    setFileError("");
    setFileName(file.name);
    
    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please upload a CSV file.");
      setIsLoading(false);
      return;
    }
    
    // Read the file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        const processedData = processCSVData(fileContent);
        
        if (processedData.length === 0) {
          setFileError("No valid data found in the CSV file.");
          setIsLoading(false);
          return;
        }
        
        // Send data to parent component
        onDataLoaded(processedData);
      } catch (error) {
        setFileError(error.message);
        setError("CSV parsing error: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setFileError("Failed to read file.");
      setError("Failed to read CSV file");
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-gray-200 mb-3">Upload Network Traffic Data</h3>
      
      <div
        className={`border-2 border-dashed p-6 rounded-lg text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-900/20" : "border-gray-600 hover:border-gray-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-gray-700 rounded-full">
            <Upload size={24} className="text-blue-400" />
          </div>
          
          <div className="space-y-2">
            <p className="text-gray-300">
              Drag and drop a CSV file, or{" "}
              <button
                onClick={handleButtonClick}
                className="text-blue-400 hover:text-blue-300 underline focus:outline-none"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Supported format: CSV with network packet data
            </p>
          </div>
          
          {fileName && (
            <div className="flex items-center space-x-2 bg-gray-700 py-2 px-3 rounded">
              <FileText size={16} className="text-blue-400" />
              <span className="text-sm text-gray-300">{fileName}</span>
            </div>
          )}
          
          {fileError && (
            <div className="flex items-center space-x-2 bg-red-900/30 text-red-400 border border-red-800 p-2 rounded">
              <AlertCircle size={16} />
              <span className="text-sm">{fileError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVUpload;