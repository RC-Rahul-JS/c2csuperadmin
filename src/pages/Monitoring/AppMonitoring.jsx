import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HiDeviceMobile, 
  HiSearch, 
  HiPlay, 
  HiPause
} from 'react-icons/hi';
import TryAppSimulator from '../../components/TryAppSimulator';

// --- CONSTANTS & TRYAPP MOCK DATA ---
const MAX_LOG_SIZE = 250;

const VIRTUAL_USERS = [
  { id: 'usr_ramesh', name: 'Ramesh Kumar', mobile: '+91 98765 43210', location: 'Delhi NCR', avatarGrad: 'from-purple-500 to-indigo-500' },
  { id: 'usr_priya', name: 'Priya Sharma', mobile: '+91 91234 56789', location: 'Mumbai', avatarGrad: 'from-pink-500 to-rose-500' },
  { id: 'usr_alex', name: 'Alex Mercer', mobile: '+1 415 555 2671', location: 'Bengaluru', avatarGrad: 'from-blue-500 to-cyan-500' },
  { id: 'usr_sarah', name: 'Sarah Jenkins', mobile: '+44 7911 122233', location: 'Hyderabad', avatarGrad: 'from-emerald-500 to-teal-500' }
];

const TRYAPP_DOCTORS = [
  { id: 'doc_anurag', name: 'Dr. Anurag Tiwari', spec: 'Orthopedic Surgeon', exp: '16 Years', fee: 500, hospital: 'Paliwal Hospital', likes: '100%' },
  { id: 'doc_ashish', name: 'Dr. Ashish Gohiya', spec: 'Orthopedist', exp: '23 Years', fee: 600, hospital: 'Care Hospital', likes: '98%' }
];

const TRYAPP_MEDICINES = [
  { id: 'med_para', name: 'Paracetamol 500mg', category: 'Analgesic', price: 50 },
  { id: 'med_cough', name: 'Cough Relief Syrup', category: 'Respiratory', price: 120 }
];

const MOCK_IPS = ['192.168.2.45', '182.23.109.4', '198.51.100.82', '172.16.89.2'];

