import React, { useState, useEffect, useMemo, useRef } from 'react';

const MAX_BUFFER_SIZE = 150;

const SERVICES = [
  'api-gateway',
  'auth-service',
  'user-db',
  'payment-worker',
  'frontend-edge',
  'analytics-pipeline'
];

const DEBUG_MESSAGES = [
  "DB Query execution took 4ms: SELECT * FROM sessions WHERE token = $1",
  "Cache hit ratio for session store is 94.2%",
  "Parsing HTTP headers, Client-IP identified as 198.51.100.42",
  "Event router dispatched hook 'user.login.attempt' in 1.2ms",
  "Garbage collection triggered -- freed 124MB of heap memory",
  "Heartbeat ping sent to node cluster-replica-03"
];

const INFO_MESSAGES = [
  "GET /v1/users/me status:200 duration:14.2ms bytes:452",
  "POST /v1/auth/token status:200 duration:112.5ms bytes:124",
  "CronJob 'nightly-reconcile' scheduled to execute at 02:00:00",
  "Successfully established connection to MongoDB Master (replica-set-01)",
  "Configuration hot-reloaded successfully from Consul key store",
  "User active profile session updated",
  "File uploads cleared from temporary workspace"
];

const WARN_MESSAGES = [
  "Rate limit reached for IP 203.0.113.12, throttling client requests",
  "Database connection pool pool-01 size exceeded 80% threshold, scaling...",
  "HTTP connection timeout on downstream service 'email-broker' after 5000ms",
  "API request warning: field 'phone_number' is deprecated in this schema version",
  "Redis memory usage nearing threshold: 84.1% allocated memory active"
];

const ERROR_MESSAGES = [
  "POST /v1/checkout status:500 duration:1422.1ms error:DB_CONNECTION_FAILED",
  "Failed to authenticate JWT token: Signature has expired or timestamp invalid",
  "Uncaught Promise Rejection: Cannot read property 'map' of undefined in invoice-parser.js",
  "FATAL Kafka stream interrupted, attempting cluster failover node reconnect",
  "Exception in background execution thread: OutOfMemoryError, exiting container"
];

const getSafeRegex = (searchText, isRegexEnabled) => {
  if (!searchText) return null;
  try {
    if (isRegexEnabled) {
      if (searchText.startsWith && searchText.startsWith('/') && searchText.length > 2) {
        const lastSlashIdx = searchText.lastIndexOf('/');
        if (lastSlashIdx > 0) {
          const pattern = searchText.substring(1, lastSlashIdx);
          const flags = searchText.substring(lastSlashIdx + 1);
          return new RegExp(pattern, flags);
        }
      }
      return new RegExp(searchText, 'gi');
    } else {
      const bouncers = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(bouncers, 'gi');
    }
  } catch (e) {
    return null; 
  }
};

const generateTraceId = () => {
  return 'tr_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
};

