import React, { useState, useEffect } from 'react';
import { HiUpload, HiTrash, HiPhotograph, HiDeviceMobile } from 'react-icons/hi';

const AppAppearance = () => {
  const [activeTab, setActiveTab] = useState('banner');
  const [banners, setBanners] = useState([]);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    // Load persisted banners and background from localStorage
    const savedBanners = JSON.parse(localStorage.getItem('app_banners')) || [];
    const savedBg = localStorage.getItem('app_background') || null;
    setBanners(savedBanners);
    setBackgroundImage(savedBg);
    console.log("App Appearance Data Loaded:", {
      banners: savedBanners,
      backgroundImage: savedBg
    });
  }, []);

  const uploadToAWS = async (file, isBackground = false) => {
    try {
      setIsUploading(true);
      setUploadStatus(`Uploading ${file.name}...`);
      
      const formData = new FormData();
      
      if (isBackground) {
        // Force filename exactly to "backgroundimage" so it strictly overwrites
        formData.append('image', file, 'backgroundimage');
      } else {
        // For banners, standard unique name logic from dr.jsx
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${file.name}`;
        formData.append('image', file, fileName);
      }

      // Add a folder hint (if backend supports it, great. If not, it just uploads normally)
      formData.append('folder', isBackground ? 'background' : 'banner');

      const apiBase = import.meta.env.VITE_API_URL || 'http://192.168.29.145:5000';
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

    const url = await uploadToAWS(file, false);
    if (url) {
      const newBanner = { id: Date.now(), url, type: file.type.startsWith('video/') ? 'video' : 'image' };
      const updatedBanners = [...banners, newBanner];
      setBanners(updatedBanners);
      localStorage.setItem('app_banners', JSON.stringify(updatedBanners));
      console.log("App Banners Updated (Upload):", updatedBanners);
    }
    // reset input
    e.target.value = null;
  };

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadToAWS(file, true);
    if (url) {
      setBackgroundImage(url);
      localStorage.setItem('app_background', url);
      console.log("App Background Updated (Upload):", url);
    }
    // reset input
    e.target.value = null;
  };

  const deleteBanner = (id) => {
    const updatedBanners = banners.filter(b => b.id !== id);
    setBanners(updatedBanners);
    localStorage.setItem('app_banners', JSON.stringify(updatedBanners));
    console.log("App Banners Updated (Delete):", updatedBanners);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 mb-2">
          App Appearance
        </h1>
        <p className="text-slate-500 font-medium">Manage your app banners and background image dynamically.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('banner')}
          className={`flex items-center px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
            activeTab === 'banner'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 scale-105'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <HiDeviceMobile className="mr-2 text-xl" /> App Banners
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`flex items-center px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
            activeTab === 'background'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 scale-105'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <HiPhotograph className="mr-2 text-xl" /> App Background
        </button>
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

        {/* --- BANNER TAB --- */}
        {activeTab === 'banner' && (
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
                {banners.map((banner, idx) => (
                  <div key={banner.id} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 bg-slate-50 aspect-video">
                    {banner.type === 'video' ? (
                      <video src={banner.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={banner.url} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                      <button 
                        onClick={() => deleteBanner(banner.id)}
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- BACKGROUND TAB --- */}
        {activeTab === 'background' && (
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
        )}
      </div>
    </div>
  );
};

export default AppAppearance;
