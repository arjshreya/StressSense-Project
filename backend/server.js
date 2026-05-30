require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
const multer = require('multer'); // ⭐ Added to process file buffers

// Configure temporary memory storage for incoming file uploads
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------------------
//  MONGODB CONNECTION
// ------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB Atlas Connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ------------------------------------------
//  MIDDLEWARE
// ------------------------------------------
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// ------------------------------------------
//  MODELS
// ------------------------------------------
const User = require('./models/User');
const Assessment = require('./models/Assessment');

// ------------------------------------------
//  VALIDATIONS
// ------------------------------------------
const validateNameFormat = (name) => /^[A-Za-z\s]+$/.test(name);
const validateEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePasswordStrength = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(password);

// ------------------------------------------
// 🌍 PYTHON ML API BASE PATH URLS
// ------------------------------------------
const PYTHON_ML_URL = "http://127.0.0.1:5001";

// ------------------- Helper Routes -------------------
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Add these logs inside your server.js methods to match your description
app.post('/api/predict-face', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file caught by gateway" });

    console.log("\n📸 [Node Gateway] Received Image Binary Stream from Frontend");
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    form.append('image', blob, req.file.originalname);

    const mlRes = await axios.post(`${PYTHON_ML_URL}/predict_face_stress`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    console.log("✅ [Node Gateway] Face Model Prediction successful:", mlRes.data);
    return res.json(mlRes.data);
  } catch (err) {
    console.error("❌ Face Proxy Routing Failure:", err.message);
    return res.status(500).json({ error: "Face prediction execution failed" });
  }
});

