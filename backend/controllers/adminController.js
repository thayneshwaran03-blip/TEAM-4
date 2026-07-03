const Announcement = require('../models/Announcement');
const Room = require('../models/Room');
const User = require('../models/User');
const { syncRoomStats } = require('../utils/roomHelper');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const VisitorRequest = require('../models/VisitorRequest');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

const updateNotification = async (recipient, type, title, message, relatedTo, metadata = {}) => {
  return Notification.create({ recipient, type, title, message, relatedTo, metadata });
};

// ── Helper: Send credentials email via nodemailer ───────────────────────────
const sendCredentialsEmail = async (toEmail, tempPassword, userName, role, userId = '') => {
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
  const loginUrl = 'http://localhost:5173/login';

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"HostelHub Administration" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Welcome to HostelHub – Your Account Credentials',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
          <div style="background: linear-gradient(135deg, #1a237e, #3949ab); padding: 28px; border-radius: 12px; text-align: center; margin-bottom: 28px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
              Hostel<span style="color: #ffa726;">Hub</span>
            </h1>
            <p style="color: rgba(255,255,255,0.75); margin: 8px 0 0; font-size: 14px;">Centralized Hostel Management System</p>
          </div>

          <div style="background: white; padding: 28px; border-radius: 12px; border: 1px solid #e8ecf0; color: #333;">
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
              Dear <strong>${userName}</strong>,
            </p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
              Your HostelHub account has been created successfully.
            </p>

            <div style="background: #f0f4ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #d0daf7;">
              <h3 style="color: #1a237e; margin: 0 0 12px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #d0daf7; padding-bottom: 8px;">
                Login Details
              </h3>
              <p style="margin: 6px 0; color: #444; font-size: 14px;">
                <strong>Role:</strong> ${displayRole}
              </p>
              ${userId ? `
              <p style="margin: 6px 0; color: #444; font-size: 14px;">
                <strong>${role === 'student' ? 'Register No' : 'Employee ID'}:</strong> <code style="background: #e3ebff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; color: #1a237e;">${userId}</code>
              </p>
              ` : ''}
              <p style="margin: 6px 0; color: #444; font-size: 14px;">
                <strong>Email:</strong> <a href="mailto:${toEmail}" style="color: #3949ab; text-decoration: none;">${toEmail}</a>
              </p>
              <p style="margin: 6px 0; color: #444; font-size: 14px;">
                <strong>Temporary Password:</strong> <code style="background: #e3ebff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; color: #1a237e;">${tempPassword}</code>
              </p>
            </div>

            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
              Please log in and change your password immediately.
            </p>

            <div style="text-align: center; margin: 28px 0 10px;">
              <a href="${loginUrl}" style="background: linear-gradient(135deg, #1a237e, #3949ab); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(26,35,126,0.2);">
                Login to HostelHub
              </a>
            </div>
            <p style="text-align: center; margin-top: 10px; font-size: 13px; color: #666;">
              Login URL: <a href="${loginUrl}" style="color: #3949ab;">${loginUrl}</a>
            </p>
          </div>

          <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 20px;">
            Hostel Administration
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Credentials email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error('Nodemailer Error. Logging credentials email content instead:');
    console.log('==================================================');
    console.log(`TO: ${toEmail}`);
    console.log(`SUBJECT: Welcome to HostelHub – Your Account Credentials`);
    console.log(`BODY:\nDear ${userName},\n\nYour HostelHub account has been created successfully.\n\nLogin Details\nEmail: ${toEmail}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password immediately.\n\nLogin URL: ${loginUrl}\n\nHostel Administration`);
    console.log('==================================================');
    throw error;
  }
};


const createAnnouncement = async (req, res) => {
  try {
    const { title, description, priority, visibleTo, pinned } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const announcement = await Announcement.create({
      title,
      description,
      priority: priority || 'Medium',
      postedBy: req.user._id,
      postedByRole: req.user.role,
      visibleTo: visibleTo && visibleTo.length > 0 ? visibleTo : ['student', 'warden', 'admin'],
      pinned: pinned || false,
    });

    return res.status(201).json({ success: true, message: 'Announcement published successfully', announcement });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to publish announcement', error: error.message });
  }
};

const listAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isPublished: true })
      .populate({ path: 'postedBy', select: 'fullName email role' })
      .sort({ pinned: -1, createdAt: -1 });

    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error('List Announcements Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve announcements', error: error.message });
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomNumber, blockName, floorNumber, capacity, status } = req.body;

    if (!roomNumber || !blockName || !floorNumber || !capacity) {
      return res.status(400).json({ success: false, message: 'Room number, block, floor, and capacity are required' });
    }

    const blockLetter = blockName.replace('Block ', '').trim();
    const formattedRoomNum = roomNumber.trim().startsWith(blockLetter) ? roomNumber.trim() : `${blockLetter}${roomNumber.trim()}`;

    const existingRoom = await Room.findOne({ roomNumber: formattedRoomNum });
    if (existingRoom) {
      return res.status(400).json({ success: false, message: 'Room with that number already exists' });
    }

    const hostelName = (blockName.trim() === 'Block A' || blockName.trim() === 'Block B') ? 'Boys Hostel' : 'Girls Hostel';

    const room = await Room.create({
      roomNumber: formattedRoomNum,
      blockName: blockName.trim(),
      floorNumber: floorNumber.trim(),
      capacity: Number(capacity),
      hostelName,
      status: status || 'VACANT',
      occupiedBeds: 0,
      assignedStudents: []
    });

    return res.status(201).json({ success: true, message: 'Room created successfully', room });
  } catch (error) {
    console.error('Create Room Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create room', error: error.message });
  }
};

const listRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate({
        path: 'assignedStudents',
        select: 'fullName email department year registerNumber'
      })
      .sort({ blockName: 1, floorNumber: 1, roomNumber: 1 });
    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error('List Rooms Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve rooms', error: error.message });
  }
};

// ── Student Management ────────────────────────────────────────────────────────
const createStudent = async (req, res) => {
  try {
    const {
      fullName,
      registerNumber,
      rollNumber,
      email,
      phoneNumber,
      department,
      year,
      gender,
      parentName,
      parentContact,
      hostelName,
      block,
      floor,
      roomNumber,
      bedNumber,
      emergencyContact,
      status,
      temporaryPassword
    } = req.body;

    if (!fullName || !registerNumber || !email || !gender) {
      return res.status(400).json({ success: false, message: 'Required fields are missing: Name, Reg Number, Email, Gender' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const regExists = await User.findOne({ registerNumber });
    if (regExists) {
      return res.status(400).json({ success: false, message: 'Register Number already exists' });
    }

    let tempPassword = temporaryPassword;
    if (!tempPassword || tempPassword.trim() === '') {
      tempPassword = 'Temp@' + Math.floor(100000 + Math.random() * 900000).toString();
    }

    let studentRoomId = null;
    if (roomNumber) {
      if (!block || !floor) {
        return res.status(400).json({ success: false, message: 'Block and Floor are required when Room Number is provided' });
      }
      const blockLetter = block.replace('Block ', '').trim();
      const formattedRoomNum = roomNumber.trim().startsWith(blockLetter) ? roomNumber.trim() : `${blockLetter}${roomNumber.trim()}`;
      
      let targetRoom = await Room.findOne({ roomNumber: formattedRoomNum });
      if (targetRoom) {
        if (targetRoom.occupiedBeds >= targetRoom.capacity) {
          return res.status(400).json({ success: false, message: `Room ${formattedRoomNum} is already full` });
        }
      } else {
        const hostelName = (block.trim() === 'Block A' || block.trim() === 'Block B') ? 'Boys Hostel' : 'Girls Hostel';
        targetRoom = await Room.create({
          roomNumber: formattedRoomNum,
          blockName: block.trim(),
          floorNumber: floor.trim(),
          capacity: 4,
          hostelName,
          status: 'VACANT',
          assignedStudents: []
        });
      }
      studentRoomId = targetRoom._id;
    }

    // Generate unique Student ID
    let studentId = 'STU-' + Math.floor(100000 + Math.random() * 900000);
    let studentIdExists = await User.findOne({ studentId });
    while (studentIdExists) {
      studentId = 'STU-' + Math.floor(100000 + Math.random() * 900000);
      studentIdExists = await User.findOne({ studentId });
    }

    const student = new User({
      fullName,
      registerNumber,
      rollNumber,
      studentId,
      email: email.toLowerCase(),
      phoneNumber,
      department,
      year,
      gender,
      parentName,
      parentContact,
      hostelName,
      block,
      floor,
      roomNumber,
      bedNumber,
      emergencyContact,
      role: 'student',
      isActive: status !== 'Inactive',
      mustChangePassword: true,
      isFirstLogin: true,
      profileCompleted: false,
      passwordChanged: false,
      password: tempPassword,
      room: studentRoomId
    });

    await student.save();

    if (studentRoomId) {
      await syncRoomStats(studentRoomId);
    }

    try {
      await sendCredentialsEmail(student.email, tempPassword, student.fullName, 'student', registerNumber);
    } catch (mailErr) {
      console.error('Failed to send credentials email to student:', mailErr);
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Student created successfully', 
      student,
      temporaryPassword: tempPassword 
    });
  } catch (error) {
    console.error('Create Student Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create student', error: error.message });
  }
};

const listStudents = async (req, res) => {
  try {
    const { search, block, gender, status } = req.query;
    const query = { role: 'student' };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (block) {
      query.block = block;
    }

    if (gender) {
      query.gender = gender;
    }

    if (status) {
      query.isActive = status === 'Active';
    }

    const students = await User.find(query)
      .populate('room')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('List Students Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve students', error: error.message });
  }
};

const getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(id).populate('room');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error('Get Student Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve student details', error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      registerNumber,
      rollNumber,
      email,
      phoneNumber,
      department,
      year,
      gender,
      parentName,
      parentContact,
      hostelName,
      block,
      floor,
      roomNumber,
      bedNumber,
      emergencyContact,
      status
    } = req.body;

    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (email && email.toLowerCase() !== student.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      student.email = email.toLowerCase();
    }

    if (registerNumber && registerNumber !== student.registerNumber) {
      const regExists = await User.findOne({ registerNumber });
      if (regExists) {
        return res.status(400).json({ success: false, message: 'Register Number already exists' });
      }
      student.registerNumber = registerNumber;
    }

    const oldRoomNumber = student.roomNumber;
    const oldRoomId = student.room;

    student.fullName = fullName || student.fullName;
    student.rollNumber = rollNumber !== undefined ? rollNumber : student.rollNumber;
    student.phoneNumber = phoneNumber || student.phoneNumber;
    student.department = department !== undefined ? department : student.department;
    student.year = year !== undefined ? year : student.year;
    student.gender = gender || student.gender;
    student.parentName = parentName !== undefined ? parentName : student.parentName;
    student.parentContact = parentContact !== undefined ? parentContact : student.parentContact;
    student.hostelName = hostelName !== undefined ? hostelName : student.hostelName;
    student.block = block !== undefined ? block : student.block;
    student.floor = floor !== undefined ? floor : student.floor;
    student.roomNumber = roomNumber !== undefined ? roomNumber : student.roomNumber;
    student.bedNumber = bedNumber !== undefined ? bedNumber : student.bedNumber;
    student.emergencyContact = emergencyContact !== undefined ? emergencyContact : student.emergencyContact;
    if (status !== undefined) {
      student.isActive = status === 'Active';
    }

    if (roomNumber !== oldRoomNumber || block !== student.block || floor !== student.floor) {
      // Deallocate from old room
      if (oldRoomId) {
        const oldRoom = await Room.findById(oldRoomId);
        if (oldRoom) {
          oldRoom.assignedStudents = oldRoom.assignedStudents.filter(sid => sid.toString() !== student._id.toString());
          await oldRoom.save();
        }
      }

      if (roomNumber) {
        if (!block || !floor) {
          return res.status(400).json({ success: false, message: 'Block and Floor are required to assign a room' });
        }
        const blockLetter = block.replace('Block ', '').trim();
        const formattedRoomNum = roomNumber.trim().startsWith(blockLetter) ? roomNumber.trim() : `${blockLetter}${roomNumber.trim()}`;
        
        let newRoom = await Room.findOne({ roomNumber: formattedRoomNum });
        if (newRoom) {
          if (newRoom.occupiedBeds >= newRoom.capacity && student.room?.toString() !== newRoom._id.toString()) {
            return res.status(400).json({ success: false, message: `Room ${formattedRoomNum} is full` });
          }
        } else {
          const hostelName = (block.trim() === 'Block A' || block.trim() === 'Block B') ? 'Boys Hostel' : 'Girls Hostel';
          newRoom = await Room.create({
            roomNumber: formattedRoomNum,
            blockName: block.trim(),
            floorNumber: floor.trim(),
            capacity: 4,
            hostelName,
            status: 'VACANT',
            assignedStudents: []
          });
        }
        if (!newRoom.assignedStudents.includes(student._id)) {
          newRoom.assignedStudents.push(student._id);
        }
        await newRoom.save();
        student.room = newRoom._id;
      } else {
        student.room = null;
      }
    }

    await student.save();

    if (oldRoomId) {
      await syncRoomStats(oldRoomId);
    }
    if (student.room) {
      await syncRoomStats(student.room);
    }

    await updateNotification(
      student._id,
      'Info',
      'Profile Updated',
      'Your profile details or room allocation have been updated by the hostel administration.',
      student.room || null,
      { status: 'Updated' }
    );

    return res.status(200).json({ success: true, message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update Student Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update student', error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const oldRoomId = student.room;
    if (oldRoomId) {
      const room = await Room.findById(oldRoomId);
      if (room) {
        room.assignedStudents = room.assignedStudents.filter(sid => sid.toString() !== student._id.toString());
        await room.save();
      }
    }

    await User.findByIdAndDelete(id);

    if (oldRoomId) {
      await syncRoomStats(oldRoomId);
    }
    return res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete Student Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete student', error: error.message });
  }
};

const resetStudentPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { temporaryPassword } = req.body;

    if (!temporaryPassword || temporaryPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.password = temporaryPassword;
    student.mustChangePassword = true;
    student.isFirstLogin = true;
    await student.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully. The student will be forced to change it on their next login.' });
  } catch (error) {
    console.error('Reset Student Password Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reset password', error: error.message });
  }
};

// ── Warden Management ────────────────────────────────────────────────────────
const createWarden = async (req, res) => {
  try {
    const {
      fullName,
      employeeId,
      email,
      phoneNumber,
      gender,
      assignedHostel,
      assignedBlocks,
      status,
      temporaryPassword
    } = req.body;

    if (!fullName || !employeeId || !email || !phoneNumber || !gender) {
      return res.status(400).json({ success: false, message: 'Required fields are missing: Name, Employee ID, Email, Phone, Gender' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const empExists = await User.findOne({ employeeId });
    if (empExists) {
      return res.status(400).json({ success: false, message: 'Employee ID already exists' });
    }

    let tempPassword = temporaryPassword;
    if (!tempPassword || tempPassword.trim() === '') {
      tempPassword = 'Temp@' + Math.floor(100000 + Math.random() * 900000).toString();
    }

    const warden = new User({
      fullName,
      employeeId,
      email: email.toLowerCase(),
      phoneNumber,
      gender,
      assignedHostel,
      assignedBlocks: Array.isArray(assignedBlocks) ? assignedBlocks : (assignedBlocks ? [assignedBlocks] : []),
      role: 'warden',
      isActive: status !== 'Inactive',
      mustChangePassword: true,
      isFirstLogin: true,
      password: tempPassword
    });

    await warden.save();

    try {
      await sendCredentialsEmail(warden.email, tempPassword, warden.fullName, 'warden');
    } catch (mailErr) {
      console.error('Failed to send credentials email to warden:', mailErr);
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Warden created successfully', 
      warden,
      temporaryPassword: tempPassword
    });
  } catch (error) {
    console.error('Create Warden Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create warden', error: error.message });
  }
};

const listWardens = async (req, res) => {
  try {
    const { search, assignedHostel, gender, status } = req.query;
    const query = { role: 'warden' };

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (assignedHostel) {
      query.assignedHostel = assignedHostel;
    }

    if (gender) {
      query.gender = gender;
    }

    if (status) {
      query.isActive = status === 'Active';
    }

    const wardens = await User.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, wardens });
  } catch (error) {
    console.error('List Wardens Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve wardens', error: error.message });
  }
};

const getWarden = async (req, res) => {
  try {
    const { id } = req.params;
    const warden = await User.findById(id);
    if (!warden || warden.role !== 'warden') {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }
    return res.status(200).json({ success: true, warden });
  } catch (error) {
    console.error('Get Warden Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve warden details', error: error.message });
  }
};

