import { useState, useEffect, useRef } from "react";
import { ArrowUp, ArrowDown, Activity } from "lucide-react";

const VerticalPacketCarousel = ({ packets, isCapturing, updateProcessedPackets }) => {
  const [activePacketIndex, setActivePacketIndex] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedPackets, setProcessedPackets] = useState([]);
  const processingTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(processingTimerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, []);

  // Start processing packets on capture
  useEffect(() => {
    if (isCapturing && packets.length > 0) {
      let index = 0;
      clearInterval(processingTimerRef.current);
      clearInterval(progressTimerRef.current);

      // Start processing each packet every 5 seconds
      processingTimerRef.current = setInterval(() => {
        if (index >= packets.length) {
          index = 0;
        }

        setActivePacketIndex(index);
        setProcessingProgress(0);
        startProgressAnimation(index);
        index++;
      }, 5000);

      startProgressAnimation(index);
    } else {
      clearInterval(processingTimerRef.current);
      clearInterval(progressTimerRef.current);
    }

    return () => {
      clearInterval(processingTimerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [isCapturing, packets]);

  // Animate progress bar
  const startProgressAnimation = (index) => {
    clearInterval(progressTimerRef.current);
    setProcessingProgress(0);

    const updateInterval = 50;
    const totalDuration = 5000;
    const incrementPerInterval = 100 / (totalDuration / updateInterval);

    progressTimerRef.current = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + incrementPerInterval;
        if (newProgress >= 100) {
          clearInterval(progressTimerRef.current);
          processPacketWithAPI(packets[index]);
          return 100;
        }
        return newProgress;
      });
    }, updateInterval);
  };

  // Send packet to API and update processed list
  const processPacketWithAPI = async (packet) => {
    try {
      const response = await fetch('/api/analyze-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();

      const newProcessed = {
        ...packet,
        timestamp: new Date().toLocaleTimeString(),
        classification: result.classification
      };

      // Add new processed packet to the list and limit to 50 items
      setProcessedPackets((prev) => {
        const updatedProcessed = [newProcessed, ...prev];
        updateProcessedPackets(updatedProcessed); // Update parent component
        return updatedProcessed.slice(0, 50); // Limit to the most recent 50 packets
      });
    } catch (error) {
      console.error("Error processing packet:", error);
      const fallback = {
        ...packet,
        timestamp: new Date().toLocaleTimeString(),
        classification: "API Error - Classification Failed"
      };

      setProcessedPackets((prev) => {
        const updatedProcessed = [fallback, ...prev];
        updateProcessedPackets(updatedProcessed); // Update parent component
        return updatedProcessed.slice(0, 50); // Limit to the most recent 50 packets
      });
    }
  };

  const handleScrollUp = () => {
    setActivePacketIndex((prev) => Math.max(0, prev - 1));
  };

  const handleScrollDown = () => {
    setActivePacketIndex((prev) => Math.min(packets.length - 1, prev + 1));
  };

  const currentPacket = packets[activePacketIndex] || {};
  const matchedProcessedPacket = processedPackets.find(p =>
    p.src_ip === currentPacket.src_ip &&
    p.dst_ip === currentPacket.dst_ip &&
    p.length === currentPacket.length &&
    p.protocol === currentPacket.protocol
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-4 border border-gray-700">
      <h3 className="text-lg font-bold mb-4 text-gray-200">Packet Processing</h3>
      <div className="flex space-x-4">
        {/* Packet List */}

        {/* Progress & Details */}
        <div className="w-3/4 bg-gray-900 rounded-lg p-4">
          <h4 className="text-gray-300 font-medium mb-4">Packet Analysis Progress</h4>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Processing packet</span>
              <span>{processingProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-center mt-2">
              {processingProgress < 100 ? (
                <><Activity size={20} className="animate-pulse text-blue-400" /><span className="ml-2 text-sm text-blue-400">Analyzing packet...</span></>
              ) : (
                <span className="text-sm text-green-400">Analysis complete</span>
              )}
            </div>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default VerticalPacketCarousel;
