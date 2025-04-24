import { Download, StopCircle, Trash2, RefreshCw, FileText } from "lucide-react";

const PacketControls = ({ 
  startContinuousCapture, 
  stopCapture,
  downloadCSV, 
  clearPackets,
  isLoading, 
  isCapturing,
  packets,
  processedPackets
}) => {
  const exportLogs = () => {
    if (processedPackets.length === 0) return;
    const logContent = processedPackets.map(packet => 
      `Timestamp: ${packet.timestamp}, Source IP: ${packet.src_ip}, Destination IP: ${packet.dst_ip}, Protocol: ${packet.protocol}, Length: ${packet.length}, Classification: ${packet.classification ?? "Unknown"}`
    ).join("\n");
    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "packet_logs.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {!isCapturing ? (
          <button
            onClick={startContinuousCapture}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:bg-green-800 disabled:opacity-60 flex items-center transition-all"
          >
            <RefreshCw size={18} className={`mr-2 ${isLoading ? "animate-pulse" : ""}`} />
            {isLoading ? (
              <span className="flex items-center">
                Starting Capture
                <span className="ml-1 flex space-x-1">
                  <span className="animate-bounce delay-0 inline-block w-1 h-1 bg-white rounded-full"></span>
                  <span className="animate-bounce delay-100 inline-block w-1 h-1 bg-white rounded-full"></span>
                  <span className="animate-bounce delay-200 inline-block w-1 h-1 bg-white rounded-full"></span>
                </span>
              </span>
            ) : (
              "Start Real-time Capture"
            )}
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
          onClick={exportLogs}
          disabled={processedPackets.length === 0 || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-800 disabled:opacity-60 flex items-center transition-all"
        >
          <FileText size={18} className="mr-2" />
          Export Logs
        </button>

        <button
          onClick={clearPackets}
          disabled={packets.length === 0 || isLoading}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md disabled:bg-gray-700 disabled:opacity-60 flex items-center transition-all"
        >
          <Trash2 size={18} className="mr-2" />
          Reset Data
        </button>
      </div>

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
};

export default PacketControls;  