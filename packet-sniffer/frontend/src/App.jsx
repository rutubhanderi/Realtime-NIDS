import { useState } from "react";

function App() {
  const [packets, setPackets] = useState([]);

  const capturePackets = async () => {
    try {
      const response = await fetch("http://localhost:8000/capture");
      if (!response.ok) {
        throw new Error("Failed to fetch packets");
      }
      const data = await response.json();
      setPackets(data);
    } catch (error) {
      console.error("Error capturing packets:", error);
    }
  };

  const downloadCSV = () => {
    const csvHeader = Object.keys(packets[0]).join(",") + "\n";
    const csvRows = packets.map(packet => Object.values(packet).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "packets.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Packet Capture</h2>
      <button onClick={capturePackets}>Capture Packets</button>
      {packets.length > 0 && (
        <>
          <button onClick={downloadCSV} style={{ marginLeft: "10px" }}>Download CSV</button>
          <table>
            <thead>
              <tr>
                {Object.keys(packets[0]).map((key, i) => <th key={i}>{key}</th>)}
              </tr>
            </thead>
            <tbody>
              {packets.map((packet, i) => (
                <tr key={i}>
                  {Object.values(packet).map((value, j) => <td key={j}>{value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
