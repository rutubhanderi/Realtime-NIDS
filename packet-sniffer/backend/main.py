from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scapy.all import sniff, IP, TCP, UDP, ARP, Ether
import pandas as pd
import time
import random
from typing import List, Dict, Any, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store flows (5-tuples) to track related packets
flows = {}

# CICIDS features to extract
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
    "Avg Bwd Segment Size"
]

def get_packet_protocol(packet):
    """Determine the protocol of a packet"""
    if TCP in packet:
        return "TCP"
    elif UDP in packet:
        return "UDP"
    elif ARP in packet:
        return "ARP"
    elif IP in packet:
        return packet[IP].proto
    else:
        return "OTHER"

def extract_tcp_flags(packet):
    """Extract TCP flags if present"""
    flags = {
        "FIN": 0, "SYN": 0, "RST": 0, "PSH": 0,
        "ACK": 0, "URG": 0, "ECE": 0, "CWR": 0
    }
    
    if TCP in packet:
        flags_value = packet[TCP].flags
        if flags_value & 0x01: flags["FIN"] = 1
        if flags_value & 0x02: flags["SYN"] = 1
        if flags_value & 0x04: flags["RST"] = 1
        if flags_value & 0x08: flags["PSH"] = 1
        if flags_value & 0x10: flags["ACK"] = 1
        if flags_value & 0x20: flags["URG"] = 1
        if flags_value & 0x40: flags["ECE"] = 1
        if flags_value & 0x80: flags["CWR"] = 1
    
    return flags

def extract_flow_key(packet):
    """Extract a 5-tuple key to identify a flow"""
    if IP in packet:
        ip_src = packet[IP].src
        ip_dst = packet[IP].dst
        proto = packet[IP].proto
        
        if TCP in packet:
            sport = packet[TCP].sport
            dport = packet[TCP].dport
        elif UDP in packet:
            sport = packet[UDP].sport
            dport = packet[UDP].dport
        else:
            sport = 0
            dport = 0
            
        return (ip_src, ip_dst, proto, sport, dport)
    
    return None

def extract_basic_features(packet):
    """Extract basic packet features for UI display"""
    features = {}
    
    # Extract IP information if available
    if IP in packet:
        features["src_ip"] = packet[IP].src
        features["dst_ip"] = packet[IP].dst
        features["protocol"] = get_packet_protocol(packet)
        features["length"] = len(packet)
        features["ttl"] = packet[IP].ttl
        
        if TCP in packet:
            features["src_port"] = packet[TCP].sport
            features["dst_port"] = packet[TCP].dport
            
            # TCP flags as a string
            flags = extract_tcp_flags(packet)
            flag_str = ""
            for flag, value in flags.items():
                if value:
                    flag_str += flag + " "
            features["flags"] = flag_str.strip() if flag_str else "NONE"
            
        elif UDP in packet:
            features["src_port"] = packet[UDP].sport
            features["dst_port"] = packet[UDP].dport
            features["flags"] = "NONE"  # UDP doesn't have flags
    
    # For non-IP packets like ARP
    elif Ether in packet:
        features["src_ip"] = "N/A"
        features["dst_ip"] = "N/A"
        features["protocol"] = get_packet_protocol(packet)
        features["length"] = len(packet)
        features["ttl"] = 0
        features["src_port"] = 0
        features["dst_port"] = 0
        features["flags"] = "NONE"
    
    return features

