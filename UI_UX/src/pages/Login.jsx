import React, { useState } from 'react';
import Branding from '../components/Branding.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export default function Login({ onForgotPassword, onLoginSuccess }) {
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
      const response = await fetch(`${API}/api/auth/login`, {
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
    <div className="flex w-full min-h-screen">
      {/* Left Pane - Branding */}
      <Branding />

      {/* Right Pane - Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex justify-center items-center px-6 md:px-14 bg-gray-50 relative font-sans">

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl transition-all duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`} />
            <span className="text-base font-medium">{toast.message}</span>
          </div>
        )}

        {/* Main Form Card */}
        <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-10 md:p-12 transition-all duration-300 hover:shadow-[0_25px_70px_rgba(0,0,0,0.09)]">

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center text-primary font-outfit font-extrabold text-3xl shadow-sm mb-3">
              H<span className="text-amber-500">H</span>
            </div>
            <h1 className="text-3xl font-bold font-outfit text-primary">
              Hostel<span className="text-amber-500">Hub</span>
            </h1>
          </div>

          {/* Card Header */}
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight font-outfit leading-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-base text-gray-500 font-sans font-normal leading-relaxed">
              Sign in using the credentials provided by the Hostel Administration.
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email field */}
            <div className="flex flex-col space-y-2 text-left">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center space-x-2">
                <i className="fas fa-envelope text-primary text-base" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                id="login-email"
                placeholder="Enter your college email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                onBlur={() => validateEmail(email)}
                className={`w-full px-5 py-4 rounded-2xl border-2 font-sans text-base outline-none transition-all duration-200 placeholder:text-gray-400 ${
                  emailError
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                }`}
              />
              {emailError && (
                <span className="text-sm font-medium text-rose-500 flex items-center space-x-1.5 mt-0.5">
                  <i className="fas fa-exclamation-triangle text-xs" />
                  <span>{emailError}</span>
                </span>
              )}
            </div>

            {/* Password field */}
            <div className="flex flex-col space-y-2 text-left">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center space-x-2">
                <i className="fas fa-lock text-primary text-base" />
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
                  className={`w-full pl-5 pr-14 py-4 rounded-2xl border-2 font-sans text-base outline-none transition-all duration-200 placeholder:text-gray-400 ${
                    passwordError
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`} />
                </button>
              </div>

              {/* Error + Forgot Password row */}
              <div className="flex items-start justify-between mt-1">
                <div className="flex-1">
                  {passwordError && (
                    <span className="text-sm font-medium text-rose-500 flex items-center space-x-1.5">
                      <i className="fas fa-exclamation-triangle text-xs" />
                      <span>{passwordError}</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm font-semibold text-primary hover:text-primary-light underline underline-offset-2 transition-colors whitespace-nowrap ml-3 focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin text-xl" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt text-xl" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-500 font-sans leading-relaxed">
              Accounts are created and managed by the Hostel Administration. Please contact the Admin office if you need login credentials.
            </p>
            <div className="w-full h-px bg-gray-100" />
            <p className="text-xs text-gray-400 font-sans tracking-wide">
              © 2026 HostelHub System · Centralized College Hostel Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
