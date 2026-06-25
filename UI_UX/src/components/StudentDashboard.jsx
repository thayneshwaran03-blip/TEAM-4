import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function StudentDashboard({ user, onLogout }) {
  const name       = user?.fullName  || 'Alex Mercer';
  const role       = user?.role      ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student';
  const initials   = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AM';
  const email      = user?.email      || 'alex.mercer@hostel.com';
  const roomNumber = '101';
  const blockName  = 'Block A';

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isMobileDrawerOpen,  setIsMobileDrawerOpen]  = useState(false);
  const [isSidebarExpanded,   setIsSidebarExpanded]   = useState(false);
  const [isProfileOpen,       setIsProfileOpen]       = useState(false);
  const [isNotifOpen,         setIsNotifOpen]         = useState(false);
  const [activeTab,           setActiveTab]           = useState('Dashboard');
  const [toast,               setToast]               = useState(null); // { message, type: 'success'|'error' }

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPwModal,       setShowPwModal]       = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);

  // form fields
  const [leaveType,      setLeaveType]      = useState('Weekend Outing');
  const [leaveStart,     setLeaveStart]     = useState('');
  const [leaveEnd,       setLeaveEnd]       = useState('');
  const [leaveReason,    setLeaveReason]    = useState('');
  const [complaintType,  setComplaintType]  = useState('Maintenance');
  const [complaintDesc,  setComplaintDesc]  = useState('');
  const [visitorName,    setVisitorName]    = useState('');
  const [visitorRel,     setVisitorRel]     = useState('');
  const [visitorDate,    setVisitorDate]    = useState('');
  const [oldPw,          setOldPw]          = useState('');
  const [newPw,          setNewPw]          = useState('');
  const [confirmPw,      setConfirmPw]      = useState('');
  const [emailNotifs,    setEmailNotifs]    = useState(true);
  const [smsNotifs,      setSmsNotifs]      = useState(false);
  const [autoQr,         setAutoQr]         = useState(true);

  // ── click-outside refs ────────────────────────────────────────────────────
  const profileRef = useRef(null);
  const notifRef   = useRef(null);

  useEffect(() => {
    const h = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const name = user && user.fullName ? user.fullName : 'Alex Mercer';
  const role = user && user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Student';
  const initials = user && user.fullName 
    ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'AM';

  const navItems = [
    { icon: 'fa-th-large', label: 'Dashboard', active: true },
    { icon: 'fa-user', label: 'My Profile' },
    { icon: 'fa-door-open', label: 'My Room' },
    { icon: 'fa-calendar-check', label: 'Apply Leave' },
    { icon: 'fa-exclamation-triangle', label: 'Complaints' },
    { icon: 'fa-credit-card', label: 'Fees & Dues' },
    { icon: 'fa-bullhorn', label: 'Announcements' },
    { icon: 'fa-address-book', label: 'My Visitor History' },
    { icon: 'fa-qrcode', label: 'QR Gate Pass' }
  ];

  // ── API helpers & data loading ─────────────────────────────────────────
  const apiFetch = async (path, opts = {}) => {
    const token = localStorage.getItem('token');
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api${path}`, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  };

  const fetchAll = async () => {
    try {
      const [profileResp, leaveResp, compResp, visResp, annResp, notifResp] = await Promise.all([
        apiFetch('/student/profile').catch(() => null),
        apiFetch('/student/leave/history').catch(() => ({ leaveHistory: [] })),
        apiFetch('/student/complaint/history').catch(() => ({ complaints: [] })),
        apiFetch('/student/visitor/history').catch(() => ({ visitorRequests: [] })),
        apiFetch('/student/announcements').catch(() => ({ announcements: [] })),
        apiFetch('/student/notifications').catch(() => ({ notifications: [] })),
      ]);

      if (profileResp && profileResp.student) {
        // profileResp.student is available here if needed
      }

      setLeaves(leaveResp.leaveHistory || []);
      setComplaints(compResp.complaints || []);
      setVisitors(visResp.visitorRequests || []);
      setAnnouncements(annResp.announcements || []);
      setNotifications(notifResp.notifications || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error.message);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── derived ───────────────────────────────────────────────────────────────
  const unread         = notifications.filter(n => !n.read).length;
  const pendingLeaves  = leaves.filter(l => l.status === 'Pending').length;
  const activeComp     = complaints.filter(c => c.status === 'Pending').length;

  // live date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dayStr  = today.toLocaleDateString('en-US', { weekday: 'long' });

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── handlers ──────────────────────────────────────────────────────────────
  const submitLeave = async e => {
    e.preventDefault();
    try {
      if (!leaveStart || !leaveEnd || !leaveReason) { showToast('Please fill all required fields.', 'error'); return; }
      if (new Date(leaveEnd) < new Date(leaveStart)) { showToast('End date must be after start date.', 'error'); return; }
      const payload = { leaveType, fromDate: leaveStart, toDate: leaveEnd, reason: leaveReason };
      await apiFetch('/student/leave', { method: 'POST', body: JSON.stringify(payload) });
      setLeaveStart(''); setLeaveEnd(''); setLeaveReason('');
      await fetchAll();
      showToast('Leave request submitted successfully!');
    } catch (err) {
      console.error(err);
      showToast('Unable to submit leave request.', 'error');
    }
  };

  const submitComplaint = async e => {
    e.preventDefault();
    try {
      if (!complaintDesc.trim()) { showToast('Please describe the issue.', 'error'); return; }
      const payload = { category: complaintType, title: complaintDesc.substring(0, 80), description: complaintDesc, priority: 'Medium' };
      await apiFetch('/student/complaint', { method: 'POST', body: JSON.stringify(payload) });
      setComplaintDesc('');
      await fetchAll();
      showToast('Complaint filed successfully!');
    } catch (err) {
      console.error(err);
      showToast('Unable to file complaint.', 'error');
    }
  };

  const submitVisitor = async e => {
    e.preventDefault();
    try {
      if (!visitorName.trim() || !visitorRel.trim() || !visitorDate) { showToast('Please fill all visitor details.', 'error'); return; }
      const payload = { visitorName, relationship: visitorRel, phoneNumber: '', visitDate: visitorDate, expectedArrivalTime: '00:00' };
      await apiFetch('/student/visitor', { method: 'POST', body: JSON.stringify(payload) });
      setVisitorName(''); setVisitorRel(''); setVisitorDate('');
      await fetchAll();
      showToast('Visitor registered successfully!');
    } catch (err) {
      console.error(err);
      showToast('Unable to register visitor.', 'error');
    }
  };
  const submitPw = e => {
    e.preventDefault();
    if (!oldPw || !newPw || !confirmPw) { showToast('Please fill all password fields.', 'error'); return; }
    if (newPw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (newPw !== confirmPw) { showToast('New password and confirm password do not match.', 'error'); return; }
    showToast('Password updated successfully!');
    setOldPw(''); setNewPw(''); setConfirmPw('');
    setShowPwModal(false);
  };
  const navigate = id => { setActiveTab(id); setIsMobileDrawerOpen(false); };

  // ── nav config ────────────────────────────────────────────────────────────
  const mainNav = [
    { id: 'Dashboard',          icon: 'fa-th-large',    label: 'Dashboard'         },
    { id: 'My Room',            icon: 'fa-bed',         label: 'My Room'           },
    { id: 'Apply Leave',        icon: 'fa-paper-plane', label: 'Apply Leaves'      },
    { id: 'Announcements',      icon: 'fa-bullhorn',    label: 'Announcements'     },
    { id: 'My Visitor History', icon: 'fa-user-friends',label: 'My Visitor History'},
  ];

  // ── shared input style ────────────────────────────────────────────────────
  const inp = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full min-h-screen bg-[#F5F7FB] font-sans antialiased text-gray-800 overflow-x-hidden">

      {/* ── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 animate-fadeIn ${
          toast.type === 'success'
            ? 'bg-emerald-500 text-white'
            : 'bg-rose-500 text-white'
        }`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-sm`} />
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white transition-colors">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}

        />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-100
          transition-all duration-300 ease-in-out overflow-hidden
          lg:static lg:h-screen lg:flex
          ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: isMobileDrawerOpen ? '256px' : (isSidebarExpanded ? '256px' : '72px') }}
      >
        {/* ── Sidebar top: logo row (always visible) ── */}
        <div
          className="flex items-center border-b border-gray-100 shrink-0"
          style={{ height: '64px', padding: isSidebarExpanded || isMobileDrawerOpen ? '0 16px' : '0', justifyContent: isSidebarExpanded || isMobileDrawerOpen ? 'flex-start' : 'center' }}
        >
          <div className="w-9 h-9 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
            <i className="fas fa-home text-primary text-base" />
          </div>
          <span
            className="font-bold text-gray-900 text-base tracking-tight select-none ml-2.5 whitespace-nowrap overflow-hidden transition-all duration-300"
            style={{ opacity: isSidebarExpanded || isMobileDrawerOpen ? 1 : 0, maxWidth: isSidebarExpanded || isMobileDrawerOpen ? '160px' : '0px' }}
          >
            Hostel<span className="text-primary">Hub</span>
          </span>
        </div>

        {/* ── Profile card (only when expanded) ── */}
        <div
          className="mx-3 mt-4 mb-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden transition-all duration-300"
          style={{
            opacity: isSidebarExpanded || isMobileDrawerOpen ? 1 : 0,
            maxHeight: isSidebarExpanded || isMobileDrawerOpen ? '160px' : '0px',
            marginTop: isSidebarExpanded || isMobileDrawerOpen ? '16px' : '0px',
            marginBottom: isSidebarExpanded || isMobileDrawerOpen ? '8px' : '0px',
            padding: isSidebarExpanded || isMobileDrawerOpen ? '16px' : '0px',
            pointerEvents: isSidebarExpanded || isMobileDrawerOpen ? 'auto' : 'none',
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-md mb-2" style={{ fontSize: '16px' }}>
              {initials.charAt(0)}
            </div>
            <p className="font-semibold text-[#1F2937] leading-tight whitespace-nowrap" style={{ fontSize: '14px' }}>{name}</p>
            <span className="mt-1 px-2.5 py-0.5 bg-primary/10 text-primary font-bold uppercase rounded-full whitespace-nowrap" style={{ fontSize: '9px', letterSpacing: '0.08em' }}>Student</span>
            <p className="mt-1.5 text-[#6B7280] font-medium whitespace-nowrap" style={{ fontSize: '11px' }}>Room {roomNumber}, {blockName}</p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 flex flex-col py-2 overflow-y-auto overflow-x-hidden" style={{ padding: '8px 10px' }}>
          {mainNav.map(item => {
            const active = activeTab === item.id;
            const expanded = isSidebarExpanded || isMobileDrawerOpen;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                title={!expanded ? item.label : undefined}
                className={`flex items-center rounded-xl w-full text-left transition-all duration-150 mb-0.5
                  ${active ? 'bg-primary/10 text-primary' : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#1F2937]'}`}
                style={{
                  padding: expanded ? '10px 14px' : '10px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <i className={`fas ${item.icon} shrink-0 text-center transition-colors ${ active ? 'text-primary' : 'text-gray-400' }`}
                  style={{ width: '20px', fontSize: '16px' }}
                />
                <span
                  className="whitespace-nowrap overflow-hidden transition-all duration-300"
                  style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? '180px' : '0px', marginLeft: expanded ? '12px' : '0px' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Sign Out ── */}
        <div className="border-t border-gray-100 shrink-0" style={{ padding: '10px 10px' }}>
          {(() => {
            const expanded = isSidebarExpanded || isMobileDrawerOpen;
            return (
              <button
                onClick={onLogout}
                title={!expanded ? 'Sign Out' : undefined}
                className="flex items-center rounded-xl w-full text-left text-red-500 hover:bg-red-50 transition-colors"
                style={{
                  padding: expanded ? '10px 14px' : '10px 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <i className="fas fa-sign-out-alt shrink-0 text-center" style={{ width: '20px', fontSize: '16px' }} />
                <span
                  className="whitespace-nowrap overflow-hidden transition-all duration-300"
                  style={{ opacity: expanded ? 1 : 0, maxWidth: expanded ? '180px' : '0px', marginLeft: expanded ? '12px' : '0px' }}
                >
                  Sign Out
                </span>
              </button>
            );
          })()}
        </div>
      </aside>

      {/* ── MAIN WRAPPER ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">

        {/* ── TOP NAVBAR ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-5 flex items-center justify-between" style={{ height: '64px' }}>
          {/* Left: Logo + Hamburger + Breadcrumb */}
          <div className="flex items-center">
            {/* HostelHub Logo (visible on mobile when sidebar is hidden) */}
            <div className="flex items-center space-x-2 lg:hidden mr-3">
              <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center">
                <i className="fas fa-home text-primary text-sm" />
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight select-none">
                Hostel<span className="text-primary">Hub</span>
              </span>
            </div>
            {/* Hamburger — between logo and breadcrumb */}
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileDrawerOpen(!isMobileDrawerOpen);
                } else {
                  setIsSidebarExpanded(!isSidebarExpanded);
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[#374151] hover:bg-gray-100 transition-colors mr-3"
            >
              <i className="fas fa-bars" style={{ fontSize: '16px' }} />
            </button>
            {/* Page Breadcrumb */}
            <div className="hidden sm:flex items-center">
              <span className="font-semibold text-[#1F2937]" style={{ fontSize: '15px' }}>{activeTab}</span>
            </div>
          </div>

          {/* Right: bell + profile */}
          <div className="flex items-center space-x-4">

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
              >
                <i className="fas fa-bell text-base" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white">
                    {unread}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-4 origin-top-right animate-scaleIn">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-[#1F2937]">Notifications</span>
                    {unread > 0 && (
                      <button
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                        className="text-xs text-primary font-medium hover:underline"
                      >Mark all read</button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2.5 rounded-xl text-xs ${n.read ? '' : 'bg-primary/5'}`}>
                        <p className="text-[#374151] font-normal">{n.text}</p>
                        <p className="text-[#6B7280] mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className="flex items-center space-x-3 pl-2 pr-3 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold" style={{ fontSize: '16px' }}>
                  {initials.charAt(0)}
                </div>
                <span className="hidden sm:block font-semibold text-[#1F2937] leading-none" style={{ fontSize: '17px' }}>{name}</span>
                <i className={`fas fa-chevron-down text-[11px] text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2 origin-top-right animate-scaleIn">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-[#1F2937] truncate">{name}</p>
                    <p className="text-[10px] text-[#6B7280] truncate">{email}</p>
                  </div>
                  {[
                    { icon: 'fa-user-circle', label: 'My Profile',       action: () => { setShowProfileModal(true);  setIsProfileOpen(false); } },
                    { icon: 'fa-cog',         label: 'Settings',         action: () => { setShowSettingsModal(true); setIsProfileOpen(false); } },
                    { icon: 'fa-lock',        label: 'Change Password',  action: () => { setShowPwModal(true);       setIsProfileOpen(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      className="flex items-center space-x-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <i className={`fas ${item.icon} text-gray-400 text-sm w-4 text-center`} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { onLogout(); setIsProfileOpen(false); }}
                    className="flex items-center space-x-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
                    <i className="fas fa-sign-out-alt text-red-400 text-sm w-4 text-center" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MAIN BODY ─────────────────────────────────────────────────── */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1 space-y-6">

          {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fadeIn">

              {/* Welcome row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="font-bold text-[#111827] leading-tight tracking-tight" style={{ fontSize: '42px' }}>
                    Welcome Back, {name.split(' ')[0]} 👋
                  </h1>
                  <p className="text-[#4B5563] mt-2" style={{ fontSize: '18px', fontWeight: 500 }}>Here's what's happening in your hostel today.</p>
                </div>
                {/* Date card */}
                <div className="flex items-center space-x-3 px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-left shrink-0">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-primary-light text-base" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1F2937] leading-tight" style={{ fontSize: '14px' }}>{dateStr}</p>
                    <p className="text-[#6B7280] font-medium" style={{ fontSize: '12px' }}>{dayStr}</p>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: 'fa-home',    iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',
                    label: 'My Room',   value: `Room ${roomNumber}`,   sub: `${blockName} · 1st Floor`,
                    tab: 'My Room',
                  },
                  {
                    icon: 'fa-calendar-check', iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
                    label: 'Pending Leaves',   value: pendingLeaves || 0, sub: 'Awaiting approval',
                    tab: 'Apply Leave',
                  },
                  {
                    icon: 'fa-exclamation-triangle', iconBg: 'bg-rose-50', iconColor: 'text-rose-600',
                    label: 'Active Complaints',       value: activeComp || 0, sub: 'Under resolution',
                    tab: 'My Room',
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(c.tab)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                        <i className={`fas ${c.icon} ${c.iconColor} text-base`} />
                      </div>
                      <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <i className="fas fa-chevron-right text-gray-400 group-hover:text-primary text-[9px] transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <div>
                      <p className="uppercase tracking-wider mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>{c.label}</p>
                      <p className="font-semibold text-[#111827] mb-1 leading-tight" style={{ fontSize: '22px' }}>{c.value}</p>
                      <p className="text-[#6B7280]" style={{ fontSize: '13px', fontWeight: 500 }}>{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom grid: Room Allocation + Announcements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Current Room Allocation */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-building text-primary-light text-sm" />
                        </div>
                        <h3 className="font-semibold text-[#1F2937]" style={{ fontSize: '18px' }}>Current Room Allocation</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {[
                        { label: 'ROOM NUMBER',    value: '101',        icon: 'fa-bed',       iconColor: 'text-blue-500'   },
                        { label: 'BLOCK / WING',   value: 'Block A',    icon: 'fa-building',  iconColor: 'text-primary-light' },
                        { label: 'FLOOR LEVEL',    value: '1st Floor',  icon: 'fa-layer-group',iconColor: 'text-orange-500'},
                        { label: 'ROOMMATES COUNT',value: '1 Roommate', icon: 'fa-user-friends',iconColor: 'text-green-500'},
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50/50 hover:bg-gray-50/80 rounded-xl p-4 flex items-center justify-between border border-gray-100/50 transition-colors">
                          <div>
                            <p className="uppercase tracking-widest mb-1 text-[#6B7280]" style={{ fontSize: '10px', fontWeight: 500 }}>{item.label}</p>
                            <p className="font-semibold text-[#1F2937]" style={{ fontSize: '15px' }}>{item.value}</p>
                          </div>
                          <i className={`fas ${item.icon} ${item.iconColor} text-lg opacity-85`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('My Room')}
                    className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2"
                    style={{ fontSize: '17px' }}
                  >
                    <span>View Allocation Details</span>
                    <i className="fas fa-arrow-right text-xs" />
                  </button>
                </div>

                {/* Recent Announcements */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                          <i className="fas fa-bullhorn text-orange-500 text-sm" />
                        </div>
                        <h3 className="font-semibold text-[#1F2937]" style={{ fontSize: '18px' }}>Recent Announcements</h3>
                      </div>
                    </div>

                    {announcements.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
                        <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-800 mb-1">No announcements available</p>
                        <p className="text-xs text-gray-400 font-normal max-w-xs leading-normal">Check back later for any official updates from the hostel management.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar mb-6">
                        {announcements.map(ann => (
                          <div key={ann.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-1.5">
                              <h4 className="font-semibold text-[#1F2937] leading-tight" style={{ fontSize: '13px' }}>{ann.title}</h4>
                              <span className="text-[#6B7280] whitespace-nowrap ml-3" style={{ fontSize: '11px', fontWeight: 500 }}>{ann.date}</span>
                            </div>
                            <p className="font-semibold text-primary mb-1.5" style={{ fontSize: '11px' }}>By {ann.author}</p>
                            <p className="text-[#374151] font-normal leading-relaxed line-clamp-2" style={{ fontSize: '13px' }}>{ann.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate('Announcements')}
                    className="w-full border border-gray-200 text-[#374151] hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    style={{ fontSize: '17px' }}
                  >
                    <span>View All Announcements</span>
                    <i className="fas fa-arrow-right text-xs" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ══ MY ROOM ════════════════════════════════════════════════════ */}
          {activeTab === 'My Room' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Room Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-[#1F2937] mb-4" style={{ fontSize: '18px' }}>Roommates</h3>
                    <div className="flex items-center space-x-3 py-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">RS</div>
                      <div>
                        <p className="font-semibold text-[#1F2937]" style={{ fontSize: '15px' }}>Rohit Sharma</p>
                        <p className="text-[#6B7280] font-normal" style={{ fontSize: '13px' }}>Computer Science · 2nd Year</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-[#1F2937] mb-4" style={{ fontSize: '18px' }}>Room Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Wi-Fi', 'Air Conditioning', 'Study Desk', 'Personal Locker', 'Attached Bathroom', 'Daily Housekeeping'].map((a, i) => (
                        <div key={i} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                          <i className="fas fa-check-circle text-green-500 text-xs" />
                          <span className="text-[#374151] font-medium" style={{ fontSize: '14px' }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-semibold text-[#1F2937] mb-4" style={{ fontSize: '18px' }}>File Complaint</h3>
                  <form onSubmit={submitComplaint} className="space-y-3">
                    <div>
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Category</label>
                      <select value={complaintType} onChange={e => setComplaintType(e.target.value)} className={inp}>
                        {['Maintenance','Electrical','Plumbing','Internet','Other'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Description</label>
                      <textarea rows={3} placeholder="Describe the issue…" value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} className={`${inp} resize-none`} />
                    </div>
                    <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow" style={{ fontSize: '17px' }}>
                      Submit Complaint
                    </button>
                  </form>
                  {complaints.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                      <p className="text-[10px] font-normal text-gray-400 uppercase tracking-wider">Recent</p>
                      {complaints.map(c => (
                        <div key={c.id} className="p-3 bg-gray-50 rounded-xl text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-[#1F2937]">{c.type}</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[9px] ${c.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{c.status}</span>
                          </div>
                          <p className="text-[#374151] font-normal leading-normal">{c.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ APPLY LEAVE ════════════════════════════════════════════════ */}
          {activeTab === 'Apply Leave' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Apply for Leave</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-semibold text-[#1F2937] mb-4" style={{ fontSize: '18px' }}>Leave Request</h3>
                  <form onSubmit={submitLeave} className="space-y-3">
                    <div>
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Leave Type</label>
                      <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className={inp}>
                        {['Weekend Outing','Medical Leave','Emergency Vacation','Holiday Outing'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Start</label>
                        <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>End</label>
                        <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Reason</label>
                      <textarea rows={3} placeholder="Reason for leave…" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className={`${inp} resize-none`} />
                    </div>
                    <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow" style={{ fontSize: '17px' }}>
                      Submit Request
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-[#1F2937] mb-4" style={{ fontSize: '18px' }}>Leave History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: '14px' }}>
                      <thead>
                        <tr className="border-b border-gray-100 text-[#6B7280] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 500 }}>
                          <th className="pb-3 text-left font-medium">Type</th>
                          <th className="pb-3 text-left font-medium">Duration</th>
                          <th className="pb-3 text-left font-medium">Reason</th>
                          <th className="pb-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {leaves.map(l => (
                          <tr key={l.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 font-semibold text-[#1F2937]">{l.type}</td>
                            <td className="py-4 text-[#374151] font-normal">{l.startDate} → {l.endDate}</td>
                            <td className="py-4 text-[#6B7280] font-normal max-w-[120px] truncate">{l.reason}</td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full font-semibold text-xs uppercase ${l.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{l.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ANNOUNCEMENTS ══════════════════════════════════════════════ */}
          {activeTab === 'Announcements' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Announcements</h2>
              </div>
              
              {announcements.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center animate-fadeIn">
                  <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  <p className="text-base font-semibold text-gray-800 mb-1">No announcements available</p>
                  <p className="text-sm text-gray-400 font-normal max-w-sm leading-normal">Check back later for any official updates from the hostel management.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {announcements.map(ann => (
                    <div key={ann.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-[#1F2937] leading-tight" style={{ fontSize: '18px' }}>{ann.title}</h3>
                        <span className="text-[#6B7280] whitespace-nowrap ml-4" style={{ fontSize: '13px', fontWeight: 500 }}>{ann.date}</span>
                      </div>
                      <p className="font-semibold text-primary mb-3" style={{ fontSize: '13px' }}>Posted by {ann.author}</p>
                      <p className="text-[#374151] font-normal leading-relaxed" style={{ fontSize: '15px' }}>{ann.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ MY VISITOR HISTORY ═════════════════════════════════════════ */}
          {activeTab === 'My Visitor History' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Visitor History</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-semibold text-[#1F2937] mb-4" style={{ fontSize: '18px' }}>Pre-Register Visitor</h3>
                  <form onSubmit={submitVisitor} className="space-y-3">
                    <div>
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Name</label>
                      <input type="text" placeholder="Visitor's name" value={visitorName} onChange={e => setVisitorName(e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Relationship</label>
                      <input type="text" placeholder="Father / Mother / Friend…" value={visitorRel} onChange={e => setVisitorRel(e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Visit Date</label>
                      <input type="date" value={visitorDate} onChange={e => setVisitorDate(e.target.value)} className={inp} />
                    </div>
                    <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow" style={{ fontSize: '17px' }}>
                      Register Visitor
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-[#1F2937] mb-4" style={{ fontSize: '18px' }}>Visitor Logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: '14px' }}>
                      <thead>
                        <tr className="border-b border-gray-100 text-[#6B7280] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 500 }}>
                          <th className="pb-3 text-left font-medium">Name</th>
                          <th className="pb-3 text-left font-medium">Relation</th>
                          <th className="pb-3 text-left font-medium">Date</th>
                          <th className="pb-3 text-left font-medium">Time</th>
                          <th className="pb-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {visitors.map(v => (
                          <tr key={v.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 font-semibold text-[#1F2937]">{v.name}</td>
                            <td className="py-4 text-[#374151] font-normal">{v.relation}</td>
                            <td className="py-4 text-[#374151] font-normal">{v.date}</td>
                            <td className="py-4 text-[#6B7280] font-normal">{v.timeIn} → {v.timeOut}</td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full font-semibold text-xs uppercase ${v.status === 'Checked Out' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>{v.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}


          </div>

          {/* Global Footer */}
          <footer className="mt-12 py-6 border-t border-gray-100 flex items-center justify-center shrink-0">
            <p className="text-xs text-gray-400 font-normal">
              © 2026 HostelHub System. All rights reserved.
            </p>
          </footer>
        </main>
      </div>

      {/* Floating chat button (matches screenshot) */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-primary hover:bg-primary-light text-white rounded-full shadow-lg flex items-center justify-center transition-all z-30 hover:scale-105">
        <i className="fas fa-comment text-base" />
      </button>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {/* My Profile */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg shadow-2xl relative z-10 animate-scaleIn text-left max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
              <i className="fas fa-times" />
            </button>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">{initials}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold uppercase rounded-full">{role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              {[
                ['Email',        user?.email        || 'alex.mercer@gmail.com'],
                ['Phone',        user?.phoneNumber   || '+91 96295 62900'],
                ['Department',   user?.department    || 'Computer Science'],
                ['Year',         user?.year          || '2nd Year'],
                ['Parent Name',  user?.parentName    || 'Balasubramaniam'],
                ['Parent Phone', user?.parentContact || '+91 99763 99893'],
                ['Gender',       user?.gender        || 'Female'],
                ['Room',         `Room ${roomNumber} (${blockName})`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-400 uppercase tracking-wider text-[9px] mb-0.5">{k}</p>
                  <p className="font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowProfileModal(false)} className="mt-7 w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl relative z-10 animate-scaleIn text-left">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><i className="fas fa-times" /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Account Settings</h3>
            <div className="space-y-5">
              {[
                { label:'Email Notifications', sub:'Approvals & notice alerts', val:emailNotifs, set:setEmailNotifs },
                { label:'SMS Notifications',   sub:'Emergency leave alerts',    val:smsNotifs,   set:setSmsNotifs   },
                { label:'Auto Gate-Pass QR',   sub:'Auto-refresh scanner token',val:autoQr,      set:setAutoQr      },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-gray-800">{s.label}</p><p className="text-xs text-gray-400">{s.sub}</p></div>
                  <button onClick={() => s.set(!s.val)} className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${s.val ? 'bg-primary' : 'bg-gray-200'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${s.val ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="mt-7 w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Save Settings</button>
          </div>
        </div>
      )}

      {/* Change Password */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPwModal(false)} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl relative z-10 animate-scaleIn text-left">
            <button onClick={() => setShowPwModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><i className="fas fa-times" /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Change Password</h3>
            <form onSubmit={submitPw} className="space-y-4">
              {[['Old Password',oldPw,setOldPw],['New Password',newPw,setNewPw],['Confirm Password',confirmPw,setConfirmPw]].map(([label,val,setter]) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input type="password" placeholder="••••••••" value={val} onChange={e => setter(e.target.value)} className={inp} />
                </div>
              ))}
              <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-2">Update Password</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