export default function AppMonitoring() {
  const [logs, setLogs] = useState([]);
  const [activeSessions, setActiveSessions] = useState({});
  const [botAutomation, setBotAutomation] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterUser, setFilterUser] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [simUser, setSimUser] = useState(null);
  const [simScreen, setSimScreen] = useState('LOGIN'); 
  const [simLocation, setSimLocation] = useState('Delhi NCR');
  
  const [lastScreenChange, setLastScreenChange] = useState(Date.now());
  const [tick, setTick] = useState(0); 

  const [stats, setStats] = useState({
    totalLogs: 0, bookingsCount: 0, grossPayments: 0, clicksCount: 0
  });

  const logsEndRef = useRef(null);

  const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`;

  const emitEvent = (level, actionType, message, userSession, additionalMetadata = {}) => {
    const timestamp = new Date();
    const newLog = {
      id: generateId('evt'),
      timestamp: timestamp.toISOString(),
      level: level, 
      module: actionType, 
      message: message,
      userName: userSession ? userSession.name : 'System',
      userId: userSession ? userSession.id : 'system',
      sessionId: userSession ? userSession.sessionId : 'sys_sess',
      metadata: {
        ipAddress: additionalMetadata.ip || MOCK_IPS[Math.floor(Math.random() * MOCK_IPS.length)],
        userNumber: userSession ? userSession.mobile : 'N/A',
        userLocation: userSession ? userSession.location : 'N/A',
        userAgent: navigator.userAgent,
        ...additionalMetadata
      }
    };

    setLogs(prev => [newLog, ...prev].slice(0, MAX_LOG_SIZE));
    
    setStats(prev => ({
      ...prev,
      totalLogs: prev.totalLogs + 1,
      bookingsCount: prev.bookingsCount + (level === 'BOOKING' ? 1 : 0),
      grossPayments: prev.grossPayments + (level === 'PAYMENT' && additionalMetadata.status === 'SUCCESS' ? (additionalMetadata.amount || 0) : 0),
      clicksCount: prev.clicksCount + (actionType === 'TAP' ? 1 : 0)
    }));

    if (userSession) {
      setActiveSessions(prev => {
        const existing = prev[userSession.id] || {};
        const isScreenChange = additionalMetadata.screen && additionalMetadata.screen !== existing.lastActiveScreen;
        
        return {
          ...prev,
          [userSession.id]: {
            ...existing,
            id: userSession.id,
            name: userSession.name,
            mobile: userSession.mobile,
            location: userSession.location,
            avatarGrad: userSession.avatarGrad,
            lastActiveScreen: additionalMetadata.screen || existing.lastActiveScreen || 'LOGIN',
            screenStartTime: isScreenChange ? timestamp.getTime() : (existing.screenStartTime || timestamp.getTime()),
            lastActiveTime: timestamp.toISOString(),
            sessionStartTime: existing.sessionStartTime || timestamp.getTime(),
            totalClicks: (existing.totalClicks || 0) + (actionType === 'TAP' ? 1 : 0),
            isBot: !!userSession.isBot,
            sessionId: userSession.sessionId
          }
        };
      });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // COMPREHENSIVE BOT ENGINE
  useEffect(() => {
    if (!botAutomation) return;
    const botTimer = setInterval(() => {
      const bot = VIRTUAL_USERS[Math.floor(Math.random() * VIRTUAL_USERS.length)];
      const exSess = activeSessions[bot.id] || { sessionId: generateId('sess'), lastActiveScreen: 'LOGIN' };
      const uSess = { ...bot, sessionId: exSess.sessionId, isBot: true };

      // Extended state machine covering 20+ screens
      const transitions = {
        'LOGIN': 'HomeScreen',
        'HomeScreen': ['FindDoctors', 'MedicineScreen', 'UserProfile', 'LocationSelection', 'AboutCare2Connect'][Math.floor(Math.random() * 5)],
        'LocationSelection': 'HomeScreen',
        'FindDoctors': 'DoctorsList',
        'DoctorsList': 'DoctorProfile',
        'DoctorProfile': 'AppointmentBooking',
        'AppointmentBooking': 'Payments',
        'Payments': 'BookingSuccess',
        'BookingSuccess': 'AppointmentHistory',
        'AppointmentHistory': 'HomeScreen',
        'MedicineScreen': 'MedicationDetails',
        'MedicationDetails': 'Payments',
        'UserProfile': ['PrivacyPolicy', 'HelpSupport', 'HomeScreen'][Math.floor(Math.random() * 3)],
        'PrivacyPolicy': 'UserProfile',
        'HelpSupport': 'UserProfile',
        'AboutCare2Connect': 'HomeScreen'
      };

      const curr = exSess.lastActiveScreen || 'LOGIN';
      const next = transitions[curr] || 'HomeScreen';

      if (curr !== 'LOGIN' && curr !== next) {
        const durationSecs = ((Date.now() - (exSess.screenStartTime || Date.now())) / 1000).toFixed(1);
        emitEvent('SCREEN_TIME', 'ENGAGEMENT', `Screen Stay: ${bot.name} spent ${durationSecs}s on [${curr}] before navigating to ${next}`, uSess, { screen: next });
      }

      if (curr === 'LOGIN') {
        emitEvent('LOGIN', 'LOGIN', `Bot Auto-Login: ${bot.name} connected from ${bot.location}`, uSess, { screen: 'HomeScreen' });
      } else if (curr === 'HomeScreen') {
        emitEvent('ACTION', 'TAP', `Navigated from Home to ${next}`, uSess, { screen: next, exactTarget: `Home -> ${next}` });
      } else if (curr === 'DoctorsList') {
        emitEvent('ACTION', 'TAP', `Selected Dr. Anurag Tiwari`, uSess, { screen: 'DoctorProfile', exactTarget: 'Doctor Item: Dr. Anurag Tiwari' });
      } else if (curr === 'DoctorProfile') {
        emitEvent('BOOKING', 'APP_BOOKING', `Initiated Clinic Booking for Dr. Anurag`, uSess, { screen: 'AppointmentBooking', exactTarget: 'Book Clinic Visit', fee: 500 });
      } else if (curr === 'Payments') {
        emitEvent('PAYMENT', 'APP_PAYMENT', `Verified UPI settlement for ${bot.name}`, uSess, { screen: 'BookingSuccess', amount: 500, status: 'SUCCESS' });
      } else {
        // Generic click for other screens
        emitEvent('ACTION', 'TAP', `Bot interacted with ${curr} and moved to ${next}`, uSess, { screen: next, exactTarget: `Explore ${next}` });
      }
    }, 4000);
    return () => clearInterval(botTimer);
  }, [botAutomation, activeSessions]);


  const changeSimScreen = (nextScreen, targetName = 'Navigation') => {
    if (!simUser) return;
    const duration = ((Date.now() - lastScreenChange) / 1000).toFixed(1);
    emitEvent('SCREEN_TIME', 'ENGAGEMENT', `Screen Time telemetry: ${simUser.name} stayed on [${simScreen}] for ${duration} seconds`, simUser, { screen: nextScreen });
    emitEvent('ACTION', 'TAP', `Tapped [${targetName}] button`, simUser, { screen: nextScreen, exactTarget: targetName });
    setSimScreen(nextScreen);
    setLastScreenChange(Date.now());
  };

  const handleSimAutoLogin = (profile) => {
    const userSession = { ...profile, sessionId: generateId('sess_sim'), isBot: false };
    setSimUser(userSession);
    setSimLocation(profile.location);
    setSimScreen('HomeScreen');
    setLastScreenChange(Date.now());
    emitEvent('LOGIN', 'LOGIN', `Simulator: ${profile.name} logged in via Superadmin`, userSession, { screen: 'HomeScreen' });
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
      if (filterUser !== 'ALL' && log.userId !== filterUser) return false;
      
      const logDate = new Date(log.timestamp);
      if (startDate && logDate < new Date(startDate)) return false;
      if (endDate && logDate > new Date(endDate)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        // Deep search across the entire log object (metadata, ID, number, etc.)
        return JSON.stringify(log).toLowerCase().includes(query);
      }
      return true;
    });
  }, [logs, filterLevel, filterUser, searchQuery, startDate, endDate]);

  const activeSessionsList = useMemo(() => {
    const list = Object.values(activeSessions).sort((a, b) => new Date(b.lastActiveTime) - new Date(a.lastActiveTime));
    if (!searchQuery.trim()) return list;
    
    const query = searchQuery.toLowerCase();
    return list.filter(sess => JSON.stringify(sess).toLowerCase().includes(query));
  }, [activeSessions, tick, searchQuery]); 

  const formatDuration = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, '0')}s`;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-400 font-sans overflow-hidden">
      <header className="h-14 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-lg">
            <HiDeviceMobile className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-100">TryApp Telemetry Monitor</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">Extended 20+ Screen Architecture</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-bold text-slate-400 font-mono">BOT TRAFFIC:</span>
            <button onClick={() => setBotAutomation(!botAutomation)} className={`p-1 rounded transition-all ${botAutomation ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
              {botAutomation ? <HiPause className="w-3.5 h-3.5" /> : <HiPlay className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button onClick={() => { setLogs([]); setStats({ totalLogs: 0, bookingsCount: 0, grossPayments: 0, clicksCount: 0}); }} className="bg-slate-950 text-slate-500 hover:text-rose-400 py-1.5 px-3 rounded-lg text-[11px] border border-slate-900 font-semibold">Clear</button>
        </div>
      </header>

      <section className="bg-slate-950 border-b border-slate-900/50 grid grid-cols-5 divide-x divide-slate-900/40 shrink-0 select-none">
        <div className="p-3 px-6"><span className="text-[9px] text-slate-500 block">ACTIVE SESSIONS</span><span className="text-lg font-bold text-indigo-400">{activeSessionsList.length}</span></div>
        <div className="p-3 px-6"><span className="text-[9px] text-slate-500 block">TELEMETRY LOGS</span><span className="text-lg font-bold text-purple-400">{stats.totalLogs}</span></div>
        <div className="p-3 px-6"><span className="text-[9px] text-slate-500 block">CLINIC BOOKINGS</span><span className="text-lg font-bold text-sky-400">{stats.bookingsCount}</span></div>
        <div className="p-3 px-6"><span className="text-[9px] text-slate-500 block">PAYMENTS SETTLED</span><span className="text-lg font-bold text-emerald-400">₹{stats.grossPayments}</span></div>
        <div className="p-3 px-6"><span className="text-[9px] text-slate-500 block">SEMANTIC CLICKS</span><span className="text-lg font-bold text-amber-400">{stats.clicksCount}</span></div>
      </section>

      <div className="flex-1 flex overflow-hidden">
        {/* COMPREHENSIVE DUMMY SIMULATOR */}
        <section className="w-[330px] border-r border-slate-900 bg-slate-950 p-4 shrink-0 flex flex-col items-center overflow-y-auto">
          <div className="text-center mb-3">
            <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/40 border border-indigo-900 px-2 py-0.5 rounded-full">tryapp Sandbox - Router v2</span>
          </div>

          <div className="w-[280px] h-[520px] bg-slate-900 rounded-[35px] border-4 border-slate-800 relative flex flex-col overflow-hidden ring-2 ring-indigo-500/10 shadow-xl">
            <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 flex justify-center items-center z-30">
              <div className="w-16 h-3 bg-slate-950 rounded-full border border-slate-850"></div>
            </div>

            <div className="flex-1 bg-white pt-5 flex flex-col text-slate-800 text-xs font-sans select-none overflow-y-auto relative">
              <TryAppSimulator 
                simScreen={simScreen}
                simUser={simUser}
                simLocation={simLocation}
                changeSimScreen={changeSimScreen}
                handleSimAutoLogin={handleSimAutoLogin}
                emitEvent={emitEvent}
                VIRTUAL_USERS={VIRTUAL_USERS}
                TRYAPP_DOCTORS={TRYAPP_DOCTORS}
                TRYAPP_MEDICINES={TRYAPP_MEDICINES}
              />
            </div>
          </div>
        </section>

        {/* LOG STREAM */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden border-r border-slate-900/60">
          <div className="p-3 border-b border-slate-900 bg-slate-950 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-600"><HiSearch className="w-4 h-4"/></span>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter semantic telemetry..." className="w-full pl-8 py-1 bg-slate-900 text-slate-200 rounded-md border border-slate-850 focus:border-slate-800 text-xs font-mono" />
              </div>
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="bg-slate-900 text-slate-400 border border-slate-850 rounded-md px-2 py-1 text-xs">
                <option value="ALL">All Levels</option><option value="SCREEN_TIME">ENGAGEMENT</option><option value="ACTION">ACTIONS</option><option value="BOOKING">BOOKINGS</option><option value="PAYMENT">PAYMENTS</option>
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-[10px] text-slate-500 font-bold">DATE RANGE:</span>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-900 text-slate-400 border border-slate-850 rounded-md px-2 py-1 text-xs" />
              <span className="text-[10px] text-slate-500">to</span>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-900 text-slate-400 border border-slate-850 rounded-md px-2 py-1 text-xs" />
              {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] text-rose-400 hover:text-rose-300 ml-2">Clear Dates</button>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] divide-y divide-slate-900/30">
            {filteredLogs.map(log => {
              const isSelected = log.id === selectedLogId;
              let badgeColor = 'text-slate-500 border-slate-800';
              if (log.level === 'SCREEN_TIME') badgeColor = 'text-fuchsia-400 border-fuchsia-900 bg-fuchsia-950/20';
              if (log.level === 'ACTION') badgeColor = 'text-amber-400 border-amber-900 bg-amber-950/20';
              if (log.level === 'BOOKING') badgeColor = 'text-sky-400 border-sky-900 bg-sky-950/20';
              if (log.level === 'PAYMENT') badgeColor = 'text-emerald-400 border-emerald-900 bg-emerald-950/20';

              return (
                <div key={log.id} onClick={() => setSelectedLogId(isSelected ? null : log.id)} className={`px-4 py-2 flex items-center gap-2 cursor-pointer ${isSelected ? 'bg-slate-900/40 border-l-2 border-indigo-500' : 'hover:bg-slate-900/10'}`}>
                  <span className="w-20 shrink-0 text-slate-500 text-[10px]">{log.timestamp.split('T')[1].slice(0,-1)}</span>
                  <span className="w-24 shrink-0 text-slate-300 font-semibold truncate" title={log.userName}>{log.userName}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[8px] uppercase tracking-wider ${badgeColor}`}>{log.module}</span>
                  <span className="flex-1 text-slate-400 text-[10px] truncate">{log.message}</span>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>

          {selectedLogId && (() => {
            const actLog = logs.find(l => l.id === selectedLogId);
            return (
              <div className="h-64 border-t border-slate-900 bg-slate-950 flex flex-col shrink-0">
                <div className="h-8 border-b border-slate-900 px-4 flex justify-between items-center text-[9px] font-bold text-slate-500">
                  <span>TELEMETRY INSPECTOR // {actLog.id}</span>
                  <button onClick={() => setSelectedLogId(null)}>✕</button>
                </div>
                <div className="flex-1 p-4 grid grid-cols-2 gap-4 overflow-auto">
                  <div className="space-y-2 text-[10px] text-slate-400">
                    <div className="bg-slate-900/30 p-2 rounded border border-slate-900">
                      <div className="flex justify-between py-0.5"><span className="text-slate-600">Mobile:</span><span className="text-slate-200">{actLog.metadata.userNumber}</span></div>
                      <div className="flex justify-between py-0.5"><span className="text-slate-600">Location:</span><span className="text-slate-200">{actLog.metadata.userLocation}</span></div>
                      <div className="flex justify-between py-0.5"><span className="text-slate-600">Screen:</span><span className="text-sky-400">{actLog.metadata.screen}</span></div>
                      {actLog.metadata.exactTarget && (
                        <div className="flex justify-between py-0.5"><span className="text-slate-600">Semantic Click:</span><span className="text-amber-400 font-bold">{actLog.metadata.exactTarget}</span></div>
                      )}
                    </div>
                  </div>
                  <pre className="bg-slate-950 p-2 rounded border border-slate-900 text-[9px] text-slate-500 overflow-auto">
                    {JSON.stringify(actLog, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })()}
        </section>

        {/* RIGHT COLUMN */}
        <section className="w-64 border-l border-slate-900 bg-slate-950 p-4 shrink-0 overflow-y-auto">
          <h3 className="text-[10px] font-bold text-slate-500 mb-4">ACTIVE SESSIONS</h3>
          <div className="space-y-2">
            {activeSessionsList.map(sess => {
              const pageMs = Date.now() - (sess.screenStartTime || Date.now());
              const sessionMs = Date.now() - (sess.sessionStartTime || Date.now());
              const isOnline = new Date(sess.lastActiveTime).getTime() > Date.now() - 30000;
              
              return (
                <div key={sess.id} onClick={() => setFilterUser(sess.id)} className={`bg-slate-900/40 p-3 rounded-xl border cursor-pointer ${filterUser === sess.id ? 'border-indigo-500' : 'border-slate-800'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-slate-200">{sess.name}</span>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-700'}`}></span>
                  </div>
                  <div className="text-[9px] text-slate-500 mb-2">{sess.mobile} • {sess.location}</div>
                  
                  <div className="bg-slate-950 rounded p-1.5 flex justify-between items-center text-[9px] border border-slate-900">
                    <span className="text-sky-400 truncate w-20">{sess.lastActiveScreen}</span>
                    <span className="text-fuchsia-400 font-bold font-mono">{formatDuration(pageMs)}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-[8px] text-slate-600">
                    <span>Total Session: {formatDuration(sessionMs)}</span>
                    <span>Clicks: {sess.totalClicks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
