// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// ------------------------------------------
//  MONGODB CONNECTION (YOUR EXACT URI)
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
const validateEmailFormat = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePasswordStrength = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(password);

// ----------------------------------------------------
// 🎯 FUNCTION: Generate Recommendations Based on Stress
// ----------------------------------------------------
function getRecommendations(level) {
  // use numeric level (0-100)
  if (level <= 20) {
    return {
      category: "Very Low Stress",
      recommendations: [
        "You're managing stress really well.",
        "Maintain good sleep and exercise habits.",
        "Keep doing relaxing activities you enjoy.",
        "Continue balancing study and personal life."
      ]
    };
  } else if (level <= 40) {
    return {
      category: "Low Stress",
      recommendations: [
        "Try light meditation (5–10 minutes daily).",
        "Engage in hobbies or physical activities.",
        "Reduce unnecessary screen time.",
        "Stay socially connected with friends."
      ]
    };
  } else if (level <= 60) {
    return {
      category: "Moderate Stress",
      recommendations: [
        "Take short study breaks every 45–60 minutes.",
        "Increase physical exercise (20–30 minutes/day).",
        "Practice deep-breathing relaxation techniques.",
        "Create a realistic study schedule to avoid pressure."
      ]
    };
  } else if (level <= 80) {
    return {
      category: "High Stress",
      recommendations: [
        "Reduce academic workload if possible.",
        "Avoid excessive screen time before bed.",
        "Talk to a close friend or mentor about what's stressing you.",
        "Try guided meditation or mindfulness apps."
      ]
    };
  } else {
    return {
      category: "Very High Stress",
      recommendations: [
        "Seek professional counseling or therapist help.",
        "Avoid isolation — talk to family/friends regularly.",
        "Reduce caffeine, social media, and late-night screen time.",
        "Maintain a strict sleep routine (7–9 hours)."
      ]
    };
  }
}

// ------------------------------------------
// ML API URL (Python Service)
const ML_API_URL = "http://127.0.0.1:5001/predict_stress_score";

// helper to call ML API with timeouts and safe logging
async function callMlApi(payload) {
  try {
    const res = await axios.post(ML_API_URL, payload, { timeout: 8000 });
    return res.data;
  } catch (err) {
    // attach more info to error for easier debugging
    const message = err.response ? `ML status ${err.response.status}` : err.message;
    const e = new Error(`ML call failed: ${message}`);
    e.original = err;
    throw e;
  }
}

// ------------------- Routes below -------------------

// small health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// simplified predict proxy endpoint
app.post('/api/predict-stress', async (req, res) => {
  try {
    // forward body to ML API and return normalized shape
    const ml = await callMlApi(req.body);
    const predicted_score = Number(ml.predicted_score ?? ml.prediction ?? ml.score ?? 0);

    const rec = getRecommendations(predicted_score);

    return res.json({
      success: true,
      predicted_score,
      category: rec.category,
      recommendations: rec.recommendations
    });
  } catch (err) {
    console.error("❌ ML API Error (predict-stress):", err.message || err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch prediction from ML model",
      details: err.message
    });
  }
});

// ---------------------------------------------------
// 1. SEND PASSWORD RESET EMAIL
// ---------------------------------------------------
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message:
          "If a matching account was found, a password reset link has been sent.",
      });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: user.email,
      subject: 'StressSense Password Reset Request',
      html: `
        <p>You requested a password reset for your StressSense account.</p>
        <p>Click <a href="${resetLink}">this link</a> to reset your password:</p>
        <p>The link expires in 1 hour.</p>
      `,
    });

    res.status(200).json({
      message:
        "If a matching account was found, a password reset link has been sent.",
    });

  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Server error. Could not send reset email." });
  }
});

// ---------------------------------------------------
// 2. RESET PASSWORD USING TOKEN
// ---------------------------------------------------
app.post('/api/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.password = password; // hashing done in model pre-save hook
    await user.save();

    res.status(200).json({ message: "Password successfully reset." });

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(400).json({ message: "Invalid or expired reset link." });
  }
});

// ---------------------------------------------------
// 3. REGISTER USER
// ---------------------------------------------------
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!validateNameFormat(name))
      return res.status(400).json({ message: "Name must contain only letters." });

    if (!validateEmailFormat(email))
      return res.status(400).json({ message: "Invalid email format." });

    if (!validatePasswordStrength(password))
      return res.status(400).json({
        message:
          "Password must be 8+ chars with letters, numbers & symbols.",
      });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "User already exists." });

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ message: "Registration successful!" });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ---------------------------------------------------
// 4. LOGIN USER
// ---------------------------------------------------
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials." });

    const assessmentCount = await Assessment.countDocuments({ userId: user._id });

    res.status(200).json({
      message: "Login successful!",
      hasHistory: assessmentCount > 0,
      userData: {
        name: user.name,
        email: user.email,
        userId: user._id,
        profileImageBase64: user.profileImageBase64 || null,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ---------------------------------------------------
// 5. UPDATE PROFILE DATA (Name + Image)
// ---------------------------------------------------
app.post('/api/update-profile', async (req, res) => {
  try {
    const { userId, name, profileImageBase64 } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, profileImageBase64 },
      { new: true, runValidators: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found." });

    res.status(200).json({
      message: "Profile saved successfully!",
      userData: updatedUser,
    });

  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

// ---------------------------------------------------
// 6. SUBMIT ASSESSMENT (MAIN)
// ---------------------------------------------------
app.post('/api/assessment', async (req, res) => {
  try {
    const data = req.body;

    // Validate minimal shape
    if (!data.userId) return res.status(400).json({ message: "userId missing" });

    // call python model
    const mlResponse = await callMlApi({
      age: data.age,
      gender: data.gender,
      sleepHours: data.sleepHours,
      exerciseFrequency: data.exerciseFrequency,
      academicPressure: data.academicPressure,
      studyHours: data.studyHours,
      screenTime: data.screenTime,
      financialPressure: data.financialPressure
    });

    const predicted_score = Number(
      mlResponse.predicted_score ??
      mlResponse.prediction ??
      mlResponse.score ??
      0
    );
    
    const rec = getRecommendations(predicted_score);

    // Save assessment to DB with normalized numeric values
    const assessment = new Assessment({
      userId: data.userId,
      facialImageBase64: data.facialImageBase64 || null,
      voiceAudioBase64: data.voiceAudioBase64 || null,
      age: Number(data.age),
      gender: (data.gender || 'other').toLowerCase(),
      sleepHours: Number(data.sleepHours),
      exerciseFrequency: Number(data.exerciseFrequency),
      academicPressure: Number(data.academicPressure),
      financialPressure: Number(data.financialPressure),
      studyHours: Number(data.studyHours),
      screenTime: Number(data.screenTime),
      stressLevel: predicted_score
    });

    await assessment.save();

    return res.status(200).json({
      message: "Assessment saved",
      predicted_score,
      category: rec.category,
      recommendations: rec.recommendations,
      assessment
    });

  } catch (err) {
    console.error("❌ Assessment Error:", err);
    res.status(500).json({ error: "Error processing assessment", details: err.message });
  }
});

// ---------------------------------------------------
// 7. GET ASSESSMENT HISTORY FOR USER
// ---------------------------------------------------
app.get('/api/get-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Assessment.find({ userId }).sort({ createdAt: 1 });
    res.status(200).json({ hasHistory: history.length > 0, history });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ message: "Error fetching history" });
  }
});

// ---------------------------------------------------
//  START SERVER
// ---------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
