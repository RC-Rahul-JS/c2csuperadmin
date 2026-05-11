import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HospitalList = ({ submissions, onAction }) => {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  
  const [selectedForm, setSelectedForm] = useState(null);
  const [fullImage, setFullImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Premium mock data
  const mockData = [
    {
      id: "HOSP-001",
      status: "Pending",
      date: new Date().toISOString().split('T')[0],
      basicDetails: {
        hospitalName: "Apollo Grace Hospital",
        hospitalType: "Multi-speciality",
        registrationNumber: "HOSP-REG-99120",
        yearEstablished: "2010",
        gstNumber: "27AAAAA1111A1Z1",
        panNumber: "ABCDE1234F"
      },
      contactInfo: {
        contactPersonName: "Dr. Vikram Seth",
        phone: "9876543210",
        alternatePhone: "9123456780",
        email: "contact@apollograce.com",
        website: "https://apollograce.com"
      },
      addressDetails: {
        fullAddress: "Plot 12, Jubilee Hills Road",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500033",
        googleMapLocation: "https://maps.google.com/?q=Apollo+Grace"
      },
      services: {
        opd: true,
        ipd: true,
        emergency: true,
        icu: true,
        pharmacy: true,
        ambulance: true,
        labTest: true,
        xRay: true,
        mri: false,
        ctScan: false,
        surgery: true,
        homeCare: true
      },
      departments: ["Cardiology", "Orthopedic", "Neurology", "General Medicine", "Pediatrics"],
      doctorInfo: {
        totalDoctors: "45",
        availableSpecialists: "18",
        doctorList: "Dr. Seth (Cardio), Dr. Reddy (Ortho), Dr. Saxena (Neuro)",
        experience: "15"
      },
      operatingDetails: {
        openingTime: "00:00",
        closingTime: "23:59",
        is24x7: "Yes",
        emergencyAvailable: "Yes"
      },
      bankDetails: {
        accountHolderName: "Grace Hospital Pvt Ltd",
        bankName: "HDFC Bank Ltd",
        accountNumber: "501004561289",
        ifscCode: "HDFC0000003",
        upiId: "gracehospital@hdfc"
      },
      systemFeatures: {
        username: "grace_apollo",
        password: "securepassword456",
        notificationPreference: "Both",
        subscriptionPlan: "Yearly Premium"
      },
      documents: {
        hospitalRegistration: { preview: "https://via.placeholder.com/150" },
        ownerIdProof: { preview: "https://via.placeholder.com/150" },
        addressProof: { preview: "https://via.placeholder.com/150" },
        licenseCertificate: { preview: "https://via.placeholder.com/150" },
        hospitalPhotos: { preview: "https://via.placeholder.com/150" },
        logo: { preview: "https://via.placeholder.com/150" },
        doctorCertificates: null,
        nabhCertificate: null,
        gstCertificate: null
      }
    }
  ];

  const [localSubmissions, setLocalSubmissions] = useState([]);
  const [errorInfo, setErrorInfo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://192.168.29.145:5000/c2c_app/hospital/requests', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(data => {
        console.log("Raw API Response:", data);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.requests)) list = data.requests;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.hospitals)) list = data.hospitals;
        else if (data && typeof data === 'object') {
          list = Object.values(data).filter(v => typeof v === 'object');
        }

        if (list.length === 0) {
          setErrorInfo("API returned empty list or unknown format. Displaying local submissions.");
          // Back up to submissions prop or mock
          const combined = submissions && submissions.length > 0 ? submissions : mockData;
          setLocalSubmissions(combined);
          setIsLoading(false);
          return;
        }

        const mappedList = list.map(item => ({
          id: item.hospital_id || item.id || item._id,
          status: item.status || 'Pending',
          date: item.date || new Date().toISOString().split('T')[0],
          basicDetails: {
            hospitalName: item.hospitalName || item.name,
            hospitalType: item.hospitalType,
            registrationNumber: item.registrationNumber,
            yearEstablished: item.yearEstablished,
            gstNumber: item.gstNumber,
            panNumber: item.panNumber,
          },
          contactInfo: {
            contactPersonName: item.contactPersonName,
            phone: item.phone,
            alternatePhone: item.alternatePhone,
            email: item.email,
            website: item.website,
          },
          addressDetails: {
            fullAddress: item.fullAddress || item.address,
            city: item.city,
            state: item.state,
            pincode: item.pincode,
            googleMapLocation: item.googleMapLocation,
          },
          services: {
            opd: !!item.opd,
            ipd: !!item.ipd,
            emergency: !!item.emergency,
            icu: !!item.icu,
            pharmacy: !!item.pharmacy,
            ambulance: !!item.ambulance,
            labTest: !!item.labTest,
            xRay: !!item.xRay,
            mri: !!item.mri,
            ctScan: !!item.ctScan,
            surgery: !!item.surgery,
            homeCare: !!item.homeCare,
          },
          departments: typeof item.departments === 'string' ? item.departments.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(item.departments) ? item.departments : []),
          doctorInfo: {
            totalDoctors: item.totalDoctors,
            availableSpecialists: item.availableSpecialists,
            doctorList: item.doctorList,
            experience: item.experience,
          },
          operatingDetails: {
            openingTime: item.openingTime,
            closingTime: item.closingTime,
            is24x7: item.is24x7,
            emergencyAvailable: item.emergencyAvailable,
          },
          bankDetails: {
            accountHolderName: item.accountHolderName || item.bankDetails?.accountHolderName,
            bankName: item.bankName || item.bankDetails?.bankName,
            accountNumber: item.accountNumber || item.bankDetails?.accountNumber,
            ifscCode: item.ifscCode || item.bankDetails?.ifscCode,
            upiId: item.upiId || item.bankDetails?.upiId,
          },
          systemFeatures: {
            username: item.username,
            password: item.password,
            notificationPreference: item.notificationPreference,
            subscriptionPlan: item.subscriptionPlan,
          },
          documents: {
            hospitalRegistration: { preview: item.hospitalRegistration },
            ownerIdProof: { preview: item.ownerIdProof },
            addressProof: { preview: item.addressProof },
            licenseCertificate: { preview: item.licenseCertificate },
            hospitalPhotos: { preview: item.hospitalPhotos },
            logo: { preview: item.logo },
            doctorCertificates: { preview: item.doctorCertificates },
            nabhCertificate: { preview: item.nabhCertificate },
            gstCertificate: { preview: item.gstCertificate },
          }
        }));

        setLocalSubmissions(mappedList);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching requests:", err);
        setErrorInfo("Fetch failed. Loading mock data for evaluation.");
        const combined = submissions && submissions.length > 0 ? submissions : mockData;
        setLocalSubmissions(combined);
        setIsLoading(false);
      });
  }, [submissions]);

  const handleAction = async (id, actionType) => {
    const payloadStatus = actionType.toLowerCase();
    const payload = {
      status: payloadStatus,
      admin_id: "admin_123",
      reason: `Admin changed status to ${actionType}`
    };

    console.log(`📤 [Hospital List] POSTing review action payload to http://192.168.29.145:5000/c2c_app/hospital/review/${id}:`, payload);

    try {
      const response = await fetch(`http://192.168.29.145:5000/c2c_app/hospital/review/${id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      console.log(`📥 [Hospital List] Review endpoint responded with status:`, response.status);

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }

      if (onAction) {
        onAction(id, actionType);
      }

      setLocalSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: actionType } : sub));
      if (selectedForm && selectedForm.id === id) {
        setSelectedForm({ ...selectedForm, status: actionType });
      }
    } catch (err) {
      console.error(err);
      alert("Status updated locally (Server integration failed / Offline mode).");
      setLocalSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: actionType } : sub));
      if (selectedForm && selectedForm.id === id) {
        setSelectedForm({ ...selectedForm, status: actionType });
      }
    }
  };

  const filteredSubmissions = React.useMemo(() => {
    return localSubmissions.filter(sub => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = sub.basicDetails?.hospitalName?.toLowerCase().includes(searchLower) ||
        sub.contactInfo?.phone?.includes(searchQuery);
      const matchesStatus = statusFilter === 'All' || sub.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [localSubmissions, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      {/* Full Image Modal */}
      {fullImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setFullImage(null)}>
          <div className="relative max-w-5xl max-h-screen">
            <button className="absolute -top-12 right-0 text-white text-4xl font-black hover:text-red-500 transition-colors" onClick={() => setFullImage(null)}>×</button>
            <img src={fullImage} className="max-w-full max-h-[90vh] object-contain rounded-xl border-4 border-white/10 shadow-2xl" alt="Full Preview" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* Back Button */}
      {selectedForm && (
        <button
          type="button"
          onClick={() => setSelectedForm(null)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-indigo-900/40 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900/60 transition-all shadow-lg"
        >
          ← Back to List
        </button>
      )}

      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#312e81] to-[#4f46e5] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">
          {selectedForm ? 'Hospital Profile Verification' : 'Hospital Registration List'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-4 pb-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-slate-100">
          {!selectedForm ? (
            <div className="p-8 md:p-12">
              <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                Submitted Applications
                <div className="h-px flex-1 bg-slate-100"></div>
              </h2>

              {errorInfo && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold font-mono">
                  ⚠️ {errorInfo}
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search Hospital Name or Phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all"
                />
                <div className="flex gap-2">
                  {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === status ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid List with Headers */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden mt-8">
                <div className="hidden md:grid grid-cols-12 gap-4 py-4 px-6 bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest items-center">
                  <div className="col-span-4">Hospital Name</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-2">Phone</div>
                  <div className="col-span-2">City</div>
                  <div className="col-span-1 text-center">Status</div>
                </div>

                {isLoading ? (
                  <div className="text-center py-16 bg-slate-50">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Loading Data...</p>
                  </div>
                ) : filteredSubmissions.length > 0 ? filteredSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedForm(sub)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 px-6 border-b border-slate-100 last:border-0 hover:bg-indigo-50 cursor-pointer transition-all items-center group"
                  >
                    <div className="col-span-1 md:col-span-4 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Hospital Name</span>
                      <h3 className="text-sm font-black text-indigo-900 group-hover:text-indigo-600 transition-colors truncate">{sub.basicDetails?.hospitalName || 'Unknown Hospital'}</h3>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Type</span>
                      <p className="text-xs font-bold text-slate-600 truncate">{sub.basicDetails?.hospitalType || 'General'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Phone</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📞 {sub.contactInfo?.phone || 'N/A'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">City</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📍 {sub.addressDetails?.city || 'N/A'}</p>
                    </div>
                    
                    <div className="col-span-1 flex items-center md:justify-center mt-2 md:mt-0">
                      <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-wider whitespace-nowrap shadow-sm ${sub.status?.toLowerCase() === 'approved' ? 'bg-green-600 text-white' :
                          sub.status?.toLowerCase() === 'rejected' ? 'bg-red-600 text-white' :
                            'bg-amber-500 text-white'
                        }`}>
                        {sub.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-16 opacity-50 bg-slate-50">
                    <span className="text-4xl block mb-4">🔍</span>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">No results found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="p-8 md:p-12">
                {/* Header info */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedForm.id}</span>
                    <h2 className="text-3xl font-black text-slate-800 mt-1">{selectedForm.basicDetails?.hospitalName}</h2>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest self-start md:self-auto shadow-md ${selectedForm.status?.toLowerCase() === 'approved' ? 'bg-green-600 text-white border-2 border-green-700' :
                      selectedForm.status?.toLowerCase() === 'rejected' ? 'bg-red-600 text-white border-2 border-red-700' :
                        'bg-amber-500 text-white border-2 border-amber-600'
                    }`}>
                    {selectedForm.status || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 1. Basic details */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Hospital Information</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Hospital Type" value={selectedForm.basicDetails?.hospitalType} />
                      <DetailRow label="Reg. Number" value={selectedForm.basicDetails?.registrationNumber} />
                      <DetailRow label="Established" value={selectedForm.basicDetails?.yearEstablished} />
                      <DetailRow label="GST Number" value={selectedForm.basicDetails?.gstNumber} />
                      <DetailRow label="PAN Number" value={selectedForm.basicDetails?.panNumber} />
                    </div>
                  </div>

                  {/* 2. Contact details */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Contact Directory</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Contact Person" value={selectedForm.contactInfo?.contactPersonName} />
                      <DetailRow label="Phone" value={selectedForm.contactInfo?.phone} />
                      <DetailRow label="Alt. Phone" value={selectedForm.contactInfo?.alternatePhone} />
                      <DetailRow label="Email" value={selectedForm.contactInfo?.email} />
                      <DetailRow label="Website" value={selectedForm.contactInfo?.website} />
                    </div>
                  </div>

                  {/* 3. Address Details */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Address Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="md:col-span-2">
                        <DetailRow label="Full Address" value={selectedForm.addressDetails?.fullAddress} />
                      </div>
                      <DetailRow label="City" value={selectedForm.addressDetails?.city} />
                      <DetailRow label="State" value={selectedForm.addressDetails?.state} />
                      <DetailRow label="Pincode" value={selectedForm.addressDetails?.pincode} />
                      <DetailRow label="Google Maps Location" value={selectedForm.addressDetails?.googleMapLocation} />
                    </div>
                  </div>

                  {/* 4. Services Checklist */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Hospital Services</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {Object.entries(selectedForm.services || {}).map(([key, val]) => (
                        <div key={key} className={`p-3 rounded-xl border flex items-center justify-between font-black text-xs ${val ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-100 bg-white text-slate-300'}`}>
                          <span>{key.toUpperCase()}</span>
                          <span>{val ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Specializations list */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Departments & Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedForm.departments && selectedForm.departments.length > 0 ? selectedForm.departments.map((dept, i) => (
                        <span key={i} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-wider">
                          {dept}
                        </span>
                      )) : <span className="text-xs text-slate-400 font-bold">No departments specified</span>}
                    </div>
                  </div>

                  {/* 6. Doctor & Operating details */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Doctor Information</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Total Doctors" value={selectedForm.doctorInfo?.totalDoctors} />
                      <DetailRow label="Available Specialists" value={selectedForm.doctorInfo?.availableSpecialists} />
                      <DetailRow label="Average Experience" value={`${selectedForm.doctorInfo?.experience} Years`} />
                      <div className="border-t border-slate-200/50 pt-2 mt-2">
                        <span className="font-bold text-slate-500 block mb-1">Doctor List Details:</span>
                        <p className="bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
                          {selectedForm.doctorInfo?.doctorList || 'No list submitted'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Operating & Time Details</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Opening Time" value={selectedForm.operatingDetails?.openingTime} />
                      <DetailRow label="Closing Time" value={selectedForm.operatingDetails?.closingTime} />
                      <DetailRow label="24x7 Available" value={selectedForm.operatingDetails?.is24x7} />
                      <DetailRow label="Emergency Services" value={selectedForm.operatingDetails?.emergencyAvailable} />
                    </div>
                  </div>

                  {/* 7. Bank Details */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <DetailRow label="Account Holder Name" value={selectedForm.bankDetails?.accountHolderName} />
                      <DetailRow label="Bank Name" value={selectedForm.bankDetails?.bankName} />
                      <DetailRow label="Account Number" value={selectedForm.bankDetails?.accountNumber} />
                      <DetailRow label="IFSC Code" value={selectedForm.bankDetails?.ifscCode} />
                      <div className="md:col-span-2">
                        <DetailRow label="UPI ID" value={selectedForm.bankDetails?.upiId} />
                      </div>
                    </div>
                  </div>

                  {/* 8. App/System features */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">System Credentials & Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <DetailRow label="System Username" value={selectedForm.systemFeatures?.username} />
                      <DetailRow label="System Password" value={selectedForm.systemFeatures?.password} isPassword={true} />
                      <DetailRow label="Notification Preferences" value={selectedForm.systemFeatures?.notificationPreference} />
                      <DetailRow label="Subscription Plan" value={selectedForm.systemFeatures?.subscriptionPlan} />
                    </div>
                  </div>

                  {/* 9. Document verification */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-indigo-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Document Verification Vault (Mandatory Only)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <DocPreview label="Reg Certificate" doc={selectedForm.documents?.hospitalRegistration} onImageClick={setFullImage} />
                      <DocPreview label="License Certificate" doc={selectedForm.documents?.licenseCertificate} onImageClick={setFullImage} />
                      <DocPreview label="Logo Thumbnail" doc={selectedForm.documents?.logo} onImageClick={setFullImage} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100">
                {selectedForm.status !== 'Rejected' && (
                  <button
                    onClick={() => handleAction(selectedForm.id, 'Rejected')}
                    className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    ✗ Reject Profile
                  </button>
                )}
                {selectedForm.status !== 'Approved' && (
                  <button
                    onClick={() => handleAction(selectedForm.id, 'Approved')}
                    className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-800 text-white rounded-2xl shadow-xl shadow-indigo-200 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    ✓ Approve Onboarding
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const DetailRow = ({ label, value, isPassword }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 items-center">
      <span className="font-bold text-slate-500">{label}</span>
      <div className="flex items-center gap-2 max-w-[60%]">
        <span className="font-black text-slate-800 text-right truncate" title={value || '-'}>
          {isPassword ? (show ? value : '••••••••') : (value || '-')}
        </span>
        {isPassword && value && (
          <button onClick={() => setShow(!show)} className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
            {show ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const DocPreview = ({ label, doc, onImageClick }) => (
  <div className="flex flex-col items-center">
    <div
      className={`w-full h-24 rounded-xl flex items-center justify-center border-2 overflow-hidden bg-white mb-2 transition-all ${doc && doc.preview ? 'border-green-200 cursor-pointer hover:border-green-400 hover:shadow-lg group' : 'border-slate-200 border-dashed'}`}
      onClick={() => { if (doc && doc.preview && onImageClick) onImageClick(doc.preview); }}
    >
      {doc && doc.preview ? (
        <img src={doc.preview} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : doc ? (
        <span className="text-3xl">📄</span>
      ) : (
        <span className="text-xs font-bold text-slate-300">MISSING</span>
      )}
    </div>
    <span className="text-[9px] font-black uppercase text-slate-500 text-center leading-tight truncate w-full" title={label}>{label}</span>
  </div>
);

export default HospitalList;
