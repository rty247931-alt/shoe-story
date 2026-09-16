const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبين' });
  const result = await pool.query('SELECT * FROM admin WHERE email=$1', [email]);
  if (result.rows.length === 0) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  const admin = result.rows[0];
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET || 'dev_secret_change_me', { expiresIn: '7d' });
  res.json({ token, email: admin.email });
});

router.put('/account', requireAuth, async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
  if (password && password.length < 4) return res.status(400).json({ error: 'كلمة المرور لازم تكون 4 أحرف على الأقل' });
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE admin SET email=$1, password_hash=$2 WHERE id=$3', [email, hash, req.admin.id]);
  } else {
    await pool.query('UPDATE admin SET email=$1 WHERE id=$2', [email, req.admin.id]);
  }
  res.json({ ok: true });
});

module.exports = router;
