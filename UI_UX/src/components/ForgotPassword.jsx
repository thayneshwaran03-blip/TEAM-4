import React, { useState } from 'react';
import Branding from './Branding.jsx';

// ── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Send OTP' },
    { num: 2, label: 'Verify OTP' },
    { num: 3, label: 'Reset' },
  ];
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          {/* Step bubble */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-300 ${
              currentStep > s.num
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                : currentStep === s.num
                  ? 'bg-primary border-primary text-white shadow-lg ring-4 ring-primary/20'
                  : 'bg-white border-gray-200 text-gray-400'
            }`}>
              {currentStep > s.num
                ? <i className="fas fa-check text-sm" />
                : s.num
              }
            </div>
            <span className={`mt-1.5 text-xs font-semibold tracking-wide ${
              currentStep >= s.num ? 'text-primary' : 'text-gray-400'
            }`}>{s.label}</span>
          </div>

          {/* Connector line (not after last) */}
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 mb-5 rounded-full transition-all duration-500 ${
              currentStep > s.num ? 'bg-emerald-400' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1);            // 1 | 2 | 3
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const setError = (field, msg) => setErrors(prev => ({ ...prev, [field]: msg }));
  const clearError = (field) => setErrors(prev => ({ ...prev, [field]: '' }));

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('email', 'Email address is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('email', 'Please enter a valid email address'); return; }
    clearError('email');

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg(data.message || 'OTP sent to your email address!', 'success');
        setTimeout(() => setStep(2), 800);
      } else {
        showToastMsg(data.message || 'Email not found. Please check and try again.', 'error');
      }
    } catch {
      showToastMsg('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { setError('otp', 'OTP is required'); return; }
    if (!/^\d{4,8}$/.test(otp)) { setError('otp', 'OTP must be 4–8 digits'); return; }
    clearError('otp');

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg('OTP verified successfully!', 'success');
        setTimeout(() => setStep(3), 800);
      } else {
        showToastMsg(data.message || 'Invalid or expired OTP. Please try again.', 'error');
      }
    } catch {
      showToastMsg('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    let hasError = false;

    if (!newPassword) { setError('newPassword', 'New password is required'); hasError = true; }
    else if (newPassword.length < 6) { setError('newPassword', 'Password must be at least 6 characters'); hasError = true; }
    else clearError('newPassword');

    if (!confirmPassword) { setError('confirmPassword', 'Please confirm your password'); hasError = true; }
    else if (confirmPassword !== newPassword) { setError('confirmPassword', 'Passwords do not match'); hasError = true; }
    else clearError('confirmPassword');

    if (hasError) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword: newPassword
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResetSuccess(true);
        showToastMsg('Password reset successfully!', 'success');
        setTimeout(() => onBackToLogin(), 2500);
      } else {
        showToastMsg(data.message || 'Reset failed. Please try again from step 1.', 'error');
      }
    } catch {
      showToastMsg('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (resetSuccess) {
    return (
      <div className="flex w-full h-screen overflow-hidden">
        <Branding />
        <div className="w-full lg:w-1/2 h-screen overflow-y-auto custom-scrollbar flex justify-center items-center px-6 md:px-14 bg-gray-50 font-sans">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-8 text-center my-auto transition-all duration-300 hover:shadow-[0_12px_50px_rgba(0,0,0,0.10)]">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <i className="fas fa-check-circle text-3xl text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold font-outfit text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your password has been successfully reset. Redirecting you to Sign In...
            </p>
            <div className="w-16 h-1 bg-emerald-400 rounded-full mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Step headers config ───────────────────────────────────────────────────
  const stepConfig = {
    1: {
      title: 'Forgot Password',
      subtitle: 'Enter your registered email to receive a One-Time Password.',
      icon: 'fa-envelope-open-text',
    },
    2: {
      title: 'Verify OTP',
      subtitle: `We've sent a 6-digit OTP to ${email || 'your email'}. Enter it below.`,
      icon: 'fa-shield-alt',
    },
    3: {
      title: 'Reset Password',
      subtitle: 'Create a strong new password for your HostelHub account.',
      icon: 'fa-lock-open',
    },
  };
  const { title, subtitle, icon } = stepConfig[step];

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Left Pane */}
      <Branding />

      {/* Right Pane */}
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

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-8 transition-all duration-300 hover:shadow-[0_12px_50px_rgba(0,0,0,0.10)] my-auto">

          {/* Back link */}
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors mb-6 group focus:outline-none"
          >
            <i className="fas fa-arrow-left group-hover:-translate-x-0.5 transition-transform duration-200" />
            <span>Back to Sign In</span>
          </button>

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Step header */}
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 font-outfit leading-snug tracking-tight mb-1">
              {title}
            </h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center space-x-1.5">
                  <i className="fas fa-envelope text-primary text-xs" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 ${
                    errors.email
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                />
                {errors.email && (
                  <span className="text-xs font-medium text-rose-500 flex items-center space-x-1 mt-0.5">
                    <i className="fas fa-exclamation-triangle text-xs" />
                    <span>{errors.email}</span>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-light text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none mt-1"
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin" /><span>Sending OTP...</span></>
                ) : (
                  <><i className="fas fa-paper-plane" /><span>Send OTP</span></>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center space-x-1.5">
                  <i className="fas fa-key text-primary text-xs" />
                  <span>Enter OTP</span>
                </label>
                <input
                  type="text"
                  id="otp-input"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Enter OTP code"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); clearError('otp'); }}
                  className={`w-full px-4 py-2.5 rounded-xl border-2 text-base font-bold tracking-[0.2em] text-center outline-none transition-all duration-200 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm placeholder:text-gray-400 ${
                    errors.otp
                      ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                      : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                />
                {errors.otp && (
                  <span className="text-xs font-medium text-rose-500 flex items-center space-x-1 mt-0.5">
                    <i className="fas fa-exclamation-triangle text-xs" />
                    <span>{errors.otp}</span>
                  </span>
                )}
                <p className="text-xs text-gray-400 text-center mt-1">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-primary font-semibold hover:underline focus:outline-none"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-light text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none mt-1"
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin" /><span>Verifying...</span></>
                ) : (
                  <><i className="fas fa-shield-alt" /><span>Verify OTP</span></>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center space-x-1.5">
                  <i className="fas fa-lock text-primary text-xs" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    id="new-password"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); clearError('newPassword'); }}
                    className={`w-full pl-4 pr-11 py-2.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 ${
                      errors.newPassword
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                        : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
                {errors.newPassword && (
                  <span className="text-xs font-medium text-rose-500 flex items-center space-x-1 mt-0.5">
                    <i className="fas fa-exclamation-triangle text-xs" />
                    <span>{errors.newPassword}</span>
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center space-x-1.5">
                  <i className="fas fa-lock-open text-primary text-xs" />
                  <span>Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    id="confirm-password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                    className={`w-full pl-4 pr-11 py-2.5 rounded-xl border-2 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 ${
                      errors.confirmPassword
                        ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                        : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <i className={`fas ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="text-xs font-medium text-rose-500 flex items-center space-x-1 mt-0.5">
                    <i className="fas fa-exclamation-triangle text-xs" />
                    <span>{errors.confirmPassword}</span>
                  </span>
                )}
              </div>

              {/* Password strength hint */}
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <i className="fas fa-info-circle text-primary text-sm flex-shrink-0" />
                <p className="text-xs text-primary/80 font-medium">
                  Password must be at least 6 characters.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-light text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none mt-1"
              >
                {loading ? (
                  <><i className="fas fa-spinner fa-spin" /><span>Resetting...</span></>
                ) : (
                  <><i className="fas fa-key" /><span>Reset Password</span></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
