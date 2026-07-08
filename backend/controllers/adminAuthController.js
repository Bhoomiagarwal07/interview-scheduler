const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const showLogin = (req, res) => {
  res.render('admin/login', { error: null });
};

const showRegister = (req, res) => {
  res.render('admin/register', { error: null });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.render('admin/register', { error: 'All fields are required' });
    }

    const [existing] = await pool.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.render('admin/register', { error: 'An admin with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    req.session.adminId = result.insertId;
    req.session.adminName = name;
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('admin/register', { error: 'Something went wrong. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    req.session.adminId = admin.id;
    req.session.adminName = admin.name;
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.render('admin/login', { error: 'Something went wrong. Please try again.' });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

module.exports = { showLogin, showRegister, register, login, logout };
