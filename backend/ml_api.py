import os
import joblib
import pandas as pd
import tensorflow as tf
import numpy as np
import traceback
import subprocess
import librosa
import soundfile as sf

from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==========================================
# LOAD MODELS & SCALERS (Unified Grouping)
# ==========================================
# 1. Questionnaire Model
model = joblib.load("ml_model/student_stress_model.pkl")
scaler = joblib.load("ml_model/scaler.pkl")
print("✅ Questionnaire model and scaler loaded")

# 2. Face Model (.h5)
face_model = tf.keras.models.load_model("ml_model/face_model.h5")
print("✅ Face stress model loaded")

# 3. Voice Model (.h5)
voice_model = tf.keras.models.load_model("ml_model/mental_health_cnn_lstm.h5")
print("✅ Voice stress model loaded")


# ==========================================
# CONSTANTS & CONFIGURATIONS
# ==========================================
FEATURES = [
    'anxiety_level', 'self_esteem', 'mental_health_history', 'depression',
    'headache', 'blood_pressure', 'sleep_quality', 'breathing_problem',
    'noise_level', 'living_conditions', 'safety', 'basic_needs',
    'academic_performance', 'study_load', 'teacher_student_relationship',
    'future_career_concerns', 'social_support', 'peer_pressure',
    'extracurricular_activities', 'bullying'
]

FACE_CLASSES = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]
VOICE_CLASSES = ["angry", "calm", "fear", "happy", "sad"]


# ==========================================
# FEATURE PREPROCESSING HELPERS
# ==========================================
def preprocess_face_image(image_file):
    """
    Processes raw file streams into standard normalized grayscale dimensions (1, 56, 56, 1)
    """
    img = Image.open(image_file).convert('L')
    img = img.resize((56, 56))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=-1)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def extract_mfcc_features(audio_path, max_pad=300):

    y, sr = librosa.load(audio_path, sr=22050)

    duration = librosa.get_duration(y=y, sr=sr)

    print(f"\n🎙️ Audio Duration: {round(duration,2)} sec")

    # Minimum 3 seconds required
    if duration < 3:
        raise Exception(
            f"Audio too short ({round(duration,2)} sec). Please record at least 3 seconds."
        )

    # Noise reduction
    y = librosa.effects.preemphasis(y)

    # Normalize volume
    y = librosa.util.normalize(y)

    mfcc = librosa.feature.mfcc(
        y=y,
        sr=sr,
        n_mfcc=40
    )

    if mfcc.shape[1] < max_pad:
        pad_width = max_pad - mfcc.shape[1]
        mfcc = np.pad(
            mfcc,
            ((0, 0), (0, pad_width)),
            mode='constant'
        )
    else:
        mfcc = mfcc[:, :max_pad]

    return mfcc


# ==========================================
# 0. ROOT HOME CHECK
# ==========================================
@app.route("/")
def home():
    return jsonify({
        "message": "ML API Running Successfully"
    })


# ==========================================
# 1. QUESTIONNAIRE PREDICTION ENDPOINT
# ==========================================
@app.route("/predict_stress", methods=["POST"])
def predict_stress():
    try:
        data = request.json
        print("\n📥 Incoming Questionnaire Data:", data)

        input_data = {}
        for feature in FEATURES:
            value = float(data.get(feature, 0))
            input_data[feature] = value

        df = pd.DataFrame([input_data])
        scaled_df = scaler.transform(df)

        prediction = int(model.predict(scaled_df)[0])
        probability = model.predict_proba(scaled_df)[0]
        confidence = round(max(probability) * 100)

        stress_map = {0: "Low Stress", 1: "Medium Stress", 2: "High Stress"}
        stress_label = stress_map.get(prediction, "Unknown")

        if prediction == 0:
            predicted_score = min(confidence, 35)
        elif prediction == 1:
            predicted_score = min(max(confidence, 40), 70)
        else:
            predicted_score = max(confidence, 75)

        response = {
            "prediction": prediction,
            "stress_label": stress_label,
            "predicted_score": predicted_score
        }

        print("\n✅ Final Questionnaire Response:", response)
        return jsonify(response)

    except Exception as e:
        print("\n❌ QUESTIONNAIRE ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


# ==========================================
# 2. FACE PREDICTION ENDPOINT
# ==========================================
# Save this update inside your ml_api.py configuration
@app.route("/predict_face_stress", methods=["POST"])
def predict_face_stress():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        image = request.files["image"]
        print(f"\n📸 [Flask Engine] Incoming raw buffer processing stream for file: {image.filename}")
        
        processed_image = preprocess_face_image(image)
        predictions = face_model.predict(processed_image)

        all_emotions = {}

        for i, emotion_name in enumerate(FACE_CLASSES):
             all_emotions[emotion_name] = round(
                float(predictions[0][i]) * 100,
                 2
            )

        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]) * 100)
        emotion = FACE_CLASSES[predicted_index]
        if emotion in ["Happy", "Neutral"]:
            stress_label = "Low Stress"
            predicted_score = 25
        elif emotion in ["Sad", "Fear", "Surprise"]:
            stress_label = "Medium Stress"
            predicted_score = 55
        else:
            stress_label = "High Stress"
            predicted_score = 85

        response = {
            "emotion": emotion,
            "confidence": round(confidence, 2),
            "all_emotions": all_emotions,
            "stress_label": stress_label,
            "predicted_score": predicted_score
        }
        
        print(f"🎯 [Flask Engine] Generated Facial Outcome -> Emotion: {emotion} | Score: {predicted_score}")
        print("\n📊 Face Probabilities")

        for emo, prob in all_emotions.items():
            print(f"{emo}: {prob}%")
        return jsonify(response)
    except Exception as e:
        print("\n❌ FACE API ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/predict_voice_stress", methods=["POST"])
