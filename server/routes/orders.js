const express = require('express');
const { v4: uuid } = require('uuid');
const { readDB, writeDB } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const STATUSES = ['جديد', 'قيد التنفيذ', 'تم الشحن', 'مكتمل', 'ملغي'];

// Create order (customer, or guest with contact info)
router.post('/', auth(false), (req, res) => {
  const { items, paymentMethod, address, phone, name } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'السلة فارغة' });
  if (!phone || !address) return res.status(400).json({ error: 'العنوان ورقم الهاتف مطلوبان' });

  const db = readDB();
  const paymentConf = db.settings.payment;
  const methodMap = { vodafone: paymentConf.vodafoneCash, instapay: paymentConf.instapay, card: paymentConf.card, cod: paymentConf.cod };
  const chosen = methodMap[paymentMethod];
  if (!chosen || !chosen.enabled) {
    return res.status(400).json({ error: 'وسيلة الدفع المختارة غير متاحة حالياً' });
  }

  let total = 0;
  const orderItems = items.map(it => {
    const product = db.products.find(p => p.id === it.productId);
    if (!product) throw new Error('منتج غير موجود');
    const unitPrice = product.discountPrice || product.price;
    total += unitPrice * it.qty;
    return {
      productId: product.id,
      name: product.name,
      image: (product.images || [])[0] || '',
      price: unitPrice,
      size: it.size || '',
      color: it.color || '',
      qty: it.qty
    };
  });

  const deliveryFee = paymentMethod === 'cod' ? (paymentConf.cod.fee || 0) : 0;
  const shippingFee = db.settings.shippingFee || 0;
  total += shippingFee + deliveryFee;

  db.counters.invoice += 1;
  const order = {
    id: uuid(),
    invoiceNumber: db.counters.invoice,
    userId: req.user ? req.user.id : null,
    guestName: name || (req.user ? req.user.name : ''),
    items: orderItems,
    paymentMethod,
    status: 'جديد',
    address,
    phone,
    shippingFee,
    deliveryFee,
    total,
    createdAt: new Date().toISOString(),
    history: [{ status: 'جديد', at: new Date().toISOString() }]
  };
  db.orders.push(order);
  writeDB(db);
  res.json(order);
});

// Get my orders
router.get('/mine', auth(true), (req, res) => {
  const db = readDB();
  const orders = db.orders.filter(o => o.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});
// Track order — private: يحتاج تطابق رقم الهاتف، أو يكون صاحب الطلب/أدمن
router.get('/track/:id', auth(false), (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id || String(o.invoiceNumber) === req.params.id);
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });

  const isOwner = req.user && order.userId === req.user.id;
  const isAdmin = req.user && req.user.role === 'admin';
  const phone = (req.query.phone || '').trim();
  const phoneMatches = phone && order.phone && phone === order.phone.trim();

  if (!isOwner && !isAdmin && !phoneMatches) {
    return res.status(403).json({ error: 'أدخل رقم الهاتف المستخدم في الطلب للتأكد من هويتك' });
  }
  res.json(order);
});

// Admin: list all orders
router.get('/', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const { status } = req.query;
  let orders = db.orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (status) orders = orders.filter(o => o.status === status);
  res.json(orders);
});

// Admin: update order status
router.put('/:id/status', auth(true), adminOnly, (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'حالة غير صحيحة' });
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
  order.status = status;
  order.history.push({ status, at: new Date().toISOString() });
  writeDB(db);
  res.json(order);
});

router.get('/statuses/list', (req, res) => res.json(STATUSES));

module.exports = router;
