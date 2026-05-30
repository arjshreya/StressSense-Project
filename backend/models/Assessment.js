const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // MEDIA
    facialImageBase64: {
        type: String,
        default: null
    },

    voiceAudioBase64: {
        type: String,
        default: null
    },

    // ML FEATURES
    anxiety_level: {
        type: Number,
        required: true,
        min: 0,
        max: 21
    },

    self_esteem: {
        type: Number,
        required: true,
        min: 0,
        max: 30
    },

    mental_health_history: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    depression: {
        type: Number,
        required: true,
        min: 0,
        max: 27
    },

    headache: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    blood_pressure: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    sleep_quality: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    breathing_problem: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    noise_level: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    living_conditions: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    safety: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    basic_needs: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    academic_performance: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    study_load: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    teacher_student_relationship: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    future_career_concerns: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    social_support: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    peer_pressure: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    extracurricular_activities: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    bullying: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },

    // OUTPUT
    stressLevel: {
        type: String,
        enum: ['Low Stress', 'Medium Stress', 'High Stress'],
        default: 'Low Stress'
    },

    stressScore: {
        type: Number,
        min: 0,
        max: 100
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;