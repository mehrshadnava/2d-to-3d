import { auth, storage } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import ModelViewer from "../components/ModelViewer";

export default function Dashboard() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const uploadFile = (file) => {
    if (!user) return;
    const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    setUploadProgress(0);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFiles((prev) => [{ url, path: uploadTask.snapshot.ref.fullPath, name: file.name }, ...prev]);
        setUploading(false);
        setUploadProgress(0);
      }
    );
  };

  const handleFiles = (files) => {
    [...files].forEach(file => {
      if (file.type.startsWith("image/") || file.name.endsWith(".glb")) {
        uploadFile(file);
      } else {
        alert("Only images and .glb models are allowed!");
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const fetchFiles = async () => {
    if (!user) return;

    const listRef = ref(storage, `uploads/${user.uid}/`);
    try {
      const res = await listAll(listRef);
      const urls = await Promise.all(
        res.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return { url, path: itemRef.fullPath, name: itemRef.name };
        })
      );
      setFiles(urls.reverse());
    } catch (error) {
      console.error("Fetching files failed:", error);
    }
  };

  const handleDeleteFile = async (path) => {
    const fileRef = ref(storage, path);
    try {
      await deleteObject(fileRef);
      setFiles((prev) => prev.filter((file) => file.path !== path));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center p-8 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1 className="text-4xl font-bold mb-8 text-center">🚀 Your Dashboard</h1>

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
        {/* Upload Area */}
        <div
          className={`w-full p-8 mb-6 border-2 ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-400"
          } rounded-lg text-center cursor-pointer`}
        >
          <input
            type="file"
            multiple
            accept="image/*,.glb"
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            {dragActive ? "Drop files here" : "Click or Drag files to upload"}
          </label>
        </div>

        {uploading && (
          <div className="w-full mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm mt-2">{Math.round(uploadProgress)}% Uploaded</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded mb-6"
        >
          Logout
        </button>

        <h2 className="text-2xl font-semibold mb-4">🖼️🧩 Your Gallery</h2>

        {files.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {files.map((file, idx) => (
              <div key={idx} className="relative group">
                {file.name.endsWith(".glb") ? (
                  <div
                    onClick={() => setSelectedFile(file)}
                    className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    <p className="text-sm text-gray-600">3D Model</p>
                  </div>
                ) : (
                  <img
                    src={file.url}
                    alt={`Uploaded ${idx}`}
                    onClick={() => setSelectedFile(file)}
                    className="w-full h-32 object-cover rounded-lg shadow cursor-pointer"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.path);
                  }}
                  className="hidden group-hover:block absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No files uploaded yet.</p>
        )}
      </div>

      {/* Lightbox / Model Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative p-4 bg-white rounded-lg max-w-full max-h-[90vh] overflow-auto">
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 rounded-full p-2"
            >
              ✖
            </button>
            {selectedFile.name.endsWith(".glb") ? (
              <div className="w-[300px] h-[300px]">
                <ModelViewer modelUrl={selectedFile.url} />
              </div>
            ) : (
              <img src={selectedFile.url} alt="Selected" className="max-w-full max-h-[80vh] rounded-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
