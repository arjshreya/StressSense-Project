# -------------------------------------------------------------
# 1. IMPORT LIBRARIES
# -------------------------------------------------------------
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, BatchNormalization, Activation, MaxPooling2D, Dropout, Flatten, Dense
from tensorflow.keras.preprocessing.image import ImageDataGenerator

print("✅ Libraries Imported Successfully")

# -------------------------------------------------------------
# 2. CONFIGURE DATASETS
# -------------------------------------------------------------
# Update these paths to where your train and validation image folders are located
TRAIN_PATH = "./faceStressData/train"
VAL_PATH = "./faceStressData/test"  # Points to your test folder for validation
BATCH_SIZE = 256
EPOCHS = 50

# Image preprocessing generators
train_datagen = ImageDataGenerator(rescale=1./255, horizontal_flip=True)
test_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    TRAIN_PATH,
    target_size=(56, 56),
    color_mode="grayscale",
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

validation_generator = test_datagen.flow_from_directory(
    VAL_PATH,
    target_size=(56, 56),
    color_mode="grayscale",
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

# -------------------------------------------------------------
# 3. BUILD CNN ARCHITECTURE
# -------------------------------------------------------------
model = Sequential()

# Layer Set 1
model.add(Conv2D(64, (3, 3), padding='same', input_shape=(56, 56, 1)))
model.add(BatchNormalization())
model.add(Activation('relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))

# Layer Set 2
model.add(Conv2D(128, (5, 5), padding='same'))
model.add(BatchNormalization())
model.add(Activation('relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))

# Layer Set 3
model.add(Conv2D(512, (3, 3), padding='same'))
model.add(BatchNormalization())
model.add(Activation('relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))

# Layer Set 4
model.add(Conv2D(512, (3, 3), padding='same'))
model.add(BatchNormalization())
model.add(Activation('relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))

model.add(Flatten())

# Fully Connected Layer 1
model.add(Dense(256))
model.add(BatchNormalization())
model.add(Activation('relu'))
model.add(Dropout(0.25))

# Fully Connected Layer 2
model.add(Dense(512))
model.add(BatchNormalization())
model.add(Activation('relu'))
model.add(Dropout(0.25))

# Output Layer (7 emotion classes)
model.add(Dense(7, activation='softmax'))

model.compile(optimizer="Adam", loss='categorical_crossentropy', metrics=['accuracy'])
print("✅ CNN Model Compiled Successfully")

# -------------------------------------------------------------
# 4. TRAIN MODEL
# -------------------------------------------------------------
print("🚀 Starting Face Model Training...")
model.fit(train_generator, epochs=EPOCHS, validation_data=validation_generator)
print("✅ Training Completed!")

# -------------------------------------------------------------
# 5. AUTOMATICALLY SAVE AS H5
# -------------------------------------------------------------
# Directing the save straight into your backend ml_model folder
output_path = "./backend/ml_model/face_model.h5"
model.save(output_path)

print(f"✅ Face Model Automatically Saved to: {output_path}")