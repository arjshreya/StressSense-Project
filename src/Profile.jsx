import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Profile.css";

function Profile() {
  const [userProfile, setUserProfile] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const [isEditing, setIsEditing] = useState(false); // <-- NEW STATE

  useEffect(() => {
    const raw = localStorage.getItem("userData");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      data._id = data._id ?? data.userId ?? null;
      data.userId = data.userId ?? data._id ?? null;
      setUserProfile(data);
      setPreviewImage(data.profileImageBase64 || null);
    } catch (e) {
      console.error("Failed parsing userData", e);
    }
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setUserProfile((prev) => ({ ...prev, profileImageBase64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    const idToSend = userProfile.userId ?? userProfile._id;
    if (!idToSend) return alert("User ID missing");

    const payload = {
      userId: idToSend,
      name: userProfile.name ?? "",
      profileImageBase64: ""
    };

    try {
      const res = await axios.post("/api/update-profile", payload);
      const updated = res.data.userData;

      updated._id = updated._id ?? updated.userId;
      updated.userId = updated.userId ?? updated._id;

      setUserProfile(updated);
      setPreviewImage(null);
      localStorage.setItem("userData", JSON.stringify(updated));

      alert("Photo deleted successfully!");
    } catch (err) {
      alert("Failed to delete photo");
    }
  };

  const handleSave = async () => {
    const idToSend = userProfile.userId ?? userProfile._id;
    if (!idToSend) return alert("User ID missing");

    const payload = {
      userId: idToSend,
      name: userProfile.name ?? "",
      profileImageBase64: previewImage || ""
    };

    try {
      const res = await axios.post("/api/update-profile", payload);
      const updated = res.data.userData;

      updated._id = updated._id ?? updated.userId;
      updated.userId = updated.userId ?? updated._id;

      setUserProfile(updated);
      localStorage.setItem("userData", JSON.stringify(updated));

      alert("Profile saved successfully!");
      setIsEditing(false); // <-- RETURN TO VIEW MODE
    } catch (err) {
      alert("Save failed!");
    }
  };

  return (
    <div className="profile-container">
      <h1>Your Profile</h1>

      <div className="profile-photo-section">
        <img
          src={previewImage || "/default-profile.png"}
          alt="Profile"
          className="profile-photo"
        />

        {/* SHOW ONLY IN EDIT MODE */}
        {isEditing && (
          <div className="buttons-row">
            <label className="btn update-btn">
              Update Photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
            </label>

            <button className="btn delete-btn" onClick={handleDeletePhoto}>
              Delete Photo
            </button>
          </div>
        )}
      </div>

      <div className="profile-fields">
        <label>Full Name:</label>
        <input
          type="text"
          value={userProfile.name ?? ""}
          onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
          disabled={!isEditing}
        />

        <label>Email Address:</label>
        <input type="text" value={userProfile.email ?? ""} disabled />

        <label>User ID:</label>
        <input type="text" value={userProfile._id ?? ""} disabled />
      </div>

      {/* VIEW MODE → SHOW EDIT BUTTON */}
      {!isEditing && (
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          EDIT PROFILE
        </button>
      )}

      {/* EDIT MODE → SHOW SAVE BUTTON */}
      {isEditing && (
        <button className="save-btn" onClick={handleSave}>
          SAVE CHANGES
        </button>
      )}
    </div>
  );
}

export default Profile;
