const express = require('express');
const { readDB, writeDB } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const db = readDB();
  // Public view: hide sensitive API keys from non-admins
  const s = JSON.parse(JSON.stringify(db.settings));
  if (!req.user || req.user.role !== 'admin') {
    if (s.payment.card) s.payment.card.apiKey = undefined;
  }
  res.json(s);
});

router.put('/', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body, payment: { ...db.settings.payment, ...(req.body.payment || {}) } };
  writeDB(db);
  res.json(db.settings);
});

router.get('/dashboard', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const completed = db.orders.filter(o => o.status !== 'ملغي');
  const sum = arr => arr.reduce((s, o) => s + o.total, 0);

  const salesToday = sum(completed.filter(o => new Date(o.createdAt) >= startOfDay));
  const salesMonth = sum(completed.filter(o => new Date(o.createdAt) >= startOfMonth));
  const salesYear = sum(completed.filter(o => new Date(o.createdAt) >= startOfYear));

  const newOrders = db.orders.filter(o => o.status === 'جديد').length;

  const productSales = {};
  db.orders.forEach(o => {
    if (o.status === 'ملغي') return;
    o.items.forEach(it => {
      productSales[it.productId] = productSales[it.productId] || { name: it.name, qty: 0 };
      productSales[it.productId].qty += it.qty;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // last 7 days sales for chart
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const daySales = sum(completed.filter(o => {
      const d = new Date(o.createdAt);
      return d >= day && d < nextDay;
    }));
    last7.push({ date: day.toISOString().slice(0, 10), total: daySales });
  }

  res.json({
    salesToday, salesMonth, salesYear, newOrders,
    totalOrders: db.orders.length,
    totalProducts: db.products.length,
    totalCustomers: db.users.filter(u => u.role === 'customer').length,
    topProducts, last7
  });
});

module.exports = router;
