import { useState } from "react";
import { FileText, Cpu, ShieldAlert, BarChart2, Layers, ChevronDown, ChevronUp } from "lucide-react";

export default function AboutPage() {
  const [expandedSection, setExpandedSection] = useState("system");

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">

      <main className="container mx-auto flex-grow p-4">
        <div className="mb-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-100">About NetSift</h2>

          <p className="mb-6 text-gray-300">
            NetSift is a network security monitoring tool that uses advanced machine learning to detect and classify potential security threats in real-time.
            Built on the CICIDS2017 dataset architecture, it provides comprehensive packet analysis, visualization, and reporting capabilities.
          </p>


          <div className="mb-4">
            <button
              onClick={() => toggleSection("system")}
              className="w-full flex justify-between items-center bg-gray-750 hover:bg-gray-700 p-4 rounded-lg border border-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <Cpu className="mr-3 text-blue-400" size={24} />
                <h3 className="text-lg font-medium">System Architecture</h3>
              </div>
              {expandedSection === "system" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === "system" && (
              <div className="mt-4 bg-gray-850 rounded-lg p-4 border border-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Frontend Components</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>React-based UI with real-time updates</li>
                      <li>Chart.js visualizations for attack distributions</li>
                      <li>Packet capture and analysis interface</li>
                      <li>CSV upload capabilities for offline analysis</li>
                      <li>PDF report generation via jsPDF</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Backend Services</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>FastAPI server for REST endpoints</li>
                      <li>WebSocket connections for real-time packet streaming</li>
                      <li>Scapy-based packet capture and feature extraction</li>
                      <li>TensorFlow model inference integration</li>
                      <li>Joblib for data preprocessing scalers and encoders</li>
                    </ul>
                  </div>
                </div>

                {/* System Architecture Image */}
                <div className="mt-6">
                  <h4 className="font-medium text-blue-400 mb-2">System Architecture Diagram</h4>
                  <div className="flex justify-center">
                    <img
                      src="/SystemArch.png"
                      alt="System Architecture Diagram"
                      className="max-w-full rounded-lg border border-gray-700"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-blue-400 mb-2">Data Flow</h4>
                  <ol className="list-decimal pl-5 text-gray-300 space-y-2">
                    <li><span className="text-green-400">Packet Capture:</span> Live network packets are captured using Scapy's AsyncSniffer</li>
                    <li><span className="text-green-400">Feature Extraction:</span> CICIDS2017-compatible features are extracted from each packet</li>
                    <li><span className="text-green-400">Model Inference:</span> Pre-trained neural network classifies packet as benign or attack type</li>
                    <li><span className="text-green-400">WebSocket Streaming:</span> Results are streamed to frontend in real-time</li>
                    <li><span className="text-green-400">Visualization:</span> Data is analyzed and displayed in interactive charts</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Severity Score Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("severity")}
              className="w-full flex justify-between items-center bg-gray-750 hover:bg-gray-700 p-4 rounded-lg border border-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <ShieldAlert className="mr-3 text-red-400" size={24} />
                <h3 className="text-lg font-medium">Severity Score Calculation</h3>
              </div>
              {expandedSection === "severity" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === "severity" && (
              <div className="mt-4 bg-gray-850 rounded-lg p-4 border border-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Attack Type to Severity Mapping</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                        <span className="font-medium text-red-400">Critical Severity:</span>
                        <span className="ml-2 text-gray-300">DoS Attacks, DDoS Attacks</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="font-medium text-red-300">High Severity:</span>
                        <span className="ml-2 text-gray-300">Port Scanning & Brute Force</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="font-medium text-yellow-400">Medium Severity:</span>
                        <span className="ml-2 text-gray-300">Other Exploits & Infiltrations</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="font-medium text-blue-300">Low Severity:</span>
                        <span className="ml-2 text-gray-300">Undefined attack types</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="font-medium text-green-400">Info Severity:</span>
                        <span className="ml-2 text-gray-300">Benign Traffic</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Risk Score Algorithm</h4>
                    <p className="text-gray-300 mb-2">The overall risk score (0-100) is calculated using a weighted average of severity levels:</p>
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 font-mono text-sm">
                      <div><span className="text-yellow-400">// Severity weights</span></div>
                      <div>Critical = 100 points</div>
                      <div>High = 75 points</div>
                      <div>Medium = 50 points</div>
                      <div>Low = 25 points</div>
                      <div>Info = 0 points</div>
                      <div className="mt-2"><span className="text-yellow-400">// Formula</span></div>
                      <div>RiskScore = Σ(weight × count) / totalPackets</div>
                    </div>

                    <h4 className="font-medium text-blue-400 mt-4 mb-2">Risk Level Thresholds</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>Critical Risk: Score ≥ 75</li>
                      <li>High Risk: Score ≥ 50</li>
                      <li>Medium Risk: Score ≥ 25</li>
                      <li>Low Risk: Score ≤ 25</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Model Architecture Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("model")}
              className="w-full flex justify-between items-center bg-gray-750 hover:bg-gray-700 p-4 rounded-lg border border-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <Layers className="mr-3 text-purple-400" size={24} />
                <h3 className="text-lg font-medium">Model Architecture</h3>
              </div>
              {expandedSection === "model" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === "model" && (
              <div className="mt-4 bg-gray-850 rounded-lg p-4 border border-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Model Overview</h4>
                    <p className="text-gray-300 mb-4">
                      NetSift uses an optimized CNN-LSTM hybrid neural network that processes network packet
                      features to classify traffic into benign or various attack categories.
                    </p>

                    <h4 className="font-medium text-blue-400 mb-2">Architecture Details</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>Hybrid CNN-LSTM architecture for temporal feature learning</li>
                      <li>Input shape: Selected features from CICIDS2017 dataset</li>
                      <li>Feature selection: Optimized for the most predictive features</li>
                      <li>Data normalization: StandardScaler preprocessing</li>
                      <li>Multi-class classification with softmax output</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Layer Structure</h4>
                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 font-mono text-sm text-gray-300">
                      <div>Input → <span className="text-green-400">[selected_features, 1]</span></div>
                      <div>↓</div>
                      <div>Conv1D layers → <span className="text-green-400">Feature extraction</span></div>
                      <div>↓</div>
                      <div>BatchNorm → <span className="text-green-400">Stabilization</span></div>
                      <div>↓</div>
                      <div>MaxPooling → <span className="text-green-400">Dimensionality reduction</span></div>
                      <div>↓</div>
                      <div>LSTM layers → <span className="text-green-400">Temporal patterns</span></div>
                      <div>↓</div>
                      <div>Dense layers → <span className="text-green-400">Classification</span></div>
                      <div>↓</div>
                      <div>Softmax → <span className="text-green-400">Attack probabilities</span></div>
                    </div>

                    <h4 className="font-medium text-blue-400 mt-4 mb-2">Performance Metrics</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>High accuracy in distinguishing attack types</li>
                      <li>Optimized for minimal false positives</li>
                      <li>Fast inference for real-time packet classification</li>
                      <li>Trained on the CICIDS2017 cybersecurity dataset</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="mb-4">
            <button
              onClick={() => toggleSection("features")}
              className="w-full flex justify-between items-center bg-gray-750 hover:bg-gray-700 p-4 rounded-lg border border-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <BarChart2 className="mr-3 text-green-400" size={24} />
                <h3 className="text-lg font-medium">Features & Capabilities</h3>
              </div>
              {expandedSection === "features" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === "features" && (
              <div className="mt-4 bg-gray-850 rounded-lg p-4 border border-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Core Features</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>Real-time packet capture and classification</li>
                      <li>CSV upload for offline analysis</li>
                      <li>Interactive data visualizations (bar charts, pie charts)</li>
                      <li>Attack severity assessment and risk scoring</li>
                      <li>Comprehensive reporting via PDF export</li>
                      <li>Data export (CSV) for further analysis</li>
                    </ul>

                    <h4 className="font-medium text-blue-400 mt-4 mb-2">Attack Detection</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>DoS and DDoS attacks</li>
                      <li>Port scanning attempts</li>
                      <li>Brute force attacks</li>
                      <li>Various exploits and infiltrations</li>
                      <li>Anomaly detection for unknown attack patterns</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Data Sources</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>Live network interface capture</li>
                      <li>CICIDS2017-formatted CSV files</li>
                      <li>Custom packet capture exports</li>
                    </ul>

                    <h4 className="font-medium text-blue-400 mt-4 mb-2">Reporting Capabilities</h4>
                    <p className="text-gray-300 mb-2">
                      NetSift generates detailed security reports including:
                    </p>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>Attack distribution summaries</li>
                      <li>Severity distribution charts</li>
                      <li>Overall network risk assessment</li>
                      <li>Security recommendations based on detected attacks</li>
                      <li>Packet analysis timelines</li>
                      <li>Custom PDF reports for stakeholder communication</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Documentation Section */}
          <div>
            <button
              onClick={() => toggleSection("docs")}
              className="w-full flex justify-between items-center bg-gray-750 hover:bg-gray-700 p-4 rounded-lg border border-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <FileText className="mr-3 text-yellow-400" size={24} />
                <h3 className="text-lg font-medium">Documentation & Usage</h3>
              </div>
              {expandedSection === "docs" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSection === "docs" && (
              <div className="mt-4 bg-gray-850 rounded-lg p-4 border border-gray-700">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Getting Started</h4>
                    <ol className="list-decimal pl-5 text-gray-300 space-y-2">
                      <li>Install dependencies for both frontend and backend</li>
                      <li>Start the FastAPI backend server</li>
                      <li>Launch the React frontend application</li>
                      <li>Navigate to the packet capture tab</li>
                      <li>Click "Start Capture" to begin analyzing network traffic</li>
                    </ol>

                    <h4 className="font-medium text-blue-400 mt-4 mb-2">Required Dependencies</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div className="text-gray-300">Frontend:</div>
                      <div className="text-gray-400">React, Chart.js, jsPDF</div>
                      <div className="text-gray-300">Backend:</div>
                      <div className="text-gray-400">FastAPI, TensorFlow, Scapy</div>
                      <div className="text-gray-300">Machine Learning:</div>
                      <div className="text-gray-400">NumPy, Pandas, Joblib</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">Use Cases</h4>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>Security audit of network traffic</li>
                      <li>Real-time threat detection and monitoring</li>
                      <li>Forensic analysis of captured packets</li>
                      <li>Security posture assessment</li>
                      <li>Network intrusion detection</li>
                      <li>Security reporting for compliance</li>
                    </ul>

                    <h4 className="font-medium text-blue-400 mt-4 mb-2">Training Dataset</h4>
                    <p className="text-gray-300">
                      The system is trained on the CICIDS2017 dataset, which contains:
                    </p>
                    <ul className="list-disc pl-5 text-gray-300 space-y-1">
                      <li>Benign network traffic</li>
                      <li>Various attack scenarios (DoS, DDoS, Brute Force)</li>
                      <li>78 network traffic features</li>
                      <li>Labeled traffic for supervised learning</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}