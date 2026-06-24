import React from 'react';

export default function StudentDashboard({ user, onLogout }) {
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

  const stats = [
    { icon: 'fa-door-open', label: 'My Room', value: 'Room 101', colorBg: 'bg-blue-50 text-blue-600', color: 'blue' },
    { icon: 'fa-calendar-check', label: 'Pending Leaves', value: '2', sub: 'Awaiting approvals', colorBg: 'bg-amber-50 text-amber-600', color: 'amber' },
    { icon: 'fa-exclamation-triangle', label: 'Active Complaints', value: '1', sub: 'Under resolution', colorBg: 'bg-rose-50 text-rose-600', color: 'rose' },
    { icon: 'fa-credit-card', label: 'Unpaid Fees', value: 'No Dues', sub: 'Cleared', colorBg: 'bg-emerald-50 text-emerald-600', color: 'emerald' }
  ];

  return (
    <div className="flex w-full min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col justify-between sticky top-0 h-screen overflow-y-auto flex-shrink-0 select-none no-scrollbar">
        <div className="space-y-6">
          {/* Logo brand */}
          <div className="flex items-center space-x-3 pb-6 border-b border-gray-100">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-outfit font-extrabold text-xl shadow-md">
              H
            </div>
            <span className="text-lg font-bold font-outfit text-gray-900 tracking-tight">
              Hostel<span className="text-accent text-amber-500 font-extrabold">Hub</span>
            </span>
          </div>

          {/* User badge */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-3 border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">{role}</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col space-y-1">
            {navItems.map((item, idx) => (
              <a
                key={idx}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  item.active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center ${item.active ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Sign Out Section */}
        <div className="pt-6 border-t border-gray-100">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors duration-200 outline-none"
          >
            <i className="fas fa-sign-out-alt w-5 text-center" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT PANE */}
      <main className="flex-1 p-8 overflow-y-auto h-screen custom-scrollbar flex flex-col justify-start">
        
        {/* Header welcome banner */}
        <header className="flex justify-between items-center pb-6 border-b border-gray-200 mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-outfit flex items-center">
            Welcome Back, {name}! 🎉
          </h1>
          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-gray-200/80 px-3 py-1.5 rounded-full font-bold text-gray-600 tracking-wide">
              {initials}
            </span>
            <span className="font-semibold text-gray-600">{name}</span>
            <span className="text-primary font-bold tracking-wide uppercase">{role}</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-start text-left cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.colorBg} flex items-center justify-center text-lg mb-4 shadow-sm`}>
                <i className={`fas ${stat.icon}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-xs font-semibold text-gray-500">{stat.label}</p>
                {stat.sub && (
                  <p className="text-[10px] text-gray-400 font-medium mt-1">{stat.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          
          {/* Room Allocation Info Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between text-left">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                Current Room Allocation
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Room Number</p>
                  <p className="text-base font-bold text-gray-900">101</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Block / Wing</p>
                  <p className="text-base font-bold text-gray-900">Block A</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Floor Level</p>
                  <p className="text-base font-bold text-gray-900">1st Floor</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Roommates Count</p>
                  <p className="text-base font-bold text-gray-900">1 roommate</p>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-primary hover:bg-primary-light text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all duration-200">
              View Allocation Details
            </button>
          </div>

          {/* Announcements Notice Board Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center space-x-2">
                <i className="fas fa-bullhorn text-accent" />
                <span>Notice Board Announcements</span>
              </h3>
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                  <i className="fas fa-folder-open text-sm" />
                </div>
                <p className="text-xs text-gray-400 font-medium">No active announcements on the notice board.</p>
              </div>
            </div>

            <button className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold py-3 px-4 rounded-xl transition-all duration-200 mt-6">
              View Announcement Archive
            </button>
          </div>

        </div>

      </main>

    </div>
  );
}
