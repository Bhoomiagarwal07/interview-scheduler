const pool = require('../config/db');

// @route GET /api/public/drives
// lists drives so the React app can offer a dropdown
const listDrives = async (req, res) => {
  const [drives] = await pool.query(
    'SELECT id, company_name, drive_date FROM drives ORDER BY drive_date DESC'
  );
  res.json(drives);
};

// @route GET /api/public/schedule?driveId=1&role=candidate&identifier=21CS101
// role is 'candidate' (identifier = roll_number) or 'interviewer' (identifier = email)
const getSchedule = async (req, res) => {
  try {
    const { driveId, role, identifier } = req.query;
    if (!driveId || !role || !identifier) {
      return res.status(400).json({ message: 'driveId, role and identifier are required' });
    }

    let personRows;
    if (role === 'candidate') {
      [personRows] = await pool.query(
        'SELECT id, name FROM candidates WHERE drive_id = ? AND roll_number = ?',
        [driveId, identifier]
      );
    } else if (role === 'interviewer') {
      [personRows] = await pool.query(
        'SELECT id, name FROM interviewers WHERE drive_id = ? AND email = ?',
        [driveId, identifier]
      );
    } else {
      return res.status(400).json({ message: "role must be 'candidate' or 'interviewer'" });
    }

    if (personRows.length === 0) {
      return res.status(404).json({ message: 'No matching record found for this drive' });
    }

    const person = personRows[0];
    const column = role === 'candidate' ? 'candidate_id' : 'interviewer_id';

    const [bookings] = await pool.query(
      `SELECT b.id, ts.start_time, ts.end_time, r.room_name,
              c.name AS candidate_name, i.name AS interviewer_name
       FROM bookings b
       JOIN time_slots ts ON b.slot_id = ts.id
       JOIN rooms r ON b.room_id = r.id
       JOIN candidates c ON b.candidate_id = c.id
       JOIN interviewers i ON b.interviewer_id = i.id
       WHERE b.${column} = ? AND b.drive_id = ? AND b.status = 'scheduled'
       ORDER BY ts.start_time`,
      [person.id, driveId]
    );

    res.json({ name: person.name, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { listDrives, getSchedule };
