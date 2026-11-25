import { Router } from 'express';
import { pool } from '../config/db.js';
import { createSession, destroySession, ensureAuthSchema, hashPassword, requireAuth, verifyPassword } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2) return res.status(400).json({ message: 'Enter your full name' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });
  try {
    await ensureAuthSchema();
    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query('INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING user_id,name,email', [name,email,passwordHash]);
    await pool.query("INSERT INTO accounts (user_id,account_name,account_type,current_balance) VALUES ($1,'Cash','Cash',0)", [rows[0].user_id]);
    await createSession(rows[0].user_id, res);
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account already exists for this email' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  try {
    const { rows } = await pool.query('SELECT user_id,name,email,password_hash FROM users WHERE LOWER(email)=$1', [email]);
    if (!rows.length || !(await verifyPassword(password, rows[0].password_hash))) return res.status(401).json({ message: 'Email or password is incorrect' });
    if (!rows[0].password_hash.startsWith('scrypt$')) await pool.query('UPDATE users SET password_hash=$1 WHERE user_id=$2', [await hashPassword(password),rows[0].user_id]);
    await createSession(rows[0].user_id, res);
    res.json({ user: { user_id: rows[0].user_id, name: rows[0].name, email: rows[0].email } });
  } catch (error) { next(error); }
});

router.post('/logout', requireAuth, async (req, res, next) => { try { await destroySession(req,res); res.json({ message: 'Signed out' }); } catch(error) { next(error); } });
router.get('/me', requireAuth, (req,res) => res.json({ user:req.user }));

export default router;
