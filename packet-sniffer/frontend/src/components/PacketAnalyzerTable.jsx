import { useState, useEffect, useRef } from "react";
import { ArrowUpDown, Filter, Shield, Search, X, ChevronDown } from "lucide-react";

const PacketAnalyzerTable = ({ processedPackets, isCapturing, currentAttack }) => {
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc"); // newest first
  const [displayedPackets, setDisplayedPackets] = useState([]);
  const prevPacketsLengthRef = useRef(processedPackets.length);
  
  // Enhanced filter state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    classification: "",
    src_ip: "",
    dst_ip: "",
    protocol: "",
    searchTerm: ""
  });
  
  // Apply filtering and sorting logic
  useEffect(() => {
    // Clone and sort packets
    const sortPackets = () => {
      return [...processedPackets].sort((a, b) => {
        let comparison = 0;
        if (a[sortField] > b[sortField]) {
          comparison = 1;
        } else if (a[sortField] < b[sortField]) {
          comparison = -1;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    };
    
    // Apply all active filters
    const filterPackets = (sorted) => {
      return sorted.filter(packet => {
        // Basic text search across multiple fields
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const matchesSearch = 
            String(packet.src_ip).toLowerCase().includes(searchLower) ||
            String(packet.dst_ip).toLowerCase().includes(searchLower) ||
            String(packet.protocol).toLowerCase().includes(searchLower) ||
            (packet.classification && packet.classification.toLowerCase().includes(searchLower));
            
          if (!matchesSearch) return false;
        }
        
        // Specific field filters
        if (filters.classification && 
            (!packet.classification || 
             !packet.classification.toLowerCase().includes(filters.classification.toLowerCase()))) {
          return false;
        }
        
        if (filters.src_ip && 
            (!packet.src_ip || 
             !packet.src_ip.toLowerCase().includes(filters.src_ip.toLowerCase()))) {
          return false;
        }
        
        if (filters.dst_ip && 
            (!packet.dst_ip || 
             !packet.dst_ip.toLowerCase().includes(filters.dst_ip.toLowerCase()))) {
          return false;
        }
        
        if (filters.protocol && 
            (!packet.protocol || 
             !packet.protocol.toLowerCase().includes(filters.protocol.toLowerCase()))) {
          return false;
        }
        
        return true;
      });
    };
    
    // Process packets when they change or when filters/sort change
    const sorted = sortPackets();
    const filtered = filterPackets(sorted);
    setDisplayedPackets(filtered);
    
    // Update reference for animation tracking
    if (processedPackets.length !== prevPacketsLengthRef.current) {
      prevPacketsLengthRef.current = processedPackets.length;
    }
    
  }, [processedPackets, sortField, sortDirection, filters]);
  
  // Reset all filters
  const clearFilters = () => {
    setFilters({
      classification: "",
      src_ip: "",
      dst_ip: "",
      protocol: "",
      searchTerm: ""
    });
  };

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

  // Update filter values
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const getLabelClass = (label) => {
    if (!label || label === "Unknown") return "bg-gray-900/30 text-gray-400 border-gray-500";
    switch (label) {
      case "Benign Traffic":
        return "bg-green-900/30 text-green-400 border-green-500";
      case "DoS Attacks":
      case "DDoS Attacks":
        return "bg-red-900/30 text-red-400 border-red-500";
      case "Port Scanning & Brute Force":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-500";
      case "Other Exploits & Infiltrations":
        return "bg-blue-900/30 text-blue-400 border-blue-500";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-500";
    }
  };

  // Get unique values for filter dropdowns
  const uniqueClassifications = Array.from(new Set(processedPackets.map(p => p.classification)))
    .filter(label => label != null && !Number.isNaN(label));
  
  const uniqueProtocols = Array.from(new Set(processedPackets.map(p => p.protocol)))
    .filter(protocol => protocol != null);
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== "");
  
  // Count occurrences of each classification
  const classificationCounts = processedPackets.reduce((acc, packet) => {
    const label = packet.classification || "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-gray-800 rounded-lg p-6 my-4 border border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-bold text-gray-200">Processed Packets Results</h3>
        
        {/* Global search bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search all fields..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-2 text-sm w-full"
            />
            {filters.searchTerm && (
              <button 
                onClick={() => handleFilterChange("searchTerm", "")}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <X size={16} className="text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
          
          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${
                hasActiveFilters ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 border border-gray-600"
              }`}
            >
              <Filter size={16} />
              <span>Filters {hasActiveFilters ? `(${Object.values(filters).filter(v => v !== "").length})` : ""}</span>
              <ChevronDown size={16} className={`transform ${showFilterMenu ? "rotate-180" : ""}`} />
            </button>
            
            {/* Filter menu */}
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-300">Advanced Filters</h4>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearFilters}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  {/* Classification filter */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1">Classification</label>
                    <select
                      value={filters.classification}
                      onChange={(e) => handleFilterChange("classification", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    >
                      <option value="">All Classifications</option>
                      {uniqueClassifications.map(label => (
                        <option key={label} value={label}>
                          {label} ({classificationCounts[label] || 0})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Protocol filter */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1">Protocol</label>
                    <select
                      value={filters.protocol}
                      onChange={(e) => handleFilterChange("protocol", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    >
                      <option value="">All Protocols</option>
                      {uniqueProtocols.map(protocol => (
                        <option key={protocol} value={protocol}>{protocol}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Source IP filter */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1">Source IP</label>
                    <input
                      type="text"
                      placeholder="Filter by source IP"
                      value={filters.src_ip}
                      onChange={(e) => handleFilterChange("src_ip", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  
                  {/* Destination IP filter */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1">Destination IP</label>
                    <input
                      type="text"
                      placeholder="Filter by destination IP"
                      value={filters.dst_ip}
                      onChange={(e) => handleFilterChange("dst_ip", e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400">Active filters:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            return (
              <div 
                key={key}
                className="flex items-center bg-gray-700 text-xs px-2 py-1 rounded-md"
              >
                <span className="text-gray-300 mr-1">
                  {key === "searchTerm" ? "Search" : key}:
                </span>
                <span className="text-white">{value}</span>
                <button 
                  onClick={() => handleFilterChange(key, "")}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
          <button 
            onClick={clearFilters}
            className="text-xs text-blue-400 hover:text-blue-300 ml-2"
          >
            Clear all
          </button>
        </div>
      )}

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
                  className={`px-2 py-1 rounded-md text-xs border ${getLabelClass(label)} cursor-pointer hover:opacity-80`}
                  onClick={() => handleFilterChange("classification", label)}
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
                      {packet.classification ?? "Unknown"}
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
        {hasActiveFilters && " (filtered)"}
      </div>
    </div>
  );
};

export default PacketAnalyzerTable;