# StressSense: Multi-Modal Student Stress Prediction System

StressSense is a full-stack web application designed to analyze and monitor student stress levels. It uses a unique multi-modal approach, combining behavioral data (user inputs) with physiological cues (facial expressions and voice analysis) to provide accurate stress assessments.

## 🌟 Key Features
* **Multi-Modal Prediction:** Integrates a Scikit-learn (`.pkl`) model for behavioral analysis with real-time biometric inputs.
* **Dynamic Dashboard:** Visualizes stress trends over time using interactive Line Charts (Chart.js).
* **Smart User Routing:** Differentiates between New Users (Initial Assessment) and Existing Users (History/Trends).
* **Secure Authentication:** Implements JWT-based sessions and environment-protected MongoDB connections.
* **Comprehensive Biometrics:** Supports webcam image capture and microphone recording for enhanced prediction accuracy.

## 🏗️ Technology Stack
* **Frontend:** React.js, React Router, Axios, Chart.js
* **Backend (Web):** Node.js, Express.js, MongoDB Atlas
* **Backend (AI/ML):** Python, Flask, Scikit-learn, Joblib
* **Version Control:** Git & GitHub

## 📂 Project Structure
```text
MegaProject/
├── frontend/           # React.js UI Components
├── backend/            
│   ├── models/         # Mongoose Schemas (User, Assessment)
│   ├── ml_model/       # Trained .pkl model files
│   ├── server.js       # Node.js API Gateway (Port 5000)
│   └── ml_api.py       # Python Flask ML Service (Port 5001)
├── .gitignore          # Rules for excluded files (.env, node_modules)
└── README.md           # Project Documentation

🚀 Installation & Setup
1. Prerequisites
Ensure you have the following installed:

Node.js (v14+)

Python (v3.8+)

Git

2. Environment Configuration
Create a .env file in the backend/ folder:

Code snippet
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_random_string
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
🏃 How to Run (Step-by-Step)
To run the project correctly, you must start the services in the following order using three separate terminals in VS Code:

Step 1: Start the ML Prediction Service (Python)
The Node.js server depends on this API to process stress scores.

'''Bash
# Terminal 1
cd backend
pip install flask joblib numpy pandas
python ml_api.py'''
Confirmed: You should see "Running on https://www.google.com/search?q=http://127.0.0.1:5001"

Step 2: Start the API Gateway (Node.js)
This handles your Database connection and Authentication.

'''Bash
# Terminal 2
cd backend
npm install
node server.js'''
Confirmed: You should see "Server running on port 5000" and "MongoDB Connected"

Step 3: Start the User Interface (React)
The final layer for user interaction.

'''Bash
# Terminal 3
cd frontend
npm install
npm start'''
Confirmed: Browser will open http://localhost:3000 automatically.

📝 License
This project was developed as a Computer Science Mega Project. All rights reserved.