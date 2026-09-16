const express = require('express');
const { readDB, writeDB } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const customers = db.users.filter(u => u.role === 'customer').map(u => {
    const orders = db.orders.filter(o => o.userId === u.id);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone, address: u.address,
      banned: u.banned, createdAt: u.createdAt,
      ordersCount: orders.length,
      totalSpent: orders.reduce((s, o) => s + o.total, 0)
    };
  });
  res.json(customers);
});

router.put('/:id/ban', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id && u.role === 'customer');
  if (!user) return res.status(404).json({ error: 'العميل غير موجود' });
  user.banned = !!req.body.banned;
  writeDB(db);
  res.json({ message: user.banned ? 'تم حظر العميل' : 'تم إلغاء الحظر' });
});

module.exports = router;
