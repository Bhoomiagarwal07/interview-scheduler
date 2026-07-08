const pool = require('../config/db');
const { checkConflict } = require('../utils/conflictDetection');

// @route POST /api/drives/:driveId/bookings
// body: { slot_id, room_id, interviewer_id, candidate_id }
const createBooking = async (req, res) => {
  const driveId = req.params.driveId;
  const { slot_id, room_id, interviewer_id, candidate_id } = req.body;

  if (!slot_id || !room_id || !interviewer_id || !candidate_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock relevant rows for the duration of this check to avoid a race
    // condition where two admins book the same interviewer at once.
    const [[newSlot]] = await connection.query(
      'SELECT start_time, end_time FROM time_slots WHERE id = ? FOR UPDATE',
      [slot_id]
    );
    if (!newSlot) {
      await connection.rollback();
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Fetch this interviewer's existing scheduled bookings (with slot times)
    const [interviewerBookings] = await connection.query(
      `SELECT ts.start_time, ts.end_time, b.room_id
       FROM bookings b JOIN time_slots ts ON b.slot_id = ts.id
       WHERE b.interviewer_id = ? AND b.drive_id = ? AND b.status = 'scheduled'`,
      [interviewer_id, driveId]
    );

    const interviewerConflict = checkConflict(interviewerBookings, newSlot, room_id);
    if (interviewerConflict.conflict) {
      await connection.rollback();
      return res.status(409).json({ message: `Interviewer conflict: ${interviewerConflict.reason}` });
    }

    // Fetch this candidate's existing scheduled bookings
    const [candidateBookings] = await connection.query(
      `SELECT ts.start_time, ts.end_time, b.room_id
       FROM bookings b JOIN time_slots ts ON b.slot_id = ts.id
       WHERE b.candidate_id = ? AND b.drive_id = ? AND b.status = 'scheduled'`,
      [candidate_id, driveId]
    );

    const candidateConflict = checkConflict(candidateBookings, newSlot, room_id);
    if (candidateConflict.conflict) {
      await connection.rollback();
      return res.status(409).json({ message: `Candidate conflict: ${candidateConflict.reason}` });
    }

    // Fetch room bookings (catches overlapping-duration room conflicts;
    // the UNIQUE(room_id, slot_id) constraint below is the exact-slot safety net)
    const [roomBookings] = await connection.query(
      `SELECT ts.start_time, ts.end_time, b.room_id
       FROM bookings b JOIN time_slots ts ON b.slot_id = ts.id
       WHERE b.room_id = ? AND b.drive_id = ? AND b.status = 'scheduled'`,
      [room_id, driveId]
    );
    const roomConflict = checkConflict(roomBookings, newSlot, room_id);
    if (roomConflict.conflict) {
      await connection.rollback();
      return res.status(409).json({ message: `Room conflict: ${roomConflict.reason}` });
    }

    const [result] = await connection.query(
      `INSERT INTO bookings (drive_id, slot_id, room_id, interviewer_id, candidate_id)
       VALUES (?, ?, ?, ?, ?)`,
      [driveId, slot_id, room_id, interviewer_id, candidate_id]
    );

    await connection.commit();
    res.status(201).json({ id: result.insertId, message: 'Booking created successfully' });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This room is already booked for this exact slot' });
    }
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// @route DELETE /api/bookings/:id
const cancelBooking = async (req, res) => {
  try {
    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, cancelBooking };
