import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, Filter, Shield, AlertTriangle } from "lucide-react";

const PacketAnalyzerTable = ({ packets, processedPackets, isCapturing, currentAttack }) => {
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc"); // newest first
  const [filterLabel, setFilterLabel] = useState("");
  const [displayedPackets, setDisplayedPackets] = useState([]);
  const prevPacketsLengthRef = useRef(processedPackets.length);

  // Re-process packets when they change
  useEffect(() => {
    if (processedPackets.length !== prevPacketsLengthRef.current) {
      const sorted = [...processedPackets].sort((a, b) => {
        let comparison = 0;
        
        if (a[sortField] > b[sortField]) {
          comparison = 1;
        } else if (a[sortField] < b[sortField]) {
          comparison = -1;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
      
      const filtered = filterLabel
        ? sorted.filter(p => p.classification && p.classification.toLowerCase().includes(filterLabel.toLowerCase()))
        : sorted;
        
      setDisplayedPackets(filtered);
      
      prevPacketsLengthRef.current = processedPackets.length;
    }
  }, [processedPackets, sortField, sortDirection, filterLabel]);

  // No packets to display
  if (processedPackets.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 my-4 border border-gray-700 text-center text-gray-400">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-4">
            <Shield size={28} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Network Traffic Captured</h3>
          <p>Start real-time packet capture to analyze network traffic with CICIDS ML model</p>
        </div>
        
        {isCapturing && (
          <div className="flex justify-center mt-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-900/30 border border-blue-500 rounded-md text-blue-400">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Listening for network traffic...
            </div>
          </div>
        )}
      </div>
    );
  }

  // Handle sort column click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Group CICIDS labels by category
  const getLabelClass = (label) => {
    if (!label) return "bg-gray-900/30 text-gray-400 border-gray-500";
    
    if (label === 'Benign Traffic') {
      return "bg-green-900/30 text-green-400 border-green-500";
    } else if (label.startsWith('DoS') || label === 'DDoS') {
      return "bg-red-900/30 text-red-400 border-red-500";
    } else if (label === 'PortScan' || label.includes('Patator')) {
      return "bg-yellow-900/30 text-yellow-400 border-yellow-500";
    } else if (label.startsWith('Web Attack')) {
      return "bg-purple-900/30 text-purple-400 border-purple-500";
    } else {
      return "bg-blue-900/30 text-blue-400 border-blue-500";
    }
  };

  // Get attack status icon
  const getAttackStatusIcon = () => {
    if (currentAttack === "Benign Traffic") {
      return (
        <div className="flex items-center bg-green-900/30 border border-green-500 text-green-400 px-3 py-2 rounded-md">
          <Shield size={18} className="mr-2" />
          <span>Normal Traffic Detected</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center bg-red-900/30 border border-red-500 text-red-400 px-3 py-2 rounded-md">
          <AlertTriangle size={18} className="mr-2" />
          <span>{currentAttack}</span>
        </div>
      );
    }
  };

  // Get unique classifications from the current packets
  const uniqueClassifications = Array.from(new Set(processedPackets.map(p => p.classification)))
    .filter(label => label); // Filter out undefined/null values

  return (
    <>
      
      <div className="bg-gray-800 rounded-lg p-6 my-4 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-200">Processed Packets Results</h3>
          
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Filter by classification"
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm"
            />
          </div>
        </div>
        
        {/* Label statistics */}
        {uniqueClassifications.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm text-gray-400 mb-2">Classification Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {uniqueClassifications.map(label => {
                const count = processedPackets.filter(p => p.classification === label).length;
                const percentage = Math.round((count / processedPackets.length) * 100);
                
                return (
                  <div 
                    key={label}
                    className={`px-2 py-1 rounded-md text-xs border ${getLabelClass(label)}`}
                  >
                    {label}: {count} ({percentage}%)
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-900 border border-gray-700 rounded-md">
            <thead className="bg-gray-800">
              <tr>
                {["timestamp", "src_ip", "dst_ip", "protocol", "length", "classification"].map(field => (
                  <th 
                    key={field}
                    onClick={() => handleSort(field)}
                    className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700 cursor-pointer hover:bg-gray-700"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{field === "classification" ? "Attack Label" : field}</span>
                      {sortField === field && (
                        <ArrowUpDown size={14} className={`transform ${sortDirection === "asc" ? "rotate-0" : "rotate-180"}`} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-800">
              {displayedPackets.map((packet, i) => {
                const isNewPacket = i === 0 && processedPackets.length > prevPacketsLengthRef.current - 1;
                
                return (
                  <tr 
                    key={i} 
                    className={`${i % 2 === 0 ? "bg-gray-900" : "bg-gray-800/50"} ${isNewPacket ? "animate-pulse-once" : ""}`}
                  >
                    <td className="py-3 px-4 text-sm text-gray-300 border-r border-gray-700">
                      {packet.timestamp}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 border-r border-gray-700">
                      {packet.src_ip}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 border-r border-gray-700">
                      {packet.dst_ip}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 border-r border-gray-700">
                      {packet.protocol}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 border-r border-gray-700">
                      {packet.length}
                    </td>
                    <td className="py-3 px-4 text-sm border-r border-gray-700">
                      <span className={`px-2 py-1 rounded-md text-xs border ${getLabelClass(packet.classification)}`}>
                        {packet.classification || "Processing..."}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Result Summary */}
        <div className="mt-4 text-sm text-gray-400">
          Showing {displayedPackets.length} of {processedPackets.length} processed packets
          {filterLabel && " (filtered)"}
        </div>
      </div>
    </>
  );
};

export default PacketAnalyzerTable;