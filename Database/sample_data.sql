INSERT INTO admin(name,email,password)
VALUES
('Priya','priya@gmail.com','admin123'),
('Kumar','kumar@gmail.com','admin456');
INSERT INTO Warden(name,email,phone)
VALUES
('Arun','arun@gmail.com','9876543210'),
('Meena','meena@gmail.com','9876543211');
INSERT INTO Room(room_number,block_name,floor,capacity,occupied_count,status,admin_id)
VALUES
('A101','A',1,4,2,'Available',1),
('A102','A',1,4,1,'Available',1),
('B101','B',2,4,3,'Available',2);
INSERT INTO Student(name,email,phone,department,year,gender,room_id,admin_id)
VALUES
('Rahul','rahul@gmail.com','9876543001','CSE',2,'Male',1,1),
('Anu','anu@gmail.com','9876543002','IT',2,'Female',2,1),
('Vijay','vijay@gmail.com','9876543003','ECE',3,'Male',3,2);
INSERT INTO Visitor(visitor_name,phone,relation,visit_date,check_in_time,check_out_time,student_id)
VALUES
('Ramesh','9876500001','Father','2026-06-20','10:00:00','11:00:00',1);
INSERT INTO Leave_Request(from_date,to_date,reason,status,student_id,warden_id)
VALUES
('2026-06-25','2026-06-27','Family Function','Pending',1,1);
INSERT INTO Occupancy_Report(room_id,occupied_beds,vacant_beds,generated_date)
VALUES
(1,2,2,CURDATE()),
(2,1,3,CURDATE()),
(3,3,1,CURDATE());
INSERT INTO Student
VALUES
(104,'Arun','arun@gmail.com',
'9876543204','CSE',2,'Male',1,1);
SELECT * FROM Student;SELECT s.student_id,
       s.name,
       r.room_number
FROM Student s
JOIN Room r
ON s.room_id = r.room_id;SELECT *
FROM Room
WHERE occupied_count < capacity;SELECT s.name,
       l.from_date,
       l.to_date,
       l.status
FROM Leave_Request l
JOIN Student s
ON l.student_id = s.student_id;SELECT * FROM Student;