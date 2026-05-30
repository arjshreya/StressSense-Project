import joblib
import pandas as pd

# LOAD MODEL
model = joblib.load("student_stress_model.pkl")

print("✅ Model Loaded")

# PRINT EXPECTED FEATURES
expected_features = list(model.feature_names_in_)

print("\nExpected Feature Order:")
print(expected_features)

# CREATE DATA USING DICTIONARY
data = {
    'Age': [20, 20],

    'Gender_Encoded': [1, 1],

    'Study_Hours_Day': [2, 12],

    'Sleep Duration (Hours per night)': [8, 3],

    'Social Media Usage (Hours per day)': [1, 10],

    'Financial Stress': [0, 4],

    'Academic_Pressure': [0, 2],

    'Physical Exercise (Hours per week)': [5, 0]
}

# CREATE DATAFRAME
samples = pd.DataFrame(data)

# FORCE EXACT COLUMN ORDER
samples = samples[expected_features]

print("\nINPUT DATA:")
print(samples)

# PREDICT
predictions = model.predict(samples)

print("\nPREDICTIONS:")
print(predictions)