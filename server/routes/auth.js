const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { readDB, writeDB } = require('../db');
const { auth, SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'من فضلك أدخل الاسم والبريد وكلمة السر' });
  }
  const db = readDB();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
  }
  const user = {
    id: uuid(),
    name,
    email,
    password: bcrypt.hashSync(password, 8),
    role: 'customer',
    phone: phone || '',
    address: '',
    banned: false,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDB(db);
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة السر غير صحيحة' });
  }
  if (user.banned) {
    return res.status(403).json({ error: 'هذا الحساب محظور، تواصل مع الدعم' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', auth(true), (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, address: user.address });
});

router.put('/me', auth(true), (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  const { name, phone, address, password } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (password) user.password = bcrypt.hashSync(password, 8);
  writeDB(db);
  res.json({ message: 'تم تحديث البيانات بنجاح' });
});

module.exports = router;
