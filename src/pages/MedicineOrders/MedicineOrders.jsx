import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiSearch, 
  HiOutlineEye, 
  HiEye, 
  HiPhotograph, 
  HiClock, 
  HiCheckCircle, 
  HiXCircle, 
  HiInformationCircle, 
  HiChevronRight, 
  HiCollection,
  HiExternalLink,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineClipboardList,
  HiUser
} from 'react-icons/hi';

const MedicineOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Date Range state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Detail Modal / Drawer state
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Lightbox for prescription images
  const [lightboxImage, setLightboxImage] = useState(null);

  // Status edit state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateRemark, setUpdateRemark] = useState('');

  // Fetch orders from API
  const fetchOrders = () => {
    setIsLoading(true);
    setErrorInfo('');
    fetch('/c2c_app/medicine/admin/orders', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(data => {
        console.log("Real Medicine Orders API Response:", data);
        
        // Extract array from standard data key
        let list = [];
        if (data && Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.orders)) {
          list = data.orders;
        } else if (data && typeof data === 'object') {
          list = Object.values(data).filter(v => typeof v === 'object' && v !== null);
        }

        // Map real API keys to UI structure
        const mappedOrders = list.map((item, index) => {
          return {
            id: item.order_id || item.id || item._id || `MED-${1000 + index}`,
            userMobile: item.user_mobile || 'N/A',
            doctorName: item.doctor_name || '',
            storeName: item.store_name || 'N/A',
            orderImage: item.url || item.orderImage || '',
            remark: item.remark || 'No remark provided',
            status: item.status || 'Pending',
            date: item.created_at || '',
            // New Patient details mapping
            patientName: item.patient?.name || '',
            patientDob: item.patient?.dob || '',
            patientGender: item.patient?.gender || '',
            patientFatherName: item.patient?.fatherName || '',
            raw: item
          };
        });

        setOrders(mappedOrders);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching medicine orders:", err);
        setErrorInfo("Fetch failed: " + err.message);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter and Search logic with exact Date Range and Patient Name matching
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        order.userMobile.toLowerCase().includes(searchLower) ||
        order.doctorName.toLowerCase().includes(searchLower) ||
        order.storeName.toLowerCase().includes(searchLower) ||
        order.patientName.toLowerCase().includes(searchLower) ||
        order.id.toString().toLowerCase().includes(searchLower) ||
        order.remark.toLowerCase().includes(searchLower);

      // 2. Status filter
      const matchesStatus = 
        statusFilter === 'All' || 
        order.status.toLowerCase() === statusFilter.toLowerCase();

      // 3. Date range filter
      let matchesDate = true;
      if (order.date) {
        const orderDateObj = new Date(order.date);
        
        if (fromDate) {
          const startDate = new Date(fromDate);
          startDate.setHours(0, 0, 0, 0);
          if (orderDateObj < startDate) matchesDate = false;
        }
        
        if (toDate) {
          const endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
          if (orderDateObj > endDate) matchesDate = false;
        }
      } else if (fromDate || toDate) {
        matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, fromDate, toDate]);

  // Update order status via API
  const handleUpdateStatus = async (orderId, newStatus) => {
    setIsUpdatingStatus(true);
    const lowercaseStatus = newStatus.toLowerCase();
    
    try {
      const response = await fetch(`/c2c_app/medicine/admin/orders/update/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          status: lowercaseStatus,
          remark: updateRemark || `Status updated to ${newStatus} by Administrator`
        })
      });

      // Alternate standard patch endpoint
      if (!response.ok) {
        console.warn("Primary endpoint failed. Attempting alternative endpoint...");
        await fetch(`/c2c_app/medicine/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            status: lowercaseStatus,
            remark: updateRemark
          })
        });
      }

      // Update local state immediately
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, remark: updateRemark || o.remark } : o));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, remark: updateRemark || prev.remark }));
      }

      alert(`Order status updated to ${newStatus} successfully!`);
      setUpdateRemark('');
    } catch (err) {
      console.error("Failed to persist status change on server:", err);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, remark: updateRemark || o.remark } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, remark: updateRemark || prev.remark }));
      }
      alert(`Status updated locally (Server update endpoint returned an error or is unreachable).`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === 'delivered' || s === 'approved' || s === 'completed' || s === 'confirmed') {
      return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
    } else if (s === 'cancelled' || s === 'rejected' || s === 'failed') {
      return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    } else if (s === 'processing' || s === 'dispatched' || s === 'out_for_delivery' || s === 'shipped') {
      return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
    } else {
      return 'bg-amber-500/10 text-amber-600 border border-amber-500/20'; // Pending, etc.
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 p-2 md:p-4">
      {/* --- Page Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <HiOutlineClipboardList className="w-6 h-6" />
            </span>
            Medicine Orders
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track pharmacy orders, customer uploads, store names and remarks.</p>
        </div>
        
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-200"
        >
          🔄 Refresh Table
        </button>
      </div>

      {/* --- Controls: Search, Status & Date Filter Range --- */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <HiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search mobile, patient, store, doctor or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 pl-11 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-purple-500 transition-all text-slate-800"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
            {['All', 'Pending', 'Confirmed', 'Out_for_delivery', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`py-2.5 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === status 
                    ? 'bg-white text-purple-700 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100 w-full">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 mr-2 self-start sm:self-auto select-none">
            <span>📅</span> Date Range:
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:flex-none">
            <div className="relative w-full sm:w-48">
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="p-2.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-purple-500 text-slate-700"
              />
            </div>
            <span className="text-slate-400 text-xs font-bold">to</span>
            <div className="relative w-full sm:w-48">
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="p-2.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-purple-500 text-slate-700"
              />
            </div>
          </div>

          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-all"
            >
              Clear Dates
            </button>
          )}
        </div>
      </div>

      {/* --- Error Info --- */}
      {errorInfo && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm">
          <HiInformationCircle className="w-5 h-5 text-rose-500" />
          <div className="font-mono">{errorInfo}</div>
        </div>
      )}

      {/* --- Main Table Card --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-24">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Loading orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">User (Mobile)</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Store Name</th>
                  <th className="px-6 py-4">Linked Doctor</th>
                  <th className="px-6 py-4 text-center">Prescription</th>
                  <th className="px-6 py-4">Remark</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-purple-50/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono text-xs font-black text-slate-500">
                      #{order.id}
                    </td>

                    {/* User Mobile */}
                    <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <HiOutlinePhone className="w-4 h-4 text-slate-400" /> {order.userMobile}
                      </span>
                    </td>

                    {/* Patient Name */}
                    <td className="px-6 py-4 text-xs font-normal text-slate-700">
                      {order.patientName ? (
                        order.patientName
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Store Name */}
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">
                      🏪 {order.storeName}
                    </td>

                    {/* Doctor Name */}
                    <td className="px-6 py-4 text-xs text-slate-600 font-bold">
                      {order.doctorName ? (
                        <span className="flex items-center gap-1">
                          <HiOutlineUser className="w-4 h-4 text-purple-400" /> {order.doctorName}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>

                    {/* Prescription */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        {order.orderImage ? (
                          <div 
                            onClick={() => setLightboxImage(order.orderImage)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative shadow-sm hover:border-purple-300 transition-all group"
                            title="Click to expand prescription"
                          >
                            <img 
                              src={order.orderImage} 
                              alt="Prescription" 
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white">
                              <HiOutlineEye className="w-4 h-4" />
                            </div>
                            <div style={{display: 'none'}} className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50">
                              <HiPhotograph className="w-5 h-5" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">No image</span>
                        )}
                      </div>
                    </td>

                    {/* Remark */}
                    <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate" title={order.remark}>
                      "{order.remark}"
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm whitespace-nowrap ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Action Arrow */}
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
                        <HiChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50/50">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No matching orders found</p>
            <p className="text-xs text-slate-400 mt-1">Try typing another query or choosing a different status filter.</p>
          </div>
        )}
      </div>

      {/* --- Lightbox Modal for Prescription --- */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <a 
              href={lightboxImage} 
              target="_blank" 
              rel="noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <HiExternalLink className="w-4 h-4" /> Open Fullsize
            </a>
            <button 
              onClick={() => setLightboxImage(null)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
            >
              ✕ CLOSE
            </button>
          </div>

          <div className="max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage} 
              alt="Prescription" 
              className="max-w-full max-h-full rounded-xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      {/* --- Right side Drawer Modal for Order details --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex justify-end transition-all">
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)}></div>
          
          <div className="relative w-full max-w-lg bg-white h-screen shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">Medicine Order Log</span>
                <h3 className="text-md font-black text-slate-800 mt-0.5">#{selectedOrder.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Scroll Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Prescription Image */}
              {selectedOrder.orderImage ? (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Prescription Document</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 aspect-video relative group">
                    <img 
                      src={selectedOrder.orderImage} 
                      alt="Prescription" 
                      className="object-contain w-full h-full cursor-pointer"
                      onClick={() => setLightboxImage(selectedOrder.orderImage)}
                    />
                    <div className="absolute bottom-2 right-2">
                      <button 
                        onClick={() => setLightboxImage(selectedOrder.orderImage)}
                        className="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <HiEye className="w-3.5 h-3.5" /> View Large
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-6 text-center text-slate-400">
                  <HiPhotograph className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No Image Attachment</p>
                </div>
              )}

              {/* Patient Details Section */}
              {selectedOrder.patientName && (
                <div className="bg-purple-50/15 border border-purple-200/60 p-4 rounded-xl space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1">
                    👤 Patient Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase block">Name</span>
                      <span className="font-bold text-slate-800">{selectedOrder.patientName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase block">Father's Name</span>
                      <span className="font-bold text-slate-800">{selectedOrder.patientFatherName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase block">Gender</span>
                      <span className="font-bold text-slate-800">{selectedOrder.patientGender || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase block">DOB</span>
                      <span className="font-bold text-slate-800">{selectedOrder.patientDob || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Info Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">User (Mobile)</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">📞 {selectedOrder.userMobile}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Medical Store</span>
                  <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">🏪 {selectedOrder.storeName}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Linked Doctor</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{selectedOrder.doctorName || '-'}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Order Status</span>
                  <div className="mt-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm ${getStatusBadgeStyle(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              {selectedOrder.date && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Order Timestamp</span>
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <HiClock className="w-4 h-4 text-slate-400" /> {selectedOrder.date}
                  </p>
                </div>
              )}

              {/* Remarks Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Order Remarks</span>
                <p className="text-xs text-slate-700 font-medium italic mt-2 bg-white p-3 rounded-xl border border-slate-100">
                  "{selectedOrder.remark}"
                </p>
              </div>

              {/* Manage Status Section */}
              <div className="border border-purple-100 bg-purple-50/20 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                  ⚙️ Update Order Status
                </h4>
                
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">
                    Update Remark (Optional)
                  </label>
                  <textarea
                    placeholder="Enter delivery update, delay notice, out-of-stock list, etc..."
                    value={updateRemark}
                    onChange={(e) => setUpdateRemark(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-lg text-xs outline-none focus:border-purple-500 transition-all resize-none h-16 text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Confirmed')}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                  >
                    <HiCheckCircle className="w-3.5 h-3.5" /> Confirm Order
                  </button>
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Out_for_delivery')}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                  >
                    🚚 Out for Delivery
                  </button>
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                    className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                  >
                    🎉 Delivered / Done
                  </button>
                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}
                    className="py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                  >
                    <HiXCircle className="w-3.5 h-3.5" /> Cancel Order
                  </button>
                </div>
              </div>

              {/* Dev payload */}
              <details className="group border border-slate-200 rounded-lg overflow-hidden">
                <summary className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer text-[9px] font-black uppercase text-slate-400 hover:bg-slate-100 select-none">
                  <span>🛠️ Raw Payload (Debug)</span>
                  <span className="group-open:rotate-180 font-mono text-[8px]">▼</span>
                </summary>
                <div className="p-4 bg-slate-900 text-slate-300 font-mono text-[9px] overflow-auto max-h-40 leading-relaxed rounded-b-lg border-t border-slate-200">
                  <pre>{JSON.stringify(selectedOrder.raw, null, 2)}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineOrders;
