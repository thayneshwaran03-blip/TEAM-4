import React, { useState } from 'react';
import Branding from './Branding.jsx';

export default function Login({ onToggle, onForgotPassword, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const validateEmail = (val) => {
    if (!val.trim()) { setEmailError('Email address is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError(''); return true;
  };

  const validatePassword = (val) => {
    if (!val) { setPasswordError('Password is required'); return false; }
    if (val.length < 6) { setPasswordError('Password must be at least 6 characters'); return false; }
    setPasswordError(''); return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) { showToastMsg('Please fix the errors in the form', 'error'); return; }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg('Login successful!', 'success');
        setTimeout(() => onLoginSuccess(data.token, data.user), 800);
      } else {
        showToastMsg(data.message || 'Invalid email or password', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToastMsg('Connection error to backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Outer: full screen, no overflow — branding is fixed, right scrolls */
    <div className="flex w-full h-screen overflow-hidden">

      {/* ── Left: Branding — fixed, never scrolls ── */}
      <Branding />

      {/* ── Right: Login Form — scrolls independently ── */}
      <div className="w-full lg:w-1/2 h-screen overflow-y-auto custom-scrollbar flex justify-center items-center px-6 md:px-10 bg-gray-50 relative font-sans">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-sm`} />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-8 transition-all duration-300 hover:shadow-[0_12px_50px_rgba(0,0,0,0.10)] my-auto">

          {/* Mobile logo — hidden on desktop */}
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
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight font-outfit leading-snug mb-1">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500">
              Sign in with your registered college email account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center space-x-1.5">
                <i className="fas fa-envelope text-primary text-xs" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                id="login-email"
                placeholder="Enter your college email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={() => validateEmail(email)}
                className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 ${
                  emailError
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                }`}
              />
              {emailError && (
                <span className="text-xs font-medium text-rose-500 flex items-center space-x-1 mt-0.5">
                  <i className="fas fa-exclamation-triangle text-xs" />
                  <span>{emailError}</span>
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center space-x-1.5">
                <i className="fas fa-lock text-primary text-xs" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) validatePassword(e.target.value); }}
                  onBlur={() => validatePassword(password)}
                  className={`w-full pl-4 pr-11 py-2.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 ${
                    passwordError
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>

              {/* Error + Forgot Password row */}
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex-1">
                  {passwordError && (
                    <span className="text-xs font-medium text-rose-500 flex items-center space-x-1">
                      <i className="fas fa-exclamation-triangle text-xs" />
                      <span>{passwordError}</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-xs font-semibold text-primary hover:text-primary-light underline underline-offset-2 transition-colors whitespace-nowrap ml-3 focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none mt-1"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin" /><span>Authenticating...</span></>
              ) : (
                <><i className="fas fa-sign-in-alt" /><span>Sign In</span></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onToggle}
                className="text-primary hover:text-primary-light font-bold underline underline-offset-2 focus:outline-none transition-colors"
              >
                Sign Up
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
