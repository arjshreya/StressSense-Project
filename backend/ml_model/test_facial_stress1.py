import joblib

model = joblib.load("facial_stress_model1.pkl")

print(type(model))

if hasattr(model, "predict"):
    print("✅ Valid ML model")
else:
    print("❌ Not prediction model")
print(model.n_features_in_)
print(model.feature_names_in_ if hasattr(model, "feature_names_in_") else "No feature names")