const updateWarden = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      employeeId,
      email,
      phoneNumber,
      gender,
      assignedHostel,
      assignedBlocks,
      status
    } = req.body;

    const warden = await User.findById(id);
    if (!warden || warden.role !== 'warden') {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }

    if (email && email.toLowerCase() !== warden.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      warden.email = email.toLowerCase();
    }

    if (employeeId && employeeId !== warden.employeeId) {
      const empExists = await User.findOne({ employeeId });
      if (empExists) {
        return res.status(400).json({ success: false, message: 'Employee ID already exists' });
      }
      warden.employeeId = employeeId;
    }

    warden.fullName = fullName || warden.fullName;
    warden.phoneNumber = phoneNumber || warden.phoneNumber;
    warden.gender = gender || warden.gender;
    warden.assignedHostel = assignedHostel || warden.assignedHostel;
    if (assignedBlocks !== undefined) {
      warden.assignedBlocks = Array.isArray(assignedBlocks) ? assignedBlocks : (assignedBlocks ? [assignedBlocks] : []);
    }
    if (status !== undefined) {
      warden.isActive = status === 'Active';
    }

    await warden.save();
    return res.status(200).json({ success: true, message: 'Warden updated successfully', warden });
  } catch (error) {
    console.error('Update Warden Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update warden', error: error.message });
  }
};

const deleteWarden = async (req, res) => {
  try {
    const { id } = req.params;
    const warden = await User.findById(id);
    if (!warden || warden.role !== 'warden') {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }

    // Nullify warden reference on all linked records to preserve history
    await LeaveRequest.updateMany({ warden: id }, { $set: { warden: null } });
    await Complaint.updateMany({ warden: id }, { $set: { warden: null } });
    await VisitorRequest.updateMany({ warden: id }, { $set: { warden: null } });

    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Warden deleted successfully' });
  } catch (error) {
    console.error('Delete Warden Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete warden', error: error.message });
  }
};


const resetWardenPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { temporaryPassword } = req.body;

    if (!temporaryPassword || temporaryPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const warden = await User.findById(id);
    if (!warden || warden.role !== 'warden') {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }

    warden.password = temporaryPassword;
    warden.mustChangePassword = true;
    warden.isFirstLogin = true;
    await warden.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully. The warden will be forced to change it on their next login.' });
  } catch (error) {
    console.error('Reset Warden Password Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reset password', error: error.message });
  }
};

// Leave Requests Management
const listLeaveRequests = async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find()
      .populate({
        path: 'student',
        select: 'fullName email phoneNumber room roomNumber block hostelName',
        populate: { path: 'room', select: 'roomNumber blockName' }
      })
      .populate({ path: 'room', select: 'roomNumber blockName' })
      .populate({ path: 'warden', select: 'fullName email' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, leaveRequests });
  } catch (error) {
    console.error('Admin List Leave Requests Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve leave requests', error: error.message });
  }
};

const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const leaveRequest = await LeaveRequest.findById(id).populate('student', 'fullName');
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending leave requests can be reviewed' });
    }

    if (action === 'approve') {
      leaveRequest.status = 'Approved';
      leaveRequest.approvedBy = req.user._id;
      leaveRequest.rejectedBy = null;
      leaveRequest.history.push({ status: 'Approved', changedBy: req.user._id, comment: comment || 'Leave approved by admin' });
      await updateNotification(
        leaveRequest.student._id,
        'Leave',
        'Leave Request Approved',
        `Your leave request has been approved by administrator ${req.user.fullName}.`,
        leaveRequest._id,
        { status: 'Approved' }
      );
    } else {
      leaveRequest.status = 'Rejected';
      leaveRequest.rejectedBy = req.user._id;
      leaveRequest.approvedBy = null;
      leaveRequest.history.push({ status: 'Rejected', changedBy: req.user._id, comment: comment || 'Leave rejected by admin' });
      await updateNotification(
        leaveRequest.student._id,
        'Leave',
        'Leave Request Rejected',
        `Your leave request has been rejected by administrator ${req.user.fullName}.`,
        leaveRequest._id,
        { status: 'Rejected' }
      );
    }

    await leaveRequest.save();
    return res.status(200).json({ success: true, message: `Leave request ${action}d successfully`, leaveRequest });
  } catch (error) {
    console.error('Admin Review Leave Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to review leave request', error: error.message });
  }
};

