import React, { useState, useEffect } from 'react';
import { HiUpload, HiTrash, HiPhotograph } from 'react-icons/hi';

const AppBanners = () => {
  const [banners, setBanners] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const apiBase = import.meta.env.VITE_API_URL || 'http://192.168.29.145:5000';

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${apiBase}/c2c_app/get-banners`);
      const data = await res.json();
      
      let fetchedBanners = [];
      if (Array.isArray(data)) {
        fetchedBanners = data;
      } else if (data && Array.isArray(data.data)) {
        fetchedBanners = data.data;
      } else if (data && Array.isArray(data.banners)) {
        fetchedBanners = data.banners;
      }
      
      setBanners(fetchedBanners);
      console.log("App Banners Data Loaded:", data);
    } catch (err) {
      console.error("Failed to fetch banners:", err);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const uploadToAWS = async (file) => {
    try {
      setIsUploading(true);
      setUploadStatus(`Uploading ${file.name}...`);
      
      const formData = new FormData();
      
      // For banners, standard unique name logic from dr.jsx
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${file.name}`;
      formData.append('image', file, fileName);
      formData.append('folder', 'banner');

      const apiBase = import.meta.env.VITE_API_URL || 'http://192.168.29.145:5000';
      
      // API used here for uploading banner images/videos to AWS S3
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

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadToAWS(file);
    if (url) {
      try {
        const res = await fetch(`${apiBase}/c2c_app/create-banner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            image_url: url
          })
        });
        
        if (res.ok) {
          console.log("App Banners Updated (Upload)");
          fetchBanners();
        } else {
          alert("Failed to save banner link to database.");
        }
      } catch (err) {
        console.error("Save Banner Error:", err);
        alert("Failed to save banner to database.");
      }
    }
    // reset input
    e.target.value = null;
  };

  const deleteBanner = async (id) => {
    try {
      const res = await fetch(`${apiBase}/c2c_app/delete-banner/${id}`, {
        method: 'POST'
      });
      if (res.ok) {
        console.log("App Banner Deleted:", id);
        fetchBanners();
      } else {
        alert("Failed to delete banner from database.");
      }
    } catch (err) {
      console.error("Delete Banner Error:", err);
      alert("Failed to delete banner.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 mb-2">
          App Banners
        </h1>
        <p className="text-slate-500 font-medium">Manage your app banners dynamically.</p>
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

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Slider Management</h2>
              <p className="text-sm text-slate-500 mt-1">Upload images or videos. They will automatically be added to the slider.</p>
            </div>
            <label className="cursor-pointer bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-95">
              <HiUpload className="mr-2 text-xl" /> Upload New Slider
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleBannerUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {banners.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <HiPhotograph className="mx-auto text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No banners uploaded yet.</p>
              <p className="text-xs text-slate-400 mt-1">Upload an image or video to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {banners.map((banner, idx) => {
                const bannerId = banner._id || banner.id;
                return (
                <div key={bannerId} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 bg-slate-50 aspect-video">
                  {banner.image_url?.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video src={banner.image_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={banner.image_url} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <button 
                      onClick={() => deleteBanner(bannerId)}
                      className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 active:scale-90"
                      title="Delete Banner"
                    >
                      <HiTrash className="text-2xl" />
                    </button>
                  </div>
                  <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                    Slide {idx + 1}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppBanners;
