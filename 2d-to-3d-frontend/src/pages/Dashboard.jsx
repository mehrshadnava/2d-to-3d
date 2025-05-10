// src/pages/Dashboard.jsx
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">🚀 Your Dashboard</h1>

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mb-4"
        />

        {image ? (
          <img
            src={image}
            alt="Uploaded preview"
            className="w-full rounded-lg mb-4 object-contain"
          />
        ) : (
          <p className="text-gray-400 mb-4">No image uploaded yet.</p>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
