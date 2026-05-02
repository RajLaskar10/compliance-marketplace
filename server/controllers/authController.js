const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { record } = require('../middleware/auditLogger');

const BCRYPT_ROUNDS = process.env.NODE_ENV === 'production' ? 12 : 10;
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, kyc_status: user.kyc_status },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res) {
  const { email, password, role = 'buyer' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!['buyer', 'seller'].includes(role)) return res.status(400).json({ error: 'Role must be buyer or seller' });

  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, kyc_status, created_at`,
      [email.toLowerCase().trim(), hash, role]
    );
    const user = rows[0];
    res.cookie('token', makeToken(user), COOKIE_OPTS);
    record({ userId: user.id, action: 'USER_REGISTERED', ip: req.ip });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { rows } = await pool.query(
      `SELECT id, email, password_hash, role, kyc_status FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password_hash, ...safeUser } = user;
    res.cookie('token', makeToken(safeUser), COOKIE_OPTS);
    record({ userId: user.id, action: 'USER_LOGIN', ip: req.ip });
    res.json({ user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

async function logout(req, res) {
  record({ userId: req.user?.id, action: 'USER_LOGOUT', ip: req.ip });
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

module.exports = { register, login, me, logout };
