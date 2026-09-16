const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
  res.json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, price, category, stock, description, image } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: 'اسم المنتج والسعر مطلوبين' });
  const result = await pool.query(
    'INSERT INTO products (name, price, category, stock, description, image) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, price, category || 'عام', stock || 0, description || '', image || '']
  );
  res.json(result.rows[0]);
});

router.put('/:id', requireAuth, async (req, res) => {
  const b = req.body || {};
  const nn = v => (v === undefined ? null : v);
  const result = await pool.query(
    `UPDATE products SET
      name=COALESCE($1,name), price=COALESCE($2,price), category=COALESCE($3,category),
      stock=COALESCE($4,stock), description=COALESCE($5,description), image=COALESCE($6,image)
     WHERE id=$7 RETURNING *`,
    [nn(b.name), nn(b.price), nn(b.category), nn(b.stock), nn(b.description), nn(b.image), req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(result.rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
