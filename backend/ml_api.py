import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback
import logging

app = Flask(__name__)
CORS(app)

# -----------------------------
# CONFIG
# -----------------------------
PYTHON_PORT = 5001

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_model', 'student_stress_model.pkl')

# -----------------------------
# LOGGING
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_api")

# -----------------------------
# LOAD MODEL
# -----------------------------
STRESS_MODEL = None
MODEL_FEATURE_NAMES = None
try:
    logger.info(f"Loading model from → {MODEL_PATH}")
    STRESS_MODEL = joblib.load(MODEL_PATH)
    logger.info("✅ Model loaded successfully!")

    # If model has feature names recorded, use them to build a DataFrame
    if hasattr(STRESS_MODEL, "feature_names_in_"):
        MODEL_FEATURE_NAMES = list(STRESS_MODEL.feature_names_in_)
        logger.info(f"Model feature names detected: {MODEL_FEATURE_NAMES}")
    else:
        # Fallback: explicit feature order used in training notebook
        MODEL_FEATURE_NAMES = [
            'Age',
            'Gender_Encoded',
            'Study_Hours_Day',
            'Sleep Duration (Hours per night)',
            'Social Media Usage (Hours per day)',
            'Financial Stress',
            'Academic_Pressure',
            'Physical Exercise (Hours per week)'
        ]
        logger.warning("Model has no feature_names_in_; using fallback feature list.")
except Exception as e:
    logger.exception(f"❌ Error loading model: {e}")
    STRESS_MODEL = None
    MODEL_FEATURE_NAMES = None

# -----------------------------
# ENCODING MAP
# -----------------------------
# According to your notebook: Female=0, Male=1, Other=2
GENDER_MAP = {'female': 0, 'male': 1, 'other': 2}

# -----------------------------
# PREDICTION ROUTE
# -----------------------------
@app.route('/predict_stress_score', methods=['POST'])
def predict_stress_score():
    if STRESS_MODEL is None:
        return jsonify({'error': 'Model not loaded on server.'}), 500

    data = request.get_json(force=True, silent=True) or {}
    try:
        # 1. Extract inputs — be permissive about missing keys
        # NOTE: frontend sends daily study hours already (0-12)
        def to_float(x, default=0.0):
            if x is None or x == '':
                return float(default)
            try:
                return float(x)
            except Exception:
                return float(default)

        age = to_float(data.get('age', 0))
        sleep = to_float(data.get('sleepHours', 0))
        study = to_float(data.get('studyHours', 0))
        screen = to_float(data.get('screenTime', 0))
        exercise = to_float(data.get('exerciseFrequency', 0))
        academic = to_float(data.get('academicPressure', 0))
        financial = to_float(data.get('financialPressure', 0))

        gender_raw = (data.get('gender', 'other') or 'other').lower()
        gender_encoded = GENDER_MAP.get(gender_raw, 2)

        # 2. Build feature vector EXACTLY matching training order
        # Preferred: use MODEL_FEATURE_NAMES to construct dataframe (avoids sklearn warnings)
        # Map our feature names to the values used in training
        # Training FS order used in notebook:
        # ['Age','Gender_Encoded','Study_Hours_Day','Sleep Duration (Hours per night)',
        #  'Social Media Usage (Hours per day)','Financial Stress','Academic_Pressure','Physical Exercise (Hours per week)']
        feature_values = {
            'Age': age,
            'Gender_Encoded': gender_encoded,
            'Study_Hours_Day': study,
            'Sleep Duration (Hours per night)': sleep,
            'Social Media Usage (Hours per day)': screen,
            'Financial Stress': financial,
            'Academic_Pressure': academic,
            'Physical Exercise (Hours per week)': exercise
        }

        # Build DataFrame with the exact column order
        if MODEL_FEATURE_NAMES:
            df = pd.DataFrame([{col: feature_values.get(col, 0.0) for col in MODEL_FEATURE_NAMES}])
        else:
            # fallback ordering
            cols = list(feature_values.keys())
            df = pd.DataFrame([{c: feature_values[c] for c in cols}])

        # Predict
        pred = STRESS_MODEL.predict(df)[0]

        # Convert to 0-100 scale if model outputs [0..1]
        if pred <= 1.0:
            stress_score = float(pred * 100)
        else:
            stress_score = float(pred)

        stress_score = max(0.0, min(100.0, stress_score))

        return jsonify({
            "predicted_score": round(stress_score, 2),
            "status": "Prediction successful"
        })

    except Exception as e:
        tb = traceback.format_exc()
        logger.exception("❌ Prediction Error: %s", e)
        return jsonify({
            'error': 'Feature processing failed',
            'details': str(e),
            'traceback': tb
        }), 500


if __name__ == '__main__':
    logger.info("🚀 Starting Python ML API...")
    app.run(port=PYTHON_PORT)
