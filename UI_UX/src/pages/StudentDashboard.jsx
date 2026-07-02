import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function StudentDashboard({ user, onLogout }) {
  const name       = user?.fullName  || 'Alex Mercer';
  const role       = user?.role      ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student';
  const initials   = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AM';
  const email      = user?.email      || 'alex.mercer@hostel.com';

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isMobileDrawerOpen,  setIsMobileDrawerOpen]  = useState(false);
  const [isSidebarExpanded,   setIsSidebarExpanded]   = useState(true);
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
  const [profile, setProfile] = useState(null);

  const roomNumber  = profile?.room?.roomNumber  || 'N/A';
  const blockName   = profile?.room?.blockName   || 'N/A';
  const floorNumber = profile?.room?.floorNumber || 'N/A';
  const roommatesCount = profile?.room?.occupiedBeds > 1
    ? `${profile.room.occupiedBeds - 1} Roommate${profile.room.occupiedBeds - 1 > 1 ? 's' : ''}`
    : 'No Roommates';

  // form fields
  const [leaveType,      setLeaveType]      = useState('Weekend Outing');
  const [leaveStart,     setLeaveStart]     = useState('');
  const [leaveEnd,       setLeaveEnd]       = useState('');
  const [leaveReason,    setLeaveReason]    = useState('');
  const [complaintType,  setComplaintType]  = useState('Maintenance');
  const [complaintDesc,  setComplaintDesc]  = useState('');
  const [visitorName,    setVisitorName]    = useState('');
  const [visitorRel,     setVisitorRel]     = useState('');
  const [visitorPhone,   setVisitorPhone]   = useState('');
  const [visitorDate,    setVisitorDate]    = useState('');
  const [oldPw,          setOldPw]          = useState('');
  const [newPw,          setNewPw]          = useState('');
  const [confirmPw,      setConfirmPw]      = useState('');
  const [emailNotifs,    setEmailNotifs]    = useState(true);
  const [smsNotifs,      setSmsNotifs]      = useState(false);
  const [autoQr,         setAutoQr]         = useState(true);

  // Edit profile states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentContact, setEditParentContact] = useState('');
  const [editGender, setEditGender] = useState('');

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

  // ── API helpers & data loading ─────────────────────────────────────────
  const apiFetch = async (path, opts = {}) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (opts.body) headers['Content-Type'] = 'application/json';
    Object.assign(headers, opts.headers || {});
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api${path}`, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        if (typeof window.__forceLogout === 'function') window.__forceLogout();
      }
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
        const s = profileResp.student;
        setProfile(s);
        setEditName(s.fullName || '');
        setEditPhone(s.phoneNumber || '');
        setEditDept(s.department || '');
        setEditYear(s.year || '');
        setEditParentName(s.parentName || '');
        setEditParentContact(s.parentContact || '');
        setEditGender(s.gender || '');
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

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── derived ───────────────────────────────────────────────────────────────
  const unread         = notifications.filter(n => n.status !== 'Read').length;
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
      if (!visitorName.trim() || !visitorRel.trim() || !visitorPhone.trim() || !visitorDate) { showToast('Please fill all visitor details.', 'error'); return; }
      const payload = { visitorName, relationship: visitorRel, phoneNumber: visitorPhone.trim(), visitDate: visitorDate, expectedArrivalTime: '00:00' };
      await apiFetch('/student/visitor', { method: 'POST', body: JSON.stringify(payload) });
      setVisitorName(''); setVisitorRel(''); setVisitorPhone(''); setVisitorDate('');
      await fetchAll();
      showToast('Visitor registered successfully!');
    } catch (err) {
      console.error(err);
      showToast('Unable to register visitor.', 'error');
    }
  };

  const handleProfileUpdate = async e => {
    e.preventDefault();
    if (!editName.trim()) { showToast('Full name is required.', 'error'); return; }
    try {
      await apiFetch('/student/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editName,
          phoneNumber: editPhone,
          department: editDept,
          year: editYear,
          parentName: editParentName,
          parentContact: editParentContact,
          gender: editGender
        })
      });
      showToast('Profile updated successfully!');
      await fetchAll();
      setShowProfileModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile.', 'error');
    }
  };

  const submitPw = async e => {
    e.preventDefault();
    if (!oldPw || !newPw || !confirmPw) { showToast('Please fill all password fields.', 'error'); return; }
    if (newPw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (newPw !== confirmPw) { showToast('New password and confirm password do not match.', 'error'); return; }
    try {
      await apiFetch('/student/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: oldPw, newPassword: newPw })
      });
      showToast('Password updated successfully!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
      setShowPwModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to update password. Please check your current password.', 'error');
    }
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
    <div className="flex w-full h-screen bg-[#F5F7FB] font-sans antialiased text-gray-800 overflow-hidden" style={{ fontFamily: "'Poppins', 'Outfit', sans-serif" }}>

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

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
           SIDEBAR — Premium SaaS design
           Architecture: flex sibling of main wrapper so CSS width-transition
           automatically pushes content — no JS marginLeft needed.
      ══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          flex-shrink-0 flex flex-col bg-white border-r border-gray-100/80 h-screen
          shadow-[1px_0_20px_rgba(0,0,0,0.04)]
          transition-[width] duration-[280ms] ease-in-out
          fixed lg:relative inset-y-0 left-0 z-50
          ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-[width,transform] duration-[280ms] ease-in-out
        `}
        style={{ width: isMobileDrawerOpen ? '256px' : (isSidebarExpanded ? '256px' : '72px') }}
      >
        {/* ── Header: Logo only (hamburger moved to topbar) ─────────────── */}
        <div
          className="flex items-center shrink-0 border-b border-gray-100"
          style={{ height: '64px', padding: '0 14px', justifyContent: isSidebarExpanded || isMobileDrawerOpen ? 'space-between' : 'center' }}
        >
          {/* Logo mark + wordmark */}
          <div className="flex items-center min-w-0 overflow-hidden">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <i className="fas fa-home text-primary" style={{ fontSize: '15px' }} />
            </div>
            <span
              className="font-bold text-gray-900 tracking-tight select-none whitespace-nowrap transition-all duration-[280ms] ease-in-out overflow-hidden"
              style={{
                fontSize: '15px',
                marginLeft: isSidebarExpanded || isMobileDrawerOpen ? '10px' : '0px',
                maxWidth: isSidebarExpanded || isMobileDrawerOpen ? '140px' : '0px',
                opacity: isSidebarExpanded || isMobileDrawerOpen ? 1 : 0,
              }}
            >
              Hostel<span className="text-primary">Hub</span>
            </span>
          </div>

          {/* Mobile close ✕ — only on mobile when drawer is open */}
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 shrink-0"
          >
            <i className="fas fa-times" style={{ fontSize: '14px' }} />
          </button>
        </div>

        {/* ── Profile section ──────────────────────────────────────────── */}
        {/* Expanded: full card. Collapsed: mini avatar centered. */}
        <div className="shrink-0">
          {/* EXPANDED profile card */}
          <div
            className="overflow-hidden transition-all duration-[280ms] ease-in-out"
            style={{
              maxHeight: isSidebarExpanded || isMobileDrawerOpen ? '150px' : '0px',
              opacity:   isSidebarExpanded || isMobileDrawerOpen ? 1 : 0,
              margin:    isSidebarExpanded || isMobileDrawerOpen ? '14px 12px 6px' : '0 12px',
            }}
          >
            <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 flex flex-col items-center text-center">
              <div
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-sm mb-2"
                style={{ fontSize: '15px' }}
              >
                {initials.charAt(0)}
              </div>
              <p className="font-semibold text-[#1F2937] leading-tight whitespace-nowrap" style={{ fontSize: '13px' }}>{name}</p>
              <span
                className="mt-1 px-2.5 py-0.5 bg-primary/10 text-primary font-bold uppercase rounded-full whitespace-nowrap"
                style={{ fontSize: '9px', letterSpacing: '0.08em' }}
              >Student</span>

            </div>
          </div>

          {/* COLLAPSED mini avatar */}
          <div
            className="flex justify-center transition-all duration-[280ms] ease-in-out overflow-hidden"
            style={{
              maxHeight: !isSidebarExpanded && !isMobileDrawerOpen ? '56px' : '0px',
              opacity:   !isSidebarExpanded && !isMobileDrawerOpen ? 1 : 0,
              paddingTop:    !isSidebarExpanded && !isMobileDrawerOpen ? '12px' : '0px',
              paddingBottom: !isSidebarExpanded && !isMobileDrawerOpen ? '4px' : '0px',
            }}
          >
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold"
              style={{ fontSize: '13px' }}
              title={name}
            >
              {initials.charAt(0)}
            </div>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1" style={{ padding: '6px 8px' }}>
          {mainNav.map(item => {
            const active   = activeTab === item.id;
            const expanded = isSidebarExpanded || isMobileDrawerOpen;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => navigate(item.id)}
                  className={`relative flex items-center w-full rounded-xl mb-0.5 transition-all duration-150
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  style={{
                    height: '42px',
                    padding: expanded ? '0 14px' : '0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
                  )}

                  {/* Icon — always rendered, perfectly centered when collapsed */}
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: '22px', height: '22px' }}
                  >
                    <i
                      className={`fas ${item.icon} transition-colors`}
                      style={{
                        fontSize: '15px',
                        color: active ? 'var(--tw-color-primary, #1a237e)' : undefined,
                      }}
                    />
                  </span>

                  {/* Label */}
                  <span
                    className="whitespace-nowrap overflow-hidden transition-all duration-[280ms] ease-in-out"
                    style={{
                      marginLeft: expanded ? '11px' : '0px',
                      maxWidth:   expanded ? '160px' : '0px',
                      opacity:    expanded ? 1 : 0,
                    }}
                  >
                    {item.label}
                  </span>
                </button>

                {/* CSS Tooltip (collapsed only) */}
                {!expanded && (
                  <div
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                      bg-gray-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      whitespace-nowrap z-[999] shadow-lg"
                    style={{ fontSize: '12px' }}
                  >
                    {item.label}
                    {/* Tooltip arrow */}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Sign Out — always pinned at bottom ───────────────────────── */}
        <div className="shrink-0 border-t border-gray-100 py-2" style={{ padding: '8px 8px' }}>
          <div className="relative group">
            <button
              onClick={onLogout}
              className="flex items-center w-full rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
              style={{
                height: '42px',
                padding: isSidebarExpanded || isMobileDrawerOpen ? '0 14px' : '0',
                justifyContent: isSidebarExpanded || isMobileDrawerOpen ? 'flex-start' : 'center',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              <span className="flex items-center justify-center shrink-0" style={{ width: '22px', height: '22px' }}>
                <i className="fas fa-sign-out-alt" style={{ fontSize: '15px' }} />
              </span>
              <span
                className="whitespace-nowrap overflow-hidden transition-all duration-[280ms] ease-in-out"
                style={{
                  marginLeft: isSidebarExpanded || isMobileDrawerOpen ? '11px' : '0px',
                  maxWidth:   isSidebarExpanded || isMobileDrawerOpen ? '160px' : '0px',
                  opacity:    isSidebarExpanded || isMobileDrawerOpen ? 1 : 0,
                }}
              >
                Sign Out
              </span>
            </button>

            {/* Sign Out tooltip (collapsed only) */}
            {!isSidebarExpanded && !isMobileDrawerOpen && (
              <div
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                  bg-gray-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5
                  opacity-0 group-hover:opacity-100 transition-opacity duration-150
                  whitespace-nowrap z-[999] shadow-lg"
              >
                Sign Out
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════════
           MAIN WRAPPER — Flex sibling; automatically resizes as sidebar changes
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

        {/* ── TOP NAVBAR ───────────────────────────────────────────────── */}
        <header
          className="shrink-0 bg-white border-b border-gray-100 flex items-center justify-between"
          style={{ height: '64px', zIndex: 30, padding: '0 20px' }}
        >
          {/* Left: hamburger (always visible) + mobile logo + page title */}
          <div className="flex items-center gap-3">
            {/* ══ HAMBURGER — always in topbar, always visible ══
                Desktop: toggles isSidebarExpanded (collapse/expand)
                Mobile:  toggles isMobileDrawerOpen (overlay drawer) */}
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsSidebarExpanded(prev => !prev);
                } else {
                  setIsMobileDrawerOpen(prev => !prev);
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 shrink-0"
              aria-label="Toggle sidebar"
            >
              <i className="fas fa-bars" style={{ fontSize: '16px' }} />
            </button>

            {/* Logo — mobile only (desktop logo lives in sidebar) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-home text-primary text-xs" />
              </div>
              <span className="font-bold text-gray-900 text-sm tracking-tight select-none">
                Hostel<span className="text-primary">Hub</span>
              </span>
            </div>

            {/* Page title — desktop */}
            <span className="hidden sm:block font-semibold text-[#1F2937]" style={{ fontSize: '15px' }}>{activeTab}</span>
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
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, status: 'Read' })))}
                        className="text-xs text-primary font-medium hover:underline"
                      >Mark all read</button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No notifications yet.</p>
                    ) : notifications.map(n => (
                      <div key={n._id || n.id} className={`p-2.5 rounded-xl text-xs ${n.status !== 'Read' ? 'bg-primary/5' : ''}`}>
                        <p className="font-semibold text-[#374151]">{n.title}</p>
                        <p className="text-[#374151] font-normal">{n.message}</p>
                        <p className="text-[#6B7280] mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</p>
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
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
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
                    label: 'My Room',
                    value: roomNumber !== 'N/A' ? `Room ${roomNumber}` : 'Not Assigned',
                    sub: roomNumber !== 'N/A' ? `${blockName} · Floor ${floorNumber}` : 'No room assigned',
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
                        { label: 'ROOM NUMBER',    value: roomNumber !== 'N/A' ? `Rm ${roomNumber}` : 'Not Assigned', icon: 'fa-bed',        iconColor: 'text-blue-500'      },
                        { label: 'BLOCK / WING',   value: blockName  !== 'N/A' ? blockName            : '—',          icon: 'fa-building',   iconColor: 'text-primary-light' },
                        { label: 'FLOOR LEVEL',    value: floorNumber !== 'N/A' ? `Floor ${floorNumber}` : '—',       icon: 'fa-layer-group',iconColor: 'text-orange-500'    },
                        { label: 'ROOMMATES COUNT',value: roommatesCount,                                              icon: 'fa-user-friends',iconColor: 'text-green-500'    },
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
                          <div key={ann._id || ann.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-1.5">
                              <h4 className="font-semibold text-[#1F2937] leading-tight" style={{ fontSize: '13px' }}>{ann.title}</h4>
                              <span className="text-[#6B7280] whitespace-nowrap ml-3" style={{ fontSize: '11px', fontWeight: 500 }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="font-semibold text-primary mb-1.5" style={{ fontSize: '11px' }}>By {ann.postedBy?.fullName || 'Warden'}</p>
                            <p className="text-[#374151] font-normal leading-relaxed line-clamp-2" style={{ fontSize: '13px' }}>{ann.description}</p>
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
                    {!profile?.room ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <i className="fas fa-door-open text-3xl text-gray-200 mb-3" />
                        <p className="text-sm font-semibold text-gray-400">No room assigned yet</p>
                        <p className="text-xs text-gray-300 mt-1">Your roommates will appear here once a room is allocated by the warden.</p>
                      </div>
                    ) : (() => {
                      const roommates = (profile.room.assignedStudents || []).filter(
                        r => (r._id || r) !== profile._id && (r._id || r).toString() !== profile._id?.toString()
                      );
                      return roommates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <i className="fas fa-user-friends text-3xl text-gray-200 mb-3" />
                          <p className="text-sm font-semibold text-gray-400">No roommates yet</p>
                          <p className="text-xs text-gray-300 mt-1">You are the only occupant in this room.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {roommates.map((r, i) => {
                            const rName = r.fullName || 'Roommate';
                            const rInitials = rName.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase();
                            return (
                              <div key={r._id || i} className="flex items-center space-x-3 py-3 border-b border-gray-50 last:border-0">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">{rInitials}</div>
                                <div>
                                  <p className="font-semibold text-[#1F2937]" style={{ fontSize: '15px' }}>{rName}</p>
                                  <p className="text-[#6B7280] font-normal" style={{ fontSize: '13px' }}>{[r.department, r.year ? `${r.year} Year` : null].filter(Boolean).join(' · ') || 'Hostel Resident'}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
                        <div key={c._id || c.id} className="p-3 bg-gray-50 rounded-xl text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-[#1F2937]">{c.category}</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[9px] ${c.status === 'Pending' ? 'bg-amber-50 text-amber-600' : c.status === 'Resolved' ? 'bg-green-50 text-green-600' : c.status === 'In Progress' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{c.status}</span>
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
                          <tr key={l._id || l.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 font-semibold text-[#1F2937]">{l.leaveType}</td>
                            <td className="py-4 text-[#374151] font-normal">{new Date(l.fromDate).toLocaleDateString()} → {new Date(l.toDate).toLocaleDateString()}</td>
                            <td className="py-4 text-[#6B7280] font-normal max-w-[120px] truncate">{l.reason}</td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full font-semibold text-xs uppercase ${l.status === 'Approved' ? 'bg-green-50 text-green-600' : l.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>{l.status}</span>
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
                    <div key={ann._id || ann.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-[#1F2937] leading-tight" style={{ fontSize: '18px' }}>{ann.title}</h3>
                        <span className="text-[#6B7280] whitespace-nowrap ml-4" style={{ fontSize: '13px', fontWeight: 500 }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-semibold text-primary mb-3" style={{ fontSize: '13px' }}>Posted by {ann.postedBy?.fullName || 'Warden'}</p>
                      <p className="text-[#374151] font-normal leading-relaxed" style={{ fontSize: '15px' }}>{ann.description}</p>
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
                      <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Phone Number</label>
                      <input type="tel" placeholder="Visitor's phone number" value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} className={inp} />
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
                          <th className="pb-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {visitors.map(v => (
                          <tr key={v._id || v.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 font-semibold text-[#1F2937]">{v.visitorName}</td>
                            <td className="py-4 text-[#374151] font-normal">{v.relationship}</td>
                            <td className="py-4 text-[#374151] font-normal">{new Date(v.visitDate).toLocaleDateString()}</td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full font-semibold text-xs uppercase ${v.status === 'Approved' ? 'bg-green-50 text-green-600' : v.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>{v.status}</span>
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
            <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="col-span-2">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Full Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Email (Read Only)</label>
                  <input type="text" value={email} disabled className={`${inp} opacity-60 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Phone Number</label>
                  <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Department</label>
                  <input type="text" value={editDept} onChange={e => setEditDept(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Year</label>
                  <input type="text" value={editYear} onChange={e => setEditYear(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Parent Name</label>
                  <input type="text" value={editParentName} onChange={e => setEditParentName(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Parent Contact</label>
                  <input type="text" value={editParentContact} onChange={e => setEditParentContact(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Gender</label>
                  <select value={editGender} onChange={e => setEditGender(e.target.value)} className={inp}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-gray-400 uppercase tracking-wider text-[9px] block mb-1">Room (Read Only)</label>
                  <input type="text" value={`Room ${roomNumber} (${blockName})`} disabled className={`${inp} opacity-60 cursor-not-allowed`} />
                </div>
              </div>
              <div className="flex space-x-3 pt-3">
                <button type="button" onClick={() => setShowProfileModal(false)} className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="w-1/2 bg-primary hover:bg-primary-light text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow">Save Changes</button>
              </div>
            </form>
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
