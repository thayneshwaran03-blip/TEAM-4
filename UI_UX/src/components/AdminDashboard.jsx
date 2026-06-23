import React from 'react';

export default function AdminDashboard({ user, onLogout }) {
  const name = user ? user.fullName : 'System Admin';
  const role = user ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Administrator';
  const initials = user ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SA';

  const navItems = [
    { icon: 'fa-th-large', label: 'Dashboard', active: true },
    { icon: 'fa-user-graduate', label: 'Manage Students' },
    { icon: 'fa-door-open', label: 'Manage Rooms' },
    { icon: 'fa-user-tie', label: 'Manage Wardens' },
    { icon: 'fa-calendar-check', label: 'Leave Requests' },
    { icon: 'fa-exclamation-triangle', label: 'Complaints' },
    { icon: 'fa-credit-card', label: 'Fee Records' },
    { icon: 'fa-address-book', label: 'Visitor Logs' },
    { icon: 'fa-chart-bar', label: 'Reports' },
    { icon: 'fa-history', label: 'Activity Audit' }
  ];

  const stats = [
    { icon: 'fa-users', label: 'Total Students', value: '245', colorBg: 'bg-blue-50 text-blue-600' },
    { icon: 'fa-bed', label: 'Beds Allotted', value: '3', sub: '9 vacancies remaining', colorBg: 'bg-emerald-50 text-emerald-600' },
    { icon: 'fa-users', label: 'Active Visitors', value: '0', sub: 'Currently inside', colorBg: 'bg-amber-50 text-amber-600' },
    { icon: 'fa-calendar-check', label: 'Pending Leaves', value: '0', colorBg: 'bg-rose-50 text-rose-600' },
    { icon: 'fa-exclamation-triangle', label: 'Pending Complaints', value: '1', colorBg: 'bg-purple-50 text-purple-600' },
    { icon: 'fa-tools', label: 'Maintenance Actions', value: '1', colorBg: 'bg-teal-50 text-teal-600' }
  ];

  const activities = [
    { title: 'WiFi not working in Block A', time: '2 hours ago', status: 'pending' },
    { title: 'Water heater malfunction', time: '1 day ago', status: 'in-progress' },
    { title: 'Noise disturbance after 11 PM', time: '2 days ago', status: 'pending' },
    { title: 'Broken window in common room', time: '3 days ago', status: 'resolved' }
  ];

  const statusColors = {
    pending: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700'
  };

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
        
        {/* Header welcome */}
        <header className="flex justify-between items-center pb-6 border-b border-gray-200 mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 font-outfit">
            Administrative Command Analytics Center
          </h1>
          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-gray-200/80 px-3 py-1.5 rounded-full font-bold text-gray-600 tracking-wide">
              {initials}
            </span>
            <span className="font-semibold text-gray-600">{name}</span>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8 w-full">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between items-start text-left cursor-pointer"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.colorBg} flex items-center justify-center text-base mb-4 shadow-sm`}>
                <i className={`fas ${stat.icon}`} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-gray-900 mb-0.5">{stat.value}</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                {stat.sub && (
                  <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{stat.sub}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 w-full">
          
          {/* Circular Room Occupancy Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
              Room Occupancy
            </h3>
            <div className="flex items-center justify-center space-x-12 h-52">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#1a237e"
                    strokeWidth="12"
                    strokeDasharray={`${75 * 2.51} ${25 * 2.51}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-2xl font-black text-gray-800 block">75%</span>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Occupied</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <span className="text-xs font-semibold flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-primary" />
                  <span>Occupied Beds</span>
                </span>
                <span className="text-xs font-semibold flex items-center space-x-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200" />
                  <span>Vacant Beds</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bar Fee Collection Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left flex flex-col justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
              Fee Collection
            </h3>
            <div className="flex items-end justify-between h-44 px-4">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center space-y-2 group">
                  <div
                    style={{ height: `${40 + idx * 20}px` }}
                    className="w-8/12 bg-primary hover:bg-primary-light rounded-t-md transition-all duration-200 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{month}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs font-bold text-gray-600 tracking-wide mt-6 border-t border-gray-50 pt-4">
              Total: ₹45,00,000
            </p>
          </div>

        </div>

        {/* Recent Activity Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-left">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
              Recent Activities
            </h3>
            <span className="text-xs font-semibold text-gray-400">8 complaints</span>
          </div>

          <div className="divide-y divide-gray-100">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                <div className="truncate text-left pr-4">
                  <p className="text-xs font-bold text-gray-900 truncate mb-0.5">{activity.title}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{activity.time}</p>
                </div>
                <span className={`text-[10px] font-bold py-1 px-3 rounded-full capitalize select-none ${
                  statusColors[activity.status] || 'bg-gray-100 text-gray-700'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>

    </div>
  );
}
