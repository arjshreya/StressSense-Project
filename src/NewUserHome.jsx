import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

function NewUserHome() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [message, setMessage] = useState("");
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const MIN_RECORDING_SECONDS = 5;
  // ⭐ NEW STATE TRACKERS: Hold the model numbers once calculated
  const [faceScore, setFaceScore] = useState(0);
  const [voiceScore, setVoiceScore] = useState(0);

  // =====================================
  // FORM DATA
  // =====================================
  const [formData, setFormData] = useState({
    anxiety_level: 10,
    self_esteem: 15,
    depression: 13,
    mental_health_history: "",
    headache: "",
    blood_pressure: "",
    sleep_quality: "",
    breathing_problem: "",
    noise_level: "",
    living_conditions: "",
    safety: "",
    basic_needs: "",
    academic_performance: "",
    study_load: "",
    teacher_student_relationship: "",
    future_career_concerns: "",
    social_support: "",
    peer_pressure: "",
    extracurricular_activities: "",
    bullying: "",
  });

  const totalFields = Object.keys(formData).length;
  const defaultValues = {
    anxiety_level: 10, self_esteem: 15, depression: 13,
    mental_health_history: 0, headache: 0, blood_pressure: 0, sleep_quality: 0,
    breathing_problem: 0, noise_level: 0, living_conditions: 0, safety: 0,
    basic_needs: 0, academic_performance: 0, study_load: 0, teacher_student_relationship: 0,
    future_career_concerns: 0, social_support: 0, peer_pressure: 0, extracurricular_activities: 0, bullying: 0,
  };

  const completedFields = Object.keys(formData).filter((key) => formData[key] !== defaultValues[key]).length;
  const progressPercentage = Math.round((completedFields / totalFields) * 100);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [capturedImageBase64, setCapturedImageBase64] = useState(null);
  const [capturedAudioBase64, setCapturedAudioBase64] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  // =====================================
  // WEBCAM SETUP
  // =====================================
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCapturing(true);
      }
    } catch (err) {
      setMessage("Unable to access webcam");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const captureImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg");
    setCapturedImageBase64(imageData);
    stopWebcam();
    setMessage("Face image captured. Analyzing structure...");

    // ⭐ FIXED: Convert raw base64 data to blob and send to backend instantly
    canvas.toBlob(async (blob) => {
      const imageForm = new FormData();
      imageForm.append("image", blob, "webcam_snap.jpg");
      try {
        const res = await axios.post("/api/predict-face", imageForm, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setFaceScore(res.data.predicted_score); // Save to state layer
        setMessage(`Face analyzed! Emotion: ${res.data.emotion} (${res.data.stress_label})`);
      } catch (err) {
        console.error(err);
        setMessage("Face analysis server tracking failed.");
      }
    }, "image/jpeg");
  };

  // =====================================
  // AUDIO RECORDING SETUP
  // =====================================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100,
        }
      });
  
      mediaRecorderRef.current = new MediaRecorder(stream);
  
      audioChunksRef.current = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
  
      mediaRecorderRef.current.start();
  
      setRecordingStartTime(Date.now());
      setIsRecording(true);
  
      setMessage(
        "Speak naturally for at least 5 seconds in a quiet environment."
      );
  
    } catch (err) {
      setMessage("Microphone access denied");
    }
  };

  const stopRecording = () => {

    const duration =
      (Date.now() - recordingStartTime) / 1000;
  
    if (duration < MIN_RECORDING_SECONDS) {
  
      mediaRecorderRef.current.stop();
  
      setIsRecording(false);
  
      setMessage(
        `Audio too short (${duration.toFixed(1)} sec). Please record at least 5 seconds and try again.`
      );
  
      return;
    }
  
    mediaRecorderRef.current.stop();
  
    mediaRecorderRef.current.onstop = () => {
  
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm"
      });
  
      const reader = new FileReader();
  
      reader.readAsDataURL(audioBlob);
  
      reader.onloadend = async () => {
  
        setCapturedAudioBase64(reader.result);
  
        setMessage(
          "Voice file compiled. Processing acoustic features..."
        );
  
        const audioForm = new FormData();
  
        audioForm.append(
          "audio",
          audioBlob,
          "voice_input.webm"
        );
  
        try {
  
          const res = await axios.post(
            "/api/predict-voice",
            audioForm,
            {
              headers: {
                "Content-Type": "multipart/form-data"
              }
            }
          );
  
          setVoiceScore(res.data.predicted_score);
  
          setMessage(
            `Voice analysis complete! Tone: ${res.data.detected_tone}`
          );
  
        } catch (err) {
  
          console.error(err);
  
          setMessage(
            "Acoustic pipeline analysis failed."
          );
        }
      };
    };
  
    setIsRecording(false);
  };
  // =====================================
  // SUBMIT FINAL EVALUATION
  // =====================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing combined assessment scores...");

    try {
      const userData = JSON.parse(localStorage.getItem("userData")) || {};

      const payload = {
        userId: userData.userId,
        anxiety_level: formData.anxiety_level,
        self_esteem: formData.self_esteem,
        depression: formData.depression,
        mental_health_history: formData.mental_health_history > 2 ? 1 : 0,
        blood_pressure: formData.blood_pressure <= 1 ? 1 : formData.blood_pressure <= 3 ? 2 : 3,
        headache: formData.headache,
        sleep_quality: formData.sleep_quality,
        breathing_problem: formData.breathing_problem,
        noise_level: formData.noise_level,
        living_conditions: formData.living_conditions,
        safety: formData.safety,
        basic_needs: formData.basic_needs,
        academic_performance: formData.academic_performance,
        study_load: formData.study_load,
        teacher_student_relationship: formData.teacher_student_relationship,
        future_career_concerns: formData.future_career_concerns,
        social_support: formData.social_support,
        peer_pressure: formData.peer_pressure,
        extracurricular_activities: formData.extracurricular_activities,
        bullying: formData.bullying,

        facialImageBase64: capturedImageBase64,
        voiceAudioBase64: capturedAudioBase64,

        // ⭐ FIXED: Send the active state numerical scores to Node gateway
        face_score: faceScore,
        voice_score: voiceScore,
      };

      console.log("📤 Sending Payload from Frontend:", payload);
      const response = await axios.post("/api/assessment", payload);

      navigate("/dashboard/results", { state: response.data });
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Prediction execution failed");
    }
  };

  const renderSelect = (label, name, lowText, mediumText, highText) => (
    <div className="form-input">
      <label>{label}</label>
      <select name={name} value={formData[name]} onChange={handleChange}>
        <option value="">Select Option</option>
        <option value="0">Low / Never / Good</option>
        <option value="1">Mild</option>
        <option value="2">Moderate</option>
        <option value="3">High</option>
        <option value="4">Very High</option>
        <option value="5">Severe</option>
      </select>
      <div className="guide-text">
        <span><strong>Low:</strong> {lowText}</span>
        <span><strong>Medium:</strong> {mediumText}</span>
        <span><strong>High:</strong> {highText}</span>
      </div>
    </div>
  );

  const renderRangeInput = (label, name, min, max) => (
    <div className="form-input">
      <label>{label}</label>
      <input type="range" min={min} max={max} name={name} value={formData[name]} onChange={handleChange} />
      <div className="range-value">Selected Value: <strong>{formData[name]}</strong></div>
    </div>
  );

  return (
    <div className="assessment-page">
      <div className="assessment-card">
        <h1 className="form-name">AI Mental Stress Assessment</h1>
        <p className="subtitle">Answer honestly for better prediction accuracy.</p>

        <div className="progress-container">
          <div className="progress-header">
            <span>Assessment Progress</span>
            <span>{progressPercentage}% Completed</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-divider">
            <h2>Mental Health</h2>
            <p>Questions related to emotions, anxiety and psychological wellbeing.</p>
          </div>
          <div className="form-grid">
            {renderRangeInput("How anxious or worried do you usually feel?", "anxiety_level", 0, 21)}
            {renderRangeInput("How confident do you feel about yourself?", "self_esteem", 0, 30)}
            {renderRangeInput("How often do you feel sadness or hopelessness?", "depression", 0, 27)}
            {renderSelect("Do you have a previous mental health history?", "mental_health_history", "No history", "Some issues before", "Frequent mental health issues")}
          </div>

          <div className="section-divider">
            <h2>Physical Health</h2>
            <p>Questions related to body condition, sleep and physical stress symptoms.</p>
          </div>
          <div className="form-grid">
            {renderSelect("How often do you experience headaches?", "headache", "Rarely", "Sometimes", "Frequently")}
            {renderSelect("How often do you feel pressure physically?", "blood_pressure", "Relaxed", "Moderate tension", "High tension")}
            {renderSelect("How would you rate your sleep quality?", "sleep_quality", "Good sleep", "Average sleep", "Poor sleep")}
            {renderSelect("Do you experience breathing discomfort?", "breathing_problem", "Never", "Occasionally", "Frequently")}
          </div>

          <div className="section-divider">
            <h2>Environment & Lifestyle</h2>
            <p>Questions related to surroundings, safety and lifestyle conditions.</p>
          </div>
          <div className="form-grid">
            {renderSelect("How noisy is your environment?", "noise_level", "Quiet", "Moderately noisy", "Highly noisy")}
            {renderSelect("How comfortable are your living conditions?", "living_conditions", "Comfortable", "Average", "Very uncomfortable")}
            {renderSelect("How safe do you feel?", "safety", "Very safe", "Moderately safe", "Unsafe")}
            {renderSelect("Are your daily needs fulfilled?", "basic_needs", "Completely fulfilled", "Partially fulfilled", "Not fulfilled")}
          </div>

          <div className="section-divider">
            <h2>Academic & Social Life</h2>
            <p>Questions related to studies, relationships and social support.</p>
          </div>
          <div className="form-grid">
            {renderSelect("How satisfied are you academically?", "academic_performance", "Satisfied", "Average", "Very dissatisfied")}
            {renderSelect("How heavy is your workload?", "study_load", "Light", "Moderate", "Very heavy")}
            {renderSelect("Teacher-student relationship?", "teacher_student_relationship", "Very supportive", "Average", "Poor relationship")}
            {renderSelect("How worried are you about career?", "future_career_concerns", "Not worried", "Moderately worried", "Extremely worried")}
            {renderSelect("How much emotional support do you receive?", "social_support", "Strong support", "Average support", "No support")}
            {renderSelect("How much peer pressure do you experience?", "peer_pressure", "No pressure", "Moderate pressure", "Extreme pressure")}
            {renderSelect("How active are you in extracurricular activities?", "extracurricular_activities", "Very active", "Sometimes active", "Not active")}
            {renderSelect("Have you experienced bullying?", "bullying", "Never", "Sometimes", "Frequently")}
          </div>

          <div className="media-section">
            <h2>Optional Face & Voice Analysis</h2>
            <div className="media-grid">
              <div className="media-card">
                <h3>Face Capture</h3>
                <video ref={videoRef} autoPlay muted playsInline className="video-preview" style={{ display: isCapturing ? "block" : "none" }} />
                {!isCapturing ? (
                  <button type="button" className="media-btn" onClick={startWebcam}>Start Webcam</button>
                ) : (
                  <div className="button-group">
                    <button type="button" className="capture-btn" onClick={captureImage}>Capture</button>
                    <button type="button" className="cancel-btn" onClick={stopWebcam}>Stop</button>
                  </div>
                )}
              </div>

              <div className="media-card">
                <h3>Voice Recording</h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "10px"
                  }}
                >
                   Speak continuously for at least 5 seconds in a quiet environment.
                </p>
                {!isRecording ? (
                  <button type="button" className="media-btn" onClick={startRecording}>Start Recording</button>
                ) : (
                  <button type="button" className="capture-btn" onClick={stopRecording}>Stop Recording</button>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn">Predict Stress Level</button>
        </form>

        {message && <div className="dashboard-message">{message}</div>}
      </div>
    </div>
  );
}

export default NewUserHome;