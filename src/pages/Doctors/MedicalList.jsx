import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MedicalList = ({ submissions, onAction }) => {
  const navigate = useNavigate();
  const onBack = () => navigate('/dashboard');
  const [selectedForm, setSelectedForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [localSubmissions, setLocalSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState('');

  React.useEffect(() => {
    fetch('/c2c_app/medical/requests', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(data => {
        console.log("Raw Medical API Response (GET /requests):", data);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.requests)) list = data.requests;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.medicals)) list = data.medicals;
        else if (data && typeof data === 'object') {
           list = Object.values(data).filter(v => typeof v === 'object');
        }

        // Map API response to our UI structure
        const mappedList = list.map(item => {
          const m = item.medical || {};
          return {
            id: item.medical_id || item._id || item.id,
            customId: item.id || item.medical_id || item._id,
            status: item.status || 'Pending',
            date: item.created_at || item.createdAt || item.date || item.updatedAt || item.updated_at || '',
            doctorId: item.doctorId || item.doctor_id,
            doctorName: item.doctorName || item.doctor_name,
            doctorHospital: item.doctorHospital || item.doctor_hospital || item.doctorAssociatedHospital || 'None Selected',
            medical: {
              medicalName: m.medicalName || m.medical_name || item.medicalName || item.medical_name || item.name || 'N/A',
              whatsappNumber: m.whatsappNumber || m.whatsapp_number || item.whatsappNumber || item.phone || item.whatsapp_number || 'N/A',
              address: m.address || item.address || 'N/A',
              types: m.types || m.type || item.types || item.type || 'N/A',
              licenseNumber: m.licenseNumber || m.license_number || item.licenseNumber || item.license_number || 'N/A',
              gstNumber: m.gstNumber || m.gst_number || item.gstNumber || item.gst_number || 'N/A',
              registrationYear: m.registrationYear || m.registration_year || item.registrationYear || item.registration_year || 'N/A',
              ownerName: m.ownerName || m.owner_name || item.ownerName || item.owner_name || 'N/A',
              email: m.email || item.email || 'N/A',
              pharmacistName: m.pharmacistName || m.pharmacist_name || item.pharmacistName || item.pharmacist_name || 'N/A',
              pharmacistRegNumber: m.pharmacistRegNumber || m.pharmacist_reg_number || item.pharmacistRegNumber || item.pharmacist_reg_number || 'N/A'
            }
          };
        });
        
        setLocalSubmissions(mappedList);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching medical requests:", err);
        setErrorInfo("Fetch failed. Error: " + err.message);
        setLocalSubmissions([]);
        setIsLoading(false);
      });
  }, []);

  const filteredSubmissions = React.useMemo(() => {
    return localSubmissions.filter(sub => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = sub.medical?.medicalName?.toLowerCase().includes(searchLower) ||
        sub.medical?.whatsappNumber?.includes(searchQuery);
      const matchesStatus = statusFilter === 'All' || sub.status?.toLowerCase() === statusFilter.toLowerCase();
      
      let matchesDate = true;
      if (sub.date) {
        const itemDate = new Date(sub.date);
        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0,0,0,0);
          if (itemDate < start) matchesDate = false;
        }
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23,59,59,999);
          if (itemDate > end) matchesDate = false;
        }
      } else if (fromDate || toDate) {
        matchesDate = false;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [localSubmissions, searchQuery, statusFilter, fromDate, toDate]);

  const handleActionClick = async (id, actionType) => {
    const payloadStatus = actionType.toLowerCase();
    console.log(id,selectedForm)
    

    try {
      const response = await fetch(`/c2c_app/medical/review/${id}`, {
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

      const resData = await response.json().catch(() => ({}));
      console.log(`Medical Review API Response (${actionType}):`, response.status, resData);

      if (!response.ok) {
        throw new Error('Failed to update status on server');
      }

      if (onAction) {
        onAction(id, actionType);
      }
      
      // Update local view immediately
      setLocalSubmissions(prev => prev.map(sub => sub.id === id ? { ...sub, status: actionType } : sub));
      if (selectedForm && selectedForm.id === id) {
        setSelectedForm({ ...selectedForm, status: actionType });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status on server.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative">
      {/* Floating Back Buttons */}
      {selectedForm && (
        <button
          type="button"
          onClick={() => setSelectedForm(null)}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-blue-900/40 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-900/60 transition-all shadow-lg"
        >
          ← Back to List
        </button>
      )}

      {/* Care2Connect Header Theme */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#3b82f6] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">
          {selectedForm ? 'Medical Applicant Details' : 'Medical Approval Dashboard'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-4 pb-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden border border-slate-100">
          {!selectedForm ? (
            <div className="p-8 md:p-12">
              <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                Submitted Medicals
                <div className="h-px flex-1 bg-slate-100"></div>
              </h2>

              {/* Filters */}
              <div className="flex flex-col gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search Medical Name or WhatsApp..."
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

                {/* Date Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100 w-full">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mr-2 self-start sm:self-auto select-none">
                    <span>📅</span> Date Range:
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-none">
                    <div className="relative w-full sm:w-48">
                      <input 
                        type="date" 
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="p-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-600 text-slate-700"
                      />
                    </div>
                    <span className="text-slate-400 text-xs font-bold">to</span>
                    <div className="relative w-full sm:w-48">
                      <input 
                        type="date" 
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="p-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-600 text-slate-700"
                      />
                    </div>
                  </div>

                  {(fromDate || toDate) && (
                    <button
                      onClick={() => {
                        setFromDate('');
                        setToDate('');
                      }}
                      className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-xs font-bold rounded-xl transition-all"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              </div>

              {/* Debug / Error Info */}
              {errorInfo && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold font-mono">
                  {errorInfo}
                </div>
              )}

              {/* Grid List with Headers */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden mt-8">
                {/* Headers */}
                <div className="hidden md:grid grid-cols-12 gap-4 py-4 px-6 bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest items-center">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-3">Medical Name</div>
                  <div className="col-span-2">Doctor Name</div>
                  <div className="col-span-2">WhatsApp</div>
                  <div className="col-span-3">Address</div>
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
                    <div className="hidden md:block col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.customId || sub.id}</div>
                    
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Medical Name</span>
                      <h3 className="text-sm font-black text-blue-900 group-hover:text-blue-600 transition-colors truncate">{sub.medical?.medicalName || 'Unknown'}</h3>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Doctor Name</span>
                      <p className="text-xs font-bold text-slate-600 truncate">{sub.doctorName || 'Unknown Doctor'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">WhatsApp</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📞 {sub.medical?.whatsappNumber || 'N/A'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Address</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📍 {sub.medical?.address || 'N/A'}</p>
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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedForm.customId || selectedForm.id}</span>
                    <h2 className="text-3xl font-black text-slate-800 mt-1">{selectedForm.medical?.medicalName}</h2>
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
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Medical Information</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Medical Name" value={selectedForm.medical?.medicalName} />
                      <DetailRow label="WhatsApp" value={selectedForm.medical?.whatsappNumber} />
                      <DetailRow label="Owner Name" value={selectedForm.medical?.ownerName} />
                      <DetailRow label="Email ID" value={selectedForm.medical?.email} />
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Legal Details</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="License No." value={selectedForm.medical?.licenseNumber} />
                      <DetailRow label="GST No." value={selectedForm.medical?.gstNumber} />
                      <DetailRow label="Reg. Year" value={selectedForm.medical?.registrationYear} />
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Pharmacist & Doctor Link</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <DetailRow label="Pharmacist Name" value={selectedForm.medical?.pharmacistName} />
                      <DetailRow label="Pharmacist Reg No." value={selectedForm.medical?.pharmacistRegNumber} />
                      <DetailRow label="Linked Doctor" value={selectedForm.doctorName} />
                      <DetailRow label="Doctor ID" value={selectedForm.doctorId} />
                      <DetailRow label="Doctor's Hospital" value={selectedForm.doctorHospital || 'None Selected'} />
                      <div className="md:col-span-2 mt-2">
                        <DetailRow label="Address" value={selectedForm.medical?.address} />
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Medical Types</h3>
                    <div className="text-sm font-bold text-slate-700 bg-white p-4 rounded-xl border border-slate-200">
                      {selectedForm.medical?.types || 'None Selected'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100">
                {(!selectedForm.status || selectedForm.status.toLowerCase() === 'pending') && (
                  <>
                    <button
                      onClick={() => handleActionClick(selectedForm.id, 'Rejected')}
                      className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      ✗ Reject Medical
                    </button>
                    <button
                      onClick={() => handleActionClick(selectedForm.id, 'Approved')}
                      className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-800 text-white rounded-2xl shadow-xl shadow-blue-200 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      ✓ Approve Medical
                    </button>
                  </>
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

export default MedicalList;
