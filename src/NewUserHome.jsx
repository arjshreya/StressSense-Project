import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";
import "./AssessmentQuestions.css";

function NewUserHome() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { onAssessmentSubmit } = useOutletContext();
  const [message, setMessage] = useState("");
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const MIN_RECORDING_SECONDS = 5;
  const [recordingAnimation, setRecordingAnimation] =
  useState(false);
  const [voiceCaptured, setVoiceCaptured] =
  useState(false);
  
  // State variables tracking real-time sub-model scores
  const [faceScore, setFaceScore] = useState(0);
  const [voiceScore, setVoiceScore] = useState(0);
  const [capturedImagePreview, setCapturedImagePreview] = useState(null);
  // =====================================
  // FORM DATA
  // =====================================
  const [formData, setFormData] = useState({
    anxiety_level: 0,
    self_esteem: 0,
    depression: 0,
    mental_health_history: null,
    headache: null,
    blood_pressure: null,
    sleep_quality: null,
    breathing_problem:null,
    noise_level: null,
    living_conditions: "",
    safety: null,
    basic_needs: null,
    academic_performance: null,
    study_load: null,
    teacher_student_relationship: null,
    future_career_concerns: null,
    social_support: null,
    peer_pressure: null,
    extracurricular_activities: null,
    bullying: null,
  });

  const questions = [

    {
      key: "anxiety_level",
      question:
        "How often do you find yourself worrying about everyday things?",
      min: 0,
      max: 21,
      left: "Never",
      right: "Always"
    },
  
    {
      key: "self_esteem",
      question:
        "How confident do you generally feel about yourself and your abilities?",
      min: 0,
      max: 30,
      left: "Very Low Confidence",
      right: "Very High Confidence"
    },
  
    {
      key: "depression",
      question:
        "How often have you been feeling emotionally drained lately?",
      min: 0,
      max: 27,
      left: "Never",
      right: "Always"
    },
  
   
    {
      key: "mental_health_history",
      question: "Have you faced emotional or mental health challenges in the past?",
      options: [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Very Frequently"
      ]
    },
    
    {
      key: "headache",
      question: "How often do you experience headaches or tension during the week?",
      options: [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Very Often"
      ]
    },
    
    {
      key: "blood_pressure",
      question: "How often do you feel physically tense or under pressure?",
      options: [
        "Very Relaxed",
        "Mostly Relaxed",
        "Moderately Tense",
        "Very Tense",
        "Extremely Tense"
      ]
    },
    
    {
      key: "sleep_quality",
      question: "How would you describe your sleep during the past week?",
      options: [
        "Very Poor",
        "Poor",
        "Average",
        "Good",
        "Excellent"
      ]
    },
    
    {
      key: "breathing_problem",
      question: "Do you ever feel shortness of breath when facing challenges?",
      options: [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Very Often"
      ]
    },
    
    {
      key: "noise_level",
      question: "How distracting is the environment where you spend most of your day?",
      options: [
        "Very Quiet",
        "Mostly Quiet",
        "Moderately Noisy",
        "Noisy",
        "Very Noisy"
      ]
    },
    
    {
      key: "living_conditions",
      question: "How comfortable do you feel in your current living environment?",
      options: [
        "Very Uncomfortable",
        "Uncomfortable",
        "Average",
        "Comfortable",
        "Very Comfortable"
      ]
    },
    
    {
      key: "safety",
      question: "How safe and secure do you generally feel in your surroundings?",
      options: [
        "Very Unsafe",
        "Unsafe",
        "Neutral",
        "Safe",
        "Completely Safe"
      ]
    },
    
    {
      key: "basic_needs",
      question: "Are your daily needs such as food, rest, and resources being met?",
      options: [
        "Not At All",
        "Rarely",
        "Partially",
        "Mostly",
        "Completely"
      ]
    },
    
    {
      key: "academic_performance",
      question: "How satisfied are you with your recent academic performance?",
      options: [
        "Very Dissatisfied",
        "Dissatisfied",
        "Neutral",
        "Satisfied",
        "Very Satisfied"
      ]
    },
    
    {
      key: "study_load",
      question: "How manageable does your academic workload feel right now?",
      options: [
        "Very Difficult",
        "Difficult",
        "Manageable",
        "Easy",
        "Very Easy"
      ]
    },
    
    {
      key: "teacher_student_relationship",
      question: "How supported do you feel by your teachers or mentors?",
      options: [
        "Not Supported",
        "Slightly Supported",
        "Moderately Supported",
        "Well Supported",
        "Highly Supported"
      ]
    },
    
    {
      key: "future_career_concerns",
      question: "How worried are you about your future career or opportunities?",
      options: [
        "Not Worried",
        "Slightly Worried",
        "Moderately Worried",
        "Very Worried",
        "Extremely Worried"
      ]
    },
    
    {
      key: "social_support",
      question: "How much emotional support do you receive from family and friends?",
      options: [
        "No Support",
        "Little Support",
        "Moderate Support",
        "Strong Support",
        "Excellent Support"
      ]
    },
    
    {
      key: "peer_pressure",
      question: "Do you feel pressured by expectations from friends or classmates?",
      options: [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Always"
      ]
    },
    
    {
      key: "extracurricular_activities",
      question: "How actively involved are you in activities outside academics?",
      options: [
        "Not Active",
        "Slightly Active",
        "Moderately Active",
        "Active",
        "Very Active"
      ]
    },
    
    {
      key: "bullying",
      question: "Have you experienced teasing, bullying, or unfair treatment recently?",
      options: [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Very Frequently"
      ]
    }
  
  ];

  const [currentQuestion, setCurrentQuestion] =
  useState(0);
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
    setCapturedImagePreview(imageData);
    setMessage("✅ Face image captured successfully.");
    stopWebcam();
    setMessage("Face image captured. Analyzing structure...");

    canvas.toBlob(async (blob) => {
      const imageForm = new FormData();
      imageForm.append("image", blob, "webcam_snap.jpg");
      try {
        const res = await axios.post("http://127.0.0.1:5001/predict_face_stress", imageForm, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setFaceScore(res.data.predicted_score); 
        setMessage("Face analyzed! Emotion");
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
    setRecordingAnimation(true);
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
      setTimeout(() => {

        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          stopRecording();
        }
      
      }, 5000);

      setRecordingStartTime(Date.now());
      setIsRecording(true);
      setMessage("Speak naturally for at least 5 seconds in a quiet environment.");
    } catch (err) {
      setMessage("Microphone access denied");
    }
  };

  const stopRecording = () => {
    const duration = (Date.now() - recordingStartTime) / 1000;
    setRecordingAnimation(false);
    if (duration < MIN_RECORDING_SECONDS) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setMessage(`Audio too short (${duration.toFixed(1)} sec). Please record at least 5 seconds and try again.`);
      return;
    }
  
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
  
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        setCapturedAudioBase64(reader.result);
        setVoiceCaptured(true);
        setMessage("Voice file compiled. Processing acoustic features...");
  
        const audioForm = new FormData();
        audioForm.append("audio", audioBlob, "voice_input.webm");
  
        try {
          const res = await axios.post("http://127.0.0.1:5001/predict_voice_stress", audioForm, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          setVoiceScore(res.data.predicted_score);
          setMessage("Voice analysis complete!");
        } catch (err) {
          console.error(err);
          setMessage("Acoustic pipeline analysis failed.");
        }
      };
    };
  
    setIsRecording(false);
  };
  const progressPercentage =
    currentQuestion >= questions.length
      ? 100
      : ((currentQuestion + 1) / questions.length) * 100;

  const sliderQuestions = [
    "anxiety_level",
    "depression",
    "self_esteem"
  ];
      
      const currentQ = questions[currentQuestion];
  // =====================================
  // SUBMIT FINAL EVALUATION
  // =====================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Processing combined assessment scores...");

    setMessage("Saving assets and calculating final multi-modal matrix...");
    try {
      const userData = JSON.parse(localStorage.getItem("userData")) || {};
      
      let warningMessage = "";

      const unanswered = Object.entries(formData)
      .filter(([key, value]) => value === null || value === "")
      .map(([key]) => key);

      if (unanswered.length > 0) {
        warningMessage +=
        `${unanswered.length} questionnaire responses were skipped. `;
    }

      if (!capturedImageBase64 && !capturedAudioBase64) {
        warningMessage =
          "Prediction generated without face and voice analysis. Accuracy may be lower.";
      }
      else if (!capturedImageBase64) {
        warningMessage =
          "Prediction generated without face analysis. Accuracy may be slightly lower.";
      }
      else if (!capturedAudioBase64) {
        warningMessage =
          "Prediction generated without voice analysis. Accuracy may be slightly lower.";
      }

      const payload = {
        userId: userData.userId,

        warning: warningMessage,

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

        face_score: faceScore,
        voice_score: voiceScore,
      };

      console.log("📤 Sending Complete Payload directly to Asset Interceptor Route:", payload);
      
      const response = await axios.post("http://127.0.0.1:5000/api/assessment", payload);
      
      onAssessmentSubmit();
      navigate("/dashboard/results", { state: response.data });
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.message || "Prediction execution server tracking failed.");
    }

    
    };

  return (
    <div className="assessment-page">
      <div className="assessment-card">
    
        <form onSubmit={handleSubmit} noValidate>
        <div className="progress-container">

        <div className="progress-text">
          Question {Math.min(currentQuestion + 1, questions.length)}
          {" "}of{" "}
          {questions.length}
        </div>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${progressPercentage}%`
            }}
          />

        </div>

        </div>
          <div className="assistant-header">
          <h2>StressSense Assistant</h2>

          <p className="assistant-intro">
          👋 Hi there!

          I'm StressSense AI.

          I'll ask a few questions to better understand
          your emotional well-being and stress level.

          There are no right or wrong answers.
          Just answer honestly.
          </p>

          <p>
            Let's have a quick conversation about how things have been going lately.
          </p>
        </div>
        {currentQuestion < questions.length && (
  <div className="question-card">

    <div className="question-text">
      {questions[currentQuestion].question}
    </div>

    {sliderQuestions.includes(
      questions[currentQuestion].key
    ) ? (

      <>
        <div className="slider-container">

          <input
            className="stress-slider"
            type="range"
            min={questions[currentQuestion].min}
            max={questions[currentQuestion].max}
            value={
              formData[
                questions[currentQuestion].key
              ]
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                [
                  questions[currentQuestion].key
                ]: Number(e.target.value)
              })
            }
          />

        </div>

        <div className="slider-labels">
          <span className="left-label">
            {questions[currentQuestion].left}
          </span>

          <span className="right-label">
            {questions[currentQuestion].right}
          </span>
        </div>

        <div className="slider-value">
          Selected Value:
          {" "}
          {
            formData[
              questions[currentQuestion].key
            ]
          }
        </div>
      </>

    ) : (

      <div className="options-container">
      {currentQ.options.map((label, index) => (

          <button
            key={index}
            type="button"
            className={
              formData[
                questions[currentQuestion].key
              ] === index + 1
                ? "answer-option selected"
                : "answer-option"
            }
            onClick={() =>
              setFormData({
                ...formData,
                [
                  questions[currentQuestion].key
                ]: index + 1
              })
            }
          >
            {label}
          </button>

        ))}

      </div>

    )}

    <div className="navigation-buttons">

      <button
        type="button"
        disabled={currentQuestion === 0}
        onClick={() =>
          setCurrentQuestion(
            currentQuestion - 1
          )
        }
      >
        Previous
      </button>

      {currentQuestion < questions.length - 1 ? (

        <button
          type="button"
          onClick={() =>
            setCurrentQuestion(
              currentQuestion + 1
            )
          }
        >
          Next
        </button>

      ) : (

        <button
          type="button"
          onClick={() =>
            setCurrentQuestion(
              questions.length
            )
          }
        >
          Continue
        </button>

      )}

    </div>

  </div>
)}
{currentQuestion >= questions.length && (
  
        <>
          <div className="media-section">
            <h2>Face & Voice Analysis</h2>

            <div className="media-grid">

              {/* Face Capture */}
              <div className="media-card">
                <h3>Face Capture</h3>

                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="video-preview"
                  style={{
                    display: isCapturing ? "block" : "none",
                  }}
                />

                {!isCapturing ? (
                  <button
                    type="button"
                    className="media-btn"
                    onClick={startWebcam}
                  >
                    Start Webcam
                  </button>
                ) : (
                  <div className="button-group">
                    <button
                      type="button"
                      className="capture-btn"
                      onClick={captureImage}
                    >
                      Capture
                    </button>

                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={stopWebcam}
                    >
                      Stop
                    </button>
                  </div>
                )}
                {capturedImagePreview && (
                  <div className="captured-preview">
                    <img
                      src={capturedImagePreview}
                      alt="Captured Face"
                      className="captured-image"
                    />
                    <p className="success-text">
                      ✅ Face captured successfully
                    </p>
                  </div>
                )}
              </div>

              {/* Voice Recording */}
              <div className="media-card">
                <h3>Voice Recording</h3>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "10px",
                  }}
                >
                  Speak continuously for at least
                  5 seconds in a quiet environment.
                </p>
                {recordingAnimation && (

                    <div className="voice-wave">

                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>

                    </div>

                )}
                {!isRecording ? (
                  <button
                    type="button"
                    className="media-btn"
                    onClick={startRecording}
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    className="capture-btn"
                    onClick={stopRecording}
                  >
                    Stop Recording
                  </button>
                )}
              </div>
              {voiceCaptured && (
                <p className="success-text">
                  ✅ Voice recorded successfully
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
          >
            Predict Stress Level
          </button>
        </>
      )}
        </form>

        {message && <div className="dashboard-message">{message}</div>}
      </div>
    </div>
  
  );
}

export default NewUserHome;