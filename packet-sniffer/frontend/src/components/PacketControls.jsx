import { Activity, Download, StopCircle, Trash2, RefreshCw } from "lucide-react";

const PacketControls = ({ 
  capturePackets, 
  startContinuousCapture, 
  stopCapture,
  downloadCSV, 
  clearPackets,
  isLoading, 
  isCapturing,
  packets, 
  captureMode,
  setCaptureMode
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <button
        onClick={() => {
          clearPackets(); // Clear existing packets first
          capturePackets();
        }}
        disabled={isLoading || isCapturing}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-800 disabled:opacity-60 flex items-center transition-all"
      >
        <Activity size={18} className={`mr-2 ${isLoading ? "animate-pulse" : ""}`} />
        {isLoading ? (
          <span className="flex items-center">
            Capturing
            <span className="ml-1 flex space-x-1">
              <span className="animate-bounce delay-0 inline-block w-1 h-1 bg-white rounded-full"></span>
              <span className="animate-bounce delay-100 inline-block w-1 h-1 bg-white rounded-full"></span>
              <span className="animate-bounce delay-200 inline-block w-1 h-1 bg-white rounded-full"></span>
            </span>
          </span>
        ) : (
          "Capture Single Packet"
        )}
      </button>

      {!isCapturing ? (
        <button
          onClick={startContinuousCapture}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-green-800 disabled:opacity-60 flex items-center transition-all"
        >
          <RefreshCw size={18} className="mr-2" />
          Start Real-time Capture
        </button>
      ) : (
        <button
          onClick={stopCapture}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center transition-all"
        >
          <StopCircle size={18} className="mr-2" />
          Stop Capture
        </button>
      )}

      <button
        onClick={downloadCSV}
        disabled={packets.length === 0 || isLoading}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:bg-purple-800 disabled:opacity-60 flex items-center transition-all"
      >
        <Download size={18} className="mr-2" />
        Download CSV
      </button>

      <button
        onClick={clearPackets}
        disabled={packets.length === 0 || isLoading}
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md disabled:bg-gray-700 disabled:opacity-60 flex items-center transition-all"
      >
        <Trash2 size={18} className="mr-2" />
        Clear Data
      </button>
    </div>

    {isCapturing && (
      <div className="bg-gray-700 p-3 rounded-md mb-4">
        <p className="text-sm font-medium mb-2">Capture Mode</p>
        <div className="flex space-x-4">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              className="form-radio text-blue-500"
              name="captureMode"
              value="continuous"
              checked={captureMode === "continuous"}
              onChange={() => setCaptureMode("continuous")}
            />
            <span className="ml-2 text-sm">Real-time (1 packet/sec)</span>
          </label>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              className="form-radio text-blue-500"
              name="captureMode"
              value="batch"
              checked={captureMode === "batch"}
              onChange={() => setCaptureMode("batch")}
            />
            <span className="ml-2 text-sm">Batch (5 packets/5 sec)</span>
          </label>
        </div>
      </div>
    )}

    {packets.length > 0 && (
      <div className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
        <span className="text-blue-400 font-medium">
          {packets.length} packets captured
        </span>
        
        {isCapturing && (
          <div className="flex items-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-400 text-sm font-medium">LIVE CAPTURE</span>
          </div>
        )}
      </div>
    )}
  </div>
);

export default PacketControls;