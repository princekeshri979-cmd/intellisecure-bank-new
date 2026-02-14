# 🏦 IntelliSecure Bank - AI-Powered Net Banking Platform

A production-grade AI-powered net banking platform demonstrating continuous authentication, behavior-based security, and ML-driven facial recognition.

---

## 🚀 Quick Start (Fast Setup)

We have optimized the installation to skip the heavy 2GB Visual Studio Build Tools requirement by using pre-compiled binaries.

### 1. Automated Setup (Recommended)
1.  Open **PowerShell** as Administrator in the project root.
2.  Run the automated setup script:
    ```powershell
    .\setup_project.ps1
    ```
    *This script handles virtual environments, dependency installation, and frontend setup.*

### 2. Manual Setup (The "No Build Tools" way)
If you are setting up manually and want facial recognition without installing C++ compilers:
1.  **Download the dlib wheel**:
    *   **Option A (Easy)**: Run the helper script in the backend folder:
        ```powershell
        python download_dlib_wheel.py
        ```
    *   **Option B (Manual)**: Find the `.whl` file for your Python version (e.g., `dlib-19.24.1-cp311-cp311-win_amd64.whl` for Python 3.11) from GitHub or other sources.
2.  **Install it in your venv**:
    ```powershell
    cd backend
    python -m venv venv
    .\venv\Scripts\activate
    pip install dlib-19.24.1-cp311-cp311-win_amd64.whl
    pip install -r requirements.txt
    pip install -r requirements-face.txt
    ```

---

## 🏗️ Project Structure

```
intellisecure-bank/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core utilities (config, security, database)
│   │   ├── ml/             # Machine learning models
│   ├── requirements.txt     # Global dependencies
│   └── .env                 # Environment variables
└── frontend/               # React.js Frontend
    ├── src/
    │   ├── components/     # UI components
    │   └── context/        # State management
    └── package.json
```

---

## 🔒 Key Features

### 👤 Advanced Authentication
- **Face Enrollment**: Encrypted biometric matching (embeddings only, no images stored).
- **Face-Based Auto-Login**: Quick access using facial recognition.
- **Facial CAPTCHA**: Active liveness detection challenges (blink, smile, turn head).
- **Continuous Auth**: Real-time behavioral monitoring via WebSockets.

### 🛡️ Threat Detection Engine
- **Isolation Forest ML**: Detects anomalous mouse/keystroke patterns.
- **Real-Time Scoring**: Adaptive security that locks sessions if threat levels rise.
- **Explainable Logic**: Transparent scoring based on IP drift, device mismatch, and behavior.

---

## 🛠️ Usage Guide

### Running the Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### Running the Frontend
```powershell
cd frontend
npm run dev
```

### Database
- **MongoDB**: Ensure MongoDB is running locally at `mongodb://localhost:27017` or update the `.env` file in the `backend` folder.

---

## 📋 Prerequisites
- **Python 3.10 - 3.12**
- **Node.js 18+**
- **MongoDB**

---

## 👤 Facial Recognition Setup (Optional)
If you encounter errors with `dlib` during setup, see the **[FACE_RECOGNITION_GUIDE.md](./FACE_RECOGNITION_GUIDE.md)** for the shortcut procedure to install pre-compiled binaries without needing Visual Studio Build Tools.

## 📝 License
This project is for educational and demonstration purposes.

## 👥 Authors
Built for **IntelliSecure Bank** - demonstrating production-grade security and AI integration.
