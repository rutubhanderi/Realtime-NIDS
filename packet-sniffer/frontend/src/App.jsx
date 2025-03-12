import { useState } from "react";

function App() {
  const [packets, setPackets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const capturePackets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/capture");
      if (!response.ok) {
        throw new Error("Failed to fetch packets");
      }
      const data = await response.json();
      setPackets(data);
    } catch (error) {
      setError(error.message);
      console.error("Error capturing packets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = () => {
    if (packets.length === 0) return;
    
    const csvHeader = Object.keys(packets[0]).join(",") + "\n";
    const csvRows = packets.map(packet => 
      Object.values(packet).map(value => 
        value === null ? "" : String(value)
      ).join(",")
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "packets.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Network Packet Capturer</h1>
          <p className="text-blue-100">Analyzes network traffic using scapy and npcap.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto flex-grow p-4">
        <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button 
              onClick={capturePackets} 
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200 disabled:bg-blue-300"
            >
              {isLoading ? "Capturing..." : "Capture Packets"}
            </button>
            
            <button 
              onClick={downloadCSV} 
              disabled={packets.length === 0 || isLoading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-200 disabled:bg-green-300"
            >
              Download CSV
            </button>
            
            {packets.length > 0 && (
              <span className="text-gray-600 font-medium">
                {packets.length} packets captured
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {error}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {packets.length > 0 && !isLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(packets[0]).map((key, i) => (
                      <th key={i} className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {packets.map((packet, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      {Object.values(packet).map((value, j) => (
                        <td key={j} className="py-2 px-3 text-sm text-gray-500 border-r">
                          {value !== null ? String(value) : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && packets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No packets captured yet. Click the "Capture Packets" button to start.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} Network Packet Analyzer.</p>
          <p className="text-gray-400 text-sm mt-1">
            
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;