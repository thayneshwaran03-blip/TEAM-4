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
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [showRoomModal,   setShowRoomModal]   = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [allocRoomId,     setAllocRoomId]     = useState('');

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
  const assignedFloorLabel = profile?.assignedBlocks && profile.assignedBlocks.length > 0
    ? profile.assignedBlocks.join(', ')
    : 'N/A';

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
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFillColor(26, 35, 126);
    doc.rect(0, 0, 297, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('HostelHub - Occupancy Report', 15, 16);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const hostel = profile?.assignedHostel || 'N/A';
    const warden = profile?.fullName || 'N/A';
    const dateStr = new Date().toLocaleString();

    doc.text(`Warden Name: ${warden}`, 15, 35);
    doc.text(`Hostel: ${hostel}`, 15, 41);
    doc.text(`Assigned Floor: ${assignedFloorLabel}`, 15, 47);
    doc.text(`Date & Time: ${dateStr}`, 15, 53);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Statistics', 15, 65);

    const statLabels = [
      { label: 'Total Capacity', val: `${occupancyStats.totalCapacity} Beds` },
      { label: 'Occupied Beds', val: `${occupancyStats.occupiedBeds} Beds` },
      { label: 'Available Beds', val: `${occupancyStats.availableBeds} Beds` },
      { label: 'Occupancy Rate', val: `${occupancyStats.occupancyRate}%` },
      { label: 'Occupied Rooms', val: `${occupancyStats.occupiedRooms} Rooms` },
      { label: 'Vacant Rooms', val: `${occupancyStats.vacantRooms} Rooms` }
    ];

    let currentX = 15;
    const cardWidth = 42;
    const cardHeight = 18;

    statLabels.forEach((stat) => {
      doc.setFillColor(240, 244, 255);
      doc.setDrawColor(180, 198, 252);
      doc.roundedRect(currentX, 72, cardWidth, cardHeight, 1.5, 1.5, 'FD');
      
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.label, currentX + 4, 77);

      doc.setTextColor(26, 35, 126);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.val, currentX + 4, 85);

      currentX += cardWidth + 5;
    });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Occupancy Table', 15, 102);

    const tableHeaders = [['Room Number', 'Floor', 'Capacity', 'Occupied Beds', 'Available Beds', 'Occupancy Status']];
    
    const filteredRooms = rooms.filter(r => {
      const q = reportSearch.toLowerCase();
      const sMatch = q ? (r.roomNumber || '').includes(q) : true;
      const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
      return sMatch && fMatch;
    });

    const tableRows = filteredRooms.map(r => [
      r.roomNumber,
      r.floorNumber,
      r.capacity,
      r.occupiedBeds,
      Math.max(0, r.capacity - r.occupiedBeds),
      r.status
    ]);

    doc.autoTable({
      startY: 108,
      head: tableHeaders,
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [26, 35, 126],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [55, 65, 81],
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      },
      didDrawPage: (data) => {
        const str = 'Page ' + doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(str, 280, 200, { align: 'right' });
        doc.text('HostelHub - Centralized Hostel Management System', 15, 200);
      }
    });

    doc.save(`Occupancy_Report_${assignedFloorLabel}_${Date.now()}.pdf`);
  };

  const triggerPrintReport = () => {
    const hostel = profile?.assignedHostel || 'N/A';
    const warden = profile?.fullName || 'N/A';
    const dateStr = new Date().toLocaleString();

    const printWindow = window.open('', '_blank');
    
    const filteredRooms = rooms.filter(r => {
      const q = reportSearch.toLowerCase();
      const sMatch = q ? (r.roomNumber || '').includes(q) : true;
      const fMatch = reportFloor ? String(r.floorNumber) === reportFloor : true;
      return sMatch && fMatch;
    });

    const tableRowsHtml = filteredRooms.map(r => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-align: center;">${r.roomNumber}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${r.floorNumber}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${r.capacity}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #1a237e; font-weight: bold;">${r.occupiedBeds}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #10b981; font-weight: bold;">${Math.max(0, r.capacity - r.occupiedBeds)}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
          <span style="padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 900; background-color: ${r.status === 'FULL' ? '#fef2f2' : '#ecfdf5'}; color: ${r.status === 'FULL' ? '#b91c1c' : '#047857'};">${r.status}</span>
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Occupancy Report - ${assignedFloorLabel}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 40px; color: #333; }
            .header-bar { background-color: #1a237e; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header-bar h1 { margin: 0; font-size: 24px; }
            .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .meta-col { flex: 1; }
            .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; margin-bottom: 30px; }
            .stat-card { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 15px; text-align: center; }
            .stat-card p.label { margin: 0 0 5px; color: #4b5563; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .stat-card p.val { margin: 0; color: #1a237e; font-size: 18px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #1a237e; color: white; padding: 12px; font-weight: bold; text-align: center; border: 1px solid #ddd; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; border-t: 1px solid #e5e7eb; pt-10; }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h1>HostelHub - Occupancy Report</h1>
            <p style="margin: 5px 0 0; opacity: 0.8;">Centralized Hostel Management System</p>
          </div>
          <div class="meta-info">
            <div class="meta-col">
              <p><strong>Warden Name:</strong> ${warden}</p>
              <p><strong>Hostel:</strong> ${hostel}</p>
            </div>
            <div class="meta-col" style="text-align: right;">
              <p><strong>Assigned Floor:</strong> ${assignedFloorLabel}</p>
              <p><strong>Date & Time:</strong> ${dateStr}</p>
            </div>
          </div>
          <h2 style="font-size: 18px; border-bottom: 2px solid #1a237e; padding-bottom: 8px; margin-bottom: 15px;">Dashboard Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <p class="label">Total Capacity</p>
              <p class="val">${occupancyStats.totalCapacity} Beds</p>
            </div>
            <div class="stat-card">
              <p class="label">Occupied Beds</p>
              <p class="val">${occupancyStats.occupiedBeds} Beds</p>
            </div>
            <div class="stat-card">
              <p class="label">Available Beds</p>
              <p class="val">${occupancyStats.availableBeds} Beds</p>
            </div>
            <div class="stat-card">
              <p class="label">Occupancy Rate</p>
              <p class="val">${occupancyStats.occupancyRate}%</p>
            </div>
            <div class="stat-card">
              <p class="label">Occupied Rooms</p>
              <p class="val">${occupancyStats.occupiedRooms} Rooms</p>
            </div>
            <div class="stat-card">
              <p class="label">Vacant Rooms</p>
              <p class="val">${occupancyStats.vacantRooms} Rooms</p>
            </div>
          </div>
          <h2 style="font-size: 18px; border-bottom: 2px solid #1a237e; padding-bottom: 8px; margin-bottom: 15px;">Detailed Occupancy List</h2>
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
          <div class="footer">
            <span>HostelHub System - Centralized Hostel Management</span>
            <span>Printed on: ${dateStr}</span>
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
    { id: 'Settings',           icon: 'fa-cog',              label: 'Settings'            },
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
  const filteredStudents   = students.filter(s => (s.fullName || '').toLowerCase().includes(searchStudents.toLowerCase()) || (s._id || '').toLowerCase().includes(searchStudents.toLowerCase()));
  const filteredLeaves     = leaveRequests.filter(l => (l.student?.fullName || '').toLowerCase().includes(searchLeaves.toLowerCase()));
  const filteredComplaints = complaints.filter(c => (c.student?.fullName || '').toLowerCase().includes(searchComplaints.toLowerCase()) || (c._id || '').toLowerCase().includes(searchComplaints.toLowerCase()));
  const filteredVisitors   = visitors.filter(v => (v.visitorName || '').toLowerCase().includes(searchVisitors.toLowerCase()) || (v.student?.fullName || '').toLowerCase().includes(searchVisitors.toLowerCase()));

  const ITEMS_PER_PAGE = 5;
  const paginate = arr => arr.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = arr => Math.ceil(arr.length / ITEMS_PER_PAGE);
  const floorOptions = Array.from(new Set([...(profile?.assignedBlocks || []), ...rooms.map(r => String(r.floorNumber)).filter(Boolean)]));

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
                      placeholder="Search by name or ID…"
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
                        <th className="pb-3 text-left font-medium">Student ID</th>
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
                          <td className="py-4 font-medium text-[#374151]" style={{ fontSize: '13px' }}>{(s._id || '').slice(-6).toUpperCase()}</td>
                          <td className="py-4 font-semibold text-[#1F2937]">{s.fullName}</td>
                          <td className="py-4 text-[#374151] font-normal hidden md:table-cell">{s.department}</td>
                          <td className="py-4 text-[#374151] font-normal hidden sm:table-cell">{s.year}</td>
                          <td className="py-4 text-[#374151] font-normal">Rm {s.room?.roomNumber || 'N/A'}</td>
                          <td className="py-4"><StatusBadge status={s.room ? 'Active' : 'Inactive'} /></td>
                          <td className="py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStudentDetails(s);
                                  setShowStudentModal(true);
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
                          <td className="py-4 text-[#374151] font-normal hidden sm:table-cell">Rm {l.room?.roomNumber || 'N/A'}</td>
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
                      <label className="block text-xs font-bold text-gray-500 mb-1">Student ID / Reg No</label>
                      <input
                        type="text"
                        placeholder="e.g. STU-123456 or RegNo"
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
                      {floorOptions.map(floor => (
                        <option key={floor} value={String(floor)}>{String(floor).replace(/^/, 'Floor ')}</option>
                      ))}
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
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={triggerPrintReport}
                    className="flex-1 sm:flex-none border border-gray-250 hover:bg-gray-50 text-gray-600 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <i className="fas fa-print" />
                    <span>Print Report</span>
                  </button>
                  <button
                    onClick={exportOccupancyReportPDF}
                    className="flex-1 sm:flex-none border border-gray-250 hover:bg-gray-50 text-gray-600 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <i className="fas fa-file-pdf text-rose-500" />
                    <span>Export PDF</span>
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
                        else { setSortField('roomNumber'); setSortOrder('asc'); }
                      }} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50 font-bold">
                        Room No. <i className={`fas fa-sort ml-1 ${sortField === 'roomNumber' ? 'text-primary' : 'text-gray-300'}`} />
                      </th>
                      <th onClick={() => {
                        if (sortField === 'floorNumber') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else { setSortField('floorNumber'); setSortOrder('asc'); }
                      }} className="px-6 py-4 text-left cursor-pointer hover:bg-gray-100/50 font-bold font-sans">
                        Floor <i className={`fas fa-sort ml-1 ${sortField === 'floorNumber' ? 'text-primary' : 'text-gray-300'}`} />
                      </th>
                      <th className="px-6 py-4 text-center font-bold">Capacity</th>
                      <th className="px-6 py-4 text-center font-bold">Occupied Beds</th>
                      <th className="px-6 py-4 text-center font-bold">Available Beds</th>
                      <th onClick={() => {
                        if (sortField === 'status') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
                              room.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
                ['Assigned Floor', assignedFloorLabel],
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

      {/* Student Details Modal */}
      {showStudentModal && selectedStudentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowStudentModal(false); setSelectedStudentDetails(null); }} />
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg shadow-2xl relative z-10 animate-scaleIn text-left">
            <button onClick={() => { setShowStudentModal(false); setSelectedStudentDetails(null); }} className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <i className="fas fa-times" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-6">Student Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Student ID</p>
                <p className="font-medium text-gray-800">{(selectedStudentDetails._id || '').slice(-6).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Name</p>
                <p className="font-medium text-gray-800">{selectedStudentDetails.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                <p className="font-medium text-gray-800">{selectedStudentDetails.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Year</p>
                <p className="font-medium text-gray-800">{selectedStudentDetails.year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Hostel</p>
                <p className="font-medium text-gray-800">{selectedStudentDetails.hostelName || profile?.assignedHostel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Floor</p>
                <p className="font-medium text-gray-800">{selectedStudentDetails.floor || selectedStudentDetails.room?.floorNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Room</p>
                <p className="font-medium text-gray-800">{selectedStudentDetails.room?.roomNumber ? `Rm ${selectedStudentDetails.room.roomNumber}` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                <p className="font-medium text-gray-800">{selectedStudentDetails.phone || 'N/A'}</p>
              </div>
            </div>
            <button onClick={() => { setShowStudentModal(false); setSelectedStudentDetails(null); }} className="mt-7 w-full bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">Close</button>
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

    </div>
  );
}
