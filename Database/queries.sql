SELECT * FROM Student;
SELECT * FROM Room;
SELECT s.student_id,
       s.name,
       r.room_number
FROM Student s
JOIN Room r
ON s.room_id = r.room_id;

SELECT *
FROM Room
WHERE occupied_count < capacity;
SELECT s.name,
       l.from_date,
       l.to_date,
       l.status
FROM Leave_Request l
JOIN Student s
ON l.student_id = s.student_id;
SELECT s.name,
       v.visitor_name,
       v.visit_date
FROM Student s
JOIN Visitor v
ON s.student_id = v.student_id;
SELECT * FROM Room
WHERE room_id = 1;
UPDATE Student
SET student_id = 4
WHERE student_id = 104;
