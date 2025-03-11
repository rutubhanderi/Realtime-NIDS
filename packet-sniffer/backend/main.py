from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import sniff, IP, TCP, UDP
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    "Avg Bwd Segment Size", "Fwd Header Length", "Fwd Avg Bytes/Bulk", "Fwd Avg Packets/Bulk",
    "Fwd Avg Bulk Rate", "Bwd Avg Bytes/Bulk", "Bwd Avg Packets/Bulk", "Bwd Avg Bulk Rate",
    "Subflow Fwd Packets", "Subflow Fwd Bytes", "Subflow Bwd Packets", "Subflow Bwd Bytes",
    "Init_Win_bytes_forward", "Init_Win_bytes_backward", "act_data_pkt_fwd",
    "min_seg_size_forward", "Active Mean", "Active Std", "Active Max", "Active Min",
    "Idle Mean", "Idle Std", "Idle Max", "Idle Min"
]

def extract_features(packet):
    """ Extracts CICIDS features from a packet """
    try:
        protocol = "TCP" if TCP in packet else "UDP" if UDP in packet else "Other"
        return {
            "Destination Port": packet.dport if hasattr(packet, 'dport') else None,
            "Flow Duration": packet.time,
            "Total Fwd Packets": 1,
            "Total Backward Packets": 0,
            "Total Length of Fwd Packets": len(packet),
            "Total Length of Bwd Packets": 0,
            "Fwd Packet Length Max": len(packet),
            "Fwd Packet Length Min": len(packet),
            "Fwd Packet Length Mean": len(packet),
            "Fwd Packet Length Std": 0,
            "Bwd Packet Length Max": 0,
            "Bwd Packet Length Min": 0,
            "Bwd Packet Length Mean": 0,
            "Bwd Packet Length Std": 0,
            "Flow Bytes/s": len(packet),
            "Flow Packets/s": 1,
            "Flow IAT Mean": 0,
            "Flow IAT Std": 0,
            "Flow IAT Max": 0,
            "Flow IAT Min": 0,
            "Fwd IAT Total": 0,
            "Fwd IAT Mean": 0,
            "Fwd IAT Std": 0,
            "Fwd IAT Max": 0,
            "Fwd IAT Min": 0,
            "Bwd IAT Total": 0,
            "Bwd IAT Mean": 0,
            "Bwd IAT Std": 0,
            "Bwd IAT Max": 0,
            "Bwd IAT Min": 0,
            "Fwd PSH Flags": 0,
            "Bwd PSH Flags": 0,
            "Fwd URG Flags": 0,
            "Bwd URG Flags": 0,
            "Fwd Header Length": len(packet),
            "Bwd Header Length": 0,
            "Fwd Packets/s": 1,
            "Bwd Packets/s": 0,
            "Min Packet Length": len(packet),
            "Max Packet Length": len(packet),
            "Packet Length Mean": len(packet),
            "Packet Length Std": 0,
            "Packet Length Variance": 0,
            "FIN Flag Count": 1 if "F" in packet.sprintf("%TCP.flags%") else 0,
            "SYN Flag Count": 1 if "S" in packet.sprintf("%TCP.flags%") else 0,
            "RST Flag Count": 1 if "R" in packet.sprintf("%TCP.flags%") else 0,
            "PSH Flag Count": 1 if "P" in packet.sprintf("%TCP.flags%") else 0,
            "ACK Flag Count": 1 if "A" in packet.sprintf("%TCP.flags%") else 0,
            "URG Flag Count": 1 if "U" in packet.sprintf("%TCP.flags%") else 0,
        }
    except Exception as e:
        print("Error extracting features:", e)
        return {}

def capture_packets(count=32):
    packets = sniff(count=count, filter="ip", iface="Wi-Fi")  # Change iface if needed
    return [extract_features(pkt) for pkt in packets]

@app.get("/capture")
def get_packets():
    packets = capture_packets()
    return packets
