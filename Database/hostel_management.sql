CREATE DATABASE IF NOT EXISTS hostel_management;
USE hostel_management;

CREATE TABLE Admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE Warden (
    warden_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50),
    phone VARCHAR(15)
);
CREATE TABLE Room (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    block_name VARCHAR(20),
    floor INT,
    capacity INT NOT NULL,
    occupied_count INT DEFAULT 0,
    status VARCHAR(20),
    admin_id INT,
    FOREIGN KEY (admin_id)
    REFERENCES Admin(admin_id)
);
CREATE TABLE Student (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE,
    phone VARCHAR(15),
    department VARCHAR(50),
    year INT,
    gender VARCHAR(10),
    room_id INT,
    admin_id INT,
    FOREIGN KEY (room_id)
    REFERENCES Room(room_id),
    FOREIGN KEY (admin_id)
    REFERENCES Admin(admin_id)
);
CREATE TABLE Visitor (
    visitor_id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_name VARCHAR(50),
    phone VARCHAR(15),
    relation VARCHAR(30),
    visit_date DATE,
    check_in_time TIME,
    check_out_time TIME,
    student_id INT,
    FOREIGN KEY (student_id)
    REFERENCES Student(student_id)
);
CREATE TABLE Leave_Request (
    leave_id INT PRIMARY KEY AUTO_INCREMENT,
    from_date DATE,
    to_date DATE,
    reason VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Pending',
    student_id INT,
    warden_id INT,
    FOREIGN KEY (student_id)
    REFERENCES Student(student_id),
    FOREIGN KEY (warden_id)
    REFERENCES Warden(warden_id)
);
CREATE TABLE Occupancy_Report (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT,
    occupied_beds INT,
    vacant_beds INT,
    generated_date DATE,
    FOREIGN KEY (room_id)
    REFERENCES Room(room_id)
);
CREATE TABLE Announcement (
    announcement_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_date DATE NOT NULL,
    admin_id INT,
    FOREIGN KEY (admin_id)
    REFERENCES Admin(admin_id)
);