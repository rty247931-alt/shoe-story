const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireCustomerAuth } = require('../middleware/auth');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function sign(customer) {
  return jwt.sign({ id: customer.id, email: customer.email, name: customer.name, role: 'customer' }, SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res) => {
  const { name, email, phone, address, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبين' });
  if (password.length < 4) return res.status(400).json({ error: 'كلمة المرور لازم تكون 4 أحرف على الأقل' });
  const exists = await pool.query('SELECT id FROM customers WHERE email=$1', [email]);
  if (exists.rows.length > 0) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO customers (name, email, phone, address, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, phone, address',
    [name, email, phone || '', address || '', hash]
  );
  const customer = result.rows[0];
  res.json({ token: sign(customer), customer });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبين' });
  const result = await pool.query('SELECT * FROM customers WHERE email=$1', [email]);
  if (result.rows.length === 0) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  const customer = result.rows[0];
  const ok = await bcrypt.compare(password, customer.password_hash);
  if (!ok) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  res.json({
    token: sign(customer),
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, address: customer.address }
  });
});

router.get('/me', requireCustomerAuth, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, phone, address FROM customers WHERE id=$1', [req.customer.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'الحساب غير موجود' });
  res.json(result.rows[0]);
});

router.put('/me', requireCustomerAuth, async (req, res) => {
  const { name, phone, address, password } = req.body;
  const nn = v => (v === undefined ? null : v);
  if (password) {
    if (password.length < 4) return res.status(400).json({ error: 'كلمة المرور لازم تكون 4 أحرف على الأقل' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE customers SET name=COALESCE($1,name), phone=COALESCE($2,phone), address=COALESCE($3,address), password_hash=$4 WHERE id=$5',
      [nn(name), nn(phone), nn(address), hash, req.customer.id]);
  } else {
    await pool.query('UPDATE customers SET name=COALESCE($1,name), phone=COALESCE($2,phone), address=COALESCE($3,address) WHERE id=$4',
      [nn(name), nn(phone), nn(address), req.customer.id]);
  }
  const result = await pool.query('SELECT id, name, email, phone, address FROM customers WHERE id=$1', [req.customer.id]);
  res.json(result.rows[0]);
});

router.get('/me/orders', requireCustomerAuth, async (req, res) => {
  const orders = await pool.query('SELECT * FROM orders WHERE customer_id=$1 ORDER BY created_at DESC', [req.customer.id]);
  for (const o of orders.rows) {
    const items = await pool.query('SELECT product_name, qty, price FROM order_items WHERE order_id=$1', [o.id]);
    o.items = items.rows;
  }
  res.json(orders.rows);
});

module.exports = router;
