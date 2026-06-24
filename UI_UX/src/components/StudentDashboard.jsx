import React, { useState, useEffect, useRef } from 'react';

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
  const [isMoreOptionsOpen,   setIsMoreOptionsOpen]   = useState(false);
  const [isProfileOpen,       setIsProfileOpen]       = useState(false);
  const [isNotifOpen,         setIsNotifOpen]         = useState(false);
  const [activeTab,           setActiveTab]           = useState('Dashboard');

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPwModal,       setShowPwModal]       = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Leave request for Weekend Outing approved.',  time: '2 hours ago', read: false },
    { id: 2, text: 'Mess fee invoice for July 2026 generated.',   time: '1 day ago',   read: false },
    { id: 3, text: 'Complaint regarding AC in Room 101 resolved.', time: '2 days ago', read: true  },
  ]);
  const [leaves, setLeaves] = useState([
    { id: 1, type: 'Weekend Outing', startDate: '2026-06-27', endDate: '2026-06-28', reason: 'Visiting parents',  status: 'Approved' },
    { id: 2, type: 'Medical Leave',  startDate: '2026-06-15', endDate: '2026-06-18', reason: 'Dental checkup',    status: 'Approved' },
  ]);
  const [complaints, setComplaints] = useState([
    { id: 1, type: 'Maintenance', description: 'AC unit making loud noise.', date: '2026-06-23', status: 'Pending' },
  ]);
  const [visitors, setVisitors] = useState([
    { id: 1, name: 'Rajesh Balasubramaniam', relation: 'Father', date: '2026-06-20', timeIn: '10:00 AM', timeOut: '04:30 PM', status: 'Checked Out' },
    { id: 2, name: 'Uma Balasubramaniam',    relation: 'Mother', date: '2026-06-12', timeIn: '11:15 AM', timeOut: '02:00 PM', status: 'Checked Out' },
  ]);

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

  // ── derived ───────────────────────────────────────────────────────────────
  const unread         = notifications.filter(n => !n.read).length;
  const pendingLeaves  = leaves.filter(l => l.status === 'Pending').length;
  const activeComp     = complaints.filter(c => c.status === 'Pending').length;

  // live date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dayStr  = today.toLocaleDateString('en-US', { weekday: 'long' });

  // ── handlers ──────────────────────────────────────────────────────────────
  const submitLeave = e => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) return alert('Fill all fields.');
    setLeaves([{ id: leaves.length + 1, type: leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason, status: 'Pending' }, ...leaves]);
    setLeaveStart(''); setLeaveEnd(''); setLeaveReason('');
    alert('Leave submitted!');
  };
  const submitComplaint = e => {
    e.preventDefault();
    if (!complaintDesc) return alert('Describe the issue.');
    setComplaints([{ id: complaints.length + 1, type: complaintType, description: complaintDesc, date: new Date().toISOString().split('T')[0], status: 'Pending' }, ...complaints]);
    setComplaintDesc('');
    alert('Complaint filed!');
  };
  const submitVisitor = e => {
    e.preventDefault();
    if (!visitorName || !visitorRel || !visitorDate) return alert('Fill all fields.');
    setVisitors([{ id: visitors.length + 1, name: visitorName, relation: visitorRel, date: visitorDate, timeIn: 'Scheduled', timeOut: '--', status: 'Approved' }, ...visitors]);
    setVisitorName(''); setVisitorRel(''); setVisitorDate('');
    alert('Visitor registered!');
  };
  const submitPw = e => {
    e.preventDefault();
    if (!oldPw || !newPw || !confirmPw) return alert('Fill all fields.');
    if (newPw !== confirmPw) return alert('Passwords do not match.');
    alert('Password updated!');
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
  const moreNav = [
    { id: 'Fees & Dues',  icon: 'fa-credit-card', label: 'Fees & Dues'  },
    { id: 'QR Gate Pass', icon: 'fa-qrcode',      label: 'QR Gate Pass' },
  ];

  // ── shared input style ────────────────────────────────────────────────────
  const inp = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition';

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full min-h-screen bg-[#F5F7FB] font-sans antialiased text-gray-800 overflow-x-hidden">

      {/* Mobile overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setIsMobileDrawerOpen(false)} />
      )}

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-white border-r border-gray-100 transition-transform duration-300
        lg:static lg:translate-x-0 lg:h-screen
        ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* User profile card */}
        <div className="flex flex-col items-center py-7 px-4 border-b border-gray-100">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xl shadow mb-3">
            {initials}
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate text-center">{name}</p>
          <span className="mt-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase tracking-wider rounded-full">
            {role}
          </span>
          <p className="mt-1.5 text-xs text-gray-400 font-normal">Room {roomNumber}, {blockName}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col px-3 py-4 space-y-0.5 overflow-y-auto">
          {mainNav.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-150
                  ${active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
              >
                <i className={`fas ${item.icon} w-4 text-center text-sm ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* More Options section */}
          <div className="pt-4">
            <button
              onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-left"
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">More Options</span>
              <i className={`fas fa-chevron-down text-[9px] text-gray-400 transition-transform duration-200 ${isMoreOptionsOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-300 space-y-0.5 mt-0.5 ${isMoreOptionsOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
              {moreNav.map(item => {
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-150
                      ${active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                  >
                    <i className={`fas ${item.icon} w-4 text-center text-sm ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sign Out */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-xl w-full text-left text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <i className="fas fa-sign-out-alt w-4 text-center text-sm" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN WRAPPER ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">

        {/* ── TOP NAVBAR ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between">
          {/* Left: hamburger + logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors lg:hidden"
            >
              <i className="fas fa-bars text-base" />
            </button>
            {/* Desktop hamburger (does nothing visible, just matches screenshot) */}
            <button className="hidden lg:flex p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
              <i className="fas fa-bars text-base" />
            </button>
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-home text-indigo-600 text-sm" />
              </div>
              <span className="font-bold text-gray-900 text-base tracking-tight">
                Hostel<span className="text-indigo-600">Hub</span>
              </span>
            </div>
          </div>

          {/* Right: bell + profile */}
          <div className="flex items-center space-x-3">

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
                    <span className="text-sm font-semibold text-gray-800">Notifications</span>
                    {unread > 0 && (
                      <button
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                        className="text-xs text-indigo-600 font-medium hover:underline"
                      >Mark all read</button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2.5 rounded-xl text-xs ${n.read ? '' : 'bg-indigo-50/50'}`}>
                        <p className="text-gray-700 font-normal">{n.text}</p>
                        <p className="text-gray-400 mt-0.5">{n.time}</p>
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
                className="flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{name}</p>
                  <p className="text-[10px] text-gray-400 font-normal">{role}</p>
                </div>
                <i className={`fas fa-chevron-down text-[10px] text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2 origin-top-right animate-scaleIn">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{email}</p>
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
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">

          {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fadeIn">

              {/* Welcome row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-[28px] font-bold text-gray-900 leading-tight">
                    Welcome back, {name}! 👋
                  </h1>
                  <p className="text-sm text-gray-400 font-normal mt-1">Here's what's happening in your hostel today.</p>
                </div>
                {/* Date card */}
                <div className="flex items-center space-x-2.5 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-left shrink-0">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-indigo-500 text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{dateStr}</p>
                    <p className="text-[10px] text-gray-400 font-normal">{dayStr}</p>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: 'fa-home',    iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',
                    label: 'My Room',   value: roomNumber,       sub: `${blockName}, 1st Floor`,
                    tab: 'My Room',
                  },
                  {
                    icon: 'fa-calendar-check', iconBg: 'bg-orange-50', iconColor: 'text-orange-500',
                    label: 'Pending Leaves',   value: pendingLeaves || 2, sub: 'Awaiting approvals',
                    tab: 'Apply Leave',
                  },
                  {
                    icon: 'fa-exclamation-triangle', iconBg: 'bg-red-50', iconColor: 'text-red-500',
                    label: 'Active Complaints',       value: activeComp || 1, sub: 'Under resolution',
                    tab: 'My Room',
                  },
                  {
                    icon: 'fa-credit-card', iconBg: 'bg-green-50', iconColor: 'text-green-500',
                    label: 'Fees Status',     value: 'No Dues',        sub: 'All payments cleared',
                    tab: 'Fees & Dues',
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(c.tab)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                        <i className={`fas ${c.icon} ${c.iconColor} text-base`} />
                      </div>
                      <i className="fas fa-chevron-right text-gray-300 text-xs mt-1" />
                    </div>
                    <p className="text-xs font-normal text-gray-400 mb-1">{c.label}</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">{c.value}</p>
                    <p className="text-xs text-gray-400 font-normal">{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bottom grid: Room Allocation + Announcements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Current Room Allocation */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <i className="fas fa-building text-indigo-500 text-sm" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Current Room Allocation</h3>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <i className="fas fa-ellipsis-h text-sm" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { label: 'ROOM NUMBER',    value: '101',        icon: 'fa-bed',       iconColor: 'text-blue-500'   },
                      { label: 'BLOCK / WING',   value: 'Block A',    icon: 'fa-building',  iconColor: 'text-indigo-500' },
                      { label: 'FLOOR LEVEL',    value: '1st Floor',  icon: 'fa-layer-group',iconColor: 'text-orange-500'},
                      { label: 'ROOMMATES COUNT',value: '1 Roommate', icon: 'fa-user-friends',iconColor: 'text-green-500'},
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-50/70 rounded-xl p-4 flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                          <p className="text-base font-bold text-gray-900">{item.value}</p>
                        </div>
                        <i className={`fas ${item.icon} ${item.iconColor} text-xl opacity-70`} />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('My Room')}
                    className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>View Allocation Details</span>
                    <i className="fas fa-arrow-right text-xs" />
                  </button>
                </div>

                {/* Recent Announcements */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                        <i className="fas fa-bullhorn text-orange-500 text-sm" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Recent Announcements</h3>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                      <i className="fas fa-ellipsis-h text-sm" />
                    </button>
                  </div>

                  {/* Empty state matching the screenshot */}
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <div className="relative w-24 h-24 mb-4">
                      {/* Outer circle */}
                      <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center">
                        {/* Inner circle */}
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                          <i className="fas fa-bullhorn text-indigo-500 text-2xl" />
                        </div>
                      </div>
                      {/* Decorative dots */}
                      <span className="absolute top-1 right-0 w-2 h-2 bg-indigo-200 rounded-full" />
                      <span className="absolute bottom-2 left-0 w-1.5 h-1.5 bg-indigo-100 rounded-full" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">No active announcements</p>
                    <p className="text-xs text-indigo-500 font-normal">Check back later for important updates.</p>
                  </div>

                  <button
                    onClick={() => navigate('Announcements')}
                    className="mt-4 w-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>View All Announcements</span>
                    <i className="fas fa-arrow-right text-xs" />
                  </button>
                </div>

              </div>

              {/* Footer */}
              <p className="text-center text-xs text-gray-400 font-normal pt-2">
                © 2025 HostelHub System. All rights reserved.
              </p>
            </div>
          )}

          {/* ══ MY ROOM ════════════════════════════════════════════════════ */}
          {activeTab === 'My Room' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900">Room Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Roommates</h3>
                    <div className="flex items-center space-x-3 py-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold text-sm">RS</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Rohit Sharma</p>
                        <p className="text-xs text-gray-400">Computer Science · 2nd Year</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Room Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Wi-Fi', 'Air Conditioning', 'Study Desk', 'Personal Locker', 'Attached Bathroom', 'Daily Housekeeping'].map((a, i) => (
                        <div key={i} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl">
                          <i className="fas fa-check-circle text-green-500 text-xs" />
                          <span className="text-xs text-gray-700 font-medium">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">File Complaint</h3>
                  <form onSubmit={submitComplaint} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Category</label>
                      <select value={complaintType} onChange={e => setComplaintType(e.target.value)} className={inp}>
                        {['Maintenance','Electrical','Plumbing','Internet','Other'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Description</label>
                      <textarea rows={3} placeholder="Describe the issue…" value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} className={`${inp} resize-none`} />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                      Submit Complaint
                    </button>
                  </form>
                  {complaints.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recent</p>
                      {complaints.map(c => (
                        <div key={c.id} className="p-3 bg-gray-50 rounded-xl text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="font-semibold text-gray-800">{c.type}</span>
                            <span className={`px-2 py-0.5 rounded-full font-medium text-[9px] ${c.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{c.status}</span>
                          </div>
                          <p className="text-gray-500">{c.description}</p>
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
              <h2 className="text-xl font-bold text-gray-900">Apply for Leave</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Leave Request</h3>
                  <form onSubmit={submitLeave} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Leave Type</label>
                      <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className={inp}>
                        {['Weekend Outing','Medical Leave','Emergency Vacation','Holiday Outing'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Start</label>
                        <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className={inp} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">End</label>
                        <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Reason</label>
                      <textarea rows={3} placeholder="Reason…" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className={`${inp} resize-none`} />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                      Submit Request
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Leave History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 text-left">Type</th><th className="pb-3 text-left">Duration</th>
                        <th className="pb-3 text-left">Reason</th><th className="pb-3 text-left">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {leaves.map(l => (
                          <tr key={l.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-3.5 font-semibold text-gray-800">{l.type}</td>
                            <td className="py-3.5 text-gray-500">{l.startDate} → {l.endDate}</td>
                            <td className="py-3.5 text-gray-400 max-w-[120px] truncate">{l.reason}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full font-medium text-[9px] uppercase ${l.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>{l.status}</span>
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
                <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                    <i className="fas fa-bullhorn text-indigo-500 text-2xl" />
                  </div>
                </div>
                <p className="text-base font-semibold text-gray-800 mb-1">No active announcements</p>
                <p className="text-sm text-indigo-500 font-normal">Check back later for important updates.</p>
              </div>
            </div>
          )}

          {/* ══ MY VISITOR HISTORY ═════════════════════════════════════════ */}
          {activeTab === 'My Visitor History' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900">Visitor History</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Pre-Register Visitor</h3>
                  <form onSubmit={submitVisitor} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Name</label>
                      <input type="text" placeholder="Visitor's name" value={visitorName} onChange={e => setVisitorName(e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Relationship</label>
                      <input type="text" placeholder="Father / Mother / Friend…" value={visitorRel} onChange={e => setVisitorRel(e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Visit Date</label>
                      <input type="date" value={visitorDate} onChange={e => setVisitorDate(e.target.value)} className={inp} />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                      Register Visitor
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Visitor Logs</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase tracking-wider">
                        <th className="pb-3 text-left">Name</th><th className="pb-3 text-left">Relation</th>
                        <th className="pb-3 text-left">Date</th><th className="pb-3 text-left">Time</th><th className="pb-3 text-left">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {visitors.map(v => (
                          <tr key={v.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-3.5 font-semibold text-gray-800">{v.name}</td>
                            <td className="py-3.5 text-gray-500">{v.relation}</td>
                            <td className="py-3.5 text-gray-500">{v.date}</td>
                            <td className="py-3.5 text-gray-400">{v.timeIn} → {v.timeOut}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full font-medium text-[9px] uppercase ${v.status === 'Checked Out' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>{v.status}</span>
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

          {/* ══ FEES & DUES ════════════════════════════════════════════════ */}
          {activeTab === 'Fees & Dues' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900">Fees & Billing</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium text-xs w-fit">No Pending Dues</span>
                  <p className="text-3xl font-bold text-gray-900 mt-4 mb-1">₹0.00</p>
                  <p className="text-xs text-gray-400 mb-6">Current Outstanding Balance</p>
                  <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Next mess bill:</span><span className="font-medium text-gray-800">July 05, 2026</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Hostel Rent:</span><span className="font-medium text-green-600">Paid</span></div>
                  </div>
                  <button className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-6">
                    View Billing Policy
                  </button>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Payments</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'TXN98124213', title: 'Spring 2026 Room Rent',   date: 'June 01, 2026', amt: '₹45,000.00' },
                      { id: 'TXN97241243', title: 'June 2026 Mess Invoice',  date: 'June 01, 2026', amt: '₹6,500.00'  },
                      { id: 'TXN96123498', title: 'May 2026 Mess Invoice',   date: 'May 02, 2026',  amt: '₹6,800.00'  },
                    ].map(p => (
                      <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50/60 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center text-green-500">
                            <i className="fas fa-receipt text-sm" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{p.title}</p>
                            <p className="text-[10px] text-gray-400">{p.id} · {p.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{p.amt}</p>
                          <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Paid</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ QR GATE PASS ═══════════════════════════════════════════════ */}
          {activeTab === 'QR Gate Pass' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-gray-900">QR Gate Pass</h2>
              <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium text-xs ring-2 ring-green-500/10">Active Pass</span>
                <p className="text-base font-semibold text-gray-900">Hostel Entry / Exit Gatepass</p>
                <p className="text-xs text-gray-400">Scan at the gate to register your entry or exit.</p>
                <div className="relative w-44 h-44 mx-auto bg-gray-50 rounded-xl border border-gray-100 p-3 overflow-hidden">
                  <div className="absolute left-0 right-0 h-0.5 bg-indigo-400/60 animate-bounce" style={{animationDuration:'3s'}} />
                  <svg className="w-full h-full text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="24" height="24"/><rect x="3" y="3" width="18" height="18" fill="white"/><rect x="6" y="6" width="12" height="12"/>
                    <rect x="76" y="0" width="24" height="24"/><rect x="79" y="3" width="18" height="18" fill="white"/><rect x="82" y="6" width="12" height="12"/>
                    <rect x="0" y="76" width="24" height="24"/><rect x="3" y="79" width="18" height="18" fill="white"/><rect x="6" y="82" width="12" height="12"/>
                    <rect x="32" y="4" width="8" height="8"/><rect x="48" y="0" width="12" height="4"/><rect x="64" y="8" width="4" height="8"/>
                    <rect x="36" y="16" width="16" height="4"/><rect x="60" y="20" width="8" height="8"/>
                    <rect x="0" y="32" width="8" height="8"/><rect x="16" y="36" width="16" height="4"/>
                    <rect x="36" y="28" width="12" height="12"/><rect x="56" y="32" width="20" height="8"/>
                    <rect x="12" y="48" width="12" height="12"/><rect x="32" y="48" width="8" height="20"/>
                    <rect x="48" y="44" width="16" height="8"/><rect x="68" y="48" width="8" height="16"/>
                    <rect x="48" y="64" width="12" height="12"/><rect x="68" y="72" width="16" height="4"/>
                    <rect x="36" y="80" width="8" height="16"/><rect x="60" y="84" width="24" height="8"/>
                  </svg>
                </div>
                <div className="text-xs text-left bg-gray-50 rounded-xl p-3 space-y-1.5 border border-gray-100">
                  <div className="flex justify-between"><span className="text-gray-400">Authorized:</span><span className="font-medium text-gray-800">{name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Room:</span><span className="font-medium text-gray-800">Room 101</span></div>
                </div>
                <button onClick={() => alert('QR refreshed.')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  Regenerate Pass
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Floating chat button (matches screenshot) */}
      <button className="fixed bottom-6 right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-30 hover:scale-105">
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
              <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">{initials}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold uppercase rounded-full">{role}</span>
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
            <button onClick={() => setShowProfileModal(false)} className="mt-7 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Close</button>
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
                  <button onClick={() => s.set(!s.val)} className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${s.val ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${s.val ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSettingsModal(false)} className="mt-7 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Save Settings</button>
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
              {[['Old Password',confirmPw,setOldPw],['New Password',newPw,setNewPw],['Confirm Password',confirmPw,setConfirmPw]].map(([label,,setter],i) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input type="password" placeholder="••••••••" value={[oldPw,newPw,confirmPw][i]} onChange={e=>setter(e.target.value)} className={inp} />
                </div>
              ))}
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-2">Update Password</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
