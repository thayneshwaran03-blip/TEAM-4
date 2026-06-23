DELIMITER //
CREATE TRIGGER update_occupancy
AFTER INSERT ON Student
FOR EACH ROW
BEGIN
    UPDATE Room
    SET occupied_count = occupied_count + 1
    WHERE room_id = NEW.room_id;
END //
DELIMITER ;