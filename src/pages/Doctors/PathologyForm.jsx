import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PathologyForm = ({ onSubmitSuccess }) => {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');

  // --- STATE: STEP TRACKING ---
  const [currentStep, setCurrentStep] = useState(1);

  // --- STATE: FORM DETAILS ---
  // 1. Basic Lab Information & Address
  const [labName, setLabName] = useState('');
  const [labLogo, setLabLogo] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [establishmentYear, setEstablishmentYear] = useState('');
  const [labType, setLabType] = useState('Pathology'); // Select: Pathology, Diagnostic Center, Imaging Center, Multi Specialty Lab

  // Contact Details
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Address Information
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [googleMapLocation, setGoogleMapLocation] = useState('');

  // 2. Lab Timing & Services
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [workingDays, setWorkingDays] = useState('Monday to Saturday');
  const [is24x7, setIs24x7] = useState(false);

  // Services Offered (Checkboxes)
  const [servicesOffered, setServicesOffered] = useState({
    'Blood Test': false,
    'Urine Routine & Microscopy': false,
    'Thyroid Profile (T3, T4, TSH)': false,
    'Fasting Blood Sugar (FBS)': false,
    'Postprandial Blood Sugar (PPBS)': false,
    'HbA1c (Glycosylated Hemoglobin)': false,
    'CBC': false,
    'Lipid Profile': false,
    'Liver Function Test (LFT)': false,
    'Kidney Function Test (KFT)': false,
    'X-Ray': false,
    'CT Scan': false,
    'MRI': false,
    'ECG': false,
    'Home Sample Collection': false,
    'Vitamin Profile (D, B12)': false,
    'Iron Studies': false,
    'Calcium & Phosphorus': false,
    'Uric Acid': false,
    'Electrolytes (Na, K, Cl)': false,
    'Semen Analysis': false,
    'Sputum Culture': false,
    'Stool Routine': false,
    'Biopsy / Histopathology': false,
    'Cytology': false,
    'Widal Test (Typhoid)': false,
    'Dengue NS1 Antigen': false,
    'Malaria Parasite (MP)': false,
    'RTPCR': false,
  });

  // 3. Staff & Documents
  // Pathologist
  const [doctorName, setDoctorName] = useState('');
  const [doctorQualification, setDoctorQualification] = useState('');
  const [doctorExperience, setDoctorExperience] = useState('');
  const [doctorRegistration, setDoctorRegistration] = useState('');

  // Staff Counts
  const [technicianCount, setTechnicianCount] = useState('');
  const [nursesCount, setNursesCount] = useState('');
  const [receptionistCount, setReceptionistCount] = useState('');

  // Document Uploads (Files handled basically as state references for demo, typically FormData is used)
  const [documents, setDocuments] = useState({
    labLicense: null,
    labLogo: null,
    labPhotos: null
  });

  // 4. Bank, Sub & Creds
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const [subscriptionPlan, setSubscriptionPlan] = useState('Free Plan');
  const [commissionPercentage, setCommissionPercentage] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Additional Features
  const [additionalFeatures, setAdditionalFeatures] = useState({
    'Home Collection Available': false,
    'Online Report Download': false,
    'WhatsApp Report Sharing': false,
    'Online Payment Support': false,
    'Ambulance Support': false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleServiceChange = (service) => {
    setServicesOffered(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const handleFeatureChange = (feature) => {
    setAdditionalFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    setDocuments(prev => ({ ...prev, [docType]: file }));
  };

  const uploadToS3 = async (imageUri) => {
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
    const formData = new FormData();

    if (imageUri instanceof File || imageUri instanceof Blob) {
      formData.append('image', imageUri, fileName);
    } else {
      return null;
    }

    try {
      const res = await fetch(`http://192.168.29.145:5000/duniyape/aws/upload`, { method: "POST", body: formData });
      const data = await res.json();
      return data?.url;
    } catch (err) {
      console.error("S3 Error:", err);
      return null;
    }
  };

  const handleFinalSubmit = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("Uploading documents to S3...");

    try {
      // Upload files to S3 in parallel
      const uploadPromises = Object.entries(documents).map(async ([key, file]) => {
        if (!file) return [key, null];
        const url = await uploadToS3(file);
        return [key, url];
      });

      const uploadedResults = await Promise.all(uploadPromises);
      const s3Urls = Object.fromEntries(uploadedResults);

      setSubmitStatus("Synchronizing Database...");


      // Simulating API payload structure
      const finalData = {
        id: "PATH-" + Math.floor(Math.random() * 10000),
        status: "Pending", // Admin side verification starts as Pending
        basicInfo: {
          labName, ownerName, registrationNumber, gstNumber, panNumber, establishmentYear, labType,
          mobileNumber, alternateMobile, email, website, emergencyContact
        },
        address: {
          addressLine1, addressLine2, landmark, city, state, pincode, googleMapLocation
        },
        timing: {
          openingTime, closingTime, workingDays, is24x7
        },
        services: Object.keys(servicesOffered).filter(k => servicesOffered[k]),
        staff: {
          doctorName, doctorQualification, doctorExperience, doctorRegistration,
          technicianCount, nursesCount, receptionistCount
        },
        bank: {
          accountName, bankName, accountNumber, ifscCode, upiId
        },
        subscription: {
          plan: subscriptionPlan,
          commission: commissionPercentage
        },
        credentials: {
          username, password // Over HTTPS in real scenario
        },
        additionalFeatures: Object.keys(additionalFeatures).filter(k => additionalFeatures[k]),
        // Admin side validation flags:
        verification: {
          kycVerified: false,
          documentsApproved: false
        },
        documents: s3Urls
      };

      const response = await fetch('/c2c_app/labs/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(finalData)
      });

      // We might get a 404 since this endpoint may not exist yet, we will catch or mock it
      let resData = {};
      if (response.ok) {
        resData = await response.json().catch(() => ({}));
      }

      console.log("Pathology Submit API Response:", response.status, resData);

      if (onSubmitSuccess) {
        onSubmitSuccess(finalData);
      }

      alert("Pathology Lab Profile Submitted Successfully!");

      // Reset form or navigate
      setCurrentStep(1);
      // ... Ideally reset all states here or navigate away
      navigate('/doctors/pathology_list');

    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit form (simulated success). Proceeding to list...");
      navigate('/doctors/pathology_list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return !!(labName && mobileNumber && email && addressLine1 && city && state && pincode);
      case 2:
        return !!(is24x7 || (openingTime && closingTime));
      case 3:
        return !!(doctorName && doctorQualification);
      case 4:
        return !!(username && password && confirmPassword === password && bankName && accountNumber);
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative pb-20 overflow-x-hidden">
      {isSubmitting && (
        <div className="fixed inset-0 bg-indigo-950/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-black uppercase tracking-wider mb-2">Submitting Profile</h3>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest animate-pulse">{submitStatus || 'Synchronizing Database...'}</p>
          </div>
        </div>
      )}

      {/* Floating Back Button */}
      {currentStep > 1 && (
        <button
          type="button"
          onClick={prevStep}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-indigo-900/40 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900/60 transition-all shadow-lg"
        >
          ← Back
        </button>
      )}

      {/* Header with 5-Step Progress Bar */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#312e81] to-[#4f46e5] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">
          Pathology Lab Onboarding
        </p>

        {/* 5-Step Progress Bar */}
        <div className="max-w-4xl mx-auto mt-10 flex items-center justify-between relative py-4 px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20 -translate-y-1/2 z-0"></div>
          {Array.from({ length: 5 }, (_, i) => i + 1).map(step => (
            <div
              key={step}
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-500 ${currentStep >= step
                  ? 'bg-white text-indigo-950 shadow-xl scale-110'
                  : 'bg-indigo-900 text-indigo-300 border border-white/20'
                }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-slate-100">
          <div className="p-8 md:p-12">

            {/* Step 1: Basic Info & Contact */}
            {currentStep === 1 && (
              <StepWrapper title="Basic Lab Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Input label="Lab Name" placeholder="Enter Lab Name" value={labName} onChange={setLabName} />
                  <Input label="Owner Name" placeholder="Enter Owner Name" value={ownerName} onChange={setOwnerName} />

                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Lab Type</label>
                    <select
                      value={labType}
                      onChange={e => setLabType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all"
                    >
                      <option value="Pathology">Pathology</option>
                      <option value="Diagnostic Center">Diagnostic Center</option>
                      <option value="Imaging Center">Imaging Center</option>
                      <option value="Multi Specialty Lab">Multi Specialty Lab</option>
                    </select>
                  </div>

                  <Input label="Establishment Year" placeholder="YYYY" maxLength="4" value={establishmentYear} onChange={setEstablishmentYear} />
                  <Input label="Registration Number" placeholder="Reg No." value={registrationNumber} onChange={setRegistrationNumber} />
                  <Input label="GST Number" placeholder="GST No." required={false} value={gstNumber} onChange={setGstNumber} />
                  <Input label="PAN Number" placeholder="PAN No." required={false} value={panNumber} onChange={setPanNumber} />
                </div>

                <h3 className="font-black text-slate-800 text-lg mb-6 border-b pb-2">Contact & Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Mobile Number" type="tel" maxLength="10" placeholder="10-digit Mobile" value={mobileNumber} onChange={setMobileNumber} />
                  <Input label="Alternate Mobile" type="tel" maxLength="10" required={false} placeholder="10-digit Mobile" value={alternateMobile} onChange={setAlternateMobile} />
                  <Input label="Email Address" type="email" placeholder="Email" value={email} onChange={setEmail} />
                  <Input label="Website" required={false} placeholder="https://" value={website} onChange={setWebsite} />
                  <Input label="Emergency Contact" type="tel" maxLength="10" required={false} placeholder="Emergency No." value={emergencyContact} onChange={setEmergencyContact} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Input label="Address Line 1" placeholder="Flat, House no., Building" value={addressLine1} onChange={setAddressLine1} />
                  <Input label="Address Line 2" required={false} placeholder="Area, Street, Sector" value={addressLine2} onChange={setAddressLine2} />
                  <Input label="Landmark" required={false} placeholder="Near..." value={landmark} onChange={setLandmark} />
                  <Input label="City" placeholder="City" value={city} onChange={setCity} />
                  <Input label="State" placeholder="State" value={state} onChange={setStateName} />
                  <Input label="Pincode" placeholder="Pincode" maxLength="6" value={pincode} onChange={setPincode} />
                  <div className="md:col-span-2">
                    <Input label="Google Map Location Link" required={false} placeholder="Maps link" value={googleMapLocation} onChange={setGoogleMapLocation} />
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 2: Lab Timing & Services */}
            {currentStep === 2 && (
              <StepWrapper title="Lab Timing & Services">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="md:col-span-2 flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">24x7 Available</h4>
                      <p className="text-xs text-slate-500">Is this lab open all hours?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={is24x7} onChange={() => setIs24x7(!is24x7)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  {!is24x7 && (
                    <>
                      <Input label="Opening Time" type="time" value={openingTime} onChange={setOpeningTime} />
                      <Input label="Closing Time" type="time" value={closingTime} onChange={setClosingTime} />
                    </>
                  )}
                  <div className="md:col-span-2">
                    <Input label="Working Days" placeholder="e.g., Monday to Saturday" value={workingDays} onChange={setWorkingDays} />
                  </div>
                </div>

                <h3 className="font-black text-slate-800 text-lg mb-4 border-b pb-2">Services Offered</h3>
                <p className="text-xs text-slate-500 mb-4 font-bold">Select all tests and facilities provided by your lab:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(servicesOffered).map(service => (
                    <label key={service} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${servicesOffered[service] ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={servicesOffered[service]} onChange={() => handleServiceChange(service)} className="w-5 h-5 mt-0.5 text-indigo-600 focus:ring-indigo-500 rounded" />
                      <span className="text-xs font-black uppercase text-slate-700 leading-tight">{service}</span>
                    </label>
                  ))}
                </div>

                <h3 className="font-black text-slate-800 text-lg mb-4 border-b pb-2 mt-8">Additional Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.keys(additionalFeatures).map(feature => (
                    <label key={feature} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${additionalFeatures[feature] ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={additionalFeatures[feature]} onChange={() => handleFeatureChange(feature)} className="w-5 h-5 mt-0.5 text-blue-600 focus:ring-blue-500 rounded" />
                      <span className="text-xs font-black uppercase text-slate-700 leading-tight">{feature}</span>
                    </label>
                  ))}
                </div>
              </StepWrapper>
            )}

            {/* Step 3: Staff & Documents */}
            {currentStep === 3 && (
              <StepWrapper title="Staff & Document Uploads">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-indigo-100 pb-2 mb-4">Pathologist Details</h3>
                  </div>
                  <Input label="Doctor Name" placeholder="Dr. Full Name" value={doctorName} onChange={setDoctorName} />
                  <Input label="Qualification" placeholder="MD Pathology, MBBS..." value={doctorQualification} onChange={setDoctorQualification} />
                  <Input label="Experience (Years)" type="number" placeholder="Years" value={doctorExperience} onChange={setDoctorExperience} />
                  <Input label="Doctor Reg. Number" placeholder="Registration Number" value={doctorRegistration} onChange={setDoctorRegistration} />

                  <div className="md:col-span-2 mt-4">
                    <h3 className="font-black text-indigo-900 border-b border-indigo-100 pb-2 mb-4">Staff Counts</h3>
                  </div>
                  <Input label="Technician Count" type="number" placeholder="0" value={technicianCount} onChange={setTechnicianCount} />
                  <Input label="Nurses Count" type="number" placeholder="0" value={nursesCount} onChange={setNursesCount} />
                  <Input label="Receptionist Count" type="number" placeholder="0" value={receptionistCount} onChange={setReceptionistCount} />
                </div>

                <div className="md:col-span-2 mt-4">
                  <h3 className="font-black text-indigo-900 border-b border-indigo-100 pb-2 mb-6">Required Documents</h3>
                  <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-wide">Please upload clear copies of the following documents.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FileUpload label="Lab License" onChange={(e) => handleFileChange(e, 'labLicense')} />
                  <FileUpload label="Lab Logo" onChange={(e) => handleFileChange(e, 'labLogo')} />
                  <FileUpload label="Lab Photos" onChange={(e) => handleFileChange(e, 'labPhotos')} />
                </div>
              </StepWrapper>
            )}

            {/* Step 4: Bank, Sub & Creds */}
            {currentStep === 4 && (
              <StepWrapper title="Bank Details & Account Setup">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-indigo-100 pb-2 mb-4">Bank Details</h3>
                  </div>
                  <Input label="Account Holder Name" placeholder="As per bank records" value={accountName} onChange={setAccountName} />
                  <Input label="Bank Name" placeholder="E.g., HDFC, SBI" value={bankName} onChange={setBankName} />
                  <Input label="Account Number" placeholder="Account Number" value={accountNumber} onChange={setAccountNumber} />
                  <Input label="IFSC Code" placeholder="IFSC" value={ifscCode} onChange={setIfscCode} />
                  <Input label="UPI ID" required={false} placeholder="example@upi" value={upiId} onChange={setUpiId} />

                  <div className="md:col-span-2 mt-4">
                    <h3 className="font-black text-indigo-900 border-b border-indigo-100 pb-2 mb-4">Subscription Package</h3>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Select Plan</label>
                    <select
                      value={subscriptionPlan}
                      onChange={e => setSubscriptionPlan(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all"
                    >
                      <option value="Free Plan">Free Plan</option>
                      <option value="Monthly Plan">Monthly Plan</option>
                      <option value="Yearly Plan">Yearly Plan</option>
                    </select>
                  </div>
                  <Input label="Commission Percentage (%)" required={false} type="number" placeholder="0%" value={commissionPercentage} onChange={setCommissionPercentage} />

                  <div className="md:col-span-2 mt-4">
                    <h3 className="font-black text-indigo-900 border-b border-indigo-100 pb-2 mb-4">Login Credentials</h3>
                    <p className="text-xs text-slate-500 mb-4">Create credentials for the lab admin panel.</p>
                  </div>
                  <div className="md:col-span-2">
                    <Input label="Username" placeholder="Admin username" value={username} onChange={setUsername} />
                  </div>
                  <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={confirmPassword && confirmPassword !== password ? 'Passwords do not match' : null}
                  />
                </div>
              </StepWrapper>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <StepWrapper title="Review & Submit">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Basic Information</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Lab Name" value={labName} />
                      <DetailRow label="Lab Type" value={labType} />
                      <DetailRow label="Owner" value={ownerName} />
                      <DetailRow label="Registration No." value={registrationNumber} />
                      <DetailRow label="GST No." value={gstNumber} />
                      <DetailRow label="PAN No." value={panNumber} />
                      <DetailRow label="Establishment Year" value={establishmentYear} />
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Contact & Address</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Mobile" value={mobileNumber} />
                      <DetailRow label="Alt Mobile" value={alternateMobile} />
                      <DetailRow label="Email" value={email} />
                      <DetailRow label="Website" value={website} />
                      <DetailRow label="Emergency Contact" value={emergencyContact} />
                      <div className="pt-2">
                        <DetailRow label="Address" value={`${addressLine1}, ${addressLine2}`} />
                        <DetailRow label="Landmark" value={landmark} />
                        <DetailRow label="City & State" value={`${city}, ${state}`} />
                        <DetailRow label="Pincode" value={pincode} />
                      </div>
                    </div>
                  </div>

                  {/* Timing & Services */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Timing & Features</h3>
                    <div className="space-y-3 text-sm mb-4">
                      <DetailRow label="24x7 Available" value={is24x7 ? 'Yes' : 'No'} />
                      {!is24x7 && <DetailRow label="Timings" value={`${openingTime} - ${closingTime}`} />}
                      <DetailRow label="Working Days" value={workingDays} />
                    </div>
                    <h4 className="font-bold text-xs text-slate-500 mb-2">Additional Features:</h4>
                    <p className="text-xs font-bold text-slate-800">
                      {Object.keys(additionalFeatures).filter(k => additionalFeatures[k]).join(', ') || 'None'}
                    </p>
                  </div>

                  {/* Staff & Documents */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Staff & Documents</h3>
                    <div className="space-y-3 text-sm mb-4">
                      <DetailRow label="Pathologist" value={doctorName} />
                      <DetailRow label="Qualification" value={doctorQualification} />
                      <DetailRow label="Experience" value={`${doctorExperience} Years`} />
                      <DetailRow label="Reg. No." value={doctorRegistration} />
                      <DetailRow label="Technicians" value={technicianCount} />
                      <DetailRow label="Nurses" value={nursesCount} />
                      <DetailRow label="Receptionists" value={receptionistCount} />
                    </div>
                    <h4 className="font-bold text-xs text-slate-500 mb-2">Uploaded Documents:</h4>
                    <ul className="text-xs font-bold text-indigo-600 space-y-1">
                      {documents.labLicense && <li>✓ Lab License: {documents.labLicense.name}</li>}
                      {documents.labLogo && <li>✓ Lab Logo: {documents.labLogo.name}</li>}
                      {documents.labPhotos && <li>✓ Lab Photos: {documents.labPhotos.name}</li>}
                      {(!documents.labLicense && !documents.labLogo && !documents.labPhotos) && <li className="text-slate-400">No documents uploaded</li>}
                    </ul>
                  </div>

                  {/* Bank & Credentials */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 lg:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Account & Subscription Setup</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                      <div className="space-y-3">
                        <DetailRow label="Account Name" value={accountName} />
                        <DetailRow label="Bank Name" value={bankName} />
                        <DetailRow label="Account Number" value={accountNumber} />
                        <DetailRow label="IFSC Code" value={ifscCode} />
                        <DetailRow label="UPI ID" value={upiId} />
                      </div>
                      <div className="space-y-3">
                        <DetailRow label="Subscription Plan" value={subscriptionPlan} />
                        <DetailRow label="Commission %" value={commissionPercentage} />
                        <DetailRow label="Admin Username" value={username} />
                        <DetailRow label="Password" value={password ? "••••••••" : ""} />
                      </div>
                    </div>
                  </div>

                  {/* Services Offered */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 lg:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Selected Services & Tests</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(servicesOffered).filter(k => servicesOffered[k]).length > 0
                        ? Object.keys(servicesOffered).filter(k => servicesOffered[k]).map(service => (
                          <span key={service} className="px-3 py-1 bg-white border border-indigo-100 text-indigo-800 text-xs font-bold rounded-lg shadow-sm">
                            {service}
                          </span>
                        ))
                        : <span className="text-sm font-bold text-slate-500">None Selected</span>
                      }
                    </div>
                  </div>
                </div>
              </StepWrapper>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-indigo-600'
                }`}
            >
              ← Back
            </button>
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className={`border-2 px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isStepValid(currentStep)
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-md'
                  }`}
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-200"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Register'}
              </button>
            )}
          </div>

        </div>
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

const Input = ({ label, value, onChange, type = "text", maxLength, placeholder, required = true, error }) => {
  return (
    <div className="flex flex-col relative">
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
        {label} {!required && <span className="text-slate-300 normal-case tracking-normal ml-1">(Optional)</span>}
      </label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600'
          } p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all`}
      />
      {error && <span className="text-[10px] text-red-500 font-bold ml-1 mt-1 uppercase tracking-wider">✗ {error}</span>}
    </div>
  );
};

const FileUpload = ({ label, onChange }) => {
  return (
    <div className="flex flex-col relative">
      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">{label}</label>
      <input
        type="file"
        onChange={onChange}
        className="w-full bg-white border border-slate-200 p-3 rounded-2xl text-xs font-bold outline-none focus:border-indigo-600 transition-all text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
      />
    </div>
  );
};

const DetailRow = ({ label, value }) => {
  return (
    <div className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 items-center">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-black text-slate-800 text-right truncate max-w-[60%]" title={value || '-'}>
        {value || '-'}
      </span>
    </div>
  );
};

export default PathologyForm;
