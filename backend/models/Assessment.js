// backend/models/Assessment.js

const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    // Links this assessment back to the User collection
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // MEDIA STORAGE
    facialImageBase64:  { type: String, default: null },
    voiceAudioBase64:   { type: String, default: null },
    
    // BEHAVIORAL INPUTS
    age:                { type: Number, required: true, min: 10 },
    gender:             { type: String, enum: ['male', 'female', 'other'], required: true },
    sleepHours:         { type: Number, required: true, min: 0, max: 24 },
    exerciseFrequency:  { type: Number, required: true, min: 0,max:12 },
    academicPressure:   { type: Number,  required: true },
    financialPressure:  { type: Number, required: true },
    studyHours:         { type: Number, required: true, min: 0,max:12  },
    screenTime:         { type: Number, required: true, min: 0,max:12  },

    // ML/PREDICTION OUTPUTS
    stressLevel:        { type: Number, min: 0, max: 100 },
    
    // Metadata
    createdAt:          { type: Date, default: Date.now } 
});

const Assessment = mongoose.model('Assessment', assessmentSchema);
module.exports = Assessment;