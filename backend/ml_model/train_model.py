# -----------------------------
# IMPORT LIBRARIES
# -----------------------------
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# -----------------------------
# LOAD DATASET
# -----------------------------
dataframe = pd.read_csv("StressLevelDataset.csv")

print("✅ Dataset Loaded Successfully")
print(dataframe.head())

# -----------------------------
# FEATURES AND TARGET
# -----------------------------
X = dataframe.drop("stress_level", axis=1)

y = dataframe["stress_level"]

# -----------------------------
# SCALE FEATURES
# -----------------------------
scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)

# Save scaler
joblib.dump(scaler, "scaler.pkl")

print("✅ Scaler Saved")

# -----------------------------
# SPLIT DATASET
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled,
    y,
    test_size=0.2,
    random_state=42
)

# -----------------------------
# TRAIN MODEL
# -----------------------------
model = LogisticRegression(max_iter=3000)

model.fit(X_train, y_train)

print("✅ Model Trained Successfully")

# -----------------------------
# TEST MODEL
# -----------------------------
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print(f"✅ Model Accuracy: {accuracy * 100:.2f}%")

# -----------------------------
# SAVE MODEL
# -----------------------------
joblib.dump(model, "student_stress_model.pkl")

print("✅ Model Saved Successfully")

# -----------------------------
# SHOW FEATURES
# -----------------------------
print("\nFeature Names Used:")

print(list(X.columns))