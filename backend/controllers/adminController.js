const Announcement = require('../models/Announcement');
const Room = require('../models/Room');
const User = require('../models/User');

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

    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ success: false, message: 'Room with that number already exists' });
    }

    const room = await Room.create({
      roomNumber,
      blockName,
      floorNumber,
      capacity,
      status: status || 'Open',
      occupiedBeds: 0,
    });

    return res.status(201).json({ success: true, message: 'Room created successfully', room });
  } catch (error) {
    console.error('Create Room Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create room', error: error.message });
  }
};

const listRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ blockName: 1, floorNumber: 1, roomNumber: 1 });
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

    if (!fullName || !registerNumber || !email || !phoneNumber || !gender) {
      return res.status(400).json({ success: false, message: 'Required fields are missing: Name, Reg Number, Email, Phone, Gender' });
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
      let targetRoom = await Room.findOne({ roomNumber: roomNumber.trim() });
      if (targetRoom) {
        if (targetRoom.occupiedBeds >= targetRoom.capacity) {
          return res.status(400).json({ success: false, message: `Room ${roomNumber} is already full` });
        }
      } else {
        targetRoom = await Room.create({
          roomNumber: roomNumber.trim(),
          blockName: block.trim(),
          floorNumber: floor.trim(),
          capacity: 4,
          status: 'Open'
        });
      }
      studentRoomId = targetRoom._id;
    }

    const student = new User({
      fullName,
      registerNumber,
      rollNumber,
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
      password: tempPassword,
      room: studentRoomId
    });

    await student.save();

    if (studentRoomId) {
      const room = await Room.findById(studentRoomId);
      if (room) {
        if (!room.assignedStudents.includes(student._id)) {
          room.assignedStudents.push(student._id);
          room.occupiedBeds = room.assignedStudents.length;
          if (room.occupiedBeds >= room.capacity) {
            room.status = 'Full';
          }
          await room.save();
        }
      }
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

    if (roomNumber !== oldRoomNumber) {
      // Deallocate from old room
      if (oldRoomId) {
        const oldRoom = await Room.findById(oldRoomId);
        if (oldRoom) {
          oldRoom.assignedStudents = oldRoom.assignedStudents.filter(sid => sid.toString() !== student._id.toString());
          oldRoom.occupiedBeds = oldRoom.assignedStudents.length;
          if (oldRoom.occupiedBeds < oldRoom.capacity && oldRoom.status === 'Full') {
            oldRoom.status = 'Open';
          }
          await oldRoom.save();
        }
      }

      if (roomNumber) {
        if (!block || !floor) {
          return res.status(400).json({ success: false, message: 'Block and Floor are required to assign a room' });
        }
        let newRoom = await Room.findOne({ roomNumber: roomNumber.trim() });
        if (newRoom) {
          if (newRoom.occupiedBeds >= newRoom.capacity) {
            return res.status(400).json({ success: false, message: `Room ${roomNumber} is full` });
          }
        } else {
          newRoom = await Room.create({
            roomNumber: roomNumber.trim(),
            blockName: block.trim(),
            floorNumber: floor.trim(),
            capacity: 4,
            status: 'Open'
          });
        }
        if (!newRoom.assignedStudents.includes(student._id)) {
          newRoom.assignedStudents.push(student._id);
        }
        newRoom.occupiedBeds = newRoom.assignedStudents.length;
        if (newRoom.occupiedBeds >= newRoom.capacity) {
          newRoom.status = 'Full';
        }
        await newRoom.save();
        student.room = newRoom._id;
      } else {
        student.room = null;
      }
    }

    await student.save();
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

    // Deallocate from room
    if (student.room) {
      const room = await Room.findById(student.room);
      if (room) {
        room.assignedStudents = room.assignedStudents.filter(sid => sid.toString() !== student._id.toString());
        room.occupiedBeds = room.assignedStudents.length;
        if (room.occupiedBeds < room.capacity && room.status === 'Full') {
          room.status = 'Open';
        }
        await room.save();
      }
    }

    await User.findByIdAndDelete(id);
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
      password: tempPassword
    });

    await warden.save();
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
    await warden.save();

    return res.status(200).json({ success: true, message: 'Password reset successfully. The warden will be forced to change it on their next login.' });
  } catch (error) {
    console.error('Reset Warden Password Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to reset password', error: error.message });
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
};
