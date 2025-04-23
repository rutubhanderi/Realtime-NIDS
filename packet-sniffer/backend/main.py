import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import AsyncSniffer, IP, TCP, UDP
from pydantic import BaseModel
import joblib
import logging
import asyncio
from queue import Queue

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

# Define max packets to capture
MAX_PACKETS = 50  # Updated to capture 50 packets
current_packet_count = 0
capture_complete = False
active_sniffer = None

# Initialize packet queue and CSV storage
packet_queue = Queue()
csv_data = []

def extract_features(packet):
    """Extract CICIDS2017-compatible features from a packet."""
    try:
        features = {feature: 0 for feature in FEATURES}
        
        # Basic packet attributes
        if hasattr(packet, 'dport'):
            features["Destination Port"] = int(packet.dport)
        features["Flow Duration"] = float(packet.time)
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
        
        # TCP-specific features
        if TCP in packet:
            flags = packet.sprintf("%TCP.flags%")
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

async def save_to_csv_periodically():
    """Periodically save captured packets and predictions to CSV."""
    while True:
        if csv_data:
            try:
                df = pd.DataFrame(csv_data)
                df.to_csv("captured_packets_with_predictions.csv", index=False)
                logger.info(f"Saved {len(csv_data)} packets to CSV")
            except Exception as e:
                logger.error(f"Error saving to CSV: {str(e)}")
        
        # If we've reached our packet limit, no need to keep this task running
        if capture_complete:
            logger.info("Capture complete, saving final CSV")
            if csv_data:
                try:
                    df = pd.DataFrame(csv_data)
                    df.to_csv("captured_packets_with_predictions.csv", index=False)
                    logger.info(f"Saved final {len(csv_data)} packets to CSV")
                except Exception as e:
                    logger.error(f"Error saving final CSV: {str(e)}")
            break
            
        await asyncio.sleep(10)  # Save every 10 seconds

def predict_packet(features):
    """Predict the attack type for a single packet."""
    try:
        # Convert features to DataFrame
        df_packet = pd.DataFrame([features])
        
        # Ensure all required features are present
        for feature in FEATURES:
            if feature not in df_packet.columns:
                df_packet[feature] = 0
        
        # Select only the features used by the model
        df_packet = df_packet[FEATURES]
        X = df_packet.values[:, selected_indices]
        
        # Preprocess
        X_scaled = scaler.transform(X)
        X_scaled = X_scaled.reshape(X_scaled.shape[0], X_scaled.shape[1], 1)
        
        # Predict
        y_pred_prob = model.predict(X_scaled, verbose=0)
        y_pred = np.argmax(y_pred_prob, axis=1)
        y_pred_label = label_encoder.inverse_transform(y_pred)[0]
        
        return y_pred_label
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return "Error"

def packet_callback(packet):
    """Callback function to process each captured packet."""
    global current_packet_count, capture_complete, active_sniffer
    
    try:
        if current_packet_count < MAX_PACKETS:
            features = extract_features(packet)
            prediction = predict_packet(features)
            features["Predicted_Label"] = prediction
            packet_queue.put(features)
            csv_data.append(features)
            current_packet_count += 1
            logger.info(f"Processed packet {current_packet_count}/{MAX_PACKETS} with prediction: {prediction}")
            
            # Check if we've reached our limit
            if current_packet_count >= MAX_PACKETS:
                capture_complete = True
                if active_sniffer:
                    logger.info("Stopping sniffer as we've reached max packet count")
                    active_sniffer.stop()
        
    except Exception as e:
        logger.error(f"Error in packet_callback: {str(e)}")

def start_packet_capture(interface="Wi-Fi"):
    """Start capturing packets up to the MAX_PACKETS limit."""
    global current_packet_count, capture_complete, active_sniffer
    
    # Reset counters
    current_packet_count = 0
    capture_complete = False
    
    try:
        # Start the sniffer
        active_sniffer = AsyncSniffer(filter="ip", prn=packet_callback, store=False, iface=interface)
        active_sniffer.start()
        logger.info(f"Started packet sniffer, capturing up to {MAX_PACKETS} packets")
        return {"status": "started", "max_packets": MAX_PACKETS}
    except Exception as e:
        logger.error(f"Error starting sniffer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start packet capture: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize the application but don't start capture until requested."""
    logger.info("Application started, ready to capture packets on request")

@app.post("/start-capture")
async def start_capture():
    """Endpoint to start the packet capture."""
    try:
        result = start_packet_capture()
        # Start CSV saver
        asyncio.create_task(save_to_csv_periodically())
        return result
    except Exception as e:
        logger.error(f"Error in start_capture endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/capture-status")
async def get_capture_status():
    """Get the current status of the packet capture."""
    return {
        "current_count": current_packet_count,
        "max_packets": MAX_PACKETS,
        "complete": capture_complete
    }

@app.websocket("/ws/packets")
async def websocket_packets(websocket: WebSocket):
    """WebSocket endpoint to stream packet predictions in real-time."""
    await websocket.accept()
    logger.info("WebSocket connected")
    try:
        while True:
            if not packet_queue.empty():
                packet_data = packet_queue.get()
                await websocket.send_json(packet_data)
            
            # Send status update every second
            await websocket.send_json({
                "type": "status_update",
                "current_count": current_packet_count,
                "max_packets": MAX_PACKETS,
                "complete": capture_complete
            })
            
            # If capture is complete and queue is empty, we can exit
            if capture_complete and packet_queue.empty():
                await websocket.send_json({
                    "type": "capture_complete",
                    "message": f"Capture of {MAX_PACKETS} packets completed"
                })
                break
                
            await asyncio.sleep(0.1)  # Prevent busy-waiting
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        await websocket.close()
        logger.info("WebSocket disconnected")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}