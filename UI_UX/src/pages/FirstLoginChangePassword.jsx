import React, { useState } from 'react';
import Branding from '../components/Branding.jsx';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';



export default function FirstLoginChangePassword({ user, onLogout, onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [toast, setToast] = useState(null);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const validateNewPassword = (val) => {
    if (!val) {
      setNewPasswordError('Password is required');
      return false;
    }
    if (val.length < 6) {
      setNewPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = (val) => {
    if (!val) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (val !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isNewPassValid = validateNewPassword(newPassword);
    const isConfirmPassValid = validateConfirmPassword(confirmPassword);

    if (!isNewPassValid || !isConfirmPassValid) {
      showToastMsg('Please fix errors in the form', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/auth/first-login-change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newPassword.trim() })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg('Password updated successfully!', 'success');
        setTimeout(() => {
          onPasswordChanged(data.user);
        }, 1500);
      } else {
        showToastMsg(data.message || 'Failed to update password. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showToastMsg('Connection error to backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Left Pane - Branding */}
      <Branding />

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex justify-center items-center px-6 md:px-14 bg-gray-50 relative font-sans">

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`} />
            <span className="text-base font-medium">{toast.message}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-10 md:p-12 transition-all duration-300 hover:shadow-[0_25px_70px_rgba(0,0,0,0.09)]">

          {/* Card Header */}
          <div className="mb-8 text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight font-outfit leading-tight mb-3">
              Secure Your Account
            </h2>
            <p className="text-base text-gray-500 font-sans font-normal leading-relaxed">
              Hi <strong>{user?.fullName}</strong>, this is your first login. For security reasons, you must change your temporary password before accessing the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* New Password field */}
            <div className="flex flex-col space-y-2 text-left">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center space-x-2">
                <i className="fas fa-lock text-primary text-base" />
                <span>New Password</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (newPasswordError) validateNewPassword(e.target.value);
                  }}
                  onBlur={() => validateNewPassword(newPassword)}
                  className={`w-full pl-5 pr-14 py-4 rounded-2xl border-2 font-sans text-base outline-none transition-all duration-200 placeholder:text-gray-400 ${newPasswordError
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500/10'
                      : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                >
                  <i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'} text-lg`} />
                </button>
              </div>
              {newPasswordError && (
                <span className="text-sm font-medium text-rose-500 flex items-center space-x-1.5 mt-0.5">
                  <i className="fas fa-exclamation-triangle text-xs" />
                  <span>{newPasswordError}</span>
                </span>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="flex flex-col space-y-2 text-left">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center space-x-2">
                <i className="fas fa-check-double text-primary text-base" />
                <span>Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) validateConfirmPassword(e.target.value);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword)}
                  className={`w-full pl-5 pr-14 py-4 rounded-2xl border-2 font-sans text-base outline-none transition-all duration-200 placeholder:text-gray-400 ${confirmPasswordError
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500/10'
                      : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-1"
                >
                  <i className={`fas ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'} text-lg`} />
                </button>
              </div>
              {confirmPasswordError && (
                <span className="text-sm font-medium text-rose-500 flex items-center space-x-1.5 mt-0.5">
                  <i className="fas fa-exclamation-triangle text-xs" />
                  <span>{confirmPasswordError}</span>
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin text-xl" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-key text-xl" />
                  <span>Update & Proceed</span>
                </>
              )}
            </button>
          </form>

          {/* Footer - Log Out */}
          <div className="mt-8 text-center space-y-4">
            <div className="w-full h-px bg-gray-100" />
            <button
              type="button"
              onClick={onLogout}
              className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <i className="fas fa-sign-out-alt" />
              <span>Cancel & Log Out</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
