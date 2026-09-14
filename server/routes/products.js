const express = require('express');
const { v4: uuid } = require('uuid');
const { readDB, writeDB } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/products?category=&minPrice=&maxPrice=&size=&search=&active=
router.get('/', (req, res) => {
  const db = readDB();
  let items = db.products;
  const { category, minPrice, maxPrice, size, search, active } = req.query;

  if (active !== 'all') {
    items = items.filter(p => p.active !== false);
  }
  if (category) items = items.filter(p => p.categoryId === category);
  if (minPrice) items = items.filter(p => (p.discountPrice || p.price) >= Number(minPrice));
  if (maxPrice) items = items.filter(p => (p.discountPrice || p.price) <= Number(maxPrice));
  if (size) items = items.filter(p => (p.sizes || []).includes(size));
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }
  res.json(items);
});

router.get('/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
  res.json(product);
});

router.post('/', auth(true), adminOnly, (req, res) => {
  const { name, description, price, discountPrice, categoryId, images, sizes, colors, stock } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'اسم المنتج والسعر مطلوبان' });
  const db = readDB();
  const product = {
    id: uuid(),
    name,
    description: description || '',
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : null,
    categoryId: categoryId || null,
    images: images || [],
    sizes: sizes || [],
    colors: colors || [],
    stock: stock !== undefined ? Number(stock) : 100,
    active: true,
    createdAt: new Date().toISOString()
  };
  db.products.push(product);
  writeDB(db);
  res.json(product);
});

router.put('/:id', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
  const fields = ['name', 'description', 'price', 'discountPrice', 'categoryId', 'images', 'sizes', 'colors', 'stock', 'active'];
  fields.forEach(f => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  writeDB(db);
  res.json(product);
});

router.delete('/:id', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const before = db.products.length;
  db.products = db.products.filter(p => p.id !== req.params.id);
  if (db.products.length === before) return res.status(404).json({ error: 'المنتج غير موجود' });
  writeDB(db);
  res.json({ message: 'تم حذف المنتج' });
});

module.exports = router;
