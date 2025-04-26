Network Intrusion Detection System (NIDS) using CNN-LSTM
Overview

This project implements a Network Intrusion Detection System (NIDS) that combines Convolutional Neural Networks (CNN) and Long Short-Term Memory (LSTM) networks to classify network traffic into different attack categories. The system can process both live network traffic and uploaded CSV files containing network flow data.
Features

    Hybrid CNN-LSTM Model: Combines spatial feature extraction (CNN) with temporal pattern recognition (LSTM)

    Real-time Packet Analysis: Captures and analyzes live network traffic

    CSV Upload Support: Processes pre-recorded network flow data

    WebSocket Integration: Provides real-time updates during live capture

    Attack Classification: Identifies five main attack categories:

        Benign Traffic

        DoS Attacks

        DDoS Attacks

        Port Scanning & Brute Force

        Other Exploits & Infiltrations

Technical Stack
Backend

    FastAPI: High-performance web framework for building APIs

    TensorFlow/Keras: Deep learning framework for the CNN-LSTM model

    Scapy: Packet manipulation and capture

    Pandas/Numpy: Data processing and manipulation

    Joblib: Model persistence

Frontend

    React: JavaScript library for building user interfaces

    Vite: Fast frontend build tool

    WebSocket: Real-time communication with the backend

Dataset

The model was trained on a modified version of the CICIDS2017 dataset, which contains:

    746,117 network flow records

    78 network flow features

    5 attack categories (plus benign traffic)

Model Architecture

The optimized CNN-LSTM model consists of:

    Input Layer: Accepts 50 selected features (timesteps)

    CNN Layers:

        Conv1D (32 filters, kernel_size=3)

        Batch Normalization

        Max Pooling

        Dropout (0.3)

    LSTM Layer: 32 units with dropout (0.4)

    Dense Layers:

        Dense (32 units) with L2 regularization

        Batch Normalization

        Dropout (0.5)

    Output Layer: Softmax activation for multi-class classification

Performance

The model achieves:

    Test Accuracy: 94.8%

    Precision: 97% (weighted average)

    Recall: 96% (weighted average)

    F1-Score: 96% (weighted average)

Installation
Prerequisites

    Python 3.8+

    Node.js 14+

    TensorFlow 2.x

Backend Setup

    Clone the repository

    Create a virtual environment:
    bash

python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

Install dependencies:
bash

cd backend
pip install -r requirements.txt

Download the pre-trained models and place them in the backend directory:

    best_optimized_cnn_lstm.h5

    scaler_optimized.pkl

    label_encoder_optimized.pkl

    selected_indices.pkl

Run the FastAPI server:
bash

    uvicorn main:app --reload

Frontend Setup

    Navigate to the frontend directory:
    bash

cd frontend

Install dependencies:
bash

npm install

Run the development server:
bash

    npm run dev

API Endpoints

    POST /start-capture: Starts live packet capture

    GET /capture-status: Returns current capture status

    POST /predict-csv: Processes uploaded CSV file

    WS /ws/packets: WebSocket for real-time packet updates

    GET /health: Health check endpoint

Usage
Live Capture

    Start the capture via /start-capture endpoint

    Connect to the WebSocket at /ws/packets for real-time updates

    The system will capture up to 50 packets by default (configurable)

CSV Processing

    Upload a CSV file containing network flow data to /predict-csv

    The system will return predictions for each flow

Training the Model

To retrain the model:

    Ensure you have the dataset at data/resampled_dataset.csv

    Run the training script:
    bash

    python train_model.py

    The script will:

        Preprocess the data

        Perform feature selection

        Train the CNN-LSTM model

        Save the model and artifacts

Configuration

Key configuration parameters in backend/main.py:

    MAX_PACKETS: Maximum packets to capture in live mode (default: 50)

    FEATURES: List of 78 CICIDS2017 features

    LABEL_MAPPING: Mapping of attack categories

License

This project is licensed under the MIT License. See the LICENSE file for details.
Future Improvements

    Implement more sophisticated feature extraction for live packets

    Add support for additional network protocols

    Improve handling of class imbalance

    Develop a more comprehensive frontend dashboard

    Add model explainability features
