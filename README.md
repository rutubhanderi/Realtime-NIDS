# 🚀 Network Intrusion Detection System (NIDS) using CNN-LSTM

## 📖 Overview
This project implements a **Network Intrusion Detection System (NIDS)** by combining **Convolutional Neural Networks (CNN)** and **Long Short-Term Memory (LSTM)** networks to classify network traffic into different categories.  
The system supports both **live traffic analysis** and **CSV file uploads** for offline predictions.

---

## ✨ Features
- **Hybrid CNN-LSTM Model**: Extracts spatial and temporal patterns for robust attack detection.
- **Real-time Packet Analysis**: Captures and classifies live network traffic.
- **CSV Upload Support**: Predicts attacks from pre-recorded network flow data.
- **WebSocket Integration**: Real-time packet updates during live capture.
- **Attack Classification**:
  - Benign Traffic
  - DoS Attacks
  - DDoS Attacks
  - Port Scanning & Brute Force
  - Other Exploits & Infiltrations

---

## 🛠️ Technical Stack

### Backend
- FastAPI
- TensorFlow / Keras
- Scapy
- Pandas / Numpy
- Joblib

### Frontend
- React
- Vite
- WebSocket

---

## 📚 Dataset
- **Source**: Modified version of **CICIDS2017**.
- **Details**:
  - 746,117 network flow records
  - 78 features
  - 5 attack categories (plus benign traffic)

---

## 🧠 Model Architecture
- **Input Layer**: Accepts 50 selected features.
- **CNN Layers**:
  - Conv1D (32 filters, kernel size=3)
  - Batch Normalization
  - MaxPooling
  - Dropout (0.3)
- **LSTM Layer**: 32 units with Dropout (0.4)
- **Dense Layers**:
  - Dense (32 units) with L2 regularization
  - Batch Normalization
  - Dropout (0.5)
- **Output Layer**: Softmax activation for multi-class classification.

---

## 📈 Performance
- **Test Accuracy**: 94.8%
- **Precision (weighted)**: 97%
- **Recall (weighted)**: 96%
- **F1-Score (weighted)**: 96%

---

## 🚀 Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- TensorFlow 2.x

---

## ⚙️ Backend Setup

```bash
# Clone the repository
git clone <your-repo-link>

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

Download and place these files into the `backend/` directory:
- `best_optimized_cnn_lstm.h5`
- `scaler_optimized.pkl`
- `label_encoder_optimized.pkl`
- `selected_indices.pkl`

Run the FastAPI server:

```bash
uvicorn main:app --reload
```

---

## ⚙️ Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install frontend dependencies
npm install

# Run the development server
npm run dev
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|:------:|:---------|:------------|
| `POST` | `/start-capture` | Start live packet capture |
| `GET`  | `/capture-status` | Get current capture status |
| `POST` | `/predict-csv` | Upload CSV for predictions |
| `WS`   | `/ws/packets` | WebSocket for real-time packet updates |
| `GET`  | `/health` | Health check endpoint |

---

## 🎯 Usage

### Live Capture
- Start capture via `/start-capture`.
- Connect to WebSocket `/ws/packets` for real-time updates.
- Captures up to 50 packets by default (configurable).

### CSV Processing
- Upload a CSV to `/predict-csv`.
- Receive attack predictions for each flow.

---

## 🏋️‍♂️ Model Training (Optional)

```bash
# Ensure dataset is present at: data/resampled_dataset.csv

# Run the training script
python train_model.py
```
The script will:
- Preprocess data
- Perform feature selection
- Train the CNN-LSTM model
- Save the model and artifacts

---

## ⚙️ Configuration
Configuration parameters in `backend/main.py`:

- `MAX_PACKETS`: Maximum packets to capture in live mode (default: 50)
- `FEATURES`: List of 78 CICIDS2017 features
- `LABEL_MAPPING`: Mapping for attack categories

---

## 🔮 Future Improvements
- Advanced feature extraction for live packets
- Support for additional protocols
- Better handling of class imbalance
- Enhanced frontend dashboard
- Model explainability with visualization tools

---

## 📜 License
This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for more details.

---

# 🚀 Ready to Detect, Defend, and Secure!
