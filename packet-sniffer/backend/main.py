import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from fastapi import FastAPI, WebSocket, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import AsyncSniffer, IP, TCP, UDP
from pydantic import BaseModel
import joblib
import logging
import asyncio
from queue import Queue
import io
import threading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the 78 features (as per CICIDS2017 dataset)
FEATURES = [
    "Destination Port", "Flow Duration", "Total Fwd Packets", "Total Backward Packets",
    "Total Length of Fwd Packets", "Total Length of Bwd Packets", "Fwd Packet Length Max",
    "Fwd Packet Length Min", "Fwd Packet Length Mean", "Fwd Packet Length Std",
    "Bwd Packet Length Max", "Bwd Packet Length Min", "Bwd Packet Length Mean",
    "Bwd Packet Length Std", "Flow Bytes/s", "Flow Packets/s", "Flow IAT Mean", "Flow IAT Std",
    "Flow IAT Max", "Flow IAT Min", "Fwd IAT Total", "Fwd IAT Mean", "Fwd IAT Std",
    "Fwd IAT Max", "Fwd IAT Min", "Bwd IAT Total", "Bwd IAT Mean", "Bwd IAT Std",
    "Bwd IAT Max", "Bwd IAT Min", "Fwd PSH Flags", "Bwd PSH Flags", "Fwd URG Flags",
    "Bwd URG Flags", "Fwd Header Length", "Bwd Header Length", "Fwd Packets/s",
    "Bwd Packets/s", "Min Packet Length", "Max Packet Length", "Packet Length Mean",
    "Packet Length Std", "Packet Length Variance", "FIN Flag Count", "SYN Flag Count",
    "RST Flag Count", "PSH Flag Count", "ACK Flag Count", "URG Flag Count", "CWE Flag Count",
    "ECE Flag Count", "Down/Up Ratio", "Average Packet Size", "Avg Fwd Segment Size",
    "Avg Bwd Segment Size", "Fwd Header Length.1", "Fwd Avg Bytes/Bulk", "Fwd Avg Packets/Bulk",
    "Fwd Avg Bulk Rate", "Bwd Avg Bytes/Bulk", "Bwd Avg Packets/Bulk", "Bwd Avg Bulk Rate",
    "Subflow Fwd Packets", "Subflow Fwd Bytes", "Subflow Bwd Packets", "Subflow Bwd Bytes",
    "Init_Win_bytes_forward", "Init_Win_bytes_backward", "act_data_pkt_fwd",
    "min_seg_size_forward", "Active Mean", "Active Std", "Active Max", "Active Min",
    "Idle Mean", "Idle Std", "Idle Max", "Idle Min"
]

# Load model and artifacts
try:
    model = load_model("best_optimized_cnn_lstm.h5")
    scaler = joblib.load("scaler_optimized.pkl")
    label_encoder = joblib.load("label_encoder_optimized.pkl")
    selected_indices = joblib.load("selected_indices.pkl")
    logger.info("Model, scaler, label encoder, and selected indices loaded successfully")
except Exception as e:
    logger.error(f"Error loading model or artifacts: {str(e)}")
    raise

# Pydantic model for packet features
class Packet(BaseModel):
    class Config:
        fields = {feature.replace(" ", "").replace("/", "").replace(".", "_"): feature for feature in FEATURES}

# Utility function to convert NumPy types
def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, pd.Timestamp):
        return obj.strftime('%H:%M:%S')
    return obj

# Define max packets for live capture
MAX_PACKETS = 50
current_packet_count = 0
capture_complete = False
active_sniffer = None
packet_queue = Queue()
csv_data = []
capture_lock = threading.Lock()

# Label mapping
LABEL_MAPPING = {
    'Benign Traffic': 'Benign Traffic',
    'DoS Attacks': 'DoS Attacks',
    'DDoS Attacks': 'DDoS Attacks',
    'Port Scanning & Brute Force': 'Port Scanning & Brute Force',
    'Other Exploits & Infiltrations': 'Other Exploits & Infiltrations',
    np.nan: 'Benign Traffic',  # Handle nan as Benign Traffic
}

