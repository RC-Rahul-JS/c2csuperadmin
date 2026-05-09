import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const List = ({ submissions, onAction }) => {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  const [selectedForm, setSelectedForm] = useState(null);
  const [fullImage, setFullImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Initial mock data if no submissions provided
  const mockData = [
    {
      id: "APP-001",
      status: "Pending",
      date: new Date().toISOString().split('T')[0],
      onboarding: {
        fullName: "Dr. Rahul Sharma",
        phone: "9876543210",
        gender: "Male",
        state: "Maharashtra",
        college: "AIIMS Delhi",
        degree: "MBBS, MD",
        completionYear: "2015",
        registrationNumber: "REG12345M",
        registrationYear: "2015-08",
        experience: "10",
        specialization: "Cardiology",
        clinicLocation: "Mumbai Central, MH",
        clinicNumber: "9123456780",
        timings: "10:00 AM - 06:00 PM",
        fees: "1500",
      },
      essentials: {
        email: "rahul.sharma@example.com",
        phonenumberID: "1234567890",
        whatsAppBusinessAccountID: "0987654321",
        secondaryId: "PAN-ABCDE1234F",
        appointmentfee: "1500",
        otcfee: "200",
        platformfee: "100",
        password: "securepassword123"
      },
      bankDetails: {
        accountHolderName: "Dr. Rahul Sharma",
        bankName: "State Bank of India",
        accountNumber: "50100012345678",
        ifscCode: "SBIN0001234",
        upiId: "rahul@okaxis"
      },
      documents: {
        idProof: { preview: "https://via.placeholder.com/150" },
        registrationDoc: { preview: "https://via.placeholder.com/150" },
        hospitalId: null,
        photo: { preview: "https://via.placeholder.com/150" }
      }
    }
  ];

  const [localSubmissions, setLocalSubmissions] = useState([]);
  const [errorInfo, setErrorInfo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from API
  React.useEffect(() => {
    fetch('http://192.168.29.145:5000/c2c_app/doctor/requests', {
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
        else if (data && Array.isArray(data.doctors)) list = data.doctors;
        else if (data && typeof data === 'object') {
           list = Object.values(data).filter(v => typeof v === 'object');
        }

        if (list.length === 0) {
           setErrorInfo("API returned empty list or unknown format. See console for details.");
        }
        const mappedList = list.map(item => ({
          id: item.doctor_id || item.id || item._id,
          status: item.status || 'Pending',
          onboarding: {
            fullName: item.fullName || item.name,
            phone: item.phone,
            gender: item.gender,
            state: item.state,
            college: item.college,
            degree: item.degree,
            completionYear: item.completionYear,
            registrationNumber: item.registrationNumber,
            registrationYear: item.registrationYear,
            experience: item.experience,
            specialization: item.specialization || item.speciality,
            clinicLocation: item.clinicLocation || item.address,
            clinicNumber: item.clinicNumber,
            timings: item.timings,
            fees: item.fees || item.doctorfee,
          },
          essentials: {
            email: item.email,
            phonenumberID: item.phonenumberID,
            whatsAppBusinessAccountID: item.whatsAppBusinessAccountID,
            secondaryId: item.secondaryId,
            appointmentfee: item.appointmentfee,
            otcfee: item.otcfee,
            platformfee: item.platformfee,
            password: item.password,
          },
          bankDetails: {
            accountHolderName: item.accountHolderName || item.bankDetails?.accountHolderName,
            bankName: item.bankName || item.bankDetails?.bankName,
            accountNumber: item.accountNumber || item.bankDetails?.accountNumber,
            ifscCode: item.ifscCode || item.bankDetails?.ifscCode,
            upiId: item.upiId || item.bankDetails?.upiId,
          },
          documents: {
            idProof: { preview: item.idProof },
            registrationDoc: { preview: item.registrationDoc },
            hospitalId: { preview: item.hospitalId },
            photo: { preview: item.photo }
          }
        }));
        
        setLocalSubmissions(mappedList);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching requests:", err);
        setErrorInfo("Fetch failed. Is the backend running and allowing CORS? Error: " + err.message);
        setIsLoading(false);
      });
  }, []);

  const handleAction = async (id, actionType) => {
    const payloadStatus = actionType.toLowerCase();

    try {
      const response = await fetch(`http://192.168.29.145:5000/c2c_app/doctor/review/${id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          status: payloadStatus,
          admin_id: "admin_123", // placeholder
          reason: `Admin changed status to ${actionType}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }

      if (onAction) {
        onAction(id, actionType);
      }

      // Update list immediately
      setLocalSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: actionType } : sub));

      // Update details view immediately
      if (selectedForm && selectedForm.id === id) {
        setSelectedForm({ ...selectedForm, status: actionType });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status on server.");
    }
  };

  const filteredSubmissions = React.useMemo(() => {
    return localSubmissions.filter(sub => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = sub.onboarding?.fullName?.toLowerCase().includes(searchLower) ||
        sub.onboarding?.phone?.includes(searchQuery);
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
            <img src={fullImage} className="max-w-full max-h-[90vh] object-contain rounded-xl border-4 border-white/10 shadow-2xl" alt="Full Screen Preview" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* Floating Back Buttons */}
      <button
        type="button"
        onClick={selectedForm ? () => setSelectedForm(null) : onBack}
        className="fixed top-4 left-4 z-50 px-4 py-2 bg-blue-900/40 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900/60 transition-all shadow-lg"
      >
        {selectedForm ? '← Back to List' : '← Dashboard'}
      </button>

      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#3b82f6] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">
          {selectedForm ? 'Applicant Details' : 'Doctor List'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-4 pb-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden border border-slate-100">
          {!selectedForm ? (
            <div className="p-8 md:p-12">
              <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                Submitted Forms
                <div className="h-px flex-1 bg-slate-100"></div>
              </h2>

              {/* Debug / Error Info */}
              {errorInfo && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold font-mono">
                  {errorInfo}
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search Doctor Name or Phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-600 transition-all"
                />
                <div className="flex gap-2">
                  {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === status ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid List with Headers */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden mt-8">
                {/* Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 py-4 px-6 bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest items-center">
                  <div className="col-span-3">Doctor Name</div>
                  <div className="col-span-3">Specialization</div>
                  <div className="col-span-2">Phone</div>
                  <div className="col-span-3">City</div>
                  <div className="col-span-1 text-center">Status</div>
                </div>

                {isLoading ? (
                  <div className="text-center py-16 bg-slate-50">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Loading Data...</p>
                  </div>
                ) : filteredSubmissions.length > 0 ? filteredSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedForm(sub)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 px-6 border-b border-slate-100 last:border-0 hover:bg-blue-50 cursor-pointer transition-all items-center group"
                  >
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Doctor Name</span>
                      <h3 className="text-sm font-black text-blue-900 group-hover:text-blue-600 transition-colors truncate">{sub.onboarding?.fullName || 'Unknown'}</h3>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Specialization</span>
                      <p className="text-xs font-bold text-slate-600 truncate">{sub.onboarding?.specialization || 'General'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Phone</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📞 {sub.onboarding?.phone || 'N/A'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">City</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📍 {sub.onboarding?.state || 'N/A'}</p>
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
                {/* Details Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedForm.id}</span>
                    <h2 className="text-3xl font-black text-slate-800 mt-1">{selectedForm.onboarding?.fullName}</h2>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest self-start md:self-auto shadow-md ${selectedForm.status?.toLowerCase() === 'approved' ? 'bg-green-600 text-white border-2 border-green-700' :
                      selectedForm.status?.toLowerCase() === 'rejected' ? 'bg-red-600 text-white border-2 border-red-700' :
                        'bg-amber-500 text-white border-2 border-amber-600'
                    }`}>
                    {selectedForm.status || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Section 1 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Identity & Contact</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Email" value={selectedForm.essentials?.email} />
                      <DetailRow label="Primary Phone" value={selectedForm.onboarding?.phone} />
                      <DetailRow label="Phone ID" value={selectedForm.essentials?.phonenumberID} />
                      <DetailRow label="WhatsApp ID" value={selectedForm.essentials?.whatsAppBusinessAccountID} />
                      <DetailRow label="Secondary ID" value={selectedForm.essentials?.secondaryId} />
                      <DetailRow label="Gender" value={selectedForm.onboarding?.gender} />
                      <DetailRow label="Password" value={selectedForm.essentials?.password} isPassword={true} />
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Academic Profile</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Degree" value={selectedForm.onboarding?.degree} />
                      <DetailRow label="College" value={selectedForm.onboarding?.college} />
                      <DetailRow label="State" value={selectedForm.onboarding?.state} />
                      <DetailRow label="Completion Year" value={selectedForm.onboarding?.completionYear} />
                      <DetailRow label="Reg. Number" value={selectedForm.onboarding?.registrationNumber} />
                      <DetailRow label="Reg. Year" value={selectedForm.onboarding?.registrationYear} />
                      <DetailRow label="Experience (Yrs)" value={selectedForm.onboarding?.experience} />
                      <DetailRow label="Specialization" value={selectedForm.onboarding?.specialization} />
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Clinic & Operations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <DetailRow label="Address" value={selectedForm.onboarding?.clinicLocation} />
                      <DetailRow label="Clinic Number" value={selectedForm.onboarding?.clinicNumber} />
                      <div className="md:col-span-2">
                        <DetailRow label="Time Slots" value={selectedForm.onboarding?.timings} />
                      </div>
                      {selectedForm.onboarding?.associatedHospital && (
                        <div className="md:col-span-2">
                          <DetailRow label="Associated Hospital" value={selectedForm.onboarding?.associatedHospital} />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-2 md:col-span-2">
                        <DetailRow label="Doctor Fee" value={`₹${selectedForm.onboarding?.fees || 0}`} />
                        <DetailRow label="Appt Fee" value={`₹${selectedForm.essentials?.appointmentfee || 0}`} />
                        <DetailRow label="OTC Fee" value={`₹${selectedForm.essentials?.otcfee || 0}`} />
                        <DetailRow label="Platform Fee" value={`₹${selectedForm.essentials?.platformfee || 0}`} />
                      </div>
                    </div>
                  </div>

                  {/* Section 3.5: Bank Details */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Bank Details</h3>
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

                  {/* Section 4 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Document Verification</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DocPreview label="ID Proof" doc={selectedForm.documents?.idProof} onImageClick={setFullImage} />
                      <DocPreview label="Reg Doc" doc={selectedForm.documents?.registrationDoc} onImageClick={setFullImage} />
                      <DocPreview label="Hosp ID" doc={selectedForm.documents?.hospitalId} onImageClick={setFullImage} />
                      <DocPreview label="Photo" doc={selectedForm.documents?.photo} onImageClick={setFullImage} />
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
                    className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-800 text-white rounded-2xl shadow-xl shadow-blue-200 text-[10px] font-black uppercase tracking-widest transition-all"
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
      className={`w-full h-24 rounded-xl flex items-center justify-center border-2 overflow-hidden bg-white mb-2 transition-all ${doc ? 'border-green-200 cursor-pointer hover:border-green-400 hover:shadow-lg group' : 'border-slate-200 border-dashed'}`}
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
    <span className="text-[10px] font-black uppercase text-slate-500">{label}</span>
  </div>
);

export default List;
