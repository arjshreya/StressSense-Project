// src/NewUserHome.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Dashboard.css';

function NewUserHome({ onSubmit }) {
  const [formData, setFormData] = useState({
    age: '', gender: 'male', sleepHours: '', exerciseFrequency: '',
    academicPressure: '', studyHours: '', screenTime: '', financialPressure: ''
  });
  const navigate = useNavigate();


  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null); // ⭐ SHOW RESULT ON SAME PAGE

  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [capturedImageBase64, setCapturedImageBase64] = useState(null);
  const [capturedAudioBase64, setCapturedAudioBase64] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const startWebcam = async () => {
    setMessage('Accessing webcam...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCapturing(true);
        setMessage('Webcam active. Position your face.');
      }
    } catch (err) {
      setMessage('Error: Could not access webcam.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setMessage('');
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImageBase64(imageData);

      setMessage('Image captured!');
      stopWebcam();
    }
  };

  const startRecording = async () => {
    setMessage('Accessing microphone...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMessage('Recording started...');
    } catch (err) {
      setMessage('Error: Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMessage('Recording stopped. Processing audio...');

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setCapturedAudioBase64(reader.result);
          setMessage('Audio recorded successfully!');
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        };
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Submitting assessment...");
  
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userData.userId;
  
    if (!userId) {
      setMessage("Error: User ID not found. Please log in again.");
      return;
    }
  
    const toNum = (v) => (v === "" ? null : parseFloat(v));
  
    const payload = {
      userId,
      age: toNum(formData.age),
      gender: formData.gender.toLowerCase(),
      sleepHours: toNum(formData.sleepHours),
      exerciseFrequency: toNum(formData.exerciseFrequency),
      academicPressure: toNum(formData.academicPressure),
      studyHours: toNum(formData.studyHours),
      screenTime: toNum(formData.screenTime),
      financialPressure: toNum(formData.financialPressure),
      facialImageBase64: capturedImageBase64,
      voiceAudioBase64: capturedAudioBase64,
    };
  
    try {
      const res = await axios.post("/api/assessment", payload);
    
      // server returns { predicted_score, category, recommendations, ... }
      const { predicted_score, category, recommendations } = res.data;
    
      // navigate to the correct route that exists in App.js
      navigate("/dashboard/results", {
        state: {
          predicted_score: predicted_score ?? 0,
          category: category ?? "Unknown",
          recommendations: recommendations ?? []
        }
      });
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("Error: " + (error.response?.data?.message || error.message));
    }
    
  };
  
  return (
    <div className="dashboard-container">
      <div className="assessment-card">
        <h1 className="form-name">Stress Assessment Form</h1>
        <p className="subtitle">Provide details for your stress prediction.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-input">
              <label>Age</label>
              <input type="number" name="age" min="15" onChange={handleChange} required />
            </div>

            <div className="form-input">
              <label>Gender</label>
              <select name="gender" onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-input">
              <label>Sleep Hours</label>
              <input type="number" name="sleepHours" min="0" max="12" onChange={handleChange} required />
            </div>

            <div className="form-input">
              <label>Exercise Frequency</label>
              <input type="number" name="exerciseFrequency" min="0" max="12" onChange={handleChange} required />
            </div>

            <div className="form-input">
              <label>Academic Pressure</label>
              <div className="radio-group">
                <label><input type="radio" name="academicPressure" value="0" onChange={handleChange} defaultChecked /> 0</label>
                <label><input type="radio" name="academicPressure" value="1" onChange={handleChange} /> 1</label>
                <label><input type="radio" name="academicPressure" value="2" onChange={handleChange} /> 2</label>
              </div>
            </div>

            <div className="form-input">
              <label>Financial Pressure</label>
              <div className="radio-group">
                {[0, 1, 2, 3, 4].map(num => (
                  <label key={num}>
                    <input type="radio" name="financialPressure" value={num} onChange={handleChange} defaultChecked={num === 0} /> {num}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-input">
              <label>Study Hours</label>
              <input type="number" name="studyHours" min="0" max="12" onChange={handleChange} required />
            </div>

            <div className="form-input">
              <label>Screen Time</label>
              <input type="number" name="screenTime" min="0" max="12" onChange={handleChange} required />
            </div>

          </div>

          <div className="media-capture-section">
            <h3 className="section-title">Face & Voice Input</h3>

            <div className="media-capture-buttons">

              <div className="media-capture-box">
                <p className="box-title">Webcam</p>

                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="media-preview"
                  style={{ display: isCapturing ? 'block' : 'none' }}
                ></video>

                <div className="action-buttons">
                  {!isCapturing ? (
                    <button type="button" onClick={startWebcam} className="start-btn">Start Webcam</button>
                  ) : (
                    <>
                      <button type="button" onClick={captureImage} className="capture-btn">Capture Photo</button>
                      <button type="button" onClick={stopWebcam} className="cancel-btn">Stop</button>
                    </>
                  )}
                </div>
              </div>

              <div className="media-capture-box">
                <p className="box-title">Voice Recording</p>

                <div className="action-buttons">
                  {!isRecording ? (
                    <button type="button" onClick={startRecording} className="start-btn">Start Mic</button>
                  ) : (
                    <>
                      <div className="recording-indicator">Recording...</div>
                      <button type="button" onClick={stopRecording} className="capture-btn stop-recording">Stop</button>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          <button type="submit" className="submit-btn">Get Stress Prediction</button>
        </form>

        {message && <div className="dashboard-message">{message}</div>}

        {/* ⭐ SHOW PREDICTION RESULT BELOW FORM */}
        {result && (
          <div className="result-box">
            <h2>Stress Prediction Result</h2>
            <p><strong>Stress Score:</strong> {result.predicted_score}%</p>
            <p><strong>Category:</strong> {result.category}</p>

            <h4>Recommendations:</h4>
            <ul>
              {result.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

export default NewUserHome;
