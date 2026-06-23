import React, { useState } from 'react';
import Branding from './Branding.jsx';

export default function Signup({ onToggle, onSignupSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateField = (name, value) => {
    let err = '';
    const phoneRegex = /^[0-9]{10}$/;
    switch (name) {
      case 'fullName':
        if (!value.trim()) err = 'Full name is required';
        else if (value.length < 3) err = 'Name must be at least 3 characters';
        break;
      case 'email':
        if (!value.trim()) err = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) err = 'Invalid email address';
        break;
      case 'phoneNumber':
        if (!value.trim()) err = 'Phone number is required';
        else if (!phoneRegex.test(value)) err = 'Must be exactly 10 digits';
        break;
      case 'department':
        if (role === 'student' && !value) err = 'Department is required';
        break;
      case 'year':
        if (role === 'student' && !value) err = 'Year is required';
        break;
      case 'gender':
        if (role === 'student' && !value) err = 'Gender is required';
        break;
      case 'parentName':
        if (role === 'student' && !value.trim()) err = 'Guardian name is required';
        break;
      case 'parentContact':
        if (role === 'student' && !value.trim()) err = 'Guardian contact is required';
        else if (role === 'student' && !phoneRegex.test(value)) err = 'Must be exactly 10 digits';
        break;
      case 'password':
        if (!value) err = 'Password is required';
        else if (value.length < 6) err = 'Must be at least 6 characters';
        break;
      case 'confirmPassword':
        if (!value) err = 'Please confirm password';
        else if (value !== password) err = 'Passwords do not match';
        break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [name]: err }));
    return !err;
  };

  const handleBlur = (name, value) => validateField(name, value);

  const handleChangeRole = (newRole) => {
    setRole(newRole);
    setErrors(prev => {
      const copy = { ...prev };
      ['department', 'year', 'gender', 'parentName', 'parentContact'].forEach(k => delete copy[k]);
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const baseFields = [
      { name: 'fullName', value: fullName },
      { name: 'email', value: email },
      { name: 'phoneNumber', value: phoneNumber },
      { name: 'password', value: password },
      { name: 'confirmPassword', value: confirmPassword },
    ];
    const studentFields = role === 'student' ? [
      { name: 'department', value: department },
      { name: 'year', value: year },
      { name: 'gender', value: gender },
      { name: 'parentName', value: parentName },
      { name: 'parentContact', value: parentContact },
    ] : [];

    let allValid = true;
    [...baseFields, ...studentFields].forEach(f => { if (!validateField(f.name, f.value)) allValid = false; });
    if (!allValid) { showToastMsg('Please fix the errors before submitting', 'error'); return; }

    setLoading(true);
    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim(),
      role,
      password: password.trim(),
      department: role === 'student' ? department : 'N/A',
      year: role === 'student' ? year : 'N/A',
      gender: role === 'student' ? gender : 'N/A',
      parentName: role === 'student' ? parentName.trim() : 'N/A',
      parentContact: role === 'student' ? parentContact.trim() : 'N/A',
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg('Account created successfully! Redirecting...', 'success');
        setTimeout(() => onSignupSuccess(), 1200);
      } else {
        showToastMsg(data.message || 'Registration failed. Please try again.', 'error');
      }
    } catch {
      showToastMsg('Connection error to backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deptOptions = [
    'Computer Science', 'Information Technology', 'Electronics',
    'Mechanical', 'Civil', 'Biotechnology', 'Electrical'
  ];

  // ── Shared style helpers ──────────────────────────────────────────────────
  const inputCls = (key) =>
    `w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 bg-white ${
      errors[key]
        ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
        : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
    }`;

  const selectCls = (key) =>
    `w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 bg-white ${
      errors[key]
        ? 'border-rose-400 focus:ring-4 focus:ring-rose-500/10'
        : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
    }`;

  const labelCls = 'text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center space-x-1.5';
  const errCls   = 'text-xs font-medium text-rose-500 flex items-center space-x-1 mt-0.5';
  const sectionCls = 'text-xs font-bold text-primary uppercase tracking-widest border-b-2 border-primary/10 pb-2 mb-4 flex items-center space-x-2';

  return (
    /* Outer: fixed height, no overflow — left is static, right scrolls */
    <div className="flex w-full h-screen overflow-hidden">

      {/* ── Left: Branding — fixed, never scrolls ── */}
      <Branding />

      {/* ── Right: Sign-up form — scrolls independently ── */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto custom-scrollbar flex flex-col items-center justify-start py-8 px-6 md:px-10 bg-gray-50 relative font-sans">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-sm`} />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Card */}
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-8 my-auto transition-all duration-300 hover:shadow-[0_12px_50px_rgba(0,0,0,0.10)]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-5">
            <div className="inline-flex w-12 h-12 bg-primary/10 rounded-xl items-center justify-center text-primary font-outfit font-extrabold text-xl shadow-sm mb-2">
              H<span className="text-amber-500">H</span>
            </div>
            <h1 className="text-xl font-bold font-outfit text-primary">
              Hostel<span className="text-amber-500">Hub</span>
            </h1>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 font-outfit leading-snug tracking-tight mb-1">
              Create Account
            </h2>
            <p className="text-sm text-gray-500">
              Register to access the HostelHub portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── 1. PERSONAL INFORMATION ───────────────────── */}
            <section className="space-y-4">
              <h3 className={sectionCls}>
                <i className="fas fa-user-circle text-primary" />
                <span>Personal Information</span>
              </h3>

              {/* Full Name */}
              <div className="flex flex-col space-y-1.5">
                <label className={labelCls}>
                  <i className="fas fa-user text-primary text-xs" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text" id="signup-fullname"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => handleBlur('fullName', fullName)}
                  className={inputCls('fullName')}
                />
                {errors.fullName && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.fullName}</span></span>}
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className={labelCls}>
                    <i className="fas fa-envelope text-primary text-xs" />
                    <span>Email</span>
                  </label>
                  <input
                    type="email" id="signup-email"
                    placeholder="College email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email', email)}
                    className={inputCls('email')}
                  />
                  {errors.email && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.email}</span></span>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className={labelCls}>
                    <i className="fas fa-phone text-primary text-xs" />
                    <span>Phone</span>
                  </label>
                  <input
                    type="tel" id="signup-phone"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur('phoneNumber', phoneNumber)}
                    className={inputCls('phoneNumber')}
                  />
                  {errors.phoneNumber && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.phoneNumber}</span></span>}
                </div>
              </div>
            </section>

            {/* ── 2. ROLE SELECTION ─────────────────────────── */}
            <section className="space-y-4">
              <h3 className={sectionCls}>
                <i className="fas fa-user-tag text-primary" />
                <span>Role Selection</span>
              </h3>

              <div className="flex flex-col space-y-1.5">
                <label className={labelCls}>
                  <i className="fas fa-id-badge text-primary text-xs" />
                  <span>Choose Your Role</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'student', icon: 'fa-user-graduate', label: 'Student' },
                    { key: 'warden',  icon: 'fa-user-tie',      label: 'Warden'  },
                    { key: 'admin',   icon: 'fa-user-cog',      label: 'Admin'   },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      id={`role-${r.key}`}
                      onClick={() => handleChangeRole(r.key)}
                      className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center space-x-1.5 outline-none ${
                        role === r.key
                          ? 'border-primary bg-primary text-white shadow ring-2 ring-primary/20'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <i className={`fas ${r.icon} text-xs`} />
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 3. STUDENT-ONLY SECTIONS ──────────────────── */}
            {role === 'student' && (
              <div className="space-y-6 transition-all duration-300">

                {/* Academic Info */}
                <section className="space-y-4">
                  <h3 className={sectionCls}>
                    <i className="fas fa-graduation-cap text-primary" />
                    <span>Academic Information</span>
                  </h3>

                  <div className="flex flex-col space-y-1.5">
                    <label className={labelCls}>
                      <i className="fas fa-building text-primary text-xs" />
                      <span>Department</span>
                    </label>
                    <select
                      id="signup-dept"
                      value={department}
                      onChange={(e) => { setDepartment(e.target.value); if (errors.department) validateField('department', e.target.value); }}
                      onBlur={() => handleBlur('department', department)}
                      className={selectCls('department')}
                    >
                      <option value="">Select department</option>
                      {deptOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {errors.department && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.department}</span></span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className={labelCls}>
                        <i className="fas fa-calendar-alt text-primary text-xs" />
                        <span>Year</span>
                      </label>
                      <select
                        id="signup-year"
                        value={year}
                        onChange={(e) => { setYear(e.target.value); if (errors.year) validateField('year', e.target.value); }}
                        onBlur={() => handleBlur('year', year)}
                        className={selectCls('year')}
                      >
                        <option value="">Select year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                      {errors.year && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.year}</span></span>}
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className={labelCls}>
                        <i className="fas fa-venus-mars text-primary text-xs" />
                        <span>Gender</span>
                      </label>
                      <select
                        id="signup-gender"
                        value={gender}
                        onChange={(e) => { setGender(e.target.value); if (errors.gender) validateField('gender', e.target.value); }}
                        onBlur={() => handleBlur('gender', gender)}
                        className={selectCls('gender')}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.gender && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.gender}</span></span>}
                    </div>
                  </div>
                </section>

                {/* Guardian Info */}
                <section className="space-y-4">
                  <h3 className={sectionCls}>
                    <i className="fas fa-user-friends text-primary" />
                    <span>Parent / Guardian Information</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className={labelCls}>
                        <i className="fas fa-user-shield text-primary text-xs" />
                        <span>Guardian Name</span>
                      </label>
                      <input
                        type="text" id="signup-parent-name"
                        placeholder="Guardian's full name"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        onBlur={() => handleBlur('parentName', parentName)}
                        className={inputCls('parentName')}
                      />
                      {errors.parentName && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.parentName}</span></span>}
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className={labelCls}>
                        <i className="fas fa-phone-alt text-primary text-xs" />
                        <span>Guardian Contact</span>
                      </label>
                      <input
                        type="tel" id="signup-parent-phone"
                        maxLength={10}
                        placeholder="10-digit phone"
                        value={parentContact}
                        onChange={(e) => setParentContact(e.target.value.replace(/\D/g, ''))}
                        onBlur={() => handleBlur('parentContact', parentContact)}
                        className={inputCls('parentContact')}
                      />
                      {errors.parentContact && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.parentContact}</span></span>}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ── 4. ACCOUNT SECURITY ───────────────────────── */}
            <section className="space-y-4">
              <h3 className={sectionCls}>
                <i className="fas fa-shield-alt text-primary" />
                <span>Account Security</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="flex flex-col space-y-1.5">
                  <label className={labelCls}>
                    <i className="fas fa-lock text-primary text-xs" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="signup-password"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur('password', password)}
                      className={`${inputCls('password')} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  {errors.password && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.password}</span></span>}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col space-y-1.5">
                  <label className={labelCls}>
                    <i className="fas fa-lock-open text-primary text-xs" />
                    <span>Confirm Pass</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signup-confirm-password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                    className={inputCls('confirmPassword')}
                  />
                  {errors.confirmPassword && <span className={errCls}><i className="fas fa-exclamation-triangle text-xs" /><span>{errors.confirmPassword}</span></span>}
                </div>
              </div>

              {/* Show password toggle */}
              <label className="flex items-center space-x-2 cursor-pointer select-none w-fit group">
                <input
                  type="checkbox"
                  id="signup-show-pass"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                  Show passwords
                </span>
              </label>
            </section>

            {/* Submit */}
            <button
              type="submit"
              id="signup-submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" /><span>Creating Account...</span></>
              ) : (
                <><i className="fas fa-user-plus" /><span>Create Account</span></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onToggle}
                className="text-primary hover:text-primary-light font-bold underline underline-offset-2 focus:outline-none transition-colors"
              >
                Sign In
              </button>
            </p>
            <div className="w-full h-px bg-gray-100" />
            <p className="text-[11px] text-gray-400 tracking-wide">
              © 2026 HostelHub System · Centralized College Hostel Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