def predict_voice_stress():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file uploaded"}), 400

        audio_file = request.files["audio"]
        print("Filename:", audio_file.filename)
        print("Content Type:", audio_file.content_type)
        print(f"\n🎙️ [Flask Engine] Incoming raw buffer processing stream for file: {audio_file.filename}")
        
        temp_path = "temp_voice_input.webm"
        audio_file.save(temp_path)
        with open(temp_path, "rb") as f:
            print("Header:", f.read(20))
        print("File exists:", os.path.exists(temp_path))
        print("File size:", os.path.getsize(temp_path), "bytes")
        wav_path = "converted_voice.wav"

        FFMPEG_PATH = r"C:\ffmpeg-8.1.1-essentials_build\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe"
        subprocess.run(
            [
                FFMPEG_PATH,
                "-y",
                "-i",
                temp_path,
                wav_path
            ],
            check=True
        )

        print("✅ Audio converted successfully")
        print("Converted file exists:", os.path.exists(wav_path))
        print("Converted size:", os.path.getsize(wav_path))

        features = extract_mfcc_features(wav_path)
  
        features = features[..., np.newaxis][np.newaxis, np.newaxis, ...]

        predictions = voice_model.predict(features)

        all_tones = {}

        for i, tone_name in enumerate(VOICE_CLASSES):
            all_tones[tone_name] = round(
                float(predictions[0][i]) * 100,
                2
            )

        predicted_index = int(np.argmax(predictions[0]))
        confidence = float(np.max(predictions[0]) * 100)
        detected_tone = VOICE_CLASSES[predicted_index]

        if os.path.exists(temp_path):
            os.remove(temp_path)

        if os.path.exists(wav_path):
            os.remove(wav_path)

        if detected_tone in ["calm", "happy"]:
            stress_label = "Low Stress"
            predicted_score = 30
        elif detected_tone in ["sad", "fear"]:
            stress_label = "Medium Stress"
            predicted_score = 60
        else:
            stress_label = "High Stress"
            predicted_score = 90

        response = {
            "detected_tone": detected_tone,
            "confidence": round(confidence, 2),
            "all_tones": all_tones,
            "stress_label": stress_label,
            "predicted_score": predicted_score
        }
        print(f"🎯 [Flask Engine] Generated Acoustic Outcome -> Tone: {detected_tone} | Score: {predicted_score}")
        print("\n📊 Voice Probabilities")

        for tone, prob in all_tones.items():
            print(f"{tone}: {prob}%")
        return jsonify(response)
    except Exception as e:
        print("\n❌ VOICE API ERROR:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
# ==========================================
# 4. COMBINED MULTI-MODAL ENDPOINT (80/10/10)
# ==========================================
@app.route("/predict_combined_stress", methods=["POST"])
def predict_combined_stress():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No input metrics provided"}), 400
            
        q_score = float(data.get("questionnaire_score", 0))
        f_score = float(data.get("face_score", 0))
        v_score = float(data.get("voice_score", 0))

        # ⭐ Enforced 80% Questionnaire, 10% Voice, 10% Face weighted math architecture
        combined_score = round((q_score * 0.80) + (v_score * 0.10) + (f_score * 0.10))

        if combined_score <= 35:
            overall_label = "Low Stress"
            risk_level = "Normal / Healthy"
        elif combined_score <= 70:
            overall_label = "Medium Stress"
            risk_level = "Moderate Risk (Needs Monitoring)"
        else:
            overall_label = "High Stress"
            risk_level = "High Risk (Attention Recommended)"

        response = {
            "overall_score": combined_score,
            "overall_stress_label": overall_label,
            "clinical_risk_level": risk_level,
            "breakdown": {
                "questionnaire_contribution": q_score,
                "voice_contribution": v_score,
                "face_contribution": f_score
            }
        }
        
        print("\n🌐 Weighted Multi-Modal Matrix Computed:", response)
        return jsonify(response)

    except Exception as e:
        print("\n❌ COMBINED EVALUATION ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


# ==========================================
# RUN SERVER
# ==========================================
if __name__ == "__main__":
    app.run(
    host="0.0.0.0",
    port=5001,
    debug=True,
    use_reloader=False
)