import { RefreshCw, StopCircle } from "lucide-react";

const PacketControls = ({ 
  startContinuousCapture, 
  stopCapture,
  isLoading, 
  isCapturing,
  packets
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-4">
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
        
        <div className="text-sm text-gray-400">
          Click to start real-time network traffic capture and analysis.
        </div>
      </div>
    </div>
  );
};

export default PacketControls;