def extract_features(packet):
    """Extract CICIDS2017-compatible features from a packet for live capture."""
    try:
        features = {feature: 0 for feature in FEATURES}
        
        # Basic packet attributes
        if IP in packet:
            features["src_ip"] = packet[IP].src
            features["dst_ip"] = packet[IP].dst
            features["ttl"] = packet[IP].ttl if hasattr(packet[IP], 'ttl') else 64
        features["Source Port"] = packet.sport if hasattr(packet, 'sport') else np.random.randint(1024, 65535)
        features["Destination Port"] = packet.dport if hasattr(packet, 'dport') else 80
        features["Flow Duration"] = float(packet.time) if hasattr(packet, 'time') else 0.0
        features["Total Fwd Packets"] = 1
        features["Total Length of Fwd Packets"] = len(packet)
        features["Fwd Packet Length Max"] = len(packet)
        features["Fwd Packet Length Min"] = len(packet)
        features["Fwd Packet Length Mean"] = float(len(packet))
        features["Flow Bytes/s"] = float(len(packet))
        features["Flow Packets/s"] = 1.0
        features["Fwd Header Length"] = len(packet)
        features["Fwd Header Length.1"] = len(packet)
        features["Fwd Packets/s"] = 1.0
        features["Min Packet Length"] = len(packet)
        features["Max Packet Length"] = len(packet)
        features["Packet Length Mean"] = float(len(packet))
        features["Average Packet Size"] = float(len(packet))
        features["protocol"] = "TCP" if TCP in packet else "UDP" if UDP in packet else "UNKNOWN"
        
        # TCP-specific features
        if TCP in packet:
            flags = packet.sprintf("%TCP.flags%") if hasattr(packet[TCP], 'flags') else ""
            features["FIN Flag Count"] = 1 if "F" in flags else 0
            features["SYN Flag Count"] = 1 if "S" in flags else 0
            features["RST Flag Count"] = 1 if "R" in flags else 0
            features["PSH Flag Count"] = 1 if "P" in flags else 0
            features["ACK Flag Count"] = 1 if "A" in flags else 0
            features["URG Flag Count"] = 1 if "U" in flags else 0
            if hasattr(packet[TCP], 'window'):
                features["Init_Win_bytes_forward"] = int(packet[TCP].window)
        
        return features
    except Exception as e:
        logger.error(f"Error extracting features: {str(e)}")
        return {feature: 0 for feature in FEATURES}

def predict_packet(features):
    """Predict the attack type for a single packet."""
    try:
        df_packet = pd.DataFrame([features])
        for feature in FEATURES:
            if feature not in df_packet.columns:
                df_packet[feature] = 0
        df_packet = df_packet[FEATURES]
        X = df_packet.values[:, selected_indices]
        X_scaled = scaler.transform(X)
        X_scaled = X_scaled.reshape(X_scaled.shape[0], X_scaled.shape[1], 1)
        y_pred_prob = model.predict(X_scaled, verbose=0)
        y_pred = np.argmax(y_pred_prob, axis=1)
        y_pred_label = label_encoder.inverse_transform(y_pred)[0]
        # Handle nan and map to specified label
        if pd.isna(y_pred_label):
            return LABEL_MAPPING.get(np.nan, 'Benign Traffic')
        return LABEL_MAPPING.get(y_pred_label, 'Other Exploits & Infiltrations')
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return "Benign Traffic"

def format_packet_data(features, prediction):
    return convert_numpy_types({
        "src_ip": features.get("src_ip", "192.168.1." + str(np.random.randint(1, 255))),
        "dst_ip": features.get("dst_ip", "10.0.0." + str(np.random.randint(1, 255))),
        "src_port": features.get("Source Port", np.random.randint(1024, 65535)),
        "dst_port": features.get("Destination Port", 80),
        "protocol": features.get("protocol", "TCP"),
        "length": features.get("Total Length of Fwd Packets", np.random.randint(40, 1500)),
        "flags": (
            'SYN' if features.get("SYN Flag Count", 0) > 0 else
            'ACK' if features.get("ACK Flag Count", 0) > 0 else
            'FIN' if features.get("FIN Flag Count", 0) > 0 else 'NONE'
        ),
        "ttl": features.get("ttl", np.random.randint(1, 64)),
        "classification": prediction,
        "timestamp": pd.Timestamp.now().strftime('%H:%M:%S')
    })

def packet_callback(packet):
    """Callback function to process each captured packet during live capture."""
    global current_packet_count, capture_complete, active_sniffer
    
    try:
        with capture_lock:
            if current_packet_count < MAX_PACKETS:
                features = extract_features(packet)
                prediction = predict_packet(features)
                packet_data = format_packet_data(features, prediction)
                packet_queue.put(packet_data)
                csv_data.append(packet_data)
                current_packet_count += 1
                logger.info(f"Processed packet {current_packet_count}/{MAX_PACKETS} with prediction: {prediction}")
                
                if current_packet_count >= MAX_PACKETS:
                    capture_complete = True
                    if active_sniffer:
                        logger.info("Stopping sniffer as we've reached max packet count")
                        active_sniffer.stop()
    except Exception as e:
        logger.error(f"Error in packet_callback: {str(e)}")

