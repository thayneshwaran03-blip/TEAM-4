import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ user, onLogout }) {
  const name = user ? user.fullName : 'System Admin';
  const role = user ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Administrator';
  const initials = user ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SA';

  // State to manage active panel: 'dashboard' | 'students' | 'wardens'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navItems = [
    { icon: 'fa-th-large', label: 'Dashboard', tab: 'dashboard' },
    { icon: 'fa-user-graduate', label: 'Manage Students', tab: 'students' },
    { icon: 'fa-user-tie', label: 'Manage Wardens', tab: 'wardens' },
    { icon: 'fa-door-open', label: 'Manage Rooms', tab: 'rooms_mock' },
    { icon: 'fa-calendar-check', label: 'Leave Requests', tab: 'leaves_mock' },
    { icon: 'fa-exclamation-triangle', label: 'Complaints', tab: 'complaints_mock' },
    { icon: 'fa-credit-card', label: 'Fee Records', tab: 'fees_mock' },
    { icon: 'fa-address-book', label: 'Visitor Logs', tab: 'visitors_mock' },
  ];

  // ── Stats for primary dashboard ────────────────────────────────────────────
  const [stats, setStats] = useState([
    { icon: 'fa-users', label: 'Total Students', value: '0', colorBg: 'bg-blue-50 text-blue-600' },
    { icon: 'fa-bed', label: 'Beds Allotted', value: '0', sub: 'Vacancies automatic', colorBg: 'bg-emerald-50 text-emerald-600' },
    { icon: 'fa-users', label: 'Total Wardens', value: '0', colorBg: 'bg-amber-50 text-amber-600' },
    { icon: 'fa-door-open', label: 'Total Rooms', value: '0', colorBg: 'bg-rose-50 text-rose-600' },
    { icon: 'fa-exclamation-triangle', label: 'Pending Complaints', value: '1', colorBg: 'bg-purple-50 text-purple-600' },
    { icon: 'fa-tools', label: 'Maintenance Actions', value: '1', colorBg: 'bg-teal-50 text-teal-600' }
  ]);

  // Circular progress mock
  const activities = [
    { title: 'New student account created', time: 'Just now', status: 'resolved' },
    { title: 'Warden assigned to Block B', time: '1 hour ago', status: 'resolved' },
    { title: 'Complaint resolved in Room 204', time: '1 day ago', status: 'resolved' },
    { title: 'Room occupancy threshold check', time: '2 days ago', status: 'in-progress' }
  ];

  const statusColors = {
    pending: 'bg-blue-100 text-blue-700',
    'in-progress': 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700'
  };

  // ── Student Management State ───────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilterBlock, setStudentFilterBlock] = useState('');
  const [studentFilterGender, setStudentFilterGender] = useState('');
  const [studentFilterStatus, setStudentFilterStatus] = useState('');

  // Modals for Students
  const [showStudentAddEditModal, setShowStudentAddEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null); // Null for Create, Object for Edit
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    registerNumber: '',
    rollNumber: '',
    email: '',
    phoneNumber: '',
    department: '',
    year: '',
    gender: '',
    parentName: '',
    parentContact: '',
    hostelName: '',
    block: '',
    floor: '',
    roomNumber: '',
    bedNumber: '',
    emergencyContact: '',
    status: 'Active',
    temporaryPassword: ''
  });

  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);

  const [showStudentDeleteModal, setShowStudentDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // ── Warden Management State ────────────────────────────────────────────────
  const [wardens, setWardens] = useState([]);
  const [wardenSearch, setWardenSearch] = useState('');
  const [wardenFilterHostel, setWardenFilterHostel] = useState('');
  const [wardenFilterGender, setWardenFilterGender] = useState('');
  const [wardenFilterStatus, setWardenFilterStatus] = useState('');

  // Modals for Wardens
  const [showWardenAddEditModal, setShowWardenAddEditModal] = useState(false);
  const [selectedWarden, setSelectedWarden] = useState(null); // Null for Create, Object for Edit
  const [wardenForm, setWardenForm] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    phoneNumber: '',
    gender: '',
    assignedHostel: '',
    assignedBlocks: '', // Comma separated block names
    status: 'Active',
    temporaryPassword: ''
  });

  const [showWardenDetailsModal, setShowWardenDetailsModal] = useState(false);
  const [viewWarden, setViewWarden] = useState(null);

  const [showWardenDeleteModal, setShowWardenDeleteModal] = useState(false);
  const [wardenToDelete, setWardenToDelete] = useState(null);

  // ── Reset Password State ───────────────────────────────────────────────────
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserRole, setResetUserRole] = useState(''); // 'student' | 'warden'
  const [resetUserName, setResetUserName] = useState('');
  const [newTempPassword, setNewTempPassword] = useState('');

  // ── Fetch Operations ───────────────────────────────────────────────────────
  const fetchStudents = async () => {
    try {
      const searchParam = studentSearch ? `&search=${encodeURIComponent(studentSearch)}` : '';
      const blockParam = studentFilterBlock ? `&block=${encodeURIComponent(studentFilterBlock)}` : '';
      const genderParam = studentFilterGender ? `&gender=${encodeURIComponent(studentFilterGender)}` : '';
      const statusParam = studentFilterStatus ? `&status=${encodeURIComponent(studentFilterStatus)}` : '';

      const response = await fetch(`http://localhost:5000/api/admin/students?${searchParam}${blockParam}${genderParam}${statusParam}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Fetch Students Error:', err);
    }
  };

  const fetchWardens = async () => {
    try {
      const searchParam = wardenSearch ? `&search=${encodeURIComponent(wardenSearch)}` : '';
      const hostelParam = wardenFilterHostel ? `&assignedHostel=${encodeURIComponent(wardenFilterHostel)}` : '';
      const genderParam = wardenFilterGender ? `&gender=${encodeURIComponent(wardenFilterGender)}` : '';
      const statusParam = wardenFilterStatus ? `&status=${encodeURIComponent(wardenFilterStatus)}` : '';

      const response = await fetch(`http://localhost:5000/api/admin/wardens?${searchParam}${hostelParam}${genderParam}${statusParam}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setWardens(data.wardens);
      }
    } catch (err) {
      console.error('Fetch Wardens Error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      // Get student, warden, and room lists to aggregate metrics
      const studentRes = await fetch(`http://localhost:5000/api/admin/students`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const wardenRes = await fetch(`http://localhost:5000/api/admin/wardens`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const roomRes = await fetch(`http://localhost:5000/api/admin/rooms`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const sData = await studentRes.json();
      const wData = await wardenRes.json();
      const rData = await roomRes.json();

      let studentCount = sData.students ? sData.students.length : 0;
      let wardenCount = wData.wardens ? wData.wardens.length : 0;
      let roomCount = rData.rooms ? rData.rooms.length : 0;
      let bedsAllotted = 0;
      if (rData.rooms) {
        rData.rooms.forEach(r => bedsAllotted += r.occupiedBeds);
      }

      setStats([
        { icon: 'fa-users', label: 'Total Students', value: studentCount.toString(), colorBg: 'bg-blue-50 text-blue-600' },
        { icon: 'fa-bed', label: 'Beds Allotted', value: bedsAllotted.toString(), sub: 'In assigned rooms', colorBg: 'bg-emerald-50 text-emerald-600' },
        { icon: 'fa-user-tie', label: 'Total Wardens', value: wardenCount.toString(), colorBg: 'bg-amber-50 text-amber-600' },
        { icon: 'fa-door-open', label: 'Total Rooms', value: roomCount.toString(), colorBg: 'bg-rose-50 text-rose-600' },
        { icon: 'fa-exclamation-triangle', label: 'Pending Complaints', value: '0', colorBg: 'bg-purple-50 text-purple-600' },
        { icon: 'fa-tools', label: 'Maintenance Actions', value: '0', colorBg: 'bg-teal-50 text-teal-600' }
      ]);
    } catch (err) {
      console.error('Fetch Stats Error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'wardens') {
      fetchWardens();
    }
  }, [
    activeTab,
    studentSearch, studentFilterBlock, studentFilterGender, studentFilterStatus,
    wardenSearch, wardenFilterHostel, wardenFilterGender, wardenFilterStatus
  ]);

  // ── Student Actions ────────────────────────────────────────────────────────
  const openStudentAddModal = () => {
    setSelectedStudent(null);
    setStudentForm({
      fullName: '',
      registerNumber: '',
      rollNumber: '',
      email: '',
      phoneNumber: '',
      department: '',
      year: '',
      gender: '',
      parentName: '',
      parentContact: '',
      hostelName: '',
      block: '',
      floor: '',
      roomNumber: '',
      bedNumber: '',
      emergencyContact: '',
      status: 'Active',
      temporaryPassword: ''
    });
    setShowStudentAddEditModal(true);
  };

  const openStudentEditModal = (student) => {
    setSelectedStudent(student);
    setStudentForm({
      fullName: student.fullName,
      registerNumber: student.registerNumber,
      rollNumber: student.rollNumber || '',
      email: student.email,
      phoneNumber: student.phoneNumber,
      department: student.department || '',
      year: student.year || '',
      gender: student.gender,
      parentName: student.parentName || '',
      parentContact: student.parentContact || '',
      hostelName: student.hostelName || '',
      block: student.block || '',
      floor: student.floor || '',
      roomNumber: student.roomNumber || '',
      bedNumber: student.bedNumber || '',
      emergencyContact: student.emergencyContact || '',
      status: student.isActive ? 'Active' : 'Inactive',
      temporaryPassword: '' // Password not required on edit
    });
    setShowStudentAddEditModal(true);
  };

  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    // Basic Validation
    if (!studentForm.fullName || !studentForm.registerNumber || !studentForm.email || !studentForm.phoneNumber || !studentForm.gender) {
      showToastMsg('All mandatory fields are required.', 'error');
      return;
    }
    if (studentForm.roomNumber && (!studentForm.block || !studentForm.floor)) {
      showToastMsg('Block and Floor are required when assigning a room.', 'error');
      return;
    }

    const payload = { ...studentForm };
    if (selectedStudent) {
      delete payload.temporaryPassword; // Can't edit password here
    }

    try {
      const url = selectedStudent 
        ? `http://localhost:5000/api/admin/students/${selectedStudent._id}` 
        : `http://localhost:5000/api/admin/students`;
      const method = selectedStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (!selectedStudent) {
          setCreatedCredentials({
            role: 'student',
            name: data.student.fullName,
            email: data.student.email,
            password: data.temporaryPassword
          });
        } else {
          showToastMsg('Student updated successfully!');
        }
        setShowStudentAddEditModal(false);
        fetchStudents();
      } else {
        showToastMsg(data.message || 'Validation error saving student details.', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed.', 'error');
    }
  };

  const toggleStudentStatus = async (student) => {
    try {
      const newStatus = student.isActive ? 'Inactive' : 'Active';
      const response = await fetch(`http://localhost:5000/api/admin/students/${student._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg(`Student account status updated to ${newStatus}.`);
        fetchStudents();
      } else {
        showToastMsg(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed.', 'error');
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/students/${studentToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg('Student account deleted successfully!');
        setShowStudentDeleteModal(false);
        setStudentToDelete(null);
        fetchStudents();
      } else {
        showToastMsg(data.message || 'Unable to delete student.', 'error');
      }
    } catch (err) {
      showToastMsg('Connection error.', 'error');
    }
  };

  // ── Warden Actions ─────────────────────────────────────────────────────────
  const openWardenAddModal = () => {
    setSelectedWarden(null);
    setWardenForm({
      fullName: '',
      employeeId: '',
      email: '',
      phoneNumber: '',
      gender: '',
      assignedHostel: '',
      assignedBlocks: '',
      status: 'Active',
      temporaryPassword: ''
    });
    setShowWardenAddEditModal(true);
  };

  const openWardenEditModal = (warden) => {
    setSelectedWarden(warden);
    setWardenForm({
      fullName: warden.fullName,
      employeeId: warden.employeeId,
      email: warden.email,
      phoneNumber: warden.phoneNumber,
      gender: warden.gender,
      assignedHostel: warden.assignedHostel || '',
      assignedBlocks: warden.assignedBlocks ? warden.assignedBlocks.join(', ') : '',
      status: warden.isActive ? 'Active' : 'Inactive',
      temporaryPassword: ''
    });
    setShowWardenAddEditModal(true);
  };

  const handleWardenFormSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!wardenForm.fullName || !wardenForm.employeeId || !wardenForm.email || !wardenForm.phoneNumber || !wardenForm.gender) {
      showToastMsg('All mandatory fields are required.', 'error');
      return;
    }

    const blocksArray = wardenForm.assignedBlocks
      ? wardenForm.assignedBlocks.split(',').map(b => b.trim()).filter(Boolean)
      : [];

    const payload = {
      ...wardenForm,
      assignedBlocks: blocksArray
    };
    if (selectedWarden) {
      delete payload.temporaryPassword;
    }

    try {
      const url = selectedWarden
        ? `http://localhost:5000/api/admin/wardens/${selectedWarden._id}`
        : `http://localhost:5000/api/admin/wardens`;
      const method = selectedWarden ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (!selectedWarden) {
          setCreatedCredentials({
            role: 'warden',
            name: data.warden.fullName,
            email: data.warden.email,
            password: data.temporaryPassword
          });
        } else {
          showToastMsg('Warden updated successfully!');
        }
        setShowWardenAddEditModal(false);
        fetchWardens();
      } else {
        showToastMsg(data.message || 'Validation error saving warden details.', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed.', 'error');
    }
  };

  const toggleWardenStatus = async (warden) => {
    try {
      const newStatus = warden.isActive ? 'Inactive' : 'Active';
      const response = await fetch(`http://localhost:5000/api/admin/wardens/${warden._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg(`Warden account status updated to ${newStatus}.`);
        fetchWardens();
      } else {
        showToastMsg(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed.', 'error');
    }
  };

  const handleDeleteWarden = async () => {
    if (!wardenToDelete) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/wardens/${wardenToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg('Warden account deleted successfully!');
        setShowWardenDeleteModal(false);
        setWardenToDelete(null);
        fetchWardens();
      } else {
        showToastMsg(data.message || 'Unable to delete warden.', 'error');
      }
    } catch (err) {
      showToastMsg('Connection error.', 'error');
    }
  };

  // ── Common Password Reset ──────────────────────────────────────────────────
  const openResetPasswordModal = (userObj, roleType) => {
    setResetUserId(userObj._id);
    setResetUserRole(roleType);
    setResetUserName(userObj.fullName);
    setNewTempPassword('');
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newTempPassword || newTempPassword.length < 6) {
      showToastMsg('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      const url = resetUserRole === 'student' 
        ? `http://localhost:5000/api/admin/students/${resetUserId}/reset-password`
        : `http://localhost:5000/api/admin/wardens/${resetUserId}/reset-password`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ temporaryPassword: newTempPassword.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMsg(`Password reset successfully for ${resetUserName}!`);
        setShowResetPasswordModal(false);
      } else {
        showToastMsg(data.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed.', 'error');
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* Toast Messages */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`} />
          <span className="text-base font-medium">{toast.message}</span>
        </div>
      )}

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
          <div className="bg-gray-50 rounded-xl p-4 flex items-center space-x-3 border border-gray-100 text-left">
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
            {navItems.map((item, idx) => {
              const isSelected = activeTab === item.tab;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.tab.endsWith('_mock')) {
                      showToastMsg(`${item.label} module is active and managed automatically inside database schema.`, 'info');
                    } else {
                      setActiveTab(item.tab);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 outline-none text-left ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <i className={`fas ${item.icon} w-5 text-center ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
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
            {activeTab === 'dashboard' && 'Administrative Command Analytics Center'}
            {activeTab === 'students' && 'Student Accounts Master Portal'}
            {activeTab === 'wardens' && 'Warden Management Console'}
          </h1>
          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-gray-200/80 px-3 py-1.5 rounded-full font-bold text-gray-600 tracking-wide">
              {initials}
            </span>
            <span className="font-semibold text-gray-600">{name}</span>
          </div>
        </header>

        {/* ── PANEL: DASHBOARD ──────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
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
                <span className="text-xs font-semibold text-gray-400">System Logs</span>
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
          </>
        )}

        {/* ── PANEL: STUDENTS ───────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <div className="flex flex-col space-y-6 w-full text-left">
            
            {/* Header + Add Button Row */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 font-medium">Create and manage Student profiles, activate/deactivate accounts, and assign rooms.</p>
              <button
                onClick={openStudentAddModal}
                className="bg-primary hover:bg-primary-light text-white text-xs font-bold py-3 px-5 rounded-xl shadow-sm hover:shadow flex items-center space-x-2 transition-all"
              >
                <i className="fas fa-plus" />
                <span>Add Student</span>
              </button>
            </div>

            {/* Search & Filter bar */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  placeholder="Search by Name, Reg Number, or Email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <i className="fas fa-search absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              </div>
              <div>
                <select
                  value={studentFilterBlock}
                  onChange={(e) => setStudentFilterBlock(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                >
                  <option value="">All Blocks</option>
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block D">Block D</option>
                </select>
              </div>
              <div>
                <select
                  value={studentFilterGender}
                  onChange={(e) => setStudentFilterGender(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <select
                  value={studentFilterStatus}
                  onChange={(e) => setStudentFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Student Info</th>
                    <th className="px-6 py-4 text-left">Reg / Roll Number</th>
                    <th className="px-6 py-4 text-left">Room Details</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-center w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 flex items-center space-x-3 text-left">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {(student.fullName || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{student.fullName}</p>
                            <p className="text-[10px] text-gray-400">{student.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <p className="font-bold text-gray-800">{student.registerNumber}</p>
                          {student.rollNumber && (
                            <p className="text-[10px] text-gray-400">Roll: {student.rollNumber}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left">
                          {student.roomNumber ? (
                            <>
                              <p className="font-bold text-gray-800">{student.hostelName || 'Hostel'} – {student.roomNumber}</p>
                              <p className="text-[10px] text-gray-400">{student.block}, Floor {student.floor}, Bed {student.bedNumber}</p>
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Not Allocated</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left">
                          <button
                            onClick={() => toggleStudentStatus(student)}
                            title="Click to toggle status"
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              student.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${student.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            <span>{student.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => { setViewStudent(student); setShowStudentDetailsModal(true); }}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all"
                              title="View Profile Details"
                            >
                              <i className="fas fa-eye text-xs" />
                            </button>
                            <button
                              onClick={() => openStudentEditModal(student)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all"
                              title="Edit Student Account"
                            >
                              <i className="fas fa-pencil-alt text-xs" />
                            </button>
                            <button
                              onClick={() => openResetPasswordModal(student, 'student')}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all"
                              title="Reset Account Password"
                            >
                              <i className="fas fa-key text-xs" />
                            </button>
                            <button
                              onClick={() => { setStudentToDelete(student); setShowStudentDeleteModal(true); }}
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all"
                              title="Delete Account"
                            >
                              <i className="fas fa-trash-alt text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ── PANEL: WARDENS ────────────────────────────────────────────────── */}
        {activeTab === 'wardens' && (
          <div className="flex flex-col space-y-6 w-full text-left">
            
            {/* Header + Add Button Row */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 font-medium">Create Warden records, manage active status, and assign management blocks.</p>
              <button
                onClick={openWardenAddModal}
                className="bg-primary hover:bg-primary-light text-white text-xs font-bold py-3 px-5 rounded-xl shadow-sm hover:shadow flex items-center space-x-2 transition-all"
              >
                <i className="fas fa-plus" />
                <span>Add Warden</span>
              </button>
            </div>

            {/* Search & Filter bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  placeholder="Search Warden by Name, Employee ID, or Email..."
                  value={wardenSearch}
                  onChange={(e) => setWardenSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <i className="fas fa-search absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              </div>
              <div>
                <select
                  value={wardenFilterHostel}
                  onChange={(e) => setWardenFilterHostel(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                >
                  <option value="">All Hostels</option>
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                </select>
              </div>
              <div>
                <select
                  value={wardenFilterStatus}
                  onChange={(e) => setWardenFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Wardens Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Warden Info</th>
                    <th className="px-6 py-4 text-left">Employee ID</th>
                    <th className="px-6 py-4 text-left">Assigned Area</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-center w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {wardens.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">
                        No wardens found.
                      </td>
                    </tr>
                  ) : (
                    wardens.map((warden) => (
                      <tr key={warden._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 flex items-center space-x-3 text-left">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {(warden.fullName || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{warden.fullName}</p>
                            <p className="text-[10px] text-gray-400">{warden.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span className="font-bold text-gray-850">{warden.employeeId}</span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          {warden.assignedHostel ? (
                            <>
                              <p className="font-bold text-gray-800">{warden.assignedHostel}</p>
                              {warden.assignedBlocks && warden.assignedBlocks.length > 0 && (
                                <p className="text-[10px] text-gray-400">Blocks: {warden.assignedBlocks.join(', ')}</p>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left">
                          <button
                            onClick={() => toggleWardenStatus(warden)}
                            title="Click to toggle status"
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              warden.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${warden.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            <span>{warden.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => { setViewWarden(warden); setShowWardenDetailsModal(true); }}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all"
                              title="View Profile Details"
                            >
                              <i className="fas fa-eye text-xs" />
                            </button>
                            <button
                              onClick={() => openWardenEditModal(warden)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all"
                              title="Edit Warden Account"
                            >
                              <i className="fas fa-pencil-alt text-xs" />
                            </button>
                            <button
                              onClick={() => openResetPasswordModal(warden, 'warden')}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all"
                              title="Reset Account Password"
                            >
                              <i className="fas fa-key text-xs" />
                            </button>
                            <button
                              onClick={() => { setWardenToDelete(warden); setShowWardenDeleteModal(true); }}
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all"
                              title="Delete Account"
                            >
                              <i className="fas fa-trash-alt text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>

      {/* ── MODAL: STUDENT ADD / EDIT ───────────────────────────────────────── */}
      {showStudentAddEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 font-outfit">
                  {selectedStudent ? 'Modify Student Record' : 'Enroll New Student'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Provide register details and assign a secure bed profile.</p>
              </div>
              <button
                onClick={() => setShowStudentAddEditModal(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 border border-gray-250 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all focus:outline-none"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleStudentFormSubmit} className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              
              {/* Profile Fields */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Account details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Full Name *</label>
                    <input
                      type="text"
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Register Number *</label>
                    <input
                      type="text"
                      value={studentForm.registerNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, registerNumber: e.target.value })}
                      placeholder="e.g. 311520104001"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Roll Number (Optional)</label>
                    <input
                      type="text"
                      value={studentForm.rollNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                      placeholder="e.g. 20IT402"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Email Address *</label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      placeholder="john.doe@college.edu"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Phone Number *</label>
                    <input
                      type="text"
                      value={studentForm.phoneNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, phoneNumber: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Gender *</label>
                    <select
                      value={studentForm.gender}
                      onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Department *</label>
                    <input
                      type="text"
                      value={studentForm.department}
                      onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                      placeholder="e.g. Information Technology"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Year *</label>
                    <select
                      value={studentForm.year}
                      onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="">Select Year</option>
                      <option value="I">I Year</option>
                      <option value="II">II Year</option>
                      <option value="III">III Year</option>
                      <option value="IV">IV Year</option>
                    </select>
                  </div>
                  {!selectedStudent && (
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-bold text-gray-600">Temporary Password (optional)</label>
                      <input
                        type="text"
                        value={studentForm.temporaryPassword}
                        onChange={(e) => setStudentForm({ ...studentForm, temporaryPassword: e.target.value })}
                        placeholder="Leave blank to auto-generate"
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-amber-50/30 focus:bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Parents Details */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Guardian & Emergency Contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Parent/Guardian Name</label>
                    <input
                      type="text"
                      value={studentForm.parentName}
                      onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                      placeholder="e.g. Richard Doe"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Parent Contact Number</label>
                    <input
                      type="text"
                      value={studentForm.parentContact}
                      onChange={(e) => setStudentForm({ ...studentForm, parentContact: e.target.value })}
                      placeholder="e.g. 9876501234"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Emergency Contact Number</label>
                    <input
                      type="text"
                      value={studentForm.emergencyContact}
                      onChange={(e) => setStudentForm({ ...studentForm, emergencyContact: e.target.value })}
                      placeholder="e.g. 9876598765"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Hostel Assignment */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Hostel & Room allocation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Hostel Name</label>
                    <input
                      type="text"
                      value={studentForm.hostelName}
                      onChange={(e) => setStudentForm({ ...studentForm, hostelName: e.target.value })}
                      placeholder="Boys / Girls Hostel"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Block</label>
                    <input
                      type="text"
                      value={studentForm.block}
                      onChange={(e) => setStudentForm({ ...studentForm, block: e.target.value })}
                      placeholder="A / B / C Block"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Floor</label>
                    <input
                      type="text"
                      value={studentForm.floor}
                      onChange={(e) => setStudentForm({ ...studentForm, floor: e.target.value })}
                      placeholder="e.g. 1 / 2"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Room Number</label>
                    <input
                      type="text"
                      value={studentForm.roomNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, roomNumber: e.target.value })}
                      placeholder="e.g. 101"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Bed Number</label>
                    <input
                      type="text"
                      value={studentForm.bedNumber}
                      onChange={(e) => setStudentForm({ ...studentForm, bedNumber: e.target.value })}
                      placeholder="e.g. B1 / B2"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Account status
                </h4>
                <div className="flex items-center space-x-6">
                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="studentStatus"
                      value="Active"
                      checked={studentForm.status === 'Active'}
                      onChange={() => setStudentForm({ ...studentForm, status: 'Active' })}
                      className="w-4.5 h-4.5 text-primary"
                    />
                    <span className="text-sm font-semibold text-gray-800">Active</span>
                  </label>
                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="studentStatus"
                      value="Inactive"
                      checked={studentForm.status === 'Inactive'}
                      onChange={() => setStudentForm({ ...studentForm, status: 'Inactive' })}
                      className="w-4.5 h-4.5 text-rose-600"
                    />
                    <span className="text-sm font-semibold text-gray-800">Inactive (Deactivated)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowStudentAddEditModal(false)}
                  className="px-6 py-3 border border-gray-250 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {selectedStudent ? 'Save Updates' : 'Enlist Student'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: WARDEN ADD / EDIT ────────────────────────────────────────── */}
      {showWardenAddEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 font-outfit">
                  {selectedWarden ? 'Modify Warden Details' : 'Enlist New Warden'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">Configure profile details and assign block authority.</p>
              </div>
              <button
                onClick={() => setShowWardenAddEditModal(false)}
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 border border-gray-250 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all focus:outline-none"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleWardenFormSubmit} className="p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
              
              {/* Profile Details */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Account Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Full Name *</label>
                    <input
                      type="text"
                      value={wardenForm.fullName}
                      onChange={(e) => setWardenForm({ ...wardenForm, fullName: e.target.value })}
                      placeholder="e.g. Robert Smith"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Employee ID *</label>
                    <input
                      type="text"
                      value={wardenForm.employeeId}
                      onChange={(e) => setWardenForm({ ...wardenForm, employeeId: e.target.value })}
                      placeholder="e.g. EMP4002"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Gender *</label>
                    <select
                      value={wardenForm.gender}
                      onChange={(e) => setWardenForm({ ...wardenForm, gender: e.target.value })}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Email Address *</label>
                    <input
                      type="email"
                      value={wardenForm.email}
                      onChange={(e) => setWardenForm({ ...wardenForm, email: e.target.value })}
                      placeholder="warden.rs@college.edu"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Phone Number *</label>
                    <input
                      type="text"
                      value={wardenForm.phoneNumber}
                      onChange={(e) => setWardenForm({ ...wardenForm, phoneNumber: e.target.value })}
                      placeholder="e.g. 9845012345"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  {!selectedWarden && (
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-bold text-gray-600">Temporary Password (optional)</label>
                      <input
                        type="text"
                        value={wardenForm.temporaryPassword}
                        onChange={(e) => setWardenForm({ ...wardenForm, temporaryPassword: e.target.value })}
                        placeholder="Leave blank to auto-generate"
                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-amber-50/30 focus:bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Area Assignment */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Management Area Assignment
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Assigned Hostel</label>
                    <select
                      value={wardenForm.assignedHostel}
                      onChange={(e) => setWardenForm({ ...wardenForm, assignedHostel: e.target.value })}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="">Select Hostel</option>
                      <option value="Boys Hostel">Boys Hostel</option>
                      <option value="Girls Hostel">Girls Hostel</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Assigned Block(s) (Comma separated)</label>
                    <input
                      type="text"
                      value={wardenForm.assignedBlocks}
                      onChange={(e) => setWardenForm({ ...wardenForm, assignedBlocks: e.target.value })}
                      placeholder="e.g. Block A, Block B"
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Account Status
                </h4>
                <div className="flex items-center space-x-6">
                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="wardenStatus"
                      value="Active"
                      checked={wardenForm.status === 'Active'}
                      onChange={() => setWardenForm({ ...wardenForm, status: 'Active' })}
                      className="w-4.5 h-4.5 text-primary"
                    />
                    <span className="text-sm font-semibold text-gray-800">Active</span>
                  </label>
                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="wardenStatus"
                      value="Inactive"
                      checked={wardenForm.status === 'Inactive'}
                      onChange={() => setWardenForm({ ...wardenForm, status: 'Inactive' })}
                      className="w-4.5 h-4.5 text-rose-600"
                    />
                    <span className="text-sm font-semibold text-gray-800">Inactive (Deactivated)</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowWardenAddEditModal(false)}
                  className="px-6 py-3 border border-gray-250 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {selectedWarden ? 'Save Updates' : 'Enlist Warden'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD ────────────────────────────────────────────── */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Reset Password</h3>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">
                You are resetting the password for <strong>{resetUserName}</strong> ({resetUserRole}). Enter a new temporary password:
              </p>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-gray-600">Temporary Password *</label>
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 border border-gray-250 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: STUDENT DETAILS ──────────────────────────────────────────── */}
      {showStudentDetailsModal && viewStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Student Profile Details</h3>
              <button
                onClick={() => { setViewStudent(null); setShowStudentDetailsModal(false); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {viewStudent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{viewStudent.fullName}</h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    viewStudent.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {viewStudent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Register Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.registerNumber}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Roll Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.rollNumber || 'N/A'}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-gray-800">{viewStudent.email}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.phoneNumber}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Department</p>
                  <p className="font-semibold text-gray-800">{viewStudent.department || 'N/A'}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Year</p>
                  <p className="font-semibold text-gray-800">{viewStudent.year || 'N/A'} Year</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender</p>
                  <p className="font-semibold text-gray-800">{viewStudent.gender}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Parent/Guardian</p>
                  <p className="font-semibold text-gray-800">{viewStudent.parentName || 'N/A'} ({viewStudent.parentContact || 'N/A'})</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Emergency Contact</p>
                  <p className="font-semibold text-gray-800">{viewStudent.emergencyContact || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hostel & Room Assignment</h5>
                {viewStudent.roomNumber ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide">Hostel</p>
                      <p className="font-bold text-gray-800">{viewStudent.hostelName}</p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide">Block</p>
                      <p className="font-bold text-gray-800">{viewStudent.block}</p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide">Room</p>
                      <p className="font-bold text-gray-800">{viewStudent.roomNumber}</p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-xl">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide">Bed</p>
                      <p className="font-bold text-gray-800">{viewStudent.bedNumber}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-xs">No active room allocation details.</span>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => { setViewStudent(null); setShowStudentDetailsModal(false); }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: WARDEN DETAILS ───────────────────────────────────────────── */}
      {showWardenDetailsModal && viewWarden && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Warden Profile Details</h3>
              <button
                onClick={() => { setViewWarden(null); setShowWardenDetailsModal(false); }}
                className="text-gray-400 hover:text-gray-700"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                  {viewWarden.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{viewWarden.fullName}</h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    viewWarden.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {viewWarden.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Employee ID</p>
                  <p className="font-semibold text-gray-800">{viewWarden.employeeId}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender</p>
                  <p className="font-semibold text-gray-800">{viewWarden.gender}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl col-span-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-gray-800">{viewWarden.email}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold text-gray-800">{viewWarden.phoneNumber}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assigned Hostel</p>
                  <p className="font-semibold text-gray-800">{viewWarden.assignedHostel || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Managed Block(s)</p>
                <p className="text-sm font-semibold text-gray-800">
                  {viewWarden.assignedBlocks && viewWarden.assignedBlocks.length > 0
                    ? viewWarden.assignedBlocks.join(', ')
                    : 'No blocks assigned'}
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => { setViewWarden(null); setShowWardenDetailsModal(false); }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM STUDENT DELETE ────────────────────────────────────── */}
      {showStudentDeleteModal && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 text-xl mx-auto">
                <i className="fas fa-exclamation-triangle" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-outfit">Delete Student Profile?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to permanently delete the profile of <strong>{studentToDelete.fullName}</strong> ({studentToDelete.registerNumber})? This will automatically release their room allocation and cannot be undone.
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  onClick={() => { setStudentToDelete(null); setShowStudentDeleteModal(false); }}
                  className="px-5 py-2.5 border border-gray-250 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStudent}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM WARDEN DELETE ─────────────────────────────────────── */}
      {showWardenDeleteModal && wardenToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 text-xl mx-auto">
                <i className="fas fa-exclamation-triangle" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-outfit">Delete Warden Profile?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to permanently delete the profile of <strong>{wardenToDelete.fullName}</strong> ({wardenToDelete.employeeId})? This action cannot be undone.
              </p>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  onClick={() => { setWardenToDelete(null); setShowWardenDeleteModal(false); }}
                  className="px-5 py-2.5 border border-gray-250 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWarden}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREDENTIALS DELIVERY DIALOG ──────────────────────────────── */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 p-8 text-center space-y-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-2xl mx-auto">
              <i className="fas fa-check-circle" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-900 font-outfit">Account Created Successfully</h3>
              <p className="text-xs text-gray-400 mt-1">Copy and share these temporary login credentials with the user.</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left space-y-3 font-mono text-sm relative">
              <button
                type="button"
                onClick={() => {
                  const text = `HostelHub Credentials\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  showToastMsg('Credentials copied to clipboard!');
                }}
                className="absolute right-4 top-4 text-gray-400 hover:text-primary transition-colors outline-none"
                title="Copy Credentials"
              >
                <i className="fas fa-copy text-base" />
              </button>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Role</span>
                <span className="font-semibold text-gray-800 capitalize font-sans">{createdCredentials.role}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Name</span>
                <span className="font-semibold text-gray-800 font-sans">{createdCredentials.name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Email</span>
                <span className="text-gray-800 font-sans">{createdCredentials.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Temporary Password</span>
                <span className="text-amber-600 font-bold font-sans">{createdCredentials.password}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => {
                  const text = `HostelHub Credentials\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.password}`;
                  navigator.clipboard.writeText(text);
                  showToastMsg('Credentials copied to clipboard!');
                }}
                className="w-full bg-primary hover:bg-primary-light text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 shadow transition-all outline-none"
              >
                <i className="fas fa-copy" />
                <span>Copy Credentials</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-750 font-bold text-xs py-3 rounded-xl transition outline-none"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
