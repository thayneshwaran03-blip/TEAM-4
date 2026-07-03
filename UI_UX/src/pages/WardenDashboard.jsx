import React, { useState, useEffect, useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function WardenDashboard({ user, onLogout }) {
// Variables name, email, initials are declared below the state hooks to access dynamic state

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarExpanded,  setIsSidebarExpanded]  = useState(true);
  const [isProfileOpen,      setIsProfileOpen]      = useState(false);
  const [isNotifOpen,        setIsNotifOpen]        = useState(false);
  const [activeTab,          setActiveTab]          = useState('Dashboard');
  const [toast,              setToast]              = useState(null);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [showPwModal,       setShowPwModal]       = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAnnModal,      setShowAnnModal]      = useState(false);
  const [editAnn,           setEditAnn]           = useState(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [oldPw,           setOldPw]           = useState('');
  const [newPw,           setNewPw]           = useState('');
  const [confirmPw,       setConfirmPw]       = useState('');
  const [emailNotifs,     setEmailNotifs]     = useState(true);
  const [smsNotifs,       setSmsNotifs]       = useState(true);
  const [annTitle,        setAnnTitle]        = useState('');
  const [annDesc,         setAnnDesc]         = useState('');
  const [annPriority,     setAnnPriority]     = useState('Normal');
  const [searchStudents,  setSearchStudents]  = useState('');
  const [searchLeaves,    setSearchLeaves]    = useState('');
  const [searchComplaints,setSearchComplaints]= useState('');
  const [searchVisitors,  setSearchVisitors]  = useState('');
  const [currentPage,     setCurrentPage]     = useState(1);

  // ── Data state ────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [profile, setProfile] = useState(null);

  // Dynamic warden & room states
  const [wardenName,      setWardenName]      = useState('');
  const [wardenPhone,     setWardenPhone]     = useState('');
  const [rooms,           setRooms]           = useState([]);
  const [occupancyStats,  setOccupancyStats]  = useState({
    totalCapacity: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    occupancyRate: 0,
    occupiedRooms: 0,
    vacantRooms: 0
  });
  const [reportFloor,     setReportFloor]     = useState('');
  const [reportSearch,    setReportSearch]    = useState('');
  const [sortField,       setSortField]       = useState('roomNumber');
  const [sortOrder,       setSortOrder]       = useState('asc');
  const [occupancyPage,   setOccupancyPage]   = useState(1);
  const occupancyPerPage = 8;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showRoomModal,   setShowRoomModal]   = useState(false);
  const [allocRoomId,     setAllocRoomId]     = useState('');
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  // On-the-spot visitor registration states
  const [onSpotStudentId, setOnSpotStudentId] = useState('');
  const [onSpotVisitorName, setOnSpotVisitorName] = useState('');
  const [onSpotRelationship, setOnSpotRelationship] = useState('');
  const [onSpotPhoneNumber, setOnSpotPhoneNumber] = useState('');
  const [onSpotVisitDate, setOnSpotVisitDate] = useState('');
  const [onSpotPurpose, setOnSpotPurpose] = useState('');

  const name     = profile?.fullName || user?.fullName || 'Keerthana';
  const email    = profile?.email    || user?.email    || 'keerthana.warden@hostel.com';
  const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const apiFetch = async (path, opts = {}) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (opts.body) headers['Content-Type'] = 'application/json';
    Object.assign(headers, opts.headers || {});
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api${path}`, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        if (typeof window.__forceLogout === 'function') window.__forceLogout();
      }
      throw new Error(`${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
  };


  const fetchAll = async () => {
    try {
      const [leavesResp, complaintsResp, visitorsResp, annResp, studentsResp, notifsResp, profileResp, roomsResp, occDashResp] = await Promise.all([
        apiFetch('/warden/leave-requests').catch(() => ({ leaveRequests: [] })),
        apiFetch('/warden/complaints').catch(() => ({ complaints: [] })),
        apiFetch('/warden/visitor-requests').catch(() => ({ visitorRequests: [] })),
        apiFetch('/warden/announcements').catch(() => ({ announcements: [] })),
        apiFetch('/warden/students').catch(() => ({ students: [] })),
        apiFetch('/warden/notifications').catch(() => ({ notifications: [] })),
        apiFetch('/warden/profile').catch(() => null),
        apiFetch('/warden/occupancy/report').catch(() => ({ rooms: [] })),
        apiFetch('/warden/occupancy/dashboard').catch(() => ({ stats: {} }))
      ]);

      setLeaveRequests(leavesResp.leaveRequests || []);
      setComplaints(complaintsResp.complaints || []);
      setVisitors(visitorsResp.visitorRequests || []);
      setAnnouncements(annResp.announcements || []);
      setStudents(studentsResp.students || []);
      setNotifications(notifsResp.notifications || []);
      setRooms(roomsResp.rooms || []);
      if (occDashResp && occDashResp.stats) {
        setOccupancyStats(occDashResp.stats);
      }
      if (profileResp && profileResp.warden) {
        const w = profileResp.warden;
        setProfile(w);
        setWardenName(w.fullName || '');
        setWardenPhone(w.phoneNumber || '');
      }
    } catch (error) {
      console.error('Failed to load warden dashboard data:', error.message);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── click-outside refs ────────────────────────────────────────────────────
  const profileRef = useRef(null);
  const notifRef   = useRef(null);

  useEffect(() => {
    const h = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────
  const unread          = notifications.filter(n => !n.read).length;
  const pendingLeaves   = leaveRequests.filter(l => l.status === 'Pending').length;
  const activeComplaints= complaints.filter(c => c.status === 'Pending' || c.status === 'In Progress').length;
  const visitorsToday   = visitors.filter(v => v.date === new Date().toISOString().split('T')[0] || v.status === 'Pending').length;
  const occupiedRooms   = students.filter(s => s.status === 'Active').length;
  const activeAnns      = announcements.length;

  // live date
  const today  = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const dayStr  = today.toLocaleDateString('en-US', { weekday: 'long' });

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const navigate = id => { setActiveTab(id); setIsMobileDrawerOpen(false); setCurrentPage(1); };

  const handleLeaveAction = async (id, action) => {
    try {
      const apiAction = action === 'Approved' ? 'approve' : 'reject';
      await apiFetch(`/warden/leave-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action: apiAction, comment: `${action} by Warden` })
      });
      showToast(`Leave request ${action.toLowerCase()} successfully.`);
      await fetchAll();
    } catch (err) {
      console.error(err);
      showToast(`Failed to ${action.toLowerCase()} leave request.`, 'error');
    }
  };

  const handleComplaintAction = async (id, action) => {
    try {
      let apiAction = 'accept';
      if (action === 'Resolved') apiAction = 'resolve';
      else if (action === 'Rejected') apiAction = 'reject';
      else if (action === 'In Progress') apiAction = 'in_progress';

      await apiFetch(`/warden/complaints/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ action: apiAction, comment: `Complaint marked as ${action}` })
      });
      showToast(`Complaint marked as ${action}.`);
      await fetchAll();
    } catch (err) {
      console.error(err);
      showToast(`Failed to update complaint status.`, 'error');
    }
  };

  const handleVisitorAction = async (id, action) => {
    try {
      const apiAction = action === 'Approved' ? 'approve' : 'reject';
      await apiFetch(`/warden/visitor-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action: apiAction, comment: `Visitor request ${apiAction}d` })
      });
      showToast(`Visitor ${action.toLowerCase()} successfully.`);
      await fetchAll();
    } catch (err) {
      console.error(err);
      showToast(`Failed to update visitor request.`, 'error');
    }
  };

  const handleRegisterVisitorOnSpot = async (e) => {
    e.preventDefault();
    if (!onSpotStudentId || !onSpotVisitorName || !onSpotRelationship || !onSpotPhoneNumber || !onSpotVisitDate) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      const res = await apiFetch('/warden/visitor-requests/on-the-spot', {
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
        showToast('Visitor registered successfully on the spot!');
        setOnSpotStudentId('');
        setOnSpotVisitorName('');
        setOnSpotRelationship('');
        setOnSpotPhoneNumber('');
        setOnSpotVisitDate('');
        setOnSpotPurpose('');
        await fetchAll();
      } else {
        showToast(res.message || 'Failed to register visitor.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Server error', 'error');
    }
  };

  const openNewAnn = () => {
    setEditAnn(null);
    setAnnTitle(''); setAnnDesc(''); setAnnPriority('Normal');
    setShowAnnModal(true);
  };

  const openEditAnn = ann => {
    setEditAnn(ann);
    setAnnTitle(ann.title); setAnnDesc(ann.description || ann.desc); setAnnPriority(ann.priority);
    setShowAnnModal(true);
  };

  const saveAnn = async () => {
    if (!annTitle.trim() || !annDesc.trim()) { showToast('Please fill all fields.', 'error'); return; }
    try {
      const payload = {
        title: annTitle,
        description: annDesc,
        priority: annPriority,
        visibleTo: ['student', 'warden'],
        pinned: false
      };
      if (editAnn) {
        await apiFetch(`/warden/announcements/${editAnn._id || editAnn.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Announcement updated.');
      } else {
        await apiFetch('/warden/announcements', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Announcement created.');
      }
      setShowAnnModal(false);
      await fetchAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to save announcement.', 'error');
    }
  };

  const deleteAnn = async id => {
    try {
      await apiFetch(`/warden/announcements/${id}`, { method: 'DELETE' });
      showToast('Announcement deleted.');
      await fetchAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete announcement.', 'error');
    }
  };

  const submitPw = async e => {
    e.preventDefault();
    if (!oldPw || !newPw || !confirmPw) { showToast('Please fill all password fields.', 'error'); return; }
    if (newPw.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Passwords do not match.', 'error'); return; }
    try {
      await apiFetch('/warden/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: oldPw, newPassword: newPw })
      });
      showToast('Password updated successfully!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
      setShowPwModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to update password. Please check your current password.', 'error');
    }
  };

  const handleProfileUpdate = async e => {
    e.preventDefault();
    if (!wardenName.trim()) { showToast('Full name is required.', 'error'); return; }
    try {
      await apiFetch('/warden/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: wardenName,
          phoneNumber: wardenPhone
        })
      });
      showToast('Profile updated successfully!');
      await fetchAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile.', 'error');
    }
  };

  const handleRoomAllocate = async e => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await apiFetch(`/warden/students/${selectedStudent._id || selectedStudent.id}/allocate-room`, {
        method: 'PUT',
        body: JSON.stringify({ roomId: allocRoomId || null })
      });
      showToast('Room allocation updated successfully!');
      setSelectedStudent(null);
      setShowRoomModal(false);
      await fetchAll();
    } catch (err) {
      console.error(err);
      showToast('Failed to allocate room.', 'error');
    }
  };

  const exportOccupancyReportPDF = () => {
    const hostel = profile?.assignedHostel || 'N/A';
    const block = profile?.assignedBlocks ? profile.assignedBlocks.join(', ') : 'N/A';
    const warden = profile?.fullName || 'N/A';
    const dateStr = new Date().toLocaleString();

    const filteredRooms = rooms.filter(r => {
      const q = reportSearch.toLowerCase();
      const sMatch = q ? (r.roomNumber || '').includes(q) : true;
      const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
      return sMatch && fMatch;
    });

    const totalBeds = filteredRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
    const occupiedBeds = filteredRooms.reduce((acc, r) => acc + (r.occupiedBeds || 0), 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : '0.0';
    const totalRooms = filteredRooms.length;
    const occupiedRooms = filteredRooms.filter(r => r.occupiedBeds > 0).length;
    const vacantRooms = filteredRooms.filter(r => r.occupiedBeds === 0).length;

    const tableRowsHtml = filteredRooms.map(r => {
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
          <td>${r.floorNumber}</td>
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

  // ── nav config ────────────────────────────────────────────────────────────
  const mainNav = [
    { id: 'Dashboard',          icon: 'fa-th-large',         label: 'Dashboard'           },
    { id: 'Student Management', icon: 'fa-user-graduate',    label: 'Student Management'  },
    { id: 'Leave Requests',     icon: 'fa-calendar-check',   label: 'Leave Requests'      },
    { id: 'Complaints',         icon: 'fa-exclamation-circle',label: 'Complaints'         },
    { id: 'Visitors',           icon: 'fa-user-friends',     label: 'Visitor Management'  },
    { id: 'Announcements',      icon: 'fa-bullhorn',         label: 'Announcements'       },
    { id: 'Occupancy Reports',  icon: 'fa-chart-pie',        label: 'Occupancy Reports'   },
  ];

  // ── shared input style (same as StudentDashboard) ────────────────────────
  const inp = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';

  // ── Status badge helper ───────────────────────────────────────────────────
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

  // ── Priority badge ────────────────────────────────────────────────────────
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

  // ── Filter helpers ────────────────────────────────────────────────────────
  const filteredStudents   = students.filter(s => (s.fullName || '').toLowerCase().includes(searchStudents.toLowerCase()) || (s.registerNumber || '').toLowerCase().includes(searchStudents.toLowerCase()));
  const filteredLeaves     = leaveRequests.filter(l => (l.student?.fullName || '').toLowerCase().includes(searchLeaves.toLowerCase()));
  const filteredComplaints = complaints.filter(c => (c.student?.fullName || '').toLowerCase().includes(searchComplaints.toLowerCase()) || (c._id || '').toLowerCase().includes(searchComplaints.toLowerCase()));
  const filteredVisitors   = visitors.filter(v => (v.visitorName || '').toLowerCase().includes(searchVisitors.toLowerCase()) || (v.student?.fullName || '').toLowerCase().includes(searchVisitors.toLowerCase()));

  const ITEMS_PER_PAGE = 5;
  const paginate = arr => arr.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = arr => Math.ceil(arr.length / ITEMS_PER_PAGE);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex w-full h-screen bg-[#F5F7FB] font-sans antialiased text-gray-800 overflow-hidden" style={{ fontFamily: "'Poppins', 'Outfit', sans-serif" }}>

      {/* ── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 animate-fadeIn ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-sm`} />
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white transition-colors">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      )}

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
           SIDEBAR — Premium SaaS design
      ════════════════════════════════════════════════════════════════════ */}
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
        {/* Header: Logo only (hamburger moved to topbar) */}
        <div
          className="flex items-center shrink-0 border-b border-gray-100"
          style={{ height: '64px', padding: '0 14px', justifyContent: isSidebarExpanded || isMobileDrawerOpen ? 'space-between' : 'center' }}
        >
          <div className="flex items-center min-w-0 overflow-hidden">
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

          {/* Mobile close ✕ — only visible on mobile */}
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 shrink-0"
          >
            <i className="fas fa-times" style={{ fontSize: '14px' }} />
          </button>
        </div>

        {/* Profile section */}
        <div className="shrink-0">
          {/* EXPANDED profile card */}
          <div
            className="overflow-hidden transition-all duration-[280ms] ease-in-out"
            style={{
              maxHeight: isSidebarExpanded || isMobileDrawerOpen ? '140px' : '0px',
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
              >Warden</span>
            </div>
          </div>

          {/* COLLAPSED mini avatar */}
          <div
            className="flex justify-center transition-all duration-[280ms] ease-in-out overflow-hidden"
            style={{
              maxHeight: !isSidebarExpanded && !isMobileDrawerOpen ? '52px' : '0px',
              opacity:   !isSidebarExpanded && !isMobileDrawerOpen ? 1 : 0,
              paddingTop:    !isSidebarExpanded && !isMobileDrawerOpen ? '10px' : '0px',
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: '6px 8px' }}>
          {mainNav.map(item => {
            const active   = activeTab === item.id;
            const expanded = isSidebarExpanded || isMobileDrawerOpen;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => navigate(item.id)}
                  className={`relative flex items-center w-full rounded-xl mb-0.5 transition-all duration-150
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  style={{
                    height: '42px',
                    padding: expanded ? '0 14px' : '0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-full" />
                  )}
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: '22px', height: '22px' }}
                  >
                    <i
                      className={`fas ${item.icon} transition-colors`}
                      style={{ fontSize: '15px' }}
                    />
                  </span>
                  <span
                    className="whitespace-nowrap overflow-hidden transition-all duration-[280ms] ease-in-out"
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

        {/* Sign Out — pinned at bottom */}
        <div className="shrink-0 border-t border-gray-100" style={{ padding: '8px 8px' }}>
          <div className="relative group">
            <button
              onClick={onLogout}
              className="flex items-center w-full rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150"
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
                className="whitespace-nowrap overflow-hidden transition-all duration-[280ms] ease-in-out"
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

      {/* ══════════════════════════════════════════════════════════════════
           MAIN WRAPPER — flex sibling
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

        {/* TOP NAVBAR */}
        <header
          className="shrink-0 bg-white border-b border-gray-100 flex items-center justify-between"
          style={{ height: '64px', zIndex: 30, padding: '0 20px' }}
        >
          {/* Left: hamburger (always visible in topbar) + mobile logo + page title */}
          <div className="flex items-center gap-3">
            {/* ══ HAMBURGER — always in topbar, always visible ══ */}
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

            {/* Logo — mobile only */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-home text-primary text-xs" />
              </div>
              <span className="font-bold text-gray-900 text-sm tracking-tight select-none">
                Hostel<span className="text-primary">Hub</span>
              </span>
            </div>

            {/* Page title */}
            <span className="hidden sm:block font-semibold text-[#1F2937]" style={{ fontSize: '15px' }}>{activeTab}</span>
          </div>

          {/* Right */}
          <div className="flex items-center space-x-4">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
              >
                <i className="fas fa-bell text-base" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white">
                    {unread}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-4 origin-top-right animate-scaleIn">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-[#1F2937]">Notifications</span>
                    {unread > 0 && (
                      <button
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                        className="text-xs text-primary font-medium hover:underline"
                      >Mark all read</button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-2.5 rounded-xl text-xs ${n.read ? '' : 'bg-primary/5'}`}>
                        <p className="text-[#374151] font-normal">{n.text}</p>
                        <p className="text-[#6B7280] mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className="flex items-center space-x-3 pl-2 pr-3 py-2 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold" style={{ fontSize: '16px' }}>
                  {initials.charAt(0)}
                </div>
                <span className="hidden sm:block font-semibold text-[#1F2937] leading-none" style={{ fontSize: '17px' }}>{name}</span>
                <i className={`fas fa-chevron-down text-[11px] text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2 origin-top-right animate-scaleIn">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-[#1F2937] truncate">{name}</p>
                    <p className="text-[10px] text-[#6B7280] truncate">{email}</p>
                  </div>
                  {[
                    { icon: 'fa-user-circle', label: 'My Profile',      action: () => { setShowProfileModal(true);  setIsProfileOpen(false); } },
                    { icon: 'fa-lock',        label: 'Change Password', action: () => { setShowPwModal(true);       setIsProfileOpen(false); } },
                    { icon: 'fa-cog',         label: 'Settings',        action: () => { setShowSettingsModal(true); setIsProfileOpen(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      className="flex items-center space-x-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <i className={`fas ${item.icon} text-gray-400 text-sm w-4 text-center`} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { onLogout(); setIsProfileOpen(false); }}
                    className="flex items-center space-x-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
                    <i className="fas fa-sign-out-alt text-red-400 text-sm w-4 text-center" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MAIN BODY ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col">
          <div className="flex-1 space-y-6">

          {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 animate-fadeIn">

              {/* Welcome row */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="font-bold text-[#111827] leading-tight tracking-tight" style={{ fontSize: '36px' }}>
                    Welcome Back, Warden 👋
                  </h1>
                  <p className="text-[#4B5563] mt-2" style={{ fontSize: '18px', fontWeight: 500 }}>Monitor hostel activities and manage student requests efficiently.</p>
                </div>
                {/* Date card */}
                <div className="flex items-center space-x-3 px-5 py-3.5 bg-white rounded-2xl shadow-sm border border-gray-100 text-left shrink-0">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-primary text-base" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1F2937] leading-tight" style={{ fontSize: '14px' }}>{dateStr}</p>
                    <p className="text-[#6B7280] font-medium" style={{ fontSize: '12px' }}>{dayStr}</p>
                  </div>
                </div>
              </div>

              {/* Stat cards — 6 cards, 2 rows of 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: 'fa-user-graduate',      iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    label: 'Total Students',         value: students.length,  sub: 'Enrolled this semester',   tab: 'Student Management' },
                  { icon: 'fa-calendar-times',     iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',   label: 'Pending Leave Requests', value: pendingLeaves,    sub: 'Awaiting your approval',   tab: 'Leave Requests'     },
                  { icon: 'fa-exclamation-circle', iconBg: 'bg-rose-50',    iconColor: 'text-rose-600',    label: 'Active Complaints',      value: activeComplaints, sub: 'Under resolution',         tab: 'Complaints'         },
                  { icon: 'fa-user-friends',       iconBg: 'bg-purple-50',  iconColor: 'text-purple-600',  label: 'Visitors Today',         value: visitorsToday,    sub: 'Pending approvals',        tab: 'Visitors'           },
                  { icon: 'fa-door-open',          iconBg: 'bg-green-50',   iconColor: 'text-green-600',   label: 'Occupied Rooms',         value: occupiedRooms,    sub: `of ${students.length} total rooms`, tab: 'Occupancy Reports' },
                  { icon: 'fa-bullhorn',           iconBg: 'bg-orange-50',  iconColor: 'text-orange-600',  label: 'Active Announcements',   value: activeAnns,       sub: 'Posted to students',       tab: 'Announcements'      },
                ].map((c, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(c.tab)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
                        <i className={`fas ${c.icon} ${c.iconColor} text-base`} />
                      </div>
                      <span className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <i className="fas fa-chevron-right text-gray-400 group-hover:text-primary text-[9px] transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <div>
                      <p className="uppercase tracking-wider mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>{c.label}</p>
                      <p className="font-semibold text-[#111827] mb-1 leading-tight" style={{ fontSize: '30px' }}>{c.value}</p>
                      <p className="text-[#6B7280]" style={{ fontSize: '13px', fontWeight: 500 }}>{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom grid: Recent Leaves + Recent Complaints */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Leave Requests */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                        <i className="fas fa-calendar-check text-amber-500 text-sm" />
                      </div>
                      <h3 className="font-semibold text-[#1F2937]" style={{ fontSize: '18px' }}>Recent Leave Requests</h3>
                    </div>
                    <button onClick={() => navigate('Leave Requests')} className="text-xs text-primary font-medium hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {leaveRequests.slice(0, 4).map(l => (
                      <div key={l._id || l.id} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-semibold text-[#1F2937]" style={{ fontSize: '13px' }}>{l.student?.fullName || 'N/A'}</p>
                          <p className="text-[#6B7280] font-normal" style={{ fontSize: '11px' }}>{l.leaveType} · {l.fromDate ? new Date(l.fromDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <StatusBadge status={l.status} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Complaints */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                        <i className="fas fa-exclamation-circle text-rose-500 text-sm" />
                      </div>
                      <h3 className="font-semibold text-[#1F2937]" style={{ fontSize: '18px' }}>Recent Complaints</h3>
                    </div>
                    <button onClick={() => navigate('Complaints')} className="text-xs text-primary font-medium hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                    {complaints.slice(0, 4).map(c => (
                      <div key={c._id || c.id} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-semibold text-[#1F2937]" style={{ fontSize: '13px' }}>{c.student?.fullName || 'N/A'}</p>
                          <p className="text-[#6B7280] font-normal" style={{ fontSize: '11px' }}>{c.category} · <PriorityBadge priority={c.priority} /></p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══ STUDENT MANAGEMENT ══════════════════════════════════════════ */}
          {activeTab === 'Student Management' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Student Management</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* Search + filter bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search by name or Register No…"
                      value={searchStudents}
                      onChange={e => { setSearchStudents(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontSize: '15px' }}>
                    <thead>
                      <tr className="border-b border-gray-100 text-[#6B7280] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 500 }}>
                        <th className="pb-3 text-left font-medium">Register No</th>
                        <th className="pb-3 text-left font-medium">Name</th>
                        <th className="pb-3 text-left font-medium hidden md:table-cell">Department</th>
                        <th className="pb-3 text-left font-medium hidden sm:table-cell">Year</th>
                        <th className="pb-3 text-left font-medium">Room</th>
                        <th className="pb-3 text-left font-medium">Status</th>
                        <th className="pb-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginate(filteredStudents).map(s => (
                        <tr key={s._id || s.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-4 font-medium text-[#374151]" style={{ fontSize: '13px' }}>{s.registerNumber || 'N/A'}</td>
                          <td className="py-4 font-semibold text-[#1F2937]">{s.fullName}</td>
                          <td className="py-4 text-[#374151] font-normal hidden md:table-cell">{s.department}</td>
                          <td className="py-4 text-[#374151] font-normal hidden sm:table-cell">{s.year}</td>
                          <td className="py-4 text-[#374151] font-normal">Rm {s.room?.roomNumber || s.roomNumber || 'N/A'}</td>
                          <td className="py-4"><StatusBadge status={s.room ? 'Active' : 'Inactive'} /></td>
                          <td className="py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setViewStudent(s);
                                  setShowStudentDetailsModal(true);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <i className="fas fa-eye mr-1" />Profile
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStudent(s);
                                  setAllocRoomId(s.room?._id || s.room?.id || '');
                                  setShowRoomModal(true);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <i className="fas fa-bed mr-1" />Room
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No students found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalPages(filteredStudents) > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">← Prev</button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages(filteredStudents), p + 1))} disabled={currentPage === totalPages(filteredStudents)}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ LEAVE REQUESTS ══════════════════════════════════════════════ */}
          {activeTab === 'Leave Requests' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Leave Request Management</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search by student name…"
                      value={searchLeaves}
                      onChange={e => { setSearchLeaves(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontSize: '15px' }}>
                    <thead>
                      <tr className="border-b border-gray-100 text-[#6B7280] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 500 }}>
                        <th className="pb-3 text-left font-medium">Student</th>
                        <th className="pb-3 text-left font-medium hidden sm:table-cell">Room</th>
                        <th className="pb-3 text-left font-medium hidden md:table-cell">Leave Type</th>
                        <th className="pb-3 text-left font-medium hidden lg:table-cell">From</th>
                        <th className="pb-3 text-left font-medium hidden lg:table-cell">To</th>
                        <th className="pb-3 text-left font-medium hidden xl:table-cell">Reason</th>
                        <th className="pb-3 text-left font-medium">Status</th>
                        <th className="pb-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginate(filteredLeaves).map(l => (
                        <tr key={l._id || l.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-4 font-semibold text-[#1F2937]">{l.student?.fullName || 'N/A'}</td>
                          <td className="py-4 text-[#374151] font-normal hidden sm:table-cell">Rm {l.room?.roomNumber || l.student?.room?.roomNumber || l.student?.roomNumber || 'N/A'}</td>
                          <td className="py-4 text-[#374151] font-normal hidden md:table-cell">{l.leaveType}</td>
                          <td className="py-4 text-[#374151] font-normal hidden lg:table-cell">{l.fromDate ? new Date(l.fromDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-4 text-[#374151] font-normal hidden lg:table-cell">{l.toDate ? new Date(l.toDate).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-4 text-[#6B7280] font-normal hidden xl:table-cell max-w-[140px] truncate">{l.reason}</td>
                          <td className="py-4"><StatusBadge status={l.status} /></td>
                          <td className="py-4">
                            {l.status === 'Pending' ? (
                              <div className="flex gap-2">
                                <button onClick={() => handleLeaveAction(l._id || l.id, 'Approved')}
                                  className="px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                  <i className="fas fa-check mr-1" />Approve
                                </button>
                                <button onClick={() => handleLeaveAction(l._id || l.id, 'Rejected')}
                                  className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                  <i className="fas fa-times mr-1" />Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Actioned</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredLeaves.length === 0 && (
                        <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">No leave requests found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages(filteredLeaves) > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredLeaves.length)} of {filteredLeaves.length}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">← Prev</button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages(filteredLeaves), p + 1))} disabled={currentPage === totalPages(filteredLeaves)}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ COMPLAINTS ══════════════════════════════════════════════════ */}
          {activeTab === 'Complaints' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Complaint Management</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      placeholder="Search by student or complaint ID…"
                      value={searchComplaints}
                      onChange={e => { setSearchComplaints(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontSize: '15px' }}>
                    <thead>
                      <tr className="border-b border-gray-100 text-[#6B7280] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 500 }}>
                        <th className="pb-3 text-left font-medium">ID</th>
                        <th className="pb-3 text-left font-medium">Student</th>
                        <th className="pb-3 text-left font-medium hidden md:table-cell">Category</th>
                        <th className="pb-3 text-left font-medium hidden sm:table-cell">Priority</th>
                        <th className="pb-3 text-left font-medium">Status</th>
                        <th className="pb-3 text-left font-medium hidden lg:table-cell">Date</th>
                        <th className="pb-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginate(filteredComplaints).map(c => (
                        <tr key={c._id || c.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="py-4 font-medium text-[#374151]" style={{ fontSize: '13px' }}>{(c._id || '').slice(-6).toUpperCase()}</td>
                          <td className="py-4 font-semibold text-[#1F2937]">{c.student?.fullName || 'N/A'}</td>
                          <td className="py-4 text-[#374151] font-normal hidden md:table-cell">{c.category}</td>
                          <td className="py-4 hidden sm:table-cell"><PriorityBadge priority={c.priority} /></td>
                          <td className="py-4"><StatusBadge status={c.status} /></td>
                          <td className="py-4 text-[#6B7280] font-normal hidden lg:table-cell">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {c.status === 'Pending' && (
                                <button onClick={() => handleComplaintAction(c._id || c.id, 'In Progress')}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                  In Progress
                                </button>
                              )}
                              {(c.status === 'Pending' || c.status === 'In Progress') && (
                                <button onClick={() => handleComplaintAction(c._id || c.id, 'Resolved')}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                                  Resolve
                                </button>
                              )}
                              {c.status === 'Pending' && (
                                <button onClick={() => handleComplaintAction(c._id || c.id, 'Rejected')}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                  Reject
                                </button>
                              )}
                              {(c.status === 'Resolved' || c.status === 'Rejected') && (
                                <span className="text-xs text-gray-400 font-medium">Closed</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredComplaints.length === 0 && (
                        <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">No complaints found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalPages(filteredComplaints) > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-400">Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)} of {filteredComplaints.length}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">← Prev</button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages(filteredComplaints), p + 1))} disabled={currentPage === totalPages(filteredComplaints)}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-40 transition-colors">Next →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ VISITOR MANAGEMENT ══════════════════════════════════════════ */}
          {activeTab === 'Visitors' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Visitor Management</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* On-the-spot Registration Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-1 h-fit">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center space-x-2" style={{ fontSize: '18px' }}>
                    <i className="fas fa-user-plus text-primary text-base" />
                    <span>On-the-Spot Registration</span>
                  </h3>
                  <form onSubmit={handleRegisterVisitorOnSpot} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Register No</label>
                      <input
                        type="text"
                        placeholder="e.g. 731520104001"
                        value={onSpotStudentId}
                        onChange={e => setOnSpotStudentId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Visitor Name</label>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={onSpotVisitorName}
                        onChange={e => setOnSpotVisitorName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Relationship</label>
                        <input
                          type="text"
                          placeholder="e.g. Parent, Friend"
                          value={onSpotRelationship}
                          onChange={e => setOnSpotRelationship(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                        <input
                          type="text"
                          placeholder="10-digit number"
                          value={onSpotPhoneNumber}
                          onChange={e => setOnSpotPhoneNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Visit Date</label>
                      <input
                        type="date"
                        value={onSpotVisitDate}
                        onChange={e => setOnSpotVisitDate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Purpose of Visit</label>
                      <input
                        type="text"
                        placeholder="e.g. Delivery, Query, Meet"
                        value={onSpotPurpose}
                        onChange={e => setOnSpotPurpose(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary transition"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center space-x-1"
                    >
                      <i className="fas fa-plus" />
                      <span>Register Visitor</span>
                    </button>
                  </form>
                </div>

                {/* Visitor Log Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                  <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="relative flex-1">
                      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search by visitor or student name…"
                        value={searchVisitors}
                        onChange={e => { setSearchVisitors(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: '15px' }}>
                      <thead>
                        <tr className="border-b border-gray-100 text-[#6B7280] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 500 }}>
                          <th className="pb-3 text-left font-medium">Visitor Name</th>
                          <th className="pb-3 text-left font-medium">Student</th>
                          <th className="pb-3 text-left font-medium hidden sm:table-cell">Relationship</th>
                          <th className="pb-3 text-left font-medium hidden md:table-cell">Visit Date</th>
                          <th className="pb-3 text-left font-medium">Status</th>
                          <th className="pb-3 text-left font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {paginate(filteredVisitors).map(v => (
                          <tr key={v._id || v.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 font-semibold text-[#1F2937]">{v.visitorName}</td>
                            <td className="py-4 text-[#374151] font-normal">{v.student?.fullName || 'N/A'}</td>
                            <td className="py-4 text-[#374151] font-normal hidden sm:table-cell">{v.relationship}</td>
                            <td className="py-4 text-[#374151] font-normal hidden md:table-cell">{v.visitDate ? new Date(v.visitDate).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-4"><StatusBadge status={v.status} /></td>
                            <td className="py-4">
                              {v.status === 'Pending' ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleVisitorAction(v._id || v.id, 'Approved')}
                                    className="px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                    <i className="fas fa-check mr-1" />Approve
                                  </button>
                                  <button onClick={() => handleVisitorAction(v._id || v.id, 'Rejected')}
                                    className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                    <i className="fas fa-times mr-1" />Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">Actioned</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredVisitors.length === 0 && (
                          <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No visitor requests found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ANNOUNCEMENTS ══════════════════════════════════════════════ */}
          {activeTab === 'Announcements' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Announcements</h2>
                <button
                  onClick={openNewAnn}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  style={{ fontSize: '14px' }}
                >
                  <i className="fas fa-plus text-xs" />
                  <span>New Announcement</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map(ann => (
                  <div key={ann._id || ann.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-4">
                        <h3 className="font-semibold text-[#1F2937] leading-tight mb-1" style={{ fontSize: '18px' }}>{ann.title}</h3>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={ann.priority} />
                          <span className="text-[#6B7280]" style={{ fontSize: '12px', fontWeight: 500 }}>{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[#374151] font-normal leading-relaxed mb-4" style={{ fontSize: '15px' }}>{ann.description}</p>
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => openEditAnn(ann)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <i className="fas fa-edit" /><span>Edit</span>
                      </button>
                      <button
                        onClick={() => deleteAnn(ann._id || ann.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <i className="fas fa-trash-alt" /><span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
                    <i className="fas fa-bullhorn text-gray-300 text-5xl mb-4" />
                    <p className="text-base font-semibold text-gray-800 mb-1">No announcements yet</p>
                    <p className="text-sm text-gray-400 font-normal max-w-sm">Click "New Announcement" to post one for students.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ OCCUPANCY REPORTS ══════════════════════════════════════════ */}
          {activeTab === 'Occupancy Reports' && (
            <div className="flex flex-col space-y-6 w-full text-left animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Occupancy Reports</h2>

              {/* KPI Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-[10px] text-gray-450 font-black uppercase tracking-wider block">Total Capacity</span>
                  <span className="text-2xl font-black text-gray-900 mt-1 block">
                    {occupancyStats.totalCapacity} Beds
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-[10px] text-gray-450 font-black uppercase tracking-wider block">Occupied Beds</span>
                  <span className="text-2xl font-black text-primary mt-1 block">
                    {occupancyStats.occupiedBeds} Beds
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-[10px] text-gray-455 font-black uppercase tracking-wider block">Available Beds</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    {occupancyStats.availableBeds} Beds
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <span className="text-[10px] text-gray-450 font-black uppercase tracking-wider block">Occupancy Rate</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl font-black text-amber-500">
                      {occupancyStats.occupancyRate}%
                    </span>
                    <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden shrink-0">
                      <div 
                        className="bg-amber-500 h-full rounded-full" 
                        style={{ 
                          width: `${occupancyStats.occupancyRate}%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Filter Criteria</h3>
                  <button
                    onClick={() => { setReportFloor(''); setReportSearch(''); }}
                    className="text-xs font-bold text-gray-455 hover:text-primary transition border-none bg-transparent"
                  >
                    Clear Filters
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Select Floor</label>
                    <select value={reportFloor} onChange={e => setReportFloor(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white">
                      <option value="">All Floors</option>
                      <option value="1">1st Floor</option>
                      <option value="2">2nd Floor</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-gray-600">Search Room</label>
                    <input
                      type="text"
                      placeholder="Room No..."
                      value={reportSearch}
                      onChange={e => setReportSearch(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-primary bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Print / Export Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {rooms.filter(r => {
                    const q = reportSearch.toLowerCase();
                    const sMatch = q ? (r.roomNumber || '').toLowerCase().includes(q) : true;
                    const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
                    return sMatch && fMatch;
                  }).length} Rooms Filtered
                </span>
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

              {/* Room Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider select-none">
                      <th onClick={() => {
                        if (sortField === 'roomNumber') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortField('status'); setSortOrder('asc'); }
                      }} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50 font-bold">
                        Occupancy Status <i className={`fas fa-sort ml-1 ${sortField === 'status' ? 'text-primary' : 'text-gray-300'}`} />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {(() => {
                      const filtered = rooms.filter(r => {
                        const q = reportSearch.toLowerCase();
                        const sMatch = q ? (r.roomNumber || '').toLowerCase().includes(q) : true;
                        const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
                        return sMatch && fMatch;
                      });

                      const sortedRooms = [...filtered].sort((a, b) => {
                        let vA = a[sortField] || ''; let vB = b[sortField] || '';
                        return sortOrder === 'asc' ? String(vA).localeCompare(String(vB)) : String(vB).localeCompare(String(vA));
                      });

                      const pageRooms = sortedRooms.slice((occupancyPage - 1) * occupancyPerPage, occupancyPage * occupancyPerPage);

                      if (pageRooms.length === 0) return (
                        <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-medium">No rooms matched the filter criteria.</td></tr>
                      );

                      return pageRooms.map((room, idx) => (
                        <tr key={room._id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-left font-bold text-gray-800">{room.roomNumber}</td>
                          <td className="px-6 py-4 text-left font-medium text-gray-650">{room.floorNumber}</td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-600">{room.capacity}</td>
                          <td className="px-6 py-4 text-center font-bold text-primary">{room.occupiedBeds}</td>
                          <td className="px-6 py-4 text-center font-bold text-emerald-600">{room.availableBeds}</td>
                          <td className="px-6 py-4 text-left font-semibold">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              room.status === 'VACANT' || room.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' :
                              room.status === 'PARTIALLY OCCUPIED' ? 'bg-blue-50 text-blue-700' :
                              'bg-rose-50 text-rose-700'
                            }`}>{room.status}</span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {rooms.filter(r => {
                const q = reportSearch.toLowerCase();
                const sMatch = q ? (r.roomNumber || '').toLowerCase().includes(q) : true;
                const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
                return sMatch && fMatch;
              }).length > occupancyPerPage && (
                <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm font-sans">
                  <button
                    disabled={occupancyPage === 1}
                    onClick={() => setOccupancyPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-medium">
                    Page {occupancyPage} of {Math.ceil(rooms.filter(r => {
                      const q = reportSearch.toLowerCase();
                      const sMatch = q ? (r.roomNumber || '').toLowerCase().includes(q) : true;
                      const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
                      return sMatch && fMatch;
                    }).length / occupancyPerPage)}
                  </span>
                  <button
                    disabled={occupancyPage * occupancyPerPage >= rooms.filter(r => {
                      const q = reportSearch.toLowerCase();
                      const sMatch = q ? (r.roomNumber || '').toLowerCase().includes(q) : true;
                      const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
                      return sMatch && fMatch;
                    }).length}
                    onClick={() => setOccupancyPage(p => p + 1)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ SETTINGS ════════════════════════════════════════════════════ */}
          {activeTab === 'Settings' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="font-bold text-[#111827]" style={{ fontSize: '24px' }}>Settings</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Update Profile */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-[#1F2937] mb-5" style={{ fontSize: '18px' }}>Update Profile</h3>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold" style={{ fontSize: '24px' }}>
                      {initials.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1F2937]" style={{ fontSize: '18px' }}>{name}</p>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full">Warden</span>
                    </div>
                  </div>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Full Name</label>
                        <input type="text" value={wardenName} onChange={e => setWardenName(e.target.value)} placeholder="Full name" className={inp} />
                      </div>
                      <div>
                        <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Email (Read Only)</label>
                        <input type="text" value={email} disabled className={`${inp} opacity-60 cursor-not-allowed`} />
                      </div>
                      <div>
                        <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Phone Number</label>
                        <input type="text" value={wardenPhone} onChange={e => setWardenPhone(e.target.value)} placeholder="Phone number" className={inp} />
                      </div>
                      <div>
                        <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Employee ID (Read Only)</label>
                        <input type="text" value={profile?.employeeId || user?.employeeId || 'W-2024-001'} disabled className={`${inp} opacity-60 cursor-not-allowed`} />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-5 bg-primary hover:bg-primary-light text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm hover:shadow"
                      style={{ fontSize: '17px' }}
                    >
                      Save Changes
                    </button>
                  </form>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                  <h3 className="font-semibold text-[#1F2937] mb-5" style={{ fontSize: '18px' }}>Notification Preferences</h3>
                  <div className="space-y-5">
                    {[
                      { label: 'Email Notifications', sub: 'Leave & complaint alerts',    val: emailNotifs, set: setEmailNotifs },
                      { label: 'SMS Notifications',   sub: 'Urgent leave requests',       val: smsNotifs,   set: setSmsNotifs   },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                          <p className="text-xs text-gray-400">{s.sub}</p>
                        </div>
                        <button onClick={() => s.set(!s.val)} className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${s.val ? 'bg-primary' : 'bg-gray-200'}`}>
                          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${s.val ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => showToast('Preferences saved!')}
                    className="mt-5 w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow"
                    style={{ fontSize: '14px' }}
                  >
                    Save Preferences
                  </button>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                  <h3 className="font-semibold text-[#1F2937] mb-5" style={{ fontSize: '18px' }}>Change Password</h3>
                  <form onSubmit={submitPw} className="space-y-4">
                    {[['Current Password', oldPw, setOldPw], ['New Password', newPw, setNewPw], ['Confirm Password', confirmPw, setConfirmPw]].map(([label, val, setter]) => (
                      <div key={label}>
                        <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>{label}</label>
                        <input type="password" placeholder="••••••••" value={val} onChange={e => setter(e.target.value)} className={inp} />
                      </div>
                    ))}
                    <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow mt-1" style={{ fontSize: '17px' }}>
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          </div>

          {/* Global Footer */}
          <footer className="mt-12 py-6 border-t border-gray-100 flex items-center justify-center shrink-0">
            <p className="text-xs text-gray-400 font-normal">
              © 2026 HostelHub System. All rights reserved.
            </p>
          </footer>
        </main>
      </div>

      {/* ── ANNOUNCEMENT MODAL ─────────────────────────────────────────────── */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAnnModal(false)} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl relative z-10 animate-scaleIn text-left">
            <button onClick={() => setShowAnnModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
              <i className="fas fa-times" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-6">{editAnn ? 'Edit Announcement' : 'New Announcement'}</h3>
            <div className="space-y-4">
              <div>
                <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Title</label>
                <input type="text" placeholder="Announcement title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Description</label>
                <textarea rows={4} placeholder="Announcement content…" value={annDesc} onChange={e => setAnnDesc(e.target.value)} className={`${inp} resize-none`} />
              </div>
              <div>
                <label className="uppercase tracking-wider block mb-1.5 text-[#4B5563]" style={{ fontSize: '11px', fontWeight: 500 }}>Priority</label>
                <select value={annPriority} onChange={e => setAnnPriority(e.target.value)} className={inp}>
                  {['High', 'Normal', 'Low'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button onClick={saveAnn} className="mt-6 w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-3 rounded-xl transition-colors">
              {editAnn ? 'Update Announcement' : 'Post Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* ── MY PROFILE MODAL ─────────────────────────────────────────────── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg shadow-2xl relative z-10 animate-scaleIn text-left max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
              <i className="fas fa-times" />
            </button>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">{initials.charAt(0)}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold uppercase rounded-full">Warden</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
              {[
                ['Email',       user?.email       || 'keerthana.warden@hostel.com'],
                ['Phone',       user?.phoneNumber  || '+91 99001 23456'],
                ['Employee ID', user?.employeeId   || 'W-2024-001'],
                ['Hostel Block','Blocks A, B & C'],
                ['Gender',      user?.gender       || 'Female'],
                ['Joined',      '2020-08-01'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-400 uppercase tracking-wider text-[9px] mb-0.5">{k}</p>
                  <p className="font-medium text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowProfileModal(false)} className="mt-7 w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD MODAL ─────────────────────────────────────────── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowPwModal(false)} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl relative z-10 animate-scaleIn text-left">
            <button onClick={() => setShowPwModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><i className="fas fa-times" /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Change Password</h3>
            <form onSubmit={submitPw} className="space-y-4">
              {[['Old Password', oldPw, setOldPw], ['New Password', newPw, setNewPw], ['Confirm Password', confirmPw, setConfirmPw]].map(([label, val, setter]) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input type="password" placeholder="••••••••" value={val} onChange={e => setter(e.target.value)} className={inp} />
                </div>
              ))}
              <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-2">Update Password</button>
            </form>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL ───────────────────────────────────────────────── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl relative z-10 animate-scaleIn text-left">
            <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><i className="fas fa-times" /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Settings</h3>
            <div className="space-y-5">
              {[
                { label: 'Email Notifications', sub: 'Leave & complaint alerts',    val: emailNotifs, set: setEmailNotifs },
                { label: 'SMS Notifications',   sub: 'Urgent leave requests',       val: smsNotifs,   set: setSmsNotifs   },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-gray-800">{s.label}</p><p className="text-xs text-gray-400">{s.sub}</p></div>
                  <button onClick={() => s.set(!s.val)} className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none ${s.val ? 'bg-primary' : 'bg-gray-200'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${s.val ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => { showToast('Preferences saved!'); setShowSettingsModal(false); }} className="mt-7 w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Save Settings</button>
          </div>
        </div>
      )}

      {/* Room Allocation Modal */}
      {showRoomModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowRoomModal(false); setSelectedStudent(null); }} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl relative z-10 animate-scaleIn text-left">
            <button onClick={() => { setShowRoomModal(false); setSelectedStudent(null); }} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <i className="fas fa-times" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Allocate Room</h3>
            <p className="text-sm text-gray-600 mb-4">
              Allocate or change the room for student <strong className="text-gray-900">{selectedStudent.fullName}</strong>.
            </p>
            <form onSubmit={handleRoomAllocate} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Select Room</label>
                <select value={allocRoomId} onChange={e => setAllocRoomId(e.target.value)} className={inp}>
                  <option value="">No Room (Deallocate)</option>
                  {rooms.map(r => (
                    <option key={r._id || r.id} value={r._id || r.id} disabled={r.occupiedBeds >= r.capacity && (selectedStudent.room?._id || selectedStudent.room?.id) !== (r._id || r.id)}>
                      Rm {r.roomNumber} ({r.blockName}) — Beds: {r.occupiedBeds}/{r.capacity} {r.occupiedBeds >= r.capacity ? '[FULL]' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-2">
                Save Allocation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: STUDENT PROFILE DETAILS ───────────────────────────────────── */}
      {showStudentDetailsModal && viewStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 text-left font-sans animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn">
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-gray-900 font-outfit">Student Profile Details</h3>
              <button onClick={() => { setViewStudent(null); setShowStudentDetailsModal(false); }} className="text-gray-400 hover:text-gray-700">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-xs font-sans">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  {viewStudent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{viewStudent.fullName}</h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-105 text-primary`}>
                    Room: {viewStudent.room?.roomNumber || viewStudent.roomNumber || 'Not Allocated'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Register Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.registerNumber || 'N/A'}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl col-span-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-gray-800">{viewStudent.email}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="font-semibold text-gray-800">{viewStudent.phoneNumber || 'N/A'}</p>
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
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hostel</p>
                  <p className="font-semibold text-gray-800">{viewStudent.hostelName || 'N/A'}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Block</p>
                  <p className="font-semibold text-gray-800">{viewStudent.block || 'N/A'}</p>
                </div>
                <div className="border border-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Floor</p>
                  <p className="font-semibold text-gray-800">{viewStudent.floor || 'N/A'}</p>
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
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
