import os
import joblib
import pandas as pd
import tensorflow as tf
import numpy as np
import cv2
import traceback
import subprocess
import librosa
import soundfile as sf
import base64
from datetime import datetime

from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configure permanent file directories
UPLOAD_IMAGE_DIR = os.path.join(os.getcwd(), "stored_assets", "images")
UPLOAD_AUDIO_DIR = os.path.join(os.getcwd(), "stored_assets", "audio")

# Automatically generate folders at runtime if missing
os.makedirs(UPLOAD_IMAGE_DIR, exist_ok=True)
os.makedirs(UPLOAD_AUDIO_DIR, exist_ok=True)

def save_base64_image(base64_str, user_id):
    if not base64_str or "base64," not in base64_str:
        return "No image captured"
    try:
        # Strip browser metadata header (e.g., "data:image/jpeg;base64,")
        header, encoded = base64_str.split("base64,")
        file_data = base64.b64decode(encoded)
        
        # Create a unique timestamped filename
        filename = f"face_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        file_path = os.path.join(UPLOAD_IMAGE_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        # This string path is what goes to MongoDB
        return f"stored_assets/images/{filename}"
    except Exception as e:
        print("Error writing image asset to disk:", e)
        return "Error saving image"

def save_base64_audio(base64_str, user_id):
    if not base64_str or "base64," not in base64_str:
        return "No voice recorded"
    try:
        # Strip browser metadata header (e.g., "data:audio/webm;base64,")
        header, encoded = base64_str.split("base64,")
        file_data = base64.b64decode(encoded)
        
        filename = f"voice_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.webm"
        file_path = os.path.join(UPLOAD_AUDIO_DIR, filename)
        
        with open(file_path, "wb") as f:
            f.write(file_data)
            
        return f"stored_assets/audio/{filename}"
    except Exception as e:
        print("Error writing audio asset to disk:", e)
        return "Error saving audio"

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

cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)

def preprocess_face_image(image_file):
    """
    Dynamically detects, crops (zooms), grayscales, and normalizes raw webcam streams
    to match the exact spatial composition of the training dataset.
    """
    try:
        # 1. Convert incoming file stream to an OpenCV BGR Image matrix
        pil_img = Image.open(image_file).convert('RGB')
        open_cv_image = np.array(pil_img)
        # Convert RGB to BGR format for OpenCV compatibility
        img_bgr = open_cv_image[:, :, ::-1].copy()
        
        # 2. Convert to grayscale for detection and preprocessing uniformity
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        
        # 3. Detect faces in the image layout
        # scaleFactor=1.1 specifies how much the image size is reduced at each image scale
        # minNeighbors=5 specifies how many neighbors each candidate rectangle should have to retain it
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) > 0:
            print(f"🎯 [Face Preprocessor] Successfully detected {len(faces)} face(s). Extracting bounding box crop...")
            # Extract coordinates of the primary bounding box (largest face or first detected)
            x, y, w, h = faces[0]
            
            # Crop the image strictly to the detected face bounds (this creates the automated zoom effect!)
            processed_img = gray[y:y+h, x:x+w]
        else:
            print("⚠️ [Face Preprocessor] No face detected in raw stream buffer. Falling back to global center crop...")
            # Fallback fallback: if the user sits in low lighting and detection fails, use the center block
            processed_img = gray

        # 4. Downscale matrix to the exact target input dimensions required by your face_model.h5
        resized_img = cv2.resize(processed_img, (56, 56), interpolation=cv2.INTER_AREA)
        
        # 5. Normalize voxel intensities from [0, 255] to [0.0, 1.0] float bounds
        img_array = resized_img / 255.0
        
        # 6. Reshape to match the exact tensor dimensions required by Keras/TensorFlow -> (Batch, Height, Width, Channels)
        img_array = np.expand_dims(img_array, axis=-1)  # Reshapes to (56, 56, 1)
        img_array = np.expand_dims(img_array, axis=0)   # Reshapes to (1, 56, 56, 1)
        
        return img_array

    except Exception as e:
        print(f"❌ Critical error during facial ROI extraction: {str(e)}")
        # Ultimate baseline fallback matrix matching expected structure
        return np.zeros((1, 56, 56, 1))

