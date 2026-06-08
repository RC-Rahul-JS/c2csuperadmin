import React, { useState, useEffect, useMemo } from 'react';
import { 
  HiSearch, 
  HiBell, 
  HiRefresh, 
  HiUserGroup, 
  HiInformationCircle,
  HiOutlineUser,
  HiCheckCircle,
  HiPaperAirplane
} from 'react-icons/hi';

const Notification = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [screen, setScreen] = useState('Offers');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users from API
  const fetchUsers = () => {
    setIsLoading(true);
    setErrorInfo('');
    setSuccessMessage('');
    fetch('/c2c_app/all_users', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        return res.json();
      })
      .then(data => {
        let list = [];
        if (data && Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.users)) {
          list = data.users;
        } else if (data && typeof data === 'object') {
          const possibleArray = Object.values(data).find(v => Array.isArray(v));
          if (possibleArray) {
            list = possibleArray;
          } else {
            list = Object.values(data).filter(v => typeof v === 'object' && v !== null);
          }
        }

        const mappedUsers = list.map((item, index) => ({
          id: item.id || item._id || item.user_id || `USR-${2000 + index}`,
          name: item.name || item.username || item.fullName || item.user_name || 'Anonymous User',
          mobile: item.mobile || item.mobileNumber || item.phone || item.user_mobile || item.number || 'N/A',
          fcmToken: item.fcmToken || item.fcm_token || item.device_token || null
        }));

        setUsers(mappedUsers);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching users:", err);
        setErrorInfo("Failed to load user records: " + err.message);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.mobile.toLowerCase().includes(searchLower) ||
        user.id.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [users, searchQuery]);

  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      // Unselect all currently filtered
      setSelectedUserIds([]);
    } else {
      // Select all currently filtered
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getAvatarGradient = (name) => {
    const code = name.charCodeAt(0) % 5;
    const gradients = [
      'from-purple-500 to-indigo-500 text-white',
      'from-blue-500 to-cyan-500 text-white',
      'from-emerald-500 to-teal-500 text-white',
      'from-rose-500 to-pink-500 text-white',
      'from-amber-500 to-orange-500 text-white'
    ];
    return gradients[code];
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      setErrorInfo('Please select at least one user.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      setErrorInfo('Title and body are required.');
      return;
    }

    setIsSending(true);
    setErrorInfo('');
    setSuccessMessage('');

    try {
      const payload = {
        user_ids: selectedUserIds,
        title: title.trim(),
        body: body.trim(),
        data: {
          screen: screen.trim()
        }
      };

      console.log('Sending notification payload:', payload);

      const response = await fetch('/c2c_app/send-bulk-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorData = '';
        try {
          const errJson = await response.json();
          errorData = JSON.stringify(errJson);
        } catch (e) {
          errorData = await response.text();
        }
        throw new Error(`HTTP ${response.status}. Details: ${errorData}`);
      }

      const result = await response.json();
      setSuccessMessage(`Notification sent successfully to ${selectedUserIds.length} users!`);

      setTitle('');
      setBody('');
      setSelectedUserIds([]);
    } catch (err) {
      console.error(err);
      setErrorInfo(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-50 p-2 md:p-4 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <HiBell className="w-6 h-6" />
            </span>
            Send Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Select users and broadcast important alerts or messages.
          </p>
        </div>
        
        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-200 cursor-pointer active:scale-95"
        >
          <HiRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Users
        </button>
      </div>

      {/* Error / Success Messages */}
      {errorInfo && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm">
          <HiInformationCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div className="font-mono">{errorInfo}</div>
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm">
          <HiCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div className="font-mono">{successMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: User Selection */}
        <div className="lg:col-span-2 space-y-4 bg-white rounded-2xl p-4 md:p-6 border border-slate-200/60 shadow-sm flex flex-col h-[70vh]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HiUserGroup className="text-purple-600" />
              Select Target Users
            </h2>
            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              {selectedUserIds.length} Selected
            </span>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <HiSearch className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search by name, mobile, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 pl-11 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-purple-500 transition-all text-slate-800"
            />
          </div>

          {/* List header / select all */}
          <div className="flex justify-between items-center px-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox"
                checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-600 group-hover:text-purple-600 transition-colors">Select All Visible ({filteredUsers.length})</span>
            </label>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto mt-2 border border-slate-100 rounded-xl divide-y divide-slate-100">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Users...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id} 
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedUserIds.includes(user.id) ? 'bg-purple-50/30' : ''}`}
                  onClick={() => handleToggleUser(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      readOnly
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer pointer-events-none"
                    />
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(user.name)} flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm leading-none">{user.name}</div>
                      <div className="text-slate-400 text-[10px] mt-1 font-mono">#{user.id} &bull; {user.mobile}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
                <HiOutlineUser className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-widest">No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Compose Form */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/60 shadow-sm flex flex-col h-fit sticky top-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
            <HiBell className="text-purple-600" />
            Compose Notification
          </h2>

          <form onSubmit={handleSendNotification} className="space-y-5">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
                Notification Title
              </label>
              <input
                type="text"
                placeholder="e.g., Special Offer, Maintenance Alert..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-purple-500 transition-all text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
                Message Body
              </label>
              <textarea
                placeholder="Write your detailed message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-purple-500 transition-all text-slate-800 resize-none"
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2">
                Target Screen (Data)
              </label>
              <input
                type="text"
                placeholder="e.g., Offers, Home, Profile"
                value={screen}
                onChange={(e) => setScreen(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-purple-500 transition-all text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || selectedUserIds.length === 0}
              className={`w-full flex justify-center items-center gap-2 py-3.5 rounded-xl text-white font-bold transition-all shadow-md
                ${isSending || selectedUserIds.length === 0 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 hover:-translate-y-0.5 active:translate-y-0'
                }`}
            >
              {isSending ? (
                <>
                  <HiRefresh className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <HiPaperAirplane className="w-5 h-5 rotate-90" />
                  Send to {selectedUserIds.length} User(s)
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Notification;
