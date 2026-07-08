-- Interview Panel Scheduler - Database Schema
-- Run this once against your MySQL database to set up all tables.

CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(150) NOT NULL,
  drive_date DATE NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  drive_id INT NOT NULL,
  room_name VARCHAR(50) NOT NULL,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_per_drive (drive_id, room_name)
);

CREATE TABLE IF NOT EXISTS time_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  drive_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interviewers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  drive_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  drive_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  drive_id INT NOT NULL,
  slot_id INT NOT NULL,
  room_id INT NOT NULL,
  interviewer_id INT NOT NULL,
  candidate_id INT NOT NULL,
  status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drive_id) REFERENCES drives(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  -- Database-level guarantee: the same room can never be double-booked
  -- for the same slot, even if the application logic has a bug.
  UNIQUE KEY unique_room_slot (room_id, slot_id)
);

-- Helpful indexes for the overlap-conflict queries run on every booking attempt
CREATE INDEX idx_bookings_interviewer ON bookings(interviewer_id);
CREATE INDEX idx_bookings_candidate ON bookings(candidate_id);
CREATE INDEX idx_slots_drive ON time_slots(drive_id);
