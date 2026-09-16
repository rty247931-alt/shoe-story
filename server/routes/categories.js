const express = require('express');
const { v4: uuid } = require('uuid');
const { readDB, writeDB } = require('../db');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.categories.sort((a, b) => a.order - b.order));
});

router.post('/', auth(true), adminOnly, (req, res) => {
  const { name, image } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم القسم مطلوب' });
  const db = readDB();
  const cat = { id: uuid(), name, image: image || '', order: db.categories.length + 1 };
  db.categories.push(cat);
  writeDB(db);
  res.json(cat);
});

router.put('/:id', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'القسم غير موجود' });
  const { name, image, order } = req.body;
  if (name !== undefined) cat.name = name;
  if (image !== undefined) cat.image = image;
  if (order !== undefined) cat.order = order;
  writeDB(db);
  res.json(cat);
});

router.delete('/:id', auth(true), adminOnly, (req, res) => {
  const db = readDB();
  const before = db.categories.length;
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  if (db.categories.length === before) return res.status(404).json({ error: 'القسم غير موجود' });
  writeDB(db);
  res.json({ message: 'تم حذف القسم' });
});

module.exports = router;