app.post('/api/predict-voice', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file caught by gateway" });

    console.log("\n🎙️ [Node Gateway] Received Audio Binary Stream from Frontend");
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    form.append('audio', blob, req.file.originalname);

    const mlRes = await axios.post(`${PYTHON_ML_URL}/predict_voice_stress`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    console.log("✅ [Node Gateway] Voice Model Prediction successful:", mlRes.data);
    return res.json(mlRes.data);
  } catch (err) {
    console.error("❌ Voice Proxy Routing Failure:", err.message);
    return res.status(500).json({ error: "Voice prediction execution failed" });
  }
});
// ---------------------------------------------------
// 📋 MAIN COMPREHENSIVE ASSESSMENT SUBMISSION
// ---------------------------------------------------
app.post('/api/assessment', async (req, res) => {
  try {
    const data = req.body;
    if (!data.userId) return res.status(400).json({ message: "userId missing" });

    // ⭐ ADDED CLEAR TRACKING LOGS FOR INPUT DATA
    console.log("\n📊 [Node Gateway] Received Questionnaire Numerical Array from Frontend");
    console.log("📥 Form Feature Payload Map:");
    console.log({
      anxiety_level: data.anxiety_level,
      self_esteem: data.self_esteem,
      depression: data.depression,
      academic_performance: data.academic_performance,
      study_load: data.study_load,
      bullying: data.bullying
      // Logs truncated in console for readability, passing all 20 features to Flask below
    });

    console.log("📤 Proxying feature vector to Python ML service...");
    
    // 1. Dispatch array matrix to Flask questionnaire model
    const qRes = await axios.post(`${PYTHON_ML_URL}/predict_stress`, {
      anxiety_level: parseFloat(data.anxiety_level || 0),
      self_esteem: parseFloat(data.self_esteem || 0),
      mental_health_history: Number(data.mental_health_history || 0),
      depression: parseFloat(data.depression || 0),
      headache: Number(data.headache || 0),
      blood_pressure: Number(data.blood_pressure || 0),
      sleep_quality: Number(data.sleep_quality || 0),
      breathing_problem: Number(data.breathing_problem || 0),
      noise_level: Number(data.noise_level || 0),
      living_conditions: Number(data.living_conditions || 0),
      safety: Number(data.safety || 0),
      basic_needs: Number(data.basic_needs || 0),
      academic_performance: Number(data.academic_performance || 0),
      study_load: Number(data.study_load || 0),
      teacher_student_relationship: Number(data.teacher_student_relationship || 0),
      future_career_concerns: Number(data.future_career_concerns || 0),
      social_support: Number(data.social_support || 0),
      peer_pressure: Number(data.peer_pressure || 0),
      extracurricular_activities: Number(data.extracurricular_activities || 0),
      bullying: Number(data.bullying || 0)
    });

    const qScore = Number(qRes.data.predicted_score || 0);
    const fScore = Number(data.face_score || 0); 
    const vScore = Number(data.voice_score || 0); 

    // ⭐ ADDED STEP-BY-STEP MODALITY LEVEL LOGGING
    console.log("✅ [Node Gateway] Questionnaire Model Prediction successful");
    console.log(`📊 Collected Modality Matrix Values -> Questionnaire: ${qScore} | Face: ${fScore} | Voice: ${vScore}`);
    console.log("📤 Dispatching matrix directly to Multi-Modal Aggregator Algorithm...");

    // 2. Fetch the final 80/10/10 comprehensive calculation metrics
    const combinedRes = await axios.post(`${PYTHON_ML_URL}/predict_combined_stress`, {
      questionnaire_score: qScore,
      face_score: fScore,
      voice_score: vScore
    });

    const finalLabel = combinedRes.data.overall_stress_label;
    const finalScore = combinedRes.data.overall_score;

    console.log(`🌐 [Node Gateway] Consolidated Outcome: ${finalLabel} (${finalScore}%)`);

    // 3. Select recommendations matching the overall aggregate assessment label
    let recommendations = [];
    if (finalLabel === "Low Stress") {
      recommendations = [
        "Maintain healthy daily routines.",
        "Continue regular sleep and exercise.",
        "Take short breaks while studying.",
        "Stay socially active."
      ];
    } else if (finalLabel === "Medium Stress") {
      recommendations = [
        "Practice meditation or deep breathing.",
        "Reduce screen time before sleep.",
        "Maintain a balanced study schedule.",
        "Take proper rest and hydration."
      ];
    } else {
      recommendations = [
        "Consider talking to a counselor or mentor.",
        "Reduce workload and stress triggers.",
        "Focus on proper sleep and mental relaxation.",
        "Spend more time with supportive people."
      ];
    }

    // 4. Record to Database
    const assessment = new Assessment({
      userId: data.userId,
      facialImageBase64: data.facialImageBase64 || null,
      voiceAudioBase64: data.voiceAudioBase64 || null,
      anxiety_level: Number(data.anxiety_level || 0),
      self_esteem: Number(data.self_esteem || 0),
      mental_health_history: Number(data.mental_health_history || 0),
      depression: Number(data.depression || 0),
      headache: Number(data.headache || 0),
      blood_pressure: Number(data.blood_pressure || 0),
      sleep_quality: Number(data.sleep_quality || 0),
      breathing_problem: Number(data.breathing_problem || 0),
      noise_level: Number(data.noise_level || 0),
      living_conditions: Number(data.living_conditions || 0),
      safety: Number(data.safety || 0),
      basic_needs: Number(data.basic_needs || 0),
      academic_performance: Number(data.academic_performance || 0),
      study_load: Number(data.study_load || 0),
      teacher_student_relationship: Number(data.teacher_student_relationship || 0),
      future_career_concerns: Number(data.future_career_concerns || 0),
      social_support: Number(data.social_support || 0),
      peer_pressure: Number(data.peer_pressure || 0),
      extracurricular_activities: Number(data.extracurricular_activities || 0),
      bullying: Number(data.bullying || 0),
      stressLevel: finalLabel,
      stressScore: finalScore
    });

    await assessment.save();
    console.log("💾 [Node Gateway] Complete Multi-Modal Record successfully committed to MongoDB Atlas.");

    return res.status(200).json({
      message: "Multi-Modal Assessment compiled and saved successfully",
      stress_label: finalLabel,
      stress_score: finalScore,
      recommendations,
      breakdown: combinedRes.data.breakdown,
      assessment
    });

  } catch (err) {
    console.error("❌ Comprehensive Evaluation Route Crash:", err.message);
    return res.status(500).json({
      success: false,
      error: "Error processing consolidated evaluation metrics",
      details: err.message
    });
  }
});
// ---------------------------------------------------
// 7. GET ASSESSMENT HISTORY FOR USER
// ---------------------------------------------------
app.get('/api/get-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Assessment.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      hasHistory: history.length > 0,
      history: history.map((item) => ({
        _id: item._id,
        createdAt: item.createdAt,
        stressLevel: item.stressLevel,
        stressScore: item.stressScore,
        anxiety_level: item.anxiety_level,
        self_esteem: item.self_esteem,
        mental_health_history: item.mental_health_history,
        depression: item.depression,
        headache: item.headache,
        blood_pressure: item.blood_pressure,
        sleep_quality: item.sleep_quality,
        breathing_problem: item.breathing_problem,
        noise_level: item.noise_level,
        living_conditions: item.living_conditions,
        safety: item.safety,
        basic_needs: item.basic_needs,
        academic_performance: item.academic_performance,
        study_load: item.study_load,
        teacher_student_relationship: item.teacher_student_relationship,
        future_career_concerns: item.future_career_concerns,
        social_support: item.social_support,
        peer_pressure: item.peer_pressure,
        extracurricular_activities: item.extracurricular_activities,
        bullying: item.bullying
      }))
    });
  } catch (err) {
    console.error("Get history error:", err);
    return res.status(500).json({ success: false, message: "Error fetching history" });
  }
});

// ------------------- Authentication Routes -------------------
app.post('/api/forgot-password', async (req, res) => { /* Entirely untouched */ });
app.post('/api/reset-password/:token', async (req, res) => { /* Entirely untouched */ });
app.post('/api/register', async (req, res) => { /* Entirely untouched */ });
app.post('/api/login', async (req, res) => { /* Entirely untouched */ });
app.post('/api/update-profile', async (req, res) => { /* Entirely untouched */ });

// ---------------------------------------------------
//  START SERVER
// ---------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});