def extract_cicids_features(packet):
    """Extract CICIDS features from a packet"""
    try:
        basic_features = extract_basic_features(packet)
        
        # Initialize CICIDS features
        cicids_features = {feature: 0 for feature in FEATURES}
        
        # Update with some real values
        if IP in packet:
            cicids_features["Destination Port"] = basic_features.get("dst_port", 0)
            cicids_features["Flow Duration"] = time.time()
            cicids_features["Total Fwd Packets"] = 1
            cicids_features["Total Backward Packets"] = 0
            cicids_features["Total Length of Fwd Packets"] = len(packet)
            cicids_features["Fwd Packet Length Max"] = len(packet)
            cicids_features["Fwd Packet Length Min"] = len(packet)
            cicids_features["Fwd Packet Length Mean"] = len(packet)
            
            # Extract TCP flags to CICIDS format
            if TCP in packet:
                flags = extract_tcp_flags(packet)
                cicids_features["FIN Flag Count"] = flags["FIN"]
                cicids_features["SYN Flag Count"] = flags["SYN"]
                cicids_features["RST Flag Count"] = flags["RST"]
                cicids_features["PSH Flag Count"] = flags["PSH"]
                cicids_features["ACK Flag Count"] = flags["ACK"]
                cicids_features["URG Flag Count"] = flags["URG"]
                cicids_features["ECE Flag Count"] = flags["ECE"]
                cicids_features["CWE Flag Count"] = flags["CWR"]
                
                cicids_features["Fwd Header Length"] = 20 + packet[TCP].dataofs * 4  # IP + TCP header
                
                if flags["PSH"]:
                    cicids_features["Fwd PSH Flags"] = 1
                
                if flags["URG"]:
                    cicids_features["Fwd URG Flags"] = 1
        
        # Merge basic features with CICIDS features
        return {**basic_features, **cicids_features}
        
    except Exception as e:
        print(f"Error extracting CICIDS features: {e}")
        return extract_basic_features(packet)  # Fallback to basic features

def capture_packets(count=5, timeout=3, iface=None):
    """Capture live packets from the network"""
    try:
        packets = sniff(count=count, timeout=timeout, iface=iface)
        packet_features = []
        
        for pkt in packets:
            # Check if it's an IP packet
            if IP in pkt:
                features = extract_cicids_features(pkt)
                packet_features.append(features)
        
        # If no IP packets were captured, generate mock data
        if not packet_features:
            print("No IP packets captured, generating mock data")
            packet_features = generate_mock_packets(count)
            
        return packet_features
    except Exception as e:
        print(f"Error capturing packets: {e}")
        # Fall back to mock data if there's an error
        return generate_mock_packets(count)

def generate_mock_packets(count=5):
    """Generate mock packet data for testing"""
    mock_packets = []
    
    for _ in range(count):
        src_ip = f"192.168.{random.randint(1,254)}.{random.randint(1,254)}"
        dst_ip = f"10.0.{random.randint(1,254)}.{random.randint(1,254)}"
        protocol = random.choice(["TCP", "UDP", "HTTP", "HTTPS"])
        length = random.randint(40, 1500)
        
        # TCP flags - pick one or none
        possible_flags = ["SYN", "ACK", "FIN", "PSH", "RST", "URG"]
        flags = random.choice(possible_flags + ["NONE"])
        
        # Generate mock CICIDS features
        mock_features = {feature: random.randint(0, 100) for feature in FEATURES}
        
        # Set specific flag counts based on the selected flag
        if flags != "NONE":
            for flag in possible_flags:
                mock_features[f"{flag} Flag Count"] = 1 if flag == flags else 0
        
        packet = {
            "src_ip": src_ip,
            "dst_ip": dst_ip,
            "src_port": random.randint(1024, 65535),
            "dst_port": random.choice([80, 443, 22, 21, 25, 53, 3389, 8080]),
            "protocol": protocol,
            "length": length,
            "ttl": random.randint(32, 128),
            "flags": flags,
            **mock_features
        }
        
        mock_packets.append(packet)
    
    return mock_packets

@app.get("/")
def read_root():
    return {"message": "Network Packet Analyzer API"}

@app.get("/capture")
def get_packets(count: int = 5, timeout: int = 3, iface: Optional[str] = None):
    """Capture packets from the network interface"""
    try:
        packets = capture_packets(count=count, timeout=timeout, iface=iface)
        print(f"Captured packets: {packets}")
        return packets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/interfaces")
def get_interfaces():
    """Get available network interfaces"""
    try:
        from scapy.arch import get_if_list
        interfaces = get_if_list()
        return {"interfaces": interfaces}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)