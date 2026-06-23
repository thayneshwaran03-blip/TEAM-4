import React from 'react';

export default function Branding() {
  const features = [
    { title: 'Student Room Allocation', icon: 'fa-bed' },
    { title: 'Visitor Entry Logs',       icon: 'fa-address-book' },
    { title: 'Leave Requests Flow',      icon: 'fa-calendar-check' },
    { title: 'Occupancy Reports',        icon: 'fa-chart-bar' },
  ];

  return (
    <div className="hidden lg:flex w-1/2 min-h-screen bg-primary-gradient flex-col justify-center items-center px-14 py-14 text-white relative overflow-hidden select-none">
      
      {/* Animated floating glow */}
      <div className="absolute -top-1/2 -right-1/3 w-[80%] h-[150%] bg-[radial-gradient(circle,_rgba(255,255,255,0.07)_0%,_transparent_70%)] animate-float-glow pointer-events-none" />

      {/* Content wrapper */}
      <div className="z-10 max-w-lg w-full flex flex-col items-center">

        {/* Brand icon */}
        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 text-white font-outfit font-extrabold text-5xl shadow-2xl mb-8 hover:rotate-3 transition-transform duration-300">
          H<span className="text-amber-400">H</span>
        </div>

        {/* Brand title */}
        <h1 className="text-6xl font-extrabold tracking-tight font-outfit text-white mb-5 drop-shadow-lg text-center">
          Hostel<span className="text-amber-400">Hub</span>
        </h1>

        {/* Subtitle */}
        <h2 className="text-xl font-semibold text-blue-200 tracking-wide text-center mb-4 max-w-md leading-relaxed">
          Centralize and digitize hostel management.
        </h2>

        {/* Description */}
        <p className="text-base leading-relaxed text-blue-100/75 text-center mb-10 max-w-md font-light">
          Manage room allocations, visitor entries, leave requests, and occupancy reports from one secure platform.
        </p>

        {/* Divider */}
        <div className="w-16 h-1.5 bg-white/25 rounded-full mb-10" />

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-7 w-full max-w-sm">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center space-x-3 text-left group">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/10 shadow-sm flex-shrink-0 group-hover:bg-white/20 transition-colors duration-200">
                <i className="fas fa-check text-sm" />
              </div>
              <span className="text-sm font-semibold tracking-wide text-blue-100 leading-tight">
                {feature.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative blobs */}
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-32 right-8 w-20 h-20 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}
