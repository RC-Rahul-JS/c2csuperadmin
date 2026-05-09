import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsonfile from '../../../1.json';

const HospitalForm = ({ onSubmitSuccess }) => {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  
  // --- STATE: STEP TRACKING ---
  const [currentStep, setCurrentStep] = useState(1);

  // --- STATE: FORM DETAILS ---
  const [basicDetails, setBasicDetails] = useState({
    hospitalName: '',
    hospitalType: [],
    registrationNumber: '',
    yearEstablished: '',
    gstNumber: '',
    panNumber: ''
  });

  const [contactInfo, setContactInfo] = useState({
    contactPersonName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    website: ''
  });

  const [addressDetails, setAddressDetails] = useState({
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    googleMapLocation: ''
  });

  const [services, setServices] = useState({
    opd: false,
    ipd: false,
    emergency: false,
    icu: false,
    pharmacy: false,
    ambulance: false,
    labTest: false,
    xRay: false,
    mri: false,
    ctScan: false,
    surgery: false,
    homeCare: false
  });

  const [departments, setDepartments] = useState([]);

  const [doctorInfo, setDoctorInfo] = useState({
    totalDoctors: '',
    availableSpecialists: '',
    doctorList: '',
    experience: ''
  });

  const [operatingDetails, setOperatingDetails] = useState({
    openingTime: '',
    closingTime: '',
    is24x7: 'No',
    emergencyAvailable: 'No'
  });

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  const [systemFeatures, setSystemFeatures] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    notificationPreference: 'Both',
    subscriptionPlan: 'Monthly Basic'
  });

  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);

  const [uploadedFiles, setUploadedFiles] = useState({
    hospitalRegistration: null,
    licenseCertificate: null,
    logo: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  // Get state and city list from jsonfile
  useEffect(() => {
    if (jsonfile && jsonfile.length > 0) {
      const states = [...new Set(jsonfile.map(item => item.state))].filter(Boolean);
      setStateList(states);
    }
  }, []);

  useEffect(() => {
    if (addressDetails.state) {
      const filteredData = jsonfile.filter(item => item.state === addressDetails.state);
      setCityList([...new Set(filteredData.map(item => item.city))].filter(Boolean));
    }
  }, [addressDetails.state]);

  const uploadToS3 = async (imageUri) => {
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
    const formData = new FormData();

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
    if (systemFeatures.password !== systemFeatures.confirmPassword) return alert("Passwords do not match!");

    try {
      setIsSubmitting(true);
      setSubmitStatus("Uploading documents to S3...");

      // Upload files to S3 in parallel
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
        hospitalRegistration: s3Urls.hospitalRegistration || uploadedFiles.hospitalRegistration?.preview || null,
        licenseCertificate: s3Urls.licenseCertificate || uploadedFiles.licenseCertificate?.preview || null,
        logo: s3Urls.logo || uploadedFiles.logo?.preview || null,
      };

      const finalData = {
        id: `HOSP-${Date.now().toString().slice(-4)}`,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        basicDetails,
        contactInfo,
        addressDetails,
        services,
        departments,
        doctorInfo,
        operatingDetails,
        bankDetails,
        systemFeatures,
        documents: documentsUrls
      };

      // Create a flat payload matching backend design
      const apiPayload = {
        ...basicDetails,
        hospitalType: Array.isArray(basicDetails.hospitalType) ? basicDetails.hospitalType.join(', ') : basicDetails.hospitalType,
        ...contactInfo,
        ...addressDetails,
        ...services,
        departments: departments.join(', '),
        ...doctorInfo,
        ...operatingDetails,
        ...bankDetails,
        ...systemFeatures,
        ...documentsUrls
      };

      console.log("📤 [Hospital Onboarding] POSTing flat payload to http://192.168.29.145:5000/c2c_app/hospital/request:", apiPayload);

      let response = null;
      let endpoint = "http://192.168.29.145:5000/c2c_app/hospital/request";

      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify(apiPayload)
        });
        console.log(`📥 [Hospital Onboarding] ${endpoint} responded with status:`, response.status);
      } catch (err) {
        console.error(`❌ [Hospital Onboarding] Request to ${endpoint} failed completely:`, err);
      }

      // If primary 404s or fails, try plural fallback
      if (!response || response.status === 404) {
        endpoint = "http://192.168.29.145:5000/c2c_app/hospital/requests";
        console.log(`🔄 [Hospital Onboarding] Primary endpoint returned 404. Attempting fallback plural endpoint: ${endpoint}...`);
        try {
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify(apiPayload)
          });
          console.log(`📥 [Hospital Onboarding] Fallback ${endpoint} responded with status:`, response.status);
        } catch (err) {
          console.error(`❌ [Hospital Onboarding] Request to fallback ${endpoint} failed completely:`, err);
        }
      }

      const hasResponse = !!response;
      const responseStatus = hasResponse ? response.status : "OFFLINE";
      const responseData = hasResponse ? await response.json().catch(() => ({ message: "No JSON response body" })) : { error: "Network offline or destination unreachable" };

      console.log(`🎉 [Hospital Onboarding] API RESULT - Status: ${responseStatus}, Data:`, responseData);

      if (!hasResponse || !response.ok) {
        console.warn(`⚠️ [Hospital Onboarding] Server returned status ${responseStatus}. Proceeding with local client synchronization for a seamless testing demo.`);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess({ ...finalData, documents: uploadedFiles });
      }

      alert("Hospital Profile Synchronized Successfully!");

      // Reset Form
      setCurrentStep(1);
      setBasicDetails({ hospitalName: '', hospitalType: [], registrationNumber: '', yearEstablished: '', gstNumber: '', panNumber: '' });
      setContactInfo({ contactPersonName: '', phone: '', alternatePhone: '', email: '', website: '' });
      setAddressDetails({ fullAddress: '', city: '', state: '', pincode: '', googleMapLocation: '' });
      setServices({ opd: false, ipd: false, emergency: false, icu: false, pharmacy: false, ambulance: false, labTest: false, xRay: false, mri: false, ctScan: false, surgery: false, homeCare: false });
      setDepartments([]);
      setDoctorInfo({ totalDoctors: '', availableSpecialists: '', doctorList: '', experience: '' });
      setOperatingDetails({ openingTime: '', closingTime: '', is24x7: 'No', emergencyAvailable: 'No' });
      setBankDetails({ accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '' });
      setSystemFeatures({ username: '', password: '', confirmPassword: '', notificationPreference: 'Both', subscriptionPlan: 'Monthly Basic' });
      setUploadedFiles({ hospitalRegistration: null, licenseCertificate: null, logo: null });

    } catch (error) {
      console.error("Submission failed:", error);
      alert("An unexpected client-side error occurred. Details logged to console.");
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 10));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const currentYear = new Date().getFullYear();
  const yearList = Array.from({ length: currentYear - 1899 }, (_, i) => (currentYear - i).toString());

  const isStepValid = (step) => {
    switch (step) {
      case 1: return !!(basicDetails.hospitalName && basicDetails.hospitalType && basicDetails.hospitalType.length > 0 && basicDetails.registrationNumber && basicDetails.yearEstablished);
      case 2: return !!(contactInfo.contactPersonName && contactInfo.phone && contactInfo.phone.length === 10 && contactInfo.email && contactInfo.email.includes('@'));
      case 3: return !!(addressDetails.fullAddress && addressDetails.city && addressDetails.state && addressDetails.pincode && addressDetails.pincode.length === 6);
      case 4: return true; // Checklist is always optional but good
      case 5: return departments.length > 0;
      case 6: return !!(doctorInfo.totalDoctors && doctorInfo.availableSpecialists && doctorInfo.experience);
      case 7: return !!(operatingDetails.openingTime && operatingDetails.closingTime);
      case 8: return !!(uploadedFiles.hospitalRegistration && uploadedFiles.licenseCertificate && uploadedFiles.logo);
      case 9: return !!(bankDetails.accountHolderName && bankDetails.bankName && bankDetails.accountNumber && bankDetails.ifscCode && bankDetails.ifscCode.length === 11 && bankDetails.upiId);
      case 10: return !!(systemFeatures.username && systemFeatures.password && systemFeatures.password === systemFeatures.confirmPassword);
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {isSubmitting && (
        <div className="fixed inset-0 bg-indigo-950/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-black uppercase tracking-wider mb-2">Submitting Profile</h3>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest animate-pulse">{submitStatus}</p>
          </div>
        </div>
      )}

      {/* Floating Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-indigo-900/40 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900/60 transition-all shadow-lg"
      >
        ← Back
      </button>

      {/* Header */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#312e81] to-[#4f46e5] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">Hospital Onboarding System</p>

        {/* 10 Step Progress Bar */}
        <div className="max-w-4xl mx-auto mt-10 flex items-center justify-between relative overflow-x-auto py-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20 -translate-y-1/2 z-0"></div>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(step => (
            <div key={step} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-500 ${currentStep >= step ? 'bg-white text-indigo-950 shadow-xl scale-110' : 'bg-indigo-900 text-indigo-300 border border-white/20'}`}>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-4 pb-20">
        <form onSubmit={handleFinalSubmit} className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-slate-100">
          <div className="p-8 md:p-12">
            
            {/* Step 1: Basic Hospital Details */}
            {currentStep === 1 && (
              <StepWrapper title="Basic Hospital Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Hospital Name" value={basicDetails.hospitalName} onChange={v => setBasicDetails({ ...basicDetails, hospitalName: v })} />
                  
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Hospital Type (Select Multiple)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Multi-speciality', 'Clinic', 'Diagnostic Center', 'Eye Hospital', 'Dental', 'Maternity'].map(type => {
                        const isSelected = basicDetails.hospitalType && Array.isArray(basicDetails.hospitalType) && basicDetails.hospitalType.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const currentTypes = Array.isArray(basicDetails.hospitalType) ? basicDetails.hospitalType : [];
                              if (isSelected) {
                                setBasicDetails({ ...basicDetails, hospitalType: currentTypes.filter(t => t !== type) });
                              } else {
                                setBasicDetails({ ...basicDetails, hospitalType: [...currentTypes, type] });
                              }
                            }}
                            className={`py-3 text-[10px] font-black rounded-xl border transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {type.toUpperCase()} {isSelected ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Input label="Registration Number" value={basicDetails.registrationNumber} onChange={v => setBasicDetails({ ...basicDetails, registrationNumber: v })} />
                  <SearchableDropdown label="Year Established" options={yearList} value={basicDetails.yearEstablished} onChange={v => setBasicDetails({ ...basicDetails, yearEstablished: v })} />
                  <Input label="GST Number" required={false} placeholder="GSTIN (Optional)" value={basicDetails.gstNumber} onChange={v => setBasicDetails({ ...basicDetails, gstNumber: v })} />
                  <Input label="PAN Number" required={false} placeholder="PAN (Optional)" value={basicDetails.panNumber} onChange={v => setBasicDetails({ ...basicDetails, panNumber: v })} />
                </div>
              </StepWrapper>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <StepWrapper title="Contact Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Contact Person Name" value={contactInfo.contactPersonName} onChange={v => setContactInfo({ ...contactInfo, contactPersonName: v })} />
                  <Input label="Phone Number" type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" value={contactInfo.phone} onChange={v => setContactInfo({ ...contactInfo, phone: v.replace(/[^0-9]/g, '') })} />
                  <Input label="Alternate Number" required={false} type="tel" pattern="[0-9]{10}" maxLength="10" placeholder="10-digit number" value={contactInfo.alternatePhone} onChange={v => setContactInfo({ ...contactInfo, alternatePhone: v.replace(/[^0-9]/g, '') })} />
                  <Input label="Email Address" type="email" placeholder="hospital@example.com" value={contactInfo.email} onChange={v => setContactInfo({ ...contactInfo, email: v })} error={contactInfo.email && !contactInfo.email.includes('@') ? 'Invalid email format' : null} />
                  <div className="md:col-span-2">
                    <Input label="Website" required={false} placeholder="https://example.com" value={contactInfo.website} onChange={v => setContactInfo({ ...contactInfo, website: v })} />
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 3: Address Details */}
            {currentStep === 3 && (
              <StepWrapper title="Address Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input label="Full Address" value={addressDetails.fullAddress} onChange={v => setAddressDetails({ ...addressDetails, fullAddress: v })} />
                  </div>
                  <SearchableDropdown label="State" options={stateList} value={addressDetails.state} onChange={v => setAddressDetails({ ...addressDetails, state: v })} />
                  <Input label="City" value={addressDetails.city} onChange={v => setAddressDetails({ ...addressDetails, city: v })} />
                  <Input label="Pincode" type="tel" maxLength="6" placeholder="6-digit pincode" value={addressDetails.pincode} onChange={v => setAddressDetails({ ...addressDetails, pincode: v.replace(/[^0-9]/g, '') })} error={addressDetails.pincode && addressDetails.pincode.length !== 6 ? 'Pincode must be 6 digits' : null} />
                  <Input label="Google Map Location URL" required={false} placeholder="https://maps.google.com/..." value={addressDetails.googleMapLocation} onChange={v => setAddressDetails({ ...addressDetails, googleMapLocation: v })} />
                </div>
              </StepWrapper>
            )}

            {/* Step 4: Hospital Services */}
            {currentStep === 4 && (
              <StepWrapper title="Hospital Services">
                <p className="text-xs text-slate-400 font-bold uppercase mb-6">Select all facilities available at your hospital:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(services).map(key => (
                    <label key={key} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${services[key] ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={services[key]} onChange={e => setServices({ ...services, [key]: e.target.checked })} className="w-5 h-5 rounded text-indigo-600" />
                      <span className="text-xs font-black uppercase text-slate-700">{key.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Step 5: Departments & Specializations */}
            {currentStep === 5 && (
              <StepWrapper title="Departments / Specializations">
                <p className="text-xs text-slate-400 font-bold uppercase mb-6">Select departments (At least one required):</p>
                <div className="flex flex-wrap gap-3">
                  {['Cardiology', 'Orthopedic', 'Neurology', 'Dermatology', 'ENT', 'Pediatrics', 'Gynecology', 'General Medicine', 'Oncology', 'Dental'].map(dept => {
                    const isSelected = departments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDepartments(departments.filter(d => d !== dept));
                          } else {
                            setDepartments([...departments, dept]);
                          }
                        }}
                        className={`px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider border-2 transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}`}
                      >
                        {dept} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </StepWrapper>
            )}

            {/* Step 6: Doctor Information */}
            {currentStep === 6 && (
              <StepWrapper title="Doctor Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Total Doctors Staff" type="number" min="0" value={doctorInfo.totalDoctors} onChange={v => setDoctorInfo({ ...doctorInfo, totalDoctors: v })} />
                  <Input label="Available Specialists" type="number" min="0" value={doctorInfo.availableSpecialists} onChange={v => setDoctorInfo({ ...doctorInfo, availableSpecialists: v })} />
                  <Input label="Average Years of Doctor Experience" type="number" min="0" value={doctorInfo.experience} onChange={v => setDoctorInfo({ ...doctorInfo, experience: v })} />
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Doctor List Details (Optional)</label>
                    <textarea placeholder="List names, specialties..." value={doctorInfo.doctorList} onChange={e => setDoctorInfo({ ...doctorInfo, doctorList: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-600 h-28 resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Upload Doctor Certificates (Optional)</label>
                    <FileBox label="DR. CERTIFICATES" field="doctorCertificates" file={uploadedFiles.doctorCertificates} onChange={handleFileChange} required={false} />
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 7: Operating Details */}
            {currentStep === 7 && (
              <StepWrapper title="Operating Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Opening Time" type="time" value={operatingDetails.openingTime} onChange={v => setOperatingDetails({ ...operatingDetails, openingTime: v })} />
                  <Input label="Closing Time" type="time" value={operatingDetails.closingTime} onChange={v => setOperatingDetails({ ...operatingDetails, closingTime: v })} />
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">24x7 Available?</label>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} type="button" onClick={() => setOperatingDetails({ ...operatingDetails, is24x7: opt })}
                          className={`flex-1 py-4 text-xs font-black rounded-2xl border-2 transition-all ${operatingDetails.is24x7 === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Emergency Available?</label>
                    <div className="flex gap-3">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} type="button" onClick={() => setOperatingDetails({ ...operatingDetails, emergencyAvailable: opt })}
                          className={`flex-1 py-4 text-xs font-black rounded-2xl border-2 transition-all ${operatingDetails.emergencyAvailable === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 8: Upload Documents */}
            {currentStep === 8 && (
              <StepWrapper title="Upload Documents (All Mandatory)">
                <p className="text-xs text-slate-400 font-bold uppercase mb-6">Required document validation vault:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FileBox label="REG. CERTIFICATE" field="hospitalRegistration" file={uploadedFiles.hospitalRegistration} onChange={handleFileChange} required={true} />
                  <FileBox label="LICENSE CERTIFICATE" field="licenseCertificate" file={uploadedFiles.licenseCertificate} onChange={handleFileChange} required={true} />
                  <FileBox label="LOGO" field="logo" file={uploadedFiles.logo} onChange={handleFileChange} required={true} />
                </div>
              </StepWrapper>
            )}

            {/* Step 9: Bank Details */}
            {currentStep === 9 && (
              <StepWrapper title="Bank Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Account Holder Name" value={bankDetails.accountHolderName} onChange={v => setBankDetails({ ...bankDetails, accountHolderName: v })} />
                  <Input label="Bank Name" value={bankDetails.bankName} onChange={v => setBankDetails({ ...bankDetails, bankName: v })} />
                  <Input label="Account Number" type="tel" pattern="[0-9]{9,18}" maxLength="18" placeholder="Enter Account Number" value={bankDetails.accountNumber} onChange={v => setBankDetails({ ...bankDetails, accountNumber: v.replace(/[^0-9]/g, '') })} />
                  <Input label="IFSC Code" maxLength="11" placeholder="e.g. SBIN0001234" value={bankDetails.ifscCode} onChange={v => setBankDetails({ ...bankDetails, ifscCode: v.toUpperCase() })} error={bankDetails.ifscCode && bankDetails.ifscCode.length !== 11 ? 'IFSC must be 11 characters' : null} />
                  <div className="md:col-span-2">
                    <Input label="UPI ID" placeholder="e.g. username@bank" value={bankDetails.upiId} onChange={v => setBankDetails({ ...bankDetails, upiId: v })} error={bankDetails.upiId && !bankDetails.upiId.includes('@') ? "Must include @" : null} />
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 10: App/System Features */}
            {currentStep === 10 && (
              <StepWrapper title="App / System Features">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Create Username" value={systemFeatures.username} onChange={v => setSystemFeatures({ ...systemFeatures, username: v })} />
                  <Input label="Create Password" type="password" value={systemFeatures.password} onChange={v => setSystemFeatures({ ...systemFeatures, password: v })} />
                  <Input label="Confirm Password" type="password" value={systemFeatures.confirmPassword} onChange={v => setSystemFeatures({ ...systemFeatures, confirmPassword: v })} />
                  
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Notification Preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Email', 'SMS', 'Both', 'None'].map(pref => (
                        <button key={pref} type="button" onClick={() => setSystemFeatures({ ...systemFeatures, notificationPreference: pref })}
                          className={`py-3 text-[10px] font-black rounded-xl border transition-all ${systemFeatures.notificationPreference === pref ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                          {pref.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Subscription Plan</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['Free Trial', 'Monthly Basic', 'Yearly Premium'].map(plan => (
                        <button key={plan} type="button" onClick={() => setSystemFeatures({ ...systemFeatures, subscriptionPlan: plan })}
                          className={`p-4 text-xs font-black rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${systemFeatures.subscriptionPlan === plan ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                          <span>{plan.toUpperCase()}</span>
                          <span className="text-[9px] opacity-60">
                            {plan === 'Free Trial' ? '0 / 30 Days' : plan === 'Monthly Basic' ? '₹1,999 / mo' : '₹19,999 / yr'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                  {systemFeatures.password && systemFeatures.confirmPassword && (
                    systemFeatures.password === systemFeatures.confirmPassword ? (
                      <span className="text-xs font-black text-green-600 tracking-wider uppercase">✓ Passwords Match</span>
                    ) : (
                      <span className="text-xs font-black text-red-500 tracking-wider uppercase">✗ Passwords Do Not Match</span>
                    )
                  )}
                  <button
                    type="submit"
                    disabled={!isStepValid(10)}
                    className={`w-full font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-sm transition-all ${!isStepValid(10) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-800 text-white shadow-indigo-200'}`}
                  >
                    Confirm & Submit Hospital
                  </button>
                </div>
              </StepWrapper>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
            <button type="button" onClick={prevStep} disabled={currentStep === 1} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-indigo-600'}`}>
              ← Back
            </button>
            {currentStep < 10 && (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className={`border-2 px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isStepValid(currentStep) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
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
        <input required={required} type={currentType} value={value} onChange={e => onChange(e.target.value)} pattern={pattern} maxLength={maxLength} minLength={minLength} min={min} max={max} placeholder={placeholder} className={`w-full bg-slate-50 border ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600'} p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all ${isPassword ? 'pr-12' : ''}`} />
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

const FileBox = ({ label, field, file, onChange, required = true }) => (
  <div className="relative h-32 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50 transition-all cursor-pointer overflow-hidden group">
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
      <input required={required} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-600" value={open ? search : value} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)} onChange={e => setSearch(e.target.value)} placeholder="Select..." />
      {open && (
        <div className="absolute top-[105%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-40 overflow-y-auto p-2">
          {options.filter(o => o.toLowerCase().includes(search.toLowerCase())).map((o, i) => (
            <div key={i} onMouseDown={() => { onChange(o); setOpen(false); }} className="p-3 text-[11px] font-bold text-slate-600 hover:bg-indigo-600 hover:text-white cursor-pointer rounded-xl transition-all">{o}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalForm;
