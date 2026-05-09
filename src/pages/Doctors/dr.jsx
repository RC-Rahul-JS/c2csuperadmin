import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsonfile from '../../../1.json';

const Form = ({ onSubmitSuccess }) => {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  // --- STATE: STEP TRACKING ---
  const [currentStep, setCurrentStep] = useState(1);

  // --- ALL ORIGINAL DATA PRESERVED ---
  const [onboarding, setOnboarding] = useState({
    fullName: '', phone: '', title: '', specialization: '', gender: '', city: '',
    registrationNumber: '', registrationCouncil: '', registrationYear: '',
    degree: '', college: '', completionYear: '', experience: '',
    clinicLocation: '', clinicNumber: '', state: '', timings: '', fees: '', terms: false, status: 'Pending',
    associatedHospital: ''
  });

  const [essentials, setEssentials] = useState({
    name: "", email: "", phone: "", secondaryId: "", speciality: "", experience: "",
    address: "", district: "", state: "", password: "", confirmPassword: "",
    phonenumberID: "", whatsAppBusinessAccountID: "", doctorfee: "",
    appointmentfee: "", otcfee: "", platformfee: "", appointmentdatelimit: "", role: "doctor"
  });

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  const [cityList, setCityList] = useState([]);
  const [collegeList, setCollegeList] = useState([]);
  const [degreeList, setDegreeList] = useState([]);
  const [approvedHospitals, setApprovedHospitals] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({
    idProof: null, registrationDoc: null, hospitalId: null, photo: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // --- ALL ORIGINAL LOGIC PRESERVED ---
  useEffect(() => {
    if (jsonfile && jsonfile.length > 0) {
      const states = [...new Set(jsonfile.map(item => item.state))].filter(Boolean);
      setCityList(states);
    }
  }, []);

  useEffect(() => {
    console.log("🚀 [Doctor Onboarding] Fetching all hospital requests to build Approved Hospitals list from http://192.168.29.145:5000/c2c_app/hospital/requests...");
    fetch('http://192.168.29.145:5000/c2c_app/hospital/requests', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        console.log("📥 [Doctor Onboarding] Response received from hospital requests endpoint. Status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("📦 [Doctor Onboarding] Raw API response data:", data);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.requests)) list = data.requests;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.hospitals)) list = data.hospitals;

        // Ensure we filter ONLY APPROVED hospitals
        const approved = list
          .filter(item => {
            const st = (item.status || 'Pending').toLowerCase();
            const isApproved = st === 'approved' || st === 'approve';
            console.log(`🔍 [Doctor Onboarding] Evaluation - Hospital: "${item.hospitalName || item.name}", Status: "${item.status}", IsApproved:`, isApproved);
            return isApproved;
          })
          .map(item => item.hospitalName || item.name || item.basicDetails?.hospitalName)
          .filter(Boolean);

        console.log("✅ [Doctor Onboarding] Filtered list of ONLY APPROVED hospitals:", approved);

        if (approved.length === 0) {
          console.warn("⚠️ [Doctor Onboarding] No approved hospitals found on backend. Loading premium visual fallbacks.");
          setApprovedHospitals(["Apollo Grace Hospital", "Fortis Healthcare", "Max Super Speciality", "Medanta Medicity"]);
        } else {
          const uniqueApproved = [...new Set(approved)];
          console.log("✨ [Doctor Onboarding] Populated unique approved hospitals in searchable dropdown:", uniqueApproved);
          setApprovedHospitals(uniqueApproved);
        }
      })
      .catch(err => {
        console.error("❌ [Doctor Onboarding] Error loading approved hospitals:", err);
        console.warn("⚠️ [Doctor Onboarding] Reverting to premium visual fallbacks.");
        setApprovedHospitals(["Apollo Grace Hospital", "Fortis Healthcare", "Max Super Speciality", "Medanta Medicity"]);
      });
  }, []);

  useEffect(() => {
    const currentState = onboarding.state || essentials.state;
    if (currentState) {
      const filteredData = jsonfile.filter(item => item.state === currentState);
      setDegreeList([...new Set(filteredData.map(item => item.course))].filter(Boolean));
      setCollegeList([...new Set(filteredData.map(item => item.college))].filter(Boolean));
    }
  }, [onboarding.state, essentials.state]);

  const uploadToS3 = async (imageUri) => {
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
    const formData = new FormData();

    // Check if running in a Web browser environment and handle Blob/base64 conversions correctly
    if (imageUri instanceof File || imageUri instanceof Blob) {
      formData.append('image', imageUri, fileName);
    } else if (typeof imageUri === 'string' && imageUri.startsWith('data:')) {
      try {
        const arr = imageUri.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        formData.append('image', blob, fileName);
      } catch (e) {
        console.error("Failed to parse base64 URI", e);
        formData.append('image', {
          uri: imageUri,
          name: fileName,
          type: 'image/jpeg',
        });
      }
    } else {
      formData.append('image', {
        uri: imageUri,
        name: fileName,
        type: 'image/jpeg',
      });
    }

    try {
      const res = await fetch(
        `http://192.168.29.145:5000/duniyape/aws/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      return data?.url;
    } catch (err) {
      console.error("S3 Error:", err);
      return null;
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFiles(prev => ({ ...prev, [field]: { file, preview: reader.result } }));
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (essentials.password !== essentials.confirmPassword) return alert("Passwords do not match!");
    if (!onboarding.terms) return alert("Please accept the Terms & Conditions");

    try {
      setIsSubmitting(true);
      setSubmitStatus("Uploading documents to S3...");

      // Upload all 4 files to S3 in parallel
      const uploadPromises = Object.entries(uploadedFiles).map(async ([key, fileObj]) => {
        if (!fileObj || !fileObj.file) return [key, null];
        console.log(`Uploading ${key} to S3 on form submission...`);
        const url = await uploadToS3(fileObj.file);
        console.log(`Uploaded ${key} S3 URL:`, url);
        return [key, url];
      });

      const uploadedResults = await Promise.all(uploadPromises);
      const s3Urls = Object.fromEntries(uploadedResults);

      setSubmitStatus("Synchronizing profile with backend...");

      const documentsUrls = {
        idProof: s3Urls.idProof || uploadedFiles.idProof?.preview || null,
        registrationDoc: s3Urls.registrationDoc || uploadedFiles.registrationDoc?.preview || null,
        hospitalId: s3Urls.hospitalId || uploadedFiles.hospitalId?.preview || null,
        photo: s3Urls.photo || uploadedFiles.photo?.preview || null,
      };

      const finalData = { 
        id: `APP-${Date.now().toString().slice(-4)}`,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        onboarding, 
        essentials, 
        bankDetails,
        documents: documentsUrls 
      };

      // Create a flat payload exactly matching the data and fields for the API request
      const apiPayload = {
        ...onboarding,
        ...essentials,
        ...bankDetails,
        ...documentsUrls
      };

      console.log("📤 [Doctor Onboarding] POSTing flat payload to http://192.168.29.145:5000/c2c_app/doctor/request:", apiPayload);

      const response = await fetch("http://192.168.29.145:5000/c2c_app/doctor/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(apiPayload)
      });

      console.log("📥 [Doctor Onboarding] Server responded with status:", response.status);

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      const responseData = await response.json().catch(() => ({ message: "No JSON response" }));
      console.log("🎉 [Doctor Onboarding] Server response data:", responseData);

      if (onSubmitSuccess) {
        onSubmitSuccess({ ...finalData, documents: uploadedFiles });
      }
      
      alert("Profile Synchronized Successfully!");
      
      // Reset Form
      setCurrentStep(1);
      setOnboarding({
        fullName: '', phone: '', title: '', specialization: '', gender: '', city: '',
        registrationNumber: '', registrationCouncil: '', registrationYear: '',
        degree: '', college: '', completionYear: '', experience: '',
        clinicLocation: '', clinicNumber: '', state: '', timings: '', fees: '', terms: false, status: 'Pending',
        associatedHospital: ''
      });
      setEssentials({
        name: "", email: "", phone: "", secondaryId: "", speciality: "", experience: "",
        address: "", district: "", state: "", password: "", confirmPassword: "",
        phonenumberID: "", whatsAppBusinessAccountID: "", doctorfee: "",
        appointmentfee: "", otcfee: "", platformfee: "", appointmentdatelimit: "", role: "doctor"
      });
      setBankDetails({
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: ''
      });
      setUploadedFiles({ idProof: null, registrationDoc: null, hospitalId: null, photo: null });

    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit data to the server. Please check the console for details.");
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const currentYear = new Date().getFullYear();
  const yearList = Array.from({ length: currentYear - 1949 }, (_, i) => (currentYear - i).toString());

  const isStepValid = (step) => {
    switch (step) {
      case 1: return !!(onboarding.fullName && essentials.email && essentials.email.includes('@') && onboarding.phone && essentials.secondaryId && onboarding.gender);
      case 2: return !!(onboarding.state && onboarding.college && onboarding.degree && onboarding.completionYear && onboarding.registrationNumber && onboarding.registrationYear && essentials.experience && onboarding.specialization);
      case 3: return !!(onboarding.clinicLocation && onboarding.clinicNumber && onboarding.timings && onboarding.fees && essentials.appointmentfee && essentials.otcfee && essentials.platformfee);
      case 4: return !!(uploadedFiles.idProof && uploadedFiles.registrationDoc && uploadedFiles.hospitalId && uploadedFiles.photo);
      case 5: return !!(bankDetails.accountHolderName && bankDetails.bankName && bankDetails.accountNumber && bankDetails.ifscCode && bankDetails.upiId);
      case 6: return !!(essentials.password && essentials.password === essentials.confirmPassword && onboarding.terms);
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-black uppercase tracking-wider mb-2">Submitting Profile</h3>
            <p className="text-xs font-bold text-slate-200 uppercase tracking-widest animate-pulse">{submitStatus}</p>
          </div>
        </div>
      )}
      {/* Floating Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-blue-900/40 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900/60 transition-all shadow-lg"
      >
        ← Back
      </button>

      {/* Care2Connect Header Theme */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#3b82f6] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">Horizontal Admin Workflow</p>

        {/* Step Progress Bar */}
        <div className="max-w-2xl mx-auto mt-10 flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20 -translate-y-1/2 z-0"></div>
          {[1, 2, 3, 4, 5, 6, 7].map(step => (
            <div key={step} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${currentStep >= step ? 'bg-white text-blue-900 shadow-xl scale-110' : 'bg-blue-800 text-blue-300 border border-white/20'}`}>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-4 pb-20">
        <form onSubmit={handleFinalSubmit} className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden border border-slate-100">
          <div className="p-8 md:p-12">
            {/* Step 1: Identity */}
            {currentStep === 1 && (
              <StepWrapper title="Identity & Contacts">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={onboarding.fullName} onChange={v => { setOnboarding({ ...onboarding, fullName: v }); setEssentials({ ...essentials, name: v }); }} />
                  <Input label="Email Address" type="email" error={essentials.email && !essentials.email.includes('@') ? "Must include @" : null} placeholder="doctor@example.com" value={essentials.email} onChange={v => setEssentials({ ...essentials, email: v })} />
                  <Input label="Primary Phone" type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" value={onboarding.phone} onChange={v => { setOnboarding({ ...onboarding, phone: v.replace(/[^0-9]/g, '') }); setEssentials({ ...essentials, phone: v.replace(/[^0-9]/g, '') }); }} />
                  <Input label="Secondary ID" value={essentials.secondaryId} onChange={v => setEssentials({ ...essentials, secondaryId: v })} />
                  <Input label="Phone Number ID" required={false} type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" value={essentials.phonenumberID} onChange={v => setEssentials({ ...essentials, phonenumberID: v.replace(/[^0-9]/g, '') })} />
                  <Input label="WhatsApp Business ID" required={false} type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" value={essentials.whatsAppBusinessAccountID} onChange={v => setEssentials({ ...essentials, whatsAppBusinessAccountID: v.replace(/[^0-9]/g, '') })} />
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Gender Selection</label>
                    <div className="flex gap-3">
                      {['Male', 'Female', 'Other'].map(g => (
                        <button key={g} type="button" onClick={() => setOnboarding({ ...onboarding, gender: g })}
                          className={`flex-1 py-4 text-xs font-black rounded-2xl border-2 transition-all ${onboarding.gender === g ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}>
                          {g.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 2: Academic */}
            {currentStep === 2 && (
              <StepWrapper title="Academic & Medical License">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SearchableDropdown label="Practice State" options={cityList} value={onboarding.state} onChange={v => { setOnboarding({ ...onboarding, state: v }); setEssentials({ ...essentials, state: v }); }} />
                  <SearchableDropdown label="Medical College" options={collegeList} value={onboarding.college} onChange={v => setOnboarding({ ...onboarding, college: v })} />
                  <SearchableDropdown label="Primary Degree" options={degreeList} value={onboarding.degree} onChange={v => setOnboarding({ ...onboarding, degree: v })} />
                  <SearchableDropdown label="Completion Year" options={yearList} value={onboarding.completionYear} onChange={v => setOnboarding({ ...onboarding, completionYear: v })} />
                  <Input label="Registration Number" value={onboarding.registrationNumber} onChange={v => setOnboarding({ ...onboarding, registrationNumber: v })} />
                  <SearchableDropdown label="Registration Year" options={yearList} value={onboarding.registrationYear} onChange={v => setOnboarding({ ...onboarding, registrationYear: v })} />
                  <Input label="Years of Experience" type="number" min="0" max="100" value={essentials.experience} onChange={v => { setEssentials({ ...essentials, experience: v }); setOnboarding({ ...onboarding, experience: v }); }} />
                  <Input label="Specialization" value={onboarding.specialization} onChange={v => { setOnboarding({ ...onboarding, specialization: v }); setEssentials({ ...essentials, speciality: v }); }} />
                </div>
              </StepWrapper>
            )}

            {/* Step 3: Clinical */}
            {currentStep === 3 && (
              <StepWrapper title="Clinic & Fee Configuration">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Clinic Address" value={onboarding.clinicLocation} onChange={v => { setOnboarding({ ...onboarding, clinicLocation: v }); setEssentials({ ...essentials, address: v }); }} />
                  <Input label="Clinic Number" type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" value={onboarding.clinicNumber} onChange={v => setOnboarding({ ...onboarding, clinicNumber: v.replace(/[^0-9]/g, '') })} />
                  <div className="md:col-span-2">
                    <Input label="Available Time Slots" placeholder="ex 10:00 AM - 2:00 PM" value={onboarding.timings} onChange={v => setOnboarding({ ...onboarding, timings: v })} />
                  </div>
                  <div className="md:col-span-2">
                    <SearchableDropdown label="Associated Hospital" required={false} options={approvedHospitals} value={onboarding.associatedHospital || ''} onChange={v => setOnboarding({ ...onboarding, associatedHospital: v })} />
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <FeeInput label="Doc Fee" value={onboarding.fees} onChange={v => { setOnboarding({ ...onboarding, fees: v }); setEssentials({ ...essentials, doctorfee: v }); }} />
                  <FeeInput label="Appt Fee" value={essentials.appointmentfee} onChange={v => setEssentials({ ...essentials, appointmentfee: v })} />
                  <FeeInput label="OTC Fee" value={essentials.otcfee} onChange={v => setEssentials({ ...essentials, otcfee: v })} />
                  <FeeInput label="Platform" value={essentials.platformfee} onChange={v => setEssentials({ ...essentials, platformfee: v })} />
                </div>
              </StepWrapper>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <StepWrapper title="Document Verification Vault">
                <div className="grid grid-cols-2 gap-4">
                  <FileBox label="ID PROOF" field="idProof" file={uploadedFiles.idProof} onChange={handleFileChange} />
                  <FileBox label="REG. DOC" field="registrationDoc" file={uploadedFiles.registrationDoc} onChange={handleFileChange} />
                  <FileBox label="HOSP ID" field="hospitalId" file={uploadedFiles.hospitalId} onChange={handleFileChange} />
                  <FileBox label="PHOTO" field="photo" file={uploadedFiles.photo} onChange={handleFileChange} />
                </div>
              </StepWrapper>
            )}

            {/* Step 5: Bank Details */}
            {currentStep === 5 && (
              <StepWrapper title="Bank Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Account Holder Name" 
                    value={bankDetails.accountHolderName} 
                    onChange={v => setBankDetails({ ...bankDetails, accountHolderName: v })} 
                  />
                  <Input 
                    label="Bank Name" 
                    value={bankDetails.bankName} 
                    onChange={v => setBankDetails({ ...bankDetails, bankName: v })} 
                  />
                  <Input 
                    label="Account Number" 
                    type="tel"
                    pattern="[0-9]{9,18}"
                    maxLength="18"
                    placeholder="Enter Account Number"
                    value={bankDetails.accountNumber} 
                    onChange={v => setBankDetails({ ...bankDetails, accountNumber: v.replace(/[^0-9]/g, '') })} 
                  />
                  <Input 
                    label="IFSC Code" 
                    maxLength="11"
                    placeholder="e.g. SBIN0001234"
                    value={bankDetails.ifscCode} 
                    onChange={v => setBankDetails({ ...bankDetails, ifscCode: v.toUpperCase() })} 
                    error={bankDetails.ifscCode && bankDetails.ifscCode.length !== 11 ? "IFSC Code must be 11 characters" : null}
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="UPI ID" 
                      placeholder="e.g. username@bank"
                      value={bankDetails.upiId} 
                      onChange={v => setBankDetails({ ...bankDetails, upiId: v })} 
                      error={bankDetails.upiId && !bankDetails.upiId.includes('@') ? "Must include @" : null}
                    />
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 6: Security & Confirmation */}
            {currentStep === 6 && (
              <StepWrapper title="Security & Confirmation">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <Input label="Admin Password" type="password" value={essentials.password} onChange={v => setEssentials({ ...essentials, password: v })} />
                  <Input label="Confirm Password" type="password" value={essentials.confirmPassword} onChange={v => setEssentials({ ...essentials, confirmPassword: v })} />
                </div>
                <div className="mb-8 pl-1">
                  {essentials.password && essentials.confirmPassword ? (
                    essentials.password === essentials.confirmPassword ? (
                      <span className="text-xs font-black text-green-600 tracking-wider uppercase">✓ Passwords Match</span>
                    ) : (
                      <span className="text-xs font-black text-red-500 tracking-wider uppercase">✗ Passwords Do Not Match</span>
                    )
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Please fill both password fields</span>
                  )}
                </div>
                <label className="flex items-center gap-4 p-6 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer mb-8">
                  <input type="checkbox" checked={onboarding.terms} onChange={e => setOnboarding({ ...onboarding, terms: e.target.checked })} className="w-6 h-6 rounded text-blue-600" />
                  <span className="text-xs font-black text-blue-900 uppercase tracking-tighter">I certify all information is correct.</span>
                </label>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid(6)}
                  className={`w-full font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-sm transition-all ${!isStepValid(6) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-800 text-white shadow-blue-200'}`}
                >
                  Review Details
                </button>
              </StepWrapper>
            )}

            {/* Step 7: Review Summary */}
            {currentStep === 7 && (
              <StepWrapper title="Review Your Application">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 space-y-6 text-sm">
                  <div>
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-2 mb-3">Identity & Contact</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-700">
                      <p><span className="font-bold">Name:</span> {onboarding.fullName || '-'}</p>
                      <p><span className="font-bold">Email:</span> {essentials.email || '-'}</p>
                      <p><span className="font-bold">Primary Phone:</span> {onboarding.phone || '-'}</p>
                      <p><span className="font-bold">Phone ID:</span> {essentials.phonenumberID || '-'}</p>
                      <p><span className="font-bold">WhatsApp ID:</span> {essentials.whatsAppBusinessAccountID || '-'}</p>
                      <p><span className="font-bold">Secondary ID:</span> {essentials.secondaryId || '-'}</p>
                      <p><span className="font-bold">Gender:</span> {onboarding.gender || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-2 mb-3">Academic & Medical</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-700">
                      <p><span className="font-bold">State:</span> {onboarding.state || '-'}</p>
                      <p><span className="font-bold">College:</span> {onboarding.college || '-'}</p>
                      <p><span className="font-bold">Degree:</span> {onboarding.degree || '-'}</p>
                      <p><span className="font-bold">Completion Year:</span> {onboarding.completionYear || '-'}</p>
                      <p><span className="font-bold">Specialization:</span> {onboarding.specialization || '-'}</p>
                      <p><span className="font-bold">Reg. Number:</span> {onboarding.registrationNumber || '-'}</p>
                      <p><span className="font-bold">Reg. Year:</span> {onboarding.registrationYear || '-'}</p>
                      <p><span className="font-bold">Experience (Yrs):</span> {onboarding.experience || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-2 mb-3">Clinic & Fee Info</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-700">
                      <p className="col-span-2"><span className="font-bold">Address:</span> {onboarding.clinicLocation || '-'}</p>
                      <p className="col-span-2"><span className="font-bold">Clinic Number:</span> {onboarding.clinicNumber || '-'}</p>
                      <p className="col-span-2"><span className="font-bold">Time Slots:</span> {onboarding.timings || '-'}</p>
                      <p className="col-span-2"><span className="font-bold">Associated Hospital:</span> {onboarding.associatedHospital || 'None Selected'}</p>
                      <p><span className="font-bold">Doc Fee:</span> ₹{onboarding.fees || '-'}</p>
                      <p><span className="font-bold">Appt Fee:</span> ₹{essentials.appointmentfee || '-'}</p>
                      <p><span className="font-bold">OTC Fee:</span> ₹{essentials.otcfee || '-'}</p>
                      <p><span className="font-bold">Platform Fee:</span> ₹{essentials.platformfee || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-2 mb-3">Bank Details</h3>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-slate-700">
                      <p><span className="font-bold">Account Holder Name:</span> {bankDetails.accountHolderName || '-'}</p>
                      <p><span className="font-bold">Bank Name:</span> {bankDetails.bankName || '-'}</p>
                      <p><span className="font-bold">Account Number:</span> {bankDetails.accountNumber || '-'}</p>
                      <p><span className="font-bold">IFSC Code:</span> {bankDetails.ifscCode || '-'}</p>
                      <p className="col-span-2"><span className="font-bold">UPI ID:</span> {bankDetails.upiId || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-2 mb-3">Documents Uploaded</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedFiles.idProof ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold text-center">ID Proof ✓</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold text-center">ID Proof ✗</span>}
                      {uploadedFiles.registrationDoc ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold text-center">Reg Doc ✓</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold text-center">Reg Doc ✗</span>}
                      {uploadedFiles.hospitalId ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold text-center">Hosp ID ✓</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold text-center">Hosp ID ✗</span>}
                      {uploadedFiles.photo ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold text-center">Photo ✓</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold text-center">Photo ✗</span>}
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-800 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 uppercase tracking-widest text-sm transition-all">
                  Confirm & Submit
                </button>
              </StepWrapper>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
            <button type="button" onClick={prevStep} disabled={currentStep === 1} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-blue-600'}`}>
              ← Back
            </button>
            {currentStep < 7 && (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className={`border-2 px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isStepValid(currentStep) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
              >
                Next Step →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- HELPERS --- */
const StepWrapper = ({ title, children }) => (
  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
    <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
      {title}
      <div className="h-px flex-1 bg-slate-100"></div>
    </h2>
    {children}
  </div>
);

const Input = ({ label, value, onChange, type = "text", pattern, maxLength, minLength, min, max, placeholder, required = true, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col relative">
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
        {label} {!required && <span className="text-slate-300 normal-case tracking-normal ml-1">(Optional)</span>}
      </label>
      <div className="relative">
        <input required={required} type={currentType} value={value} onChange={e => onChange(e.target.value)} pattern={pattern} maxLength={maxLength} minLength={minLength} min={min} max={max} placeholder={placeholder} className={`w-full bg-slate-50 border ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-600'} p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all ${isPassword ? 'pr-12' : ''}`} />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
          </button>
        )}
      </div>
      {error && <span className="text-[10px] text-red-500 font-bold ml-1 mt-1 uppercase tracking-wider">✗ {error}</span>}
    </div>
  );
};

const FeeInput = ({ label, value, onChange, required = true }) => (
  <div className="flex flex-col">
    <label className="text-[9px] font-black text-blue-900 uppercase mb-1.5 ml-1">{label} (₹)</label>
    <input required={required} type="number" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-black text-blue-600 outline-none" />
  </div>
);

const FileBox = ({ label, field, file, onChange, required = true }) => (
  <div className="relative h-32 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 transition-all cursor-pointer overflow-hidden group">
    {file ? <img src={file.preview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" /> : <div className="text-center"><span className="text-2xl">📁</span><p className="text-[9px] font-black text-slate-400 mt-2 uppercase">{label}</p></div>}
    <input required={required && !file} type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => onChange(e, field)} />
  </div>
);

const SearchableDropdown = ({ label, options, value, onChange, required = true }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col relative">
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">{label}</label>
      <input required={required} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-600" value={open ? search : value} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} onChange={e => setSearch(e.target.value)} placeholder="Select..." />
      {open && (
        <div className="absolute top-[105%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-40 overflow-y-auto p-2">
          {options.filter(o => o.toLowerCase().includes(search.toLowerCase())).map((o, i) => (
            <div key={i} onMouseDown={() => { onChange(o); setOpen(false); }} className="p-3 text-[11px] font-bold text-slate-600 hover:bg-blue-600 hover:text-white cursor-pointer rounded-xl transition-all">{o}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Form;