const createMockLog = (index, total) => {
  const levels = ['DEBUG', 'INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
  const level = levels[(index + 3) % levels.length];
  const service = SERVICES[index % SERVICES.length];
  
  let message = '';
  switch(level) {
    case 'DEBUG': 
      message = DEBUG_MESSAGES[index % DEBUG_MESSAGES.length]; 
      break;
    case 'WARN': 
      message = WARN_MESSAGES[index % WARN_MESSAGES.length]; 
      break;
    case 'ERROR':
    case 'FATAL': 
      message = ERROR_MESSAGES[index % ERROR_MESSAGES.length]; 
      break;
    case 'INFO':
    default: 
      message = INFO_MESSAGES[index % INFO_MESSAGES.length]; 
      break;
  }

  const ip = "192.168.1." + ((index * 7) % 254);
  const duration = (index * 35) % 2500;

  // Mathematically spread the logs back across the last 30 minutes
  const timestamp = new Date(Date.now() - (total - index) * 12000); 

  return {
    id: `log-${index}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: timestamp.toISOString(),
    level: level,
    service: service,
    message: message,
    traceId: generateTraceId(),
    metadata: {
      clientIp: ip,
      executionMs: duration,
      host: "node-" + service + "-" + (index % 4),
      env: 'production',
      threadId: 1000 + (index % 9000)
    }
  };
};

export default function Monitoring() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterService, setFilterService] = useState('ALL');
  const [timeWindow, setTimeWindow] = useState('ALL'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');

  // Reset drawer search when switching between logs
  useEffect(() => {
    setDrawerSearch('');
  }, [selectedLogId]);

  const logsEndRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/demo_doctor/logs');
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        const mappedLogs = json.data.map((item, index) => {
          let msgText = '';
          if (item.message) {
            if (typeof item.message === 'string') {
              msgText = item.message;
            } else if (item.message.text && item.message.text.body) {
              msgText = item.message.text.body;
            } else if (item.message.body) {
              msgText = item.message.body;
            } else {
              msgText = JSON.stringify(item.message);
            }
          } else {
            msgText = 'No message content';
          }

          let level = 'INFO';
          if (item.event_type) {
            if (item.event_type.toLowerCase().includes('error') || item.event_type.toLowerCase().includes('fail')) {
              level = 'ERROR';
            } else if (item.event_type.toLowerCase().includes('warn')) {
              level = 'WARN';
            } else if (item.event_type.toLowerCase().includes('debug')) {
              level = 'DEBUG';
            } else {
              level = item.event_type.toUpperCase();
            }
          }

          const fromNumber = item.message?.from || '';
          const displayMessage = fromNumber ? `[${fromNumber}] ${msgText}` : msgText;

          return {
            id: item._id || `log-${index}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
            level: level,
            service: item.event_type || 'whatsapp-api',
            message: displayMessage,
            traceId: item.message?.id || item._id || 'N/A',
            metadata: {
              clientIp: item.message?.from_user_id || 'N/A',
              executionMs: item.message?.timestamp ? parseInt(item.message.timestamp) % 1000 : 0,
              host: "demo-doctor-server",
              env: 'production',
              threadId: fromNumber || 'N/A',
              raw: item
            }
          };
        });

        mappedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(mappedLogs);
        setError(null);
      } else {
        throw new Error('Invalid API response format or missing data');
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const uniqueServices = useMemo(() => {
    const servicesSet = new Set(logs.map(log => log.service));
    return Array.from(servicesSet);
  }, [logs]);

  const uniqueLevels = useMemo(() => {
    const levelsSet = new Set(logs.map(log => log.level));
    return Array.from(levelsSet);
  }, [logs]);

  const uniqueDates = useMemo(() => {
    const datesSet = new Set(
      logs.map(log => {
        const d = new Date(log.timestamp);
        return d.toISOString().split('T')[0];
      })
    );
    return Array.from(datesSet).sort().reverse();
  }, [logs]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedLogId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const parsedSearch = useMemo(() => {
    let text = searchQuery.trim();
    let serviceOverride = null;
    let levelOverride = null;
    let phoneOverride = null;

    if (text.toLowerCase().includes('service:')) {
      const match = text.match(/service:([a-zA-Z0-9_-]+)/i);
      if (match) {
        serviceOverride = match[1].toLowerCase();
        text = text.replace(match[0], '').trim();
      }
    }
    if (text.toLowerCase().includes('level:')) {
      const match = text.match(/level:([a-zA-Z0-9_-]+)/i);
      if (match) {
        levelOverride = match[1].toUpperCase();
        text = text.replace(match[0], '').trim();
      }
    }
    if (text.toLowerCase().includes('from:')) {
      const match = text.match(/from:([a-zA-Z0-9+-]+)/i);
      if (match) {
        phoneOverride = match[1].toLowerCase();
        text = text.replace(match[0], '').trim();
      }
    }
    if (text.toLowerCase().includes('phone:')) {
      const match = text.match(/phone:([a-zA-Z0-9+-]+)/i);
      if (match) {
        phoneOverride = match[1].toLowerCase();
        text = text.replace(match[0], '').trim();
      }
    }

    return { text, service: serviceOverride, level: levelOverride, phone: phoneOverride };
  }, [searchQuery]);

  const filteredLogs = useMemo(() => {
    const regex = getSafeRegex(parsedSearch.text, isRegex);
    const now = new Date();

    return logs.filter(log => {
      // 1. Severity Dropdown Filter
      if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
      
      // 2. Service Dropdown Filter
      if (filterService !== 'ALL' && log.service !== filterService) return false;
      
      // 3. Command shortcuts inline overrides (level:, service:, phone:)
      if (parsedSearch.service && !log.service.toLowerCase().includes(parsedSearch.service)) return false;
      if (parsedSearch.level && log.level !== parsedSearch.level) return false;
      if (parsedSearch.phone && !(log.metadata?.threadId && log.metadata.threadId.toLowerCase().includes(parsedSearch.phone))) return false;

      // 4. Date / Time Window Filtering
      if (timeWindow !== 'ALL' && timeWindow !== 'CUSTOM') {
        const logTimeStr = new Date(log.timestamp).toISOString().split('T')[0];
        if (logTimeStr !== timeWindow) return false;
      } else if (timeWindow === 'CUSTOM') {
        const logTime = new Date(log.timestamp);
        if (customStartDate) {
          const start = new Date(customStartDate);
          if (logTime < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          if (logTime > end) return false;
        }
      }

      // 5. Search Text Filter (Deep Global JSON Search)
      if (parsedSearch.text) {
        const rawJSONStr = log.metadata?.raw ? JSON.stringify(log.metadata.raw) : '';
        if (regex) {
          return regex.test(log.message) || 
                 regex.test(log.service) || 
                 regex.test(log.traceId) ||
                 (rawJSONStr && regex.test(rawJSONStr));
        } else {
          const lowerText = parsedSearch.text.toLowerCase();
          return log.message.toLowerCase().includes(lowerText) ||
                 log.service.toLowerCase().includes(lowerText) ||
                 log.traceId.toLowerCase().includes(lowerText) ||
                 (rawJSONStr && rawJSONStr.toLowerCase().includes(lowerText));
        }
      }
      return true;
    });
  }, [logs, filterLevel, filterService, timeWindow, customStartDate, customEndDate, parsedSearch, isRegex]);

  const chartData = useMemo(() => {
    if (filteredLogs.length === 0) return Array(30).fill({ total: 0, errors: 0 });

    const totalBuckets = 30;
    const timestamps = filteredLogs.map(l => new Date(l.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const range = maxTime - minTime || 1;
    const bucketSize = range / totalBuckets;

    const buckets = Array.from({ length: totalBuckets }, () => ({ total: 0, errors: 0 }));

    filteredLogs.forEach(log => {
      const time = new Date(log.timestamp).getTime();
      const bucketIdx = Math.min(
        Math.floor((time - minTime) / bucketSize),
        totalBuckets - 1
      );
      buckets[bucketIdx].total++;
      if (log.level === 'ERROR' || log.level === 'FATAL') {
        buckets[bucketIdx].errors++;
      }
    });

    return buckets;
  }, [filteredLogs]);

  const activeInspectorLog = useMemo(() => {
    return logs.find(log => log.id === selectedLogId) || null;
  }, [logs, selectedLogId]);

  const clearAllLogs = () => {
    setLogs([]);
    setSelectedLogId(null);
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterLevel('ALL');
    setFilterService('ALL');
    setTimeWindow('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const copyRawLogJSON = () => {
    if (!activeInspectorLog) return;
    const jsonStr = JSON.stringify(activeInspectorLog, null, 2);
    
    const textArea = document.createElement("textarea");
    textArea.value = jsonStr;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const exportLogsAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "logstream_export_" + Date.now() + ".json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const applySuggestion = (suggestionText) => {
    setSearchQuery(suggestionText);
  };

  const highlightText = (text, highlight) => {
    if (!highlight) return <span>{text}</span>;
    const regex = getSafeRegex(highlight, isRegex);
    if (!regex) return <span>{text}</span>;

    try {
      const parts = text.split(regex);
      const matches = text.match(regex);
      
      if (!matches) return <span>{text}</span>;

      return (
        <span>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 && matches[i] && (
                <mark className="bg-indigo-500/20 text-indigo-300 border-b border-indigo-400/30 px-0.5 rounded">
                  {matches[i]}
                </mark>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    } catch (err) {
      return <span>{text}</span>;
    }
  };

  const renderMiniChart = () => {
    const maxVal = Math.max(...chartData.map(d => d.total), 1);
    const width = 600;
    const height = 48;
    const padding = 2;
    const pointsCount = chartData.length;
    const step = (width - padding * 2) / (pointsCount - 1);

    const totalPathPoints = chartData.map((d, idx) => {
      const x = padding + idx * step;
      const y = height - padding - ((d.total / maxVal) * (height - padding * 2));
      return x + "," + y;
    });

    const errorPathPoints = chartData.map((d, idx) => {
      const x = padding + idx * step;
      const y = height - padding - ((d.errors / maxVal) * (height - padding * 2));
      return x + "," + y;
    });

    const totalPath = "M " + totalPathPoints.join(" L ");
    const totalAreaPath = totalPath + " L " + (padding + (pointsCount - 1) * step) + "," + (height - padding) + " L " + padding + "," + (height - padding) + " Z";
    const errorPath = "M " + errorPathPoints.join(" L ");

    return (
      <svg className="w-full h-full" viewBox={"0 0 " + width + " " + height} preserveAspectRatio="none">
        <defs>
          <linearGradient id="totalGradClean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={totalAreaPath} fill="url(#totalGradClean)" />
        <path d={totalPath} fill="none" stroke="#4f46e5" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d={errorPath} fill="none" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-400 font-sans overflow-hidden antialiased selection:bg-indigo-500/20 selection:text-indigo-200">
      
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Navigation Navbar */}
        <header className="h-14 border-b border-slate-900/60 px-6 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-slate-500"></div>
              <span className="font-semibold text-sm tracking-tight text-slate-100">LogStream</span>
            </div>

            <span className="text-slate-800 text-xs hidden sm:inline">|</span>

            <div className="hidden sm:flex items-center gap-2.5 text-[11px] text-slate-500 tracking-wide">
              <span className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className={"w-1.5 h-1.5 rounded-full " + (autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-500")}></span> 
                {autoRefresh ? "LIVE LOG STREAM" : "PAUSED LOG STREAM"}
              </span>
              <span>•</span>
              <span>{logs.length} entries loaded</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={"flex items-center gap-1.5 py-1 px-2.5 rounded text-[11px] transition border font-mono " + (autoRefresh ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-400 hover:bg-emerald-950/60" : "bg-slate-900 border-slate-850 text-slate-500 hover:text-slate-400")}
            >
              <span className={"w-1.5 h-1.5 rounded-full " + (autoRefresh ? "bg-emerald-400 animate-ping" : "bg-slate-600")}></span>
              {autoRefresh ? "Live Feed" : "Paused"}
            </button>

            <button 
              onClick={exportLogsAsJSON}
              className="flex items-center gap-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 py-1 px-2.5 rounded text-[11px] transition border border-slate-800"
            >
              Export
            </button>

            <button 
              onClick={clearAllLogs}
              className="flex items-center gap-1 bg-slate-950 hover:bg-rose-950/10 text-slate-500 hover:text-rose-400 py-1 px-2.5 rounded text-[11px] transition border border-slate-900 hover:border-rose-950/20"
            >
              Clear
            </button>
          </div>
        </header>

        {/* Clean Timeline Panel */}
        <section className="border-b border-slate-900/50 bg-slate-950/40 px-6 py-2 shrink-0 hidden md:block">
          <div className="h-6 w-full relative flex items-center justify-between">
            <span className="text-[9px] text-slate-600 font-mono tracking-wider">FILTERED TIMELINE SPREAD (HISTOGRAM)</span>
            <div className="w-1/4 h-5">{renderMiniChart()}</div>
          </div>
        </section>

        {/* Filters and Query Toolbar */}
        <section className="p-4 border-b border-slate-900 bg-slate-950 shrink-0 space-y-2.5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
            
            {/* Clean Input Field */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter logs... (e.g. 'status:500', 'auth-service')" 
                className="w-full pl-9 pr-20 py-1.5 bg-slate-900 text-slate-200 placeholder-slate-600 rounded border border-slate-850 focus:outline-none focus:border-slate-800 text-xs font-mono transition"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
                {searchQuery && (
                  <span className="text-[9px] text-slate-500 font-mono">
                    {filteredLogs.length} matches
                  </span>
                )}
                <button 
                  onClick={() => setIsRegex(!isRegex)}
                  className={"px-1.5 py-0.5 rounded text-[10px] border transition font-mono " + (isRegex ? "bg-indigo-950 border-indigo-900 text-indigo-400" : "border-transparent text-slate-600 hover:text-slate-400")}
                  title="Toggle Regular Expressions"
                >
                  .*
                </button>
              </div>
            </div>

            {/* Severity and Service Select Filters */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <select 
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="bg-slate-900 text-slate-400 border border-slate-850 rounded px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Levels</option>
                {uniqueLevels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>

              <select 
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="bg-slate-900 text-slate-400 border border-slate-850 rounded px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Services</option>
                {uniqueServices.map(svc => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>

              {/* Chronological Date/Time Selector Dropdown */}
              <select 
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="bg-slate-900 text-slate-400 border border-slate-850 rounded px-2 py-1.5 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Dates</option>
                {uniqueDates.map(dateStr => {
                  const formatted = new Date(dateStr).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  return (
                    <option key={dateStr} value={dateStr}>
                      {formatted}
                    </option>
                  );
                })}
                <option value="CUSTOM">Custom Range</option>
              </select>

              <button 
                onClick={resetAllFilters}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-500 hover:text-slate-300 rounded text-xs border border-slate-900 transition"
                title="Reset active query and filters"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Conditional Date Pickers for Custom View Selection */}
          {timeWindow === 'CUSTOM' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-slate-950 border border-slate-900/60 rounded-md">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono">FROM:</span>
                <input 
                  type="datetime-local"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 text-slate-300 border border-slate-855 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer font-mono"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono">TO:</span>
                <input 
                  type="datetime-local"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 text-slate-300 border border-slate-855 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer font-mono"
                />
              </div>
              <button 
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="text-[9px] text-slate-500 hover:text-slate-300 font-mono underline ml-auto py-0.5 px-1.5"
              >
                Clear Custom Datetime
              </button>
            </div>
          )}

          {/* Quick Suggestions Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 overflow-x-auto whitespace-nowrap pt-0.5 pb-0.5">
            <span className="shrink-0 font-mono text-slate-600">SUGGESTIONS:</span>
            <button onClick={() => applySuggestion('incoming_message')} className="bg-slate-900/40 hover:bg-slate-900 hover:text-slate-300 px-1.5 py-0.5 rounded border border-slate-900/40 transition font-mono text-slate-500">incoming_message</button>
            <button onClick={() => applySuggestion('wamid.')} className="bg-slate-900/40 hover:bg-slate-900 hover:text-slate-300 px-1.5 py-0.5 rounded border border-slate-900/40 transition font-mono text-slate-500">wamid.</button>
            <button onClick={() => applySuggestion('919131037870')} className="bg-slate-900/40 hover:bg-slate-900 hover:text-slate-300 px-1.5 py-0.5 rounded border border-slate-900/40 transition font-mono text-slate-500">919131037870</button>
          </div>
        </section>

        {/* Log Output Table Frame */}
        <section className="flex-1 overflow-y-auto relative bg-slate-950 font-mono text-[11px] leading-tight">
          
          {/* Header Row */}
          <div className="sticky top-0 bg-slate-950 border-b border-slate-900 px-4 py-2 text-slate-600 flex items-center font-semibold text-[10px] tracking-wide select-none z-10">
            <span className="w-4 shrink-0"></span>
            <span className="w-28 shrink-0">Timestamp</span>
            <span className="w-36 shrink-0 px-2">Level</span>
            <span className="w-36 shrink-0 px-2">Service</span>
            <span className="flex-1 px-2">Message</span>
            <span className="hidden lg:block w-28 shrink-0 text-right">Trace</span>
          </div>

          {/* Log Stream Body List */}
          <div className="divide-y divide-slate-900/40 relative min-h-full flex flex-col">
            {isLoading && logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-mono animate-pulse">Streaming live database logs from demo_doctor server...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 px-6 text-center">
                <div className="text-rose-500 text-sm font-semibold flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-550 animate-ping"></span>
                  Connection Failure
                </div>
                <p className="text-[11px] text-rose-455/80 font-mono max-w-md break-all leading-normal bg-rose-950/10 border border-rose-950/20 p-3 rounded">
                  {error}
                </p>
                <button 
                  onClick={fetchLogs}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-1 px-4 rounded text-xs transition border border-slate-800"
                >
                  Retry Connection
                </button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <h3 className="text-xs font-semibold text-slate-400">No events match criteria</h3>
                <p className="text-[11px] text-slate-600 mt-1 max-w-xs leading-normal">
                  Reset filters or redefine search thresholds to locate diagnostic logs.
                </p>
                <button 
                  onClick={resetAllFilters}
                  className="mt-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-1 px-4 rounded text-xs transition border border-slate-800"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredLogs.map(log => {
                const isSelected = log.id === selectedLogId;
                
                let levelLabelColor = 'text-slate-500';
                let indicatorColor = 'bg-slate-700';
                
                if (log.level.includes('ERROR') || log.level.includes('FAIL')) {
                  levelLabelColor = 'text-rose-400';
                  indicatorColor = 'bg-rose-500/70';
                } else if (log.level.includes('WARN')) {
                  levelLabelColor = 'text-amber-400';
                  indicatorColor = 'bg-amber-500/70';
                } else if (log.level.includes('DEBUG')) {
                  levelLabelColor = 'text-purple-400';
                  indicatorColor = 'bg-purple-500/70';
                } else if (log.level.includes('INCOMING')) {
                  levelLabelColor = 'text-emerald-400';
                  indicatorColor = 'bg-emerald-500/70';
                } else if (log.level.includes('OUTGOING')) {
                  levelLabelColor = 'text-sky-400';
                  indicatorColor = 'bg-sky-500/70';
                } else if (log.level === 'INFO') {
                  levelLabelColor = 'text-blue-400';
                  indicatorColor = 'bg-blue-500/70';
                } else {
                  levelLabelColor = 'text-indigo-400';
                  indicatorColor = 'bg-indigo-500/70';
                }

                const logDate = new Date(log.timestamp);
                const timeStr = logDate.toLocaleTimeString() + '.' + String(logDate.getMilliseconds()).padStart(3, '0');

                return (
                  <div 
                    key={log.id}
                    onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                    className={"group px-4 py-1.5 flex items-center gap-1 cursor-pointer transition-colors duration-150 " + (isSelected ? "bg-slate-900/30 border-l border-indigo-500" : "hover:bg-slate-900/10")}
                  >
                    <span className="w-4 shrink-0 text-slate-700 flex justify-center items-center">
                      <svg className={"w-2.5 h-2.5 transform transition-transform " + (isSelected ? "rotate-90 text-indigo-400" : "text-slate-700 group-hover:text-slate-500")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                    <span className="w-28 shrink-0 text-slate-500 font-mono tracking-tighter truncate text-[10px]" title={log.timestamp}>
                      {timeStr}
                    </span>
                    <span className="w-36 shrink-0 flex items-center justify-start gap-1.5 px-2 truncate">
                      <span className={"w-1 h-1 rounded-full shrink-0 " + indicatorColor}></span>
                      <span className={"text-[9px] font-semibold tracking-wide truncate " + levelLabelColor} title={log.level}>
                        {log.level}
                      </span>
                    </span>
                    <span className="w-36 shrink-0 px-2 text-slate-400 tracking-tight truncate text-[10px]" title={log.service}>
                      {log.service}
                    </span>
                    <span className="flex-1 text-slate-300 font-mono truncate px-2 select-all" title={log.message}>
                      {highlightText(log.message, parsedSearch.text)}
                    </span>
                    <span className="hidden lg:block w-28 shrink-0 text-right text-slate-600 group-hover:text-indigo-400 transition-colors font-mono tracking-tighter truncate text-[10px]" title={log.traceId}>
                      {log.traceId}
                    </span>
                  </div>
                );
              })
            )}
            
            <div ref={logsEndRef} />
          </div>
        </section>

        {/* Detailed Inspection Drawer */}
        {activeInspectorLog && (() => {
          const rawItem = activeInspectorLog.metadata?.raw || {};
          const props = [
            { key: 'Log ID', val: activeInspectorLog.id },
            { key: 'Created At', val: rawItem.createdAt || activeInspectorLog.timestamp },
            { key: 'Event Type', val: rawItem.event_type || activeInspectorLog.service },
            { key: 'Sender Phone', val: rawItem.message?.from || 'N/A' },
            { key: 'Sender User ID', val: rawItem.message?.from_user_id || 'N/A' },
            { key: 'Message ID', val: rawItem.message?.id || 'N/A' },
            { key: 'Message Type', val: rawItem.message?.type || 'N/A' },
            { key: 'Message Body', val: rawItem.message?.text?.body || rawItem.message?.body || 'N/A' }
          ];

          const filteredProperties = !drawerSearch.trim() 
            ? props 
            : props.filter(p => 
                p.key.toLowerCase().includes(drawerSearch.toLowerCase()) || 
                String(p.val).toLowerCase().includes(drawerSearch.toLowerCase())
              );

          const rawObj = activeInspectorLog.metadata?.raw || activeInspectorLog;
          const fullJSONString = JSON.stringify(rawObj, null, 2);
          const filteredJSONString = !drawerSearch.trim()
            ? fullJSONString
            : (() => {
                const jsonLines = fullJSONString.split('\n');
                const query = drawerSearch.toLowerCase();
                const filteredLines = jsonLines.filter(line => line.toLowerCase().includes(query));
                return filteredLines.length > 0
                  ? `// Filtered matches for "${drawerSearch}":\n` + filteredLines.join('\n')
                  : `// No matches found for "${drawerSearch}" inside JSON schema payload`;
              })();

          return (
            <div className="border-t border-slate-900 bg-slate-950 flex flex-col h-72 shrink-0 transition-all duration-200 overflow-hidden">
              <div className="h-10 border-b border-slate-900 px-4 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                    Trace Details
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 border border-slate-900 rounded font-bold font-mono text-indigo-400 shrink-0">
                    {activeInspectorLog.level}
                  </span>
                  <div className="h-4 w-px bg-slate-900 mx-1 hidden md:block"></div>
                  
                  {/* Search Filter Input inside Drawer Header */}
                  <div className="relative max-w-xs flex-1 hidden md:block">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-650">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      value={drawerSearch}
                      onChange={(e) => setDrawerSearch(e.target.value)}
                      placeholder="Filter properties or payload fields..." 
                      className="w-full pl-7 pr-2 py-0.5 bg-slate-900 text-slate-300 placeholder-slate-650 rounded border border-slate-850 focus:outline-none focus:border-slate-800 text-[10px] font-mono transition"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyRawLogJSON}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded text-xs transition border border-slate-800 font-mono"
                  >
                    {copySuccess ? "Copied" : "Copy Payload"}
                  </button>
                  <button 
                    onClick={() => setSelectedLogId(null)}
                    className="text-slate-500 hover:text-slate-300 transition p-1 hover:bg-slate-900 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Metadata Properties */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Properties</h4>
                    {drawerSearch && (
                      <span className="text-[9px] text-slate-500 font-mono">
                        {filteredProperties.length} matches
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-900/20 rounded p-3 border border-slate-900 space-y-2 text-xs font-mono text-slate-400 max-h-36 overflow-y-auto">
                    {filteredProperties.map((prop, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 py-0.5 border-b border-slate-950 last:border-0">
                        <span className="text-slate-600">{prop.key}</span>
                        <span className="col-span-2 text-slate-300 select-all truncate" title={String(prop.val)}>
                          {prop.val}
                        </span>
                      </div>
                    ))}
                    {filteredProperties.length === 0 && (
                      <div className="text-center py-4 text-slate-650 text-[10px]">
                        No matching properties found
                      </div>
                    )}
                  </div>
                </div>

                {/* Structured JSON Documents code block */}
                <div className="flex flex-col h-full min-h-[120px]">
                  <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">JSON Schema Payload</h4>
                  <pre className="flex-1 bg-slate-950 rounded p-3 border border-slate-900 font-mono text-slate-300 text-[10px] overflow-auto max-h-36">
                    {filteredJSONString}
                  </pre>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Status Footer */}
        <footer className="h-8 border-t border-slate-900 px-4 bg-slate-950 flex items-center justify-between text-[10px] text-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              Buffer limit: <strong className="text-slate-400 font-mono">{logs.length}/{MAX_BUFFER_SIZE}</strong>
            </span>
            <span className="text-slate-800">|</span>
            <span className="flex items-center gap-1">
              Filtered matches: <strong className="text-slate-400 font-mono">{filteredLogs.length}</strong>
            </span>
          </div>
          <div className="hidden sm:block">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[9px] text-slate-500">ESC</kbd> to close trace detail</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
