import React from 'react';

export default function WardenDashboard({ user, onLogout }) {
  const name = user && user.fullName ? user.fullName : 'Warden User';

  const stats = [
    { value: '250', label: 'Total Students' },
    { value: '10', label: 'Pending Leaves' },
    { value: '120', label: 'Occupied Rooms' },
    { value: '5', label: 'Visitors Today' }
  ];

  const leaveRequests = [
    { student: 'Priya', from: '20-06-2026', to: '22-06-2026', reason: 'Medical', status: 'Pending' },
    { student: 'Rahul', from: '18-06-2026', to: '19-06-2026', reason: 'Personal', status: 'Approved' }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-[#121c61] to-[#080e35] font-sans text-white p-8 select-none flex flex-col justify-start overflow-y-auto no-scrollbar">
      
      {/* Portal Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/10 pb-6 mb-8 text-left">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-outfit text-white flex items-center">
            🏠 HostelHub Warden Portal
          </h1>
          <p className="text-sm font-medium text-blue-300 mt-1">
            Welcome back, {name}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="mt-4 sm:mt-0 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 active:scale-95 transition-all outline-none"
        >
          <i className="fas fa-sign-out-alt mr-2" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center items-center"
          >
            <h2 className="text-4xl font-extrabold tracking-tight font-outfit text-white mb-2">{stat.value}</h2>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Leave Requests Glass Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8 text-left">
        <h2 className="text-lg font-bold text-white tracking-wide mb-4 flex items-center">
          <i className="fas fa-calendar-check text-blue-400 mr-2" />
          <span>Recent Leave Requests</span>
        </h2>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3.5 px-4 font-semibold text-blue-300 tracking-wide text-xs uppercase">Student</th>
                <th className="py-3.5 px-4 font-semibold text-blue-300 tracking-wide text-xs uppercase">From</th>
                <th className="py-3.5 px-4 font-semibold text-blue-300 tracking-wide text-xs uppercase">To</th>
                <th className="py-3.5 px-4 font-semibold text-blue-300 tracking-wide text-xs uppercase">Reason</th>
                <th className="py-3.5 px-4 font-semibold text-blue-300 tracking-wide text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leaveRequests.map((req, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white">{req.student}</td>
                  <td className="py-3.5 px-4 text-blue-200">{req.from}</td>
                  <td className="py-3.5 px-4 text-blue-200">{req.to}</td>
                  <td className="py-3.5 px-4 text-blue-200">{req.reason}</td>
                  <td className={`py-3.5 px-4 font-bold ${
                    req.status === 'Pending' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {req.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left">
        <h2 className="text-lg font-bold text-white tracking-wide mb-4">Quick Actions</h2>
        
        <div className="flex flex-wrap gap-4">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all outline-none">
            <i className="fas fa-file-signature mr-2" />
            View Leave Requests
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all outline-none">
            <i className="fas fa-user-graduate mr-2" />
            View Students
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all outline-none">
            <i className="fas fa-door-open mr-2" />
            Room Occupancy
          </button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all outline-none">
            <i className="fas fa-address-book mr-2" />
            Visitor Logs
          </button>
        </div>
      </div>

    </div>
  );
}
