import React, { useState } from "react";

const Navbar = () => {
  const [uploadedFile, setUploadedFile] = useState("");
  const [error, setError] = useState("");

  // Helper function to truncate file names
  const truncateText = (text, maxWords) => {
    const words = text.split(" ");
    if (words.length > maxWords) {
      return words.slice(0, maxWords).join(" ") + "...";
    }
    return text;
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (file) {
      const fileType = file.type;

      // Validate file type
      if (fileType !== "application/pdf") {
        setError("Invalid file type. Please upload a PDF.");
        setUploadedFile("");
        setTimeout(() => setError(""), 3000); // Clear error after 3 seconds
        return;
      }

      setUploadedFile(file.name);

      const formData = new FormData();
      formData.append("file", file);

      // Upload the file via POST request
      try {
        const response = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          console.log("File uploaded successfully.");
        } else {
          setError("Failed to upload file. Try again.");
          setUploadedFile("");
          setTimeout(() => setError(""), 3000); // Clear error after 3 seconds
        }
      } catch (err) {
        console.error("Error uploading file:", err);
        setError("Error uploading file. Please check your connection.");
        setUploadedFile("");
        setTimeout(() => setError(""), 3000); // Clear error after 3 seconds
      }
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-md">
      {/* Left Side: Logo */}
      <div className="flex items-center">
        <img src="/Icon.svg" alt="Logo" className="h-10 w-10 rounded-full" />
        <div className="ml-2">
          <h1 className="text-lg font-bold text-green-600">ai planet</h1>
          <p className="text-xs text-gray-500">
            formerly <span className="text-green-600">DPhi</span>
          </p>
        </div>
      </div>

      {/* Right Side: File Upload and Button */}
      <div className="flex items-center space-x-4">
        {/* Show uploaded file name with PDF icon */}
        {uploadedFile && (
          <div className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m2 0a2 2 0 100-4 2 2 0 10-4 0m4 4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z"
              />
            </svg>
            <span className="text-xs sm:text-sm font-medium text-green-600 truncate max-w-[100px] sm:max-w-[200px]">
              {truncateText(uploadedFile, 4)}
            </span>
          </div>
        )}

        {/* Upload Button */}
        <label
          htmlFor="file-upload"
          className="flex items-center px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow cursor-pointer hover:bg-gray-100"
        >
          <span className="hidden sm:inline">Upload PDF</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Error Popup */}
      {error && (
        <div
          className="fixed top-0 left-0 right-0 p-4 bg-red-600 text-white text-center"
          style={{ zIndex: 1000 }}
        >
          {error}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