// Complaints Management
const listComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate({
        path: 'student',
        select: 'fullName email room roomNumber block hostelName',
        populate: { path: 'room', select: 'roomNumber blockName' }
      })
      .populate({ path: 'warden', select: 'fullName email' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error('Admin List Complaints Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve complaints', error: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, assignedTeam, comment } = req.body;

    const statusMap = {
      accept: 'In Progress',
      assign: 'In Progress',
      in_progress: 'In Progress',
      resolve: 'Resolved',
      reject: 'Rejected',
    };

    if (!statusMap[action]) {
      return res.status(400).json({ success: false, message: 'Invalid complaint action' });
    }

    const complaint = await Complaint.findById(id).populate('student', 'fullName');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.status === 'Resolved' || complaint.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Cannot modify a closed complaint' });
    }

    complaint.status = statusMap[action];
    if (assignedTeam) {
      complaint.assignedTeam = assignedTeam;
    }
    complaint.history.push({ status: complaint.status, changedBy: req.user._id, comment: comment || `Complaint status updated by admin to ${statusMap[action]}` });
    await complaint.save();

    await updateNotification(
      complaint.student._id,
      'Complaint',
      `Complaint Updated: ${complaint.status}`,
      `Your complaint status has been updated to ${complaint.status} by administrator ${req.user.fullName}.`,
      complaint._id,
      { status: complaint.status }
    );

    return res.status(200).json({ success: true, message: 'Complaint status updated successfully', complaint });
  } catch (error) {
    console.error('Admin Update Complaint Status Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update complaint status', error: error.message });
  }
};

// Visitor Requests Management
const listVisitorRequests = async (req, res) => {
  try {
    const visitorRequests = await VisitorRequest.find()
      .populate({
        path: 'student',
        select: 'fullName email room roomNumber block hostelName',
        populate: { path: 'room', select: 'roomNumber blockName' }
      })
      .populate({ path: 'warden', select: 'fullName email' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, visitorRequests });
  } catch (error) {
    console.error('Admin List Visitor Requests Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve visitor requests', error: error.message });
  }
};

const reviewVisitorRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const visitorRequest = await VisitorRequest.findById(id).populate('student', 'fullName');
    if (!visitorRequest) {
      return res.status(404).json({ success: false, message: 'Visitor request not found' });
    }

    if (visitorRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending visitor requests can be reviewed' });
    }

    if (action === 'approve') {
      visitorRequest.status = 'Approved';
      visitorRequest.reviewedBy = req.user._id;
      visitorRequest.history.push({ status: 'Approved', changedBy: req.user._id, comment: comment || 'Visitor request approved by admin' });
      await updateNotification(
        visitorRequest.student._id,
        'Visitor',
        'Visitor Request Approved',
        `Your visitor request has been approved by administrator ${req.user.fullName}.`,
        visitorRequest._id,
        { status: 'Approved' }
      );
    } else {
      visitorRequest.status = 'Rejected';
      visitorRequest.reviewedBy = req.user._id;
      visitorRequest.history.push({ status: 'Rejected', changedBy: req.user._id, comment: comment || 'Visitor request rejected by admin' });
      await updateNotification(
        visitorRequest.student._id,
        'Visitor',
        'Visitor Request Rejected',
        `Your visitor request has been rejected by administrator ${req.user.fullName}.`,
        visitorRequest._id,
        { status: 'Rejected' }
      );
    }

    await visitorRequest.save();
    return res.status(200).json({ success: true, message: `Visitor request ${action}d successfully`, visitorRequest });
  } catch (error) {
    console.error('Admin Review Visitor Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to review visitor request', error: error.message });
  }
};

module.exports = {
  createAnnouncement,
  listAnnouncements,
  createRoom,
  listRooms,
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  resetStudentPassword,
  createWarden,
  listWardens,
  getWarden,
  updateWarden,
  deleteWarden,
  resetWardenPassword,
  listLeaveRequests,
  reviewLeaveRequest,
  listComplaints,
  updateComplaintStatus,
  listVisitorRequests,
  reviewVisitorRequest,
};
