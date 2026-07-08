import React, { useState } from 'react';
import Branding from '../components/Branding.jsx';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CompleteProfile({ user, onLogout, onProfileCompleted }) {
  const [formData, setFormData] = useState({
    phoneNumber: user.phoneNumber || '',
    department: user.department || '',
    year: user.year || '',
    gender: user.gender || '',
    parentName: user.parentName || '',
    parentContact: user.parentContact || '',
    emergencyContact: user.emergencyContact || '',
    address: user.address || ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const validate = () => {
    const errs = {};
    if (!formData.phoneNumber) errs.phoneNumber = 'Mobile number is required';
    if (!formData.department) errs.department = 'Department is required';
    if (!formData.year) errs.year = 'Academic Year is required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.parentName) errs.parentName = 'Parent/Guardian name is required';
    if (!formData.parentContact) errs.parentContact = 'Parent contact number is required';
    if (!formData.emergencyContact) errs.emergencyContact = 'Emergency contact is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToastMsg('Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/student/complete-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg('Profile completed successfully!', 'success');
        setTimeout(() => {
          onProfileCompleted(data.user);
        }, 1500);
      } else {
        showToastMsg(data.message || 'Failed to save details. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Complete profile error:', error);
      showToastMsg('Connection error to backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* Left Pane - Branding */}
      <Branding className="hidden lg:flex w-1/2 h-screen sticky top-0" />

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex justify-center items-center px-6 md:px-14 bg-gray-50 relative font-sans py-12">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl transition-all duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`} />
            <span className="text-base font-medium">{toast.message}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-8 md:p-10 transition-all duration-300 hover:shadow-[0_25px_70px_rgba(0,0,0,0.09)]">
          {/* Card Header */}
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-outfit mb-2">
              Complete Your Profile
            </h2>
            <p className="text-sm text-gray-500 font-sans font-normal leading-relaxed">
              Hi <strong>{user?.fullName}</strong>, please complete your profile details to access the student hostel dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone Number */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-phone text-primary text-xs" />
                  <span>Mobile Number *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, phoneNumber: e.target.value });
                    if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                    errors.phoneNumber ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 focus:border-primary'
                  }`}
                />
                {errors.phoneNumber && <span className="text-xs text-rose-500">{errors.phoneNumber}</span>}
              </div>

              {/* Gender */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-venus-mars text-primary text-xs" />
                  <span>Gender *</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => {
                    setFormData({ ...formData, gender: e.target.value });
                    if (errors.gender) setErrors({ ...errors, gender: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none bg-white transition-all duration-200 ${
                    errors.gender ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 focus:border-primary'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <span className="text-xs text-rose-500">{errors.gender}</span>}
              </div>

              {/* Department */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-graduation-cap text-primary text-xs" />
                  <span>Department *</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({ ...formData, department: e.target.value });
                    if (errors.department) setErrors({ ...errors, department: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-white outline-none transition-all duration-200 ${
                    errors.department ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 focus:border-primary'
                  }`}
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                </select>
                {errors.department && <span className="text-xs text-rose-500">{errors.department}</span>}
              </div>

              {/* Year */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-calendar-alt text-primary text-xs" />
                  <span>Academic Year *</span>
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => {
                    setFormData({ ...formData, year: e.target.value });
                    if (errors.year) setErrors({ ...errors, year: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-white outline-none transition-all duration-200 ${
                    errors.year ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 focus:border-primary'
                  }`}
                >
                  <option value="">Select Year</option>
                  <option value="I">I</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                </select>
                {errors.year && <span className="text-xs text-rose-500">{errors.year}</span>}
              </div>

              {/* Parent Name */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-user-friends text-primary text-xs" />
                  <span>Parent/Guardian Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Richard Doe"
                  value={formData.parentName}
                  onChange={(e) => {
                    setFormData({ ...formData, parentName: e.target.value });
                    if (errors.parentName) setErrors({ ...errors, parentName: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                    errors.parentName ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 focus:border-primary'
                  }`}
                />
                {errors.parentName && <span className="text-xs text-rose-500">{errors.parentName}</span>}
              </div>

              {/* Parent Contact */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-phone-alt text-primary text-xs" />
                  <span>Parent Contact Number *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876501234"
                  value={formData.parentContact}
                  onChange={(e) => {
                    setFormData({ ...formData, parentContact: e.target.value });
                    if (errors.parentContact) setErrors({ ...errors, parentContact: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                    errors.parentContact ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 focus:border-primary'
                  }`}
                />
                {errors.parentContact && <span className="text-xs text-rose-500">{errors.parentContact}</span>}
              </div>

              {/* Emergency Contact */}
              <div className="flex flex-col space-y-1.5 text-left md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-ambulance text-primary text-xs" />
                  <span>Emergency Contact Number *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876598765"
                  value={formData.emergencyContact}
                  onChange={(e) => {
                    setFormData({ ...formData, emergencyContact: e.target.value });
                    if (errors.emergencyContact) setErrors({ ...errors, emergencyContact: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                    errors.emergencyContact ? 'border-rose-400 bg-rose-50/20' : 'border-gray-200 focus:border-primary'
                  }`}
                />
                {errors.emergencyContact && <span className="text-xs text-rose-500">{errors.emergencyContact}</span>}
              </div>

              {/* Address (Optional) */}
              <div className="flex flex-col space-y-1.5 text-left md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <i className="fas fa-home text-primary text-xs" />
                  <span>Address (Optional)</span>
                </label>
                <textarea
                  placeholder="Enter your permanent address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-primary h-20 resize-none transition-all duration-200"
                />
              </div>


            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-white font-bold text-base py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:pointer-events-none mt-4"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin text-lg" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save text-lg" />
                  <span>Save & Proceed to Dashboard</span>
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
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline transition-colors flex items-center justify-center space-x-2 mx-auto"
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