def extract_mfcc_features(audio_path, max_pad=300):
    y, sr = librosa.load(audio_path, sr=22050)
    duration = librosa.get_duration(y=y, sr=sr)
    print(f"\n🎙️ Audio Duration: {round(duration,2)} sec")

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
            all_emotions[emotion_name] = round(float(predictions[0][i]) * 100, 2)

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
        return jsonify(response)
    except Exception as e:
        print("\n❌ FACE API ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


# ==========================================
# 3. VOICE PREDICTION ENDPOINT
# ==========================================
@app.route("/predict_voice_stress", methods=["POST"])
def predict_voice_stress():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file uploaded"}), 400

        audio_file = request.files["audio"]
        print(f"\n🎙️ [Flask Engine] Incoming raw buffer processing stream for file: {audio_file.filename}")
        
        temp_path = "temp_voice_input.webm"
        audio_file.save(temp_path)
        wav_path = "converted_voice.wav"

        FFMPEG_PATH = r"C:\ffmpeg-8.1.1-essentials_build\ffmpeg-8.1.1-essentials_build\bin\ffmpeg.exe"
        subprocess.run(
            [FFMPEG_PATH, "-y", "-i", temp_path, wav_path],
            check=True
        )

        features = extract_mfcc_features(wav_path)
        features = features[..., np.newaxis][np.newaxis, np.newaxis, ...]

        predictions = voice_model.predict(features)

        all_tones = {}
        for i, tone_name in enumerate(VOICE_CLASSES):
            all_tones[tone_name] = round(float(predictions[0][i]) * 100, 2)

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
# ⭐ UNIFIED ASSET SAVE AND EVALUATION PIPELINE
# ==========================================
@app.route("/api/assessment", methods=["POST"])
def save_assessment():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No assessment data provided"}), 400

        user_id = data.get("userId", "anonymous")
        
        # 1. Extract raw Base64 data arrays passed from frontend
        raw_face_base64 = data.get("facialImageBase64")
        raw_voice_base64 = data.get("voiceAudioBase64")
        
        # 2. Execute file extraction pipeline (Decodes Base64 -> Hard Drive Files)
        saved_image_path = save_base64_image(raw_face_base64, user_id)
        saved_audio_path = save_base64_audio(raw_voice_base64, user_id)
        
        # Get individual model metrics already captured in state
        face_score = float(data.get("face_score", 0))
        voice_score = float(data.get("voice_score", 0))
        
        # Calculate questionnaire baseline directly
        input_data = {}
        missing_fields = []

        for feature in FEATURES:

            value = data.get(feature)

            if value is None or value == "":
                input_data[feature] = None
                missing_fields.append(feature)

            else:
                try:
                    input_data[feature] = float(value)
                except (ValueError, TypeError):
                    input_data[feature] = None
                    missing_fields.append(feature)
        
        # Replace unanswered fields with neutral values
        for feature in FEATURES:
            if input_data[feature] is None:

                if feature == "anxiety_level":
                    input_data[feature] = 10

                elif feature == "depression":
                    input_data[feature] = 13

                elif feature == "self_esteem":
                    input_data[feature] = 15

                else:
                    input_data[feature] = 3

        df = pd.DataFrame([input_data])
        scaled_df = scaler.transform(df)
        q_prediction = int(model.predict(scaled_df)[0])
        q_probability = model.predict_proba(scaled_df)[0]
        q_confidence = round(max(q_probability) * 100)
        
        if q_prediction == 0:
            q_score = min(q_confidence, 35)
        elif q_prediction == 1:
            q_score = min(max(q_confidence, 40), 70)
        else:
            q_score = max(q_confidence, 75)
            
        # Compute dynamic 80/10/10 Late Fusion ensemble score
        combined_score = round((q_score * 0.80) + (voice_score * 0.10) + (face_score * 0.10))
        
        if combined_score <= 35:
            overall_label = "Low Stress"
            risk_level = "Normal / Healthy"
        elif combined_score <= 70:
            overall_label = "Medium Stress"
            risk_level = "Moderate Risk (Needs Monitoring)"
        else:
            overall_label = "High Stress"
            risk_level = "High Risk (Attention Recommended)"

        warnings = []

        if len(missing_fields) > 0:
            warnings.append(
                f"{len(missing_fields)} questionnaire responses were not provided."
            )

        if not raw_face_base64:
            warnings.append(
                "Face analysis was not provided."
            )

        if not raw_voice_base64:
            warnings.append(
                "Voice analysis was not provided."
            )
        # 3. CONSTRUCT LIGHTWEIGHT OBJECT MAP FOR MONGODB
        mongodb_payload = {
            "userId": user_id,
            "facialImagePath": saved_image_path,  # Strings pointing to physical folder files
            "voiceAudioPath": saved_audio_path,   # Strings pointing to physical folder files
            "overall_score": combined_score,
            "overall_stress_label": overall_label,
            "clinical_risk_level": risk_level,
            
            # Form Features mapping
            "anxiety_level": input_data["anxiety_level"],
            "self_esteem": input_data["self_esteem"],
            "depression": input_data["depression"],
            "mental_health_history": input_data["mental_health_history"],
            "headache": input_data["headache"],
            "blood_pressure": input_data["blood_pressure"],
            "sleep_quality": input_data["sleep_quality"],
            "breathing_problem": input_data["breathing_problem"],
            "noise_level": input_data["noise_level"],
            "living_conditions": input_data["living_conditions"],
            "safety": input_data["safety"],
            "basic_needs": input_data["basic_needs"],
            "academic_performance": input_data["academic_performance"],
            "study_load": input_data["study_load"],
            "teacher_student_relationship": input_data["teacher_student_relationship"],
            "future_career_concerns": input_data["future_career_concerns"],
            "social_support": input_data["social_support"],
            "peer_pressure": input_data["peer_pressure"],
            "extracurricular_activities": input_data["extracurricular_activities"],
            "bullying": input_data["bullying"]
        }
        
        # db.assessments.insert_one(mongodb_payload)
        print(f"\n💾 Document Compiled Successfully! File system anchors tracked: {saved_image_path} | {saved_audio_path}")
        
        return jsonify({
            "overall_score": combined_score,
            "overall_stress_label": overall_label,
            "clinical_risk_level": risk_level,
            "warnings": warnings,
            "stress_label": overall_label,       
            "prediction": 0 if combined_score <= 35 else 1 if combined_score <= 70 else 2, 
            "predicted_score": combined_score,  
            "recommendations": [                
                "Practice deep breathing exercises regularly.",
                "Take structured short breaks from academic workloads.",
                "Ensure a consistent sleep schedule of 7-8 hours."
            ] if combined_score > 35 else ["Maintain your healthy habits!", "Keep balancing your routine successfully."],
            "breakdown": {
                "questionnaire_contribution": q_score,
                "voice_contribution": voice_score,
                "face_contribution": face_score
            }
        }), 200

    except Exception as e:
        print("\n❌ CORE ASSET PIPELINE FAILED:", str(e))
        traceback.print_exc()
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