def start_packet_capture(interface="Wi-Fi"):
    """Start capturing packets up to the MAX_PACKETS limit."""
    global current_packet_count, capture_complete, active_sniffer, csv_data
    
    with capture_lock:
        current_packet_count = 0
        capture_complete = False
        csv_data = []
    
    try:
        active_sniffer = AsyncSniffer(filter="ip", prn=packet_callback, store=False, iface=interface)
        active_sniffer.start()
        logger.info(f"Started packet sniffer, capturing up to {MAX_PACKETS} packets")
        return {"status": "started", "max_packets": MAX_PACKETS}
    except Exception as e:
        logger.error(f"Error starting sniffer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start packet capture: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize the application."""
    logger.info("Application started, ready to capture packets or process CSV uploads")

@app.post("/start-capture")
async def start_capture():
    """Endpoint to start live packet capture."""
    try:
        result = start_packet_capture()
        return convert_numpy_types(result)
    except Exception as e:
        logger.error(f"Error in start_capture endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-csv")
async def predict_csv(file: UploadFile = File(...)):
    """Endpoint to predict attack labels from uploaded CSV."""
    try:
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Ensure all required features are present
        for feature in FEATURES:
            if feature not in df.columns:
                df[feature] = 0
        
        df = df[FEATURES]
        X = df.values[:, selected_indices]
        X_scaled = scaler.transform(X)
        X_scaled = X_scaled.reshape(X_scaled.shape[0], X_scaled.shape[1], 1)
        y_pred_prob = model.predict(X_scaled, verbose=0)
        y_pred = np.argmax(y_pred_prob, axis=1)
        y_pred_labels = label_encoder.inverse_transform(y_pred)
        df['Label'] = y_pred_labels
        
        response_data = []
        for _, row in df.iterrows():
            packet = {
                'src_ip': row.get('src_ip', "192.168.1." + str(np.random.randint(1, 255))),
                'src_port': int(row.get('Source Port', np.random.randint(1024, 65535))),
                'dst_ip': row.get('dst_ip', "10.0.0." + str(np.random.randint(1, 255))),
                'dst_port': int(row.get('Destination Port', 80)),
                'protocol': row.get('protocol', 'TCP'),
                'length': int(row.get('Total Length of Fwd Packets', np.random.randint(40, 1500))),
                'flags': (
                    'SYN' if row.get('SYN Flag Count', 0) > 0 else
                    'ACK' if row.get('ACK Flag Count', 0) > 0 else
                    'FIN' if row.get('FIN Flag Count', 0) > 0 else 'NONE'
                ),
                'ttl': int(row.get('ttl', np.random.randint(1, 64))),
                'classification': LABEL_MAPPING.get(row['Label'], 'Other Exploits & Infiltrations'),
                'timestamp': pd.Timestamp.now().strftime('%H:%M:%S')
            }
            response_data.append(packet)
        
        return convert_numpy_types(response_data)
    except Exception as e:
        logger.error(f"Error predicting CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")

@app.get("/capture-status")
async def get_capture_status():
    """Get the current status of the packet capture."""
    status = {
        "current_count": current_packet_count,
        "max_packets": MAX_PACKETS,
        "complete": capture_complete
    }
    return convert_numpy_types(status)

@app.websocket("/ws/packets")
async def websocket_packets(websocket: WebSocket):
    """WebSocket endpoint to stream packet predictions in real-time for live capture."""
    await websocket.accept()
    logger.info("WebSocket connected")
    try:
        while True:
            if not packet_queue.empty():
                packet_data = packet_queue.get()
                await websocket.send_json(convert_numpy_types(packet_data))
            
            await websocket.send_json(convert_numpy_types({
                "type": "status_update",
                "current_count": current_packet_count,
                "max_packets": MAX_PACKETS,
                "complete": capture_complete
            }))
            
            if capture_complete and packet_queue.empty():
                await websocket.send_json(convert_numpy_types({
                    "type": "capture_complete",
                    "message": f"Capture of {MAX_PACKETS} packets completed"
                }))
                break
                
            await asyncio.sleep(0.1)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()
        logger.info("WebSocket disconnected")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}