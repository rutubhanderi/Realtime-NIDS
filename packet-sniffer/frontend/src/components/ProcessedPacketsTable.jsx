import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, Filter } from "lucide-react";

const ProcessedPacketsTable = ({ processedPackets }) => {
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc"); // newest first
  const [filterLabel, setFilterLabel] = useState("");
  const [displayedPackets, setDisplayedPackets] = useState([]);
  const prevPacketsLengthRef = useRef(processedPackets.length);  // Store previous packet count

  // Re-process packets when they change
  useEffect(() => {
    // Only reprocess if new packets have arrived (i.e., length changed)
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
        ? sorted.filter(p => p.classification.toLowerCase().includes(filterLabel.toLowerCase()))
        : sorted;
        
      setDisplayedPackets(filtered);
      
      prevPacketsLengthRef.current = processedPackets.length;  // Update the reference
    }
  }, [processedPackets, sortField, sortDirection, filterLabel]);

  // No packets to display
  if (processedPackets.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 my-4 border border-gray-700 text-center text-gray-400">
        No processed packets yet. Start packet capture to see results here.
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
    
    if (label === 'BENIGN') {
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

  // Get unique classifications from the current packets
  const uniqueClassifications = Array.from(new Set(processedPackets.map(p => p.classification)))
    .filter(label => label); // Filter out undefined/null values

  return (
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
                    <span>{field === "classification" ? "CICIDS Label" : field}</span>
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
      </div>
    </div>
  );
};

export default ProcessedPacketsTable;
