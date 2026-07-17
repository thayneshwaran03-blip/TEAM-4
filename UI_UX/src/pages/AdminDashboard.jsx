import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function AdminDashboard({ user, onLogout }) {
  const name = user ? user.fullName : 'System Admin';
  const role = user ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Administrator';
  const initials = user ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SA';

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);

  // ── Validation Errors ────────────────────────────────────────────────────
  const [studentErrors, setStudentErrors] = useState({});
  const [wardenErrors, setWardenErrors] = useState({});

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Navigation Items ─────────────────────────────────────────────────────
  const navItems = [
    { icon: 'fa-th-large', label: 'Dashboard', tab: 'dashboard' },
    { icon: 'fa-user-graduate', label: 'Student Management', tab: 'students' },
    { icon: 'fa-user-tie', label: 'Warden Management', tab: 'wardens' },
    { icon: 'fa-calendar-check', label: 'Leave Requests', tab: 'leaves' },
    { icon: 'fa-exclamation-triangle', label: 'Complaints', tab: 'complaints' },
    { icon: 'fa-address-book', label: 'Visitor Management', tab: 'visitors' },
    { icon: 'fa-bullhorn', label: 'Announcements', tab: 'announcements' },
    { icon: 'fa-chart-pie', label: 'Occupancy Reports', tab: 'occupancy_reports' },
  ];

  // ── Shared Refs for Outside Clicks ────────────────────────────────────────
  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ── Common API helper ─────────────────────────────────────────────────────
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const apiFetch = async (path, opts = {}) => {
    const token = localStorage.getItem('token');
    const headers = {};
    // Only add Content-Type when there is a request body
    if (opts.body) headers['Content-Type'] = 'application/json';
    Object.assign(headers, opts.headers || {});
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}/api${path}`, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      const text = await res.text();
      // On 401 (token expired) or 403 (wrong role) → force re-login
      if (res.status === 401 || res.status === 403) {
        if (typeof window.__forceLogout === 'function') {
          window.__forceLogout();
        }
      }
      throw new Error(`${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  };


  // ── Student / Warden / Room API State ─────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilterBlock, setStudentFilterBlock] = useState('');
  const [studentFilterHostel, setStudentFilterHostel] = useState('');
  const [studentFilterStatus, setStudentFilterStatus] = useState('');

  const [wardens, setWardens] = useState([]);
  const [wardenSearch, setWardenSearch] = useState('');
  const [wardenFilterHostel, setWardenFilterHostel] = useState('');
  const [wardenFilterStatus, setWardenFilterStatus] = useState('');

  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomFilterBlock, setRoomFilterBlock] = useState('');
  const [roomFilterStatus, setRoomFilterStatus] = useState('');

  // Derived state for dynamic dropdowns
  const uniqueHostels = [...new Set(rooms.map(r => r.hostelName).filter(Boolean))].sort();
  const uniqueBlocks = [...new Set(rooms.map(r => r.blockName).filter(Boolean))].sort();
  const uniqueFloors = [...new Set(rooms.map(r => r.floorNumber).filter(Boolean))].sort();

  // Leaves / Complaints / Visitors / Announcements UI States
  const [leaveSearch, setLeaveSearch] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');
  const [visitorSearch, setVisitorSearch] = useState('');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [leavesPage, setLeavesPage] = useState(1);
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState([]);
  const [notifications, setNotifications] = useState([
    { _id: 'n1', title: 'New leave request', message: 'Alex Mercer submitted a leave request.', type: 'Leave', read: false },
    { _id: 'n2', title: 'Electrical complaint', message: 'Tap leakage reported in Block B.', type: 'Complaint', read: true }
  ]);

  // ── Modals State ─────────────────────────────────────────────────────────
  const [showStudentAddEditModal, setShowStudentAddEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    fullName: '', registerNumber: '', rollNumber: '', email: '', phoneNumber: '',
    department: '', year: '', gender: '', parentName: '', parentContact: '',
    hostelName: '', block: '', floor: '', roomNumber: '', bedNumber: '',
    emergencyContact: '', status: 'Active', temporaryPassword: ''
  });

  const [showWardenAddEditModal, setShowWardenAddEditModal] = useState(false);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [wardenForm, setWardenForm] = useState({
    fullName: '', employeeId: '', email: '', phoneNumber: '', gender: '',
    assignedHostel: '', assignedBlocks: '', status: 'Active', temporaryPassword: ''
  });

  const [showRoomAddModal, setShowRoomAddModal] = useState(false);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '', blockName: '', floorNumber: '', capacity: 4, status: 'Available'
  });

  const [showHostelAddModal, setShowHostelAddModal] = useState(false);
  const [hostelForm, setHostelForm] = useState({
    name: '', blockCount: 1, floorCount: 2, capacity: 48, warden: ''
  });

  const [showAnnAddEditModal, setShowAnnAddEditModal] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [annForm, setAnnForm] = useState({
    title: '', description: '', priority: 'Normal', visibleTo: 'all', pinned: false
  });

  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [showWardenDetailsModal, setShowWardenDetailsModal] = useState(false);
  const [viewWarden, setViewWarden] = useState(null);

  const [showStudentDeleteModal, setShowStudentDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showWardenDeleteModal, setShowWardenDeleteModal] = useState(false);
  const [wardenToDelete, setWardenToDelete] = useState(null);

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserRole, setResetUserRole] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [newTempPassword, setNewTempPassword] = useState('');

  const [createdCredentials, setCreatedCredentials] = useState(null);

  // States for On-the-Spot Visitor Registration
  const [onSpotStudentId, setOnSpotStudentId] = useState('');
  const [onSpotVisitorName, setOnSpotVisitorName] = useState('');
  const [onSpotRelationship, setOnSpotRelationship] = useState('');
  const [onSpotPhoneNumber, setOnSpotPhoneNumber] = useState('');
  const [onSpotVisitDate, setOnSpotVisitDate] = useState('');
  const [onSpotPurpose, setOnSpotPurpose] = useState('');

  // ── Realistic Mock Data (Hostels, Leaves, Complaints, Visitors) ───────────
  const [hostels, setHostels] = useState([
    { _id: 'h1', name: 'Boys Hostel', blockCount: 4, floorCount: 2, roomCount: 32, capacity: 128, occupiedBeds: 96, availableBeds: 32, status: 'Active', warden: 'Thayaneshwaran s' },
    { _id: 'h2', name: 'Girls Hostel', blockCount: 4, floorCount: 2, roomCount: 32, capacity: 128, occupiedBeds: 80, availableBeds: 48, status: 'Active', warden: 'Devaroopa' }
  ]);

  const [leaves, setLeaves] = useState([
    { _id: 'l1', student: { fullName: 'Alex Mercer', registerNumber: '731520104001', department: 'IT', year: 'III', gender: 'Male' }, leaveType: 'Weekend Outing', fromDate: '2026-07-02', toDate: '2026-07-04', reason: 'Going home for family function', status: 'Pending', roomNumber: '101', block: 'Block A', floor: '1', hostelName: 'Boys Hostel' },
    { _id: 'l2', student: { fullName: 'Samritha', registerNumber: '73152413701', department: 'CSE', year: 'II', gender: 'Female' }, leaveType: 'Sick Leave', fromDate: '2026-06-29', toDate: '2026-07-01', reason: 'Medical appointment', status: 'Approved', roomNumber: '105', block: 'Block C', floor: '1', hostelName: 'Girls Hostel' },
    { _id: 'l3', student: { fullName: 'Thayaneshwaran s', registerNumber: '73152413045', department: 'ECE', year: 'IV', gender: 'Male' }, leaveType: 'Emergency Leave', fromDate: '2026-06-30', toDate: '2026-07-05', reason: 'Family medical issue', status: 'Pending', roomNumber: '204', block: 'Block B', floor: '2', hostelName: 'Boys Hostel' },
  ]);

  const [complaints, setComplaints] = useState([
    { _id: 'c1', student: { fullName: 'Alex Mercer', roomNumber: '101', block: 'Block A', department: 'IT', year: 'III', gender: 'Male' }, category: 'Electrical', title: 'Fan not working', description: 'Fan in room 101 has stopped spinning.', priority: 'High', status: 'Pending', createdAt: '2026-06-29', hostelName: 'Boys Hostel', floor: '1' },
    { _id: 'c2', student: { fullName: 'Thayaneshwaran s', roomNumber: '204', block: 'Block B', department: 'ECE', year: 'IV', gender: 'Male' }, category: 'Plumbing', title: 'Tap leakage', description: 'Bathroom tap is dripping constantly.', priority: 'Medium', status: 'In Progress', createdAt: '2026-06-28', hostelName: 'Boys Hostel', floor: '2' },
    { _id: 'c3', student: { fullName: 'Samritha', roomNumber: '105', block: 'Block C', department: 'CSE', year: 'II', gender: 'Female' }, category: 'Internet', title: 'WiFi disconnected', description: 'No internet access in block C room 105.', priority: 'High', status: 'Resolved', createdAt: '2026-06-27', hostelName: 'Girls Hostel', floor: '1' },
  ]);

  const [visitors, setVisitors] = useState([
    { _id: 'v1', student: { fullName: 'Alex Mercer', roomNumber: '101', block: 'Block A', hostelName: 'Boys Hostel', floor: '1' }, visitorName: 'Robert Mercer', relationship: 'Father', phoneNumber: '9876543210', visitDate: '2026-07-01', expectedArrivalTime: '10:00 AM', status: 'Pending' },
    { _id: 'v2', student: { fullName: 'Samritha', roomNumber: '105', block: 'Block C', hostelName: 'Girls Hostel', floor: '1' }, visitorName: 'Priya Bala', relationship: 'Mother', phoneNumber: '9876543211', visitDate: '2026-06-30', expectedArrivalTime: '02:00 PM', status: 'Approved' },
  ]);

  // ── Occupancy Reports State ──────────────────────────────────────────────
  const [reportSearch, setReportSearch] = useState('');
  const [reportHostel, setReportHostel] = useState('');
  const [reportBlock, setReportBlock] = useState('');
  const [reportFloor, setReportFloor] = useState('');
  const [reportStatus, setReportStatus] = useState('');

  const [sortField, setSortField] = useState('roomNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [reportHostel, reportBlock, reportFloor, reportStatus, reportSearch]);

  // Static/Mock Database of Rooms for Occupancy Report (Extends real API data when loaded)
  const [occupancyData, setOccupancyData] = useState([
    { hostelName: 'Boys Hostel', block: 'Block A', floor: '1', roomNumber: '101', capacity: 4, occupiedBeds: 3, availableBeds: 1, status: 'Available', warden: 'Thayaneshwaran s', gender: 'Male', dept: 'IT', year: 'III' },
    { hostelName: 'Boys Hostel', block: 'Block A', floor: '1', roomNumber: '102', capacity: 4, occupiedBeds: 4, availableBeds: 0, status: 'Occupied', warden: 'Thayaneshwaran s', gender: 'Male', dept: 'CSE', year: 'II' },
    { hostelName: 'Boys Hostel', block: 'Block B', floor: '2', roomNumber: '204', capacity: 4, occupiedBeds: 2, availableBeds: 2, status: 'Available', warden: 'Thayaneshwaran s', gender: 'Male', dept: 'ECE', year: 'IV' },
    { hostelName: 'Girls Hostel', block: 'Block C', floor: '1', roomNumber: '105', capacity: 4, occupiedBeds: 4, availableBeds: 0, status: 'Occupied', warden: 'Devaroopa', gender: 'Female', dept: 'CSE', year: 'II' },
    { hostelName: 'Girls Hostel', block: 'Block D', floor: '1', roomNumber: '106', capacity: 4, occupiedBeds: 0, availableBeds: 4, status: 'Available', warden: 'Devaroopa', gender: 'Female', dept: 'IT', year: 'I' },
    { hostelName: 'Girls Hostel', block: 'Block D', floor: '2', roomNumber: '210', capacity: 4, occupiedBeds: 1, availableBeds: 3, status: 'Available', warden: 'Devaroopa', gender: 'Female', dept: 'EEE', year: 'III' }
  ]);

  // ── Settings States ──────────────────────────────────────────────────────
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const submitPw = (e) => {
    e.preventDefault();
    if (!oldPw || !newPw || !confirmPw) {
      showToastMsg('Please fill all password fields.', 'error');
      return;
    }
    if (newPw.length < 6) {
      showToastMsg('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPw !== confirmPw) {
      showToastMsg('Passwords do not match.', 'error');
      return;
    }
    showToastMsg('Administrator password changed successfully!');
    setOldPw('');
    setNewPw('');
    setConfirmPw('');
  };

  // ── Fetch Operations ───────────────────────────────────────────────────────
  const fetchStudents = async () => {
    try {
      const searchParam = studentSearch ? `&search=${encodeURIComponent(studentSearch)}` : '';
      const blockParam = studentFilterBlock ? `&block=${encodeURIComponent(studentFilterBlock)}` : '';
      const hostelParam = studentFilterHostel ? `&hostel=${encodeURIComponent(studentFilterHostel)}` : '';
      const statusParam = studentFilterStatus ? `&status=${encodeURIComponent(studentFilterStatus)}` : '';

      const data = await apiFetch(`/admin/students?${searchParam}${blockParam}${hostelParam}${statusParam}`);
      if (data.success) {
        setStudents(data.students);
        return data.students;
      }
    } catch (err) {
      console.error('Fetch Students Error:', err);
    }
    return [];
  };

  const fetchWardens = async () => {
    try {
      const searchParam = wardenSearch ? `&search=${encodeURIComponent(wardenSearch)}` : '';
      const hostelParam = wardenFilterHostel ? `&assignedHostel=${encodeURIComponent(wardenFilterHostel)}` : '';
      const statusParam = wardenFilterStatus ? `&status=${encodeURIComponent(wardenFilterStatus)}` : '';

      const data = await apiFetch(`/admin/wardens?${searchParam}${hostelParam}${statusParam}`);
      if (data.success) {
        setWardens(data.wardens);
        return data.wardens;
      }
    } catch (err) {
      console.error('Fetch Wardens Error:', err);
    }
    return [];
  };

  const fetchRooms = async () => {
    try {
      const searchParam = roomSearch ? `?search=${encodeURIComponent(roomSearch)}` : '';
      const data = await apiFetch(`/admin/rooms${searchParam}`);
      if (data.success) {
        setRooms(data.rooms);
        return data.rooms;
      }
    } catch (err) {
      console.error('Fetch Rooms Error:', err);
      // Fallback dummy rooms if not found
      setRooms([
        { _id: 'r1', roomNumber: '101', blockName: 'Block A', floorNumber: '1', capacity: 4, occupiedBeds: 3, status: 'Available', assignedStudents: [] },
        { _id: 'r2', roomNumber: '102', blockName: 'Block A', floorNumber: '1', capacity: 4, occupiedBeds: 4, status: 'Occupied', assignedStudents: [] },
        { _id: 'r3', roomNumber: '204', blockName: 'Block B', floorNumber: '2', capacity: 4, occupiedBeds: 2, status: 'Available', assignedStudents: [] },
        { _id: 'r4', roomNumber: '105', blockName: 'Block C', floorNumber: '1', capacity: 4, occupiedBeds: 4, status: 'Occupied', assignedStudents: [] }
      ]);
    }
    return [];
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await apiFetch('/admin/announcements');
      if (data.success) {
        setAnnouncements(data.announcements);
        return data.announcements;
      }
    } catch (err) {
      console.error('Fetch Announcements Error:', err);
      setAnnouncements([
        { _id: 'a1', title: 'Hostel Maintenance Schedule', description: 'Block A maintenance will occur this weekend. Water supply will be limited from 9 AM to 1 PM.', priority: 'High', visibleTo: 'all', pinned: true, createdAt: '2026-06-29' },
        { _id: 'a2', title: 'Curfew Timing Notice', description: 'All students must be inside the hostel gates by 9:00 PM starting tomorrow.', priority: 'Normal', visibleTo: 'student', pinned: false, createdAt: '2026-06-28' }
      ]);
    }
    return [];
  };

  const fetchLeaves = async () => {
    try {
      const data = await apiFetch('/admin/leaves');
      if (data.success) {
        setLeaves(data.leaveRequests);
        return data.leaveRequests;
      }
    } catch (err) {
      console.error('Fetch Leaves Error:', err);
    }
    return [];
  };

  const fetchComplaints = async () => {
    try {
      const data = await apiFetch('/admin/complaints');
      if (data.success) {
        setComplaints(data.complaints);
        return data.complaints;
      }
    } catch (err) {
      console.error('Fetch Complaints Error:', err);
    }
    return [];
  };

  const fetchVisitors = async () => {
    try {
      const data = await apiFetch('/admin/visitors');
      if (data.success) {
        setVisitors(data.visitorRequests);
        return data.visitorRequests;
      }
    } catch (err) {
      console.error('Fetch Visitors Error:', err);
    }
    return [];
  };

  const fetchStats = (
    studentData = students,
    wardenData = wardens,
    roomData = rooms,
    leaveData = leaves,
    complaintData = complaints,
    visitorData = visitors,
    announcementData = announcements
  ) => {
    const studentCount = Array.isArray(studentData) ? studentData.length : 0;
    const wardenCount = Array.isArray(wardenData) ? wardenData.length : 0;
    const roomCount = Array.isArray(roomData) ? roomData.length : 0;
    const pendingLeaves = Array.isArray(leaveData) ? leaveData.filter(l => l.status === 'Pending').length : 0;
    const pendingComplaints = Array.isArray(complaintData) ? complaintData.filter(c => c.status === 'Pending' || c.status === 'Open').length : 0;
    const visitorsCount = Array.isArray(visitorData) ? visitorData.length : 0;
    const activeAnnouncementsCount = Array.isArray(announcementData) ? announcementData.length : 0;

    let occupiedBeds = 0;
    if (Array.isArray(roomData) && roomData.length > 0) {
      roomData.forEach(r => occupiedBeds += (r.occupiedBeds || 0));
    }

    setStats([
      { icon: 'fa-users', label: 'Total Students', value: studentCount.toString(), colorBg: 'bg-blue-50 text-blue-600', tab: 'students' },
      { icon: 'fa-user-tie', label: 'Total Wardens', value: wardenCount.toString(), colorBg: 'bg-amber-50 text-amber-600', tab: 'wardens' },
      { icon: 'fa-envelope-open-text', label: 'Pending Leaves', value: pendingLeaves.toString(), colorBg: 'bg-orange-50 text-orange-600', tab: 'leaves' },
      { icon: 'fa-exclamation-circle', label: 'Active Complaints', value: pendingComplaints.toString(), colorBg: 'bg-red-50 text-red-600', tab: 'complaints' },
      { icon: 'fa-address-card', label: 'Visitors Today', value: visitorsCount.toString(), colorBg: 'bg-indigo-50 text-indigo-600', tab: 'visitors' },
      { icon: 'fa-bullhorn', label: 'Active Announcements', value: activeAnnouncementsCount.toString(), colorBg: 'bg-yellow-50 text-yellow-600', tab: 'announcements' }
    ]);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [studentsData, wardensData, roomsData, announcementsData, leavesData, complaintsData, visitorsData] = await Promise.all([
          fetchStudents(),
          fetchWardens(),
          fetchRooms(),
          fetchAnnouncements(),
          fetchLeaves(),
          fetchComplaints(),
          fetchVisitors()
        ]);

        fetchStats(studentsData, wardensData, roomsData, leavesData, complaintsData, visitorsData, announcementsData);
      } catch (err) {
        console.error('Load Dashboard Data Error:', err);
      }
    };

    loadDashboardData();
  }, [studentSearch, studentFilterBlock, studentFilterHostel, studentFilterStatus, wardenSearch, wardenFilterHostel, wardenFilterStatus, roomSearch]);

  // ── Open Modals Handlers ──────────────────────────────────────────────────
  const openStudentAddModal = () => {
    setSelectedStudent(null);
    setStudentForm({
      fullName: '', registerNumber: '', rollNumber: '', email: '', phoneNumber: '',
      department: '', year: '', gender: '', parentName: '', parentContact: '',
      hostelName: '', block: '', floor: '', roomNumber: '', bedNumber: '',
      emergencyContact: '', status: 'Active', temporaryPassword: ''
    });
    setStudentErrors({});
    setShowStudentAddEditModal(true);
  };

  const openStudentEditModal = (student) => {
    setSelectedStudent(student);
    const rawRoom = student.room?.roomNumber || student.roomNumber || '';
    const plainRoom = rawRoom.replace(/^\D+/, '');
    const inferredFloor = plainRoom ? (plainRoom.match(/^\d/) ? plainRoom[0] : '1') : '';
    setStudentForm({
      fullName: student.fullName,
      registerNumber: student.registerNumber,
      rollNumber: student.rollNumber || '',
      email: student.email,
      phoneNumber: student.phoneNumber,
      department: student.department || '',
      year: student.year || '',
      gender: student.gender || '',
      parentName: student.parentName || '',
      parentContact: student.parentContact || '',
      hostelName: student.hostelName || '',
      block: student.block || '',
      floor: student.floor || inferredFloor,
      roomNumber: plainRoom,
      bedNumber: student.bedNumber || '',
      emergencyContact: student.emergencyContact || '',
      status: student.isActive ? 'Active' : 'Inactive',
      temporaryPassword: ''
    });
    setStudentErrors({});
    setShowStudentAddEditModal(true);
  };

  const openWardenAddModal = () => {
    setSelectedWarden(null);
    setWardenForm({
      fullName: '', employeeId: '', email: '', phoneNumber: '', gender: '',
      assignedHostel: '', assignedBlocks: '', status: 'Active', temporaryPassword: ''
    });
    setWardenErrors({});
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
    setWardenErrors({});
    setShowWardenAddEditModal(true);
  };

  // ── Form Submissions (Student / Warden CRUD APIs) ─────────────────────────
  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    setStudentErrors({});

    const isCreate = !selectedStudent;
    const isPhoneRequired = !isCreate;

    if (!studentForm.fullName || !studentForm.registerNumber || !studentForm.email || (isPhoneRequired && !studentForm.phoneNumber) || !studentForm.gender) {
      const errs = {};
      if (!studentForm.fullName) errs.fullName = 'Full Name is required';
      if (!studentForm.registerNumber) errs.registerNumber = 'Register Number is required';
      if (!studentForm.email) errs.email = 'Email address is required';
      if (isPhoneRequired && !studentForm.phoneNumber) errs.phoneNumber = 'Phone Number is required';
      if (!studentForm.gender) errs.gender = 'Gender is required';
      setStudentErrors(errs);
      showToastMsg('All mandatory fields are required.', 'error');
      return;
    }

    try {
      const url = selectedStudent
        ? `/admin/students/${selectedStudent._id}`
        : `/admin/students`;
      const method = selectedStudent ? 'PUT' : 'POST';

      const payload = { ...studentForm };
      if (selectedStudent) {
        delete payload.temporaryPassword;
      }

      const data = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (data.success) {
        if (!selectedStudent) {
          setCreatedCredentials({
            role: 'student',
            name: data.student.fullName,
            email: data.student.email,
            password: data.temporaryPassword
          });
          showToastMsg(data.message || 'Student profile created successfully!');
        } else {
          showToastMsg('Student details updated successfully!');
        }
        setShowStudentAddEditModal(false);
        const refreshedStudents = await fetchStudents();
        fetchStats(refreshedStudents, wardens, rooms, leaves, complaints, visitors, announcements);
      } else {
        showToastMsg(data.message || 'Error occurred saving details.', 'error');
      }
    } catch (err) {
      const msg = err?.message || '';
      // Show the backend error text if available, else generic message
      const display = msg.includes(' - ') ? msg.split(' - ').slice(1).join(' - ') : 'Server connection failed. Please try again.';
      showToastMsg(display, 'error');
    }
  };

  const handleWardenFormSubmit = async (e) => {
    e.preventDefault();
    setWardenErrors({});

    if (!wardenForm.fullName || !wardenForm.employeeId || !wardenForm.email || !wardenForm.phoneNumber || !wardenForm.gender) {
      const errs = {};
      if (!wardenForm.fullName) errs.fullName = 'Full Name is required';
      if (!wardenForm.employeeId) errs.employeeId = 'Employee ID is required';
      if (!wardenForm.email) errs.email = 'Email address is required';
      if (!wardenForm.phoneNumber) errs.phoneNumber = 'Phone Number is required';
      if (!wardenForm.gender) errs.gender = 'Gender is required';
      setWardenErrors(errs);
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
        ? `/admin/wardens/${selectedWarden._id}`
        : `/admin/wardens`;
      const method = selectedWarden ? 'PUT' : 'POST';

      const data = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (data.success) {
        if (!selectedWarden) {
          setCreatedCredentials({
            role: 'warden',
            name: data.warden.fullName,
            email: data.warden.email,
            password: data.temporaryPassword
          });
          showToastMsg(data.message || 'Warden profile created successfully!');
        } else {
          showToastMsg('Warden details updated successfully!');
        }
        setShowWardenAddEditModal(false);
        const refreshedWardens = await fetchWardens();
        fetchStats(students, refreshedWardens, rooms, leaves, complaints, visitors, announcements);
      } else {
        showToastMsg(data.message || 'Validation error saving warden.', 'error');
      }
    } catch (err) {
      const msg = err?.message || '';
      const display = msg.includes(' - ') ? msg.split(' - ').slice(1).join(' - ') : 'Server connection failed. Please try again.';
      showToastMsg(display, 'error');
    }
  };


  const toggleStudentStatus = async (student) => {
    try {
      const newStatus = student.isActive ? 'Inactive' : 'Active';
      const data = await apiFetch(`/admin/students/${student._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (data.success) {
        showToastMsg(`Student status toggled to ${newStatus}.`);
        fetchStudents();
      }
    } catch (err) {
      showToastMsg('Failed to toggle status.', 'error');
    }
  };

  const toggleWardenStatus = async (warden) => {
    try {
      const newStatus = warden.isActive ? 'Inactive' : 'Active';
      const data = await apiFetch(`/admin/wardens/${warden._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (data.success) {
        showToastMsg(`Warden status toggled to ${newStatus}.`);
        fetchWardens();
      }
    } catch (err) {
      showToastMsg('Failed to toggle status.', 'error');
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const data = await apiFetch(`/admin/students/${studentToDelete._id}`, { method: 'DELETE' });
      if (data.success) {
        showToastMsg('Student profile permanently deleted.');
        setShowStudentDeleteModal(false);
        setStudentToDelete(null);
        const refreshedStudents = await fetchStudents();
        fetchStats(refreshedStudents, wardens, rooms, leaves, complaints, visitors, announcements);
      } else {
        showToastMsg(data.message || 'Deletion failed.', 'error');
      }
    } catch (err) {
      const msg = err?.message || '';
      const display = msg.includes(' - ') ? msg.split(' - ').slice(1).join(' - ') : 'Deletion failed. Please try again.';
      showToastMsg(display, 'error');
    }
  };

  const handleDeleteWarden = async () => {
    if (!wardenToDelete) return;
    try {
      const data = await apiFetch(`/admin/wardens/${wardenToDelete._id}`, { method: 'DELETE' });
      if (data.success) {
        showToastMsg('Warden profile permanently deleted.');
        setShowWardenDeleteModal(false);
        setWardenToDelete(null);
        const refreshedWardens = await fetchWardens();
        fetchStats(students, refreshedWardens, rooms, leaves, complaints, visitors, announcements);
      } else {
        showToastMsg(data.message || 'Deletion failed.', 'error');
      }
    } catch (err) {
      const msg = err?.message || '';
      const display = msg.includes(' - ') ? msg.split(' - ').slice(1).join(' - ') : 'Deletion failed. Please try again.';
      showToastMsg(display, 'error');
    }
  };

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
      showToastMsg('Password must be at least 6 characters.', 'error');
      return;
    }
    try {
      const url = resetUserRole === 'student'
        ? `/admin/students/${resetUserId}/reset-password`
        : `/admin/wardens/${resetUserId}/reset-password`;

      const data = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify({ temporaryPassword: newTempPassword.trim() })
      });
      if (data.success) {
        showToastMsg(`Password reset successfully for ${resetUserName}!`);
        setShowResetPasswordModal(false);
      }
    } catch (err) {
      showToastMsg('Failed to reset password.', 'error');
    }
  };

  // ── CRUD for Rooms / Hostels / Announcements ────────────────────────────
  const handleRoomAddSubmit = async (e) => {
    e.preventDefault();
    if (!roomForm.roomNumber || !roomForm.blockName || !roomForm.floorNumber) {
      showToastMsg('Please fill all room fields.', 'error');
      return;
    }
    try {
      const data = await apiFetch('/admin/rooms', {
        method: 'POST',
        body: JSON.stringify(roomForm)
      });
      if (data.success) {
        showToastMsg('Room added successfully!');
        setShowRoomAddModal(false);
        const refreshedRooms = await fetchRooms();
        fetchStats(students, wardens, refreshedRooms, leaves, complaints, visitors, announcements);
      }
    } catch (err) {
      // Offline fallback
      const newRoom = {
        _id: 'r' + (rooms.length + 1),
        roomNumber: roomForm.roomNumber,
        blockName: roomForm.blockName,
        floorNumber: roomForm.floorNumber,
        capacity: Number(roomForm.capacity),
        occupiedBeds: 0,
        status: roomForm.status,
        assignedStudents: []
      };
      setRooms([...rooms, newRoom]);
      // Also add to report database
      setOccupancyData([...occupancyData, {
        hostelName: 'Boys Hostel', block: roomForm.blockName, floor: roomForm.floorNumber, roomNumber: roomForm.roomNumber,
        capacity: Number(roomForm.capacity), occupiedBeds: 0, availableBeds: Number(roomForm.capacity), status: roomForm.status,
        warden: 'Thayaneshwaran s', gender: 'Male', dept: 'N/A', year: 'N/A'
      }]);
      showToastMsg('Room added (Local Session Saved).');
      setShowRoomAddModal(false);
    }
  };

  const handleHostelAddSubmit = (e) => {
    e.preventDefault();
    if (!hostelForm.name || !hostelForm.warden) {
      showToastMsg('Please fill all hostel fields.', 'error');
      return;
    }
    const newHostel = {
      _id: 'h' + (hostels.length + 1),
      name: hostelForm.name,
      blockCount: Number(hostelForm.blockCount),
      floorCount: Number(hostelForm.floorCount),
      roomCount: 12,
      capacity: Number(hostelForm.capacity),
      occupiedBeds: 0,
      availableBeds: Number(hostelForm.capacity),
      status: 'Active',
      warden: hostelForm.warden
    };
    setHostels([...hostels, newHostel]);
    showToastMsg('Hostel registered successfully!');
    setShowHostelAddModal(false);
  };

  const handleAnnSaveSubmit = async (e) => {
    e.preventDefault();
    if (!annForm.title || !annForm.description) {
      showToastMsg('Please fill all announcement fields.', 'error');
      return;
    }
    try {
      const url = selectedAnn ? `/admin/announcements/${selectedAnn._id}` : '/admin/announcements';
      const method = selectedAnn ? 'PUT' : 'POST';
      const data = await apiFetch(url, {
        method,
        body: JSON.stringify(annForm)
      });
      if (data.success) {
        showToastMsg(selectedAnn ? 'Announcement updated.' : 'Announcement posted successfully!');
        setShowAnnAddEditModal(false);
        fetchAnnouncements();
      }
    } catch (err) {
      // Offline fallback
      if (selectedAnn) {
        setAnnouncements(announcements.map(a => a._id === selectedAnn._id ? { ...a, ...annForm } : a));
        showToastMsg('Announcement updated.');
      } else {
        const newAnn = {
          _id: 'a' + (announcements.length + 1),
          title: annForm.title,
          description: annForm.description,
          priority: annForm.priority,
          visibleTo: annForm.visibleTo,
          pinned: annForm.pinned,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setAnnouncements([newAnn, ...announcements]);
        showToastMsg('Announcement posted.');
      }
      setShowAnnAddEditModal(false);
    }
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements(announcements.filter(a => a._id !== id));
    showToastMsg('Announcement deleted.');
  };

  const toggleAnnPin = (ann) => {
    setAnnouncements(announcements.map(a => a._id === ann._id ? { ...a, pinned: !a.pinned } : a));
    showToastMsg(ann.pinned ? 'Announcement unpinned.' : 'Announcement pinned to top.');
  };

  // ── Interactive Actions for Leave, Complaint, and Visitor Requests ──────
  const handleLeaveApproval = async (id, status) => {
    try {
      const action = status === 'Approved' ? 'approve' : 'reject';
      await apiFetch(`/admin/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });
      showToastMsg(`Leave request marked as ${status}.`);
      const refreshedLeaves = await fetchLeaves();
      fetchStats(students, wardens, rooms, refreshedLeaves, complaints, visitors, announcements);
    } catch (err) {
      console.error('Leave Approval Error:', err);
      showToastMsg('Failed to process leave approval.', 'error');
    }
  };

  const handleComplaintStatus = async (id, status) => {
    try {
      let action = 'accept';
      if (status === 'Resolved') action = 'resolve';
      if (status === 'Rejected') action = 'reject';
      await apiFetch(`/admin/complaints/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });
      showToastMsg(`Complaint status updated to ${status}.`);
      const refreshedComplaints = await fetchComplaints();
      fetchStats(students, wardens, rooms, leaves, refreshedComplaints, visitors, announcements);
    } catch (err) {
      console.error('Complaint Status Update Error:', err);
      showToastMsg('Failed to update complaint status.', 'error');
    }
  };

  const StatusBadge = ({ status }) => {
    const cfg = {
      Pending:     'bg-amber-50 text-amber-600',
      Approved:    'bg-green-50 text-green-600',
      Rejected:    'bg-red-50 text-red-600',
      'In Progress': 'bg-blue-50 text-blue-600',
      Resolved:    'bg-emerald-50 text-emerald-600',
      Active:      'bg-green-50 text-green-600',
      'On Leave':  'bg-orange-50 text-orange-600',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full font-semibold text-xs uppercase ${cfg[status] || 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    );
  };

  const PriorityBadge = ({ priority }) => {
    const cfg = {
      High:   'bg-red-50 text-red-600',
      Medium: 'bg-amber-50 text-amber-600',
      Low:    'bg-gray-100 text-gray-500',
      Normal: 'bg-blue-50 text-blue-600',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${cfg[priority] || 'bg-gray-100 text-gray-500'}`}>
        {priority}
      </span>
    );
  };

  const handleVisitorApproval = async (id, status) => {
    try {
      const action = status === 'Approved' ? 'approve' : 'reject';
      await apiFetch(`/admin/visitors/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action })
      });
      showToastMsg(`Visitor request ${status.toLowerCase()}d.`);
      const refreshedVisitors = await fetchVisitors();
      fetchStats(students, wardens, rooms, leaves, complaints, refreshedVisitors, announcements);
    } catch (err) {
      console.error('Visitor Approval Error:', err);
      showToastMsg('Failed to process visitor approval.', 'error');
    }
  };

  const handleRegisterVisitorOnSpot = async (e) => {
    e.preventDefault();
    if (!onSpotStudentId || !onSpotVisitorName || !onSpotRelationship || !onSpotPhoneNumber || !onSpotVisitDate) {
      showToastMsg('Please fill all required fields.', 'error');
      return;
    }

    try {
      const res = await apiFetch('/admin/visitors/on-the-spot', {
        method: 'POST',
        body: JSON.stringify({
          studentIdentifier: onSpotStudentId,
          visitorName: onSpotVisitorName,
          relationship: onSpotRelationship,
          phoneNumber: onSpotPhoneNumber,
          visitDate: onSpotVisitDate,
          purpose: onSpotPurpose
        })
      });

      if (res.success) {
        showToastMsg('Visitor registered successfully on the spot!');
        setOnSpotStudentId('');
        setOnSpotVisitorName('');
        setOnSpotRelationship('');
        setOnSpotPhoneNumber('');
        setOnSpotVisitDate('');
        setOnSpotPurpose('');
        const refreshedVisitors = await fetchVisitors();
        fetchStats(students, wardens, rooms, leaves, complaints, refreshedVisitors, announcements);
      } else {
        showToastMsg(res.message || 'Failed to register visitor.', 'error');
      }
    } catch (err) {
      showToastMsg(err.message || 'Server error', 'error');
    }
  };

  // ── Helper: Printing & Export Reports ────────────────────────────────────
  const exportOccupancyReportPDF = () => {
    const getAssignedWarden = () => {
      if (!reportBlock) return 'All Wardens';
      const cleanBlock = reportBlock.replace('Block ', '').trim();
      const assignedWarden = wardens.find(w => w.assignedBlocks && w.assignedBlocks.some(b => {
        const cleanB = b.trim();
        return cleanB === reportBlock || cleanB === cleanBlock;
      }));
      return assignedWarden ? assignedWarden.fullName : 'Not Assigned';
    };

    const warden = getAssignedWarden();
    const hostel = reportHostel || 'All Hostels';
    const block = reportBlock || 'All Blocks';
    const dateStr = new Date().toLocaleString();

    const reportRooms = sortedOccupancy;
    const totalBeds = reportRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
    const occupiedBeds = reportRooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';
    const totalRooms = reportRooms.length;
    const occupiedRooms = reportRooms.filter(r => r.occupiedBeds > 0).length;
    const vacantRooms = reportRooms.filter(r => r.occupiedBeds === 0).length;

    const tableRowsHtml = reportRooms.map(r => {
      const occupied = r.occupiedBeds || 0;
      const cap = r.capacity || 0;
      const avail = Math.max(0, cap - occupied);
      
      let status = 'OPEN';
      if (occupied >= cap) {
        status = 'FULL';
      } else if (occupied > 0) {
        status = 'PARTIAL';
      }
      
      const badgeClass = status.toLowerCase(); // open, full, partial
      
      return `
        <tr>
          <td style="font-weight: 600;">${r.roomNumber}</td>
          <td>${r.floor}</td>
          <td>${cap}</td>
          <td style="color: #1e3a8a; font-weight: 600;">${occupied}</td>
          <td style="color: #047857; font-weight: 600;">${avail}</td>
          <td>
            <span class="status-badge ${badgeClass}">${status}</span>
          </td>
        </tr>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>HostelHub - Occupancy Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary: #1e3a8a;
            --primary-dark: #172554;
            --primary-light: #f0f4ff;
            --success: #10b981;
            --success-dark: #047857;
            --success-light: #ecfdf5;
            --warning: #d97706;
            --warning-dark: #b45309;
            --warning-light: #fffbeb;
            --danger: #b91c1c;
            --danger-dark: #991b1b;
            --danger-light: #fef2f2;
            --gray-50: #f8fafc;
            --gray-150: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-600: #475569;
            --gray-900: #0f172a;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--gray-900);
            background-color: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm 10mm;
            box-sizing: border-box;
            position: relative;
          }

          /* Professional Header styling */
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 12px;
            margin-bottom: 20px;
          }

          .header-left h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: var(--primary-dark);
            letter-spacing: -0.5px;
          }

          .header-left p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: var(--gray-600);
            font-weight: 500;
          }

          .header-right {
            text-align: right;
          }

          .header-right .generated-date {
            font-size: 11px;
            color: var(--gray-600);
            font-weight: 600;
            background: var(--gray-150);
            padding: 6px 12px;
            border-radius: 8px;
          }

          /* Report Info Card */
          .info-card {
            background: var(--gray-50);
            border: 1px solid var(--gray-200);
            border-left: 5px solid var(--primary);
            border-radius: 10px;
            padding: 15px 20px;
            margin-bottom: 25px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }

          .info-item {
            display: flex;
            flex-direction: column;
          }

          .info-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--gray-600);
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .info-value {
            font-size: 12px;
            font-weight: 600;
            color: var(--gray-900);
          }

          /* KPI Stats Grid - 3 columns */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }

          .stat-card {
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            padding: 12px 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--primary);
          }
          
          .stat-card.available::before {
            background: var(--success);
          }
          
          .stat-card.rate::before {
            background: var(--success);
          }

          .stat-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--gray-600);
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }

          .stat-value {
            font-size: 18px;
            font-weight: 800;
            color: var(--primary-dark);
            margin: 0;
          }

          .stat-card.available .stat-value, 
          .stat-card.rate .stat-value {
            color: var(--success-dark);
          }

          /* Progress bar for rate */
          .progress-bar-container {
            width: 100%;
            height: 5px;
            background-color: var(--gray-150);
            border-radius: 9999px;
            margin-top: 8px;
            overflow: hidden;
          }

          .progress-bar {
            height: 100%;
            background-color: var(--success);
            border-radius: 9999px;
          }

          /* Table styling */
          .table-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--primary-dark);
            margin: 0 0 12px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 11px;
          }

          th {
            background-color: var(--primary);
            color: white;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border: 1px solid var(--primary);
            text-align: center;
          }

          td {
            padding: 9px 12px;
            border: 1px solid var(--gray-200);
            color: var(--gray-900);
            text-align: center;
          }

          tr:nth-child(even) {
            background-color: var(--gray-50);
          }

          /* Badges */
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            border: 1px solid transparent;
          }

          .status-badge.open {
            background-color: var(--success-light);
            color: var(--success-dark);
            border-color: #a7f3d0;
          }

          .status-badge.partial {
            background-color: var(--warning-light);
            color: var(--warning-dark);
            border-color: #fde68a;
          }

          .status-badge.full {
            background-color: var(--danger-light);
            color: var(--danger-dark);
            border-color: #fecaca;
          }

          /* Footer styling */
          .report-footer {
            position: fixed;
            bottom: -10mm;
            left: 0;
            right: 0;
            height: 10mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--gray-200);
            padding-top: 8px;
            font-size: 10px;
            color: var(--gray-600);
            font-weight: 500;
          }

          .footer-left {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .footer-left::before {
            content: '';
            display: inline-block;
            width: 6px;
            height: 6px;
            background-color: var(--primary);
            border-radius: 50%;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 20mm 15mm;
            }
            body {
              background-color: white;
            }
            .report-container {
              width: 100%;
              margin: 0;
              padding: 0;
            }
            /* Prevent breaks inside critical elements */
            .info-card, .stats-grid, tr {
              page-break-inside: avoid;
            }
            .page-number::after {
              content: counter(page);
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <header class="report-header">
            <div class="header-left">
              <h1>HostelHub - Occupancy Report</h1>
              <p>Centralized Hostel Management System</p>
            </div>
            <div class="header-right">
              <div class="generated-date">Generated: ${dateStr}</div>
            </div>
          </header>

          <section class="info-card">
            <div class="info-item">
              <span class="info-label">Warden Name</span>
              <span class="info-value">${warden}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Hostel</span>
              <span class="info-value">${hostel}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Assigned Block</span>
              <span class="info-value">${block}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date & Time</span>
              <span class="info-value">${dateStr}</span>
            </div>
          </section>

          <section class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Capacity</div>
              <div class="stat-value">${totalBeds} Beds</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Occupied Beds</div>
              <div class="stat-value">${occupiedBeds} Beds</div>
            </div>
            <div class="stat-card available">
              <div class="stat-label">Available Beds</div>
              <div class="stat-value">${availableBeds} Beds</div>
            </div>
            <div class="stat-card rate">
              <div class="stat-label">Occupancy Rate</div>
              <div class="stat-value">${occupancyRate}%</div>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${occupancyRate}%"></div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Occupied Rooms</div>
              <div class="stat-value">${occupiedRooms} Rooms</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Vacant Rooms</div>
              <div class="stat-value">${vacantRooms} Rooms</div>
            </div>
          </section>

          <h2 class="table-title">Detailed Occupancy List</h2>
          <table>
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Occupied Beds</th>
                <th>Available Beds</th>
                <th>Occupancy Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <footer class="report-footer">
            <div class="footer-left">Generated by HostelHub</div>
            <div class="footer-right">
              <span class="page-number"></span>
            </div>
          </footer>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Sort & Filter logic for Occupancy Reports ────────────────────────────
  const getHostelName = (blockName) => {
    if (!blockName) return 'Boys Hostel';
    const cleanBlock = blockName.trim().toUpperCase();
    if (cleanBlock.endsWith('C') || cleanBlock.endsWith('D') || cleanBlock === 'C' || cleanBlock === 'D') return 'Girls Hostel';
    return 'Boys Hostel';
  };

  const realOccupancyData = rooms.map(room => {
    const block = room.blockName || 'Block A';
    const floor = room.floorNumber || '1';
    const hostel = getHostelName(block);
    
    const assignedWarden = wardens.find(w => w.assignedBlocks && w.assignedBlocks.some(b => b === block || b === block.replace('Block ', '').trim()));
    const wardenName = assignedWarden ? assignedWarden.fullName : 'Not Assigned';
    
    return {
      _id: room._id || room.id,
      hostelName: hostel,
      block: block,
      floor: floor,
      roomNumber: room.roomNumber,
      capacity: room.capacity || 4,
      occupiedBeds: room.occupiedBeds || 0,
      availableBeds: Math.max(0, (room.capacity || 4) - (room.occupiedBeds || 0)),
      status: room.status || (room.occupiedBeds === 0 ? 'VACANT' : room.occupiedBeds >= (room.capacity || 4) ? 'FULL' : 'PARTIALLY OCCUPIED'),
      warden: wardenName,
      dept: room.assignedStudents && room.assignedStudents[0]?.department || 'N/A',
      year: room.assignedStudents && room.assignedStudents[0]?.year || 'N/A',
      updatedAt: room.updatedAt
    };
  });

  const filteredOccupancy = realOccupancyData.filter(item => {
    const searchMatch = reportSearch ? (
      item.roomNumber.includes(reportSearch) ||
      item.warden.toLowerCase().includes(reportSearch.toLowerCase())
    ) : true;
    const hostelMatch = reportHostel ? item.hostelName === reportHostel : true;
    const blockMatch = reportBlock ? item.block === reportBlock : true;
    const floorMatch = reportFloor ? item.floor === reportFloor : true;

    const statusMatch = reportStatus ? (
      reportStatus === 'Available' ? (item.status === 'Available' || item.status === 'VACANT' || item.status === 'PARTIALLY OCCUPIED') :
      reportStatus === 'Occupied' ? (item.status === 'Occupied' || item.status === 'FULL') :
      item.status === reportStatus
    ) : true;

    return searchMatch && hostelMatch && blockMatch && floorMatch && statusMatch;
  });

  const sortedOccupancy = [...filteredOccupancy].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? (valA - valB) : (valB - valA);
  });

  const paginatedOccupancy = sortedOccupancy.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedOccupancy.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-50 font-sans text-gray-800 overflow-x-hidden">

      {/* Toast Messages Overlay */}
      {toast && (
        <>
          <style>{`
            @keyframes toastFadeIn {
              from { opacity: 0; transform: translate3d(20px, -20px, 0) scale(0.95); }
              to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
            }
            .animate-toast-in {
              animation: toastFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className={`fixed top-6 right-6 z-[9999] flex items-center justify-between space-x-3 px-5 py-4 rounded-2xl shadow-2xl animate-toast-in transition-all duration-300 max-w-sm md:max-w-md ${toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
            }`}>
            <div className="flex items-center space-x-3">
              <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-lg`} />
              <span className="text-sm md:text-base font-medium">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-3 hover:opacity-85 transition-opacity p-1 text-white/95 hover:text-white focus:outline-none"
              title="Close Notification"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>
        </>
      )}

      {/* ── SIDEBAR — Premium collapsible design ──────────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 flex flex-col bg-white border-r border-gray-100/80 h-screen
          shadow-[1px_0_20px_rgba(0,0,0,0.04)]
          fixed lg:relative inset-y-0 left-0 z-50
          ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-[width,transform] duration-[280ms] ease-in-out
        `}
        style={{ width: isMobileDrawerOpen ? '256px' : (isSidebarExpanded ? '256px' : '72px') }}
      >
        {/* ── Header: Logo ────────────────────────────────────────────── */}
        <div
          className="flex items-center shrink-0 border-b border-gray-100"
          style={{ height: '64px', padding: '0 14px', justifyContent: isSidebarExpanded || isMobileDrawerOpen ? 'space-between' : 'center' }}
        >
          {/* Logo mark + wordmark */}
          <div className="flex items-center min-w-0 overflow-hidden text-left">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <i className="fas fa-home text-primary" style={{ fontSize: '15px' }} />
            </div>
            <span
              className="font-bold text-gray-900 tracking-tight select-none whitespace-nowrap transition-all duration-[280ms] ease-in-out overflow-hidden"
              style={{
                fontSize: '15px',
                marginLeft: isSidebarExpanded || isMobileDrawerOpen ? '10px' : '0px',
                maxWidth: isSidebarExpanded || isMobileDrawerOpen ? '140px' : '0px',
                opacity: isSidebarExpanded || isMobileDrawerOpen ? 1 : 0,
              }}
            >
              Hostel<span className="text-primary">Hub</span>
            </span>
          </div>

          {/* Mobile close ✕ */}
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 shrink-0"
          >
            <i className="fas fa-times" style={{ fontSize: '14px' }} />
          </button>
        </div>

        {/* ── Profile section ──────────────────────────────────────────── */}
        <div className="shrink-0">
          {/* EXPANDED profile card */}
          <div
            className="overflow-hidden transition-all duration-[280ms] ease-in-out"
            style={{
              maxHeight: isSidebarExpanded || isMobileDrawerOpen ? '150px' : '0px',
              opacity:   isSidebarExpanded || isMobileDrawerOpen ? 1 : 0,
              margin:    isSidebarExpanded || isMobileDrawerOpen ? '14px 12px 6px' : '0 12px',
            }}
          >
            <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 flex flex-col items-center text-center">
              <div
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-sm mb-2"
                style={{ fontSize: '15px' }}
              >
                {initials.charAt(0)}
              </div>
              <p className="font-semibold text-[#1F2937] leading-tight whitespace-nowrap" style={{ fontSize: '13px' }}>{name}</p>
              <span
                className="mt-1 px-2.5 py-0.5 bg-primary/10 text-primary font-bold uppercase rounded-full whitespace-nowrap"
                style={{ fontSize: '9px', letterSpacing: '0.08em' }}
              >
                {role}
              </span>
              <p className="mt-1 text-[#9CA3AF] whitespace-nowrap" style={{ fontSize: '10.5px', fontWeight: 500 }}>System Administrator</p>
            </div>
          </div>

          {/* COLLAPSED mini avatar */}
          <div
            className="flex justify-center transition-all duration-[280ms] ease-in-out overflow-hidden"
            style={{
              maxHeight: !isSidebarExpanded && !isMobileDrawerOpen ? '56px' : '0px',
              opacity:   !isSidebarExpanded && !isMobileDrawerOpen ? 1 : 0,
              paddingTop:    !isSidebarExpanded && !isMobileDrawerOpen ? '12px' : '0px',
              paddingBottom: !isSidebarExpanded && !isMobileDrawerOpen ? '4px' : '0px',
            }}
          >
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold"
              style={{ fontSize: '13px' }}
              title={name}
            >
              {initials.charAt(0)}
            </div>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1" style={{ padding: '6px 8px' }}>
          {navItems.map(item => {
            const active   = activeTab === item.tab;
            const expanded = isSidebarExpanded || isMobileDrawerOpen;
            return (
              <div key={item.tab} className="relative group">
                <button
                  onClick={() => {
                    setActiveTab(item.tab);
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`relative flex items-center w-full rounded-xl mb-0.5 transition-all duration-150
                    ${active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-500 hover:bg-gray-55 hover:text-gray-800'
                    }`}
                  style={{
                    height: '42px',
                    padding: expanded ? '0 14px' : '0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    fontWeight: active ? 600 : 500,
                    fontSize: '14px',
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
                  )}

                  {/* Icon */}
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: '22px', height: '22px' }}
                  >
                    <i
                      className={`fas ${item.icon} transition-colors`}
                      style={{
                        fontSize: '15px',
                        color: active ? 'var(--tw-color-primary, #1a237e)' : undefined,
                      }}
                    />
                  </span>

                  {/* Label */}
                  <span
                    className="whitespace-nowrap overflow-hidden transition-all duration-[280ms] ease-in-out text-left"
                    style={{
                      marginLeft: expanded ? '11px' : '0px',
                      maxWidth:   expanded ? '160px' : '0px',
                      opacity:    expanded ? 1 : 0,
                    }}
                  >
                    {item.label}
                  </span>
                </button>

                {/* CSS Tooltip (collapsed only) */}
                {!expanded && (
                  <div
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                      bg-gray-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      whitespace-nowrap z-[999] shadow-lg"
                    style={{ fontSize: '12px' }}
                  >
                    {item.label}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Sign Out ─────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-gray-100 py-2" style={{ padding: '8px 8px' }}>
          <div className="relative group">
            <button
              onClick={onLogout}
              className="flex items-center w-full rounded-xl text-red-500 hover:text-red-750 hover:bg-red-50 transition-all duration-150"
              style={{
                height: '42px',
                padding: isSidebarExpanded || isMobileDrawerOpen ? '0 14px' : '0',
                justifyContent: isSidebarExpanded || isMobileDrawerOpen ? 'flex-start' : 'center',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              <span className="flex items-center justify-center shrink-0" style={{ width: '22px', height: '22px' }}>
                <i className="fas fa-sign-out-alt" style={{ fontSize: '15px' }} />
              </span>
              <span
                className="whitespace-nowrap overflow-hidden transition-all duration-[280ms] ease-in-out text-left"
                style={{
                  marginLeft: isSidebarExpanded || isMobileDrawerOpen ? '11px' : '0px',
                  maxWidth:   isSidebarExpanded || isMobileDrawerOpen ? '160px' : '0px',
                  opacity:    isSidebarExpanded || isMobileDrawerOpen ? 1 : 0,
                }}
              >
                Sign Out
              </span>
            </button>

            {!isSidebarExpanded && !isMobileDrawerOpen && (
              <div
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                  bg-gray-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5
                  opacity-0 group-hover:opacity-100 transition-opacity duration-150
                  whitespace-nowrap z-[999] shadow-lg"
              >
                Sign Out
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ── CONTENT WRAPPER ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-[#F8FAFC]">

        {/* Top Navbar Header */}
        <header
          className="shrink-0 bg-white border-b border-gray-100 flex items-center justify-between"
          style={{ height: '64px', zIndex: 30, padding: '0 20px' }}
        >
          {/* Left: Hamburger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsSidebarExpanded(prev => !prev);
                } else {
                  setIsMobileDrawerOpen(prev => !prev);
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150 shrink-0"
              aria-label="Toggle sidebar"
            >
              <i className="fas fa-bars" style={{ fontSize: '16px' }} />
            </button>
            
            <span className="hidden sm:block font-semibold text-[#1F2937]" style={{ fontSize: '15px' }}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'students' && 'Student Management'}
              {activeTab === 'wardens' && 'Warden Management'}
              {activeTab === 'rooms' && 'Room Assets'}
              {activeTab === 'hostels' && 'Hostel Assets'}
              {activeTab === 'leaves' && 'Leave Requests'}
              {activeTab === 'complaints' && 'Complaints'}
              {activeTab === 'visitors' && 'Visitor Management'}
              {activeTab === 'announcements' && 'Announcements'}
              {activeTab === 'occupancy_reports' && 'Occupancy Reports'}
              {activeTab === 'settings' && 'Settings'}
            </span>
          </div>

          {/* Right: Notifications & Profile dropdown */}
          <div className="flex items-center space-x-4">
            
            {/* Notifications Button */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
              >
                <i className="fas fa-bell text-base" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-4 origin-top-right animate-scaleIn text-left">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-[#1F2937]">Notifications</span>
                    <button
                      onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-gray-400 text-center">No new notifications.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif._id} className={`p-2.5 rounded-xl text-xs ${notif.read ? '' : 'bg-primary/5'}`}>
                          <p className="text-[#374151] font-bold">{notif.title}</p>
                          <p className="text-[#6B7280] mt-0.5">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 pl-2 pr-3 py-2 rounded-xl hover:bg-gray-55 transition-colors border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold" style={{ fontSize: '16px' }}>
                  {initials}
                </div>
                <span className="hidden md:inline font-bold text-gray-700">{name}</span>
                <i className="fas fa-angle-down text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 bg-white border border-gray-150 rounded-2xl shadow-xl w-48 py-2 z-50 text-left font-sans text-xs">
                  <div className="px-4 py-2 border-b border-gray-100 text-left">
                    <p className="font-bold text-gray-800">{name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user?.email || 'admin@hostelhub.com'}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-55 text-gray-700 flex items-center space-x-2"
                  >
                    <i className="fas fa-cog text-gray-400 w-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center space-x-2 border-t border-gray-50"
                  >
                    <i className="fas fa-sign-out-alt text-rose-400 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MAIN BODY ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-start max-w-full custom-scrollbar text-left">

          {/* ── TAB CONTENT ────────────────────────────────────────────────────── */}

        {/* ── TAB: DASHBOARD OVERVIEW ────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn text-left">

            {/* Welcome row (matching Student Dashboard design) */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="font-bold text-[#111827] leading-tight tracking-tight font-outfit text-left" style={{ fontSize: '42px' }}>
                  Welcome Back, {name.split(' ')[0]} {"\uD83D\uDC4B"}
                </h1>
                <p className="text-[#4B5563] mt-2 text-left" style={{ fontSize: '18px', fontWeight: 500 }}>Here's what's happening in your hostel today.</p>
              </div>
              
              {/* Date card */}
              <div className="flex items-center space-x-3 px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-left shrink-0">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-primary text-base" />
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937] leading-tight" style={{ fontSize: '14px' }}>
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[#6B7280] font-medium" style={{ fontSize: '12px' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Stats Grid (3 columns, student card size) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col justify-between h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl animate-pulse" />
                      <div className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
                      <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : (
                stats.map((stat, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (stat.tab) {
                        setActiveTab(stat.tab);
                      }
                    }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 ${stat.colorBg.split(' ')[0]} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                        <i className={`fas ${stat.icon} ${stat.colorBg.split(' ')[1]} text-base`} />
                      </div>
                      <span className="w-6 h-6 rounded-full bg-gray-55 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <i className="fas fa-chevron-right text-gray-400 group-hover:text-primary text-[9px] transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <div>
                      <p className="uppercase tracking-wider mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>{stat.label}</p>
                      <p className="font-semibold text-[#111827] mb-1 leading-tight" style={{ fontSize: '22px' }}>{stat.value}</p>
                      <p className="text-[#6B7280]" style={{ fontSize: '13px', fontWeight: 500 }}>{stat.sub}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions Row */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm text-left">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-3 mb-5">
                Dashboard Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={openStudentAddModal}
                  className="bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary px-4 py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-user-plus text-sm" />
                  <span>Add Student</span>
                </button>
                <button
                  onClick={openWardenAddModal}
                  className="bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-amber-800 px-4 py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-user-tie text-sm" />
                  <span>Add Warden</span>
                </button>
                <button
                  onClick={() => { setSelectedAnn(null); setAnnForm({ title: '', description: '', priority: 'Normal', visibleTo: 'all', pinned: false }); setShowAnnAddEditModal(true); }}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 text-emerald-800 px-4 py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-bullhorn text-sm" />
                  <span>Post Notice</span>
                </button>
              </div>
            </div>

            {/* Dashboard Lists Row (Recent Registrations / Leaves / Complaints) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

              {/* Recent Student & Warden Registrations */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-96">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Recent Enlistments
                  </h3>
                  <button onClick={() => setActiveTab('students')} className="text-xs font-bold text-primary hover:underline">View All</button>
                </div>
                <div className="flex-1 divide-y divide-gray-55 overflow-y-auto pr-1 custom-scrollbar">
                  {students.length === 0 && wardens.length === 0 ? (
                    [0, 1, 2].map((_, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-left">
                          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                            <div className="h-2.5 w-28 bg-gray-100 rounded animate-pulse" />
                          </div>
                        </div>
                        <div className="h-5 w-14 bg-gray-100 rounded-full animate-pulse" />
                      </div>
                    ))
                  ) : (
                    <>
                      {students.slice(0, 3).map(student => (
                        <div key={student._id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-left">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {student.fullName[0]}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900 truncate">{student.fullName}</p>
                              <p className="text-[10px] text-gray-405 font-semibold">{student.registerNumber} · {student.department}</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Student</span>
                        </div>
                      ))}
                      {wardens.slice(0, 2).map(warden => (
                        <div key={warden._id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3 text-left">
                            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {warden.fullName[0]}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900 truncate">{warden.fullName}</p>
                              <p className="text-[10px] text-gray-405 font-semibold">{warden.employeeId} · {warden.assignedHostel || 'No Hostel'}</p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Warden</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Recent Pending Leaves & Complaints */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between h-96">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Recent Requests & Complaints
                  </h3>
                  <div className="space-x-3">
                    <button onClick={() => setActiveTab('leaves')} className="text-xs font-bold text-primary hover:underline">Leaves</button>
                    <button onClick={() => setActiveTab('complaints')} className="text-xs font-bold text-primary hover:underline">Complaints</button>
                  </div>
                </div>
                <div className="flex-1 divide-y divide-gray-55 overflow-y-auto pr-1 custom-scrollbar">
                  {leaves.length === 0 && complaints.length === 0 ? (
                    [0, 1, 2].map((_, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between">
                        <div className="space-y-1.5">
                          <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                          <div className="h-2.5 w-40 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
                      </div>
                    ))
                  ) : (
                    <>
                      {leaves.slice(0, 2).map(l => (
                        <div key={l._id} className="py-3 flex items-center justify-between">
                          <div className="text-left max-w-[70%]">
                            <p className="text-xs font-bold text-gray-800 truncate">Leave Request: {l.student?.fullName}</p>
                            <p className="text-[10px] text-gray-450 truncate mt-0.5">{l.reason}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${l.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-700'
                            }`}>{l.status}</span>
                        </div>
                      ))}
                      {complaints.slice(0, 2).map(c => (
                        <div key={c._id} className="py-3 flex items-center justify-between border-t border-gray-50">
                          <div className="text-left max-w-[70%]">
                            <p className="text-xs font-bold text-gray-800 truncate">Complaint: {c.title}</p>
                            <p className="text-[10px] text-gray-450 truncate mt-0.5">{c.description}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${c.status === 'Pending' ? 'bg-red-50 text-red-600' : c.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>{c.status}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── TAB: STUDENTS MANAGEMENT ────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <p className="text-sm text-gray-500 font-medium">Create and manage Student profiles, activate/deactivate accounts, and assign rooms.</p>
              </div>
              <button
                onClick={openStudentAddModal}
                className="bg-primary hover:bg-primary-light text-white text-xs font-bold py-3.5 px-5 rounded-xl shadow-sm hover:shadow flex items-center space-x-2 transition-all shrink-0"
              >
                <i className="fas fa-plus" />
                <span>Add Student</span>
              </button>
            </div>

            {/* Search & Filter bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm font-sans">
              <div className="lg:col-span-2 relative">
                <input
                  type="text"
                  placeholder="Search Student..."
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
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
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
                  value={studentFilterHostel}
                  onChange={(e) => setStudentFilterHostel(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">All Hostels</option>
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                </select>
              </div>
              <div>
                <select
                  value={studentFilterStatus}
                  onChange={(e) => setStudentFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 text-left">Student Info</th>
                    <th className="px-6 py-4 text-left">Register Number</th>
                    <th className="px-6 py-4 text-left">Room / Bed</th>
                    <th className="px-6 py-4 text-left">Parent Details</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-center w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">
                        No students found matching filters.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 flex items-center space-x-3 text-left">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {student.fullName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{student.fullName}</p>
                            <p className="text-[10px] text-gray-450">{student.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left font-semibold text-gray-805">
                          {student.registerNumber}
                        </td>
                        <td className="px-6 py-4 text-left font-bold text-gray-800">
                          {(student.room?.roomNumber || student.roomNumber) ? (
                            <span>
                              {(student.room?.hostelName || student.hostelName) ? `${student.room?.hostelName || student.hostelName} - ` : ''}
                              {student.room?.blockName || student.block} {student.room?.roomNumber || student.roomNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic font-normal">Unallocated</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left text-xs">
                          <p className="font-semibold text-gray-700">{student.parentName || 'N/A'}</p>
                          <p className="text-gray-400">{student.parentContact || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <button
                            onClick={() => toggleStudentStatus(student)}
                            title="Click to toggle status"
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${student.isActive
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
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all border-none"
                              title="View Profile Details"
                            >
                              <i className="fas fa-eye text-xs" />
                            </button>
                            <button
                              onClick={() => openStudentEditModal(student)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all border-none"
                              title="Edit Student Account"
                            >
                              <i className="fas fa-pencil-alt text-xs" />
                            </button>
                            <button
                              onClick={() => openResetPasswordModal(student, 'student')}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all border-none"
                              title="Reset Account Password"
                            >
                              <i className="fas fa-key text-xs" />
                            </button>
                            <button
                              onClick={() => { setStudentToDelete(student); setShowStudentDeleteModal(true); }}
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all border-none"
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

        {/* ── TAB: WARDENS MANAGEMENT ─────────────────────────────────────────── */}
        {activeTab === 'wardens' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <p className="text-sm text-gray-500 font-medium">Create Warden records, manage active status, and assign management blocks.</p>
              </div>
              <button
                onClick={openWardenAddModal}
                className="bg-primary hover:bg-primary-light text-white text-xs font-bold py-3.5 px-5 rounded-xl shadow-sm hover:shadow flex items-center space-x-2 transition-all shrink-0"
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
                  placeholder="Search Warden..."
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
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
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
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Wardens Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
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
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {warden.fullName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{warden.fullName}</p>
                            <p className="text-[10px] text-gray-400">{warden.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left font-bold text-gray-805">
                          {warden.employeeId}
                        </td>
                        <td className="px-6 py-4 text-left text-xs">
                          {warden.assignedHostel ? (
                            <>
                              <p className="font-bold text-gray-850">{warden.assignedHostel}</p>
                              {warden.assignedBlocks && warden.assignedBlocks.length > 0 && (
                                <p className="text-[10px] text-gray-400 mt-0.5">Block: {warden.assignedBlocks.join(', ')}</p>
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
                            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${warden.isActive
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
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all border-none"
                              title="View Profile Details"
                            >
                              <i className="fas fa-eye text-xs" />
                            </button>
                            <button
                              onClick={() => openWardenEditModal(warden)}
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all border-none"
                              title="Edit Warden Account"
                            >
                              <i className="fas fa-pencil-alt text-xs" />
                            </button>
                            <button
                              onClick={() => openResetPasswordModal(warden, 'warden')}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-all border-none"
                              title="Reset Account Password"
                            >
                              <i className="fas fa-key text-xs" />
                            </button>
                            <button
                              onClick={() => { setWardenToDelete(warden); setShowWardenDeleteModal(true); }}
                              className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-all border-none"
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

        {/* ── TAB: ROOM MANAGEMENT ───────────────────────────────────────────── */}
        {activeTab === 'rooms' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <p className="text-sm text-gray-500 font-medium">Configure room details, set capacity limits, and monitor bed allotment status.</p>
              </div>
              <button
                onClick={() => setShowRoomAddModal(true)}
                className="bg-primary hover:bg-primary-light text-white text-xs font-bold py-3.5 px-5 rounded-xl shadow flex items-center space-x-2 transition-all shrink-0"
              >
                <i className="fas fa-plus" />
                <span>Add New Room</span>
              </button>
            </div>

            {/* Room Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="md:col-span-2 relative">
                <input
                  type="text"
                  placeholder="Search by Room Number..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary"
                />
                <i className="fas fa-search absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              </div>
              <div>
                <select
                  value={roomFilterBlock}
                  onChange={(e) => setRoomFilterBlock(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
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
                  value={roomFilterStatus}
                  onChange={(e) => setRoomFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rooms
                .filter(r => r.roomNumber.includes(roomSearch) && (roomFilterBlock ? r.blockName === roomFilterBlock : true) && (roomFilterStatus ? r.status === roomFilterStatus : true))
                .map(room => (
                  <div key={room._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">{room.blockName} - Room {room.roomNumber}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        room.status === 'Available' || room.status === 'VACANT' ? 'bg-emerald-50 text-emerald-700' :
                        room.status === 'PARTIALLY OCCUPIED' ? 'bg-blue-50 text-blue-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>{room.status}</span>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1.5 pt-2">
                      <div className="flex justify-between">
                        <span>Floor Level:</span>
                        <span className="font-bold text-gray-800">{room.floorNumber || '1'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Capacity:</span>
                        <span className="font-bold text-gray-800">{room.capacity} Beds</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allotted Beds:</span>
                        <span className="font-bold text-gray-800">{room.occupiedBeds} Beds</span>
                      </div>
                    </div>

                    {/* Capacity progress bar */}
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(room.occupiedBeds / room.capacity) * 100}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${room.occupiedBeds >= room.capacity ? 'bg-indigo-600' : 'bg-primary'
                          }`}
                      />
                    </div>
                  </div>
                ))}
            </div>

          </div>
        )}

        {/* ── TAB: HOSTEL MANAGEMENT ─────────────────────────────────────────── */}
        {activeTab === 'hostels' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <p className="text-sm text-gray-500 font-medium">Manage campus Hostel structures, review administrative wardens, and adjust capacities.</p>
              </div>
              <button
                onClick={() => setShowHostelAddModal(true)}
                className="bg-primary hover:bg-primary-light text-white text-xs font-bold py-3.5 px-5 rounded-xl shadow flex items-center space-x-2 transition-all shrink-0"
              >
                <i className="fas fa-plus" />
                <span>Register Hostel</span>
              </button>
            </div>

            {/* Hostel Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hostels.map(hostel => (
                <div key={hostel._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-900 font-outfit">{hostel.name}</h3>
                      <p className="text-[10px] text-emerald-600 font-extrabold uppercase mt-0.5 tracking-wider">Status: {hostel.status}</p>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <i className="fas fa-building text-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-50/50 p-3 rounded-xl">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Blocks Count</span>
                      <span className="font-extrabold text-gray-800 text-sm">{hostel.blockCount} Blocks</span>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Rooms Count</span>
                      <span className="font-extrabold text-gray-800 text-sm">{hostel.roomCount} Rooms</span>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Occupied Beds</span>
                      <span className="font-extrabold text-gray-800 text-sm">{hostel.occupiedBeds} Beds</span>
                    </div>
                    <div className="bg-gray-50/50 p-3 rounded-xl">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Available Beds</span>
                      <span className="font-extrabold text-gray-800 text-sm">{hostel.availableBeds} Beds</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] text-gray-450 uppercase font-bold tracking-wider block">Assigned Chief Warden</span>
                    <p className="text-xs font-bold text-gray-805 mt-1 flex items-center space-x-1.5">
                      <i className="fas fa-user-tie text-primary text-xs" />
                      <span>{hostel.warden}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ── TAB: LEAVE REQUESTS ────────────────────────────────────────────── */}
        {activeTab === 'leaves' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div>
              <p className="text-sm text-gray-500 font-medium">Review and process student leave applications. Administrative actions are logged automatically.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by student name…"
                    value={leaveSearch}
                    onChange={e => { setLeaveSearch(e.target.value); setLeavesPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>

              {(() => {
                const filtered = leaves.filter(l => 
                  (l.student?.fullName || '').toLowerCase().includes(leaveSearch.toLowerCase())
                );
                const paginated = filtered.slice(
                  (leavesPage - 1) * ITEMS_PER_PAGE,
                  leavesPage * ITEMS_PER_PAGE
                );
                const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-450 uppercase tracking-wider text-[11px] font-bold">
                            <th className="pb-3 text-left">Student</th>
                            <th className="pb-3 text-left">Room</th>
                            <th className="pb-3 text-left">Leave Type</th>
                            <th className="pb-3 text-left">From</th>
                            <th className="pb-3 text-left">To</th>
                            <th className="pb-3 text-left">Reason</th>
                            <th className="pb-3 text-left">Status</th>
                            <th className="pb-3 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginated.map(l => (
                            <tr key={l._id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="py-4 font-semibold text-gray-900">{l.student?.fullName || 'N/A'}</td>
                              <td className="py-4 text-gray-600">Rm {l.room?.roomNumber || l.student?.room?.roomNumber || l.student?.roomNumber || 'N/A'}</td>
                              <td className="py-4 text-gray-600">{l.leaveType}</td>
                              <td className="py-4 text-gray-600">{l.fromDate ? new Date(l.fromDate).toLocaleDateString() : 'N/A'}</td>
                              <td className="py-4 text-gray-600">{l.toDate ? new Date(l.toDate).toLocaleDateString() : 'N/A'}</td>
                              <td className="py-4 text-gray-500 max-w-[150px] truncate" title={l.reason}>{l.reason}</td>
                              <td className="py-4"><StatusBadge status={l.status} /></td>
                              <td className="py-4">
                                {l.status === 'Pending' ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => handleLeaveApproval(l._id, 'Approved')}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition">
                                      Approve
                                    </button>
                                    <button onClick={() => handleLeaveApproval(l._id, 'Rejected')}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition">
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 font-medium">Actioned</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-gray-400">
                                No leave requests found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Showing {((leavesPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(leavesPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setLeavesPage(p => Math.max(1, p - 1))}
                            disabled={leavesPage === 1}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            ← Prev
                          </button>
                          <button
                            onClick={() => setLeavesPage(p => Math.min(totalPages, p + 1))}
                            disabled={leavesPage === totalPages}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── TAB: COMPLAINTS ────────────────────────────────────────────────── */}
        {activeTab === 'complaints' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div>
              <p className="text-sm text-gray-500 font-medium">Track and update student complaints. Mark tickets to resolve operational and maintenance issues.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by student name or complaint title…"
                    value={complaintSearch}
                    onChange={e => { setComplaintSearch(e.target.value); setComplaintsPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>

              {(() => {
                const filtered = complaints.filter(c => 
                  (c.student?.fullName || '').toLowerCase().includes(complaintSearch.toLowerCase()) ||
                  (c.title || '').toLowerCase().includes(complaintSearch.toLowerCase())
                );
                const paginated = filtered.slice(
                  (complaintsPage - 1) * ITEMS_PER_PAGE,
                  complaintsPage * ITEMS_PER_PAGE
                );
                const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-450 uppercase tracking-wider text-[11px] font-bold">
                            <th className="pb-3 text-left">Student</th>
                            <th className="pb-3 text-left">Room</th>
                            <th className="pb-3 text-left">Title</th>
                            <th className="pb-3 text-left">Category</th>
                            <th className="pb-3 text-left">Priority</th>
                            <th className="pb-3 text-left font-medium">Status</th>
                            <th className="pb-3 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginated.map(c => (
                            <tr key={c._id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="py-4 font-semibold text-gray-900">{c.student?.fullName || 'N/A'}</td>
                              <td className="py-4 text-gray-600">Rm {c.student?.room?.roomNumber || c.student?.roomNumber || 'N/A'}</td>
                              <td className="py-4 text-gray-900 font-semibold">{c.title}</td>
                              <td className="py-4 text-gray-600">{c.category}</td>
                              <td className="py-4">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${c.priority === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {c.priority}
                                </span>
                              </td>
                              <td className="py-4"><StatusBadge status={c.status} /></td>
                              <td className="py-4">
                                {c.status !== 'Resolved' ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => handleComplaintStatus(c._id, 'In Progress')}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                                      Work
                                    </button>
                                    <button onClick={() => handleComplaintStatus(c._id, 'Resolved')}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition">
                                      Resolve
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 font-medium">Resolved</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-gray-400">
                                No complaints found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Showing {((complaintsPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(complaintsPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setComplaintsPage(p => Math.max(1, p - 1))}
                            disabled={complaintsPage === 1}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            ← Prev
                          </button>
                          <button
                            onClick={() => setComplaintsPage(p => Math.min(totalPages, p + 1))}
                            disabled={complaintsPage === totalPages}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── TAB: VISITOR MANAGEMENT ────────────────────────────────────────── */}
        {activeTab === 'visitors' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div>
              <p className="text-sm text-gray-500 font-medium">Verify guest entries and emergency visits. Review secure QR-coded pre-authorization requests.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">

              {/* On-the-spot Registration Form */}
              <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col h-fit">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center space-x-2">
                    <i className="fas fa-user-plus text-primary text-base" />
                    <span>On-the-Spot Registration</span>
                  </h3>
                </div>
                <form onSubmit={handleRegisterVisitorOnSpot} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Register No / Student ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 731520104001"
                      value={onSpotStudentId}
                      onChange={e => setOnSpotStudentId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Visitor Name</label>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={onSpotVisitorName}
                      onChange={e => setOnSpotVisitorName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g. Parent, Friend"
                        value={onSpotRelationship}
                        onChange={e => setOnSpotRelationship(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Phone Number</label>
                      <input
                        type="text"
                        placeholder="10-digit number"
                        value={onSpotPhoneNumber}
                        onChange={e => setOnSpotPhoneNumber(e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Visit Date</label>
                    <input
                      type="date"
                      value={onSpotVisitDate}
                      onChange={e => setOnSpotVisitDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Purpose of Visit</label>
                    <input
                      type="text"
                      placeholder="e.g. Delivery, Query, Meet"
                      value={onSpotPurpose}
                      onChange={e => setOnSpotPurpose(e.target.value)}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center space-x-1 mt-2"
                  >
                    <i className="fas fa-plus" />
                    <span>Register Visitor</span>
                  </button>
                </form>
              </div>

              {/* Visitor List */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by visitor or student name…"
                    value={visitorSearch}
                    onChange={e => { setVisitorSearch(e.target.value); setVisitorsPage(1); }}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                  />
                </div>
              </div>

              {(() => {
                const filtered = visitors.filter(v => 
                  (v.visitorName || '').toLowerCase().includes(visitorSearch.toLowerCase()) ||
                  (v.student?.fullName || '').toLowerCase().includes(visitorSearch.toLowerCase())
                );
                const paginated = filtered.slice(
                  (visitorsPage - 1) * ITEMS_PER_PAGE,
                  visitorsPage * ITEMS_PER_PAGE
                );
                const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-450 uppercase tracking-wider text-[11px] font-bold">
                            <th className="pb-3 text-left font-medium">Visitor Name</th>
                            <th className="pb-3 text-left font-medium">Student</th>
                            <th className="pb-3 text-left font-medium">Relationship</th>
                            <th className="pb-3 text-left font-medium">Visit Date</th>
                            <th className="pb-3 text-left font-medium">Status</th>
                            <th className="pb-3 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginated.map(v => (
                            <tr key={v._id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="py-4 font-semibold text-gray-900">{v.visitorName}</td>
                              <td className="py-4 text-gray-600">
                                <p className="font-semibold text-gray-800">{v.student?.fullName || 'N/A'}</p>
                                <p className="text-[10px] text-gray-400">Rm {v.student?.room?.roomNumber || v.student?.roomNumber || 'N/A'} ({v.student?.room?.blockName || v.student?.block || 'N/A'})</p>
                              </td>
                              <td className="py-4 text-gray-600">{v.relationship}</td>
                              <td className="py-4 text-gray-600">
                                {v.visitDate ? new Date(v.visitDate).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-4"><StatusBadge status={v.status} /></td>
                              <td className="py-4">
                                {v.status === 'Pending' ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => handleVisitorApproval(v._id, 'Approved')}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition">
                                      Approve
                                    </button>
                                    <button onClick={() => handleVisitorApproval(v._id, 'Rejected')}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition">
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 font-medium">Actioned</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {filtered.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-gray-400">
                                No visitor requests found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Showing {((visitorsPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(visitorsPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setVisitorsPage(p => Math.max(1, p - 1))}
                            disabled={visitorsPage === 1}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            ← Prev
                          </button>
                          <button
                            onClick={() => setVisitorsPage(p => Math.min(totalPages, p + 1))}
                            disabled={visitorsPage === totalPages}
                            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              </div>

            </div>
          </div>
        )}

        {/* ── TAB: ANNOUNCEMENTS ─────────────────────────────────────────────── */}
        {activeTab === 'announcements' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <p className="text-sm text-gray-500 font-medium">Broadcast announcements to Students and Wardens. Pins critical alerts to the top.</p>
              </div>
              <button
                onClick={() => { setSelectedAnn(null); setAnnForm({ title: '', description: '', priority: 'Normal', visibleTo: 'all', pinned: false }); setShowAnnAddEditModal(true); }}
                className="bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow flex items-center space-x-2 transition-all shrink-0"
              >
                <i className="fas fa-plus" />
                <span>Post Announcement</span>
              </button>
            </div>

            {/* Announcement Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map(ann => (
                <div key={ann._id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative">
                  {ann.pinned && (
                    <span className="absolute top-6 right-6 text-amber-500 text-sm" title="Pinned to top">
                      <i className="fas fa-thumbtack rotate-45" />
                    </span>
                  )}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight mb-1 text-lg">{ann.title}</h3>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={ann.priority} />
                        <span className="text-gray-400 text-xs font-medium">
                          {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-650 font-normal leading-relaxed text-sm mb-4">{ann.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
                      To: <strong className="text-gray-700">{ann.visibleTo}</strong>
                    </span>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => toggleAnnPin(ann)}
                        className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition ${ann.pinned ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        title={ann.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <i className="fas fa-thumbtack" />
                      </button>
                      <button
                        onClick={() => { setSelectedAnn(ann); setAnnForm({ title: ann.title, description: ann.description, priority: ann.priority, visibleTo: ann.visibleTo || 'all', pinned: ann.pinned }); setShowAnnAddEditModal(true); }}
                        className="px-2.5 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(ann._id)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
                  <i className="fas fa-bullhorn text-gray-300 text-5xl mb-4" />
                  <p className="text-base font-semibold text-gray-800 mb-1">No announcements yet</p>
                  <p className="text-sm text-gray-400 font-normal max-w-sm">Click "Post Announcement" to broadcast one.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: OCCUPANCY REPORTS ─────────────────────────────────────────── */}
        {activeTab === 'occupancy_reports' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">

            {/* KPI Metrics Cards */}
            {(() => {
              const totalBeds = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
              const occupiedBeds = rooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
              const availableBeds = Math.max(0, totalBeds - occupiedBeds);
              const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';
              
              const vacantRoomsCount = rooms.filter(r => (r.occupiedBeds || 0) === 0).length;
              const fullyOccupiedRoomsCount = rooms.filter(r => (r.occupiedBeds || 0) >= (r.capacity || 0)).length;

              const boysRooms = rooms.filter(r => getHostelName(r.blockName) === 'Boys Hostel');
              const boysBeds = boysRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
              const boysOccupied = boysRooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
              const boysRate = boysBeds > 0 ? Math.round((boysOccupied / boysBeds) * 100) : 0;

              const girlsRooms = rooms.filter(r => getHostelName(r.blockName) === 'Girls Hostel');
              const girlsBeds = girlsRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
              const girlsOccupied = girlsRooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
              const girlsRate = girlsBeds > 0 ? Math.round((girlsOccupied / girlsBeds) * 100) : 0;

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <span className="text-[10px] text-gray-455 font-black uppercase tracking-wider block">Total Hostel Capacity</span>
                      <span className="text-2xl font-black text-gray-900 mt-1 block">{totalBeds} Beds</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <span className="text-[10px] text-gray-450 font-black uppercase tracking-wider block">Occupied Beds (Allotted)</span>
                      <span className="text-2xl font-black text-primary mt-1 block">{occupiedBeds} Beds</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <span className="text-[10px] text-gray-455 font-black uppercase tracking-wider block">Available Beds (Vacant)</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">{availableBeds} Beds</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <span className="text-[10px] text-gray-450 font-black uppercase tracking-wider block">Occupancy Rate</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-2xl font-black text-amber-500">{occupancyRate}%</span>
                        <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden shrink-0">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boys / Girls / Vacant Rooms Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Vacant Rooms</span>
                      <span className="text-xl font-extrabold text-gray-800 mt-1 block">{vacantRoomsCount} Rooms</span>
                    </div>
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fully Occupied Rooms</span>
                      <span className="text-xl font-extrabold text-gray-800 mt-1 block">{fullyOccupiedRoomsCount} Rooms</span>
                    </div>
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Boys Hostel Summary</span>
                        <span className="text-sm font-black text-gray-800 block mt-1">{boysOccupied} / {boysBeds} Beds Allotted</span>
                      </div>
                      <div className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold">{boysRate}%</div>
                    </div>
                    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Girls Hostel Summary</span>
                        <span className="text-sm font-black text-gray-800 block mt-1">{girlsOccupied} / {girlsBeds} Beds Allotted</span>
                      </div>
                      <div className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-lg font-bold">{girlsRate}%</div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Multi-Criteria Filters */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">
                  Intelligence Report Filter Criteria
                </h3>
                <button
                  onClick={() => {
                    setReportHostel(''); setReportBlock(''); setReportFloor('');
                    setReportStatus(''); setReportSearch('');
                  }}
                  className="text-xs font-bold text-gray-455 hover:text-primary transition border-none bg-transparent"
                >
                  Clear Filters
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-600">Select Hostel</label>
                  <select
                    value={reportHostel}
                    onChange={e => setReportHostel(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:border-primary outline-none"
                  >
                    <option value="">All Hostels</option>
                    {uniqueHostels.map(hostel => (
                      <option key={hostel} value={hostel}>{hostel}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-600">Select Block</label>
                  <select
                    value={reportBlock}
                    onChange={e => setReportBlock(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:border-primary outline-none"
                  >
                    <option value="">All Blocks</option>
                    {uniqueBlocks.map(block => (
                      <option key={block} value={block}>{block}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-600">Select Floor</label>
                  <select
                    value={reportFloor}
                    onChange={e => setReportFloor(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:border-primary outline-none"
                  >
                    <option value="">All Floors</option>
                    {uniqueFloors.map(floor => (
                      <option key={floor} value={floor}>
                        {floor === '1' ? '1st' : floor === '2' ? '2nd' : floor === '3' ? '3rd' : `${floor}th`} Floor
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-gray-600">Room Status</label>
                  <select
                    value={reportStatus}
                    onChange={e => setReportStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:border-primary outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1 col-span-2 lg:col-span-1">
                  <label className="text-[10px] font-bold text-gray-600">Search</label>
                  <input
                    type="text"
                    placeholder="Warden or Room No..."
                    value={reportSearch}
                    onChange={e => setReportSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Print & Export Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{sortedOccupancy.length} Rooms Filtered</span>
              <div className="flex items-center w-full sm:w-auto">
                <button
                  onClick={exportOccupancyReportPDF}
                  className="flex-1 sm:flex-none bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-sm"
                >
                  <i className="fas fa-file-pdf" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

            {/* Occupancy Report Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider select-none">
                    <th onClick={() => handleSort('hostelName')} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50">
                      Hostel Name <i className={`fas fa-sort ml-1 ${sortField === 'hostelName' ? 'text-primary' : 'text-gray-300'}`} />
                    </th>
                    <th onClick={() => handleSort('block')} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50">
                      Block <i className={`fas fa-sort ml-1 ${sortField === 'block' ? 'text-primary' : 'text-gray-300'}`} />
                    </th>
                    <th onClick={() => handleSort('floor')} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50">
                      Floor <i className={`fas fa-sort ml-1 ${sortField === 'floor' ? 'text-primary' : 'text-gray-300'}`} />
                    </th>
                    <th onClick={() => handleSort('roomNumber')} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50">
                      Room Number <i className={`fas fa-sort ml-1 ${sortField === 'roomNumber' ? 'text-primary' : 'text-gray-300'}`} />
                    </th>
                    <th className="px-6 py-4 text-center">Capacity</th>
                    <th className="px-6 py-4 text-center">Occupied</th>
                    <th className="px-6 py-4 text-center">Available</th>
                    <th onClick={() => handleSort('status')} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50">
                      Occupancy Status <i className={`fas fa-sort ml-1 ${sortField === 'status' ? 'text-primary' : 'text-gray-300'}`} />
                    </th>
                    <th className="px-6 py-4 text-left">Warden Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {paginatedOccupancy.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-400 font-medium">
                        No occupancy records matched the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedOccupancy.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-left font-bold text-gray-900">{row.hostelName}</td>
                        <td className="px-6 py-4 text-left font-medium text-gray-650">{row.block}</td>
                        <td className="px-6 py-4 text-left font-medium text-gray-650">{row.floor}</td>
                        <td className="px-6 py-4 text-left font-bold text-gray-800">{row.roomNumber}</td>
                        <td className="px-6 py-4 text-center font-semibold text-gray-600">{row.capacity}</td>
                        <td className="px-6 py-4 text-center font-bold text-primary">{row.occupiedBeds}</td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-600">{row.availableBeds}</td>
                        <td className="px-6 py-4 text-left">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            row.status === 'Available' || row.status === 'VACANT' ? 'bg-emerald-50 text-emerald-700' :
                            row.status === 'PARTIALLY OCCUPIED' ? 'bg-blue-50 text-blue-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>{row.status}</span>
                        </td>
                        <td className="px-6 py-4 text-left font-semibold text-gray-700 flex items-center space-x-1.5 mt-2.5">
                          <i className="fas fa-user-tie text-gray-400 text-xs" />
                          <span>{row.warden}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center select-none pt-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="w-9 h-9 border border-gray-250 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-55 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <i className="fas fa-angle-left" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="w-9 h-9 border border-gray-250 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-55 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <i className="fas fa-angle-right" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}



        {/* ── TAB: SYSTEM SETTINGS ───────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">

            {/* Setting Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">

              {/* Account Security */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-150 pb-3 flex items-center">
                  <i className="fas fa-shield-alt mr-2 text-base text-primary/80" />
                  <span>Account Security settings</span>
                </h3>
                <form onSubmit={submitPw} className="space-y-4">
                  <div className="flex flex-col space-y-1.5 text-xs">
                    <label className="font-bold text-gray-600">Current Administrator Password</label>
                    <input
                      type="password"
                      value={oldPw}
                      onChange={e => setOldPw(e.target.value)}
                      placeholder="Enter current password"
                      className="px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5 text-xs">
                    <label className="font-bold text-gray-600">New Password</label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                      placeholder="Min 6 characters"
                      className="px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5 text-xs">
                    <label className="font-bold text-gray-600">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={e => setConfirmPw(e.target.value)}
                      placeholder="Re-enter password"
                      className="px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-light text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <i className="fas fa-key text-xs" />
                    <span>Change Password</span>
                  </button>
                </form>
              </div>

              {/* System Configuration */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-150 pb-3 flex items-center">
                  <i className="fas fa-sliders-h mr-2 text-base text-primary/80" />
                  <span>Campus System Configuration</span>
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center py-2.5">
                    <div>
                      <span className="font-bold text-gray-800 block">Email Alerts Notifications</span>
                      <span className="text-gray-400 font-medium">Broadcast admin system notices to email accounts.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEmailNotifs(!emailNotifs); showToastMsg(!emailNotifs ? 'Email preferences enabled.' : 'Email preferences disabled.'); }}
                      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none flex-shrink-0 ${emailNotifs ? 'bg-primary' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${emailNotifs ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-t border-gray-50">
                    <div>
                      <span className="font-bold text-gray-800 block">SMS Gateway Broadcasts</span>
                      <span className="text-gray-400 font-medium">Auto-dispatch entry logs & OTP pins via SMS.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSmsNotifs(!smsNotifs); showToastMsg(!smsNotifs ? 'SMS preferences enabled.' : 'SMS preferences disabled.'); }}
                      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none flex-shrink-0 ${smsNotifs ? 'bg-primary' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${smsNotifs ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-t border-gray-50">
                    <div>
                      <span className="font-bold text-gray-800 block text-rose-600">Maintenance & Offline Mode</span>
                      <span className="text-gray-400 font-medium">Disables warden room assignments temporarily.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMaintenanceMode(!maintenanceMode); showToastMsg(!maintenanceMode ? 'Campus maintenance mode activated.' : 'Campus maintenance mode disabled.'); }}
                      className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none flex-shrink-0 ${maintenanceMode ? 'bg-rose-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${maintenanceMode ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={() => { showToastMsg('Backing up MongoDB atlas cluster...'); setTimeout(() => showToastMsg('Backup package generated and saved successfully!'), 1500); }}
                      className="w-full border border-primary hover:bg-primary/5 text-primary font-bold text-xs py-3 rounded-xl transition flex items-center justify-center space-x-2"
                    >
                      <i className="fas fa-database text-xs" />
                      <span>Backup Database</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ── MODAL: STUDENT ADD / EDIT ───────────────────────────────────────── */}
      {showStudentAddEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
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
                      onChange={(e) => { setStudentForm({ ...studentForm, fullName: e.target.value }); if (studentErrors.fullName) setStudentErrors(prev => ({ ...prev, fullName: undefined })); }}
                      placeholder="e.g. John Doe"
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${studentErrors.fullName ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    />
                    {studentErrors.fullName && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{studentErrors.fullName}</p>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Register Number *</label>
                    <input
                      type="text"
                      value={studentForm.registerNumber}
                      onChange={(e) => { setStudentForm({ ...studentForm, registerNumber: e.target.value }); if (studentErrors.registerNumber) setStudentErrors(prev => ({ ...prev, registerNumber: undefined })); }}
                      placeholder="e.g. 311520104001"
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${studentErrors.registerNumber ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    />
                    {studentErrors.registerNumber && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{studentErrors.registerNumber}</p>}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Email Address *</label>
                    <input
                      type="email"
                      value={studentForm.email}
                      onChange={(e) => { setStudentForm({ ...studentForm, email: e.target.value }); if (studentErrors.email) setStudentErrors(prev => ({ ...prev, email: undefined })); }}
                      placeholder="john.doe@college.edu"
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${studentErrors.email ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    />
                    {studentErrors.email && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{studentErrors.email}</p>}
                  </div>
                  {selectedStudent && (
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-bold text-gray-600">Phone Number *</label>
                      <input
                        type="text"
                        value={studentForm.phoneNumber}
                        onChange={(e) => { setStudentForm({ ...studentForm, phoneNumber: e.target.value }); if (studentErrors.phoneNumber) setStudentErrors(prev => ({ ...prev, phoneNumber: undefined })); }}
                        placeholder="e.g. 9876543210"
                        className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${studentErrors.phoneNumber ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                      />
                      {studentErrors.phoneNumber && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{studentErrors.phoneNumber}</p>}
                    </div>
                  )}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Gender *</label>
                    <select
                      value={studentForm.gender}
                      onChange={(e) => { setStudentForm({ ...studentForm, gender: e.target.value }); if (studentErrors.gender) setStudentErrors(prev => ({ ...prev, gender: undefined })); }}
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none bg-white ${studentErrors.gender ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {studentErrors.gender && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{studentErrors.gender}</p>}
                  </div>
                  {selectedStudent && (
                    <>
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-bold text-gray-600">Department</label>
                        <select
                          value={studentForm.department}
                          onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                          className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary bg-white"
                        >
                          <option value="">Select Department</option>
                          <option value="IT">IT</option>
                          <option value="CSE">CSE</option>
                          <option value="ECE">ECE</option>
                          <option value="EEE">EEE</option>
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-bold text-gray-600">Academic Year</label>
                        <select
                          value={studentForm.year}
                          onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                          className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary bg-white"
                        >
                          <option value="">Select Year</option>
                          <option value="I">I</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Parents Details */}
              {selectedStudent && (
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
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-bold text-gray-600">Parent Contact Number</label>
                      <input
                        type="text"
                        value={studentForm.parentContact}
                        onChange={(e) => setStudentForm({ ...studentForm, parentContact: e.target.value })}
                        placeholder="e.g. 9876501234"
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-bold text-gray-600">Emergency Contact Number</label>
                      <input
                        type="text"
                        value={studentForm.emergencyContact}
                        onChange={(e) => setStudentForm({ ...studentForm, emergencyContact: e.target.value })}
                        placeholder="e.g. 9876598765"
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hostel Assignment */}
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                  Hostel & Room allocation
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Hostel Name</label>
                    <select
                      value={studentForm.hostelName}
                      onChange={(e) => setStudentForm({ ...studentForm, hostelName: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                    >
                      <option value="">Select Hostel</option>
                      <option value="Boys Hostel">Boys Hostel</option>
                      <option value="Girls Hostel">Girls Hostel</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Block</label>
                    <select
                      value={studentForm.block}
                      onChange={(e) => setStudentForm({ ...studentForm, block: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                    >
                      <option value="">Select Block</option>
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                      <option value="Block C">Block C</option>
                      <option value="Block D">Block D</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Room Number</label>
                    <select
                      value={studentForm.roomNumber}
                      onChange={(e) => {
                        const selectedRoom = e.target.value;
                        const digitsOnly = selectedRoom.replace(/^\D+/, '');
                        const inferredFloor = digitsOnly ? digitsOnly[0] : '1';
                        setStudentForm({ ...studentForm, roomNumber: selectedRoom, floor: inferredFloor });
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                    >
                      <option value="">Select Room</option>
                      {rooms
                        .filter(r => 
                          r.hostelName === studentForm.hostelName && 
                          r.blockName === studentForm.block && 
                          r.floorNumber === studentForm.floor &&
                          (r.occupiedBeds < r.capacity || r.roomNumber === studentForm.roomNumber)
                        )
                        .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
                        .map(r => (
                          <option key={r._id} value={r.roomNumber}>{r.roomNumber}</option>
                        ))
                      }
                    </select>
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
                      className="w-4.5 h-4.5 text-primary focus:ring-0"
                    />
                    <span className="text-xs font-bold text-gray-700">Active</span>
                  </label>
                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="studentStatus"
                      value="Inactive"
                      checked={studentForm.status === 'Inactive'}
                      onChange={() => setStudentForm({ ...studentForm, status: 'Inactive' })}
                      className="w-4.5 h-4.5 text-rose-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowStudentAddEditModal(false)}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {selectedStudent ? 'Save Updates' : 'Enroll Student'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: WARDEN ADD / EDIT ────────────────────────────────────────── */}
      {showWardenAddEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
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
                      onChange={(e) => { setWardenForm({ ...wardenForm, fullName: e.target.value }); if (wardenErrors.fullName) setWardenErrors(prev => ({ ...prev, fullName: undefined })); }}
                      placeholder="e.g. Robert Smith"
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${wardenErrors.fullName ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    />
                    {wardenErrors.fullName && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{wardenErrors.fullName}</p>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Employee ID *</label>
                    <input
                      type="text"
                      value={wardenForm.employeeId}
                      onChange={(e) => { setWardenForm({ ...wardenForm, employeeId: e.target.value }); if (wardenErrors.employeeId) setWardenErrors(prev => ({ ...prev, employeeId: undefined })); }}
                      placeholder="e.g. EMP4021"
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${wardenErrors.employeeId ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    />
                    {wardenErrors.employeeId && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{wardenErrors.employeeId}</p>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Email Address *</label>
                    <input
                      type="email"
                      value={wardenForm.email}
                      onChange={(e) => { setWardenForm({ ...wardenForm, email: e.target.value }); if (wardenErrors.email) setWardenErrors(prev => ({ ...prev, email: undefined })); }}
                      placeholder="robert.smith@college.edu"
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${wardenErrors.email ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    />
                    {wardenErrors.email && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{wardenErrors.email}</p>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Phone Number *</label>
                    <input
                      type="text"
                      value={wardenForm.phoneNumber}
                      onChange={(e) => { setWardenForm({ ...wardenForm, phoneNumber: e.target.value }); if (wardenErrors.phoneNumber) setWardenErrors(prev => ({ ...prev, phoneNumber: undefined })); }}
                      placeholder="e.g. 9876543210"
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none ${wardenErrors.phoneNumber ? 'border-rose-500 border' : 'border border-gray-250 focus:border-primary'}`}
                    />
                    {wardenErrors.phoneNumber && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{wardenErrors.phoneNumber}</p>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Gender *</label>
                    <select
                      value={wardenForm.gender}
                      onChange={(e) => { setWardenForm({ ...wardenForm, gender: e.target.value }); if (wardenErrors.gender) setWardenErrors(prev => ({ ...prev, gender: undefined })); }}
                      className={`px-4 py-2.5 rounded-xl text-xs focus:outline-none bg-white ${wardenErrors.gender ? 'border-rose-500 border' : 'border border-gray-200 focus:border-primary'}`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {wardenErrors.gender && <p className="text-[10px] text-rose-600 mt-1 font-semibold">{wardenErrors.gender}</p>}
                  </div>
                  {!selectedWarden && (
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-bold text-gray-600">Temporary Password (Optional)</label>
                      <input
                        type="text"
                        value={wardenForm.temporaryPassword}
                        onChange={(e) => setWardenForm({ ...wardenForm, temporaryPassword: e.target.value })}
                        placeholder="Leave blank to auto-generate"
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary bg-amber-50/20"
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
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                    >
                      <option value="">Select Hostel</option>
                      <option value="Boys Hostel">Boys Hostel</option>
                      <option value="Girls Hostel">Girls Hostel</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold text-gray-600">Assigned Block</label>
                    <select
                      value={wardenForm.assignedBlocks}
                      onChange={(e) => setWardenForm({ ...wardenForm, assignedBlocks: e.target.value })}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none bg-white"
                    >
                      <option value="">Select Block</option>
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                      <option value="Block C">Block C</option>
                      <option value="Block D">Block D</option>
                    </select>
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
                      className="w-4.5 h-4.5 text-primary focus:ring-0"
                    />
                    <span className="text-xs font-bold text-gray-700">Active</span>
                  </label>
                  <label className="inline-flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="wardenStatus"
                      value="Inactive"
                      checked={wardenForm.status === 'Inactive'}
                      onChange={() => setWardenForm({ ...wardenForm, status: 'Inactive' })}
                      className="w-4.5 h-4.5 text-rose-600 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowWardenAddEditModal(false)}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {selectedWarden ? 'Save Updates' : 'Enlist Warden'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ROOM ADD ─────────────────────────────────────────────────── */}
      {showRoomAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Add New Room Asset</h3>
              <button onClick={() => setShowRoomAddModal(false)} className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleRoomAddSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Room Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 101 / 204"
                  value={roomForm.roomNumber}
                  onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Block Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Block A / Block B"
                  value={roomForm.blockName}
                  onChange={e => setRoomForm({ ...roomForm, blockName: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Floor Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 1 / 2"
                  value={roomForm.floorNumber}
                  onChange={e => setRoomForm({ ...roomForm, floorNumber: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Capacity Capacity *</label>
                <input
                  type="number"
                  value={roomForm.capacity}
                  onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Initial Asset Status</label>
                <select
                  value={roomForm.status}
                  onChange={e => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white"
                >
                  <option value="Available">Available</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRoomAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md"
                >
                  Create Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: HOSTEL ADD ───────────────────────────────────────────────── */}
      {showHostelAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Register Hostel Asset</h3>
              <button onClick={() => setShowHostelAddModal(false)} className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleHostelAddSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Hostel Name *</label>
                <input
                  type="text"
                  placeholder="e.g. PG Hostel / South Block"
                  value={hostelForm.name}
                  onChange={e => setHostelForm({ ...hostelForm, name: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div className="flex grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-gray-600">Block Count</label>
                  <input
                    type="number"
                    value={hostelForm.blockCount}
                    onChange={e => setHostelForm({ ...hostelForm, blockCount: Number(e.target.value) })}
                    className="px-4 py-2 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-gray-600">Floor Count</label>
                  <input
                    type="number"
                    value={hostelForm.floorCount}
                    onChange={e => setHostelForm({ ...hostelForm, floorCount: Number(e.target.value) })}
                    className="px-4 py-2 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Hostel Capacity (Beds) *</label>
                <input
                  type="number"
                  value={hostelForm.capacity}
                  onChange={e => setHostelForm({ ...hostelForm, capacity: Number(e.target.value) })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Assigned Chief Warden *</label>
                <input
                  type="text"
                  placeholder="Warden name"
                  value={hostelForm.warden}
                  onChange={e => setHostelForm({ ...hostelForm, warden: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowHostelAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ANNOUNCEMENT ADD / EDIT ──────────────────────────────────── */}
      {showAnnAddEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">
                {selectedAnn ? 'Modify Broadcast Announcement' : 'Post Broadcast Notice'}
              </h3>
              <button onClick={() => setShowAnnAddEditModal(false)} className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleAnnSaveSubmit} className="p-6 space-y-4 text-xs font-sans">
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Announcement Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Maintenance Schedule"
                  value={annForm.title}
                  onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                  className="px-4 py-2 border border-gray-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Broadcast Message *</label>
                <textarea
                  rows={4}
                  placeholder="Enter notice details..."
                  value={annForm.description}
                  onChange={e => setAnnForm({ ...annForm, description: e.target.value })}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-primary custom-scrollbar resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-gray-600">Priority Level</label>
                  <select
                    value={annForm.priority}
                    onChange={e => setAnnForm({ ...annForm, priority: e.target.value })}
                    className="px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-gray-600">Target Audience</label>
                  <select
                    value={annForm.visibleTo}
                    onChange={e => setAnnForm({ ...annForm, visibleTo: e.target.value })}
                    className="px-4 py-2 border border-gray-200 rounded-xl outline-none bg-white"
                  >
                    <option value="all">Everyone</option>
                    <option value="student">Students Only</option>
                    <option value="warden">Wardens Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2 select-none">
                <input
                  type="checkbox"
                  id="ann-pin"
                  checked={annForm.pinned}
                  onChange={e => setAnnForm({ ...annForm, pinned: e.target.checked })}
                  className="w-4 h-4 text-primary"
                />
                <label htmlFor="ann-pin" className="font-bold text-gray-700 cursor-pointer">Pin to top of feed</label>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAnnAddEditModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RESET PASSWORD ────────────────────────────────────────────── */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Reset Password</h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-gray-400 hover:text-gray-750">
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-xs font-sans">
              <p className="text-sm text-gray-500">
                You are resetting the password for <strong>{resetUserName}</strong> ({resetUserRole}). Enter a new temporary password:
              </p>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-gray-600">Temporary Password *</label>
                <input
                  type="text"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-primary"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md"
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
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Student Profile Details</h3>
              <button onClick={() => { setViewStudent(null); setShowStudentDetailsModal(false); }} className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-xs font-sans">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {viewStudent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{viewStudent.fullName}</h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${viewStudent.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                    {viewStudent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Register Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.registerNumber}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Roll Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.rollNumber || 'N/A'}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl col-span-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-gray-800">{viewStudent.email}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.phoneNumber}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender</p>
                  <p className="font-semibold text-gray-800">{viewStudent.gender}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Department</p>
                  <p className="font-semibold text-gray-800">{viewStudent.department || 'N/A'}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Academic Year</p>
                  <p className="font-semibold text-gray-800">{viewStudent.year || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Parent/Guardian Name</p>
                  <p className="font-semibold text-gray-800">{viewStudent.parentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Parent Contact Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.parentContact || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Emergency Contact</p>
                  <p className="font-semibold text-gray-800">{viewStudent.emergencyContact || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Address</p>
                  <p className="font-semibold text-gray-800">{viewStudent.address || 'N/A'}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => { setViewStudent(null); setShowStudentDetailsModal(false); }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-650 font-bold text-xs rounded-xl transition"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: WARDEN DETAILS ───────────────────────────────────────────── */}
      {showWardenDetailsModal && viewWarden && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Warden Profile Details</h3>
              <button onClick={() => { setViewWarden(null); setShowWardenDetailsModal(false); }} className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-xs font-sans">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                  {viewWarden.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{viewWarden.fullName}</h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${viewWarden.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                    {viewWarden.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
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
                <p className="text-xs font-semibold text-gray-800">
                  {viewWarden.assignedBlocks && viewWarden.assignedBlocks.length > 0
                    ? "Block " + viewWarden.assignedBlocks.join(', ')
                    : 'No blocks assigned'}
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => { setViewWarden(null); setShowWardenDetailsModal(false); }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-650 font-bold text-xs rounded-xl transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 text-center space-y-4 text-xs font-sans">
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
                  className="px-5 py-2.5 border border-gray-250 rounded-xl text-xs font-bold text-gray-550 hover:bg-gray-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 text-center space-y-4 text-xs font-sans">
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
                  className="px-5 py-2.5 border border-gray-250 rounded-xl text-xs font-bold text-gray-550 hover:bg-gray-55"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWarden}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md animate-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 p-8 text-center space-y-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-2xl mx-auto animate-none">
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
    </div>
  );
}
