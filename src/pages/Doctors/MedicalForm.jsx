import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MedicalForm = ({ onSubmitSuccess }) => {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  
  // --- STATE: STEP TRACKING ---
  const [currentStep, setCurrentStep] = useState(1);

  // --- STATE: API DATA STORES ---
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [hospitals, setHospitals] = useState([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // --- STATE: FORM DETAILS ---
  const [medicalName, setMedicalName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [medicalTypes, setMedicalTypes] = useState({
    prescription: false, // Prescription Medicines (Rx required)
    otc: false,          // Over-the-Counter (OTC) Medicines
    generic: false,      // Generic Medicines
    branded: false,      // Branded Medicines
    ayurvedic: false,    // Ayurvedic Medicines -> regulated under Ministry of AYUSH
    homeopathic: false,  // Homeopathic Medicines
    surgical: false,     // Surgical Items (bandages, syringes, etc.)
    supplements: false,  // Health Supplements (vitamins, protein, etc.)
    babyCare: false,     // Baby Care Products
    personalCare: false, // Personal Care (skin, hygiene)
    devices: false       // Medical Devices (BP machine, glucometer)
  });
  const [licenseNumber, setLicenseNumber] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [registrationYear, setRegistrationYear] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [pharmacistName, setPharmacistName] = useState('');
  const [pharmacistRegNumber, setPharmacistRegNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch Approved Doctors
    setIsLoadingDoctors(true);
    fetch('https://api.care2connect.in/c2c_app/doctor/requests', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(data => {
        console.log("Raw API Response (GET Doctor Requests for Medical Form):", data);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.requests)) list = data.requests;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.doctors)) list = data.doctors;
        else if (data && typeof data === 'object') {
          list = Object.values(data).filter(v => typeof v === 'object');
        }

        const mappedList = list
          .map(item => ({
            id: item.doctor_id || item.id || item._id,
            status: item.status || 'Pending',
            fullName: item.onboarding?.fullName || item.Name || item.name || '',
            phone: item.onboarding?.phone || item.phone || '',
            specialization: item.onboarding?.specialization || item.specialization || item.speciality || '',
            clinicLocation: item.onboarding?.clinicLocation || item.clinicLocation || item.address || '',
            associatedHospital: item.onboarding?.associatedHospital || item.associatedHospital || item.associated_hospital || item.AssociatedHospital || ''
          }))
          // Only show APPROVED doctors
          .filter(doc => {
            const st = (doc.status || '').toLowerCase();
            return st === 'approved' || st === 'approve';
          });

        console.log("Mapped Approved Doctors List for Medical Selection Form:", mappedList);
        setDoctors(mappedList);
      })
      .catch(err => {
        console.error("Error fetching doctors:", err);
        setDoctors([]);
      })
      .finally(() => {
        setIsLoadingDoctors(false);
      });

    // 2. Fetch Approved Hospitals
    setIsLoadingHospitals(true);
    fetch('https://api.care2connect.in/c2c_app/hospital/requests', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(data => {
        console.log("Raw Hospital Response (GET Hospitals for Medical Form):", data);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.requests)) list = data.requests;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.hospitals)) list = data.hospitals;

        const approvedList = list
          .filter(h => {
            const st = (h.status || '').toLowerCase();
            return st === 'approved' || st === 'approve';
          })
          .map(h => ({
            id: h.id || h._id,
            name: h.basicDetails?.hospitalName || h.hospitalName || h.Name || h.name || ''
          }))
          .filter(h => h.name); // Ensure name is not empty

        console.log("Mapped Approved Hospitals List for Medical Selection Form:", approvedList);
        setHospitals(approvedList);
      })
      .catch(err => {
        console.error("Error fetching hospitals for medical form:", err);
        setHospitals([]);
      })
      .finally(() => {
        setIsLoadingHospitals(false);
      });
  }, []);

  const handleTypeChange = (type) => {
    setMedicalTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const typeLabels = {
    prescription: "Prescription Medicines (Rx required)",
    otc: "Over-the-Counter (OTC) Medicines",
    generic: "Generic Medicines",
    branded: "Branded Medicines",
    ayurvedic: "Ayurvedic Medicines",
    homeopathic: "Homeopathic Medicines",
    surgical: "Surgical Items",
    supplements: "Health Supplements",
    babyCare: "Baby Care Products",
    personalCare: "Personal Care",
    devices: "Medical Devices"
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const finalData = {
      id: "MED-" + Math.floor(Math.random() * 10000),
      status: "Pending",
      doctorId: selectedDoctor?.id,
      doctorName: selectedDoctor?.fullName,
      doctorHospital: selectedDoctor?.associatedHospital || 'None Selected',
      medical: {
        medicalName,
        whatsappNumber,
        address,
        types: Object.entries(medicalTypes).filter(([_, v]) => v).map(([k]) => typeLabels[k]).join(', '),
        licenseNumber,
        gstNumber,
        registrationYear,
        ownerName,
        email,
        pharmacistName,
        pharmacistRegNumber
      }
    };

    try {
      const response = await fetch('https://api.care2connect.in/c2c_app/medical/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(finalData)
      });

      const resData = await response.json().catch(() => ({}));
      console.log("Medical Submit API Response (POST /request):", response.status, resData);

      if (!response.ok) {
        throw new Error('API Error: ' + response.statusText);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess(finalData);
      }

      alert("Medical Profile Synchronized Successfully!");
      
      // Reset form fields
      setCurrentStep(1);
      setMedicalName('');
      setWhatsappNumber('');
      setAddress('');
      setMedicalTypes({
        prescription: false,
        otc: false,
        generic: false,
        branded: false,
        ayurvedic: false,
        homeopathic: false,
        surgical: false,
        supplements: false,
        babyCare: false,
        personalCare: false,
        devices: false
      });
      setLicenseNumber('');
      setGstNumber('');
      setRegistrationYear('');
      setOwnerName('');
      setEmail('');
      setPharmacistName('');
      setPharmacistRegNumber('');
      setSelectedHospitalId('');
      setSelectedHospital(null);
      setSelectedDoctorId('');
      setSelectedDoctor(null);

    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit form. Please check the API. Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const isStepValid = (step) => {
    switch (step) {
      case 1: 
        return !!selectedDoctorId && !isLoadingDoctors;
      case 2:
        return !!(
          medicalName && 
          ownerName && 
          registrationYear && registrationYear.length === 4 &&
          whatsappNumber && whatsappNumber.length === 10 && 
          email && email.includes('@') && 
          address
        );
      case 3:
        return !!(
          licenseNumber && 
          pharmacistName && 
          pharmacistRegNumber &&
          Object.values(medicalTypes).some(v => v === true)
        );
      case 4:
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative pb-20">
      {isSubmitting && (
        <div className="fixed inset-0 bg-indigo-950/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
          <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/20 flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-black uppercase tracking-wider mb-2">Submitting Profile</h3>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest animate-pulse">Synchronizing Database...</p>
          </div>
        </div>
      )}

      {/* Floating Back Button */}
      {currentStep > 1 && (
        <button
          type="button"
          onClick={() => setCurrentStep(currentStep - 1)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-indigo-900/40 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900/60 transition-all shadow-lg"
        >
          ← Back
        </button>
      )}

      {/* Header with 4-Step Progress Bar */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#312e81] to-[#4f46e5] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">
          Medical Onboarding System
        </p>

        {/* 4-Step Progress Bar */}
        <div className="max-w-4xl mx-auto mt-10 flex items-center justify-between relative overflow-x-auto py-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20 -translate-y-1/2 z-0"></div>
          {Array.from({ length: 4 }, (_, i) => i + 1).map(step => (
            <div 
              key={step} 
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-500 ${
                currentStep >= step 
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
            
            {/* Step 1: Doctor & Hospital Link */}
            {currentStep === 1 && (
              <StepWrapper title="Doctor & Hospital Link">
                <p className="text-xs text-slate-400 font-bold uppercase mb-6">Link your medical shop to an approved hospital and select a doctor:</p>
                
                {/* Premium Active Fetching Loading Indicator */}
                {(isLoadingDoctors || isLoadingHospitals) && (
                  <div className="flex items-center justify-center gap-3 p-5 mb-8 bg-indigo-50 border border-indigo-100/60 rounded-3xl animate-pulse">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-indigo-950 uppercase tracking-widest">
                      Fetching approved doctors & hospitals database...
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-indigo-50/40 border border-indigo-100/60 rounded-3xl mb-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                      🏥 Link Hospital (Optional) {isLoadingHospitals && <span className="text-indigo-600 animate-pulse font-black">(LOADING...)</span>}
                    </label>
                    <select
                      disabled={isLoadingHospitals}
                      value={selectedHospitalId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedHospitalId(id);
                        const hospObj = hospitals.find(h => h.id === id);
                        setSelectedHospital(hospObj || null);
                        // Reset doctor when hospital changes
                        setSelectedDoctorId('');
                        setSelectedDoctor(null);
                      }}
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all cursor-pointer shadow-sm focus:bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {isLoadingHospitals ? "Loading hospitals..." : "-- Direct Doctor Selection (No Hospital) --"}
                      </option>
                      {hospitals.map(hosp => (
                        <option key={hosp.id} value={hosp.id}>
                          {hosp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">
                      **🩺 Select Approved Doctor <span className="text-red-500">*</span>** {isLoadingDoctors && <span className="text-indigo-600 animate-pulse font-black">(LOADING...)</span>}
                    </label>
                    <select
                      required
                      disabled={isLoadingDoctors}
                      value={selectedDoctorId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedDoctorId(id);
                        const docObj = doctors.find(d => d.id === id);
                        setSelectedDoctor(docObj || null);
                      }}
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 transition-all cursor-pointer shadow-sm focus:bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {isLoadingDoctors ? "Loading doctors..." : "-- Choose Doctor --"}
                      </option>
                      {doctors
                        .filter(doc => {
                          if (selectedHospital) {
                            const docHosp = (doc.associatedHospital || '').toLowerCase().trim();
                            const targetHospName = (selectedHospital.name || '').toLowerCase().trim();
                            const targetHospId = (selectedHospital.id || '').toLowerCase().trim();
                            return docHosp === targetHospName || docHosp === targetHospId;
                          }
                          return true;
                        })
                        .map(doc => (
                          <option key={doc.id} value={doc.id}>
                            {doc.fullName} ({doc.specialization || 'General'})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 2: Medical Shop & Contact Details */}
            {currentStep === 2 && (
              <StepWrapper title="Medical Shop & Contact Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Medical Name" 
                    placeholder="Enter Medical Name" 
                    value={medicalName} 
                    onChange={setMedicalName} 
                  />
                  <Input 
                    label="Owner Name" 
                    placeholder="Enter Owner Name" 
                    value={ownerName} 
                    onChange={setOwnerName} 
                  />
                  <Input 
                    label="Registration Year" 
                    placeholder="YYYY" 
                    maxLength="4"
                    value={registrationYear} 
                    onChange={v => setRegistrationYear(v.replace(/[^0-9]/g, ''))} 
                    error={registrationYear && registrationYear.length !== 4 ? 'Registration year must be a 4-digit number' : null}
                  />
                  <Input 
                    label="WhatsApp Number" 
                    type="tel"
                    maxLength="10"
                    placeholder="10-digit WhatsApp No." 
                    value={whatsappNumber} 
                    onChange={v => setWhatsappNumber(v.replace(/[^0-9]/g, ''))} 
                    error={whatsappNumber && whatsappNumber.length !== 10 ? 'WhatsApp number must be 10 digits' : null}
                  />
                  <div className="md:col-span-2">
                    <Input 
                      label="Email ID" 
                      type="email"
                      placeholder="Enter Email Address" 
                      value={email} 
                      onChange={setEmail} 
                      error={email && !email.includes('@') ? 'Invalid email format' : null}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Address</label>
                    <textarea 
                      required 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      placeholder="Full Address of the Medical" 
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-600 h-28 resize-none transition-all"
                    />
                  </div>
                </div>
              </StepWrapper>
            )}

            {/* Step 3: Licensing, Pharmacist & Types */}
            {currentStep === 3 && (
              <StepWrapper title="Licensing, Pharmacist & Types">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Input 
                    label="License Number" 
                    placeholder="Enter License Number" 
                    value={licenseNumber} 
                    onChange={setLicenseNumber} 
                  />
                  <Input 
                    label="GST Number" 
                    required={false}
                    placeholder="GST No. (Optional)" 
                    value={gstNumber} 
                    onChange={setGstNumber} 
                  />
                  <Input 
                    label="Registered Pharmacist Name" 
                    placeholder="Enter Pharmacist Name" 
                    value={pharmacistName} 
                    onChange={setPharmacistName} 
                  />
                  <Input 
                    label="Pharmacist Registration Number" 
                    placeholder="Enter Pharmacist Reg. No." 
                    value={pharmacistRegNumber} 
                    onChange={setPharmacistRegNumber} 
                  />
                </div>

                <p className="text-xs text-slate-400 font-bold uppercase mb-4 ml-1">Select all medicine types and items available at your medical shop (Select At Least One):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'prescription', label: 'Prescription Medicines (Rx required)' },
                    { key: 'otc', label: 'Over-the-Counter (OTC)' },
                    { key: 'generic', label: 'Generic Medicines' },
                    { key: 'branded', label: 'Branded Medicines' },
                    { key: 'ayurvedic', label: 'Ayurvedic Medicines (AYUSH)' },
                    { key: 'homeopathic', label: 'Homeopathic Medicines' },
                    { key: 'surgical', label: 'Surgical Items (bandages, syringes)' },
                    { key: 'supplements', label: 'Health Supplements' },
                    { key: 'babyCare', label: 'Baby Care Products' },
                    { key: 'personalCare', label: 'Personal Care (skin, hygiene)' },
                    { key: 'devices', label: 'Medical Devices (BP, glucometer)' }
                  ].map(type => {
                    const isChecked = medicalTypes[type.key];
                    return (
                      <label 
                        key={type.key} 
                        className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isChecked 
                            ? 'border-indigo-600 bg-indigo-50/50' 
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleTypeChange(type.key)} 
                          className="w-5 h-5 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span className="text-xs font-black uppercase text-slate-700 leading-tight">{type.label}</span>
                      </label>
                    );
                  })}
                </div>
              </StepWrapper>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <StepWrapper title="Review Medical Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Medical Information</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Medical Name" value={medicalName} />
                      <DetailRow label="WhatsApp" value={whatsappNumber} />
                      <DetailRow label="Owner Name" value={ownerName} />
                      <DetailRow label="Email ID" value={email} />
                      <DetailRow label="Address" value={address} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Legal Details</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="License No." value={licenseNumber} />
                      <DetailRow label="GST No." value={gstNumber} />
                      <DetailRow label="Reg. Year" value={registrationYear} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Pharmacist & Doctor Link</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <DetailRow label="Pharmacist Name" value={pharmacistName} />
                      <DetailRow label="Pharmacist Reg No." value={pharmacistRegNumber} />
                      <DetailRow label="Linked Doctor" value={selectedDoctor?.fullName} />
                      <DetailRow label="Doctor ID" value={selectedDoctor?.id} />
                      <DetailRow label="Doctor's Hospital" value={selectedDoctor?.associatedHospital || 'None Selected'} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Medical Types</h3>
                    <div className="text-sm font-bold text-slate-700 bg-white p-4 rounded-xl border border-slate-200">
                      {Object.entries(medicalTypes).filter(([_, v]) => v).map(([k]) => typeLabels[k]).join(', ') || 'None Selected'}
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
              className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                currentStep === 1 ? 'opacity-0' : 'text-slate-400 hover:text-indigo-600'
              }`}
            >
              ← Back
            </button>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className={`border-2 px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  !isStepValid(currentStep) 
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
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
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
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
        <input 
          required={required} 
          type={currentType} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          pattern={pattern} 
          maxLength={maxLength} 
          minLength={minLength} 
          min={min} 
          max={max} 
          placeholder={placeholder} 
          className={`w-full bg-slate-50 border ${
            error ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600'
          } p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white transition-all ${
            isPassword ? 'pr-12' : ''
          }`} 
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <span className="text-[10px] text-red-500 font-bold ml-1 mt-1 uppercase tracking-wider">✗ {error}</span>}
    </div>
  );
};

const DetailRow = ({ label, value }) => {
  return (
    <div className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 items-center">
      <span className="font-bold text-slate-500">{label}</span>
      <div className="flex items-center gap-2 max-w-[60%]">
        <span className="font-black text-slate-800 text-right truncate" title={value || '-'}>
          {value || '-'}
        </span>
      </div>
    </div>
  );
};

export default MedicalForm;
