import React, { useState, useEffect, useMemo } from 'react';
import { 
  HiSearch, 
  HiOutlineUser, 
  HiOutlinePhone, 
  HiOutlineCalendar, 
  HiOutlineClock, 
  HiChevronRight, 
  HiRefresh, 
  HiUserGroup, 
  HiInformationCircle,
  HiClipboardCopy,
  HiOutlineMail,
  HiIdentification,
  HiExternalLink,
  HiDeviceMobile,
  HiChatAlt2
} from 'react-icons/hi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch users from API
  const fetchUsers = () => {
    setIsLoading(true);
    setErrorInfo('');
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
        console.log("Real Users API Response:", data);
        
        let list = [];
        if (data && Array.isArray(data.data)) {
          list = data.data;
        } else if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.users)) {
          list = data.users;
        } else if (data && typeof data === 'object') {
          // Fallback if data is wrapped in another object property
          const possibleArray = Object.values(data).find(v => Array.isArray(v));
          if (possibleArray) {
            list = possibleArray;
          } else {
            list = Object.values(data).filter(v => typeof v === 'object' && v !== null);
          }
        }

        // Map API fields safely to UI requirements
        const mappedUsers = list.map((item, index) => {
          return {
            id: item.id || item._id || item.user_id || `USR-${2000 + index}`,
            name: item.name || item.username || item.fullName || item.user_name || 'Anonymous User',
            mobile: item.mobile || item.mobileNumber || item.phone || item.user_mobile || item.number || 'N/A',
            joinedAt: item.created_at || item.createdAt || item.joining_date || item.joinedAt || item.since_joining || '',
            lastActive: item.last_activity || item.lastActivity || item.last_active || item.lastActive || item.updated_at || item.updatedAt || '',
            email: item.email || item.emailAddress || '',
            raw: item
          };
        });

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
        user.id.toString().toLowerCase().includes(searchLower) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    });
  }, [users, searchQuery]);

  // Dynamically calculate stats
  const stats = useMemo(() => {
    const total = users.length;
    
    // Count recently active (e.g., users with a non-empty lastActive property)
    const active = users.filter(u => u.lastActive && u.lastActive !== 'N/A').length;
    
    // Count signups with recent joining dates (this month/year or simply those with valid dates)
    const validJoinDates = users.filter(u => u.joinedAt && u.joinedAt !== 'N/A').length;
    
    return {
      total,
      active,
      validJoinDates
    };
  }, [users]);

  // Utility to copy mobile to clipboard
  const handleCopyMobile = (e, mobile, userId) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mobile);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format date cleanly
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // fallback if already custom formatted
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Generate unique soft gradient background for user avatars based on their name
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

  return (
    <div className="space-y-6 bg-slate-50 p-2 md:p-4 min-h-screen">
      {/* --- Page Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <HiUserGroup className="w-6 h-6" />
            </span>
            All Users
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View registered user details, verify mobile numbers, monitor registration dates, and track their last activity.
          </p>
        </div>
        
        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-200 cursor-pointer active:scale-95"
        >
          <HiRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Users
        </button>
      </div>

      {/* --- Stats Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stat 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100/60 text-purple-700 rounded-2xl">
            <HiUserGroup className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Total Registered</span>
            <span className="text-2xl font-extrabold text-slate-800">{isLoading ? '...' : stats.total}</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100/60 text-emerald-700 rounded-2xl">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Active Users</span>
            <span className="text-2xl font-extrabold text-slate-800">{isLoading ? '...' : stats.active}</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100/60 text-blue-700 rounded-2xl">
            <HiOutlineCalendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 text-xs font-black uppercase tracking-wider block">Has Joining Date</span>
            <span className="text-2xl font-extrabold text-slate-800">{isLoading ? '...' : stats.validJoinDates}</span>
          </div>
        </div>
      </div>

      {/* --- Controls: Search --- */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/60 shadow-sm">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
            <HiSearch className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search by name, mobile, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-3 pl-11 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-purple-500 transition-all text-slate-800"
          />
        </div>
      </div>

      {/* --- Error Info --- */}
      {errorInfo && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3 text-xs font-bold shadow-sm">
          <HiInformationCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <div className="font-mono">{errorInfo}</div>
        </div>
      )}

      {/* --- Main Table Card --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-24">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading Registered Users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Mobile Number</th>
                  <th className="px-6 py-4">Since Joining</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-purple-50/20 cursor-pointer transition-colors"
                    onClick={() => setSelectedUser(user)}
                  >
                    {/* ID */}
                    <td className="px-6 py-4 font-mono text-xs font-black text-slate-400">
                      #{user.id}
                    </td>

                    {/* User Details (Avatar + Name) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${getAvatarGradient(user.name)} flex items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                          {user.email && (
                            <div className="text-slate-400 text-[10px] font-medium">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile Number with Quick Copy */}
                    <td className="px-6 py-4 font-bold text-slate-800 text-xs">
                      <div className="flex items-center gap-2 group/btn" onClick={(e) => e.stopPropagation()}>
                        <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                          <HiOutlinePhone className="w-4 h-4 text-slate-400" /> {user.mobile}
                        </span>
                        
                        {user.mobile !== 'N/A' && (
                          <button
                            onClick={(e) => handleCopyMobile(e, user.mobile, user.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-all"
                            title="Copy Phone Number"
                          >
                            <HiClipboardCopy className="w-4 h-4" />
                          </button>
                        )}
                        
                        {copiedId === user.id && (
                          <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded shadow-sm">
                            Copied!
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Since Joining */}
                    <td className="px-6 py-4 text-xs text-slate-600 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <HiOutlineCalendar className="w-4 h-4 text-purple-400" />
                        {formatDate(user.joinedAt)}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${user.lastActive && user.lastActive !== 'N/A' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        <HiOutlineClock className="w-4 h-4 text-indigo-400" />
                        {formatDate(user.lastActive)}
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
            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No matching users found</p>
            <p className="text-xs text-slate-400 mt-1">Try typing another query or search for a different mobile / name.</p>
          </div>
        )}
      </div>

      {/* --- Detail Slide-over Drawer Modal --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex justify-end transition-all">
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)}></div>
          
          <div className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">User Profile Sheet</span>
                <h3 className="text-md font-black text-slate-800 mt-0.5">#{selectedUser.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                ✕ Close
              </button>
            </div>

            {/* Scroll Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* Profile Card Summary */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${getAvatarGradient(selectedUser.name)} flex items-center justify-center font-extrabold text-3xl shadow-md mb-3`}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <h4 className="text-lg font-black text-slate-800">{selectedUser.name}</h4>
                <p className="text-slate-400 text-xs font-semibold mt-0.5 flex items-center gap-1.5 justify-center">
                  <HiOutlinePhone className="w-3.5 h-3.5" /> {selectedUser.mobile}
                </p>
                {selectedUser.email && (
                  <p className="text-slate-400 text-xs font-semibold mt-0.5 flex items-center gap-1.5 justify-center">
                    <HiOutlineMail className="w-3.5 h-3.5 text-slate-300" /> {selectedUser.email}
                  </p>
                )}
              </div>

              {/* Grid Information details */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Registration & Activity</h5>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Joined Since</span>
                    <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                      <HiOutlineCalendar className="w-4 h-4 text-purple-500" />
                      {formatDate(selectedUser.joinedAt)}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Last Active</span>
                    <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${selectedUser.lastActive && selectedUser.lastActive !== 'N/A' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                      <HiOutlineClock className="w-4 h-4 text-indigo-500" />
                      {formatDate(selectedUser.lastActive)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Communication Actions */}
              {selectedUser.mobile !== 'N/A' && (
                <div className="border border-purple-100 bg-purple-50/15 p-5 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-purple-900 tracking-wider">Quick Actions</h5>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${selectedUser.mobile}`}
                      className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <HiDeviceMobile className="w-4 h-4" /> Call Phone
                    </a>
                    <a
                      href={`https://wa.me/${selectedUser.mobile.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <HiChatAlt2 className="w-4 h-4" /> WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Collapsible raw api debugger */}
              <details className="group border border-slate-200 rounded-lg overflow-hidden">
                <summary className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer text-[9px] font-black uppercase text-slate-400 hover:bg-slate-100 select-none">
                  <span>🛠️ Raw API Payload (Debug)</span>
                  <span className="group-open:rotate-180 font-mono text-[8px]">▼</span>
                </summary>
                <div className="p-4 bg-slate-900 text-slate-300 font-mono text-[9px] overflow-auto max-h-48 leading-relaxed rounded-b-lg border-t border-slate-200">
                  <pre>{JSON.stringify(selectedUser.raw, null, 2)}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
