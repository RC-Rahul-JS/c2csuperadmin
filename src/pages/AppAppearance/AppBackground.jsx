import React, { useState, useEffect } from 'react';
import { HiUpload, HiPhotograph } from 'react-icons/hi';

const AppBackground = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    // Load persisted background from localStorage
    const savedBg = localStorage.getItem('app_background') || null;
    setBackgroundImage(savedBg);
    console.log("App Background Data Loaded:", savedBg);
  }, []);

  const uploadToAWS = async (file) => {
    try {
      setIsUploading(true);
      setUploadStatus(`Uploading ${file.name}...`);
      
      const formData = new FormData();
      
      // Force filename exactly to "backgroundimage" so it strictly overwrites
      formData.append('image', file, 'backgroundimage');
      formData.append('folder', 'background');

      const apiBase = import.meta.env.VITE_API_URL || 'https://api.care2connect.in';
      
      // API used here for uploading background image to AWS S3
      const res = await fetch(
        `${apiBase}/duniyape/aws/upload`,
        { method: "POST", body: formData }
      );
      
      const data = await res.json();
      return data?.url;
    } catch (err) {
      console.error("S3 Error:", err);
      alert("Failed to upload file to AWS");
      return null;
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadToAWS(file);
    if (url) {
      setBackgroundImage(url);
      localStorage.setItem('app_background', url);
      console.log("App Background Updated (Upload):", url);
    }
    // reset input
    e.target.value = null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 mb-2">
          App Background
        </h1>
        <p className="text-slate-500 font-medium">Manage your app background image dynamically.</p>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100 relative overflow-hidden">
        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-purple-700 animate-pulse">{uploadStatus}</p>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
           <div className="w-full mb-8 text-center">
              <h2 className="text-2xl font-bold text-slate-800">Fixed App Background</h2>
              <p className="text-sm text-slate-500 mt-1">This image will always be saved as <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-purple-600">backgroundimage</span>.</p>
           </div>

           <div className="w-full max-w-2xl bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
             {backgroundImage ? (
               <>
                 <img src={backgroundImage} alt="App Background" className="max-h-96 object-contain rounded-xl shadow-md z-10" />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 backdrop-blur-sm">
                   <label className="cursor-pointer bg-white text-slate-800 hover:bg-purple-50 px-8 py-3 rounded-xl font-bold flex items-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                     <HiUpload className="mr-2 text-xl text-purple-600" /> Replace Background
                     <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBackgroundUpload}
                        disabled={isUploading}
                      />
                   </label>
                 </div>
               </>
             ) : (
               <div className="text-center py-12">
                 <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                   <HiPhotograph className="text-5xl text-purple-400" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-700 mb-2">No Background Found</h3>
                 <p className="text-slate-500 mb-6 max-w-sm">Upload a premium image to set as the default background for your application.</p>
                 
                 <label className="cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30 transition-transform active:scale-95 w-fit">
                   <HiUpload className="mr-2 text-xl" /> Select Background Image
                   <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundUpload}
                      disabled={isUploading}
                    />
                 </label>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AppBackground;
