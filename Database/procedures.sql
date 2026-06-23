DELIMITER //
CREATE PROCEDURE GetStudentDetails(IN sid INT)
BEGIN
    SELECT s.name,
           r.room_number
    FROM Student s
    JOIN Room r
    ON s.room_id = r.room_id
    WHERE s.student_id = sid;
END //

DELIMITER ;
