import joblib
import numpy as np

model = joblib.load("student_stress_model.pkl")

print("Model:", type(model))

sample = np.array([[
    20,  # age
    0,   # gender
    4,   # sleep
    0,   # exercise
    0,   # academic pressure
    3,   # study hours
    4,   # screen time
    0    # financial pressure
]])

prediction = model.predict(sample)

print("Prediction:", prediction)