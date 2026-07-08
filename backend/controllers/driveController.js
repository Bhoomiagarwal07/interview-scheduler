const pool = require('../config/db');
const generateSlots = require('../utils/generateSlots');

// ---------- Page renders ----------

const showDashboard = async (req, res) => {
  const [drives] = await pool.query(
    `SELECT d.*, 
      (SELECT COUNT(*) FROM candidates c WHERE c.drive_id = d.id) AS candidate_count,
      (SELECT COUNT(*) FROM interviewers i WHERE i.drive_id = d.id) AS interviewer_count,
      (SELECT COUNT(*) FROM bookings b WHERE b.drive_id = d.id AND b.status = 'scheduled') AS booking_count
     FROM drives d WHERE d.created_by = ? ORDER BY d.drive_date DESC`,
    [req.session.adminId]
  );
  res.render('admin/dashboard', { drives, adminName: req.session.adminName });
};

const showNewDriveForm = (req, res) => {
  res.render('admin/new-drive', { error: null });
};

const createDrive = async (req, res) => {
  try {
    const { company_name, drive_date } = req.body;
    if (!company_name || !drive_date) {
      return res.render('admin/new-drive', { error: 'Company name and date are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO drives (company_name, drive_date, created_by) VALUES (?, ?, ?)',
      [company_name, drive_date, req.session.adminId]
    );

    res.redirect(`/admin/drives/${result.insertId}`);
  } catch (error) {
    res.render('admin/new-drive', { error: 'Something went wrong. Please try again.' });
  }
};

const showDriveDetail = async (req, res) => {
  const driveId = req.params.id;

  const [driveRows] = await pool.query('SELECT * FROM drives WHERE id = ? AND created_by = ?', [
    driveId,
    req.session.adminId,
  ]);
  if (driveRows.length === 0) return res.status(404).send('Drive not found');

  const [rooms] = await pool.query('SELECT * FROM rooms WHERE drive_id = ?', [driveId]);
  const [slots] = await pool.query(
    'SELECT * FROM time_slots WHERE drive_id = ? ORDER BY start_time',
    [driveId]
  );
  const [interviewers] = await pool.query('SELECT * FROM interviewers WHERE drive_id = ?', [
    driveId,
  ]);
  const [candidates] = await pool.query('SELECT * FROM candidates WHERE drive_id = ?', [driveId]);

  const [bookings] = await pool.query(
    `SELECT b.*, ts.start_time, ts.end_time, r.room_name, i.name AS interviewer_name, c.name AS candidate_name
     FROM bookings b
     JOIN time_slots ts ON b.slot_id = ts.id
     JOIN rooms r ON b.room_id = r.id
     JOIN interviewers i ON b.interviewer_id = i.id
     JOIN candidates c ON b.candidate_id = c.id
     WHERE b.drive_id = ? AND b.status = 'scheduled'
     ORDER BY ts.start_time`,
    [driveId]
  );

  res.render('admin/drive-detail', {
    drive: driveRows[0],
    rooms,
    slots,
    interviewers,
    candidates,
    bookings,
    error: null,
  });
};

// ---------- Form actions ----------

const addRooms = async (req, res) => {
  const driveId = req.params.id;
  const { room_names } = req.body; // comma or newline separated
  const names = room_names
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);

  for (const name of names) {
    await pool.query('INSERT INTO rooms (drive_id, room_name) VALUES (?, ?)', [driveId, name]);
  }
  res.redirect(`/admin/drives/${driveId}`);
};

const addInterviewers = async (req, res) => {
  const driveId = req.params.id;
  const { bulk_text } = req.body; // "Name, email" per line
  const lines = bulk_text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const [name, email] = line.split(',').map((s) => s.trim());
    if (name && email) {
      await pool.query('INSERT INTO interviewers (drive_id, name, email) VALUES (?, ?, ?)', [
        driveId,
        name,
        email,
      ]);
    }
  }
  res.redirect(`/admin/drives/${driveId}`);
};

const addCandidates = async (req, res) => {
  const driveId = req.params.id;
  const { bulk_text } = req.body; // "Name, roll_number" per line
  const lines = bulk_text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const [name, roll] = line.split(',').map((s) => s.trim());
    if (name && roll) {
      await pool.query('INSERT INTO candidates (drive_id, name, roll_number) VALUES (?, ?, ?)', [
        driveId,
        name,
        roll,
      ]);
    }
  }
  res.redirect(`/admin/drives/${driveId}`);
};

const createSlots = async (req, res) => {
  const driveId = req.params.id;
  const { start_time, end_time, duration_minutes } = req.body;

  const [driveRows] = await pool.query('SELECT drive_date FROM drives WHERE id = ?', [driveId]);
  if (driveRows.length === 0) return res.status(404).send('Drive not found');

  const driveDate = driveRows[0].drive_date.toISOString().split('T')[0];
  const slots = generateSlots(driveDate, start_time, end_time, Number(duration_minutes));

  for (const slot of slots) {
    await pool.query('INSERT INTO time_slots (drive_id, start_time, end_time) VALUES (?, ?, ?)', [
      driveId,
      slot.start_time,
      slot.end_time,
    ]);
  }

  res.redirect(`/admin/drives/${driveId}`);
};

module.exports = {
  showDashboard,
  showNewDriveForm,
  createDrive,
  showDriveDetail,
  addRooms,
  addInterviewers,
  addCandidates,
  createSlots,
};
