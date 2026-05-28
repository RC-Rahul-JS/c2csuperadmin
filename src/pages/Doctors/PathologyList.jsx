import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const PathologyList = ({ onAction }) => {
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [localSubmissions, setLocalSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState('');

  useEffect(() => {
    // Attempting to fetch Pathology requests. Similar logic to MedicalList.
    fetch('/c2c_app/labs/requests', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(data => {
        console.log("Raw Pathology API Response:", data);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.requests)) list = data.requests;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.pathologys)) list = data.pathologys;
        else if (data && typeof data === 'object') {
           list = Object.values(data).filter(v => typeof v === 'object');
        }

        // Map API response to our UI structure
        const mappedList = list.map(item => {
          const info = item.basicInfo || item.medical || {};
          const addr = item.address || {};
          return {
            id: item._id,
            customId: item.lab_id || item.pathology_id || item.id || item._id,
            status: item.status || 'Pending',
            date: item.created_at || item.createdAt || item.date || item.updatedAt || '',
            basicInfo: {
              labName: info.labName || info.medicalName || item.labName || 'N/A',
              ownerName: info.ownerName || item.ownerName || 'N/A',
              mobileNumber: info.mobileNumber || info.whatsappNumber || item.mobileNumber || 'N/A',
              labType: info.labType || item.labType || 'N/A',
              email: info.email || item.email || 'N/A',
            },
            address: {
              city: addr.city || item.city || 'N/A',
              state: addr.state || item.state || 'N/A',
              fullAddress: addr.addressLine1 || info.address || item.address || 'N/A'
            },
            timing: item.timing || {},
            services: item.services || [],
            staff: item.staff || {},
            bank: item.bank || {},
            subscription: item.subscription || {},
            documents: item.documents || {}
          };
        });
        
        setLocalSubmissions(mappedList);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching pathology requests:", err);
        setErrorInfo("Fetch failed. Using mock data for demonstration. Error: " + err.message);
        
        // MOCK DATA FOR DEMONSTRATION IF API FAILS (as requested for UI development)
        setLocalSubmissions([
          {
            id: 'PATH-1001',
            customId: 'PATH-1001',
            status: 'Pending',
            date: new Date().toISOString(),
            basicInfo: { labName: 'City Care Diagnostics', ownerName: 'Dr. Ramesh Kumar', mobileNumber: '9876543210', labType: 'Diagnostic Center', email: 'contact@citycare.in' },
            address: { city: 'Mumbai', state: 'MH', fullAddress: '123 Main St, Andheri' },
            timing: { is24x7: true },
            services: ['Blood Test', 'X-Ray', 'MRI'],
            staff: { doctorName: 'Dr. Ramesh Kumar' },
            documents: {
              labLicense: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80',
              labLogo: 'https://images.unsplash.com/photo-1563207153-f403bf289096?w=300&q=80',
              labPhotos: 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=300&q=80'
            }
          },
          {
            id: 'PATH-1002',
            customId: 'PATH-1002',
            status: 'Approved',
            date: new Date(Date.now() - 86400000).toISOString(),
            basicInfo: { labName: 'Apex Pathology Lab', ownerName: 'Ms. Sunita Sharma', mobileNumber: '9123456780', labType: 'Pathology', email: 'info@apexpath.com' },
            address: { city: 'Pune', state: 'MH', fullAddress: '45 MG Road, Camp' },
            timing: { is24x7: false, openingTime: '08:00', closingTime: '20:00' },
            services: ['Blood Test', 'Urine Test', 'Thyroid Test', 'CBC'],
            staff: { doctorName: 'Dr. Vivek Joshi' },
            documents: {
              labLicense: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=300&q=80',
              labLogo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&q=80',
              labPhotos: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&q=80'
            }
          }
        ]);
        setIsLoading(false);
      });
  }, []);

  const filteredSubmissions = useMemo(() => {
    return localSubmissions.filter(sub => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = sub.basicInfo?.labName?.toLowerCase().includes(searchLower) ||
        sub.basicInfo?.mobileNumber?.includes(searchQuery);
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
      const response = await fetch(`/c2c_app/labs/review/${id}`, {
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
      console.log(`Lab Review API Response (${actionType}):`, response.status, resData);

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 relative overflow-x-hidden">
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

      {/* Header Theme */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#3b82f6] pt-12 pb-24 px-6 text-center text-white">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Care2Connect</h1>
        <p className="text-[10px] font-bold uppercase opacity-60 tracking-[0.3em] mt-2">
          {selectedForm ? 'Pathology Applicant Details' : 'Pathology Approval Dashboard'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto -mt-12 px-4 pb-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden border border-slate-100">
          {!selectedForm ? (
            <div className="p-8 md:p-12">
              <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-4">
                Submitted Pathology Labs
                <div className="h-px flex-1 bg-slate-100"></div>
              </h2>

              {/* Filters */}
              <div className="flex flex-col gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search Lab Name or Mobile..."
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
                  <div className="col-span-3">Lab Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Mobile</div>
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
                    <div className="hidden md:block col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.customId || sub.id}</div>
                    
                    <div className="col-span-1 md:col-span-3 flex items-center gap-3 overflow-hidden">
                      {sub.documents?.labLogo ? (
                        <img src={sub.documents.labLogo} alt="Logo" className="hidden sm:block w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                      ) : (
                        <div className="hidden sm:flex w-10 h-10 rounded-lg bg-blue-100 text-blue-500 items-center justify-center text-xs font-black uppercase border border-blue-200 flex-shrink-0">
                          {sub.basicInfo?.labName?.charAt(0) || 'L'}
                        </div>
                      )}
                      <div className="flex flex-col justify-center overflow-hidden">
                        <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Lab Name</span>
                        <h3 className="text-sm font-black text-blue-900 group-hover:text-blue-600 transition-colors truncate">{sub.basicInfo?.labName || 'Unknown'}</h3>
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Type</span>
                      <p className="text-xs font-bold text-slate-600 truncate">{sub.basicInfo?.labType || 'N/A'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">Mobile</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📞 {sub.basicInfo?.mobileNumber || 'N/A'}</p>
                    </div>
                    
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center">
                      <span className="md:hidden text-[9px] font-black uppercase text-slate-400 mb-1">City</span>
                      <p className="text-xs font-bold text-slate-600 truncate">📍 {sub.address?.city || 'N/A'}</p>
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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedForm._id || selectedForm.id}</span>
                    <h2 className="text-3xl font-black text-slate-800 mt-1">{selectedForm.basicInfo?.labName}</h2>
                  </div>
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest self-start md:self-auto shadow-md ${selectedForm.status?.toLowerCase() === 'approved' ? 'bg-green-600 text-white border-2 border-green-700' :
                      selectedForm.status?.toLowerCase() === 'rejected' ? 'bg-red-600 text-white border-2 border-red-700' :
                        'bg-amber-500 text-white border-2 border-amber-600'
                    }`}>
                    {selectedForm.status || 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Basic Information</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Lab Name" value={selectedForm.basicInfo?.labName} />
                      <DetailRow label="Owner" value={selectedForm.basicInfo?.ownerName} />
                      <DetailRow label="Lab Type" value={selectedForm.basicInfo?.labType} />
                      <DetailRow label="Reg. Number" value={selectedForm.basicInfo?.registrationNumber || 'N/A'} />
                      <DetailRow label="GST Number" value={selectedForm.basicInfo?.gstNumber || 'N/A'} />
                      <DetailRow label="PAN Number" value={selectedForm.basicInfo?.panNumber || 'N/A'} />
                      <DetailRow label="Est. Year" value={selectedForm.basicInfo?.establishmentYear || 'N/A'} />
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Contact & Address</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Mobile" value={selectedForm.basicInfo?.mobileNumber} />
                      <DetailRow label="Alt Mobile" value={selectedForm.basicInfo?.alternateMobile || 'N/A'} />
                      <DetailRow label="Email" value={selectedForm.basicInfo?.email} />
                      <DetailRow label="Website" value={selectedForm.basicInfo?.website || 'N/A'} />
                      <DetailRow label="Address" value={selectedForm.address?.fullAddress} />
                      <DetailRow label="City & State" value={`${selectedForm.address?.city || ''}, ${selectedForm.address?.state || ''}`} />
                      <DetailRow label="Pincode" value={selectedForm.address?.pincode || 'N/A'} />
                    </div>
                  </div>

                  {/* Operations & Staff */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Operations & Staff</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="24x7 Available" value={selectedForm.timing?.is24x7 ? 'Yes' : 'No'} />
                      {!selectedForm.timing?.is24x7 && <DetailRow label="Timings" value={`${selectedForm.timing?.openingTime || '-'} to ${selectedForm.timing?.closingTime || '-'}`} />}
                      <DetailRow label="Working Days" value={selectedForm.timing?.workingDays || 'N/A'} />
                      <DetailRow label="Pathologist" value={selectedForm.staff?.doctorName || 'N/A'} />
                      <DetailRow label="Qualification" value={selectedForm.staff?.doctorQualification || 'N/A'} />
                      <DetailRow label="Reg. No" value={selectedForm.staff?.doctorRegistration || 'N/A'} />
                      <DetailRow label="Technicians" value={selectedForm.staff?.technicianCount || '0'} />
                    </div>
                  </div>

                  {/* Bank & Subscription */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Bank & Subscription</h3>
                    <div className="space-y-3 text-sm">
                      <DetailRow label="Account Name" value={selectedForm.bank?.accountName || 'N/A'} />
                      <DetailRow label="Bank Name" value={selectedForm.bank?.bankName || 'N/A'} />
                      <DetailRow label="Account No." value={selectedForm.bank?.accountNumber || 'N/A'} />
                      <DetailRow label="IFSC Code" value={selectedForm.bank?.ifscCode || 'N/A'} />
                      <DetailRow label="Plan" value={selectedForm.subscription?.plan || 'N/A'} />
                      <DetailRow label="Commission" value={`${selectedForm.subscription?.commission || '0'}%`} />
                    </div>
                  </div>

                  {/* Services Offered */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 lg:col-span-2">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Services & Tests Offered</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedForm.services) && selectedForm.services.length > 0 
                        ? selectedForm.services.map((service, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white border border-blue-100 text-blue-800 text-xs font-bold rounded-lg shadow-sm">
                              {service}
                            </span>
                          ))
                        : <span className="text-sm font-bold text-slate-500">None Selected or N/A</span>}
                    </div>
                    
                    {Array.isArray(selectedForm.additionalFeatures) && selectedForm.additionalFeatures.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <h4 className="font-bold text-xs text-slate-500 mb-2">Additional Features:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedForm.additionalFeatures.map((feat, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Documents Display */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 lg:col-span-2">
                    <h3 className="font-black text-blue-900 border-b border-slate-200 pb-3 mb-4 text-sm uppercase tracking-wider">Uploaded Documents</h3>
                    
                    {selectedForm.documents && Object.keys(selectedForm.documents).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {Object.entries(selectedForm.documents).map(([key, url]) => (
                          <div key={key} className="flex flex-col items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 text-center">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-100">
                              {url ? (
                                <img src={url} alt={key} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-black uppercase">N/A</div>
                              )}
                            </div>
                            {url && (
                              <a href={url} target="_blank" rel="noreferrer" className="mt-4 text-[9px] font-bold text-blue-600 uppercase hover:underline">
                                View Full Screen ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Documents Provided</p>
                      </div>
                    )}
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
                      ✗ Reject Lab
                    </button>
                    <button
                      onClick={() => handleActionClick(selectedForm.id, 'Approved')}
                      className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-800 text-white rounded-2xl shadow-xl shadow-blue-200 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      ✓ Approve Lab
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

// Helper Component
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

export default PathologyList;
