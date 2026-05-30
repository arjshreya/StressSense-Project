import pickle
import numpy as np

# Load pickle object
with open("student_stress_model.pkl", "rb") as f:
    obj = pickle.load(f)

# Print object type
print("Object Type:", type(obj))

# If tuple/list -> model may be first item
if isinstance(obj, (tuple, list)):
    print("Tuple/List length:", len(obj))
    model = obj[0]

# If dictionary
elif isinstance(obj, dict):
    print("Keys:", obj.keys())
    model = obj.get("model")

# Otherwise assume directly model
else:
    model = obj

print("Model Type:", type(model))

# Sample input
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

# Predict
prediction = model.predict(sample)

print("Prediction:", prediction)

# Probability if supported
if hasattr(model, "predict_proba"):
    probabilities = model.predict_proba(sample)
    print("Probabilities:", probabilities)