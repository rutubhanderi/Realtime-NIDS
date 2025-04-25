import { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

const CSVUpload = ({ onDataLoaded, setIsLoading, setError, apiUrl, clearPackets }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsLoading(true);
    setFileError("");
    setFileName(file.name);
    setUploadSuccess(false);
    
    // Check file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Please upload a CSV file.");
      setIsLoading(false);
      return;
    }
    
    try {
      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append("file", file);
      
      // Send file to backend for prediction
      const response = await fetch(`${apiUrl}/predict-csv`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const predictedData = await response.json();
      
      if (predictedData.length === 0) {
        setFileError("No valid data returned from prediction.");
        setIsLoading(false);
        return;
      }
      
      // Send predicted data to parent component
      onDataLoaded(predictedData, file.name);
      setUploadSuccess(true);
    } catch (error) {
      console.error("Error processing CSV:", error);
      setFileError(error.message || "Could not process CSV file.");
      setError("CSV processing error: " + error.message);
    } finally {
      setIsLoading(false);
    }
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

  const handleReset = () => {
    setFileName("");
    setFileError("");
    setUploadSuccess(false);
    clearPackets();
  };

  const renderUploadForm = () => (
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
        
        {fileName && !uploadSuccess && (
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
  );

  const renderUploadSuccess = () => (
    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 text-center">
      <div className="flex flex-col items-center space-y-3">
        <div className="p-3 bg-green-800 rounded-full">
          <CheckCircle size={24} className="text-green-400" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-green-400">Upload Successful</h3>
          <p className="text-sm text-green-300 mt-1">
            {fileName} has been successfully processed
          </p>
        </div>
        
        <div className="flex gap-3">
          
          
          <button
            onClick={handleReset}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-200">Upload Network Traffic Data</h3>
      </div>
      
      {uploadSuccess ? renderUploadSuccess() : renderUploadForm()}
    </div>
  );
};

export default CSVUpload;