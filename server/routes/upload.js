const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { auth, adminOnly } = require('../middleware/auth');
const { STORAGE_DIR } = require('../db');

const router = express.Router();

const uploadDir = path.join(STORAGE_DIR, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, uuid() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('الملف يجب أن يكون صورة'));
  }
});

router.post('/', auth(true), adminOnly, upload.array('images', 8), (req, res) => {
  const files = (req.files || []).map(f => `/uploads/${f.filename}`);
  res.json({ urls: files });
});

module.exports = router;
