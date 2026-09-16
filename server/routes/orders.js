const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function attachItems(orders) {
  for (const o of orders) {
    const items = await pool.query('SELECT product_name, qty, price FROM order_items WHERE order_id=$1', [o.id]);
    o.items = items.rows;
  }
  return orders;
}

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  const orders = await attachItems(result.rows);
  res.json(orders);
});

router.post('/', async (req, res) => {
  const { name, phone, address, pay, items } = req.body;
  if (!name || !phone || !address || !items || items.length === 0) {
    return res.status(400).json({ error: 'من فضلك أكمل كل البيانات المطلوبة' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let total = 0;
    const validatedItems = [];
    for (const it of items) {
      const prodResult = await client.query('SELECT * FROM products WHERE id=$1 FOR UPDATE', [it.id]);
      const p = prodResult.rows[0];
      if (!p) throw new Error('منتج غير موجود');
      if (p.stock < it.qty) throw new Error(`الكمية المتاحة من "${p.name}" غير كافية`);
      total += Number(p.price) * it.qty;
      validatedItems.push({ name: p.name, qty: it.qty, price: p.price });
      await client.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [it.qty, it.id]);
    }
    const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
    const orderResult = await client.query(
      'INSERT INTO orders (order_number, customer_name, phone, address, payment_method, total) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [orderNumber, name, phone, address, pay, total]
    );
    const order = orderResult.rows[0];
    for (const it of validatedItems) {
      await client.query('INSERT INTO order_items (order_id, product_name, qty, price) VALUES ($1,$2,$3,$4)', [order.id, it.name, it.qty, it.price]);
    }
    await client.query('COMMIT');
    order.items = validatedItems;
    res.json(order);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: e.message || 'حصل خطأ أثناء تنفيذ الطلب' });
  } finally {
    client.release();
  }
});

router.put('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ['قيد المراجعة', 'مؤكد', 'جاري التوصيل', 'تم التوصيل', 'ملغي'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صحيحة' });
  const result = await pool.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'الطلب غير موجود' });
  res.json(result.rows[0]);
});

module.exports = router;
