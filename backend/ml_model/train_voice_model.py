# -------------------------------------------------------------
# 1. IMPORT LIBRARIES
# -------------------------------------------------------------
import os
import librosa
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, LSTM, Dense, Dropout, TimeDistributed

print("✅ Libraries Imported Successfully")

# -------------------------------------------------------------
# 2. FEATURE EXTRACTION PIPELINE
# -------------------------------------------------------------
DATASET_PATH = "./voice_data/"  # Update to your voice directory
CLASS_LABELS = ["angry", "calm", "fear", "happy", "sad"] # Update to match your actual folders
LABEL_MAPPING = {label: idx for idx, label in enumerate(CLASS_LABELS)}

def extract_mfcc_features(audio_file, max_pad=300):
    y, sr = librosa.load(audio_file, sr=None)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    if mfcc.shape[1] < max_pad:
        pad_width = max_pad - mfcc.shape[1]
        mfcc = np.pad(mfcc, ((0, 0), (0, pad_width)), mode='constant')
    else:
        mfcc = mfcc[:, :max_pad]
    return mfcc

# -------------------------------------------------------------
# 3. PREPARE DATASET
# -------------------------------------------------------------
print("🚀 Processing Audio Files (Extracting MFCCs)...")
X, y = [], []
for folder in CLASS_LABELS:
    folder_path = os.path.join(DATASET_PATH, folder)
    if not os.path.exists(folder_path):
        continue
    for file in os.listdir(folder_path):
        if file.endswith(".wav"):
            file_path = os.path.join(folder_path, file)
            features = extract_mfcc_features(file_path)
            X.append(features)
            y.append(LABEL_MAPPING[folder])

X = np.array(X)
y = np.array(y)

# One-hot encode targets for categorical crossentropy
y = tf.keras.utils.to_categorical(y, num_classes=len(CLASS_LABELS))

# Train/Test Split
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

# Reshape explicitly for CNN-LSTM: (batch, timesteps, features, width, channels)
X_train = X_train[..., np.newaxis][:, np.newaxis, ...]
X_val = X_val[..., np.newaxis][:, np.newaxis, ...]

print(f"✅ Data Shaped for CNN-LSTM: {X_train.shape}")

# -------------------------------------------------------------
# 4. BUILD CNN-LSTM MODEL
# -------------------------------------------------------------
model = Sequential([
    TimeDistributed(Conv2D(32, (3, 3), activation='relu'), input_shape=(1, 40, 300, 1)),
    TimeDistributed(MaxPooling2D((2, 2))),
    TimeDistributed(Conv2D(64, (3, 3), activation='relu')),
    TimeDistributed(MaxPooling2D((2, 2))),\n    TimeDistributed(Flatten()),
    LSTM(64, return_sequences=True),
    LSTM(32),
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(len(CLASS_LABELS), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
print("✅ CNN-LSTM Model Compiled Successfully")

# -------------------------------------------------------------
# 5. TRAIN AND AUTOMATICALLY SAVE
# -------------------------------------------------------------
print("🚀 Training Voice Model...")
model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=50, batch_size=32)
print("✅ Training Completed!")

output_path = "./backend/ml_model/mental_health_cnn_lstm.h5"
model.save(output_path)
print(f"✅ Voice Model Automatically Saved to: {output_path}")